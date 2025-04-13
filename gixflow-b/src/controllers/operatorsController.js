const pool = require("../db");

// Recupera tutti i bonus attivi
exports.getBonuses = async (req, res) => {
  try {
    const { showArchived } = req.query;
    const query =
      showArchived === "true"
        ? "SELECT * FROM operators_bonus ORDER BY valid_from DESC"
        : "SELECT * FROM operators_bonus WHERE is_archived = 0 ORDER BY valid_from DESC";

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Errore nel recupero dei bonus operatori:", error);
    res.status(500).json({ message: "Errore nel recupero dei bonus" });
  }
};

exports.setBonus = async (req, res) => {
  try {
    let {
      rule_type,
      min_appointments,
      min_positive_appointments,
      min_hours,
      min_conversion,
      bonus_amount,
      valid_from,
      valid_to,
    } = req.body;

    // Verifica che bonus_amount abbia sempre un valore
    if (!bonus_amount) {
      return res
        .status(400)
        .json({ message: "⚠️ Devi specificare un importo per il bonus!" });
    }

    // Verifica che valid_from e valid_to siano presenti
    if (!valid_from || !valid_to) {
      return res
        .status(400)
        .json({ message: "⚠️ Devi inserire una data di validità!" });
    }

    await pool.query(
      "INSERT INTO operators_bonus (rule_type, min_appointments, min_positive_appointments, min_hours, min_conversion, bonus_amount, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        rule_type,
        min_appointments || null,
        min_positive_appointments || null,
        min_hours || null,
        min_conversion || null,
        bonus_amount,
        valid_from,
        valid_to,
      ]
    );

    res.json({ message: "✅ Bonus salvato con successo!" });
  } catch (error) {
    console.error("❌ Errore nel salvataggio del bonus:", error);
    res.status(500).json({ message: "Errore nel salvataggio del bonus" });
  }
};

exports.updateBonus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rule_type,
      min_appointments,
      min_positive_appointments,
      min_hours,
      min_conversion,
      bonus_amount,
      valid_from,
      valid_to,
    } = req.body;

    // Controllo se il bonus esiste
    const [existingBonus] = await pool.query(
      "SELECT * FROM operators_bonus WHERE id = ?",
      [id]
    );
    if (existingBonus.length === 0) {
      return res.status(404).json({ message: "❌ Bonus non trovato!" });
    }

    // Aggiornamento del bonus
    await pool.query(
      `UPDATE operators_bonus 
         SET rule_type = ?, min_appointments = ?, min_positive_appointments = ?, min_hours = ?, min_conversion = ?, 
             bonus_amount = ?, valid_from = ?, valid_to = ?
         WHERE id = ?`,
      [
        rule_type,
        min_appointments || null,
        min_positive_appointments || null,
        min_hours || null,
        min_conversion || null,
        bonus_amount,
        valid_from,
        valid_to,
        id,
      ]
    );

    res.json({ message: "Bonus aggiornato con successo!" });
  } catch (error) {
    console.error("Errore nell'aggiornamento del bonus:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento del bonus" });
  }
};

// Archivia una regola di bonus
exports.archiveBonus = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE operators_bonus SET is_archived = 1 WHERE id = ?",
      [id]
    );
    res.json({ message: "Bonus archiviato con successo!" });
  } catch (error) {
    console.error("Errore nell'archiviazione del bonus:", error);
    res.status(500).json({ message: "Errore nell'archiviazione del bonus" });
  }
};

exports.deleteBonus = async (req, res) => {
  try {
    const { id } = req.params;

    // Controllo se il bonus esiste
    const [existingBonus] = await pool.query(
      "SELECT * FROM operators_bonus WHERE id = ?",
      [id]
    );
    if (existingBonus.length === 0) {
      return res.status(404).json({ message: "❌ Bonus non trovato!" });
    }

    // Eliminazione del bonus
    await pool.query("DELETE FROM operators_bonus WHERE id = ?", [id]);

    res.json({ message: "✅ Bonus eliminato con successo!" });
  } catch (error) {
    console.error("❌ Errore nell'eliminazione del bonus:", error);
    res.status(500).json({ message: "Errore nell'eliminazione del bonus" });
  }
};

const getActiveBonuses = async (startDate, endDate) => {
  const query = `
    SELECT * FROM operators_bonus 
    WHERE valid_from <= ? AND valid_to >= ? AND is_archived = 0
  `;
  const [bonuses] = await pool.query(query, [endDate, startDate]);

  console.log("🔍 [DEBUG] Bonus attivi trovati:", bonuses); // 👀

  return bonuses;
};

