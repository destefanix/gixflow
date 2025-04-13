const axios = require("axios");
const OperatorTimelog = require("../models/OperatorTimelog");
const AstConfig = require("../models/AstConfig");
const pool = require("../db"); // Usiamo il pool per fare query dirette
const dayjs = require("dayjs"); // Se non ce l'hai già

/* exports.fetchAndStoreTimelogs = async (req, res) => {
  try {
    console.log("[DEBUG] Ricevuta richiesta API:", req.body);
    const { query_date } = req.body;

    if (!query_date) {
      return res.status(400).json({ message: "Data richiesta mancante" });
    }

    // 🔍 Recuperiamo configurazione Vicidial
    const [configRows] = await pool.query(`
          SELECT key_name, value FROM ast_config 
          WHERE key_name IN ('vicidial_url', 'vicidial_user', 'vicidial_pass', 'vicidial_campaigns', 'vicidial_user_group')
        `);

    const config = Object.fromEntries(
      configRows.map((row) => [row.key_name, row.value])
    );

    // Fixiamo i valori nulli
    const vicidial_url = config.vicidial_url?.trim().replace(/\/$/, ""); // Rimuove slash finale
    const vicidial_user = config.vicidial_user?.trim();
    const vicidial_pass = config.vicidial_pass?.trim();
    const vicidial_campaigns = config.vicidial_campaigns
      ? config.vicidial_campaigns.trim()
      : "--ALL--";
    const vicidial_user_group = config.vicidial_user_group
      ? config.vicidial_user_group.trim()
      : "--ALL--";

    if (!vicidial_url || !vicidial_user || !vicidial_pass) {
      return res
        .status(400)
        .json({ message: "Configurazione Vicidial non trovata" });
    }

    try {
      console.log("[DEBUG] Inizio chiamata a Vicidial...");
      console.log(
        "[DEBUG] Endpoint chiamato:",
        `${vicidial_url}/vicidial/AST_agent_time_detail.php`
      );
      console.log("[DEBUG] Parametri della richiesta:", {
        query_date,
        end_date: query_date,
        group: vicidial_campaigns.split(","),
        user_group: vicidial_user_group.split(","),
      });

      // 🔥 Ora facciamo la chiamata a Vicidial
      const response = await axios.get(
        `${vicidial_url}/vicidial/AST_agent_time_detail.php`,
        {
          auth: { username: vicidial_user, password: vicidial_pass },
          params: {
            DB: "",
            query_date,
            end_date: query_date,
            group: vicidial_campaigns.split(","),
            user_group: vicidial_user_group.split(","),
            shift: "ALL",
            time_in_sec: "checked",
            report_display_type: "TEXT",
            file_download: "1",
            SUBMIT: "SUBMIT",
          },
        }
      );

      console.log(
        "[DEBUG] Chiamata a Vicidial completata. Status:",
        response?.status
      );

      if (!response.data || typeof response.data !== "string") {
        console.error("[ERROR] Vicidial ha risposto con un valore non valido.");
        return res
          .status(500)
          .json({ message: "Errore: risposta Vicidial non valida o vuota" });
      }

      console.log(
        "[DEBUG] Contenuto della risposta ricevuta:",
        response.data.substring(0, 500)
      );

      // 📌 Ora possiamo fare lo split in sicurezza
      const rows = response.data.split("\n").slice(2);
      const parsedData = [];

      for (const row of rows) {
        const columns = row.split(",");
        if (columns.length < 7) continue;

        const ast_user = columns[1]?.trim();
        const calls = parseInt(columns[2]) || 0;
        const login = parseInt(columns[4]) || 0;
        const wait = parseInt(columns[5]) || 0;
        const talk = parseInt(columns[7]) || 0;
        const dispo = parseInt(columns[9]) || 0;
        const pause = parseInt(columns[11]) || 0;

        // 🔍 Recuperiamo il nome dell'operatore
        const [userRows] = await pool.query(
          `SELECT id, CONCAT(cognome, ' ', nome) AS full_name FROM users WHERE ast_user = ? LIMIT 1`,
          [ast_user]
        );

        if (userRows.length > 0) {
          parsedData.push({
            user_id: userRows[0].id,  
            operator_name: userRows[0].full_name,
            date: query_date,
            calls,
            login: (login / 3600).toFixed(2),
            wait: (wait / 3600).toFixed(2),
            talk: (talk / 3600).toFixed(2),
            dispo: (dispo / 3600).toFixed(2),
            pause: (pause / 3600).toFixed(2),
          });
        } else {
          console.log(
            `[WARNING] Nessun utente trovato per ast_user: ${ast_user}`
          );
        }
      }

      // 🔥 Restituiamo i dati SENZA salvarli nel database
      return res.json(parsedData);
    } catch (error) {
      console.error("❌ [ERROR] Errore durante la chiamata a Vicidial!");
      console.error("❌ Messaggio:", error.message);

      if (error.response) {
        console.error(
          "❌ [Vicidial Response] Status Code:",
          error.response.status
        );
        console.error("❌ [Vicidial Response] Data:", error.response.data);
      } else if (error.request) {
        console.error("❌ [ERROR] Nessuna risposta ricevuta da Vicidial!");
      } else {
        console.error("❌ [ERROR] Errore sconosciuto:", error);
      }

      return res
        .status(500)
        .json({ message: "Errore nella chiamata a Vicidial" });
    }
  } catch (error) {
    console.error("[ERROR] Errore nel fetchAndStoreTimelogs:", error);
    return res
      .status(500)
      .json({ message: "Errore nel fetchAndStoreTimelogs" });
  }
}; */

