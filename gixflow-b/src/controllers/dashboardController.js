const pool = require("../db");

const getDateRange = (month) => {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    const now = new Date();
    month = now.toISOString().slice(0, 7);
  }

  const [year, m] = month.split("-");
  const startDate = `${year}-${m}-01`;
  const endDate = new Date(year, parseInt(m), 1); // primo giorno del mese successivo
  const endDateFormatted = endDate.toISOString().split("T")[0];

  return {
    startDate,
    endDate: endDateFormatted, // esclusivo!
  };
};


exports.getLoginSummary = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);
    const [rows] = await pool.execute(
      `SELECT 
        ul.location AS location,
        ot.date AS date,
        ROUND(SUM(ot.login), 2) AS total_hours
      FROM operators_timelog ot
      JOIN users u ON ot.user_id = u.id
      JOIN user_locations ul ON u.location_id = ul.id
      WHERE ot.date BETWEEN ? AND ?
      GROUP BY ul.location, ot.date
      ORDER BY ot.date ASC, ul.location ASC`,
      [startDate, endDate]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Errore nel getLoginSummary:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getContractsByVendorMonthly = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);

    const [rows] = await pool.execute(
      `SELECT 
        cv.name AS vendor,
        COUNT(*) AS total
      FROM contracts_main cm
      JOIN contract_vendors cv ON cm.contract_vendor_id = cv.id
      WHERE cm.completion_date BETWEEN ? AND ?
      GROUP BY cv.name
      ORDER BY total DESC`,
      [startDate, endDate]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Errore getContractsByVendorMonthly:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getContractsByAgentPerWeek = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);
    const [rows] = await pool.execute(
      `SELECT 
        CONCAT(u.nome, ' ', u.cognome) AS agent,
        WEEK(cm.completion_date, 1) AS week,
        COUNT(*) AS total
      FROM contracts_main cm
      JOIN users u ON cm.agent_id = u.id
      WHERE cm.completion_date BETWEEN ? AND ?
      GROUP BY agent, WEEK(cm.completion_date, 1)
      ORDER BY week ASC, agent ASC`,
      [startDate, endDate]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Errore getContractsByAgentPerWeek:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getDailyAppointmentsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);
    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(ul.location, 'Sconosciuta') AS location,
        DATE(a.date_start) AS date,
        COUNT(*) AS total
      FROM appointments a
      LEFT JOIN users u ON a.agent_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      WHERE a.date_start BETWEEN ? AND ?
      GROUP BY location, DATE(a.date_start)
      ORDER BY date ASC, location ASC`,
      [startDate, endDate]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Errore getDailyAppointmentsSummary:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getMonthlyPositiveAppointmentsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);
    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(ul.location, 'Sconosciuta') AS location,
        DATE(a.date_start) AS date,
        COUNT(*) AS total
      FROM appointments a
      LEFT JOIN users u ON a.agent_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      WHERE a.date_start BETWEEN ? AND ?
        AND a.status_id IN (2, 3, 6)
      GROUP BY date, location
      ORDER BY date ASC`,
      [startDate, endDate]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Errore getMonthlyPositiveAppointmentsSummary:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getMonthlyConversionsSummary = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);
    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(ul.location, 'Sconosciuta') AS location,
        COUNT(*) AS total
      FROM appointments a
      LEFT JOIN users u ON a.agent_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      WHERE a.date_start BETWEEN ? AND ?
        AND a.status_id IN (2, 3, 6)
      GROUP BY COALESCE(ul.location, 'Sconosciuta')
      ORDER BY total DESC`,
      [startDate, endDate]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Errore getMonthlyConversionsSummary:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getSPHByLocation = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);
    const [logins] = await pool.execute(
      `SELECT 
        ul.location AS location,
        ROUND(SUM(ot.login), 2) AS total_hours
      FROM operators_timelog ot
      JOIN users u ON ot.user_id = u.id
      JOIN user_locations ul ON u.location_id = ul.id
      WHERE ot.date BETWEEN ? AND ?
      GROUP BY ul.location`,
      [startDate, endDate]
    );
    const [appointments] = await pool.execute(
      `SELECT 
        ul.location AS location,
        COUNT(*) AS total_appointments
      FROM appointments a
      JOIN users u ON a.operator_id = u.id
      JOIN user_locations ul ON u.location_id = ul.id
      WHERE a.date_start BETWEEN ? AND ?
      GROUP BY ul.location`,
      [startDate, endDate]
    );

    const loginMap = {};
    logins.forEach(({ location, total_hours }) => {
      loginMap[location] = total_hours;
    });

    const results = appointments.map(({ location, total_appointments }) => {
      const hours = loginMap[location] || 0;
      const yieldValue = hours > 0 ? total_appointments / hours : 0;
      return {
        location,
        appointments: total_appointments,
        hours,
        yield: parseFloat(yieldValue.toFixed(2)),
      };
    });

    res.status(200).json(results);
  } catch (err) {
    console.error("Errore getSPHByLocation:", err);
    res.status(500).json({ message: "Errore interno" });
  }
};

exports.getMonthlyFinalizedContractsByLocation = async (req, res) => {
  try {
    const month = req.query.month;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Formato mese non valido. Usa 'YYYY-MM'" });
    }

    const start = `${month}-01`;
    const end = new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const [rows] = await pool.execute(
      `
        SELECT 
          COALESCE(ul.location, 'Sconosciuta') AS location,
          DATE(cm.completion_date) AS date,
          COUNT(*) AS total
        FROM contracts_main cm
        LEFT JOIN users u ON cm.agent_id = u.id
        LEFT JOIN user_locations ul ON u.location_id = ul.id
        WHERE cm.completion_date BETWEEN ? AND ?
          AND cm.status_id IN (1, 2)
        GROUP BY location, DATE(cm.completion_date)
        ORDER BY date ASC, location ASC
      `,
      [start, end]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("❌ Errore nel fetch contratti per sede:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.getActiveUsersByLocationAndRole = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
        SELECT 
          COALESCE(ul.location, 'Sconosciuta') AS location,
          r.name AS role,
          COUNT(u.id) AS total
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN user_locations ul ON u.location_id = ul.id
        WHERE u.is_active = 'si'
        GROUP BY ul.location, r.name
        ORDER BY ul.location, r.name
      `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Errore nel recupero utenti attivi per sede e ruolo:", error);
    res.status(500).json({ message: "Errore interno del server" });
  }
};

