const pool = require("../db");

const apiKeyMiddleware = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(403).json({ error: "Accesso negato: API Key mancante" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM api_keys WHERE api_key = ?", [apiKey]);

    if (rows.length === 0) {
      return res.status(403).json({ error: "Accesso negato: API Key non valida" });
    }

    next();
  } catch (error) {
    console.error("[DEBUG] Errore nel middleware API Key:", error);
    next(error);
  }
};

module.exports = apiKeyMiddleware;

