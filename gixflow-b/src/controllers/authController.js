const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");

const getDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

const getRoles = async (req, res) => {
  try {
    const roles = await User.getAllRoles(); // Ottieni i ruoli dal modello
    res.status(200).json(roles); // Restituisci solo i ruoli come JSON
  } catch (err) {
    console.error("Errore nel recupero dei ruoli:", err);
    res
      .status(500)
      .json({ message: "Errore nel recupero dei ruoli", error: err.message });
  }
};

const register = async (req, res) => {
  const {
    username,
    password,
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
  } = req.body;

  // 🛡️ Validazioni iniziali
  if (!role_id) {
    return res.status(400).json({ error: "role_id è richiesto" });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email non valida" });
  }

  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Username non valido" });
  }

  if (!password || password.trim().length < 6) {
    return res.status(400).json({ error: "Password troppo corta (minimo 6 caratteri)" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // 🔍 Controllo se email o username già esistono
    const [existingUser] = await conn.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUser.length > 0) {
      conn.release();
      return res.status(400).json({ error: "Email o Username già in uso" });
    }

    // 🔑 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 📝 Log dettagliato dei dati da inserire
    console.log("🚀 Registrazione nuovo utente con dati:", {
      username,
      hashedPassword,
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
    });

    const query = `
      INSERT INTO users 
      (username, password, role_id, nome, cognome, telefono, codice_fiscale, partita_iva, indirizzo, city, provincia, cap, email, is_active, ast_user, location_id, hourly_payment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 👀 Log della query interpolata per debug
    console.log("📄 SQL:", conn.format(query, [
      username,
      hashedPassword,
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
    ]));

    // 🛠️ Esecuzione query
    const [result] = await conn.query(query, [
      username,
      hashedPassword,
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
    ]);

    res.status(201).json({ message: "Utente creato con successo", result });

  } catch (error) {
    console.error("❌ Errore durante la registrazione:", error);
    res.status(500).json({ error: "Errore durante la registrazione" });
  } finally {
    if (conn) conn.release();
  }
};


const login = async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    const user = await User.getUserByUsernameOrEmail(usernameOrEmail);
    if (!user) return res.status(400).json({ message: "Utente non trovato" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password errata" });

    if (user.two_factor_enabled) {
      // **2FA attivo, generiamo un token temporaneo**
      const tempToken = jwt.sign(
        { id: user.id, username: user.username, twoFactorPending: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.json({ twoFactorRequired: true, tempToken });
    }

    // **Nessun 2FA, login immediato**
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "12h" });

    res.json({ token });
  } catch (err) {
    console.error("Errore nel login:", err);
    res.status(500).json({ message: "Errore durante il login" });
  }
};

const logout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: "Nessun utente autenticato" });
    }

    //console.log("[DEBUG] Logout per utente:", req.user);

    // Creiamo un clone di req.user PRIMA di resettarlo
    const userToLog = {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    };
    console.log("[DEBUG] Logout per utente:", req.user.username);

    // Aggiungiamo questa proprietà per il logMiddleware
    req.authenticatedUser = userToLog;

    // Simuliamo una disconnessione forzata (se usi sessioni o Redis, cancella il token)
    req.user = null;

    res.status(200).json({ message: "Logout effettuato con successo" });
  } catch (err) {
    console.error("[DEBUG] Errore nel logout:", err);
    res.status(500).json({ message: "Errore durante il logout" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Validazione del campo is_active
    const validIsActiveValues = ["si", "no"];
    if (updates.is_active && !validIsActiveValues.includes(updates.is_active)) {
      return res
        .status(400)
        .json({ message: "Valore non valido per is_active" });
    }

    console.log("Dati ricevuti per aggiornamento:", updates);

    const result = await User.updateUser({ id: userId, ...updates });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.status(200).json({ message: "Utente aggiornato con successo" });
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'utente:", error);
    res.status(500).json({
      message: "Errore durante l'aggiornamento dell'utente",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await User.deleteUser(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.status(200).json({ message: "Utente eliminato con successo" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({
      message: "Errore durante l'eliminazione dell'utente",
      error: err.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers(); // Usa il metodo per ottenere gli utenti dal modello
    res.status(200).json(users); // Restituisci la lista degli utenti come risposta JSON
  } catch (err) {
    console.error("Errore nel recupero degli utenti:", err);
    res.status(500).json({
      message: "Errore nel recupero degli utenti",
      error: err.message,
    });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID utente richiesto" });
  }

  try {
    const query = `
      SELECT id, nome, cognome, email, telefono, codice_fiscale, partita_iva, indirizzo, city, provincia, cap 
      FROM users 
      WHERE id = ?;
    `;
    const [user] = await pool.query(query, [id]);

    if (user.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error(
      "[DEBUG] Errore nel recupero dei dettagli dell'utente:",
      error
    );
    res.status(500).json({ error: "Errore nel recupero dell'utente." });
  }
};

// Funzioni per Area Utente e 2FA

const getUserProfile = async (req, res) => {
  try {
    // Recupera l'utente dal database usando l'ID preso dal token JWT
    const query = `
      SELECT * 
      FROM users 
      WHERE id = ?;
    `;

    const [user] = await pool.query(query, [req.user.id]);

    if (user.length === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero del profilo utente:", error);
    res.status(500).json({ error: "Errore nel recupero del profilo." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome, cognome, telefono, codice_fiscale, partita_iva, indirizzo, city, provincia, cap, email } = req.body;

    const query = `
      UPDATE users 
      SET nome = ?, cognome = ?, telefono = ?, codice_fiscale = ?, partita_iva = ?, indirizzo = ?, city = ?, provincia = ?, cap = ?, email = ? 
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [nome, cognome, telefono, codice_fiscale, partita_iva, indirizzo, city, provincia, cap, email, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utente non trovato o nessuna modifica" });
    }

    res.json({ message: "Profilo aggiornato con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento del profilo" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Prendiamo la password attuale dal DB
    const [user] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Verifichiamo che la vecchia password sia corretta
    const isMatch = await bcrypt.compare(oldPassword, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password attuale errata" });
    }

    // Hash della nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ message: "Password cambiata con successo" });
  } catch (error) {
    console.error("Errore nel cambio password:", error);
    res.status(500).json({ message: "Errore nel cambio password" });
  }
};

const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generiamo un codice segreto per l'utente
    const secret = speakeasy.generateSecret({ length: 20 });

    // Salviamo il codice nel DB
    await pool.query("UPDATE users SET two_factor_secret = ? WHERE id = ?", [secret.base32, userId]);

    // Generiamo un QR Code per Google Authenticator
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `GIXFlow (${req.user.username})`,
      issuer: "GIXFlow",
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    res.json({ qrCode });
  } catch (error) {
    console.error("Errore nell'abilitazione del 2FA:", error);
    res.status(500).json({ message: "Errore nell'abilitazione del 2FA" });
  }
};

const verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    // Recuperiamo il codice segreto dal DB
    const [user] = await pool.query("SELECT two_factor_secret FROM users WHERE id = ?", [userId]);

    if (!user[0].two_factor_secret) {
      return res.status(400).json({ message: "2FA non abilitato per questo utente" });
    }

    // Verifichiamo il codice OTP inserito dall'utente
    const verified = speakeasy.totp.verify({
      secret: user[0].two_factor_secret,
      encoding: "base32",
      token: otp,
    });

    if (!verified) {
      return res.status(400).json({ message: "Codice OTP errato" });
    }

    // Attiviamo il 2FA nel DB
    await pool.query("UPDATE users SET two_factor_enabled = 1 WHERE id = ?", [userId]);

    res.json({ message: "2FA abilitato con successo!" });
  } catch (error) {
    console.error("Errore nella verifica del 2FA:", error);
    res.status(500).json({ message: "Errore nella verifica del 2FA" });
  }
};

const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Disattiviamo il 2FA nel DB
    await pool.query("UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?", [userId]);

    res.json({ message: "2FA disabilitato" });
  } catch (error) {
    console.error("Errore nella disabilitazione del 2FA:", error);
    res.status(500).json({ message: "Errore nella disabilitazione del 2FA" });
  }
};

const verifyLoginOTP = async (req, res) => {
  try {
    const { otp, token } = req.body;

    console.log("[DEBUG] Ricevuta richiesta verifica OTP:", { otp, token });

    // Decodifichiamo il token temporaneo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[DEBUG] Token decodificato:", decoded);

    if (!decoded.id) {
      return res.status(400).json({ message: "Token non valido" });
    }

    // Recuperiamo SOLO id, username e secret 2FA
    const [user] = await pool.query(
      "SELECT id, username, two_factor_secret FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!user.length || !user[0].two_factor_secret) {
      return res.status(400).json({ message: "2FA non attivo per questo utente" });
    }

    console.log("[DEBUG] Secret 2FA recuperato:", user[0].two_factor_secret);

    // 🔥 Controlliamo l'ora del server per verificare eventuali sfasamenti
    console.log("[DEBUG] Ora del server:", new Date().toISOString());

    // Verifichiamo il codice OTP inserito
    const verified = speakeasy.totp.verify({
      secret: user[0].two_factor_secret,
      encoding: "base32",
      token: otp,
      window: 2, // 🔥 Permettiamo un margine di errore di 2 intervalli di tempo
    });

    console.log("[DEBUG] OTP verificato?", verified);

    if (!verified) {
      return res.status(400).json({ message: "Codice OTP errato" });
    }

    // ✅ A questo punto OTP è verificato, ORA recuperiamo tutti i dati utente
    const [fullUser] = await pool.query(
      `SELECT id, username, nome, cognome, email, role_id, 
              (SELECT name FROM roles WHERE id = users.role_id) AS role_name 
       FROM users WHERE id = ?`,
      [user[0].id]
    );

    if (!fullUser.length) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    console.log("[DEBUG] Dati completi utente:", fullUser[0]);

    // 🔥 Generiamo il token definitivo con TUTTI I DATI
    const newToken = jwt.sign(
      {
        id: fullUser[0].id,
        username: fullUser[0].username,
        nome: fullUser[0].nome,
        cognome: fullUser[0].cognome,
        email: fullUser[0].email,
        role_id: fullUser[0].role_id,
        role: fullUser[0].role_name, // 👈 Ruolo utente
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    console.log("[DEBUG] Nuovo token generato con ruolo:", newToken);

    res.json({ token: newToken });
  } catch (error) {
    console.error("[ERROR] Errore nella verifica OTP:", error);
    res.status(500).json({ message: "Errore nella verifica OTP" });
  }
};

// Helper per convertire role_id in nome ruolo

const getRoleName = (roleId) => {
  const roles = {
    1: "Admin",
    2: "Manager",
    3: "Operatore",
    4: "Commerciale",
    5: "Super Admin",
  };
  return roles[roleId] || "Nessun ruolo";
};





module.exports = {
  getDateRange,
  register,
  login,
  logout,
  updateUser,
  deleteUser,
  getUsers,
  getRoles,
  getUserById,
  getUserProfile,
  updateProfile,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  verifyLoginOTP,
  getRoleName,
};