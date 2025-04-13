const { DateTime } = require("luxon");
const pool = require("../db");
const axios = require("axios");

const TEAMUP_API_KEY =
  "6e7a01a4e897d2fc1c01bda4e92a8f157ee217106ac00403e885bcb9cadab8e9";
const CALENDAR_ID = "ksuq3b94y1988vohtb";

// 🔹 Salva eventi Teamup nel database basandosi su start_date
const saveTeamupEvents = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Date di inizio e fine richieste" });
    }

    // 🔹 Chiamata API Teamup per gli eventi
    const response = await axios.get(
      `https://api.teamup.com/${CALENDAR_ID}/events`,
      {
        headers: { "Teamup-Token": TEAMUP_API_KEY },
        params: { startDate, endDate },
      }
    );

    const events = response.data.events.map((event) => ({
      event_id: event.id,
      title: event.title || "",
      who: event.who || "",
      location: event.location || "",
      start_dt: event.start_dt,
      end_dt: event.end_dt,
      all_day: event.all_day ? 1 : 0,
      notes: event.notes || "",
      custom_telefono: event.custom?.telefono || "",
      subcalendar_ids: JSON.stringify(event.subcalendar_ids || []),
      version: event.version || null,
    }));

    // 🔹 Salviamo eventi nel database
    for (const event of events) {
      await pool.query(
        `INSERT INTO teamup_events 
            (event_id, title, who, location, start_dt, end_dt, all_day, notes, custom_telefono, subcalendar_ids, version) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            title = VALUES(title), who = VALUES(who), location = VALUES(location), 
            start_dt = VALUES(start_dt), end_dt = VALUES(end_dt), 
            all_day = VALUES(all_day), notes = VALUES(notes), 
            custom_telefono = VALUES(custom_telefono), subcalendar_ids = VALUES(subcalendar_ids), 
            version = VALUES(version)`,
        [
          event.event_id,
          event.title,
          event.who,
          event.location,
          event.start_dt,
          event.end_dt,
          event.all_day,
          event.notes,
          event.custom_telefono,
          event.subcalendar_ids,
          event.version,
        ]
      );
    }

    res.json({
      message: `Salvati ${events.length} eventi tra ${startDate} e ${endDate}!`,
    });
  } catch (error) {
    console.error("[DEBUG] Errore nel salvataggio eventi:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Recupera eventi salvati in un periodo basandosi su start_date
const getSavedEventsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Date di inizio e fine richieste" });
    }

    // Filtriamo gli eventi in base a start_dt (includendo solo la data senza l'ora)
    const [rows] = await pool.query(
      "SELECT * FROM teamup_events WHERE DATE(start_dt) BETWEEN ? AND ?",
      [startDate, endDate]
    );

    res.json(rows);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero eventi:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

const restoreEventNotes = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Recuperiamo i dati dal database
    const [rows] = await pool.query(
      "SELECT event_id, title, who, location, start_dt, end_dt, all_day, notes, custom_telefono, subcalendar_ids, version FROM teamup_events WHERE event_id = ?",
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Evento non trovato nel database" });
    }

    const eventData = rows[0];
    const startDate = new Date(eventData.start_dt);
    const endDate = new Date(eventData.end_dt);
    const formattedStartDt = DateTime.fromISO(eventData.start_dt, {
      zone: "Europe/Rome",
    }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

    const formattedEndDt = DateTime.fromISO(eventData.end_dt, {
      zone: "Europe/Rome",
    }).toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

    if (!formattedStartDt || !formattedEndDt) {
      console.error(
        `[ERROR] Evento ${eventId} non ha start_dt o end_dt validi!`,
        eventData
      );
      return res
        .status(400)
        .json({ error: "Errore: start_dt o end_dt mancanti nel database" });
    }

    // Gestione subcalendar_id (Teamup accetta subcalendar_id singolo!)
    let subcalendarId;
    try {
      const subcalendarArray = JSON.parse(eventData.subcalendar_ids);
      subcalendarId =
        Array.isArray(subcalendarArray) && subcalendarArray.length > 0
          ? subcalendarArray[0] // Teamup usa un solo subcalendar_id, quindi prendiamo il primo
          : null;
    } catch (e) {
      console.warn(
        `[WARN] subcalendar_ids in formato errato per evento ${eventId}: ${eventData.subcalendar_ids}`
      );
      subcalendarId = null;
    }

    // Costruiamo il payload corretto
    const updatedEvent = {
      id: eventData.event_id,
      subcalendar_id: subcalendarId, 
      start_dt: formattedStartDt,
      end_dt: formattedEndDt,
      title: eventData.title,
      who: eventData.who || "",
      location: eventData.location || "",
      all_day: !!eventData.all_day,
      notes: eventData.notes || "",
      version: eventData.version || undefined,
      custom: {
        telefono: eventData.custom_telefono || "",
        dettagli: eventData.notes || "",
      },
    };

    // Facciamo la richiesta a Teamup
    const response = await axios.put(
      `https://api.teamup.com/${CALENDAR_ID}/events/${eventId}`,
      updatedEvent,
      {
        headers: {
          "Teamup-Token": TEAMUP_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      `[DEBUG] Evento ripristinato con ID: ${response.data.event.id}`
    );

    res.json({ message: `Evento ${eventId} aggiornato con successo!` });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nel ripristino evento:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Errore nel ripristino dell'evento" });
  }
};

module.exports = {
  saveTeamupEvents,
  restoreEventNotes,
  getSavedEventsByDate,
};
