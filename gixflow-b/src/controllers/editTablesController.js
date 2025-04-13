const pool = require("../db");

// Forma giuridica - C
const createLegalFormTable = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Controllo dei dati obbligatori
    if (!name || !code) {
      return res.status(400).json({ error: "Nome e codice sono obbligatori." });
    }

    const query = `
        INSERT INTO legal_forms (name, code, description, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW());
      `;

    const params = [name, code, description || null];

    const [result] = await pool.query(query, params);

    res.status(201).json({
      message: "Forma giuridica creata con successo.",
      legal_form_id: result.insertId,
    });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nella creazione della forma giuridica:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore durante la creazione della forma giuridica." });
  }
};

// Forma giuridita - R
const getAllLegalFormsTable = async (req, res) => {
  try {
    const query = `
        SELECT id, name, code, description
        FROM legal_forms
        ORDER BY name ASC;
      `;

    const [legalForms] = await pool.query(query);

    res.status(200).json(legalForms);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero delle forme giuridiche:", error);
    res
      .status(500)
      .json({ error: "Errore durante il recupero delle forme giuridiche." });
  }
};

// Forma giuridica - U
const updateLegalFormTable = async (req, res) => {
  try {
    const { id } = req.params; // ID della forma giuridica da modificare
    const { name, code, description } = req.body; // Nuovi dati dal frontend

    // Controlla se l'ID esiste
    const checkQuery = `SELECT id FROM legal_forms WHERE id = ?`;
    const [existing] = await pool.query(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Forma giuridica non trovata." });
    }

    // Query per aggiornare la forma giuridica
    const updateQuery = `
        UPDATE legal_forms
        SET name = ?, code = ?, description = ?, updated_at = NOW()
        WHERE id = ?;
      `;

    await pool.query(updateQuery, [name, code, description, id]);

    res
      .status(200)
      .json({ message: "Forma giuridica aggiornata con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'aggiornamento della forma giuridica:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore durante l'aggiornamento della forma giuridica." });
  }
};

// Forma giuridica - D
const deleteLegalFormTable = async (req, res) => {
  try {
    const { id } = req.params; // ID della forma giuridica da eliminare

    // Controlla se l'ID esiste nel database
    const checkQuery = `SELECT id FROM legal_forms WHERE id = ?`;
    const [existing] = await pool.query(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Forma giuridica non trovata." });
    }

    // Query per eliminare la forma giuridica
    const deleteQuery = `DELETE FROM legal_forms WHERE id = ?`;
    await pool.query(deleteQuery, [id]);

    res
      .status(200)
      .json({ message: "Forma giuridica eliminata con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'eliminazione della forma giuridica:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore durante l'eliminazione della forma giuridica." });
  }
};

// Ruolo - C
const createRoleTable = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Il nome è obbligatorio." });
    }

    const query =
      "INSERT INTO roles (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())";
    const params = [name, description || null];

    const [result] = await pool.query(query, params);
    res.status(201).json({
      message: "Ruolo creato con successo.",
      role_id: result.insertId,
    });
  } catch (error) {
    console.error("[DEBUG] Errore nella creazione del ruolo:", error);
    res.status(500).json({ error: "Errore durante la creazione del ruolo." });
  }
};

// Ruolo - R
const getAllRolesTable = async (req, res) => {
  try {
    const query = "SELECT * FROM roles ORDER BY id";
    const [roles] = await pool.query(query);
    res.status(200).json(roles);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero dei ruoli:", error);
    res.status(500).json({ error: "Errore durante il recupero dei ruoli." });
  }
};

// Ruolo - U
const updateRoleTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const checkQuery = "SELECT id FROM roles WHERE id = ?";
    const [existing] = await pool.query(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Ruolo non trovato." });
    }

    const updateQuery =
      "UPDATE roles SET name = ?, description = ?, updated_at = NOW() WHERE id = ?";
    await pool.query(updateQuery, [name, description, id]);

    res.status(200).json({ message: "Ruolo aggiornato con successo." });
  } catch (error) {
    console.error("[DEBUG] Errore nell'aggiornamento del ruolo:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'aggiornamento del ruolo." });
  }
};

