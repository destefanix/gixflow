const { sendEmail, generateEmailHTML } = require("../utils/emailService");
const pool = require("../db");

// INVIO EMAIL REPORT (FUNZIONE GENERICA E SCALABILE)
exports.sendAppointmentsReportEmail = async (req, res) => {
  try {
    const {
      recipients,
      subject,
      html: rawHtml,
      csvBase64,
      reportType,
      filters,
      summary,
      total
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Inserire almeno un destinatario" });
    }

    if (!csvBase64 || !reportType || !filters || !summary || !total) {
      return res.status(400).json({ message: "Dati incompleti per l'invio" });
    }

    const csvBuffer = Buffer.from(csvBase64, "base64");

    // ⚙️ Genera HTML solo se non passato esplicitamente
    const html = rawHtml || generateEmailHTML({ reportType, filters, summary, total });

    const emailResult = await sendEmail({
      to: recipients.length === 1 ? recipients[0] : recipients.join(','),
      subject,
      html,
      attachments: [
        {
          filename: `${reportType}_report.csv`,
          content: csvBuffer,
        },
      ],
    });

    if (!emailResult.success) {
      return res.status(500).json({ message: "Errore invio email", error: emailResult.error });
    }

    await pool.query(
      `INSERT INTO report_email_logs (user_id, recipients, subject, report_type)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, recipients.join("; "), subject, reportType]
    );

    return res.json({ success: true, message: "Email inviata con successo" });

  } catch (err) {
    console.error("❌ Errore invio report email:", err);
    return res.status(500).json({ message: "Errore interno", error: err.message });
  }
};

// REPORT APPUNTAMENTI
exports.getAppointmentsReport = async (from, to, agent_id = [], operator_id = [], location_id = [], res) => {
  try {
    const conditions = [`a.date_start BETWEEN ? AND ?`];
    const values = [from, to];

    const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;

    // 👇 agent_id
    if (isValidArray(agent_id)) {
      conditions.push(`a.agent_id IN (${agent_id.map(() => '?').join(', ')})`);
      values.push(...agent_id);
    }

    // 👇 operator_id
    if (isValidArray(operator_id)) {
      conditions.push(`a.operator_id IN (${operator_id.map(() => '?').join(', ')})`);
      values.push(...operator_id);
    }

    // 👇 location_id
    if (isValidArray(location_id)) {
      conditions.push(`u.location_id IN (${location_id.map(() => '?').join(', ')})`);
      values.push(...location_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        a.id,
        a.date_start,
        a.date_end,
        s.name AS status,
        CONCAT(ag.cognome, ' ', ag.nome) AS agent,
        CONCAT(op.cognome, ' ', op.nome) AS operator,
        l.location AS sede
      FROM appointments a
      LEFT JOIN users ag ON a.agent_id = ag.id
      LEFT JOIN users op ON a.operator_id = op.id
      LEFT JOIN appointment_status s ON a.status_id = s.id
      LEFT JOIN users u ON a.agent_id = u.id
      LEFT JOIN user_locations l ON u.location_id = l.id
      ${whereClause}
      ORDER BY a.date_start DESC
    `;

    const [rows] = await pool.query(query, values);

    const total = rows.length;
    const totPerStatus = rows.reduce((acc, r) => {
      const status = r?.status || 'Sconosciuto';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      total,
      summary: totPerStatus,
      data: rows,
    });

  } catch (error) {
    console.error("❌ Errore Appointments Report:", error);
    return res.status(500).json({ error: "Errore nel report appuntamenti" });
  }
};

// REPORT CONTRATTI
exports.getContractsByAgentReport = async (req, res) => {
  const { from, to, location, vendor, status } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "Parametri 'from' e 'to' obbligatori." });
  }

  try {
    let query = `
      SELECT 
        cm.id,
        cm.completion_date,
        CONCAT(a.cognome, ' ', a.nome) AS agent,
        cs.name AS status,
        cv.name AS vendor,
        ul.location AS location
      FROM contracts_main cm
      LEFT JOIN users a ON cm.agent_id = a.id
      LEFT JOIN contract_status cs ON cm.status_id = cs.id
      LEFT JOIN contract_vendors cv ON cm.contract_vendor_id = cv.id
      LEFT JOIN user_locations ul ON a.location_id = ul.id
      WHERE 1 = 1
    `;

    const params = [];

    if (from) query += ` AND cm.completion_date >= ?`, params.push(from);
    if (to) query += ` AND cm.completion_date <= ?`, params.push(to);
    if (location) query += ` AND ul.id = ?`, params.push(location);
    if (vendor) query += ` AND cv.id = ?`, params.push(vendor);
    if (status) query += ` AND cs.id = ?`, params.push(status);

    query += ` ORDER BY cm.completion_date DESC`;

    const [rows] = await pool.execute(query, params);

    const summary = {};
    rows.forEach(row => {
      const st = row.status || "Sconosciuto";
      summary[st] = summary[st] ? summary[st] + 1 : 1;
    });

    return res.json({
      total: rows.length,
      summary,
      data: rows,
    });

  } catch (err) {
    console.error("❌ Errore in getContractsByAgentReport:", err);
    return res.status(500).json({ message: "Errore interno nel report." });
  }
};

