const pool = require("../db"); // Importa il pool dal nuovo modulo db.js
const bcrypt = require("bcryptjs"); // Aggiungi bcrypt per l'hashing della password
const speakeasy = require("speakeasy");

class User {
  static async getAllRoles() {
    const conn = await pool.getConnection();
    try {
      // Usa il destructuring `[rows]` per ottenere solo le righe
      const [rows] = await conn.query(`SELECT id, name FROM roles`);
      return rows; // Ritorna solo i dati reali
    } catch (err) {
      console.error("Errore nel recupero dei ruoli:", err);
      throw err;
    } finally {
      conn.release(); // Rilascia la connessione
    }
  }

  static async createUser(
    username,
    password,
    role_id, // Passa il role_id invece del nome del ruolo
    nome,
    cognome,
    telefono,
    codice_fiscale,
    partita_iva,
    indirizzo,
    city,
    provincia,
    cap,
    email,
    is_active,
    ast_user,
    location_id,
    hourly_payment_id
  ) {
    const conn = await pool.getConnection();
    try {
      const passwordHash = await bcrypt.hash(password, 10); // Hash della password
      const result = await conn.query(
        `
          INSERT INTO users 
            (username, password, role_id, nome, cognome, telefono, codice_fiscale, partita_iva, indirizzo, city, provincia, cap, email, is_active, ast_user, location_id, hourly_payment_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
        [
          username,
          passwordHash,
          role_id,
          nome,
          cognome,
          telefono,
          codice_fiscale,
          partita_iva,
          indirizzo,
          city,
          provincia,
          cap,
          email,
          is_active,
          ast_user,
          location_id,
          hourly_payment_id
        ]
      );
      return result;
    } catch (err) {
      console.error("Errore durante la creazione dell'utente:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getUserByUsernameOrEmail(identifier) {
    const conn = await pool.getConnection();
    try {
      const query = `
            SELECT u.*, r.name AS role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.username = ? OR u.email = ? LIMIT 1
        `;
      const [result] = await conn.query(query, [identifier, identifier]);
      return result.length > 0 ? result[0] : null;
    } catch (err) {
      console.error("Errore nel recupero dell'utente:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async updateUser(data) {
    const conn = await pool.getConnection();
    try {
      const { id, ...updates } = data; // Rimuovi l'ID dai campi aggiornati

      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates);

      const query = `UPDATE users SET ${fields} WHERE id = ?`;
      const result = await conn.query(query, [...values, id]);

      return result;
    } catch (err) {
      console.error("Errore durante l'aggiornamento dell'utente:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteUser(id) {
    const conn = await pool.getConnection();
    try {
      console.log("Deleting user with ID:", id);
      const result = await conn.query("DELETE FROM users WHERE id = ?", [id]);
      return result;
    } catch (err) {
      console.error("Error during user deletion:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async getAllUsers() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`
          SELECT 
        u.*, 
        r.name AS role_name,
        l.location AS location_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_locations l ON u.location_id = l.id
        `);
      return result; // Restituisce tutti gli utenti con il nome del ruolo
    } catch (err) {
      console.error("Errore nel recupero degli utenti:", err);
      throw err;
    } finally {
      conn.release();
    }
  }

  static async findByEmail(email) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Errore nel controllo email:", error);
      throw error;
    } finally {
      conn.release();
    }
  }
}


module.exports = User;
