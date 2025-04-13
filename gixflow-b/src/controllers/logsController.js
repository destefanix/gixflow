const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/actions.log');

// Funzione per leggere i log dal file
const getLogs = (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Errore nella lettura del file di log:', err);
            return res.status(500).json({ error: 'Impossibile leggere il file di log' });
        }

        // Converte i log in un array (eliminando righe vuote)
        const logs = data.split('\n').filter(line => line.trim() !== '');

        res.json({ logs });
    });
};

module.exports = { getLogs };