// REPORT EFFICIENZA PER SEDE 
exports.locationEfficiencyReport = async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "Parametri 'from' e 'to' obbligatori." });
  }

  try {
    const query = `
      SELECT 
        DATE_FORMAT(t.date, '%Y-%m') AS mese,
        ul.location AS sede,
        SUM(t.login + t.wait + t.talk + t.dispo + t.pause) AS ore_erogate,
        COUNT(DISTINCT a.id) AS appuntamenti_totali,
        SUM(CASE WHEN a.status_id IN (2, 3, 6) THEN 1 ELSE 0 END) AS appuntamenti_positivi
      FROM operators_timelog t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      LEFT JOIN appointments a ON a.operator_id = u.id AND DATE(a.date_start) = t.date
      WHERE t.date BETWEEN ? AND ?
      GROUP BY mese, sede
      ORDER BY mese DESC, sede ASC;
    `;

    const [rows] = await pool.query(query, [from, to]);

    const data = rows.map((row) => {
      const oreErogate = parseFloat(row.ore_erogate ?? 0);
      const appTotali = parseInt(row.appuntamenti_totali ?? 0);
      const appPositivi = parseInt(row.appuntamenti_positivi ?? 0);

      const resa = oreErogate > 0 ? appTotali / oreErogate : 0;
      const posRate = appTotali > 0
        ? ((appPositivi / appTotali) * 100).toFixed(2)
        : "0.00";

      return {
        mese: row.mese,
        sede: row.sede || "Sconosciuta",
        ore_erogate: Number(oreErogate.toFixed(2)),
        appuntamenti_totali: appTotali,
        appuntamenti_positivi: appPositivi,
        resa_oraria: Number(resa.toFixed(2)),
        percentuale_pos: posRate,
      };
    });

    return res.status(200).json({ data });

  } catch (err) {
    console.error("❌ Errore getOperatorEfficiencyByLocation:", err);
    return res.status(500).json({ message: "Errore interno", error: err.message });
  }
};

//REPORT PERFORMANCE OPERATORI
// REPORT PERFORMANCE OPERATORI
exports.operatorPerformanceReport = async (req, res) => {
  const { from, to, operator_id, location_id } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "Parametri 'from' e 'to' obbligatori." });
  }

  try {
    const conditions = [`t.date BETWEEN ? AND ?`];
    const values = [from, to];

    const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;

    if (isValidArray(operator_id)) {
      conditions.push(`u.id IN (${operator_id.map(() => '?').join(',')})`);
      values.push(...operator_id);
    }

    if (isValidArray(location_id)) {
      conditions.push(`ul.id IN (${location_id.map(() => '?').join(',')})`);
      values.push(...location_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        u.id AS operator_id,
        CONCAT(u.cognome, ' ', u.nome) AS operator_name,
        ul.location AS sede,
        SUM(t.login + t.wait + t.talk + t.dispo + t.pause) AS ore_erogate,
        COUNT(DISTINCT a.id) AS appuntamenti_totali,
        SUM(CASE WHEN a.status_id IN (2, 3, 6) THEN 1 ELSE 0 END) AS appuntamenti_positivi
      FROM operators_timelog t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN user_locations ul ON u.location_id = ul.id
      LEFT JOIN appointments a ON a.operator_id = u.id AND DATE(a.date_start) = t.date
      ${whereClause}
      GROUP BY u.id, operator_name, sede
      ORDER BY operator_name ASC
    `;

    const [rows] = await pool.query(query, values);

    const data = rows.map(row => {
      const ore = parseFloat(row.ore_erogate ?? 0);
      const appTot = parseInt(row.appuntamenti_totali ?? 0);
      const appPos = parseInt(row.appuntamenti_positivi ?? 0);

      const resa = ore > 0 ? appTot / ore : 0;
      const posRate = appTot > 0 ? (appPos / appTot) * 100 : 0;

      return {
        operator_id: row.operator_id,
        operator_name: row.operator_name,
        sede: row.sede || "Sconosciuta",
        ore_erogate: Number(ore.toFixed(2)),
        appuntamenti_totali: appTot,
        appuntamenti_positivi: appPos,
        resa_oraria: Number(resa.toFixed(2)),
        percentuale_pos: Number(posRate.toFixed(2)),
      };
    });

    return res.status(200).json({ data });

  } catch (error) {
    console.error("❌ Errore operatorPerformanceReport:", error);
    return res.status(500).json({ message: "Errore interno", error: error.message });
  }
};


// ROUTER GENERICO
exports.getReportByType = async (req, res) => {
  const { type } = req.params;
  const {
    from,
    to,
    agent_id,
    operator_id,
    location_id,
    vendor_id
  } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "Parametri from e to obbligatori" });
  }

  switch (type) {
    case 'appointments':
      return exports.getAppointmentsReport(from, to, agent_id, operator_id, location_id, res);

    case 'contracts-by-agent':
      return exports.getContractsByAgentReport(req, res);

    case 'location-efficiency':
      return exports.locationEfficiencyReport(req, res);

    case 'operator-performance':
      return exports.operatorPerformanceReport(req, res);
        

    default:
      return res.status(400).json({ error: "Tipo report non supportato" });
  }
};



