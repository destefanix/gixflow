const pool = require("../db"); // Connessione al database
const axios = require("axios");

// Funzione per eliminare i contratti temporanei
const deleteTemporaryContracts = async () => {
  try {
    const query = `DELETE FROM contracts_main WHERE temporary = TRUE AND creation_date < NOW() - INTERVAL 1 HOUR;`;
    await pool.query(query);
    console.log("[DEBUG] Contratti temporanei eliminati.");
  } catch (error) {
    console.error(
      "[DEBUG] Errore durante l'eliminazione dei contratti temporanei:",
      error
    );
  }
};

// Funzione per archiviare provvigioni scadute
const archiveExpiredCommissions = async () => {
  try {
    const query = `
      UPDATE products_commissioning 
      SET is_archived = 1 
      WHERE valid_to < CURDATE() AND is_archived = 0;
    `;
    const [result] = await pool.query(query);
    console.log(
      `[DEBUG] ${result.affectedRows} provvigioni scadute archiviate automaticamente.`
    );
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'archiviazione automatica delle provvigioni:",
      error
    );
  }
};

// Funzione per archiviare adjustments scaduti
const archiveExpiredAdjustments = async () => {
  try {
    const query = `
      UPDATE manual_adjustments 
      SET is_archived = 1 
      WHERE valid_to < CURDATE() AND is_archived = 0;
    `;
    const [result] = await pool.query(query);
    console.log(
      `[DEBUG] ${result.affectedRows} adjustments scaduti archiviati automaticamente.`
    );
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'archiviazione automatica degli adjustments:",
      error
    );
  }
};

// Recupera la configurazione dal DB
const getAutoGenerationSettings = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT value FROM settings WHERE key_name = 'auto_generate_timelog'`
    );
    return rows.length > 0
      ? JSON.parse(rows[0].value)
      : { enabled: false, time: "03:00" };
  } catch (error) {
    console.error("[ERROR] Errore nel recupero delle impostazioni:", error);
    return { enabled: false, time: "03:00" };
  }
};

const generateTimelogForPreviousDay = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const query_date = yesterday.toISOString().split("T")[0];

    console.log(`[DEBUG] Generazione automatica del TimeLog per il ${query_date}...`);

    const VUE_APP_API_URL = process.env.VUE_APP_API_URL;
    const TOKEN = process.env.SERVICE_API_TOKEN; 

    if (!TOKEN) {
      console.error("[ERROR] Token API non trovato! Verifica le variabili di ambiente.");
      return;
    }

    const headers = { Authorization: `Bearer ${TOKEN}` };

    // Passaggio 1: Recupera i timelog
    const response = await axios.post(
      `${VUE_APP_API_URL}/ast/fetch-timelogs`,
      { query_date },
      { headers }
    );

    const timelogData = response.data; // ✅ Definizione corretta

    if (!Array.isArray(timelogData) || timelogData.length === 0) {
      console.warn(`[WARNING] Nessun dato disponibile per il ${query_date}, salvataggio saltato.`);
      return;
    }

    // Passaggio 2: Salva i timelog nel database
    await axios.post(
      `${VUE_APP_API_URL}/ast/save-hours`,
      { date: query_date, hours: timelogData },
      { headers } // ✅ Aggiunto token anche qui
    );

    console.log(`[SUCCESS] TimeLog per il ${query_date} generato e salvato.`);
  } catch (error) {
    console.error(
      `[ERROR] Errore nella generazione automatica del TimeLog:`,
      error.response?.data || error.message
    );
  }
};



// Pianificazione della generazione automatica del TimeLog
const scheduleTimelogGeneration = async () => {
  const settings = await getAutoGenerationSettings();
  if (!settings.enabled) {
    console.log("[INFO] Generazione automatica TimeLog disattivata.");
    return;
  }

  const [hours, minutes] = settings.time.split(":").map(Number);
  const now = new Date();
  const executionTime = new Date();
  executionTime.setHours(hours, minutes, 0, 0);

  // Se l'orario è già passato oggi, lo pianifichiamo per domani
  if (now > executionTime) {
    executionTime.setDate(executionTime.getDate() + 1);
  }

  const delay = executionTime - now;
  console.log(
    `[INFO] Prossima generazione TimeLog pianificata per ${executionTime}`
  );

  setTimeout(async () => {
    await generateTimelogForPreviousDay();
    scheduleTimelogGeneration(); // Pianifica di nuovo dopo l'esecuzione
  }, delay);
};

// Esegui i task periodici
scheduleTimelogGeneration(); // Avvia la generazione automatica del TimeLog all'avvio del server
setInterval(deleteTemporaryContracts, 3600000); // Ogni 1 ora
setInterval(archiveExpiredCommissions, 3600000); // Ogni 1 ora (puoi cambiare l'intervallo)
setInterval(archiveExpiredAdjustments, 3600000); // Ogni 1 ora (puoi cambiare l'intervallo)

module.exports = {
  deleteTemporaryContracts,
  archiveExpiredCommissions,
  archiveExpiredAdjustments,
  generateTimelogForPreviousDay,
  scheduleTimelogGeneration,
};
