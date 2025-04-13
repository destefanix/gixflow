const pool = require("../db");
const { sendNextWorkdayAgenda } = require("../controllers/notificationsController");

const getNotificationsToSend = async () => {
  try {
    const currentTime = new Date().toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    console.log(`[DEBUG] Controllo notifiche per orario: ${currentTime}`);

    const [notifications] = await pool.query(`
      SELECT n.id, n.type, n.user_id, n.send_time, u.email, u.telefono
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.is_enabled = 1 AND TIME_FORMAT(n.send_time, '%H:%i') = ?
    `, [currentTime]);

    return notifications;
  } catch (error) {
    console.error("[ERROR] Errore nel recupero delle notifiche:", error);
    return [];
  }
};

const processNotifications = async () => {
  const notifications = await getNotificationsToSend();

  if (notifications.length > 0) {
    await sendNextWorkdayAgenda(); // ✅ Chiamala solo una volta, senza parametri
  }
};

// Pianifica l'esecuzione ogni minuto
setInterval(processNotifications, 60000);

module.exports = { processNotifications };