exports.getConversionRateByLocation = async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req.query.month);

    // 🔢 1. Tutti gli appuntamenti per sede
    const [totalRows] = await pool.execute(
      `SELECT COALESCE(ul.location, 'Sconosciuta') AS location, COUNT(*) AS total
       FROM appointments a
       LEFT JOIN users u ON a.operator_id = u.id
       LEFT JOIN user_locations ul ON u.location_id = ul.id
       WHERE a.date_start BETWEEN ? AND ?
       GROUP BY location`,
      [startDate, endDate]
    );

    // ✅ 2. Appuntamenti con contratto (status_id 2 o 3)
    const [positiveRows] = await pool.execute(
      `SELECT COALESCE(ul.location, 'Sconosciuta') AS location, COUNT(*) AS positive
       FROM appointments a
       LEFT JOIN users u ON a.operator_id = u.id
       LEFT JOIN user_locations ul ON u.location_id = ul.id
       WHERE a.date_start BETWEEN ? AND ?
         AND a.status_id IN (2, 3)
       GROUP BY location`,
      [startDate, endDate]
    );

    const totalMap = Object.fromEntries(totalRows.map(r => [r.location, r.total]));
    const positiveMap = Object.fromEntries(positiveRows.map(r => [r.location, r.positive]));

    const locations = [...new Set([...Object.keys(totalMap), ...Object.keys(positiveMap)])];

    const result = locations.map(location => {
      const total = totalMap[location] || 0;
      const positive = positiveMap[location] || 0;
      const conversion = total > 0 ? parseFloat(((positive / total) * 100).toFixed(2)) : 0;

      return {
        location,
        positive,
        total,
        conversion, // % conversione
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Errore nel calcolo conversioni per sede:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
};


