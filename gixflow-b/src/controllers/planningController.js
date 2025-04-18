const pool = require("../db");
const moment = require("moment");

// 🔹 GET - Tutte le pianificazioni
exports.getAllPlannings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ap.id, ap.agent_id, u.nome, u.cognome, ap.plan_date, ap.zone, ap.notes
       FROM agents_planning ap
       JOIN users u ON ap.agent_id = u.id
       WHERE u.role_id = 2 AND u.is_active = 'si'
       ORDER BY ap.plan_date DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Errore nel recupero delle pianificazioni:", error);
    res.status(500).json({ error: "Errore nel recupero delle pianificazioni" });
  }
};

// 🔹 POST - Crea nuova pianificazione
exports.createPlanning = async (req, res) => {
  try {
    const { agent_id, plan_date, zone, notes } = req.body;

    if (!agent_id || !plan_date || !zone) {
      return res.status(400).json({ error: "Campi obbligatori mancanti." });
    }

    const [result] = await pool.query(
      `INSERT INTO agents_planning (agent_id, plan_date, zone, notes)
       VALUES (?, ?, ?, ?)`,
      [agent_id, plan_date, zone, notes || null]
    );

    res.status(201).json({ message: "Pianificazione creata con successo", id: result.insertId });
  } catch (error) {
    console.error("❌ Errore durante la creazione della pianificazione:", error);
    res.status(500).json({ error: "Errore durante la creazione" });
  }
};

// 🔹 PUT - Aggiorna pianificazione
exports.updatePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_date, zone, notes } = req.body;

    const [result] = await pool.query(
      `UPDATE agents_planning 
       SET plan_date = ?, zone = ?, notes = ? 
       WHERE id = ?`,
      [plan_date, zone, notes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pianificazione non trovata" });
    }

    res.status(200).json({ message: "Pianificazione aggiornata con successo" });
  } catch (error) {
    console.error("❌ Errore aggiornamento pianificazione:", error);
    res.status(500).json({ error: "Errore durante l'aggiornamento" });
  }
};

// 🔹 DELETE - Elimina pianificazione
exports.deletePlanning = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`DELETE FROM agents_planning WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pianificazione non trovata" });
    }

    res.status(200).json({ message: "Pianificazione eliminata con successo" });
  } catch (error) {
    console.error("❌ Errore eliminazione pianificazione:", error);
    res.status(500).json({ error: "Errore durante l'eliminazione" });
  }
};

// 🔹 GET - Pianificazioni formattate per FullCalendar
 exports.getPlanningsForCalendar = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ap.id, ap.agent_id, ap.plan_date, ap.zone, ap.notes, u.nome, u.cognome
       FROM agents_planning ap
       JOIN users u ON ap.agent_id = u.id
       WHERE u.role_id = 2 AND u.is_active = 'si'`
    );

     const events = rows.map((row) => ({
      id: `planning-${row.id}`,
      title: `${row.zone}`,
      start: row.plan_date, // Usa direttamente il valore dal database
      allDay: true,
      resourceId: row.agent_id,
      color: "#007bff",
      extendedProps: {
        notes: row.notes || "",
        isPlanning: true,
        agent_name: `${row.cognome || ""} ${row.nome || ""}`.trim(),
      },
    })); 

    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Errore nel recupero planning per calendario:", error);
    res.status(500).json({ error: "Errore interno durante il fetch eventi calendario" });
  }
};


