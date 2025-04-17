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
        :filters="['operator', 'location', 'dateRange']"
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
  
        <!-- CONTENUTO REPORT -->
        <div v-else>
          <h2>
            <i class="fa-solid fa-user-check icon-green"></i> Report Performance Operatori
          </h2>
  
          <p class="report-range">
            <strong>Dal:</strong> {{ formatDate(dates.from) }} al
            {{ formatDate(dates.to) }} |
            <strong>Generato il:</strong> {{ formatDate(new Date()) }}
          </p>
  
          <!-- FILTRI APPLICATI -->
          <div class="summary-wrapper">
            <div class="summary-box">
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
                <li>
                  <i class="fa-solid fa-headset"></i>
                  Operatori:
                  <strong>{{ resolveFilterNames(appliedFilters.operator_id, operators).join(", ") }}</strong>
                </li>
                <li>
                  <i class="fa-solid fa-building"></i>
                  Sedi:
                  <strong>{{ resolveFilterNames(appliedFilters.location_id, locations, "location").join(", ") }}</strong>
                </li>
              </ul>
            </div>
  
            <!-- CARD RIEPILOGO -->
            <div class="summary-box">
              <h3>
                <i class="fa-solid fa-list-ol icon-green"></i> Riepilogo:
              </h3>
              <ul class="status-summary">
                <li>
                  <i class="fa-solid fa-users"></i> Operatori:
                  <strong>{{ data.length }}</strong>
                </li>
                <li>
                  <i class="fa-solid fa-clock"></i> Ore totali:
                  <strong>{{ totalHours }}</strong>
                </li>
                <li>
                  <i class="fa-solid fa-calendar-check"></i> Appuntamenti:
                  <strong>{{ totalAppointments }}</strong>
                </li>
                <li>
                  <i class="fa-solid fa-chart-line"></i> Resa/h:
                  <strong>{{ averageYield }} </strong>
                </li>
                <li>
                  <i class="fa-solid fa-percent"></i> Conversion:
                  <strong>{{ positiveRate }}%</strong>
                </li>
              </ul>
            </div>
          </div>
  
          <!-- AZIONI -->
          <div class="top-controls">
            <div class="left-controls">
              <button class="function-button-primary" @click="exportCSV" title="Scarica CSV">
                <i class="fa-solid fa-download"></i>
              </button>
              <button class="function-button-primary" @click="showModal = true" title="Modifica filtri">
                <i class="fa-solid fa-filter-circle-xmark"></i>
              </button>
              <button class="function-button-primary" @click="copyAllReportToClipboard" title="Copia report">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button class="function-button-primary" @click="sendModalOpen = true" title="Invia via email">
                <i class="fa-solid fa-paper-plane"></i>
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
  
          <!-- MODALE INVIO EMAIL -->
          <SendReportModal
            v-if="sendModalOpen"
            :csvBase64="generateCSVBase64()"
            :reportType="'operator-performance'"
            :defaultSubject="`Report Performance Operatori (${formatDateOnly(dates.from)} - ${formatDateOnly(dates.to)})`"
            :filters="computedFilters"
            :summary="summaryData"
            :total="totalAppointments"
            @close="sendModalOpen = false"
          />
  
          <!-- TABELLA -->
          <div class="table-wrapper">
            <table class="table">
              <!-- <thead>
                <tr>
                  <th @click="sort('operator_name')" class="text-left">Operatore</th>
                  <th @click="sort('sede')">Sede</th>
                  <th @click="sort('ore_erogate')">Ore</th>
                  <th @click="sort('appuntamenti_totali')">Appuntamenti</th>
                  <th @click="sort('resa_oraria')">Resa oraria</th>
                  <th @click="sort('appuntamenti_positivi')">App. Positivi</th>
                  <th @click="sort('percentuale_pos')">% Positivi</th>
                </tr>
              </thead> -->
              <thead>
                <tr>
                    <th @click="sort('operator_name')" class="text-left">
                    Operatore
                    <span v-if="sortField === 'operator_name'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                    <th @click="sort('sede')">
                    Sede
                    <span v-if="sortField === 'sede'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                    <th @click="sort('ore_erogate')">
                    Ore
                    <span v-if="sortField === 'ore_erogate'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                    <th @click="sort('appuntamenti_totali')">
                    Appuntamenti
                    <span v-if="sortField === 'appuntamenti_totali'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                    <th @click="sort('resa_oraria')">
                    Resa oraria
                    <span v-if="sortField === 'resa_oraria'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                    <th @click="sort('appuntamenti_positivi')">
                    App. Positivi
                    <span v-if="sortField === 'appuntamenti_positivi'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                    <th @click="sort('percentuale_pos')">
                    % Positivi
                    <span v-if="sortField === 'percentuale_pos'">
                        <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                    </span>
                    </th>
                </tr>
                </thead>
                
              <tbody>
                <tr v-for="row in paginatedRows" :key="row.operator_id">
                  <td class="text-left">{{ row.operator_name }}</td>
                  <td>{{ row.sede }}</td>
                  <td>{{ row.ore_erogate }}</td>
                  <td>{{ row.appuntamenti_totali }}</td>
                  <td>{{ row.resa_oraria.toFixed(2) }}</td>
                  <td>{{ row.appuntamenti_positivi }}</td>
                  <td>{{ row.percentuale_pos.toFixed(2) }}%</td>
                </tr>
                <tr v-if="paginatedRows.length === 0">
                  <td colspan="7">Nessun dato disponibile.</td>
                </tr>
              </tbody>
            </table>
  
            <!-- PAGINAZIONE -->
            <div class="table-footer">
              <div class="footer-left">
                <label>
                  Risultati:
                  <select v-model.number="itemsPerPage">
                    <option v-for="opt in [5, 10, 20, 50, 100]" :key="opt" :value="opt">
                      {{ opt }}
                    </option>
                  </select>
                </label>
                <span class="total-count">{{ filteredRows.length }} risultati totali</span>
              </div>
  
              <div class="pagination">
                <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                  <i class="fa-solid fa-backward-step"></i>
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
                <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
                  <i class="fa-solid fa-forward-step"></i>
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

