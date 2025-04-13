const pool = require("../db");

class Adjustment {
  static async getAllManualAdjustments(showArchived) {
    const query = `
      SELECT ma.*, 
             at.name AS adjustment_name, 
             CONCAT(u.cognome, ' ', u.nome) AS agent_name
      FROM manual_adjustments ma
      JOIN adjustment_types at ON ma.adjustment_type_id = at.id
      JOIN users u ON ma.user_id = u.id
      ${
        showArchived ? "" : "WHERE ma.is_archived = 0"
      } 
    `;

    const [rows] = await pool.query(query);
    return rows;
  }

  // Ottenere un aggiustamento manuale per ID
  static async getManualAdjustmentById(id) {
    const [rows] = await pool.query(
      `
      SELECT 
        ma.*, 
        at.name AS adjustment_name, 
        CONCAT(u.cognome, ' ', u.nome) AS agent_name
      FROM manual_adjustments ma
      JOIN adjustment_types at ON ma.adjustment_type_id = at.id
      JOIN users u ON ma.user_id = u.id
      WHERE ma.id = ?
    `,
      [id]
    );
    return rows.length ? rows[0] : null;
  }

  // Creare un nuovo aggiustamento manuale
  static async createManualAdjustment(
    adjustmentTypeId,
    userId,
    amount,
    validFrom,
    validTo
  ) {
    const [result] = await pool.query(
      `INSERT INTO manual_adjustments 
      (adjustment_type_id, user_id, amount, valid_from, valid_to, is_archived) 
      VALUES (?, ?, ?, ?, ?, 0)`,
      [adjustmentTypeId, userId, amount, validFrom, validTo]
    );
    return result.insertId;
  }

  static async updateManualAdjustment(
    id,
    adjustmentTypeId,
    userId,
    amount,
    validFrom,
    validTo
  ) {
    const [result] = await pool.query(
      `UPDATE manual_adjustments 
      SET adjustment_type_id = ?, user_id = ?, amount = ?, valid_from = ?, valid_to = ?
      WHERE id = ?`,
      [adjustmentTypeId, userId, amount, validFrom, validTo, id]
    );
    return result.affectedRows > 0;
  }

  // Archiviare o ripristinare un aggiustamento manuale
  static async toggleArchiveManualAdjustment(id, isArchived) {
    const [result] = await pool.query(
      `UPDATE manual_adjustments 
      SET is_archived = ? 
      WHERE id = ?`,
      [isArchived, id]
    );
    return result.affectedRows > 0;
  }

  // Eliminare un aggiustamento manuale
  static async deleteManualAdjustment(id) {
    const [result] = await pool.query(
      "DELETE FROM manual_adjustments WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Adjustment;
