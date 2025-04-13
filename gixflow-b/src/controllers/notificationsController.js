const pool = require("../db");
const { getNextWorkdayAppointments, getAppointmentsByDate, } = require("../controllers/appointmentsController");
const emailService = require("../utils/emailService");


exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.query(`
      SELECT 
        n.id, 
        n.type, 
        n.send_time, 
        CAST(n.is_enabled AS UNSIGNED) AS is_enabled, 
        u.email, 
        u.telefono, 
        u.cognome, 
        u.nome 
      FROM notifications n
      JOIN users u ON n.user_id = u.id;
    `);

    console.log("[DEBUG] Notifiche inviate al frontend:", notifications);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("[ERROR] Errore nel recupero delle notifiche:", error);
    res.status(500).json({ error: "Errore nel recupero delle notifiche." });
  }
};

exports.createNotification = async (req, res) => {
  try {
    console.log("[DEBUG] Dati ricevuti dal frontend:", req.body); // 👈 Log per debug

    const { user_id, type, send_time, is_enabled } = req.body;

    if (!user_id || !type || !send_time) {
      console.error("[ERROR] Dati mancanti:", { user_id, type, send_time });
      return res.status(400).json({ error: "Dati mancanti." });
    }

    const enabled = is_enabled ? 1 : 0;

    const [result] = await pool.query(
      "INSERT INTO notifications (user_id, type, send_time, is_enabled) VALUES (?, ?, ?, ?)",
      [user_id, type, send_time, enabled]
    );

    console.log("[DEBUG] Notifica creata con ID:", result.insertId); // 👈 Verifica che venga creato un record

    res.status(201).json({ message: "Notifica creata con successo.", id: result.insertId });
  } catch (error) {
    console.error("[ERROR] Errore nella creazione della notifica:", error);
    res.status(500).json({ error: "Errore nella creazione della notifica." });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    console.log("[DEBUG] Dati ricevuti per aggiornamento:", req.body); // Debug

    const { id } = req.params;
    const { is_enabled } = req.body;

    if (typeof is_enabled === "undefined") {
      console.error("[ERROR] Dati mancanti:", { id, is_enabled });
      return res.status(400).json({ error: "Dati mancanti." });
    }

    const enabled = is_enabled ? 1 : 0;

    const [existing] = await pool.query("SELECT id FROM notifications WHERE id = ?", [id]);

    if (existing.length === 0) {
      console.error("[ERROR] Notifica non trovata con ID:", id);
      return res.status(404).json({ error: "Notifica non trovata." });
    }

    await pool.query("UPDATE notifications SET is_enabled = ? WHERE id = ?", [enabled, id]);

    console.log("[DEBUG] Notifica aggiornata con successo. ID:", id, "Stato:", enabled);

    res.status(200).json({ message: "Notifica aggiornata con successo." });
  } catch (error) {
    console.error("[ERROR] Errore nell'aggiornamento della notifica:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento della notifica." });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT id FROM notifications WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Notifica non trovata." });
    }

    await pool.query("DELETE FROM notifications WHERE id = ?", [id]);
    res.status(200).json({ message: "Notifica eliminata con successo." });
  } catch (error) {
    console.error("[ERROR] Errore nell'eliminazione della notifica:", error);
    res.status(500).json({ error: "Errore nell'eliminazione della notifica." });
  }
};

exports.sendAgendaNow = async (req, res) => {
  try {
    const { agent_id, date } = req.body;

    // Recupera i dati dell'agente
    const [agent] = await pool.query(
      "SELECT nome, cognome, email FROM users WHERE id = ?",
      [agent_id]
    );

    if (!agent.length || !agent[0].email) {
      return res.status(400).json({ error: "Email agente non trovata." });
    }

    const agentEmail = agent[0].email.trim();
    const agentFullName = `${agent[0].cognome} ${agent[0].nome}`.trim(); // Nome completo

    console.log(`[DEBUG] Email dell'agente: ${agentEmail}`);

    // Recupera gli appuntamenti per la data specificata
    const appointments = await getAppointmentsByDate(agent_id, date);

    if (appointments.length === 0) {
      return res
        .status(200)
        .json({ message: "Nessun appuntamento da inviare." });
    }

    // 🔹 Formatto la data in "gg/mm/aaaa"
    const formattedDate = new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    let message = `<b>${agentFullName}</b><br>`;
    message += `<b>${formattedDate}</b><br>`; // Data in grassetto e spazio vuoto
    message += `<hr style="border: none; border-top: 1px dashed #aaa; margin: 20px 0;">`;

    appointments.forEach((appt) => {
      // Formatto l'orario in "HH:mm"
      const startTime = new Date(appt.date_start).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = new Date(appt.date_end).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });

      message += `<b>${startTime} - ${endTime}</b> <br><b>${appt.client_name} ${
        appt.client_forma_giuridica || ""
      }</b><br><br>`;
      message += `<b>Indirizzo:</b><br> ${appt.client_address}, ${appt.client_city} (${appt.client_province}) - ${appt.client_cap}<br><br>`;
      message += `<b>Telefono:</b> ${appt.client_phone}<br>`;

      if (appt.client_email) {
        message += `<b>E-Mail:</b> ${appt.client_email}<br>`;
      }

      message += `<br>`; // Spazio vuoto
      if (appt.notes && appt.notes.trim() !== "") {
        message += `<b>Note:</b><br> ${appt.notes}<br>`;
      }

      message += `<hr style="border: none; border-top: 1px dashed #aaa; margin: 20px 0;">`;
    });

    // Aggiungo il footer con il messaggio automatico
    message += `<small>Email inviata automaticamente da <b>GixFlow</b> da una casella non presidiata, non rispondere a questo messaggio.</small>`;

    // Invia email
    const emailResponse = await emailService.sendEmail({
      to: agentEmail,
      subject: `📅 Agenda del ${formattedDate} per ${agentFullName}`,
      text: message, // Testo email
      html: message, // Versione HTML
    });

    if (emailResponse.success) {
      res.status(200).json({ message: `Agenda inviata a ${agentEmail}` });
    } else {
      res.status(500).json({ error: emailResponse.error });
    }
  } catch (error) {
    console.error("[ERROR] Errore nell'invio manuale dell'agenda:", error);
    res.status(500).json({ error: "Errore nell'invio dell'agenda." });
  }
};

