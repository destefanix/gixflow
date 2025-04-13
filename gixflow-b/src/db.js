const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

// Crea una connessione al database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z", // Forza il timezone su UTC
  dateStrings: true, // Evita conversioni automatiche in JavaScript

});

module.exports = pool.promise(); // Utilizza il metodo `promise()` per supportare async/await

