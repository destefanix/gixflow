<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>
        <i class="fa-solid fa-paper-plane icon-green"></i> Invia Report via
        Email
      </h2>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="recipients">Destinatari</label>
          <textarea
            id="recipients"
            v-model="recipients"
            placeholder="Inserisci una o più email separate da virgola"
            rows="3"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="subject">Oggetto</label>
          <input
            type="text"
            id="subject"
            v-model="subject"
            placeholder="Oggetto dell'email"
            required
          />
        </div>

        <div class="form-group">
          <label for="message">Messaggio (HTML)</label>
          <textarea
            id="message"
            v-model="htmlContent"
            placeholder="Contenuto della mail in HTML"
            rows="6"
            required
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')">
            <i class="fa-solid fa-xmark"></i> Annulla
          </button>
          <button type="submit" :disabled="loading">
            <i class="fa-solid fa-paper-plane"></i>
            {{ loading ? "Invio in corso..." : "Invia Email" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";
import "@/styles/toast.css";

export default {
  name: "SendReportModal",
  props: {
    csvBase64: { type: String, required: true },
    reportType: { type: String, default: "appointments" },
    defaultSubject: { type: String, default: "Report Appuntamenti" },
    defaultHtml: {
      type: String,
      default: `
            <h3>Report Appuntamenti</h3>
            <p>In allegato trovi il report degli appuntamenti.</p>
            <p>Periodo: <strong>${new Date().toLocaleDateString(
              "it-IT"
            )}</strong></p>
        `,
    },
    filters: { type: Object, required: true },
    summary: { type: Object, required: true },
    total: { type: Number, required: true },
  },
  data() {
    return {
      recipients: "",
      subject: this.defaultSubject,
      htmlContent: this.defaultHtml,
      loading: false,
    };
  },
  methods: {
    async submit() {
      const emailList = this.recipients
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.includes("@"));

      if (emailList.length === 0) {
        this.$toast.show("Inserisci almeno un indirizzo email valido", {
          type: "warning",
        });
        return;
      }

      this.loading = true;

      try {
        const payload = {
          recipients: emailList,
          subject: this.subject,
          reportType: this.reportType,
          csvBase64: this.csvBase64,
          filters: this.filters,
          summary: this.summary,
          total: this.total,
        };

        await axios.post(
          `${process.env.VUE_APP_API_URL}/reports/send-email`,
          payload
        );
        this.$toast.show("Email inviata con successo.", { type: "success" });
        this.$emit("sent");
        this.$emit("close");
      } catch (err) {
        console.error("Errore invio email:", err);
        this.$toast.show("Errore durante l'invio della mail.", {
          type: "error",
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