exports.sendNextWorkdayAgenda = async () => {
  try {
    console.log("[DEBUG] Inizio invio agende schedulate...");

    // Recupera gli agenti con notifiche attive
    const query = `
        SELECT n.user_id, u.email, n.send_time
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.is_enabled = 1
      `;

    const [agents] = await pool.query(query);

    if (agents.length === 0) {
      console.log("[INFO] Nessun agente ha notifiche attive.");
      return;
    }

    for (const agent of agents) {
      console.log(`[DEBUG] Elaboro agenda per agente: ${agent.user_id} - ${agent.email}`);

      if (!agent.email || agent.email.trim() === "") {
        console.error("[ERROR] Indirizzo email non valido o assente per user_id:", agent.user_id);
        continue; // Passa all'agente successivo senza interrompere l'intero processo
      }

      // Recuperiamo gli appuntamenti per il prossimo giorno lavorativo
      const appointments = await getNextWorkdayAppointments(agent.user_id);

      if (appointments.length === 0) {
        console.log(`[INFO] Nessun appuntamento per agente ${agent.user_id}, nessuna email inviata.`);
        continue;
      }

      // Formatto la data in "gg/mm/aaaa"
      const nextWorkday = new Date();
      nextWorkday.setDate(nextWorkday.getDate() + 1);
      const formattedDate = nextWorkday.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      let message = `<b>Agenda per il prossimo giorno lavorativo</b><br>`;
      message += `<b>${formattedDate}</b><br>`;
      message += `<hr style="border: none; border-top: 1px dashed #aaa; margin: 20px 0;">`;

      appointments.forEach((appt) => {
        // Formatto l'orario in "HH:mm"
        const startTime = new Date(appt.date_start).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = new Date(appt.date_end).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });
  
        message += `<b>${startTime} - ${endTime}</b> <br><b>${appt.client_name} ${
          appt.client_forma_giuridica || ""
        }</b><br><br>`;
        message += `<b>Indirizzo:</b><br> ${appt.client_address}, ${appt.client_city} (${appt.client_province}) - ${appt.client_cap}<br><br>`;
        message += `<b>Telefono:</b> ${appt.client_phone}<br>`;
  
        if (appt.client_email) {
          message += `<b>E-Mail:</b> ${appt.client_email}<br>`;
        }
  
        message += `<br>`; // Spazio vuoto
        if (appt.notes && appt.notes.trim() !== "") {
          message += `<b>Note:</b><br> ${appt.notes}<br>`;
        }
  
        message += `<hr style="border: none; border-top: 1px dashed #aaa; margin: 20px 0;">`;
      });

      // Aggiungo il footer con il messaggio automatico
      message += `<small>Email inviata automaticamente da <b>GixFlow</b> da una casella non presidiata, non rispondere a questo messaggio.</small>`;

      // Invio email
      console.log(`[DEBUG] Invio email a: ${agent.email}`);
      const emailResponse = await emailService.sendEmail({
        to: agent.email.trim(),
        subject: `📅 Agenda per il ${formattedDate}`,
        text: message,
        html: message,
      });

      if (emailResponse.success) {
        console.log(`[INFO] Email inviata con successo a ${agent.email}`);
      } else {
        console.error("[ERROR] Errore nell'invio email a", agent.email, "Errore:", emailResponse.error);
      }
    }
  } catch (error) {
    console.error("[ERROR] Errore nell'invio delle notifiche schedulate:", error);
  }
};

/* exports.sendNotification = async (notification) => {
  try {
    switch (notification.type) {
      case "email":
        await emailService.sendEmail({
          to: notification.email,
          subject: "📅 Notifica programmata",
          text: "Questa è una notifica automatica programmata.",
          html: "<p>Questa è una notifica automatica programmata.</p>",
        });
        break;
      case "sms":
        console.log(`[INFO] Simulazione invio SMS a ${notification.telefono}`);
        break;
      case "whatsapp":
        console.log(`[INFO] Simulazione invio WhatsApp a ${notification.telefono}`);
        break;
      default:
        console.warn(`[WARNING] Tipo di notifica sconosciuto: ${notification.type}`);
    }
  } catch (error) {
    console.error(`[ERROR] Errore nell'invio della notifica ID: ${notification.id}`, error);
  }
}; */
