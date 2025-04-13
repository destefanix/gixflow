const Product = require("../models/Product");

// Ottenere tutti i prodotti
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dei prodotti." });
  }
};

// Ottenere un prodotto specifico
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.status(404).json({ error: "Prodotto non trovato" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero del prodotto." });
  }
};

// Creare un nuovo prodotto
exports.createProduct = async (req, res) => {
  try {
    const { name, code, vendor_id, description } = req.body;
    if (!name || !vendor_id) return res.status(400).json({ error: "Nome e Vendor ID sono obbligatori" });

    const newProductId = await Product.create({ name, code, vendor_id, description });
    res.status(201).json({ message: "Prodotto creato con successo", id: newProductId });
  } catch (error) {
    res.status(500).json({ error: "Errore nella creazione del prodotto." });
  }
};

// Aggiornare un prodotto
exports.updateProduct = async (req, res) => {
  try {
    const { name, code, vendor_id, description } = req.body;
    const updated = await Product.update(req.params.id, { name, code, vendor_id, description });

    if (!updated) return res.status(404).json({ error: "Prodotto non trovato" });
    res.json({ message: "Prodotto aggiornato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'aggiornamento del prodotto." });
  }
};

// Eliminare un prodotto
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Prodotto non trovato" });
    res.json({ message: "Prodotto eliminato con successo" });
  } catch (error) {
    res.status(500).json({ error: "Errore nell'eliminazione del prodotto." });
  }
};
