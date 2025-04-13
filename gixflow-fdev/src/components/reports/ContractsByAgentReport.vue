<template>
  <div class="report-page">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-box">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
        <p>Caricamento...</p>
      </div>
    </div>

    <ReportFilterModal
      v-if="showModal"
      :loading="loading"
      :filters="['agent', 'location', 'vendor', 'status', 'dateRange']"
      :reportName="'Contratti per agente'"
      @generate="handleGenerate"
      @close="showModal = false"
    />

    <template v-else>
      <div v-if="!reportReady" class="placeholder">
        <i class="fa-solid fa-filter-circle-exclamation icon-green"></i>
        <p class="placeholder-text">Seleziona i parametri per generare il report!</p>
        <button class="filter-again-btn" @click="showModal = true">
          <i class="fa-solid fa-filter"></i> Apri filtri
        </button>
      </div>

      <div v-else>
        <h2><i class="fa-solid fa-file-contract icon-green"></i> Report Contratti per Agente</h2>

        <p class="report-range">
          <strong>Periodo:</strong> {{ formatDateOnly(dates.from) }} → {{ formatDateOnly(dates.to) }} |
          <strong>Generato il:</strong> {{ formatDate(new Date()) }}
        </p>

        <!-- Riepilogo -->
        <div class="summary-wrapper">
          <div class="summary-box">
            <h3><i class="fa-solid fa-sliders icon-green"></i> Filtri applicati:</h3>
            <ul>
              <li><i class="fa-solid fa-calendar-days"></i> Periodo: <strong>{{ formatDateOnly(appliedFilters.from) }} - {{ formatDateOnly(appliedFilters.to) }}</strong></li>
              <li><i class="fa-solid fa-building"></i> Sede: <strong>{{ appliedFilters.locationLabel || 'Tutti' }}</strong></li>
              <li><i class="fa-solid fa-store"></i> Vendor: <strong>{{ appliedFilters.vendorLabel || 'Tutti' }}</strong></li>
              <li><i class="fa-solid fa-circle-check"></i> Stato: <strong>{{ appliedFilters.statusLabel || 'Tutti' }}</strong></li>
            </ul>
          </div>

          <div class="summary-box">
            <h3><i class="fa-solid fa-list-ol icon-green"></i> Totale contratti: <strong>{{ summary.total }}</strong></h3>
            <ul class="status-summary">
              <li v-for="(count, status) in summary.statusBreakdown" :key="status">
                <i class="fa-solid fa-circle-info icon-green"></i> {{ capitalize(status) }}:
                <strong>{{ count }}</strong>
                <span class="percentage">({{ percentage(count) }}%)</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Azioni -->
        <div class="top-controls">
          <div class="left-controls">
            <button class="function-button-primary" @click="exportCSV" title="Scarica CSV">
              <i class="fa-solid fa-download"></i>
            </button>
            <button class="function-button-primary" @click="showModal = true" title="Modifica filtri">
              <i class="fa-solid fa-filter-circle-xmark"></i>
            </button>
            <button class="function-button-primary" @click="sendModalOpen = true" title="Invia email">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
            <button class="function-button-primary" @click="copyAllReportToClipboard" title="Copia tutto">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>
          <div class="table-search-wrapper">
            <input v-model="searchText" type="text" placeholder="Cerca nei risultati..." />
          </div>
        </div>

        <SendReportModal
          v-if="sendModalOpen"
          :csvBase64="generateCSVBase64()"
          :reportType="'contracts-by-agent'"
          :defaultSubject="`Report Contratti (${formatDateOnly(dates.from)} - ${formatDateOnly(dates.to)})`"
          :filters="appliedFilters"
          :summary="summary.statusBreakdown"
          :total="summary.total"
          @close="sendModalOpen = false"
        />

        <!-- Tabella -->
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th v-for="col in columns" :key="col.field" @click="sort(col.field)">
                  {{ col.label }}
                  <span v-if="sortField === col.field">
                    <i :class="sortOrder === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'"></i>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedRows" :key="row.id">
                <td>{{ row.id }}</td>
                <td>{{ formatDateOnly(row.completion_date) }}</td>
                <td>{{ row.agent }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.vendor }}</td>
                <td>{{ row.location }}</td>
              </tr>
              <tr v-if="paginatedRows.length === 0">
                <td colspan="6">Nessun contratto trovato.</td>
              </tr>
            </tbody>
          </table>

          <div class="table-footer">
            <div class="footer-left">
              <label>
                Risultati:
                <select v-model.number="itemsPerPage">
                  <option v-for="opt in [5,10,20,50]" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </label>
              <span class="total-count">{{ filteredRows.length }} risultati totali</span>
            </div>

            <div class="pagination">
              <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Precedente</button>
              <span v-for="page in visiblePages" :key="page">
                <button v-if="page !== '...'" :class="{ active: page === currentPage }" @click="changePage(page)">
                  {{ page }}
                </button>
                <span v-else class="ellipsis">...</span>
              </span>
              <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Successivo</button>
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
  name: "ContractsByAgentReport",
  components: { ReportFilterModal, SendReportModal },
  data() {
    return {
      showModal: true,
      loading: false,
      data: [],
      summary: { total: 0, statusBreakdown: {} },
      dates: { from: null, to: null },
      appliedFilters: {},
      reportReady: false,
      sendModalOpen: false,
      searchText: "",
      currentPage: 1,
      itemsPerPage: 10,
      sortField: "completion_date",
      sortOrder: "desc",
      columns: [
        { label: "ID", field: "id" },
        { label: "Data Firma", field: "completion_date" },
        { label: "Agente", field: "agent" },
        { label: "Stato", field: "status" },
        { label: "Vendor", field: "vendor" },
        { label: "Sede", field: "location" },
      ],
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
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
        pages.push(i);
      if (current < total - 2) pages.push("...");
      if (current < total) pages.push(total);

      return pages;
    },
  },

  methods: {
    async handleGenerate(params) {
      this.loading = true;
      try {
        const res = await axios.get(`${process.env.VUE_APP_API_URL}/reports/contracts-by-agent`, {
          params,
        });

        this.data = res.data.data || [];
        this.summary.total = res.data.total || 0;
        this.summary.statusBreakdown = res.data.summary || {};
        this.dates = { from: params.from, to: params.to };
        this.appliedFilters = params;
        this.reportReady = true;
        this.showModal = false;
        this.currentPage = 1;
      } catch (err) {
        console.error("Errore caricamento report:", err);
      } finally {
        this.loading = false;
      }
    },

    formatDate(date) {
      const d = new Date(date);
      const day = d.toLocaleDateString("it-IT");
      const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      return `${day} ${time}`;
    },
    formatDateOnly(date) {
      return date ? new Date(date).toLocaleDateString("it-IT") : "";
    },
    capitalize(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
    },
    percentage(val) {
      const total = this.summary.total || 1;
      return ((val / total) * 100).toFixed(2);
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
    changePage(p) {
      if (p >= 1 && p <= this.totalPages) this.currentPage = p;
    },
    exportCSV() {
      const headers = this.columns.map((c) => c.label).join(",");
      const rows = this.data.map((r) =>
        [r.id, this.formatDate(r.completion_date), r.agent, r.status, r.vendor, r.location].join(",")
      );
      const blob = new Blob([headers, ...rows].join("\n"), { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "report_contratti.csv";
      link.click();
    },
    generateCSVBase64() {
      const headers = this.columns.map((c) => c.label).join(",");
      const rows = this.data.map((r) =>
        [r.id, this.formatDate(r.completion_date), r.agent, r.status, r.vendor, r.location].join(",")
      );
      return btoa(unescape(encodeURIComponent([headers, ...rows].join("\n"))));
    },
    copyAllReportToClipboard() {
      const headers = this.columns.map((c) => c.label).join("\t");
      const rows = this.data.map((r) =>
        [r.id, this.formatDate(r.completion_date), r.agent, r.status, r.vendor, r.location].join("\t")
      );
      navigator.clipboard.writeText([headers, ...rows].join("\n")).then(() => {
        this.$toast?.show?.("Report copiato!", { type: "success" });
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
