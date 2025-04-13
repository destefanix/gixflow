const Contract = require("../models/Contract");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const Commission = require("../models/Commission");
const Adjustment = require("../models/Adjustment");
const { Parser } = require("json2csv");
const puppeteer = require("puppeteer");

const fs = require("fs");
const path = require("path");


const pool = require("../db");


// Ottenere tutti i prodotti
exports.getAllProducts = async (req, res) => {
  try {
    const showArchived = req.query.showArchived === "true";
    const products = await Product.getAll(showArchived);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dei prodotti." });
  }
};

// Ottenere un prodotto specifico
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Prodotto non trovato" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero del prodotto." });
  }
};

// Creare un nuovo prodotto
exports.createProduct = async (req, res) => {
  try {
    const { name, code, vendor_id, description } = req.body;
    if (!name || !vendor_id)
      return res
        .status(400)
        .json({ error: "Nome e Vendor ID sono obbligatori" });

    const newProductId = await Product.create({
      name,
      code,
      vendor_id,
      description,
    });
    res
      .status(201)
      .json({ message: "Prodotto creato con successo", id: newProductId });
  } catch (error) {
    res.status(500).json({ error: "Errore nella creazione del prodotto." });
  }
};

// Aggiornare un prodotto
exports.updateProduct = async (req, res) => {
  try {
    const { name, code, vendor_id, description } = req.body;
    const updated = await Product.update(req.params.id, {
      name,
      code,
      vendor_id,
      description,
    });

    if (!updated)
      return res.status(404).json({ error: "Prodotto non trovato" });
    res.json({ message: "Prodotto aggiornato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'aggiornamento del prodotto." });
  }
};

// Eliminare un prodotto
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.delete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Prodotto non trovato" });
    res.json({ message: "Prodotto eliminato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'eliminazione del prodotto." });
  }
};

// Gestisci l'archiviazione dei prodotti
exports.toggleArchiveProduct = async (req, res) => {
  try {
    const { is_archived } = req.body;
    if (is_archived === undefined)
      return res.status(400).json({ error: "Stato archiviazione mancante" });

    const updated = await Product.toggleArchive(req.params.id, is_archived);
    if (!updated)
      return res.status(404).json({ error: "Prodotto non trovato" });

    res.json({
      message: `Prodotto ${
        is_archived ? "archiviato" : "ripristinato"
      } con successo`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nell'aggiornamento dello stato archiviazione." });
  }
};

// Ottenere tutti i vendor
exports.getAllVendors = async (req, res) => {
  try {
    const showArchived = req.query.showArchived === "true";
    const vendors = await Vendor.getAll(showArchived);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dei vendor." });
  }
};

// Ottenere un vendor specifico
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.getById(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor non trovato" });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero del vendor." });
  }
};

// Creare un nuovo vendor
exports.createVendor = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Il nome è obbligatorio" });

    const newVendorId = await Vendor.create({ name, description });
    res
      .status(201)
      .json({ message: "Vendor creato con successo", id: newVendorId });
  } catch (error) {
    res.status(500).json({ error: "Errore nella creazione del vendor." });
  }
};

// Aggiornare un vendor
exports.updateVendor = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await Vendor.update(req.params.id, { name, description });

    if (!updated) return res.status(404).json({ error: "Vendor non trovato" });
    res.json({ message: "Vendor aggiornato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'aggiornamento del vendor." });
  }
};

