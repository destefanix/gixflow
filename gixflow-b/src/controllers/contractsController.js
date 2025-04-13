const pool = require("../db"); 
const minioClient = require("../minioClient");
const multer = require("multer");
const { generatePresignedUrl } = require("../utils/minioPresigner");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const getDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

const generateContractNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `C-${year}-${randomPart}`;
};

const getContractById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        c.id,
        c.client_id,
        c.appointment_id,
        cl.ragsoc AS client_name,
        cl.forma_giuridica_id,  
        fg.name AS forma_giuridica_name, 
        c.agent_id,
        CONCAT(a.nome, ' ', a.cognome) AS agent_name,
        c.contract_vendor_id,
        v.name AS vendor,
        c.status_id,
        s.name AS status_name,
        c.signature_date,
        c.creation_date,
        c.completion_date,
        c.notes
      FROM 
        contracts_main c
      LEFT JOIN 
        clients cl ON c.client_id = cl.id
      LEFT JOIN 
        legal_forms fg ON cl.forma_giuridica_id = fg.id 
      LEFT JOIN 
        users a ON c.agent_id = a.id
      LEFT JOIN 
        contract_vendors v ON c.contract_vendor_id = v.id
      LEFT JOIN 
        contract_status s ON c.status_id = s.id
      WHERE c.id = ?
      LIMIT 1;
    `;

    const [contracts] = await pool.query(query, [id]);

    if (!contracts.length) {
      return res.status(404).json({ message: "Contratto non trovato." });
    }

    res.status(200).json(contracts[0]); // singolo oggetto!
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero del contratto:", error);
    next(error);
  }
};

// Crea un nuovo contratto perfettamente funzionante
const createContract = async (req, res, next) => {
  try {
    const data = req.body;

    const contractData = {
      contract_number: data.contract_number || generateContractNumber(),

      client_id: data.client_id,
      appointment_id: data.appointment_id,
      agent_id: data.agent_id,
      backoffice_id: data.backoffice_id || null,
      contract_type_id: data.contract_type_id || 1,
      contract_vendor_id: data.contract_vendor_id,
      status_id: data.status_id,
      notes: data.notes || null,
      temporary: data.temporary || false,
    };

    const query = `
      INSERT INTO contracts_main (
        contract_number, client_id, appointment_id, agent_id, backoffice_id, 
        contract_type_id, contract_vendor_id, status_id, notes, temporary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const params = [
      contractData.contract_number,
      contractData.client_id,
      contractData.appointment_id,
      contractData.agent_id,
      contractData.backoffice_id,
      contractData.contract_type_id,
      contractData.contract_vendor_id,
      contractData.status_id,
      contractData.notes,
      contractData.temporary,
    ];

    const [result] = await pool.query(query, params);

    res.status(201).json({
      message: "Contratto creato con successo.",
      contract_id: result.insertId,
    });
  } catch (error) {
    console.error("[DEBUG] Errore nella creazione del contratto:", error);
    next(error);
  }
};

// Ottiene tutti i contratti dal database
const getAllContracts = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.client_id,
        c.appointment_id,
        cl.ragsoc AS client_name,
        cl.forma_giuridica_id,  
        fg.name AS forma_giuridica_name, 
        c.agent_id,
        CONCAT(a.nome, ' ', a.cognome) AS agent_name,
        c.contract_vendor_id,
        v.name AS vendor,
        c.status_id,
        s.name AS status_name,
        c.signature_date,
        c.creation_date,
        c.completion_date,
        c.notes
      FROM 
        contracts_main c
      LEFT JOIN 
        clients cl ON c.client_id = cl.id
      LEFT JOIN 
        legal_forms fg ON cl.forma_giuridica_id = fg.id 
      LEFT JOIN 
        users a ON c.agent_id = a.id
      LEFT JOIN 
        contract_vendors v ON c.contract_vendor_id = v.id
      LEFT JOIN 
        contract_status s ON c.status_id = s.id;
    `;

    const [contracts] = await pool.query(query);

    res.status(200).json(contracts);
  } catch (error) {
    console.error("[DEBUG] Errore durante il recupero dei contratti:", error);
    next(error);
  }
};

// Ottieni gli stati dei contratti
const getContractStatuses = async (req, res, next) => {
  try {
    const [statuses] = await pool.query(`
      SELECT id, name, description
      FROM contract_status
    `);
    res.json(statuses);
  } catch (error) {
    console.error(
      "Errore durante il recupero degli stati dei contratti:",
      error
    );
    next(error);
  }
};

// Aggiorna un contratto
const updateContract = async (req, res, next) => {
  const { id } = req.params;
  const { client_id, agent_id, status_id, completion_date, notes, contract_vendor_id } = req.body;

  try {
    const safeCompletionDate = status_id === 1 ? null : completion_date;

    const query = `
      UPDATE contracts_main
      SET client_id = ?, agent_id = ?, status_id = ?, completion_date = ?, notes = ?, contract_vendor_id = ?
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [
      client_id,
      agent_id,
      status_id,
      safeCompletionDate,
      notes,
      contract_vendor_id, // ✅ Aggiunto qui
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contratto non trovato." });
    }

    res.status(200).json({ message: "Contratto aggiornato con successo." });
  } catch (error) {
    console.error("Errore durante l'aggiornamento del contratto:", error);
    next(error);
  }
};

