const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFilePath = path.join(logDir, "actions.log");

const logMiddleware = (req, res, next) => {
  const allowedMethods = ["POST", "PUT", "DELETE"];
  const isLogin = req.originalUrl.includes("/auth/login");
  const isLogout = req.originalUrl.includes("/auth/logout");

  res.on("finish", () => {
    if (allowedMethods.includes(req.method) || isLogin || isLogout) {
      const timestamp = new Date().toISOString();
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      let user = req.user || req.authenticatedUser || {
        id: "Anonymous",
        username: "Unknown",
        role: "Guest",
      };

      let logEntry = `[${timestamp}]`;

      if (isLogin) {
        logEntry += ` LOGIN | User: ${user.username} [${user.id} - ${user.role}] | IP: ${ip} | Status: ${res.statusCode}`;
      } else if (isLogout) {
        logEntry += ` LOGOUT | User: ${user.username} [${user.id} - ${user.role}] | IP: ${ip} | Status: ${res.statusCode}`;
      } else {
        let requestData = Object.keys(req.body).length ? JSON.stringify(req.body) : "EMPTY_BODY";
        logEntry += ` ${req.method} ${req.originalUrl} | User: ${user.username} [${user.id} - ${user.role}] | IP: ${ip} | Status: ${res.statusCode} | Data: ${requestData}`;
      }

      console.log("[LOG] Log registrato:", logEntry);

      fs.appendFile(logFilePath, logEntry + "\n", (err) => {
        if (err) {
          console.error("[LOG] Errore nel salvataggio del log:", err);
        }
      });
    }
  });

  next();
};

module.exports = logMiddleware;
