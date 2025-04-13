<template>
  <div class="report-page">
    <!-- LOADING -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-box">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
        <p>Caricamento...</p>
      </div>
    </div>

    <!-- MODALE FILTRI -->
    <ReportFilterModal
      v-if="showModal"
      :loading="loading"
      :filters="['dateRange']"
      :reportName="'Efficienza per sede'"
      @generate="handleGenerate"
      @close="showModal = false"
    />

    <!-- PLACEHOLDER -->
    <template v-else>
      <div v-if="!reportReady" class="placeholder">
        <i class="fa-solid fa-filter-circle-exclamation icon-green"></i>
        <p class="placeholder-text">
          Seleziona i parametri dal filtro per generare il report!
        </p>
        <button class="filter-again-btn" @click="showModal = true">
          <i class="fa-solid fa-filter"></i> Apri filtri
        </button>
      </div>

      <!-- REPORT -->
      <div v-else>
        <h2>
          <i class="fa-solid fa-chart-line icon-green"></i>
          Report Efficienza per Sede
        </h2>

        <p class="report-range">
          <strong>Report dal:</strong> {{ formatDate(dates.from) }} al
          {{ formatDate(dates.to) }} | <strong>Generato il:</strong>
          {{ formatDate(new Date()) }}
        </p>

        <div class="grid-4-cols">
          <!-- FILTRI -->
          <div class="grid-box col-1-4">
            <h3>
              <i class="fa-solid fa-sliders icon-green"></i> Filtri applicati:
            </h3>
            <ul>
              <li>
                <i class="fa-solid fa-calendar-days"></i>
                Periodo:
                <strong>{{ formatDateOnly(dates.from) }}</strong> -
                <strong>{{ formatDateOnly(dates.to) }}</strong>
              </li>
            </ul>
          </div>

          <!-- RIEPILOGO TOTALE -->
          <div class="grid-box col-1-4">
            <h3>
              <i class="fa-solid fa-list-ol icon-green"></i> Riepilogo Totale:
            </h3>
            <ul class="status-summary">
              <li>
                <i class="fa-solid fa-calendar-check icon-green"></i>
                Appuntamenti: <strong>{{ summary.totalAppointments }}</strong>
              </li>
              <li>
                <i class="fa-solid fa-clock icon-green"></i> Ore:
                <strong>{{ summary.totalHours }}</strong>
              </li>
              <li>
                <i class="fa-solid fa-chart-line icon-green"></i> Resa:
                <strong>{{ summary.resa }}</strong>
              </li>
              <li>
                <i class="fa-solid fa-circle-check icon-green"></i> Positivi:
                <strong>{{ summary.totalPositive }}</strong>
              </li>
              <li>
                <i class="fa-solid fa-percentage icon-green"></i> % POS:
                <strong>{{ summary.posRate }}%</strong>
              </li>
            </ul>
          </div>

          <!-- DETTAGLI SEDI (card unica su 2 colonne) -->
          <div class="grid-box col-2-4">
            <h3>
              <i class="fa-solid fa-building icon-green"></i> Dettagli per Sede:
            </h3>
            <div class="sedi-summary-flex">
              <div
                v-for="(val, sede) in summaryBySede"
                :key="sede"
                class="sede-card"
              >
                <h4>
                  <i class="fa-solid fa-location-dot icon-green"></i> {{ sede }}
                </h4>
                <ul>
                  <li>Appuntamenti: <strong>{{ val.appuntamenti_totali }}</strong></li>
                  <li>Ore: <strong>{{ val.ore_erogate.toFixed(2) }}</strong></li>
                  <li>Resa: <strong>{{(val.appuntamenti_totali / Math.max(val.ore_erogate, 1)).toFixed(2)}}</strong></li>
                  <li>Positivi: <strong>{{ val.appuntamenti_positivi }}</strong></li>
                  <li>Conversion: <strong>{{((val.appuntamenti_positivi / Math.max(val.appuntamenti_totali, 1)) * 100).toFixed(2)}} % </strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="top-controls">
          <div class="left-controls">
            <button
              class="function-button-primary"
              @click="exportCSV"
              title="Scarica il report in formato CSV"
            >
              <i class="fa-solid fa-download"></i>
            </button>
            <button
              class="function-button-primary"
              @click="showModal = true"
              title="Modifica filtri"
            >
              <i class="fa-solid fa-filter-circle-xmark"></i>
            </button>
            <button
              class="function-button-primary"
              @click="sendModalOpen = true"
              title="Invia via email"
            >
              <i class="fa-solid fa-paper-plane"></i>
            </button>
            <button
              class="function-button-primary"
              @click="copyAllReportToClipboard"
              title="Copia tutti i dati"
            >
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>

          <div class="table-search-wrapper">
            <input
              v-model="searchText"
              type="text"
              placeholder="Cerca nei risultati..."
            />
          </div>
        </div>

        <!-- MODALE EMAIL -->
        <SendReportModal
          v-if="sendModalOpen"
          :csvBase64="generateCSVBase64()"
          :reportType="'location-efficiency'"
          :defaultSubject="`Report Efficienza (${formatDateOnly(
            dates.from
          )} - ${formatDateOnly(dates.to)})`"
          :filters="computedFilters"
          :summary="summary"
          :total="summary.totalAppointments"
          @close="sendModalOpen = false"
        />

        <!-- TABELLA -->
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th @click="sort('mese')">Mese</th>
                <th @click="sort('sede')">Sede</th>
                <th @click="sort('ore_erogate')">Ore</th>
                <th @click="sort('appuntamenti_totali')">App</th>
                <th @click="sort('resa_oraria')">Resa</th>
                <th @click="sort('appuntamenti_positivi')">Positivi</th>
                <th @click="sort('percentuale_pos')">% POS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedRows" :key="index">
                <td>{{ row.mese }}</td>
                <td>{{ row.sede }}</td>
                <td>{{ row.ore_erogate }}</td>
                <td>{{ row.appuntamenti_totali }}</td>
                <td>{{ row.resa_oraria.toFixed(2) }}</td>
                <td>{{ row.appuntamenti_positivi }}</td>
                <td>{{ row.percentuale_pos }}%</td>
              </tr>
              <tr v-if="paginatedRows.length === 0">
                <td colspan="7">Nessun risultato disponibile.</td>
              </tr>
            </tbody>
          </table>

          <!-- PAGINAZIONE -->
          <div class="table-footer">
            <div class="footer-left">
              <label>
                Risultati:
                <select v-model.number="itemsPerPage">
                  <option
                    v-for="opt in [5, 10, 20, 50]"
                    :key="opt"
                    :value="opt"
                  >
                    {{ opt }}
                  </option>
                </select>
              </label>
              <span class="total-count"
                >{{ filteredRows.length }} risultati totali</span
              >
            </div>

            <div class="pagination">
              <button
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
              >
                Precedente
              </button>
              <span v-for="page in visiblePages" :key="page">
                <button
                  v-if="page !== '...'"
                  :class="{ active: page === currentPage }"
                  @click="changePage(page)"
                >
                  {{ page }}
                </button>
                <span v-else class="ellipsis">...</span>
              </span>
              <button
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
              >
                Successivo
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import axios from "axios";
import ReportFilterModal from "@/components/reports/ReportFilterModal.vue";
import SendReportModal from "@/components/reports/SendReportModal.vue";

/* import "@/styles/global.css";
import "@/styles/reports.css";
import "@/styles/toast.css";
 */
export default {
  name: "OperatorEfficiencyReport",
  components: { ReportFilterModal, SendReportModal },
  data() {
    return {
      showModal: true,
      sendModalOpen: false,
      loading: false,
      data: [],
      dates: { from: null, to: null },
      reportReady: false,
      currentPage: 1,
      itemsPerPage: 10,
      sortField: "mese",
      sortOrder: "asc",
      searchText: "",
    };
  },

  computed: {
    filteredRows() {
      const search = this.searchText.toLowerCase();
      return this.sortRows(
        this.data.filter((row) =>
          Object.values(row).some((val) =>
            String(val).toLowerCase().includes(search)
          )
        )
      );
    },
    summary() {
      const totalAppointments = this.data.reduce(
        (sum, r) => sum + r.appuntamenti_totali,
        0
      );
      const totalPositive = this.data.reduce(
        (sum, r) => sum + r.appuntamenti_positivi,
        0
      );
      const totalHours = this.data.reduce((sum, r) => sum + r.ore_erogate, 0);

      // 👉 Resa = app / ore, non la media
      const resa =
        totalHours > 0 ? (totalAppointments / totalHours).toFixed(2) : "0.00";

      const posRate =
        totalAppointments > 0
          ? ((totalPositive / totalAppointments) * 100).toFixed(2)
          : "0.00";

      return {
        totalAppointments,
        totalPositive,
        totalHours: totalHours.toFixed(2),
        resa,
        posRate,
      };
    },

    summaryBySede() {
      return this.data.reduce((acc, row) => {
        const sede = row.sede || "Sconosciuta";
        if (!acc[sede]) {
          acc[sede] = {
            appuntamenti_totali: 0,
            appuntamenti_positivi: 0,
            ore_erogate: 0,
          };
        }

        acc[sede].appuntamenti_totali += row.appuntamenti_totali;
        acc[sede].appuntamenti_positivi += row.appuntamenti_positivi;
        acc[sede].ore_erogate += row.ore_erogate;

        return acc;
      }, {});
    },

    paginatedRows() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredRows.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredRows.length / this.itemsPerPage);
    },
    visiblePages() {
      const total = this.totalPages;
      const current = this.currentPage;
      const pages = [];

      if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
      if (current > 2) pages.push(1);
      if (current > 3) pages.push("...");
      for (
        let i = Math.max(2, current - 1);
        i <= Math.min(total - 1, current + 1);
        i++
      ) {
        pages.push(i);
      }
      if (current < total - 2) pages.push("...");
      if (current < total) pages.push(total);

      return pages;
    },

    computedFilters() {
      return {
        from: this.dates.from,
        to: this.dates.to,
      };
    },
  },

  methods: {
    async handleGenerate(params) {
      this.loading = true;
      try {
        this.dates = {
          from: this.setDateStart(params.from),
          to: this.setDateEnd(params.to),
        };

        const filteredParams = {
          from: this.dates.from.toISOString().split("T")[0],
          to: this.dates.to.toISOString().split("T")[0],
        };

        const res = await axios.get(
          `${process.env.VUE_APP_API_URL}/reports/location-efficiency`,
          {
            params: filteredParams,
            paramsSerializer: (params) =>
              new URLSearchParams(params).toString(),
          }
        );

        this.data = res.data.data || [];
        //this.dates = { ...filteredParams };
        this.dates = { from: params.from, to: params.to };
        this.reportReady = true;
        this.showModal = false;
        this.currentPage = 1;
      } catch (err) {
        console.error("❌ Errore report efficienza:", err);
        this.$toast?.show?.("Errore nel caricamento del report", {
          type: "error",
          position: "bottom-right",
        });
      } finally {
        this.loading = false;
      }
    },

    formatDate(date) {
      const d = new Date(date);
      const day = d.toLocaleDateString("it-IT");
      const time = d.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${day} ${time}`;
    },

    formatDateOnly(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("it-IT");
    },

    setDateStart(date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // 00:00
      return d;
    },

    setDateEnd(date) {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999); // 23:59:59
      return d;
    },

    sort(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortField = field;
        this.sortOrder = "asc";
      }
    },

    sortRows(rows) {
      return rows.sort((a, b) => {
        let aVal = a[this.sortField];
        let bVal = b[this.sortField];
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return this.sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return this.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    },

    exportCSV() {
      const headers = [
        "Mese",
        "Sede",
        "Ore",
        "Appuntamenti",
        "Resa oraria",
        "App utili",
        "% POS",
      ];
      const csv = [
        headers.join(","),
        ...this.data.map((row) =>
          [
            row.mese,
            row.sede,
            row.ore_erogate,
            row.appuntamenti_totali,
            row.resa_oraria.toFixed(2),
            row.appuntamenti_positivi,
            `${row.percentuale_pos}%`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "report_efficienza_operatori.csv";
      link.click();
    },

    copyAllReportToClipboard() {
      const headers = [
        "Mese",
        "Sede",
        "Ore",
        "Appuntamenti",
        "Resa oraria",
        "App utili",
        "% POS",
      ].join("\t");

      const rows = this.data.map((row) =>
        [
          row.mese,
          row.sede,
          row.ore_erogate,
          row.appuntamenti_totali,
          row.resa_oraria.toFixed(2),
          row.appuntamenti_positivi,
          `${row.percentuale_pos}%`,
        ].join("\t")
      );

      navigator.clipboard.writeText([headers, ...rows].join("\n")).then(() => {
        this.$toast?.show?.("Righe copiate negli appunti", {
          type: "success",
          position: "bottom-right",
        });
      });
    },

    generateCSVBase64() {
      const headers = [
        "Mese",
        "Sede",
        "Ore",
        "Appuntamenti",
        "Resa oraria",
        "App utili",
        "% POS",
      ];
      const csv = [
        headers.join(","),
        ...this.data.map((row) =>
          [
            row.mese,
            row.sede,
            row.ore_erogate,
            row.appuntamenti_totali,
            row.resa_oraria.toFixed(2),
            row.appuntamenti_positivi,
            `${row.percentuale_pos}%`,
          ].join(",")
        ),
      ].join("\n");

      return btoa(unescape(encodeURIComponent(csv)));
    },
  },

  watch: {
    itemsPerPage() {
      this.currentPage = 1;
    },
  },
};
</script>

<style scoped>
.grid-4-cols {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.col-1-4 {
  grid-column: span 1;
}

.col-2-4 {
  grid-column: span 2;
}

.grid-box {
  background: #eaf5f1;
  border-radius: 8px;
  padding: 16px;
  min-width: 200px;
}

.status-summary {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

.sedi-summary-flex {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.sede-card {
  flex: 1 1 180px;
  /* background: #ffffff30; */
  padding: 12px; 
  /* border: 1px solid #d4e7e1; */
  border-radius: 8px;
}

.sede-card ul {
  margin: 0;
  padding-left: 15px;
  list-style-type: disc;
}

.sede-card h4 {
  margin-bottom: 8px;
  font-weight: 600;
}

@media (max-width: 1000px) {
  .grid-4-cols {
    grid-template-columns: repeat(2, 1fr);
  }

  .col-2-4 {
    grid-column: span 2;
  }
}
</style>