exports.fetchAndStoreTimelogs = async (req, res) => {
  try {
    const { start_date, end_date, location_id } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: "Date mancanti" });
    }

    // 1. Carica config Vicidial
    const [configRows] = await pool.query(`
      SELECT key_name, value FROM ast_config 
      WHERE key_name IN ('vicidial_url', 'vicidial_user', 'vicidial_pass', 'vicidial_campaigns', 'vicidial_user_group')
    `);

    const config = Object.fromEntries(
      configRows.map((row) => [row.key_name, row.value])
    );

    const vicidial_url = config.vicidial_url?.trim().replace(/\/$/, "");
    const vicidial_user = config.vicidial_user?.trim();
    const vicidial_pass = config.vicidial_pass?.trim();
    const vicidial_campaigns = config.vicidial_campaigns?.trim() || "--ALL--";
    const vicidial_user_group = config.vicidial_user_group?.trim() || "--ALL--";

    if (!vicidial_url || !vicidial_user || !vicidial_pass) {
      return res
        .status(400)
        .json({ message: "Configurazione Vicidial non valida" });
    }

    const allParsedData = [];

    let date = dayjs(start_date);
    const lastDate = dayjs(end_date);

    while (date.isBefore(lastDate.add(1, "day"))) {
      const query_date = date.format("YYYY-MM-DD");

      console.log(`[DEBUG] Generazione per data: ${query_date}`);

      const response = await axios.get(
        `${vicidial_url}/vicidial/AST_agent_time_detail.php`,
        {
          auth: { username: vicidial_user, password: vicidial_pass },
          params: {
            DB: "",
            query_date,
            end_date: query_date,
            group: vicidial_campaigns.split(","),
            user_group: vicidial_user_group.split(","),
            shift: "ALL",
            time_in_sec: "checked",
            report_display_type: "TEXT",
            file_download: "1",
            SUBMIT: "SUBMIT",
          },
        }
      );

      if (response.data && typeof response.data === "string") {
        const rows = response.data.split("\n").slice(2);
        for (const row of rows) {
          const columns = row.split(",");
          if (columns.length < 7) continue;

          const ast_user = columns[1]?.trim();
          const calls = parseInt(columns[2]) || 0;
          const login = parseInt(columns[4]) || 0;
          const wait = parseInt(columns[5]) || 0;
          const talk = parseInt(columns[7]) || 0;
          const dispo = parseInt(columns[9]) || 0;
          const pause = parseInt(columns[11]) || 0;

          const [userRows] = await pool.query(
            `SELECT id, CONCAT(cognome, ' ', nome) AS full_name, location_id FROM users WHERE ast_user = ? LIMIT 1`,
            [ast_user]
          );

          if (userRows.length > 0) {
            const user = userRows[0];
          
            // Se il filtro per location è presente, ignoriamo chi non la matcha
            if (location_id && Number(user.location_id) !== Number(location_id)) {
              continue;
            }
          
            allParsedData.push({
              user_id: user.id,
              operator_name: user.full_name,
              date: query_date,
              calls,
              login: (login / 3600).toFixed(2),
              wait: (wait / 3600).toFixed(2),
              talk: (talk / 3600).toFixed(2),
              dispo: (dispo / 3600).toFixed(2),
              pause: (pause / 3600).toFixed(2),
            });
            
          }
        }
      }

      date = date.add(1, "day");
    }

    return res.json(allParsedData);
  } catch (error) {
    console.error("[ERROR] fetchAndStoreTimelogs:", error);
    return res
      .status(500)
      .json({ message: "Errore nella generazione timelog" });
  }
};