const calculateBonuses = (bonuses, positiveAppointments) => {
  const operatorBonuses = {};

  bonuses.forEach((bonus) => {
    Object.keys(positiveAppointments).forEach((operatorId) => {
      const totalAppointments = positiveAppointments[operatorId] || 0;

      // Se il bonus richiede appuntamenti positivi e l'operatore ne ha abbastanza
      if (
        bonus.rule_type === "appuntamenti_positivi" &&
        totalAppointments >= (bonus.min_positive_appointments || 0)
      ) {
        operatorBonuses[operatorId] =
          (operatorBonuses[operatorId] || 0) + parseFloat(bonus.bonus_amount);
      }

      // Se il bonus è di tipo "mix" e l'operatore ha almeno un appuntamento positivo
      if (
        bonus.rule_type === "mix" &&
        totalAppointments >= (bonus.min_positive_appointments || 1) // Default a 1
      ) {
        operatorBonuses[operatorId] =
          (operatorBonuses[operatorId] || 0) + parseFloat(bonus.bonus_amount);
      }
    });
  });

  return operatorBonuses;
};

exports.generateOperatorPayroll = async (req, res) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Date di inizio e fine obbligatorie" });
    }

    console.log(
      "[DEBUG] Generazione paghe dal",
      startDate,
      "al",
      endDate,
      "con locationId:",
      locationId
    );

    // Ore lavorate e tariffa oraria (filtrando per sede se presente)
    const hourlyPayments = await getOperatorHours(
      startDate,
      endDate,
      locationId
    );
    console.log("⏳ [DEBUG] Ore lavorate:", hourlyPayments);

    // Bonus attivi nel periodo
    const activeBonuses = await getActiveBonuses(startDate, endDate);
    console.log("🎯 [DEBUG] Bonus attivi:", activeBonuses);

    // Appuntamenti positivi (filtrati per sede)
    const positiveAppointmentsData = await getPositiveAppointments(
      startDate,
      endDate,
      locationId
    );
    console.log("📌 [DEBUG] Appuntamenti positivi:", positiveAppointmentsData);

    // Calcolo bonus guadagnati
    const bonusesEarned = calculateBonuses(
      activeBonuses,
      positiveAppointmentsData
    );
    console.log("💰 [DEBUG] Bonus calcolati:", bonusesEarned);

    // Costruzione del report finale
    const payrollReport = hourlyPayments.map((entry) => {
      const operatorId = entry.user_id;
      const positiveAppointments = positiveAppointmentsData[operatorId] || 0;
      const hoursWorked = parseFloat(entry.hours_worked) || 0;
      const hourlyRate = parseFloat(entry.hourly_rate) || 0;
      const bonusEarnings = bonusesEarned[operatorId] || 0;
      const totalEarnings = hoursWorked * hourlyRate + bonusEarnings;

      return {
        user_id: operatorId,
        nome: entry.nome || "N/D",
        cognome: entry.cognome || "N/D",
        location_name: entry.location_name || "—",
        ore_totali: hoursWorked.toFixed(2),
        tariffa_oraria: hourlyRate.toFixed(2),
        appuntamenti_positivi: positiveAppointments,
        bonus: bonusEarnings.toFixed(2),
        paga_totale: totalEarnings.toFixed(2),
      };
    });

    res.json(payrollReport);
  } catch (error) {
    console.error("❌ Errore nel calcolo delle paghe:", error);
    res.status(500).json({ error: "Errore interno nel calcolo delle paghe" });
  }
};

async function getOperatorHours(startDate, endDate, locationId) {
  const baseQuery = `
    SELECT 
      u.id AS user_id,
      u.nome,
      u.cognome,
      ul.location AS location_name,
      COALESCE(SUM(ot.login), 0) AS hours_worked,
      ohp.payment AS hourly_rate
    FROM operators_timelog ot
    JOIN users u ON ot.user_id = u.id
    LEFT JOIN operators_hourly_payment ohp ON u.hourly_payment_id = ohp.id
    LEFT JOIN user_locations ul ON u.location_id = ul.id
    WHERE ot.date BETWEEN ? AND ?
      AND u.role_id = 1
      ${locationId ? "AND u.location_id = ?" : ""}
    GROUP BY u.id
    HAVING hours_worked > 0
  `;

  const params = locationId
    ? [startDate, endDate, locationId]
    : [startDate, endDate];

  const [rows] = await pool.query(baseQuery, params);
  return rows;
}

async function getPositiveAppointments(startDate, endDate, locationId) {
  const baseQuery = `
    SELECT u.id AS user_id, COUNT(a.id) AS total
    FROM appointments a
    JOIN users u ON a.operator_id = u.id
    WHERE a.status_id IN (2, 3, 6)
      AND a.date_start BETWEEN ? AND ?
      ${locationId ? 'AND u.location_id = ?' : ''}
    GROUP BY u.id;
  `;

  const params = locationId
    ? [startDate, endDate, locationId]
    : [startDate, endDate];

  const [rows] = await pool.query(baseQuery, params);

  const result = {};
  for (const row of rows) {
    result[row.user_id] = row.total;
  }

  return result;
}

