<template>
  <div class="reports-dashboard">
    <h1>📊 Dashboard Report Avanzato</h1>

    <div class="filters">
      <div>
        <label>Dal:</label>
        <input type="date" v-model="from" />
      </div>
      <div>
        <label>Al:</label>
        <input type="date" v-model="to" />
      </div>
      <div>
        <label>Agente:</label>
        <select v-model="agent_id">
          <option value="">Tutti</option>
          <option v-for="a in agents" :key="a.id" :value="a.id">
            {{ a.nome }} {{ a.cognome }}
          </option>
        </select>
      </div>
      <div>
        <label>Sede:</label>
        <select v-model="location_id">
          <option value="">Tutte</option>
          <option v-for="l in locations" :key="l.id" :value="l.id">
            {{ l.location }}
          </option>
        </select>
      </div>
      <div>
        <label>Vendor:</label>
        <select v-model="vendor_id">
          <option value="">Tutti</option>
          <option v-for="v in vendors" :key="v.id" :value="v.id">
            {{ v.name }}
          </option>
        </select>
      </div>

      <button @click="fetchFilteredReport">Genera</button>
    </div>

    <div v-if="report" class="cards">
      <div class="card" v-for="(val, key) in report" :key="key">
        <h3>{{ labels[key] }}</h3>
        <p><strong>{{ val }}</strong></p>
      </div>
    </div>

    <div class="export-section" v-if="report">
      <button @click="exportCSV">📁 Esporta CSV</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ReportsDashboard",
  data() {
    return {
      from: "",
      to: "",
      agent_id: "",
      location_id: "",
      vendor_id: "",
      agents: [],
      locations: [],
      vendors: [],
      report: null,
      labels: {
        total_appointments: "Totale Appuntamenti",
        total_contracts: "Totale Contratti",
        conversion_rate: "Tasso Conversione (%)",
        avg_products: "Media Prodotti/Contratto",
      },
    };
  },
  mounted() {
    this.fetchFilters();
  },
  methods: {
    async fetchFilters() {
      const [agentsRes, locRes, vendorRes] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/users`),
        axios.get(`${process.env.VUE_APP_API_URL}/locations-table`),
        axios.get(`${process.env.VUE_APP_API_URL}/vendors`),
      ]);

      this.agents = agentsRes.data.filter((u) => u.role_id === 2); // solo agenti
      this.locations = locRes.data;
      this.vendors = vendorRes.data;
    },

    async fetchFilteredReport() {
      try {
        const { from, to, agent_id, location_id, vendor_id } = this;
        const res = await axios.get(
          `${process.env.VUE_APP_API_URL}/reports/filtered-summary`,
          {
            params: { from, to, agent_id, location_id, vendor_id },
          }
        );
        this.report = res.data;
      } catch (err) {
        console.error("Errore nel fetch report:", err);
      }
    },

    exportCSV() {
      const rows = [["Metrica", "Valore"]];
      for (const [key, val] of Object.entries(this.report)) {
        rows.push([this.labels[key] || key, val]);
      }

      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "report_filtrato.csv";
      link.click();
    },
  },
};
</script>

<style scoped>
.reports-dashboard {
  padding: 30px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.card {
  background: #f7f7f7;
  padding: 20px;
  border-radius: 8px;
  min-width: 180px;
  text-align: center;
}
.export-section {
  margin-top: 30px;
}
</style>
