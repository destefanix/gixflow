import axios from "axios";

const API_URL = process.env.VUE_APP_API_URL || "https://app.gixflow.cloud/api";

const CommissioningMain = {
  /**
   * Calcola le provvigioni per un determinato mese e anno.
   * @param {number} month - Mese (1-12)
   * @param {number} year - Anno (YYYY)
   * @returns {Promise<number>} Totale provvigioni calcolato
   */
  async calculateCommissions(month, year) {
    try {
      console.log(`[DEBUG] Richiesta calcolo provvigioni per ${month}/${year}`);

      // Controlliamo se i parametri sono validi
      if (!month || !year || month < 1 || month > 12 || year < 2000) {
        throw new Error("Mese o anno non validi!");
      }

      // Chiamata API per ottenere i dati delle provvigioni
      const response = await axios.get(`${API_URL}/calculate-commissions`, {
        params: { month, year },
      });

      // Controllo dei dati ricevuti
      if (!response.data || typeof response.data.total !== "number") {
        throw new Error("Risposta API non valida!");
      }

      console.log(`[DEBUG] Provvigioni calcolate: €${response.data.total}`);

      return response.data.total;
    } catch (error) {
      console.error("❌ Errore nel calcolo delle provvigioni:", error);
      throw error; // Riporta l'errore per essere gestito nel frontend
    }
  },
};

export default CommissioningMain;
