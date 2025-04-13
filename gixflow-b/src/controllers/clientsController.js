const pool = require("../db"); 
const Client = require("../models/Client");
const Appointment = require("../models/Appointment"); 

exports.createClient = async (req, res) => {
  try {
    const data = req.body; // Dati per la creazione del cliente
    const result = await Client.createClient(data);
    res.status(201).json({ message: "Cliente creato con successo", result });
  } catch (error) {
    console.error("Errore durante la creazione del cliente:", error);
    res.status(500).json({ error: "Errore durante la creazione del cliente" });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.getAllClients();
    res.status(200).json(clients);
  } catch (error) {
    console.error("Errore nel recupero dei clienti:", error);
    res.status(500).json({ error: "Errore nel recupero dei clienti" });
  }
};

exports.updateClient = async (req, res) => {
  const { id } = req.params; // Ottieni l'ID dal parametro della rotta
  const data = req.body; // Dati inviati dal frontend

  try {
    const query = `
      UPDATE clients
      SET 
        ragsoc = ?, 
        forma_giuridica_id = ?, 
        partita_iva = ?, 
        codice_fiscale = ?, 
        telefono = ?, 
        email = ?, 
        indirizzo = ?, 
        city = ?, 
        provincia = ?, 
        cap = ?, 
        ref_nome = ?, 
        ref_cognome = ?, 
        ref_ruolo = ?, 
        ref_email = ?, 
        ref_telefono = ?, 
        is_active = ?
      WHERE id = ?
    `;

    // Prevenzione valori nulli tramite fallback dinamico
    const values = [
      data.ragsoc || data.ragione_sociale || null, // Supporto per `ragione_sociale` e `ragsoc`
      data.forma_giuridica_id || null,
      data.partita_iva || null,
      data.codice_fiscale || null,
      data.telefono || null,
      data.email || null,
      data.indirizzo || null,
      data.city || data.citta || null, // Supporto per entrambi i nomi
      data.provincia || null,
      data.cap || null,
      data.ref_nome || null,
      data.ref_cognome || null,
      data.ref_ruolo || null,
      data.ref_email || null,
      data.ref_telefono || null,
      data.is_active || "si", // Default: cliente attivo
      id, // ID del cliente da aggiornare
    ];

    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente non trovato." });
    }

    res.status(200).json({ message: "Cliente aggiornato con successo." });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del cliente:", error);
    res
      .status(500)
      .json({ error: "Errore durante l'aggiornamento del cliente." });
  }
};

exports.getAppointmentsByClient = async (req, res) => {
  const { clientId } = req.params;

  try {
    const appointments = await Appointment.getAppointmentsByClientId(clientId);
    if (!appointments.length) {
      return res
        .status(404)
        .json({ message: "Nessun appuntamento trovato per questo cliente." });
    }
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Errore durante il recupero degli appuntamenti:", error);
    res
      .status(500)
      .json({ error: "Errore durante il recupero degli appuntamenti." });
  }
};

exports.getContractsByClient = async (req, res, next) => {
  try {
    const clientId = req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ error: "Client ID mancante." });
    }

    const query = `
      SELECT 
        c.id AS contract_id,
        c.contract_number,
        c.client_id,
        cl.ragsoc AS client_name,
        cl.codice_fiscale,
        cl.partita_iva,
        cl.telefono,
        cl.email,
        cl.indirizzo,
        cl.city AS client_city,
        cl.provincia,
        cl.cap,
        cl.ref_nome,
        cl.ref_cognome,
        cl.ref_ruolo,
        cl.ref_email,
        cl.ref_telefono,
        cl.forma_giuridica_id,
        lf.name AS forma_giuridica_name,
        c.agent_id,
        CONCAT(u.nome, ' ', u.cognome) AS agent_name,
        c.contract_vendor_id,
        v.name AS vendor_name,
        c.status_id,
        s.name AS status_name,
        c.signature_date,
        c.creation_date,
        c.completion_date,
        c.notes,
        cp.id AS product_id,
        cp.quantity,
        pl.name AS product_name,
        pl.description AS product_description,
        pc.commission,
        pc.valid_from,
        pc.valid_to
      FROM contracts_main c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN legal_forms lf ON cl.forma_giuridica_id = lf.id
      LEFT JOIN users u ON c.agent_id = u.id
      LEFT JOIN contract_vendors v ON c.contract_vendor_id = v.id
      LEFT JOIN contract_status s ON c.status_id = s.id
      LEFT JOIN contract_products cp ON cp.contract_id = c.id
      LEFT JOIN products_list pl ON cp.product_id = pl.id
      LEFT JOIN products_commissioning pc ON cp.commission_id = pc.id
      WHERE c.client_id = ?;
    `;

    const [contracts] = await pool.query(query, [clientId]);

    if (!contracts.length) {
      return res.status(404).json({ message: "Nessun contratto trovato per il cliente specificato." });
    }

    // Raggruppa i prodotti per contratto
    const groupedContracts = {};

    for (const row of contracts) {
      const contractId = row.contract_id;

      if (!groupedContracts[contractId]) {
        groupedContracts[contractId] = {
          id: row.contract_id,
          contract_number: row.contract_number,
          client: {
            id: row.client_id,
            name: row.client_name,
            codice_fiscale: row.codice_fiscale,
            partita_iva: row.partita_iva,
            telefono: row.telefono,
            email: row.email,
            indirizzo: row.indirizzo,
            city: row.client_city,
            provincia: row.provincia,
            cap: row.cap,
            referente: {
              nome: row.ref_nome,
              cognome: row.ref_cognome,
              ruolo: row.ref_ruolo,
              email: row.ref_email,
              telefono: row.ref_telefono,
            },
            forma_giuridica: {
              id: row.forma_giuridica_id,
              name: row.forma_giuridica_name,
            },
          },
          agent: {
            id: row.agent_id,
            name: row.agent_name,
          },
          vendor: {
            id: row.contract_vendor_id,
            name: row.vendor_name,
          },
          status: {
            id: row.status_id,
            name: row.status_name,
          },
          signature_date: row.signature_date,
          creation_date: row.creation_date,
          completion_date: row.completion_date,
          notes: row.notes,
          products: [],
        };
      }

      // Aggiungi il prodotto se esiste
      if (row.product_id) {
        groupedContracts[contractId].products.push({
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          quantity: row.quantity,
          commission: row.commission,
          valid_from: row.valid_from,
          valid_to: row.valid_to,
        });
      }
    }

    const finalContracts = Object.values(groupedContracts);

    res.status(200).json(finalContracts);
  } catch (error) {
    console.error("[DEBUG] Errore durante il recupero dei contratti per client_id:", error);
    next(error);
  }
};

exports.getClientById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = "SELECT * FROM clients WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Cliente non trovato." });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Errore durante il recupero del cliente:", error);
    res.status(500).json({ error: "Errore durante il recupero del cliente." });
  }
};

exports.getAllLegalForms = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM legal_forms ORDER BY name ASC"
    );
    res.status(200).json(rows); // Restituisce tutte le forme giuridiche
  } catch (error) {
    console.error("Errore durante il recupero delle forme giuridiche:", error);
    res
      .status(500)
      .json({ error: "Errore durante il recupero delle forme giuridiche." });
  }
};
 