import "@/styles/global.css";
import "@/styles/reports.css";
import "@/styles/toast.css";

export default {
  name: "OperatorPerformanceReport",
  components: { ReportFilterModal, SendReportModal },

  data() {
    return {
      loading: false,
      showModal: true,
      sendModalOpen: false,
      reportReady: false,
      data: [],
      dates: { from: null, to: null },
      appliedFilters: {},
      searchText: "",
      currentPage: 1,
      itemsPerPage: 10,
      sortField: "operator_name",
      sortOrder: "asc",
      operators: [],
      locations: [],
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
      )
        pages.push(i);
      if (current < total - 2) pages.push("...");
      if (current < total) pages.push(total);

      return pages;
    },
    totalAppointments() {
      return this.data.reduce((sum, r) => sum + r.appuntamenti_totali, 0);
    },
    totalHours() {
      return this.data.reduce((sum, r) => sum + r.ore_erogate, 0).toFixed(2);
    },
    averageYield() {
      const ore = this.data.reduce((sum, r) => sum + r.ore_erogate, 0);
      const app = this.data.reduce((sum, r) => sum + r.appuntamenti_totali, 0);
      return ore > 0 ? (app / ore).toFixed(2) : "0.00";
    },
    positiveRate() {
      const totalPos = this.data.reduce((sum, r) => sum + r.appuntamenti_positivi, 0);
      return this.totalAppointments > 0
        ? ((totalPos / this.totalAppointments) * 100).toFixed(2)
        : "0.00";
    },
    summaryData() {
      return {
        Operatori: this.data.length,
        "Ore Totali": this.totalHours,
        Appuntamenti: this.totalAppointments,
        "Resa media": this.averageYield,
        "% Positivi": this.positiveRate + "%",
      };
    },
    computedFilters() {
      return {
        from: this.dates.from,
        to: this.dates.to,
        operatorLabel: this.resolveFilterNames(
          this.appliedFilters.operator_id,
          this.operators
        ).join(", "),
        locationLabel: this.resolveFilterNames(
          this.appliedFilters.location_id,
          this.locations,
          "location"
        ).join(", "),
      };
    },
  },

  methods: {
    async handleGenerate(params) {
        this.loading = true;
        try {
            // 🔄 Fetch del report
            const res = await axios.get(
            `${process.env.VUE_APP_API_URL}/reports/operator-performance`,
            { params }
            );

            // 📦 Lookup operatori + sedi
            const [usersRes, locRes] = await Promise.all([
            axios.get(`${process.env.VUE_APP_API_URL}/users`),
            axios.get(`${process.env.VUE_APP_API_URL}/locations-table`)
            ]);

            const allUsers = Array.isArray(usersRes.data)
            ? usersRes.data.flat()
            : [];

            this.operators = allUsers.filter((u) => u.role_id === 1);
            this.locations = locRes.data || [];

            // 💾 Salva dati e stato
            this.data = res.data.data || [];
            this.dates = { from: params.from, to: params.to };
            this.appliedFilters = { ...params };
            this.currentPage = 1;
            this.reportReady = true;
            this.showModal = false;
        } catch (err) {
            console.error("Errore generazione report:", err);
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
      return d.toLocaleDateString("it-IT") + " " + d.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    formatDateOnly(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("it-IT");
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
    resolveFilterNames(ids, fullList, labelKey = "cognome_nome") {
      const idsArray = Array.isArray(ids) ? ids : ids != null ? [ids] : [];

      if (idsArray.length === 0 || this.isAllSelected(idsArray, fullList)) {
        return ["Tutti"];
      }

      return fullList
        .filter((item) => idsArray.includes(item.id))
        .map((item) =>
          labelKey === "cognome_nome"
            ? `${item.cognome} ${item.nome}`
            : item[labelKey]
        );
    },
    isAllSelected(selectedIds, fullList) {
      const allIds = fullList.map((x) => String(x.id)).sort();
      const selectedSorted = selectedIds.map(String).sort();
      return JSON.stringify(selectedSorted) === JSON.stringify(allIds);
    },
    exportCSV() {
      const headers = [
        "Operatore",
        "Sede",
        "Ore",
        "Appuntamenti",
        "Resa oraria",
        "App. Positivi",
        "% Positivi",
      ];
      const csv = [
        headers.join(","),
        ...this.data.map((r) =>
          [
            r.operator_name,
            r.sede,
            r.ore_erogate,
            r.appuntamenti_totali,
            r.resa_oraria.toFixed(2),
            r.appuntamenti_positivi,
            r.percentuale_pos.toFixed(2) + "%",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "report_operatori.csv";
      link.click();
    },
    generateCSVBase64() {
      const headers = [
        "Operatore",
        "Sede",
        "Ore",
        "Appuntamenti",
        "Resa oraria",
        "App. Positivi",
        "% Positivi",
      ];
      const csv = [
        headers.join(","),
        ...this.data.map((r) =>
          [
            r.operator_name,
            r.sede,
            r.ore_erogate,
            r.appuntamenti_totali,
            r.resa_oraria.toFixed(2),
            r.appuntamenti_positivi,
            r.percentuale_pos.toFixed(2) + "%",
          ].join(",")
        ),
      ].join("\n");

      return btoa(unescape(encodeURIComponent(csv)));
    },
    copyAllReportToClipboard() {
      const headers = [
        "Operatore",
        "Sede",
        "Ore",
        "Appuntamenti",
        "Resa oraria",
        "App. Positivi",
        "% Positivi",
      ];
      const text = [
        headers.join("\t"),
        ...this.data.map((r) =>
          [
            r.operator_name,
            r.sede,
            r.ore_erogate,
            r.appuntamenti_totali,
            r.resa_oraria.toFixed(2),
            r.appuntamenti_positivi,
            r.percentuale_pos.toFixed(2) + "%",
          ].join("\t")
        ),
      ].join("\n");

      navigator.clipboard.writeText(text).then(() => {
        this.$toast?.show?.("Report copiato negli appunti!", {
          type: "success",
          position: "bottom-right",
        });
      });
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


.table th,
.table td {
  
  text-align: center;
}

.table th.text-left,
.table td.text-left {
  text-align: left;
}


.table-wrapper {
  overflow-x: auto;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-left select {
  padding: 4px 8px;
}




.summary-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 1rem;
  margin-bottom: 1.2rem;
}

.summary-box {
  background-color: #eaf5f1;
  padding: 1rem;
  border-radius: 8px;
  flex: 1 1 300px;
  min-width: 250px;
}

.status-summary {
  list-style: none;
  padding: 0;
  margin: 0;
}

.status-summary li {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.top-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 10px;
}

.left-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}


.ellipsis {
  padding: 0 6px;
  color: #888;
  font-weight: bold;
}
</style>
