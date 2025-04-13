const pool = require("../db");

class OperatorTimelog {
  // Ottenere tutti i log di un determinato giorno
  static async getByDate(date) {
    try {
      const query = `SELECT * FROM operators_timelog WHERE date = ?`;
      const [rows] = await pool.query(query, [date]);
      return rows;
    } catch (error) {
      console.error("Errore nel recupero dei timelog:", error);
      throw error;
    }
  }

  // Inserire un nuovo log
  static async create(data) {
    try {
      const { user_id, date, calls, login, wait, talk, dispo, pause } = data;
      const query = `
        INSERT INTO operators_timelog (user_id, date, calls, login, wait, talk, dispo, pause)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const [result] = await pool.query(query, [user_id, date, calls, login, wait, talk, dispo, pause]);
      return result.insertId;
    } catch (error) {
      console.error("Errore nella creazione del timelog:", error);
      throw error;
    }
  }

  // Eliminare log per una determinata data
  static async deleteByDate(date) {
    try {
      const query = `DELETE FROM operators_timelog WHERE date = ?`;
      const [result] = await pool.query(query, [date]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'eliminazione del timelog:", error);
      throw error;
    }
  }
}

module.exports = OperatorTimelog;
