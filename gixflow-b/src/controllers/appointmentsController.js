const Appointment = require("../models/Appointment");
const Client = require("../models/Client");
const { Parser } = require("json2csv");
const moment = require("moment-timezone");
const pool = require("../db");

exports.getDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

exports.createAppointment = async (req, res) => {
  try {
    const data = req.body;

    // Verifica se il cliente esiste già
    let clientId = data.client_id; // Se viene già passato
    if (!clientId) {
      const existingClient = await Client.findClientByUniqueField(
        data.client_phone // Usa il telefono o un campo univoco
      );

      if (existingClient) {
        clientId = existingClient.id; // Usa l'id del cliente esistente
      } else {
        // Crea un nuovo cliente se non esiste
        const newClientData = {
          ragsoc: data.client_name,
          forma_giuridica_id: data.forma_giuridica_id, // Associa la forma giuridica
          codice_fiscale: data.client_codice_fiscale || null,
          partita_iva: data.client_partita_iva || null,
          telefono: data.client_phone || null,
          email: data.client_email || null,
          indirizzo: data.client_address || null,
          city: data.client_city || null,
          provincia: data.client_province || null,
          cap: data.client_cap || null,
          created_by: data.created_by || null,
        };

        const newClient = await Client.createClient(newClientData);
        clientId = newClient.insertId; // Usa l'id del cliente appena creato
      }
    }

    // Prepara i dati per l'appuntamento
    const appointmentData = {
      user_id: data.user_id || null,
      client_id: clientId, // Associa il cliente all'appuntamento
      date_start: data.date_start, // Usa la data così com'è!
  date_end: data.date_end,
      operator_id: data.operator_id,
      agent_id: data.agent_id,
      status_id: data.status_id,
      notes: data.notes || "",
    };

    // Crea l'appuntamento
    const result = await Appointment.createAppointment(appointmentData);

    res
      .status(201)
      .json({ message: "Appuntamento creato con successo", result });
  } catch (error) {
    console.error("Errore durante la creazione dell'appuntamento:", error);
    res
      .status(500)
      .json({ error: "Errore durante la creazione dell'appuntamento" });
  }
}; 

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.getAllAppointmentsWithClients();
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Errore nel recupero degli appuntamenti:", error);
    res.status(500).json({ error: "Errore nel recupero degli appuntamenti" });
  }
};

exports.getAppointmentsWithDetails = async (req, res) => {
  try {
    const appointments = await Appointment.getAppointmentsWithClients();
    res.status(200).json(appointments);
  } catch (error) {
    console.error(
      "Errore nel recupero degli appuntamenti con dettagli:",
      error
    );
    res.status(500).json({ error: "Errore interno del server" });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; 

     const formattedUpdates = {
      date_start: updates.date_start 
        ? moment.utc(updates.date_start).format("YYYY-MM-DD HH:mm:ss")
        : null,
      date_end: updates.date_end 
        ? moment.utc(updates.date_end).format("YYYY-MM-DD HH:mm:ss")
        : null,
      notes: updates.notes || "",
      agent_id: updates.agent_id || null,
      operator_id: updates.operator_id || null,
      status_id: updates.status_id || null,
    };  
    

    const result = await Appointment.updateAppointment(id, formattedUpdates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appuntamento non trovato" });
    }

    res.status(200).json({ message: "Appuntamento aggiornato con successo", result });
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento:", error);
    res.status(500).json({ error: "Errore durante l'aggiornamento." });
  }
};

exports.updateAppointmentClickFC = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; 

    const formattedUpdates = {
      date_start: updates.date_start || null, // 🚫 niente moment
      date_end: updates.date_end || null,
      notes: updates.notes || "",
      agent_id: updates.agent_id || null,
      operator_id: updates.operator_id || null,
      status_id: updates.status_id || null,
    };
    
    

    const result = await Appointment.updateAppointmentClickFC(id, formattedUpdates);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appuntamento non trovato" });
    }

    res.status(200).json({ message: "Appuntamento aggiornato con successo", result });
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento:", error);
    res.status(500).json({ error: "Errore durante l'aggiornamento." });
  }
};