exports.resetTimelogs = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Data richiesta mancante" });
    }

    const [result] = await pool.query(
      `DELETE FROM operators_timelog WHERE date = ?`,
      [date]
    );

    return res.json({
      message: `Eliminati ${result.affectedRows} record per il ${date}`,
    });
  } catch (error) {
    console.error("[ERROR] Errore nel reset dei timelog:", error);
    return res.status(500).json({ message: "Errore nel reset dei timelog" });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const config = await AstConfig.getAll();
    res.json(config);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Errore nel recupero delle configurazioni" });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { key_name, value } = req.body;

    await AstConfig.saveOrUpdate(key_name, value);

    res.json({ message: "Configurazione aggiornata con successo!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Errore nell'aggiornamento della configurazione" });
  }
};

/* exports.saveHours = async (req, res) => {
  try {
    const { date, hours } = req.body;

    if (!date || !hours || hours.length === 0) {
      return res.status(400).json({ message: "Dati non validi" });
    }

    for (const h of hours) {
      await OperatorTimelog.create({
        user_id: h.user_id,
        date,
        calls: h.calls,
        login: h.login,
        wait: h.wait,
        talk: h.talk,
        dispo: h.dispo,
        pause: h.pause,
      });
    }

    res.json({ message: "Ore salvate con successo!" });
  } catch (error) {
    console.error("Errore nel salvataggio delle ore:", error);
    res.status(500).json({ message: "Errore nel salvataggio delle ore" });
  }
}; */

exports.saveHours = async (req, res) => {
  try {
    const { hours } = req.body;

    if (!hours || hours.length === 0) {
      return res.status(400).json({ message: "Dati non validi" });
    }

    // Raggruppa per data
    const groupedByDate = {};
    hours.forEach((h) => {
      if (!groupedByDate[h.date]) groupedByDate[h.date] = [];
      groupedByDate[h.date].push(h);
    });

    const inserted = [];
    const skipped = [];

    for (const [date, entries] of Object.entries(groupedByDate)) {
      const userIds = entries.map((h) => h.user_id);

      // ⚠️ Skip se non ci sono utenti validi
      if (userIds.length === 0) {
        continue;
      }

      const placeholders = userIds.map(() => "?").join(",");
      // 👇 solo se ci sono ID validi
      let existingLogs = [];
      if (userIds.length > 0) {
        [existingLogs] = await pool.query(
          `SELECT user_id FROM operators_timelog WHERE date = ? AND user_id IN (${placeholders})`,
          [date, ...userIds]
        );
      }

      const alreadyInsertedUserIds = existingLogs.map((row) => row.user_id);

      const toInsert = entries.filter(
        (h) => !alreadyInsertedUserIds.includes(h.user_id)
      );

      // Inserisce solo quelli nuovi
      for (const h of toInsert) {
        await OperatorTimelog.create({
          user_id: h.user_id,
          date: h.date,
          calls: h.calls,
          login: h.login,
          wait: h.wait,
          talk: h.talk,
          dispo: h.dispo,
          pause: h.pause,
        });

        inserted.push({ user_id: h.user_id, date: h.date });
      }

      // Aggiunge gli skippati
      alreadyInsertedUserIds.forEach((uid) =>
        skipped.push({ user_id: uid, date })
      );
    }

    return res.status(201).json({
      message: `${inserted.length} timelog salvati con successo.`,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("❌ Errore nel salvataggio delle ore:", error);
    res.status(500).json({ message: "Errore nel salvataggio delle ore" });
  }
};

/* exports.getTimelogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, startDate, endDate, userId } = req.query;

    // Normalizziamo i parametri
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Date di inizio e fine obbligatorie" });
    }

    // Query per ottenere i timelog con i dati dell'operatore
    const query = `
      SELECT ot.*, u.nome, u.cognome
      FROM operators_timelog ot
      JOIN users u ON ot.user_id = u.id
      WHERE ot.date BETWEEN ? AND ?
      ${userId ? "AND ot.user_id = ?" : ""}
      ORDER BY ot.date DESC
      LIMIT ? OFFSET ?;
    `;

    const params = userId
      ? [startDate, endDate, userId, limit, offset]
      : [startDate, endDate, limit, offset];

    const [rows] = await pool.query(query, params);

    // Query per il conteggio totale dei record
    const countQuery = `
      SELECT COUNT(*) as total FROM operators_timelog
      WHERE date BETWEEN ? AND ? ${userId ? "AND user_id = ?" : ""};
    `;
    const [countRows] = await pool.query(
      countQuery,
      userId ? [startDate, endDate, userId] : [startDate, endDate]
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page,
      totalPages: Math.ceil(countRows[0].total / limit),
    });
  } catch (error) {
    console.error("[ERROR] Errore nel recupero dei timelog:", error);
    res.status(500).json({ message: "Errore nel recupero dei timelog" });
  }
}; */


exports.getTimelogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, startDate, endDate, userId, locationId } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Date di inizio e fine obbligatorie" });
    }

    // 🔍 QUERY PRINCIPALE con JOIN + FILTRI OPZIONALI
    const query = `
      SELECT 
        ot.*, 
        u.nome, 
        u.cognome, 
        ul.location AS location_name
      FROM operators_timelog ot
      JOIN users u ON ot.user_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      WHERE ot.date BETWEEN ? AND ?
      ${userId ? "AND ot.user_id = ?" : ""}
      ${locationId ? "AND u.location_id = ?" : ""}
      ORDER BY ot.date DESC
      LIMIT ? OFFSET ?;
    `;

    const params = [startDate, endDate];
    if (userId) params.push(userId);
    if (locationId) params.push(locationId);
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // 🔢 QUERY CONTEGGIO TOTALE
    const countQuery = `
      SELECT COUNT(*) as total
      FROM operators_timelog ot
      JOIN users u ON ot.user_id = u.id
      WHERE ot.date BETWEEN ? AND ?
      ${userId ? "AND ot.user_id = ?" : ""}
      ${locationId ? "AND u.location_id = ?" : ""}
    `;

    const countParams = [startDate, endDate];
    if (userId) countParams.push(userId);
    if (locationId) countParams.push(locationId);

    const [countRows] = await pool.query(countQuery, countParams);

    res.json({
      data: rows,
      total: countRows[0].total,
      page,
      totalPages: Math.ceil(countRows[0].total / limit),
    });
  } catch (error) {
    console.error("[ERROR] Errore nel recupero dei timelog:", error);
    res.status(500).json({ message: "Errore nel recupero dei timelog" });
  }
};