// Ottieni i documenti associati ad un contratto
const getContractDocuments = async (req, res, next) => {
  const { contract_id } = req.params;

  try {
    const query = `
      SELECT 
        d.id,
        d.client_id,
        d.contract_id,
        d.document_type_id,
        t.description AS document_description,
        d.file_name,
        d.file_path,
        d.upload_date
      FROM contract_documents d
      LEFT JOIN documents_template t ON d.document_type_id = t.id
      WHERE d.contract_id = ?
    `;

    const [documents] = await pool.query(query, [contract_id]);

    // Recuperiamo la dimensione da MinIO
    for (let doc of documents) {
      try {
        const stats = await minioClient.statObject("gix-flow", doc.file_path);
        doc.size = stats.size; // Assegniamo la dimensione
      } catch (error) {
        console.error(
          `[DEBUG] Errore nel recupero della dimensione di ${doc.file_path}:`,
          error
        );
        doc.size = 0; // Se fallisce, assegniamo 0 KB per evitare `NaN`
      }
    }

    res.status(200).json(documents);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero dei documenti:", error);
    next(error);
  }
};

// Elimina un prodotto associato a un contratto specifico
const deleteContractProduct = async (req, res, next) => {
  const { contractId, productId } = req.params;

  console.log(
    `[DEBUG] Eliminazione prodotto - Contratto: ${contractId}, Prodotto: ${productId}`
  );

  if (!contractId || !productId) {
    console.log("[DEBUG] Errore: Dati mancanti per la rimozione.");
    return res.status(400).json({ error: "Dati mancanti per la rimozione." });
  }

  try {
    console.log("[DEBUG] STO PER ESEGUIRE LA QUERY...");

    const query = `DELETE FROM contract_products WHERE contract_id = ? AND product_id = ?`;
    const [result] = await pool.query(query, [contractId, productId]);

    console.log("[DEBUG] Risultato query DELETE:", result);

    if (result.affectedRows === 0) {
      console.log("[DEBUG] Prodotto non trovato nel contratto.");
      return res
        .status(404)
        .json({ error: "Prodotto non trovato nel contratto." });
    }

    console.log("[DEBUG] Prodotto eliminato con successo!");
    res.status(200).json({ message: "Prodotto rimosso con successo." });
  } catch (error) {
    console.error("[DEBUG] ERRORE SQL:", error);
    next(error);
  }
};

// Carica i documenti di un contratto in MinIO e li registra nel database
const uploadContractDocuments = [
  upload.array("files", 10), // Middleware multer direttamente qui
  async (req, res) => {
    try {
      console.log("[DEBUG] File ricevuti:", req.files);
      console.log("[DEBUG] Corpo della richiesta:", req.body);

      const { client_id, contract_id } = req.body;
      let documentTypeIds = req.body.document_type_id;

      if (!client_id || !contract_id || !documentTypeIds) {
        return res.status(400).json({
          error: "Client ID, Contract ID o Document Type ID mancante.",
        });
      }

      if (!Array.isArray(documentTypeIds)) {
        documentTypeIds = [documentTypeIds];
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nessun file caricato." });
      }

      const queryClient = `SELECT ragsoc FROM clients WHERE id = ?`;
      const [client] = await pool.query(queryClient, [client_id]);

      if (!client.length) {
        return res.status(404).json({ error: "Cliente non trovato." });
      }

      const clientName = client[0].ragsoc.replace(/\s+/g, "_");
      let uploadedFiles = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const documentTypeId = documentTypeIds[i] || null;

        console.log(
          `[DEBUG] File ${file.originalname} → Tipo Documento: ${documentTypeId}`
        );

        if (!documentTypeId) {
          return res.status(400).json({
            error: `Tipo di documento mancante per ${file.originalname}`,
          });
        }

        const queryDocType = `SELECT description FROM documents_template WHERE id = ?`;
        const [docType] = await pool.query(queryDocType, [documentTypeId]);

        if (!docType.length) {
          return res.status(404).json({
            error: `Tipo di documento ${documentTypeId} non trovato.`,
          });
        }

        const documentDescription = docType[0].description;
        const folderName = `contracts/${clientName}/${contract_id}`;
        const objectName = `${folderName}/${file.originalname}`;

        try {
          await minioClient.putObject("gix-flow", objectName, file.buffer);
          console.log(`[DEBUG] File ${file.originalname} caricato su MinIO`);

          await minioClient.setObjectTagging("gix-flow", objectName, {
            document_type: documentDescription,
          });
          console.log(`[DEBUG] Tagging su MinIO: ${documentDescription}`);

          await pool.query(
            `INSERT INTO contract_documents (client_id, contract_id, document_type_id, file_name, file_path)
             VALUES (?, ?, ?, ?, ?)`,
            [
              client_id,
              contract_id,
              documentTypeId,
              file.originalname,
              objectName,
            ]
          );

          console.log(
            `[DEBUG] File ${file.originalname} salvato nel database!`
          );
          uploadedFiles.push(objectName);
        } catch (error) {
          console.error("[DEBUG] Errore MinIO:", error);
          return res
            .status(500)
            .json({ error: "Errore durante il caricamento su MinIO." });
        }
      }

      res
        .status(200)
        .json({ message: "File caricati con successo!", files: uploadedFiles });
    } catch (error) {
      console.error("[DEBUG] Errore generale upload:", error);
      next(error);
    }
  },
];