// Ruolo - D
const deleteRoleTable = async (req, res) => {
  try {
    const { id } = req.params;

    const checkQuery = "SELECT id FROM roles WHERE id = ?";
    const [existing] = await pool.query(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Ruolo non trovato." });
    }

    const deleteQuery = "DELETE FROM roles WHERE id = ?";
    await pool.query(deleteQuery, [id]);

    res.status(200).json({ message: "Ruolo eliminato con successo." });
  } catch (error) {
    console.error("[DEBUG] Errore nell'eliminazione del ruolo:", error);
    res.status(500).json({ error: "Errore durante l'eliminazione del ruolo." });
  }
};

// DocTemplate - C
const createDocumentTable = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: "La descrizione è obbligatoria." });
    }

    const query = "INSERT INTO documents_template (description) VALUES (?)";
    const params = [description];

    const [result] = await pool.query(query, params);
    res.status(201).json({
      message: "Documento creato con successo.",
      document_id: result.insertId,
    });
  } catch (error) {
    console.error("[DEBUG] Errore nella creazione del documento:", error);
    res
      .status(500)
      .json({ error: "Errore durante la creazione del documento." });
  }
};

// DocTemplate - R
const getAllDocumentsTable = async (req, res) => {
  try {
    const query = "SELECT * FROM documents_template ORDER BY id ASC";
    const [documents] = await pool.query(query);
    res.status(200).json(documents);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero dei documenti:", error);
    res
      .status(500)
      .json({ error: "Errore durante il recupero dei documenti." });
  }
};

// DocTemplate - U
const updateDocumentTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const checkQuery = "SELECT id FROM documents_template WHERE id = ?";
    const [existing] = await pool.query(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Documento non trovato." });
    }

    const updateQuery =
      "UPDATE documents_template SET description = ? WHERE id = ?";
    await pool.query(updateQuery, [description, id]);

    res.status(200).json({ message: "Documento aggiornato con successo." });
  } catch (error) {
    console.error("[DEBUG] Errore nell'aggiornamento del documento:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'aggiornamento del documento." });
  }
};

// DocTemplate - D
const deleteDocumentTable = async (req, res) => {
  try {
    const { id } = req.params;

    const checkQuery = "SELECT id FROM documents_template WHERE id = ?";
    const [existing] = await pool.query(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Documento non trovato." });
    }

    const deleteQuery = "DELETE FROM documents_template WHERE id = ?";
    await pool.query(deleteQuery, [id]);

    res.status(200).json({ message: "Documento eliminato con successo." });
  } catch (error) {
    console.error("[DEBUG] Errore nell'eliminazione del documento:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'eliminazione del documento." });
  }
};

// App_Status - C
const createAppointmentStatusTable = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Il nome è obbligatorio." });
    }

    const query =
      "INSERT INTO appointment_status (name, description) VALUES (?, ?)";
    const params = [name, description || ""];

    const [result] = await pool.query(query, params);
    res.status(201).json({
      message: "Stato appuntamento creato con successo.",
      status_id: result.insertId,
    });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nella creazione dello stato appuntamento:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore durante la creazione dello stato appuntamento." });
  }
};

// App_Status - R
const getAllAppointmentStatusesTable = async (req, res) => {
  try {
    const query = "SELECT * FROM appointment_status ORDER BY id ASC";
    const [statuses] = await pool.query(query);
    res.status(200).json(statuses);
  } catch (error) {
    console.error(
      "[DEBUG] Errore nel recupero degli stati appuntamento:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore durante il recupero degli stati appuntamento." });
  }
};

// App_Status - U
const updateAppointmentStatusTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const checkQuery = "SELECT id FROM appointment_status WHERE id = ?";
    const [existing] = await pool.query(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Stato appuntamento non trovato." });
    }

    const updateQuery =
      "UPDATE appointment_status SET name = ?, description = ? WHERE id = ?";
    await pool.query(updateQuery, [name, description, id]);

    res
      .status(200)
      .json({ message: "Stato appuntamento aggiornato con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'aggiornamento dello stato appuntamento:",
      error
    );
    res
      .status(500)
      .json({
        error: "Errore durante l'aggiornamento dello stato appuntamento.",
      });
  }
};

