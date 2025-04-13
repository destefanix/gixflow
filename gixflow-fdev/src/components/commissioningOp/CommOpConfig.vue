<template>
  <div>
    <div class="header">
      <h3><i class="fa-solid fa-asterisk icon-green"></i>Configurazioni Asterisk</h3>
    </div>

    <!-- Configurazioni esistenti -->
    <div class="config-container">
      <table class="table">
        <thead>
          <tr>
            <th>Parametro</th>
            <th>Valore</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="config in configurations" :key="config.key_name">
            <td>{{ config.key_name }}</td>
            <td><input v-model="config.value" type="text" /></td>
            <td>
              <button @click="saveConfig(config)">Salva</button>
              <span v-if="config.saved" class="check-icon">✔️</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      configurations: [],
      operators: [],
    };
  },

  methods: {
    // Recupera le configurazioni iniziali
    async fetchConfig() {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/ast/config`
        );
        this.configurations = data.map((c) => ({ ...c, saved: false }));
      } catch (error) {
        console.error("Errore nel recupero delle configurazioni:", error);
      }
    },

  // Salva una configurazione esistente
    async saveConfig(config) {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/ast/config`, {
          key_name: config.key_name,
          value: config.value,
        });
        config.saved = true;
        setTimeout(() => (config.saved = false), 2000);
      } catch (error) {
        console.error("Errore nel salvataggio:", error);
      }
    },

    // Formatta la data in "gg/mm/aaaa"
    formatDate(dateString) {
      if (!dateString) return "N/D";
      return new Date(dateString).toLocaleDateString("it-IT");
    },
  },

  async created() {
    await this.fetchConfig();
   // await this.fetchOperators();
  },
};
</script>

<style scoped></style>
