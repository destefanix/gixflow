const pool = require("../db");
const moment = require("moment-timezone");
class Appointment {
  
  // Creare un appuntamento da zero nel frontend Elenco Appuntamenti
  static async createAppointment(data) {
    const conn = await pool.getConnection();
    try {
      const {
        user_id,
        client_id,
        date_start,
        date_end,
        operator_id,
        agent_id,
        status_id,
        notes,
        created_by,
      } = data;

      // Convertiamo la data in formato "Europe/Rome" PRIMA di salvarla nel DB
      const formattedDateStart = moment
        .tz(date_start, "Europe/Rome")
        .format("YYYY-MM-DD HH:mm:ss");
      const formattedDateEnd = moment
        .tz(date_end, "Europe/Rome")
        .format("YYYY-MM-DD HH:mm:ss");

      const query = `
        INSERT INTO appointments (
          user_id,
          client_id,     
          date_start,
          date_end,
          operator_id,
          agent_id,
          status_id,
          notes,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await conn.query(query, [
        user_id || null,
        client_id,
        formattedDateStart, // Usa la data convertita
        formattedDateEnd, // Usa la data convertita
        operator_id,
        agent_id,
        status_id,
        notes,
        created_by
      ]);

      return result;
    } catch (err) {
      console.error("Errore durante la creazione dell'appuntamento:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  // Ottiene l'elenco di tutti gli appuntamenti
 /*  static async getAllAppointments() {
    const conn = await pool.getConnection();
    try {
      const query = `SELECT id, date_start, date_end FROM appointments`;
      const [rows] = await conn.query(query);

      // Convertiamo le date da UTC a "Europe/Rome"
      rows.forEach((row) => {
        row.date_start = moment
          .utc(row.date_start)
          .tz("Europe/Rome")
          .format("YYYY-MM-DD HH:mm:ss");
        row.date_end = moment
          .utc(row.date_end)
          .tz("Europe/Rome")
          .format("YYYY-MM-DD HH:mm:ss");
        });

      return rows;
    } catch (error) {
      console.error("Errore nel recupero degli appuntamenti:", error);
      throw error;
    } finally {
      conn.release();
    }
  } */

    static async getAllAppointments() {
      const conn = await pool.getConnection();
      try {
        const query = `
          SELECT id, date_start, date_end, creation_date, last_modified_date
          FROM appointments
        `;
        const [rows] = await conn.query(query);
    
        rows.forEach((row) => {
          row.date_start = moment
            .utc(row.date_start)
            .tz("Europe/Rome")
            .format("YYYY-MM-DD HH:mm:ss");
    
          row.date_end = moment
            .utc(row.date_end)
            .tz("Europe/Rome")
            .format("YYYY-MM-DD HH:mm:ss");
    
          if (row.creation_date) {
            row.creation_date = moment
              .utc(row.creation_date)
              .tz("Europe/Rome")
              .format("YYYY-MM-DD HH:mm:ss");
          }
    
          if (row.last_modified_date) {
            row.last_modified_date = moment
              .utc(row.last_modified_date)
              .tz("Europe/Rome")
              .format("YYYY-MM-DD HH:mm:ss");
          }
        });
    
        return rows;
      } catch (error) {
        console.error("Errore nel recupero degli appuntamenti:", error);
        throw error;
      } finally {
        conn.release();
      }
    }
    

  // Ottiene l'elenco di tutti gli appuntamenti con i dettagli dei clienti
  static async getAllAppointmentsWithClients() {
    const conn = await pool.getConnection();
    try {
      const query = `
          SELECT 
        a.id, 
        a.date_start, 
        a.date_end, 
        a.operator_id, 
        a.agent_id, 
        a.status_id, 
        s.name AS status_name,
        a.notes, 
        CONCAT(u.cognome, ' ', u.nome) AS operator_name,
        CONCAT(ua.cognome, ' ', ua.nome) AS agent_name, 
        c.ragsoc AS client_name,
        c.forma_giuridica_id,
        lf.name AS client_forma_giuridica,
        c.telefono AS client_phone,
        c.indirizzo AS client_address,
        c.city AS client_city,
        c.provincia AS client_province,
        c.cap AS client_cap,

        a.creation_date,
        a.last_modified_date,
        a.created_by,
        a.updated_by,

        CONCAT(cb.cognome, ' ', cb.nome) AS created_by_name,
        CONCAT(ub.cognome, ' ', ub.nome) AS updated_by_name

      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN legal_forms lf ON c.forma_giuridica_id = lf.id
      LEFT JOIN users u ON a.operator_id = u.id
      LEFT JOIN users ua ON a.agent_id = ua.id
      LEFT JOIN appointment_status s ON a.status_id = s.id

      LEFT JOIN users cb ON a.created_by = cb.id
      LEFT JOIN users ub ON a.updated_by = ub.id
    `;
      const [rows] = await conn.query(query);
      return rows;
    } catch (error) {
      console.error(
        "Errore nel recupero degli appuntamenti con clienti:",
        error
      );
      throw error;
    } finally {
      conn.release();
    }
  }

  // Aggiorna un appuntamento nel frontend Elenco Appuntamenti
  static async updateAppointment(id, updates) {
    const conn = await pool.getConnection();

    try {
      // Recupera i dati esistenti per l'appuntamento
      const [existingDataRows] = await conn.query(
        "SELECT * FROM appointments WHERE id = ?",
        [id]
      );

      if (!existingDataRows.length) {
        throw new Error(`Appuntamento con id ${id} non trovato.`);
      }

      const existingData = existingDataRows[0];

      // Funzione per formattare le date per MySQL
      const formatDateForMySQL = (isoDate) =>
        isoDate
          ? new Date(isoDate).toISOString().slice(0, 19).replace("T", " ")
          : null;

      /* const sanitizedUpdates = {
        ...existingData,
        ...updates,
        date_start: updates.date_start || existingData.date_start,
        date_end: updates.date_end || existingData.date_end,
      }; */

      const sanitizedUpdates = {
        ...existingData,
        ...updates,
        date_start: updates.date_start || existingData.date_start,
        date_end: updates.date_end || existingData.date_end,
        updated_by: updates.updated_by || null,
      };
      
      // ❌ Rimuovi campi gestiti automaticamente da MySQL
      delete sanitizedUpdates.last_modified_date;
      
      

      // Costruisci la query dinamica
      const fields = Object.keys(sanitizedUpdates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(sanitizedUpdates);

      const query = `UPDATE appointments SET ${fields} WHERE id = ?`;
      const [result] = await conn.query(query, [...values, id]);

      return result;
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'appuntamento:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Aggiorna un appuntamento tramite click su FullCalendar (ClickFC)
  static async updateAppointmentClickFC(id, updates) {
    const conn = await pool.getConnection();

    try {
      // Recupera i dati esistenti
      const [existingDataRows] = await conn.query(
        "SELECT * FROM appointments WHERE id = ?",
        [id]
      );

      if (!existingDataRows.length) {
        throw new Error(`Appuntamento con id ${id} non trovato.`);
      }

      const existingData = existingDataRows[0];

      // Nessuna conversione ISO → MySQL
      const sanitizedUpdates = {
        ...existingData,
        ...updates,
        date_start: updates.date_start || existingData.date_start,
        date_end: updates.date_end || existingData.date_end,
      };

      const fields = Object.keys(sanitizedUpdates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(sanitizedUpdates);

      const query = `UPDATE appointments SET ${fields} WHERE id = ?`;
      const [result] = await conn.query(query, [...values, id]);

      return result;
    } catch (error) {
      console.error("Errore durante l'aggiornamento (ClickFC):", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Aggiorna un appuntamento tramite drop su FullCalendar (ClickFC)
  static async updateAppointmentDrop(id, updates) {
    const conn = await pool.getConnection();

    try {
      // Recupera i dati esistenti per l'appuntamento
      const [existingDataRows] = await conn.query(
        "SELECT * FROM appointments WHERE id = ?",
        [id]
      );

      if (!existingDataRows.length) {
        throw new Error(`Appuntamento con id ${id} non trovato.`);
      }

      const existingData = existingDataRows[0];

      // Funzione per formattare le date per MySQL
      const formatDateForMySQL = (isoDate) =>
        isoDate
          ? new Date(isoDate).toISOString().slice(0, 19).replace("T", " ")
          : null;

      const sanitizedUpdates = {
        ...existingData,
        ...updates,
        date_start: updates.date_start || existingData.date_start,
        date_end: updates.date_end || existingData.date_end,
      };

      // Costruisci la query dinamica
      const fields = Object.keys(sanitizedUpdates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(sanitizedUpdates);

      const query = `UPDATE appointments SET ${fields} WHERE id = ?`;
      const [result] = await conn.query(query, [...values, id]);

      return result;
    } catch (error) {
      console.error("Errore durante l'aggiornamento dell'appuntamento:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Elimina un appuntamento
  static async deleteAppointment(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`DELETE FROM appointments WHERE id = ?`, [
        id,
      ]);
      return result;
    } catch (error) {
      console.error("Errore durante l'eliminazione dell'appuntamento:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Ottiene un appuntamento da ID Cliente
  static async getAppointmentsByClientId(clientId) {
    const query = `
    SELECT 
      a.id, 
      a.date_start, 
      a.notes,                     
      s.name AS status,          
      u1.nome AS agent_name, 
      u1.cognome AS agent_surname, 
      u2.nome AS operator_name, 
      u2.cognome AS operator_surname
    FROM appointments a
    LEFT JOIN appointment_status s ON a.status_id = s.id
    LEFT JOIN users u1 ON a.agent_id = u1.id
    LEFT JOIN users u2 ON a.operator_id = u2.id
    WHERE a.client_id = ?
    ORDER BY a.date_start DESC;
  `;

    const [results] = await pool.query(query, [clientId]);
    return results;
  }
}

module.exports = Appointment;