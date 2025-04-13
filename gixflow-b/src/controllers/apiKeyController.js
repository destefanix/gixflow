const crypto = require("crypto");
const pool = require("../db");


/* const generateApiKey = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ Prendiamo l'ID dal token
    if (!userId) {
      return res.status(400).json({ error: "User ID mancante!" });
    }

    const newApiKey = crypto.randomBytes(48).toString("hex"); // Generiamo una API Key da 96 caratteri

    await pool.query("INSERT INTO api_keys (user_id, api_key, created_at) VALUES (?, ?, NOW())", [userId, newApiKey]);

    res.json({ apiKey: newApiKey });
  } catch (error) {
    console.error("[DEBUG] Errore nella generazione della API Key:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
}; */

const generateApiKey = async (req, res) => {
  const newApiKey = crypto.randomBytes(48).toString("hex");
  const userId = req.user.id; // 🔥 Prendi l'ID dal token, non dal body!

  if (!userId) {
    return res.status(400).json({ error: "User ID richiesto" });
  }

  try {
    // 🔹 Controlla quante API Keys ha l'utente
    const [rows] = await pool.query(
      "SELECT COUNT(*) as keyCount FROM api_keys WHERE user_id = ?",
      [userId]
    );

    if (rows[0].keyCount >= 5) {
      return res.status(400).json({ error: "Hai già il massimo di 5 API Keys" });
    }

    // 🔹 Se è sotto il limite, creiamo una nuova chiave
    await pool.query(
      "INSERT INTO api_keys (user_id, api_key, created_at) VALUES (?, ?, NOW())",
      [userId, newApiKey]
    );

    res.json({ apiKey: newApiKey });
  } catch (err) {
    console.error("[DEBUG] Errore nella generazione della API Key:", err);
    res.status(500).json({ error: "Errore interno del server" });
  }
};



const getApiKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID mancante!" });
    }

    const [rows] = await pool.query("SELECT id, api_key FROM api_keys WHERE user_id = ?", [userId]);

    res.json(rows); // ✅ Restituiamo la lista, anche se vuota
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero delle API Keys:", error);
    res.status(500).json({ error: "Errore nel recupero delle API Keys" });
  }
};


const deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID mancante!" });
    }

    const [result] = await pool.query("DELETE FROM api_keys WHERE id = ? AND user_id = ?", [keyId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "API Key non trovata o già eliminata" });
    }

    res.json({ message: "API Key eliminata con successo" });
  } catch (error) {
    console.error("[DEBUG] Errore nell'eliminazione della API Key:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};




module.exports = 
  { generateApiKey,
    getApiKeys,
    deleteApiKey
  };
