function roleMiddleware(...allowedRoleIds) {
  return (req, res, next) => {
    //console.log("[DEBUG] Ruolo ID ricevuto:", req.user.role_id);

    if (!req.user || !req.user.role_id) {
      return res
        .status(403)
        .json({
          message:
            "Accesso negato, permessi insufficienti (Nessun ruolo trovato)",
        });
    }

    if (!allowedRoleIds.includes(req.user.role_id)) {
      return res
        .status(403)
        .json({
          message:
            "Accesso negato, permessi insufficienti (Ruolo non autorizzato)",
        });
    }

    next();
  };
}

module.exports = roleMiddleware;
