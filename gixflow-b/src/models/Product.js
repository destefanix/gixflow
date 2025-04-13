const pool = require("../db");

class Product {
  // Ottenere tutti i prodotti con i dettagli del vendor
  static async getAll(showArchived = false) {
    try {
      let query = `
        SELECT p.*, v.name AS vendor_name
        FROM products_list p
        JOIN contract_vendors v ON p.vendor_id = v.id
        WHERE (? OR p.is_archived = 0)
      `;
  
      const [rows] = await pool.query(query, [showArchived]);
      return rows;
    } catch (error) {
      console.error("Errore nel recupero dei prodotti:", error);
      throw error;
    }
  }   

  // Ottenere un singolo prodotto per ID
  static async getById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, v.name AS vendor_name
        FROM products_list p
        JOIN contract_vendors v ON p.vendor_id = v.id
        WHERE p.id = ?
      `, [id]);

      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Errore nel recupero del prodotto:", error);
      throw error;
    }
  }

  // Creare un nuovo prodotto
  static async create(data) {
    try {
      const { name, code, vendor_id, description } = data;
      const [result] = await pool.query(
        `INSERT INTO products_list (name, code, vendor_id, description, is_archived) 
         VALUES (?, ?, ?, ?, 0)`,
        [name, code || null, vendor_id, description || null]
      );
      return result.insertId;
    } catch (error) {
      console.error("Errore nella creazione del prodotto:", error);
      throw error;
    }
  }

  // Aggiornare un prodotto
  static async update(id, data) {
    try {
      const { name, code, vendor_id, description } = data;
      const [result] = await pool.query(
        `UPDATE products_list 
         SET name = ?, code = ?, vendor_id = ?, description = ? 
         WHERE id = ?`,
        [name, code || null, vendor_id, description || null, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'aggiornamento del prodotto:", error);
      throw error;
    }
  }

  // Archiviare / Ripristinare un prodotto
  static async toggleArchive(id, isArchived) {
    try {
      const [result] = await pool.query(
        "UPDATE products_list SET is_archived = ? WHERE id = ?",
        [isArchived, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'archiviazione del prodotto:", error);
      throw error;
    }
  }

  // Eliminare un prodotto
  static async delete(id) {
    try {
      const [result] = await pool.query("DELETE FROM products_list WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'eliminazione del prodotto:", error);
      throw error;
    }
  }
}

module.exports = Product;
