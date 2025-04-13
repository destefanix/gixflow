const pool = require("../db");

class Client {
  // Creazione di un nuovo cliente
  static async createClient(data) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO clients (ragsoc, forma_giuridica_id, codice_fiscale, partita_iva, telefono, email, indirizzo, city, provincia, cap, ref_nome, ref_cognome, ref_ruolo, ref_email, ref_telefono, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.ragsoc,
          data.forma_giuridica_id,
          data.codice_fiscale,
          data.partita_iva,
          data.telefono, 
          data.email,
          data.indirizzo,
          data.city,
          data.provincia,
          data.cap,
          data.ref_nome,
          data.ref_cognome,
          data.ref_ruolo,
          data.ref_email,
          data.ref_telefono,
          data.created_by,
        ]
      );

      return result[0]; // Restituisce il risultato corretto
    } catch (error) {
      console.error("Errore durante la creazione del cliente:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Recupero di tutti i clienti
  static async getAllClients() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`
          SELECT 
            c.id,
            c.ragsoc AS ragione_sociale,
            c.forma_giuridica_id,
            lf.name AS forma_giuridica, -- Nome leggibile della forma giuridica
            c.codice_fiscale,
            c.partita_iva,
            c.telefono,
            c.email,
            c.indirizzo,
            c.city AS citta,
            c.provincia,
            c.cap,
            c.ref_nome,
            c.ref_cognome,
            c.ref_ruolo,
            c.ref_email,
            c.ref_telefono,
            c.is_active,
            c.created_by,
            c.updated_by
          FROM clients c
          LEFT JOIN legal_forms lf ON c.forma_giuridica_id = lf.id
        `);
      return result[0]; // Restituisce un array di clienti
    } catch (error) {
      console.error("Errore nel recupero dei clienti:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Cerca un cliente per un campo unico (telefono)
  static async findClientByUniqueField(uniqueValue) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        "SELECT * FROM clients WHERE telefono = ? LIMIT 1",
        [uniqueValue, uniqueValue]
      );
      return result[0]; // Restituisce il primo cliente trovato o undefined
    } catch (error) {
      console.error("Errore nel recupero del cliente:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Recupero di tutte le forme giuridiche
  static async getAllLegalForms() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`
          SELECT *
          FROM legal_forms
          ORDER BY name ASC
        `);
      return result[0];
    } catch (error) {
      console.error("Errore nel recupero delle forme giuridiche:", error);
      throw error;
    } finally {
      conn.release();
    }
  }
}

class LegalForm {
  static async getAll() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT * FROM legal_forms ORDER BY name ASC"
      );
      return rows;
    } catch (error) {
      console.error(
        "Errore durante il recupero delle forme giuridiche:",
        error
      );
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = Client;
