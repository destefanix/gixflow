<template>
  <div class="api-keys">
    <div class="header">
      <h1>Le mie Api Keys</h1>
      <div class="actions"></div>
    </div>

    <table v-if="apiKeys.length > 0" class="api-keys-table">
      <thead>
        <tr>
          <th>API Key</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="key in apiKeys" :key="key.id">
          <td class="masked-key">
            ••••••••{{ key.api_key ? key.api_key.slice(-4) : "????" }}

            <span class="full-key" v-if="key.showFull">{{ key.api_key }}</span>
          </td>
          <td class="actions">
            <button @click="toggleKeyVisibility(key)" class="btn view">
              {{ key.showFull ? "Nascondi" : "Mostra" }}
            </button>
            <button @click="copyKey(key.api_key)" class="btn copy">
              Copia
            </button>
            <button @click="deleteKey(key.id)" class="btn delete">
              Elimina
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="no-keys">Non hai ancora generato API Keys.</p>

    <button
      @click="generateKey"
      class="btn generate"
      :disabled="apiKeys.length >= 5"
    >
      + Genera Nuova API Key
    </button>
    <p v-if="apiKeys.length >= 5" class="max-keys-warning">
      ⚠️ Hai raggiunto il limite di 5 API Keys. Elimina una chiave per generarne
      un'altra.
    </p>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

export default {
  data() {
    return {
      apiKeys: [],
    };
  },
  async mounted() {
    await this.fetchApiKeys();
  },
  methods: {
    async fetchApiKeys() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api-keys`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        this.apiKeys = response.data.map((key) => ({
          id: key.id,
          api_key: key.api_key || "", // Protezione contro undefined
          showFull: false, // Imposta showFull a false di default
        }));
      } catch (error) {
        console.error("Errore nel recupero delle API Keys", error);
      }
    },
    async generateKey() {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${process.env.VUE_APP_API_URL}/generate-api-key`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        await this.fetchApiKeys(); // 🔥 Rifacciamo la fetch per aggiornare la lista
      } catch (error) {
        console.error("Errore nella generazione della API Key", error);
      }
    },
    async deleteKey(keyId) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${process.env.VUE_APP_API_URL}/api-keys/${keyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.apiKeys = this.apiKeys.filter((key) => key.id !== keyId);
      } catch (error) {
        console.error("Errore nell'eliminazione della API Key", error);
      }
    },
    copyKey(apiKey) {
      navigator.clipboard.writeText(apiKey);
      alert("API Key copiata!");
    },
    toggleKeyVisibility(key) {
      key.showFull = !key.showFull;
    },
  },
};
</script>

<style scoped>
.masked-key {
  font-family: monospace;
}

.full-key {
  display: block;
  margin-top: 5px;
  font-size: 14px;
  color: #555;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.btn {
  padding: 5px 10px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.btn.view {
  background-color: #f0ad4e;
  color: white;
}

.btn.copy {
  background-color: #5bc0de;
  color: white;
}

.btn.delete {
  background-color: #d9534f;
  color: white;
}

.btn.generate {
  margin-top: 15px;
  background-color: #71b095;
  color: white;
  font-size: 16px;
  padding: 8px 12px;
}

.no-keys {
  margin-top: 10px;
  font-style: italic;
  color: #777;
}

.max-keys-warning {
  color: #d9534f;
  font-size: 14px;
  margin-top: 10px;
}
.btn.generate:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
