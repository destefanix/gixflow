<template>
  <div>
    <div class="header">
      <h3>Genera Consuntivi</h3>
    </div>

    <!-- FILTRI: Anno e Mese -->
    <div class="filters">
      <label>
        Anno:
        <select v-model="selectedYear">
          <option v-for="year in years" :key="year">{{ year }}</option>
        </select>
      </label>
      <label>
        Mese:
        <select v-model="selectedMonth">
          <option v-for="(m, index) in months" :key="index" :value="index + 1">
            {{ m }}
          </option>
        </select>
      </label>
      <button @click="previewCommissions" :disabled="isArchived">
        Genera Anteprima
      </button>
      <p v-if="isArchived" class="error-message">
        ❌ Questa mensilità è già archiviata e non può essere modificata.
      </p>
    </div>

    <table v-if="commissions.length > 0" class="table commissioning-preview">
      <thead>
        <tr>
          <th>Agente</th>
          <th>Provvigione Base</th>
          <th>Fisso Mensile</th>
          <th>Rimborso Spese</th>
          <th>Aggiustamenti Manuali</th>
          <th>Totale</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in sortedCommissions" :key="c.agent_id">
          <td class="left-align">{{ formatAgentName(c.agent_name) }}</td>
          <td>{{ formatCurrency(c.baseCommission) }}</td>
          <td>{{ formatCurrency(c.fixedSalary) }}</td>
          <td>{{ formatCurrency(c.expenseReimbursement) }}</td>
          <td>{{ formatCurrency(c.manualAdjustments) }}</td>
          <td>
            <strong>{{ formatCurrency(c.total) }}</strong>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- BOTTONI DI AZIONE -->
    <div v-if="commissions.length > 0" class="actions">
      <button @click="saveCommissions">Salva Provvigioni</button>
      <button @click="resetCommissions">Reset</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      commissions: [],      
      isArchived: false, 
      years: Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
      months: [
        "Gen",
        "Feb",
        "Mar",
        "Apr",
        "Mag",
        "Giu",
        "Lug",
        "Ago",
        "Set",
        "Ott",
        "Nov",
        "Dic",
      ],
    };
  },
  watch: {
    // ✅ Se cambiamo mese o anno, resettiamo il flag isArchived
    selectedYear() {
      this.isArchived = false;
    },
    selectedMonth() {
      this.isArchived = false;
    }
  },
  computed: {
    // Ordina per cognome
    sortedCommissions() {
      return [...this.commissions].sort((a, b) => {
        const lastNameA = this.extractLastName(a.agent_name);
        const lastNameB = this.extractLastName(b.agent_name);
        return lastNameA.localeCompare(lastNameB);
      });
    },
  },
  methods: {
 

    async previewCommissions() {
      try {
        const { data } = await axios.get(`${process.env.VUE_APP_API_URL}/preview-commissions`, {
          params: { year: this.selectedYear, month: this.selectedMonth },
        });
        this.commissions = data;
        this.isArchived = false; // ✅ Reset se l'API risponde correttamente
      } catch (error) {
        console.error("Errore Axios (anteprima):", error);

        if (error.response?.status === 409) {
          this.isArchived = true; // ✅ Settiamo il flag se la mensilità è archiviata
        } else {
          alert("Errore nel calcolo dell'anteprima delle provvigioni.");
        }
      }
    },

    async saveCommissions() {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/save-commissions`, {
          year: this.selectedYear,
          month: this.selectedMonth,
          commissions: this.commissions,
        });
        alert("Provvigioni salvate con successo!");
        this.commissions = []; // Svuota l'anteprima dopo il salvataggio
      } catch (error) {
        console.error("Errore Axios (salvataggio):", error);
        alert("Errore nel salvataggio delle provvigioni.");
      }
    },

    // Funzione per resettare le provvigioni
    resetCommissions() {
      this.commissions = [];
    },

    // Formatta numeri in valuta (€)
    formatCurrency(value) {
      return parseFloat(value).toFixed(2) + " €";
    },

    // Estrae il cognome dall'agente
    extractLastName(fullName) {
      const parts = fullName.split(" ");
      return parts.length > 1 ? parts[parts.length - 1] : fullName;
    },

    // Converte il nome in formato "Cognome Nome"
    formatAgentName(fullName) {
      const parts = fullName.split(" ");
      if (parts.length > 1) {
        return `${parts[parts.length - 1]} ${parts.slice(0, -1).join(" ")}`;
      }
      return fullName;
    },
  },
};
</script>

<style scoped>
/* Tabella con anteprima provvigioni */
.commissioning-preview {
  width: 100%;
  border-collapse: collapse;
}

.commissioning-preview th,
.commissioning-preview td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center; /* Centra tutte le colonne */
}

.commissioning-preview .left-align {
  text-align: left; /* Allinea la colonna "Agente" a sinistra */
}

.error-message {
  color: red;
  font-weight: bold;
}
</style>
