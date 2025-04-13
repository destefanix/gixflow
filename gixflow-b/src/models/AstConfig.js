const pool = require("../db");

class AstConfig {
  // Ottenere tutte le configurazioni
  static async getAll() {
    try {
      const query = `SELECT * FROM ast_config`;
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      console.error("Errore nel recupero delle configurazioni:", error);
      throw error;
    }
  }

  // Ottenere una configurazione per chiave
  static async getByKey(key_name) {
    try {
      const query = `SELECT * FROM ast_config WHERE key_name = ? LIMIT 1`;
      const [rows] = await pool.query(query, [key_name]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Errore nel recupero della configurazione:", error);
      throw error;
    }
  }

  // Salvare una nuova configurazione o aggiornare una esistente
  static async saveOrUpdate(key_name, value) {
    try {
      const existingConfig = await this.getByKey(key_name);
      if (existingConfig) {
        const query = `UPDATE ast_config SET value = ? WHERE key_name = ?`;
        await pool.query(query, [value, key_name]);
      } else {
        const query = `INSERT INTO ast_config (key_name, value) VALUES (?, ?)`;
        await pool.query(query, [key_name, value]);
      }
      return true;
    } catch (error) {
      console.error("Errore nel salvataggio della configurazione:", error);
      throw error;
    }
  }
}

module.exports = AstConfig;
