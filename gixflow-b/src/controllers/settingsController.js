const pool = require("../db");
const { sendEmail } = require("../utils/emailService");


exports.updateSetting = async (req, res) => {
  try {
    const { key_name, value } = req.body;
    await pool.query(
      "INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      [key_name, value]
    );
    res.json({ message: "Impostazione aggiornata con successo" });
  } catch (error) {
    console.error(
      "[ERROR] Errore nell'aggiornamento delle impostazioni:",
      error
    );
    res
      .status(500)
      .json({ message: "Errore nell'aggiornamento delle impostazioni" });
  }
};

exports.getSetting = async (req, res) => {
  try {
    const { key } = req.query;
    const [rows] = await pool.query(
      `SELECT value FROM settings WHERE key_name = ?`,
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Impostazione non trovata" });
    }

    res.json({ value: rows[0].value });
  } catch (error) {
    console.error("[ERROR] Errore nel recupero delle impostazioni:", error);
    res.status(500).json({ message: "Errore nel recupero delle impostazioni" });
  }
};

exports.getSmtpSettings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT value FROM settings WHERE key_name = 'smtp_settings' LIMIT 1"
    );
    if (rows.length === 0)
      return res.json({
        success: false,
        message: "Nessuna impostazione trovata",
      });

    const settings = JSON.parse(rows[0].value);
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Errore nel recupero impostazioni SMTP:", error);
    res
      .status(500)
      .json({ success: false, error: "Errore interno del server" });
  }
};

exports.saveSmtpSettings = async (req, res) => {
  const { email, password, alias } = req.body;

  try {
    const jsonValue = JSON.stringify({ email, password, alias });
    await pool.query(
      "INSERT INTO settings (key_name, value) VALUES ('smtp_settings', ?) ON DUPLICATE KEY UPDATE value = ?",
      [jsonValue, jsonValue]
    );

    res.json({
      success: true,
      message: "Impostazioni SMTP salvate con successo!",
    });
  } catch (error) {
    console.error("Errore nel salvataggio impostazioni SMTP:", error);
    res
      .status(500)
      .json({ success: false, error: "Errore interno del server" });
  }
};

exports.sendTestEmail = async (req, res) => {
  const { to, subject, message } = req.body;
  const result = await sendEmail({ to, subject, text: message });

  if (result.success) {
    res.json({ success: true, message: "Email inviata con successo!" });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
};

exports.getEmailLogs = async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;

    const [rows] = await pool.query(
      `SELECT rel.id, u.username, rel.recipients, rel.subject, rel.report_type, rel.sent_at
       FROM report_email_logs rel
       LEFT JOIN users u ON rel.user_id = u.id
       ${type ? "WHERE rel.report_type = ?" : ""}
       ORDER BY rel.sent_at DESC
       LIMIT ?`,
      type ? [type, parseInt(limit)] : [parseInt(limit)]
    );

    return res.json({ logs: rows });
  } catch (err) {
    console.error("❌ Errore nel recupero log email:", err);
    return res.status(500).json({ message: "Errore interno" });
  }
};