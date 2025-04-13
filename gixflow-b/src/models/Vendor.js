const pool = require("../db");

class Vendor {
  // Ottenere tutti i vendor con filtro archiviazione
  static async getAll(showArchived = false) {
    try {
      const query = `SELECT * FROM contract_vendors WHERE (? OR is_archived = 0)`;
      const [rows] = await pool.query(query, [showArchived]);
      return rows;
    } catch (error) {
      console.error("Errore nel recupero dei vendor:", error);
      throw error;
    }
  }

  // Ottenere un vendor per ID
  static async getById(id) {
    try {
      const [rows] = await pool.query("SELECT * FROM contract_vendors WHERE id = ?", [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Errore nel recupero del vendor:", error);
      throw error;
    }
  }

  // Creare un nuovo vendor
  static async create(data) {
    try {
      const { name, description } = data;
      const [result] = await pool.query(
        "INSERT INTO contract_vendors (name, description) VALUES (?, ?)",
        [name, description || null]
      );
      return result.insertId;
    } catch (error) {
      console.error("Errore nella creazione del vendor:", error);
      throw error;
    }
  }

  // Aggiornare un vendor
  static async update(id, data) {
    try {
      const { name, description } = data;
      const [result] = await pool.query(
        "UPDATE contract_vendors SET name = ?, description = ? WHERE id = ?",
        [name, description || null, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'aggiornamento del vendor:", error);
      throw error;
    }
  }

  // Archiviare / ripristinare un vendor
  static async toggleArchive(id, is_archived) {
    try {
      const [result] = await pool.query(
        "UPDATE contract_vendors SET is_archived = ? WHERE id = ?",
        [is_archived, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'archiviazione del vendor:", error);
      throw error;
    }
  }

  // Eliminare un vendor
  static async delete(id) {
    try {
      const [result] = await pool.query("DELETE FROM contract_vendors WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'eliminazione del vendor:", error);
      throw error;
    }
  }
}

module.exports = Vendor;
