const Vendor = require("../models/Vendor");

// Ottenere tutti i vendor
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.getAll();
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
    res.status(201).json({ message: "Vendor creato con successo", id: newVendorId });
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