// App_Status - D
const deleteAppointmentStatusTable = async (req, res) => {
  try {
    const { id } = req.params;

    const checkQuery = "SELECT id FROM appointment_status WHERE id = ?";
    const [existing] = await pool.query(checkQuery, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Stato appuntamento non trovato." });
    }

    const deleteQuery = "DELETE FROM appointment_status WHERE id = ?";
    await pool.query(deleteQuery, [id]);

    res
      .status(200)
      .json({ message: "Stato appuntamento eliminato con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'eliminazione dello stato appuntamento:",
      error
    );
    res
      .status(500)
      .json({
        error: "Errore durante l'eliminazione dello stato appuntamento.",
      });
  }
};

// Contract_Status - C
const createContractStatusTable = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Nome e descrizione sono obbligatori." });
    }

    const query = `INSERT INTO contract_status (name, description) VALUES (?, ?);`;
    const [result] = await pool.query(query, [name, description]);

    res
      .status(201)
      .json({
        message: "Stato contratto creato con successo.",
        id: result.insertId,
      });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nella creazione dello stato del contratto:",
      error
    );
    res
      .status(500)
      .json({
        error: "Errore durante la creazione dello stato del contratto.",
      });
  }
};

// Contract_Status - R
const getAllContractStatusTable = async (req, res) => {
  try {
    const query = `SELECT id, name, description FROM contract_status ORDER BY id ASC;`;
    const [cstatuses] = await pool.query(query);

    res.status(200).json(cstatuses);
  } catch (error) {
    console.error(
      "[DEBUG] Errore nel recupero degli stati del contratto:",
      error
    );
    res
      .status(500)
      .json({ error: "Errore durante il recupero degli stati del contratto." });
  }
};

// Contract_Status - U
const updateContractStatusTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Controllo se lo stato esiste
    const checkQuery = `SELECT id FROM contract_status WHERE id = ?`;
    const [existing] = await pool.query(checkQuery, [id]);

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ error: "Stato del contratto non trovato." });
    }

    // Query per aggiornare lo stato
    const updateQuery = `UPDATE contract_status SET name = ?, description = ? WHERE id = ?;`;
    await pool.query(updateQuery, [name, description, id]);

    res
      .status(200)
      .json({ message: "Stato contratto aggiornato con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'aggiornamento dello stato del contratto:",
      error
    );
    res
      .status(500)
      .json({
        error: "Errore durante l'aggiornamento dello stato del contratto.",
      });
  }
};

// Contract_Status - D
const deleteContractStatusTable = async (req, res) => {
  try {
    const { id } = req.params;

    // Controllo se lo stato esiste
    const checkQuery = `SELECT id FROM contract_status WHERE id = ?`;
    const [existing] = await pool.query(checkQuery, [id]);

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ error: "Stato del contratto non trovato." });
    }

    // Query per eliminare lo stato
    const deleteQuery = `DELETE FROM contract_status WHERE id = ?;`;
    await pool.query(deleteQuery, [id]);

    res
      .status(200)
      .json({ message: "Stato contratto eliminato con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'eliminazione dello stato del contratto:",
      error
    );
    res
      .status(500)
      .json({
        error: "Errore durante l'eliminazione dello stato del contratto.",
      });
  }
};

