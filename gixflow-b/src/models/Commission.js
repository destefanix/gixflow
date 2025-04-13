const pool = require("../db");

class Commission {
  // Ottenere tutte le provvigioni con i dettagli del prodotto
  static async getAll(showArchived = false) {
    try {
      let query = `
        SELECT c.*, p.name AS product_name, v.name AS vendor_name, p.vendor_id
        FROM products_commissioning c
        JOIN products_list p ON c.product_id = p.id
        JOIN contract_vendors v ON p.vendor_id = v.id
        WHERE (? OR c.is_archived = 0) 
      `;

      const [rows] = await pool.query(query, [showArchived]);
      return rows;
    } catch (error) {
      console.error("Errore nel recupero delle provvigioni:", error);
      throw error;
    }
  }

  // Ottenere una provvigione per ID
  static async getById(id) {
    try {
      const [rows] = await pool.query(
        `
        SELECT c.*, p.name AS product_name
        FROM products_commissioning c
        JOIN products_list p ON c.product_id = p.id
        WHERE c.id = ?
      `,
        [id]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Errore nel recupero della provvigione:", error);
      throw error;
    }
  }

  // Creare una nuova provvigione
  static async create(data) {
    try {
      const { product_id, description, commission, valid_from, valid_to } =
        data;
      const [result] = await pool.query(
        `INSERT INTO products_commissioning 
        (product_id, description, commission, valid_from, valid_to) 
        VALUES (?, ?, ?, ?, ?)`,
        [product_id, description || null, commission, valid_from, valid_to]
      );
      return result.insertId;
    } catch (error) {
      console.error("Errore nella creazione della provvigione:", error);
      throw error;
    }
  }

  // Aggiornare una provvigione esistente
  static async update(id, data) {
    try {
      const { product_id, description, commission, valid_from, valid_to } =
        data;
      const [result] = await pool.query(
        `UPDATE products_commissioning 
        SET product_id = ?, description = ?, commission = ?, valid_from = ?, valid_to = ?
        WHERE id = ?`,
        [product_id, description || null, commission, valid_from, valid_to, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'aggiornamento della provvigione:", error);
      throw error;
    }
  }

  // Eliminare una provvigione
  static async delete(id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM products_commissioning WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'eliminazione della provvigione:", error);
      throw error;
    }
  }

  static async toggleArchive(id, isArchived) {
    try {
      const [result] = await pool.query(
        "UPDATE products_commissioning SET is_archived = ? WHERE id = ?",
        [isArchived, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Errore nell'archiviazione della provvigione:", error);
      throw error;
    }
  }

  // Recupera tutti gli agenti
  static async getAgents() {
    const [agents] = await pool.query(
      "SELECT id, nome, cognome FROM users WHERE role_id = 2"
    );
    return agents;
  }

  static async getBaseCommission(agentId, year, month) {
    try {
      // 🔍 Assicuriamoci che il mese sia sempre a due cifre
      const formattedMonth = month.toString().padStart(2, "0");
      const formattedDate = `${year}-${formattedMonth}`;

      const [result] = await pool.query(
        `
            SELECT COALESCE(SUM(cp.quantity * COALESCE(pc.commission, 0)), 0) AS total_commission
            FROM contracts_main cm
            JOIN contract_products cp ON cm.id = cp.contract_id
            JOIN products_commissioning pc ON cp.product_id = pc.product_id
            WHERE cm.agent_id = ? 
            AND cm.status_id = 2  
            AND DATE(cm.completion_date) BETWEEN ? AND LAST_DAY(?)
        `,
        [agentId, `${formattedDate}-01`, `${formattedDate}-01`]
      );

      const totalCommission = parseFloat(result[0]?.total_commission) || 0;

      return totalCommission;
    } catch (error) {
      console.error(
        "❌ Errore nel calcolo della provvigione contratti:",
        error
      );
      throw error;
    }
  }

  static async getManualAdjustmentsByType(agentId, year, month) {
    try {
      const [results] = await pool.query(
        `
              SELECT 
                  at.id AS type_id, 
                  at.name AS type_name, 
                  COALESCE(SUM(ma.amount), 0) AS total_amount
              FROM manual_adjustments ma
              JOIN adjustment_types at ON ma.adjustment_type_id = at.id
              WHERE ma.user_id = ? 
              AND ma.is_archived = 0
              AND (
                  (YEAR(ma.valid_from) <= ? AND MONTH(ma.valid_from) <= ?) 
                  AND (YEAR(ma.valid_to) >= ? AND MONTH(ma.valid_to) >= ?)
              )
              GROUP BY at.id, at.name
          `,
        [agentId, year, month, year, month]
      );

      let adjustments = {
        fixed_salary: 0,
        expense_reimbursement: 0,
        manual_adjustments: 0,
      };

      results.forEach((row) => {
        if (row.type_id === 1)
          adjustments.fixed_salary = parseFloat(row.total_amount);
        if (row.type_id === 2)
          adjustments.expense_reimbursement = parseFloat(row.total_amount);
        if (row.type_id === 3)
          adjustments.manual_adjustments = parseFloat(row.total_amount);
      });

      return adjustments;
    } catch (error) {
      console.error(
        "❌ Errore nel recupero degli aggiustamenti manuali:",
        error
      );
      return {
        fixed_salary: 0,
        expense_reimbursement: 0,
        manual_adjustments: 0,
      };
    }
  }

  static async saveCommission(
    agentId,
    year,
    month,
    baseCommission,
    adjustments
  ) {
    try {
      await pool.query(
        `
            INSERT INTO agents_commissions 
            (agent_id, month, base_commission, fixed_salary, expense_reimbursement, manual_adjustments)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                base_commission = VALUES(base_commission),
                fixed_salary = VALUES(fixed_salary),
                expense_reimbursement = VALUES(expense_reimbursement),
                manual_adjustments = VALUES(manual_adjustments)
        `,
        [
          agentId,
          `${year}-${month}-01`,
          baseCommission,
          adjustments.fixed_salary,
          adjustments.expense_reimbursement,
          adjustments.manual_adjustments,
        ]
      );
    } catch (error) {
      console.error("❌ Errore nel salvataggio delle provvigioni:", error);
      throw error;
    }
  }

  // Recupera le provvigioni per il CSV o PDF
  static async getCommissionsForMonth(year, month) {
    const [data] = await pool.query(
      `
      SELECT a.nome, a.cognome, c.base_commission, c.manual_adjustments, c.total
      FROM agents_commissions c
      JOIN users a ON c.agent_id = a.id
      WHERE YEAR(c.month) = ? AND MONTH(c.month) = ?
    `,
      [year, month]
    );

    return data;
  }

  static async getCommissionsByMonth(year, month) {
    try {
      const [rows] = await pool.query(
        `SELECT 
            a.id as agent_id, 
            CONCAT(a.cognome, ' ', a.nome) AS agent_name,
            c.base_commission AS baseCommission,
            c.fixed_salary AS fixedSalary,
            c.expense_reimbursement AS expenseReimbursement,
            c.manual_adjustments AS manualAdjustments,
            c.total
        FROM agents_commissions c
        JOIN users a ON c.agent_id = a.id
        WHERE YEAR(c.month) = ? AND MONTH(c.month) = ?`,
        [year, month]
      );

      return rows;
    } catch (error) {
      console.error("❌ Errore nel recupero delle provvigioni:", error);
      throw error;
    }
  }
}

module.exports = Commission;
