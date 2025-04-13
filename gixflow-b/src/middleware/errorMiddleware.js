const errorMiddleware = (err, req, res, next) => {
    console.log("🔍 [DEBUG] Middleware error handling ha ricevuto un errore:", err);
  
    if (err.sql) {
      req.errorDetails = {
        message: err.sqlMessage || err.message,
        sql: err.sql,
        values: err.values || "N/A",
      };
      console.log("[DEBUG] Errore SQL intercettato:", req.errorDetails);
    }
  
    next(); // Importante: non passiamo "err" qui, per non interrompere Express
  };
  
  module.exports = errorMiddleware;
  