// Adjustment - C
const createAdjustmentType = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Il nome è obbligatorio" });

    const query =
      "INSERT INTO adjustment_types (name, description) VALUES (?, ?)";
    const [result] = await pool.query(query, [name, description]);

    res
      .status(201)
      .json({ message: "Tipologia creata con successo", id: result.insertId });
  } catch (error) {
    console.error("Errore nella creazione della tipologia:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Adjustment - R
const getAllAdjustmentTypes = async (req, res) => {
  try {
    const query = "SELECT * FROM adjustment_types";
    const [types] = await pool.query(query);
    res.json(types);
  } catch (error) {
    console.error(
      "Errore nel recupero delle tipologie di aggiustamenti:",
      error
    );
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Adjustment - R-id
const getAdjustmentTypeById = async (req, res) => {
  try {
    const query = "SELECT * FROM adjustment_types WHERE id = ?";
    const [rows] = await pool.query(query, [req.params.id]);
    const type = rows[0];
    if (!type) return res.status(404).json({ error: "Tipologia non trovata" });
    res.json(type);
  } catch (error) {
    console.error("Errore nel recupero della tipologia:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Adjustment - U
const updateAdjustmentType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const query =
      "UPDATE adjustment_types SET name = ?, description = ? WHERE id = ?";
    const [result] = await pool.query(query, [
      name,
      description,
      req.params.id,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Tipologia non trovata" });
    res.json({ message: "Tipologia aggiornata con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento della tipologia:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Adjustment - D
const deleteAdjustmentType = async (req, res) => {
  try {
    const query = "DELETE FROM adjustment_types WHERE id = ?";
    const [result] = await pool.query(query, [req.params.id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Tipologia non trovata" });
    res.json({ message: "Tipologia eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della tipologia:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Recupera tutte le tariffe orarie
const getAllHourlyPayments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM operators_hourly_payment ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero delle paghe orarie:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Recupera una tariffa oraria per ID
const getHourlyPaymentById = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM operators_hourly_payment WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Tariffa non trovata" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Errore nel recupero della tariffa:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Crea una nuova tariffa oraria
const createHourlyPayment = async (req, res) => {
  try {
    const { description, payment, valid_from, valid_to } = req.body;
    if (!description || !payment || !valid_from || !valid_to) {
      return res.status(400).json({ error: "⚠️ Tutti i campi sono obbligatori" });
    }
    const query = `INSERT INTO operators_hourly_payment (description, payment, valid_from, valid_to) VALUES (?, ?, ?, ?)`;
    const [result] = await pool.query(query, [description, payment, valid_from, valid_to]);
    res.status(201).json({ message: "Tariffa creata con successo", id: result.insertId });
  } catch (error) {
    console.error("Errore nella creazione della tariffa:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Aggiorna una tariffa oraria
const updateHourlyPayment = async (req, res) => {
  try {
    const { description, payment, valid_from, valid_to } = req.body;
    const { id } = req.params;
    const query = `UPDATE operators_hourly_payment SET description = ?, payment = ?, valid_from = ?, valid_to = ? WHERE id = ?`;
    const [result] = await pool.query(query, [description, payment, valid_from, valid_to, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Tariffa non trovata" });
    res.json({ message: "Tariffa aggiornata con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento della tariffa:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Elimina una tariffa oraria
const deleteHourlyPayment = async (req, res) => {
  try {
    const query = "DELETE FROM operators_hourly_payment WHERE id = ?";
    const [result] = await pool.query(query, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Tariffa non trovata" });
    res.json({ message: "Tariffa eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della tariffa:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Recupera tutte le sedi
const getAllLocations = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM user_locations ORDER BY id ASC");
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero delle sedi:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Recupera una singola location per ID
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM user_locations WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Location non trovata" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Errore nel recupero della location:", error);
    res.status(500).json({ message: "Errore nel recupero della location" });
  }
};

// Crea una nuova sede
const createLocation = async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) return res.status(400).json({ error: "⚠️ Il nome della sede è obbligatorio" });

    const query = "INSERT INTO user_locations (location) VALUES (?)";
    const [result] = await pool.query(query, [location]);
    res.status(201).json({ message: "Sede creata con successo", id: result.insertId });
  } catch (error) {
    console.error("Errore nella creazione della sede:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Aggiorna una sede
const updateLocation = async (req, res) => {
  try {
    const { location } = req.body;
    const { id } = req.params;
    const query = "UPDATE user_locations SET location = ? WHERE id = ?";
    const [result] = await pool.query(query, [location, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Sede non trovata" });
    res.json({ message: "Sede aggiornata con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento della sede:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Elimina una sede
const deleteLocation = async (req, res) => {
  try {
    const query = "DELETE FROM user_locations WHERE id = ?";
    const [result] = await pool.query(query, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Sede non trovata" });
    res.json({ message: "Sede eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della sede:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};



module.exports = {
  createLegalFormTable,
  getAllLegalFormsTable,
  updateLegalFormTable,
  deleteLegalFormTable,
  createRoleTable,
  getAllRolesTable,
  updateRoleTable,
  deleteRoleTable,
  createDocumentTable,
  getAllDocumentsTable,
  updateDocumentTable,
  deleteDocumentTable,
  createAppointmentStatusTable,
  getAllAppointmentStatusesTable,
  updateAppointmentStatusTable,
  deleteAppointmentStatusTable,
  createContractStatusTable,
  getAllContractStatusTable,
  updateContractStatusTable,
  deleteContractStatusTable,
  getAllAdjustmentTypes,
  getAdjustmentTypeById,
  createAdjustmentType,
  updateAdjustmentType,
  deleteAdjustmentType,
  getAllHourlyPayments,
  getHourlyPaymentById,
  createHourlyPayment,
  updateHourlyPayment,
  deleteHourlyPayment,
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation, 
};