// Archiviare / Ripristinare un vendor
exports.toggleArchiveVendor = async (req, res) => {
  try {
    const { is_archived } = req.body;

    if (is_archived === undefined) {
      return res.status(400).json({ error: "Stato archiviazione mancante" });
    }

    const updated = await Vendor.toggleArchive(req.params.id, is_archived);
    if (!updated) return res.status(404).json({ error: "Vendor non trovato" });

    res.json({
      message: `Vendor ${
        is_archived ? "archiviato" : "ripristinato"
      } con successo`,
    });
  } catch (error) {
    console.error("Errore nell'archiviazione del vendor:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Eliminare un vendor
exports.deleteVendor = async (req, res) => {
  try {
    const deleted = await Vendor.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Vendor non trovato" });
    res.json({ message: "Vendor eliminato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'eliminazione del vendor." });
  }
};

// Ottenere tutte le provvigioni
exports.getAllCommissions = async (req, res) => {
  try {
    const showArchived = req.query.showArchived === "true";

    const commissions = await Commission.getAll(showArchived);
    res.json(commissions);
  } catch (error) {
    console.error("Errore nel recupero delle provvigioni:", error);
    res.status(500).json({ error: "Errore nel recupero delle provvigioni." });
  }
};

// Ottenere una singola provvigione per ID
exports.getCommissionById = async (req, res) => {
  try {
    const commission = await Commission.getById(req.params.id);
    if (!commission)
      return res.status(404).json({ error: "Provvigione non trovata" });
    res.json(commission);
  } catch (error) {
    console.error("Errore nel recupero della provvigione:", error);
    res.status(500).json({ error: "Errore nel recupero della provvigione." });
  }
};

// Creare una nuova provvigione
exports.createCommission = async (req, res) => {
  try {
    const { product_id, description, commission, valid_from, valid_to } =
      req.body;
    if (!product_id || !commission || !valid_from || !valid_to) {
      return res
        .status(400)
        .json({ error: "Tutti i campi obbligatori devono essere compilati" });
    }

    const newCommissionId = await Commission.create({
      product_id,
      description,
      commission,
      valid_from,
      valid_to,
    });
    res.status(201).json({
      message: "Provvigione creata con successo",
      id: newCommissionId,
    });
  } catch (error) {
    console.error("Errore nella creazione della provvigione:", error);
    res
      .status(500)
      .json({ error: "Errore nella creazione della provvigione." });
  }
};

// Aggiornare una provvigione esistente
exports.updateCommission = async (req, res) => {
  try {
    const { product_id, description, commission, valid_from, valid_to } =
      req.body;
    const updated = await Commission.update(req.params.id, {
      product_id,
      description,
      commission,
      valid_from,
      valid_to,
    });

    if (!updated)
      return res.status(404).json({ error: "Provvigione non trovata" });
    res.json({ message: "Provvigione aggiornata con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento della provvigione:", error);
    res
      .status(500)
      .json({ error: "Errore nell'aggiornamento della provvigione." });
  }
};

// Eliminare una provvigione
exports.deleteCommission = async (req, res) => {
  try {
    const deleted = await Commission.delete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Provvigione non trovata" });
    res.json({ message: "Provvigione eliminata con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione della provvigione:", error);
    res
      .status(500)
      .json({ error: "Errore nell'eliminazione della provvigione." });
  }
};

// Archiviare / Ripristinare una provvigione
exports.toggleArchiveCommission = async (req, res) => {
  try {
    const { is_archived } = req.body;
    const updated = await Commission.toggleArchive(req.params.id, is_archived);
    if (!updated)
      return res.status(404).json({ error: "Provvigione non trovata" });
    res.json({
      message: `Provvigione ${
        is_archived ? "archiviata" : "ripristinata"
      } con successo`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nell'aggiornamento dello stato archiviazione." });
  }
};

exports.getAllManualAdjustments = async (req, res) => {
  try {
    const showArchived = req.query.showArchived === "true"; // Controllo per archiviati
    const adjustments = await Adjustment.getAllManualAdjustments(showArchived);
    res.json(adjustments);
  } catch (error) {
    console.error("Errore nel recupero degli aggiustamenti:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Ottenere un aggiustamento manuale per ID
exports.getManualAdjustmentById = async (req, res) => {
  try {
    const adjustment = await Adjustment.getManualAdjustmentById(req.params.id);
    if (!adjustment) {
      return res.status(404).json({ error: "Aggiustamento non trovato" });
    }
    res.json(adjustment);
  } catch (error) {
    console.error("Errore nel recupero dell'aggiustamento:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Creare un nuovo aggiustamento manuale
exports.createManualAdjustment = async (req, res) => {
  try {
    const { adjustment_type_id, user_id, amount, valid_from, valid_to } =
      req.body;

    // Validazione dei dati
    if (!adjustment_type_id || !user_id || amount === undefined) {
      return res.status(400).json({ error: "Campi obbligatori mancanti" });
    }
    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "L'importo deve essere un numero positivo" });
    }
    if (!valid_from || !valid_to || new Date(valid_from) > new Date(valid_to)) {
      return res.status(400).json({ error: "Date non valide" });
    }

    // Creazione
    const newAdjustmentId = await Adjustment.createManualAdjustment(
      adjustment_type_id,
      user_id,
      amount,
      valid_from,
      valid_to
    );

    res.status(201).json({
      message: "Aggiustamento creato con successo",
      id: newAdjustmentId,
    });
  } catch (error) {
    console.error("Errore nella creazione dell'aggiustamento:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Aggiornare un aggiustamento manuale
exports.updateManualAdjustment = async (req, res) => {
  try {
    const { adjustment_type_id, user_id, amount, valid_from, valid_to } =
      req.body;

    // Validazione
    if (!adjustment_type_id || !user_id || amount === undefined) {
      return res.status(400).json({ error: "Campi obbligatori mancanti" });
    }
    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "L'importo deve essere un numero positivo" });
    }
    if (!valid_from || !valid_to || new Date(valid_from) > new Date(valid_to)) {
      return res.status(400).json({ error: "Date non valide" });
    }

    // Aggiornamento
    const updated = await Adjustment.updateManualAdjustment(
      req.params.id,
      adjustment_type_id,
      user_id,
      amount,
      valid_from,
      valid_to
    );

    if (!updated) {
      return res.status(404).json({ error: "Aggiustamento non trovato" });
    }

    res.json({ message: "Aggiustamento aggiornato con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'aggiustamento:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Eliminare un aggiustamento manuale
exports.deleteManualAdjustment = async (req, res) => {
  try {
    const deleted = await Adjustment.deleteManualAdjustment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Aggiustamento non trovato" });
    }
    res.json({ message: "Aggiustamento eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione dell'aggiustamento:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Archiviare / Ripristinare un aggiustamento manuale
exports.toggleArchiveManualAdjustment = async (req, res) => {
  try {
    const { is_archived } = req.body;

    if (is_archived === undefined) {
      return res.status(400).json({ error: "Stato archiviazione mancante" });
    }

    const updated = await Adjustment.toggleArchiveManualAdjustment(
      req.params.id,
      is_archived
    );
    if (!updated) {
      return res.status(404).json({ error: "Aggiustamento non trovato" });
    }

    res.json({
      message: `Aggiustamento ${
        is_archived ? "archiviato" : "ripristinato"
      } con successo`,
    });
  } catch (error) {
    console.error("Errore nell'archiviazione dell'aggiustamento:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// Genera una preview delle provvigioni per un mese specifico
exports.previewCommissions = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: "Anno e mese sono obbligatori" });
    }

    // 🔍 Controlliamo se la mensilità esiste già in archivio
    const [existing] = await pool.query(
      `SELECT id FROM agents_commissions WHERE YEAR(month) = ? AND MONTH(month) = ? LIMIT 1`,
      [year, month]
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ error: "Consuntivo già archiviato per questa mensilità." });
    }

    // 🟢 Procediamo con il calcolo dell'anteprima
    const agents = await pool.query(
      "SELECT id, nome, cognome FROM users WHERE role_id = 2"
    );
    let previewData = [];

    for (const agent of agents[0]) {
      const baseCommission = await Commission.getBaseCommission(
        agent.id,
        year,
        month
      );
      const adjustments = await Commission.getManualAdjustmentsByType(
        agent.id,
        year,
        month
      );
      const total =
        baseCommission +
        adjustments.fixed_salary +
        adjustments.expense_reimbursement +
        adjustments.manual_adjustments;

      previewData.push({
        agent_id: agent.id,
        agent_name: `${agent.nome} ${agent.cognome}`,
        baseCommission,
        fixedSalary: adjustments.fixed_salary,
        expenseReimbursement: adjustments.expense_reimbursement,
        manualAdjustments: adjustments.manual_adjustments,
        total,
      });
    }

    res.status(200).json(previewData);
  } catch (error) {
    console.error(
      "❌ Errore nel calcolo dell'anteprima delle provvigioni:",
      error
    );
    res.status(500).json({ error: "Errore nel calcolo dell'anteprima" });
  }
};

exports.saveCommissions = async (req, res) => {
  try {
    const { year, month, commissions } = req.body;

    if (!year || !month || !commissions || commissions.length === 0) {
      return res
        .status(400)
        .json({ error: "Dati mancanti per il salvataggio" });
    }

    for (const commission of commissions) {
      await Commission.saveCommission(
        commission.agent_id, // USIAMO commission.agent_id INVECE DI agent.id
        year,
        month,
        commission.baseCommission,
        {
          fixed_salary: commission.fixedSalary || 0,
          expense_reimbursement: commission.expenseReimbursement || 0,
          manual_adjustments: commission.manualAdjustments || 0,
        }
      );
    }

    res.status(200).json({ message: "Provvigioni salvate con successo!" });
  } catch (error) {
    console.error("Errore nel salvataggio delle provvigioni:", error);
    res.status(500).json({ error: "Errore nel salvataggio delle provvigioni" });
  }
};

exports.calculateCommissions = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: "Anno e mese sono obbligatori" });
    }

    const agents = await Commission.getAgents();
    let commissionData = [];

    for (const agent of agents) {
      const baseCommission = await Commission.getBaseCommission(
        agent.id,
        year,
        month
      );
      const adjustments = await Commission.getManualAdjustmentsByType(
        agent.id,
        year,
        month
      );
      const total =
        baseCommission +
        adjustments.fixed_salary +
        adjustments.expense_reimbursement +
        adjustments.manual_adjustments;

      await Commission.saveCommission(
        agent.id,
        year,
        month,
        baseCommission,
        adjustments
      );

      commissionData.push({
        agent_id: agent.id,
        agent_name: `${agent.nome} ${agent.cognome}`,
        baseCommission: baseCommission,
        fixedSalary: adjustments.fixed_salary,
        expenseReimbursement: adjustments.expense_reimbursement,
        manualAdjustments: adjustments.manual_adjustments,
        total:
          baseCommission +
          adjustments.fixed_salary +
          adjustments.expense_reimbursement +
          adjustments.manual_adjustments,
      });
    }

    res.status(200).json(commissionData);
  } catch (error) {
    console.error("❌ Errore nel calcolo delle provvigioni:", error);
    res.status(500).json({ error: "Errore nel calcolo" });
  }
};

// Ottenere provvigioni per un mese
exports.getCommissions = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: "Anno e mese sono obbligatori" });
    }

    const commissions = await Commission.getCommissionsByMonth(year, month);
    res.status(200).json(commissions);
  } catch (error) {
    console.error("❌ Errore nel recupero delle provvigioni:", error);
    res.status(500).json({ error: "Errore nel recupero delle provvigioni." });
  }
};

// Recupera le mensilità archiviate
exports.getArchivedCommissions = async (req, res) => {
  try {
    const [data] = await pool.query(`
      SELECT 
  YEAR(month) AS year, 
  MONTH(month) AS month,
  MAX(created_at) AS created_at, -- Prende la data più recente nel mese
  COUNT(DISTINCT agent_id) AS totalAgents, 
  SUM(total) AS totalCommission
FROM agents_commissions 
GROUP BY year, month
ORDER BY year DESC, month DESC;

    `);
    res.json(data);
  } catch (error) {
    console.error("❌ Errore nel recupero delle mensilità:", error);
    res.status(500).json({ error: "Errore nel recupero delle mensilità." });
  }
};

// Recupera i contratti per azienda e agente
exports.getContractDetails = async (req, res) => {
  const { year, month } = req.query;
  try {
    const [data] = await pool.query(
      `
      SELECT cl.ragsoc AS company, CONCAT(u.cognome, ' ', u.nome) AS agent, 
             SUM(cp.quantity * pc.commission) AS total
      FROM contracts_main cm
      JOIN users u ON cm.agent_id = u.id
      JOIN clients cl ON cm.client_id = cl.id
      JOIN contract_products cp ON cm.id = cp.contract_id
      JOIN products_commissioning pc ON cp.product_id = pc.product_id
      WHERE YEAR(cm.completion_date) = ? AND MONTH(cm.completion_date) = ?
      GROUP BY cl.ragsoc, agent;
    `,
      [year, month]
    );
    res.json(data);
  } catch (error) {
    console.error("Errore:", error);
    res.status(500).json({ error: "Errore nei dettagli contratti." });
  }
};

exports.getContractDetailsForCommissions = async (req, res) => {
  try {
    const contractId = req.params.contract_id;

    // Query per ottenere il contratto
    const [contract] = await pool.query(
      `
      SELECT 
        c.*, 
        cl.ragsoc AS client_name, 
        s.name AS status_name
      FROM contracts_main c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN contract_status s ON c.status_id = s.id
      WHERE c.id = ?
    `,
      [contractId]
    );

    if (!contract.length) {
      return res.status(404).json({ message: "Contratto non trovato" });
    }

    // Query per ottenere i prodotti con provvigioni
    const [products] = await pool.query(
      `
      SELECT 
    p.id, 
    p.name, 
    cp.quantity, 
    CAST((cp.quantity * COALESCE(pc.commission, 0)) AS DECIMAL(10,2)) AS commission
  FROM contract_products cp
  JOIN products_list p ON cp.product_id = p.id
  LEFT JOIN products_commissioning pc ON cp.product_id = pc.product_id
  WHERE cp.contract_id = ?
    `,
      [contractId]
    );

    res.json({
      contract: contract[0], // Primo oggetto dell'array
      products: products || [], // Se vuoto, restituisce un array vuoto
    });
  } catch (error) {
    console.error("❌ Errore nel recupero dettagli contratto:", error);
    res.status(500).json({ message: "Errore del server" });
  }
};

// Elimina tutte le provvigioni di una mensilità
exports.deleteCommissionMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    // Verifica parametri
    if (!year || !month) {
      return res.status(400).json({ error: "Anno e mese richiesti." });
    }

    const formattedMonth = `${year}-${String(month).padStart(2, "0")}-01`;

    console.log("🗑️ Eliminazione provvigioni per il mese:", formattedMonth);

    // Controlliamo se ci sono record da eliminare
    const [check] = await pool.query(
      "SELECT * FROM agents_commissions WHERE month = ?",
      [formattedMonth]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Nessuna provvigione trovata per questo mese." });
    }

    // 🚀 Eliminiamo tutte le provvigioni di quella mensilità
    await pool.query("DELETE FROM agents_commissions WHERE month = ?", [formattedMonth]);

    res.json({ message: `Provvigioni di ${year}-${month} eliminate con successo!` });
  } catch (error) {
    console.error("Errore nella cancellazione della mensilità:", error);
    res.status(500).json({ error: "Errore nella cancellazione della mensilità." });
  }
};

// Esporta provvigioni archiviate in PDF
exports.exportToPDF = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: "Anno e mese sono obbligatori" });
    }

    const [agents] = await pool.query(
      `SELECT 
        u.id AS agent_id,
        CONCAT(u.cognome, ' ', u.nome) AS agent_name,
        COALESCE(SUM(ac.total), 0) AS totalCommission
      FROM agents_commissions ac
      JOIN users u ON ac.agent_id = u.id
      WHERE YEAR(ac.month) = ? AND MONTH(ac.month) = ?
      GROUP BY u.id, u.cognome, u.nome
      ORDER BY u.cognome ASC`,
      [year, month]
    );

    if (agents.length === 0) {
      return res.status(404).json({ error: "Nessuna provvigione trovata." });
    }

    // **Stili CSS per il PDF**
    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Poppins, sans-serif; padding: 20px; font-size: 12px; }
            h1 { text-align: center; color: #333; font-size: 18px; margin-bottom: 10px; }
            h2 { font-size: 14px; margin-top: 20px; color: #222; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; }
            ul { margin: 0; padding: 0; list-style: none; }
            .product-list { margin-left: 10px; font-size: 11px; color: #444; }
          </style>
        </head>
        <body>
          <h1>Dettagli Provvigioni - ${month}/${year}</h1>
    `;

    for (const agent of agents) {
      htmlContent += `
        <h2>Agente: ${agent.agent_name} - Totale: ${(Number(agent.totalCommission) || 0).toFixed(2)} €</h2>
        <table>
          <tr>
            <th>Contratto</th>
            <th>Cliente</th>
            <th>Stato</th>
            <th>Prodotti</th>
          </tr>
      `;

      const [contracts] = await pool.query(
        `SELECT 
          cm.id AS contract_id, cm.contract_number, cl.ragsoc AS client_name, 
          cm.signature_date, s.name AS status_name
        FROM contracts_main cm
        JOIN clients cl ON cm.client_id = cl.id
        JOIN contract_status s ON cm.status_id = s.id
        WHERE cm.agent_id = ? AND YEAR(cm.completion_date) = ? AND MONTH(cm.completion_date) = ?
        ORDER BY cm.signature_date DESC`,
        [agent.agent_id, year, month]
      );

      if (contracts.length === 0) {
        htmlContent += `<tr><td colspan="4">Nessun contratto registrato</td></tr>`;
      } else {
        for (const contract of contracts) {
          let productDetails = "";

          const [products] = await pool.query(
            `SELECT p.name, cp.quantity, 
                    CAST((cp.quantity * COALESCE(pc.commission, 0)) AS DECIMAL(10,2)) AS commission
             FROM contract_products cp
             JOIN products_list p ON cp.product_id = p.id
             LEFT JOIN products_commissioning pc ON cp.product_id = pc.product_id
             WHERE cp.contract_id = ?`,
            [contract.contract_id]
          );

          if (products.length === 0) {
            productDetails = "<i>Nessun prodotto registrato</i>";
          } else {
            productDetails = "<ul class='product-list'>";
            products.forEach((product) => {
              productDetails += `<li>${product.name} - Quantità: ${product.quantity} - Provvigione: ${Number(product.commission).toFixed(2)} €</li>`;
            });
            productDetails += "</ul>";
          }

          htmlContent += `
            <tr>
              <td>#${contract.contract_number}</td>
              <td>${contract.client_name}</td>
              <td>${contract.status_name}</td>
              <td>${productDetails}</td>
            </tr>
          `;
        }
      }

      htmlContent += `</table>`;
    }

    htmlContent += `</body></html>`;

    const filePath = path.join(__dirname, `provvigioni_${year}_${month}.pdf`);

    // **Lancia Puppeteer e genera il PDF**
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome", // Assicurati che il percorso sia corretto
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    await page.pdf({
      path: filePath,
      format: "A4",
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      printBackground: true,
    });

    await browser.close();

    // **Invia il PDF e cancella il file temporaneo**
    res.download(filePath, (err) => {
      if (!err) {
        setTimeout(() => {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Errore eliminazione file:", unlinkErr);
          });
        }, 5000);
      }
    });

  } catch (error) {
    console.error("Errore nella generazione PDF:", error);
    res.status(500).json({ error: "Errore nella generazione PDF." });
  }
};

exports.getAgentsByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;
    const [data] = await pool.query(
      `
      SELECT 
        u.id AS agent_id,
        CONCAT(u.cognome, ' ', u.nome) AS agent_name,
        SUM(ac.total) AS totalCommission
      FROM agents_commissions ac
      JOIN users u ON ac.agent_id = u.id
      WHERE YEAR(ac.month) = ? AND MONTH(ac.month) = ?
      GROUP BY u.id, u.cognome, u.nome
      ORDER BY u.cognome ASC
    `,
      [year, month]
    );

    res.json(data);
  } catch (error) {
    console.error("❌ Errore nel recupero degli agenti:", error);
    res.status(500).json({ error: "Errore nel recupero degli agenti." });
  }
};

exports.getContractsByAgentComm = async (req, res) => {
  let agentId = parseInt(req.query.agentId, 10);
  let year = parseInt(req.query.year, 10);
  let month = parseInt(req.query.month, 10);

  if (isNaN(agentId) || isNaN(year) || isNaN(month)) {
    console.error("Parametri NON VALIDI dopo il parsing:", {
      agentId,
      year,
      month,
    });
    return res.status(400).json({ error: "Dati mancanti per la ricerca" });
  }

  const formattedMonth = `${year}-${String(month).padStart(2, "0")}`;

  try {
    // Recupero i contratti
    const [contracts] = await pool.query(
      `SELECT cm.id AS contract_id, cm.contract_number, cm.client_id, cl.ragsoc AS client_name, 
              cm.signature_date, cm.completion_date, cm.status_id, s.name AS status_name
       FROM contracts_main cm
       JOIN clients cl ON cm.client_id = cl.id
       JOIN contract_status s ON cm.status_id = s.id
       WHERE cm.agent_id = ? 
       AND cm.status_id = 2  
       AND DATE_FORMAT(cm.completion_date, '%Y-%m') = ?
       ORDER BY cm.completion_date DESC;`,
      [agentId, formattedMonth]
    );

    if (!contracts.length) {
      return res.status(404).json({ message: "Nessun contratto trovato" });
    }

    // Recupero i prodotti per ogni contratto
    for (let contract of contracts) {
      const [products] = await pool.query(
        `SELECT p.id, p.name, cp.quantity, 
                CAST((cp.quantity * COALESCE(pc.commission, 0)) AS DECIMAL(10,2)) AS commission
         FROM contract_products cp
         JOIN products_list p ON cp.product_id = p.id
         LEFT JOIN products_commissioning pc ON cp.product_id = pc.product_id
         WHERE cp.contract_id = ?`,
        [contract.contract_id]
      );

      contract.products = products || []; // Evitiamo che sia undefined
    }

    res.json(contracts);
  } catch (error) {
    console.error("Errore nel recupero contratti:", error);
    res.status(500).json({ error: "Errore nel recupero contratti." });
  }
};



