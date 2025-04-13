const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
 // ROTTE PUBBLICHE CHE NON DEVONO ESSERE BLOCCATE
  const publicRoutes = [
    "/api/login",
    "/api/register",
    "/api/verify-login-otp",
  ];

  if (publicRoutes.includes(req.path)) {
    console.log(`[AUTH] Accesso consentito senza token a: ${req.path}`);
    return next();
  }

  //const token = req.header("Authorization");
  const token =
    req.header("Authorization") || req.query.token || req.body.token;

  if (!token) {
    console.log("[AUTH] Nessun token trovato!");
    return res.status(401).json({ message: "Accesso negato, token mancante" });
  }

  // 🔥 Controllo se è il token di servizio
  const serviceToken = token.replace("Bearer ", "").trim();
  if (serviceToken === process.env.SERVICE_API_TOKEN) {
    console.log("[AUTH] Richiesta autenticata con token di servizio.");
    return next();
  }

  try {
    // Controllo che il token abbia almeno "Bearer " per evitare errori
    if (!token.startsWith("Bearer ")) {
      console.log("[AUTH] Formato del token non valido:", token);
      return res
        .status(400)
        .json({ message: "Token non valido (formato errato)" });
    }

    const tokenWithoutBearer = token.replace("Bearer ", "").trim();
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    console.error("[AUTH] Errore nella verifica JWT:", err.message);
    return res.status(400).json({ message: "Token non valido o scaduto" });
  }
};

module.exports = authenticate;
