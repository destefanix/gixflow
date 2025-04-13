<template>
  <div class="smtp-container">
    <h2>Configurazione SMTP</h2>

    <!-- FORM CONFIGURAZIONE SMTP -->
    <fieldset>
      <legend>Impostazioni</legend>
      <form @submit.prevent="saveSettings">
        <div class="form-group">
          <label>Email:</label>
          <input v-model="settings.email" type="email" required />
        </div>

        <div class="form-group">
          <label>Password per App:</label>
          <input v-model="settings.password" type="password" required />
        </div>

        <div class="form-group">
          <label>Alias Email:</label>
          <input v-model="settings.alias" type="text" required />
        </div>

        <div class="modal-buttons">
          <button type="submit">Salva</button>
        </div>
      </form>
    </fieldset>

    <!-- TABELLA IMPOSTAZIONI SALVATE -->
    <fieldset>
      <legend>Impostazioni Salvate</legend>
      <table class="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Alias</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="settings.email">
            <td>{{ settings.email }}</td>
            <td>{{ settings.alias }}</td>
          </tr>
          <tr v-else>
            <td colspan="2" class="empty-row">Nessuna impostazione salvata</td>
          </tr>
        </tbody>
      </table>
    </fieldset>

    <!-- FORM TEST INVIO EMAIL -->
    <fieldset>
      <legend>Test Invio Email</legend>
      <form @submit.prevent="sendTestEmail">
        <div class="form-group">
          <label>Destinatario:</label>
          <input v-model="testEmail.to" type="email" required />
        </div>

        <div class="form-group">
          <label>Oggetto:</label>
          <input v-model="testEmail.subject" type="text" required />
        </div>

        <div class="form-group">
          <label>Messaggio:</label>
          <textarea v-model="testEmail.message" required></textarea>
        </div>

        <div class="modal-buttons">
          <button type="submit" class="generate-button">Invia Test</button>
        </div>
      </form>
    </fieldset>

    <!-- MESSAGGIO DI SUCCESSO O ERRORE -->
    <div v-if="feedback.message" :class="['feedback', feedback.success ? 'success' : 'error']">
      {{ feedback.message }}
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";
import "@/styles/toast.css";

export default {
  data() {
    return {
      settings: { email: "", password: "", alias: "" },
      testEmail: { to: "", subject: "Test SMTP", message: "Questa è una mail di test" },
      feedback: { message: "", success: true },
    };
  },
  methods: {
    async saveSettings() {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/settings/smtp`, this.settings);
        this.feedback = { message: "✅ Impostazioni salvate con successo!", success: true };
      } catch (error) {
        this.feedback = { message: "❌ Errore nel salvataggio.", success: false };
      }
    },
    async loadSettings() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/settings/smtp`);
        if (response.data.success) this.settings = response.data.settings;
      } catch (error) {
        console.error("Errore nel recupero impostazioni SMTP:", error);
      }
    },
    async sendTestEmail() {
  try {
    const response = await axios.post(`${process.env.VUE_APP_API_URL}/send-email`, this.testEmail);
    this.feedback = { message: response.data.message, success: true };
  } catch (error) {
    this.feedback = { message: "❌ Errore nell'invio della mail.", success: false };
  }
},

  },
  mounted() {
    this.loadSettings();
  },
};
</script>

<style scoped>
/* .smtp-container {
  max-width: auto;
  margin: auto;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: white;
}

h2 {
  text-align: center;
  color: var(--primary-color);
}

.form-group {
  margin-bottom: 15px;
}

textarea {
  width: 100%;
  height: 80px;
  padding: 8px;
}

.empty-row {
  text-align: center;
  font-style: italic;
  color: #999;
} */
</style>
