const { google } = require("googleapis");
const oAuth2Client = require("../utils/gmailConfig");

// Funzione per inviare email
exports.sendEmail = async (req, res) => {
    const { to, subject, message, alias } = req.body;

    try {
        if (!req.session.tokens) return res.status(401).json({ error: "Non autenticato" });

        oAuth2Client.setCredentials(req.session.tokens);
        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

        // Costruisce il messaggio email
        const emailLines = [
            `From: ${alias} <${alias}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            message,
        ];
        const email = emailLines.join("\r\n").trim();
        const encodedEmail = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw: encodedEmail },
        });

        res.json({ success: true, messageId: response.data.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
