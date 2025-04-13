<template>
  <div>
    <div class="header">
      <h3><i class="fa-solid fa-money-bill icon-green"></i>Report Paghe Operatori</h3>
      <div class="actions"></div>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <label
        >Anno:
        <select v-model="selectedYear">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>

      <label
        >Mese:
        <select v-model="selectedMonth">
          <option
            v-for="(month, index) in months"
            :key="index + 1"
            :value="index + 1"
          >
            {{ month }}
          </option>
        </select>
      </label>

      <label>
        Sede:
        <select v-model="selectedLocation">
          <option value="">Tutte</option>
          <option
            v-for="location in locations"
            :key="location.id"
            :value="location.id"
          >
            {{ location.location }}
          </option>
        </select>
      </label>

      <button @click="fetchPayments">Calcola</button>
    </div>

    <p v-if="loading">Caricamento...</p>

    <!-- TABELLA -->
    <table v-if="payments.length > 0" class="table">
      <thead>
        <tr>
          <th>Operatore</th>
          <th>Sede</th>
          <th>Ore Totali</th>
          <th>Tariffa Oraria (€)</th>
          <th>Appuntamenti Positivi</th>
          <th>Bonus (€)</th>
          <th>Paga Totale (€)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.user_id">
          <td>{{ payment.cognome }} {{ payment.nome }}</td>
          <td>{{ payment.location_name || "—" }}</td>
          <td>{{ Number(payment.ore_totali || 0).toFixed(2) }}</td>
          <td>{{ Number(payment.tariffa_oraria || 0).toFixed(2) }}</td>
          <td>{{ payment.appuntamenti_positivi || 0 }}</td>
          <td>{{ Number(payment.bonus || 0).toFixed(2) }}</td>
          <td>
            <strong>{{ Number(payment.paga_totale || 0).toFixed(2) }}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      payments: [],
      loading: false,
      years: this.generateYears(),
      months: [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre",
      ],
      selectedLocation: "",
      locations: [],
    };
  },
  methods: {
    async fetchPayments() {
      this.loading = true;
      try {
        const { startDate, endDate } = this.getDateRange();
        console.log("📆 [DEBUG] Date calcolate:", { startDate, endDate });

        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/operators/payments`,
          {
            params: { startDate, endDate, locationId: this.selectedLocation },
          }
        );

        this.payments = response.data;
      } catch (error) {
        alert("Errore nel caricamento delle paghe.");
      } finally {
        this.loading = false;
      }
    },

    async fetchLocations() {
      try {
        const res = await axios.get(
          `${process.env.VUE_APP_API_URL}/locations-table`
        );
        this.locations = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error("Errore nel caricamento delle sedi:", error);
      }
    },

    

    getDateRange() {
      const year = this.selectedYear;
      const month = this.selectedMonth.toString().padStart(2, "0");
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(year, this.selectedMonth, 0)
        .toISOString()
        .split("T")[0];
      return { startDate, endDate };
    },

    generateYears() {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 10 }, (_, i) => currentYear - i);
    },
  },
  mounted() {
    this.fetchLocations();
  },
};
</script>

<style scoped>
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.table th,
.table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
</style>
