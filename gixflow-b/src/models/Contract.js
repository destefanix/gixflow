const pool = require("../db");

class Contract {
  // Recupero di tutti i contratti
  static async getAllContracts() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`SELECT * FROM contracts_main`);
      return result;
    } catch (error) {
      console.error("Errore nel recupero dei contratti:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async getDocumentsByContract(contract_id) {
    try {
      const [documents] = await pool.query(
        `
        SELECT 
          cd.id,
          cd.client_id,
          cd.contract_id,
          cd.file_name,
          cd.file_path,
          cd.upload_date,
          u.nome AS uploaded_by
        FROM 
          contract_documents cd
        LEFT JOIN 
          users u ON cd.uploaded_by = u.id
        WHERE 
          cd.contract_id = ?;
        `,
        [contract_id]
      );
      return documents;
    } catch (error) {
      console.error("Errore durante il recupero dei documenti:", error);
      throw error;
    }
  }

  static async addDocument(data) {
    if (
      !data.client_id ||
      !data.contract_id ||
      !data.file_name ||
      !data.file_path
    ) {
      throw new Error("I dati forniti per il documento sono incompleti.");
    }

    try {
      const query = `
        INSERT INTO contract_documents (client_id, contract_id, file_name, file_path, uploaded_by)
        VALUES (?, ?, ?, ?, ?);
      `;
      const [result] = await pool.query(query, [
        data.client_id,
        data.contract_id,
        data.file_name,
        data.file_path,
        data.uploaded_by || null,
      ]);

      console.log(
        "[DEBUG] Documento salvato nel database con ID:",
        result.insertId
      );
      return result.insertId;
    } catch (error) {
      console.error("Errore durante il salvataggio del documento:", error);
      throw new Error(
        "Errore durante il salvataggio del documento nel database."
      );
    }
  }

  static async getContractsByAgent(agentId, year, month) {
    try {
      const [rows] = await pool.query(
        `SELECT 
    cm.id, 
    cl.ragsoc AS client,  
    DATE_FORMAT(cm.completion_date, '%d/%m/%Y') AS date, 
    GROUP_CONCAT(p.name SEPARATOR ', ') AS products, 
    SUM(cp.quantity * pc.commission) AS commission
FROM contracts_main cm
JOIN contract_products cp ON cm.id = cp.contract_id
JOIN products_list p ON cp.product_id = p.id
JOIN products_commissioning pc ON cp.product_id = pc.product_id
JOIN clients cl ON cm.client_id = cl.id
WHERE cm.agent_id = ? 
AND cm.status_id = 2 
AND DATE(cm.completion_date) BETWEEN ? AND LAST_DAY(?)
GROUP BY cm.id, cl.ragsoc`,
        [agentId, `${year}-${month}-01`, `${year}-${month}-01`]
      );

      return rows;
    } catch (error) {
      console.error("Errore nel recupero dei contratti:", error);
      throw error;
    }
  }
}

module.exports = Contract;
