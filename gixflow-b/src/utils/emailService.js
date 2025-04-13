const nodemailer = require("nodemailer");
const pool = require("../db");

function generateEmailHTML({ reportType, filters, summary, total }) {
  return `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
      <h2 style="color: #2e7d61;">✅ Report Appuntamenti</h2>
      <p><strong>Report dal:</strong> ${filters?.from} al ${filters?.to}<br>
      <strong>Generato il:</strong> ${new Date().toLocaleString("it-IT")}</p>

      <h3 style="margin-top: 20px; color: #2e7d61;">📌 Filtri applicati:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Periodo:</strong> ${filters?.from} - ${filters?.to}</li>
        <li><strong>Agente:</strong> ${filters?.agentLabel || "Tutti"}</li>
        <li><strong>Operatore:</strong> ${filters?.operatorLabel || "Tutti"}</li>
        <li><strong>Sede:</strong> ${filters?.locationLabel || "Tutti"}</li>
        <li><strong>Vendor:</strong> ${filters?.vendorLabel || "Tutti"}</li>
      </ul>

      <h3 style="margin-top: 20px; color: #2e7d61;">📊 Totale Appuntamenti: <strong>${total}</strong></h3>
      <ul style="padding-left: 20px;">
        ${Object.entries(summary || {})
          .map(
            ([status, count]) =>
              `<li>${status}: <strong>${count}</strong> (${((count / total) * 100).toFixed(2)}%)</li>`
          )
          .join("")}
      </ul>

      <p style="margin-top: 30px;">📎 In allegato trovi il file CSV con tutti i dettagli.</p>
    </div>
  `;
}


const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {

  try {
    // Controllo se `to` è valido
    if (!to || typeof to !== "string" || !to.includes("@")) {
      console.error(`[ERROR] Email destinatario non valida: ${to}`);
      throw new Error("Indirizzo email non valido o assente!");
    }

    // Recupera le impostazioni SMTP dal database
    const [rows] = await pool.query(
      "SELECT value FROM settings WHERE key_name = 'smtp_settings' LIMIT 1"
    );
    if (rows.length === 0)
      throw new Error("Impostazioni SMTP non configurate.");

    const { email, password, alias } = JSON.parse(rows[0].value);

    // Configura Nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: email, pass: password },
    });

    // Invia l'email
    const info = await transporter.sendMail({
      from: `GIX "${alias}" <${email}>`, // Usa il nome alias + indirizzo email
      to,
      subject,
      text,
      html, 
      attachments: attachments || [],

    });

    return { success: true, message: `Email inviata a ${to}`, info };
  } catch (error) {
    console.error("[ERROR] Errore nell'invio dell'email:", error);
    return {
      success: false,
      error: error.message || "Errore nell'invio della mail",
    };
  }
};

/* const sendSMS = async (phoneNumber) => {
  try {
    const smsApiUrl = "https://api.smsprovider.com/send"; // Cambia con il tuo provider
    const response = await axios.post(smsApiUrl, {
      to: phoneNumber,
      message: "Questa è una notifica automatica.",
      apiKey: process.env.SMS_API_KEY,
    });

    if (response.data.success) {
      console.log(`[SUCCESS] SMS inviato a ${phoneNumber}`);
    } else {
      console.error(`[ERROR] Errore nell'invio dell'SMS a ${phoneNumber}:`, response.data);
    }
  } catch (error) {
    console.error(`[ERROR] Errore nell'invio dell'SMS a ${phoneNumber}:`, error);
  }
};

const sendWhatsApp = async (phoneNumber) => {
  try {
    const whatsappApiUrl = "https://api.whatsappprovider.com/send"; // Cambia con il tuo provider
    const response = await axios.post(whatsappApiUrl, {
      to: phoneNumber,
      message: "Questa è una notifica automatica.",
      apiKey: process.env.WHATSAPP_API_KEY,
    });

    if (response.data.success) {
      console.log(`[SUCCESS] WhatsApp inviato a ${phoneNumber}`);
    } else {
      console.error(`[ERROR] Errore nell'invio del WhatsApp a ${phoneNumber}:`, response.data);
    }
  } catch (error) {
    console.error(`[ERROR] Errore nell'invio del WhatsApp a ${phoneNumber}:`, error);
  }
}; */

module.exports = { generateEmailHTML, sendEmail };
