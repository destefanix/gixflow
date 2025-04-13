const axios = require("axios");
const OperatorTimelog = require("../models/AstConfig");
const User = require("../models/User");

exports.fetchAndStoreTimelogs = async (req, res) => {
    try {
        const { vicidial_url, query_date } = req.body;

        if (!vicidial_url) {
            return res.status(400).json({ message: "Vicidial URL non configurato" });
        }

        const response = await axios.get(`${vicidial_url}/vicidial/AST_agent_time_detail.php`, {
            params: {
                DB: "",
                query_date: query_date,
                end_date: query_date,
                shift: "ALL",
                time_in_sec: "checked",
                report_display_type: "TEXT",
                SUBMIT: "SUBMIT"
            }
        });

        const data = response.data.split("\n").slice(1); // Saltiamo l'intestazione

        for (const row of data) {
            const columns = row.split("|").map(c => c.trim());
            if (columns.length < 7) continue;

            const ast_user = columns[0];
            const calls = parseInt(columns[1]) || 0;
            const login = parseInt(columns[2]) || 0;
            const wait = parseInt(columns[3]) || 0;
            const talk = parseInt(columns[4]) || 0;
            const dispo = parseInt(columns[5]) || 0;
            const pause = parseInt(columns[6]) || 0;

            const user = await User.findOne({ where: { ast_user } });

            if (user) {
                await OperatorTimelog.create({
                    user_id: user.id,
                    date: query_date,
                    calls,
                    login,
                    wait,
                    talk,
                    dispo,
                    pause
                });
            }
        }

        res.json({ message: "Dati salvati correttamente!" });

    } catch (error) {
        console.error("Errore nel salvataggio dei log:", error);
        res.status(500).json({ message: "Errore nel recupero dei dati Vicidial" });
    }
};