/* exports.updateTimelog = async (req, res) => {
  try {
    const { id } = req.params;
    const { calls, login, wait, talk, dispo, pause } = req.body;

    const requiredFields = [calls, login, wait, talk, dispo, pause];
    if (requiredFields.some(val => val === undefined || val === null)) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    const query = `
      UPDATE operators_timelog
      SET calls = ?, login = ?, wait = ?, talk = ?, dispo = ?, pause = ?
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [
      calls,
      login,
      wait,
      talk,
      dispo,
      pause,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Timelog non trovato" });
    }

    res.json({ message: "Timelog aggiornato con successo!" });
  } catch (error) {
    console.error("[ERROR] Errore nell'aggiornamento del timelog:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento del timelog" });
  }
}; */

exports.updateTimelog = async (req, res) => {
  try {
    const { id } = req.params;
    const { calls, login, wait, talk, dispo, pause } = req.body;

    // Verifica che tutti i valori siano definiti (0 è ammesso!)
    const requiredFields = [calls, login, wait, talk, dispo, pause];
    if (requiredFields.some(val => val === undefined || val === null)) {
      return res
        .status(400)
        .json({ message: "Tutti i campi sono obbligatori" });
    }

    const query = `
      UPDATE operators_timelog
      SET calls = ?, login = ?, wait = ?, talk = ?, dispo = ?, pause = ?
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [
      calls,
      login,
      wait,
      talk,
      dispo,
      pause,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Timelog non trovato" });
    }

    res.json({ message: "Timelog aggiornato con successo!" });
  } catch (error) {
    console.error("[ERROR] Errore nell'aggiornamento del timelog:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento del timelog" });
  }
};


exports.getAggregatedTimelogs = async (req, res) => {
  try {
    let { startDate, endDate, userId, locationId } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Date di inizio e fine obbligatorie" });
    }

    const query = `
      SELECT 
        ot.user_id, 
        u.nome, 
        u.cognome,
        ul.location AS location_name,
        SUM(ot.calls) AS calls,
        SUM(ot.login) AS login,
        SUM(ot.wait) AS wait,
        SUM(ot.talk) AS talk,
        SUM(ot.dispo) AS dispo,
        SUM(ot.pause) AS pause
      FROM operators_timelog ot
      JOIN users u ON ot.user_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      WHERE ot.date BETWEEN ? AND ?
      ${userId ? "AND ot.user_id = ?" : ""}
      ${locationId ? "AND u.location_id = ?" : ""}
      GROUP BY ot.user_id
      ORDER BY u.cognome ASC;
    `;

    let params = [startDate, endDate];
    if (userId) params.push(userId);
    if (locationId) params.push(locationId);

    const [rows] = await pool.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error(
      "[ERROR] Errore nel recupero dei consuntivi aggregati:",
      error
    );
    res.status(500).json({ message: "Errore nel recupero dei consuntivi" });
  }
};

exports.checkTimelogExists = async (req, res) => {
  try {
    const { date } = req.query;

    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM operators_timelog WHERE date = ?",
      [date]
    );

    res.json({ exists: rows[0].count > 0 });
  } catch (error) {
    console.error("Errore nella verifica del timelog:", error);
    res.status(500).json({ message: "Errore nel controllo del timelog" });
  }
};