exports.updateAppointmentDrop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Assicuriamoci che sia definito subito

    const formattedUpdates = {
      date_start: updates.date_start,
      date_end: updates.date_end,
      notes: updates.notes || "",
      agent_id: updates.agent_id || null,
      operator_id: updates.operator_id || null,
      status_id: updates.status_id || null,
    };

    const result = await Appointment.updateAppointmentDrop(
      id,
      formattedUpdates
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appuntamento non trovato" });
    }

    res
      .status(200)
      .json({ message: "Appuntamento aggiornato con successo", result });
  } catch (error) {
    console.error("❌ Errore nell'aggiornamento:", error);
    res.status(500).json({ error: "Errore durante l'aggiornamento." });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Appointment.deleteAppointment(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appuntamento non trovato" });
    }

    res.status(200).json({ message: "Appuntamento eliminato con successo" });
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'appuntamento:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'eliminazione dell'appuntamento" });
  }
};

exports.exportAppointmentsCSV = async (req, res) => {
  try {
    const appointments = await Appointment.getAllAppointmentsWithClients();

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "Nessun appuntamento trovato" });
    }

    const fields = [
      "id",
      "date_start",
      "date_end",
      "operator_name",
      "agent_name",
      "client_name",
      "client_forma_giuridica",
      "client_phone",
      "client_address",
      "client_city",
      "client_province",
      "client_cap",
      "status",
      "notes",
    ];

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(appointments);

    res.header("Content-Type", "text/csv");
    res.attachment("appuntamenti.csv");
    return res.send(csv);
  } catch (error) {
    console.error("Errore durante l'export CSV:", error);
    return res.status(500).json({ message: "Errore interno al server" });
  }
};

exports.getAppointmentStatuses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM appointment_status ORDER BY name ASC"
    );
    res.status(200).json(rows); // Restituisce gli stati come JSON
  } catch (error) {
    console.error("Errore durante il recupero degli stati:", error);
    res.status(500).json({ error: "Errore durante il recupero degli stati." });
  }
};

exports.getAppointmentsByDate = async (agent_id, date) => {
  try {
    const query = `
      SELECT 
        a.id, 
        a.date_start, 
        a.date_end, 
        a.notes, 
        c.ragsoc AS client_name, 
        lf.name AS client_forma_giuridica, 
        c.telefono AS client_phone, 
        c.email AS client_email, 
        c.indirizzo AS client_address, 
        c.city AS client_city, 
        c.provincia AS client_province, 
        c.cap AS client_cap
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      LEFT JOIN legal_forms lf ON c.forma_giuridica_id = lf.id
      WHERE a.agent_id = ? 
      AND DATE(a.date_start) = ?
      AND a.status_id = 9
    `;

    const [appointments] = await pool.query(query, [agent_id, date]);

    return appointments;
  } catch (error) {
    console.error(
      "[ERROR] Errore nel recupero degli appuntamenti per data:",
      error
    );
    return [];
  }
};

exports.getNextWorkdayAppointments = async (agent_id) => {
  try {
    // Calcola il giorno lavorativo successivo
    let nextWorkday = new Date();
    const today = nextWorkday.getDay();

    if (today === 5) {
      nextWorkday.setDate(nextWorkday.getDate() + 3);
    } else if (today === 6) {
      nextWorkday.setDate(nextWorkday.getDate() + 2);
    } else {
      nextWorkday.setDate(nextWorkday.getDate() + 1);
    }

    const nextWorkdayFormatted = nextWorkday.toISOString().split("T")[0];

    // Query con JOIN per ottenere dettagli cliente e appuntamento
    const query = `
      SELECT 
        a.id, 
        a.date_start, 
        a.date_end, 
        a.notes, 
        c.ragsoc AS client_name, 
        lf.name AS client_forma_giuridica, 
        c.telefono AS client_phone, 
        c.email AS client_email, 
        c.indirizzo AS client_address, 
        c.city AS client_city, 
        c.provincia AS client_province, 
        c.cap AS client_cap
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      LEFT JOIN legal_forms lf ON c.forma_giuridica_id = lf.id 
      WHERE a.agent_id = ? 
      AND DATE(a.date_start) = ?
      AND a.status_id = 9
    `;

    const [appointments] = await pool.query(query, [
      agent_id,
      nextWorkdayFormatted,
    ]);

    return appointments;
  } catch (error) {
    console.error("[ERROR] Errore nel recupero degli appuntamenti:", error);
    return [];
  }
};