// Ottiene gli appuntamenti con stato positivo (status_id = 6)
const getPositiveAppointments = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        a.id, 
        a.user_id, 
        a.operator_id,
        a.agent_id,
        a.status_id,
        s.name AS status_name, -- Nome dello stato
        a.date_start, 
        a.date_end, 
        a.client_id, 
        c.ragsoc AS client_name, 
        c.codice_fiscale,
        c.partita_iva,
        c.telefono,
        c.email,
        c.indirizzo,
        c.city,
        c.provincia,
        c.cap,
        c.ref_nome,
        c.ref_cognome,
        c.ref_ruolo,
        c.ref_email,
        c.ref_telefono,
        a.contract_id, -- Campo aggiunto
        CONCAT(ua.nome, ' ', ua.cognome) AS agent_name,  -- Nome e cognome dell'agente
        CONCAT(uo.nome, ' ', uo.cognome) AS operator_name -- Nome e cognome dell'operatore
      FROM appointments a
      LEFT JOIN users ua ON a.agent_id = ua.id  -- Join per l'agente
      LEFT JOIN users uo ON a.operator_id = uo.id  -- Join per l'operatore
      LEFT JOIN clients c ON a.client_id = c.id  -- Join per il cliente
      LEFT JOIN appointment_status s ON a.status_id = s.id  -- Join per il nome dello stato
      WHERE a.status_id = 6
      ORDER BY a.date_start DESC
      LIMIT 20;
    `;

    const [appointments] = await pool.query(query);

    res.json(appointments);
  } catch (error) {
    console.error(
      "[DEBUG] Errore durante il recupero degli appuntamenti:",
      error
    );
    next(error);
  }
};

// Elimina un contratto e i prodotti associati
const deleteContract = async (req, res, next) => {
  const { id } = req.params;
  const { newStatusId = 6 } = req.body; // Lo stato di default è "Positivo" (6)

  try {
    console.log(`[DEBUG] Tentativo di eliminare contratto ID: ${id}`);

    // Recuperiamo l'appuntamento associato
    const queryAppointment = `SELECT appointment_id FROM contracts_main WHERE id = ?`;
    const [appointmentResult] = await pool.query(queryAppointment, [id]);

    let appointmentId = null;
    if (appointmentResult.length > 0) {
      appointmentId = appointmentResult[0].appointment_id;
      console.log(`[DEBUG] Appuntamento associato: ID ${appointmentId}`);
    }

    // Eliminare i documenti su MinIO
    const queryDocs = `SELECT file_path FROM contract_documents WHERE contract_id = ?`;
    const [documents] = await pool.query(queryDocs, [id]);

    if (documents.length > 0) {
      for (const doc of documents) {
        try {
          await minioClient.removeObject("gix-flow", doc.file_path);
          console.log(`[DEBUG] File rimosso da MinIO: ${doc.file_path}`);
        } catch (minioError) {
          console.error(
            `[DEBUG] Errore eliminazione file MinIO: ${doc.file_path}`,
            minioError
          );
        }
      }

      const deleteDocsQuery = `DELETE FROM contract_documents WHERE contract_id = ?`;
      await pool.query(deleteDocsQuery, [id]);
      console.log(`[DEBUG] Documenti eliminati dal database.`);
    }

    // Eliminare i prodotti associati
    const deleteProductsQuery = `DELETE FROM contract_products WHERE contract_id = ?`;
    await pool.query(deleteProductsQuery, [id]);
    console.log(`[DEBUG] Prodotti del contratto eliminati.`);

    // Eliminare il contratto
    const deleteContractQuery = `DELETE FROM contracts_main WHERE id = ?`;
    const [contractResult] = await pool.query(deleteContractQuery, [id]);

    if (contractResult.affectedRows === 0) {
      console.log(`[DEBUG] Contratto non trovato ID: ${id}`);
      return res.status(404).json({ message: "Contratto non trovato." });
    }

    console.log(`[DEBUG] Contratto eliminato con successo!`);

    // Se esiste un appuntamento, aggiorniamo lo stato con il valore ricevuto
    if (appointmentId) {
      const updateAppointmentQuery = `UPDATE appointments SET status_id = ? WHERE id = ?`;
      await pool.query(updateAppointmentQuery, [newStatusId, appointmentId]);
      console.log(
        `[DEBUG] Stato appuntamento ${appointmentId} aggiornato a ${newStatusId}`
      );
    }

    res.status(200).json({ message: "Contratto eliminato con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore durante l'eliminazione del contratto:",
      error
    );
    next(error);
  }
};

// Ottiene tutti i vendor (fornitori di contratti)
const getVendors = async (req, res, next) => {
  try {
    const [vendors] = await pool.query("SELECT * FROM contract_vendors");
    res.json(vendors);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero dei vendor:", error);
    next(error);
  }
};

// Ottiene i prodotti filtrati per vendor_id
const getProductsByVendor = async (req, res, next) => {
  const { vendor_id } = req.query;

  if (!vendor_id) {
    return res.status(400).json({ error: "ID vendor richiesto" });
  }

  try {
    const [products] = await pool.query(
      `SELECT id, name, description, code FROM products_list WHERE vendor_id = ?`,
      [vendor_id]
    );

    res.json(products);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero dei prodotti:", error);
    next(error);
  }
};

// Ottiene tutti i tipi di documenti
const getDocumentTypes = async (req, res, next) => {
  try {
    const [documentTypes] = await pool.query(
      "SELECT * FROM documents_template"
    );
    res.json(documentTypes);
  } catch (error) {
    console.error("[DEBUG] Errore nel recupero dei tipi di documenti:", error);
    next(error);
  }
};

// Aggiunge un prodotto a un contratto
const addProductToContract = async (req, res, next) => {
  const { id } = req.params;
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  try {
    // Controlliamo se il contratto esiste
    const [contractCheck] = await pool.query(
      "SELECT id FROM contracts_main WHERE id = ?",
      [id]
    );

    if (contractCheck.length === 0) {
      return res.status(404).json({ error: "Contratto non trovato" });
    }

    // Inseriamo il prodotto nel contratto
    const insertQuery = `
      INSERT INTO contract_products (contract_id, product_id, quantity)
      VALUES (?, ?, ?)
    `;
    await pool.query(insertQuery, [id, product_id, quantity]);

    res
      .status(201)
      .json({ message: "Prodotto aggiunto al contratto con successo" });
  } catch (error) {
    console.error(
      "[DEBUG] Errore durante l'aggiunta del prodotto al contratto:",
      error
    );
    next(error);
  }
};

// Confermiamo il contratto cambiando gli attributi temporary, note e signature_date
const confirmContract = async (req, res, next) => {
  const { id } = req.params;
  let { notes, signature_date } = req.body;

  // Se la data è presente, convertiamola nel formato MySQL
  if (signature_date) {
    signature_date = signature_date.split("T")[0] + " " + "00:00:00";
  }

  try {
    const query = `
      UPDATE contracts_main
      SET temporary = false, signature_date = ?, notes = ?
      WHERE id = ?;
    `;

    const [result] = await pool.query(query, [signature_date, notes, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contratto non trovato." });
    }

    console.log("Contratto aggiornato con successo!");
    res.status(200).json({ message: "Contratto confermato con successo." });
  } catch (error) {
    console.error("Errore nella conferma del contratto:", error);
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status_id } = req.body;

  if (!status_id) {
    return res.status(400).json({ error: "ID stato richiesto." });
  }

  try {
    const query = `UPDATE appointments SET status_id = ? WHERE id = ?`;
    const [result] = await pool.query(query, [status_id, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appuntamento non trovato." });
    }

    res
      .status(200)
      .json({ message: "Stato appuntamento aggiornato con successo." });
  } catch (error) {
    console.error(
      "[DEBUG] Errore nell'aggiornamento dello stato dell'appuntamento:",
      error
    );
    next(error);
  }
};

const getContractProducts = async (req, res, next) => {
  try {
    const { id: contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({ message: "ID contratto mancante" });
    }

    // Verifica se il contratto esiste
    const checkQuery = "SELECT id FROM contracts_main WHERE id = ?";
    const [contractExists] = await pool.query(checkQuery, [contractId]);

    if (contractExists.length === 0) {
      return res.status(404).json({ message: "Contratto non trovato" });
    }

    // Recupera i prodotti associati al contratto
    const query = `
      SELECT 
        cp.id AS contract_product_id,
        cp.product_id,
        p.name AS product_name,
        cp.quantity
      FROM contract_products cp
      LEFT JOIN products_list p ON cp.product_id = p.id
      WHERE cp.contract_id = ?
    `;

    const [products] = await pool.query(query, [contractId]);

    res.json(products);
  } catch (error) {
    console.error("❌ Errore nel recupero dei prodotti del contratto:", error);
    next(error);
  }
};

const getContractProductsWithDetails = async (req, res, next) => {
  try {
    const { id: contractId } = req.params;
    console.log("📥 RICHIESTA DETTAGLI PRODOTTI PER CONTRATTO:", contractId);

    if (!contractId) {
      return res.status(400).json({ message: "ID contratto mancante" });
    }

    const query = `
      SELECT 
        cp.product_id, 
        cp.quantity, 
        p.name AS product_name, 
        p.code AS product_code,  -- ✅ Aggiunto codice prodotto
        p.description AS product_description,  -- ✅ Aggiunta descrizione
        v.name AS vendor_name
      FROM contract_products cp
      JOIN products_list p ON cp.product_id = p.id
      JOIN contract_vendors v ON p.vendor_id = v.id
      WHERE cp.contract_id = ?
    `;

    const [products] = await pool.query(query, [contractId]);

    if (!products.length) {
      return res.status(404).json({ message: "Nessun prodotto trovato" });
    }

    res.json(products);
  } catch (error) {
    console.error("❌ Errore nel recupero dei dettagli dei prodotti:", error);
    next(error);
  }
};

const deleteContractDocument = async (req, res, next) => {
  const { contract_id, document_id } = req.params;

  if (!contract_id || !document_id) {
    return res.status(400).json({ error: "Dati mancanti per la rimozione." });
  }

  try {
    // Recuperiamo il percorso del file su MinIO
    const query = `SELECT file_path FROM contract_documents WHERE id = ? AND contract_id = ?`;
    const [document] = await pool.query(query, [document_id, contract_id]);

    if (document.length === 0) {
      return res.status(404).json({ error: "Documento non trovato." });
    }

    const filePath = document[0].file_path;

    // Eliminiamo il file da MinIO
    await minioClient.removeObject("gix-flow", filePath);
    console.log(`[DEBUG] File rimosso da MinIO: ${filePath}`);

    // Rimuoviamo il record dal database
    await pool.query(`DELETE FROM contract_documents WHERE id = ?`, [
      document_id,
    ]);

    res.json({ message: "Documento rimosso con successo." });
  } catch (error) {
    console.error("[DEBUG] Errore nella rimozione del documento:", error);
    next(error);
  }
};

const getPresignedUrl = async (req, res) => {
  const { id: documentId } = req.params;

  if (!documentId) {
    return res.status(400).json({ error: "Parametro documentId mancante." });
  }

  try {
    const [rows] = await pool.query(
      `SELECT file_path FROM contract_documents WHERE id = ?`,
      [documentId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Documento non trovato." });
    }

    const filePath = rows[0].file_path;

    const signedUrl = await generatePresignedUrl("gix-flow", filePath);
    return res.json({ url: signedUrl });
  } catch (error) {
    console.error("❌ Errore generazione URL firmata:", error);
    return res.status(500).json({ error: "Errore nella generazione della URL firmata" });
  }
};



module.exports = {
  getDateRange,
  generateContractNumber,
  getContractById,
  createContract,
  getAllContracts,
  getContractStatuses,
  updateContract,
  getContractDocuments,
  deleteContractProduct,
  uploadContractDocuments,
  getPositiveAppointments,
  deleteContract,
  getVendors,
  getProductsByVendor,
  getDocumentTypes,
  addProductToContract,
  confirmContract,
  updateAppointmentStatus,
  getContractProducts,
  getContractProductsWithDetails,
  deleteContractDocument,
  getPresignedUrl,
};
