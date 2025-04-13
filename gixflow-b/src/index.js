// process.env.TZ = "Europe/Rome";

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Import middleware
const authMiddleware = require("./middleware/authMiddleware");
const logMiddleware = require("./middleware/logMiddleware");

// Import DB
const pool = require("./db");
const allRoutes = require("./routes/allRoutes");

// Import session per Google OAuth
const session = require("express-session");
const MemoryStore = require("memorystore")(session); // 🔹 Usa MemoryStore per mantenere le sessioni attive

// Importa ed esegue i task schedulati e l'invio delle notifiche multicanale
require("./utils/scheduledTasks");
require("./utils/notificationScheduler");


// FIX: Sposta questi PRIMA di tutto il resto
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(cors());

dotenv.config({ path: "/var/www/html/gixflow/gixflow-b/src/.env" });
// console.log("[DEBUG] JWT_SECRET attuale:", process.env.JWT_SECRET);

app.use(
  cors({
    origin: ["https://app.gixflow.cloud"],
    credentials: true,
  })
);

// Middleware di gestione errori (messo prima per catturare tutto)
app.use((err, req, res, next) => {
  console.log("🔍 [DEBUG] Middleware globale ha ricevuto un errore:", err);

  if (err.sql) {
    req.errorDetails = {
      message: err.sqlMessage || err.message,
      sql: err.sql,
      values: err.values || "N/A",
    };
    console.log("[DEBUG] Errore SQL intercettato:", req.errorDetails);
  }

  next(); // Non chiamare next(err) per evitare che Express lo ignori
});

// FIX: Usa CORS correttamente PRIMA di ogni middleware
app.use(
  cors({
    origin: "https://app.gixflow.cloud",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// IMPORTANTE: authMiddleware DEVE essere DOPO bodyParser
app.use(authMiddleware);
app.use(logMiddleware); // Attiviamo il logging per tutte le rotte CRUD

// Test connessione al DB
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ Connesso a MariaDB");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Errore di connessione:", err);
  });

// Aggiungi una rotta di test per verificare che il server risponda
app.get("/", (req, res) => {
  res.send("✅ Il server è attivo e funzionante!");
});

// Rotte principali
app.use("/api", allRoutes);

// Porta di ascolto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server in ascolto sulla porta ${PORT}`);
});

// Configura il trust proxy (se usi Apache come proxy inverso)
app.set("trust proxy", 1); 