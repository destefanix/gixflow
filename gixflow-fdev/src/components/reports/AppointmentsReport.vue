<template>
  <div class="report-page">
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
      :filters="['agent', 'operator', 'location', 'dateRange']"
      :reportName="'Report Appuntamenti'"      
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
          <i class="fa-solid fa-calendar-check icon-green"></i> Report
          Appuntamenti
        </h2>

        <p class="report-range">
          <strong>Report dal:</strong> {{ formatDate(dates.from) }} al
          {{ formatDate(dates.to) }} | <strong>Generato il:</strong>
          {{ formatDate(new Date()) }}
        </p>

        <!-- CARD: FILTRI APPLICATI -->
        <div class="summary-wrapper">
          <!-- CARD: FILTRI APPLICATI -->
          <div class="summary-box">
            <h3>
              <i class="fa-solid fa-sliders icon-green"></i> Filtri applicati:
            </h3>
            <ul>
              <li>
                <i class="fa-solid fa-calendar-days"></i>
                Periodo:
                <strong>{{ formatDateOnly(appliedFilters.from) }}</strong> -
                <strong>{{ formatDateOnly(appliedFilters.to) }}</strong>
              </li>

              <li>
                <i class="fa-solid fa-user-tie"></i>
                Agente:
                <strong>{{
                  resolveFilterNames(appliedFilters.agent_id, agents).join(", ")
                }}</strong>
              </li>

              <li>
                <i class="fa-solid fa-headset"></i>
                Operatore:
                <strong>{{
                  resolveFilterNames(
                    appliedFilters.operator_id,
                    operators
                  ).join(", ")
                }}</strong>
              </li>
              <li>
                <i class="fa-solid fa-building"></i>
                Sede:
                <strong>{{
                  resolveFilterNames(
                    appliedFilters.location_id,
                    locations,
                    "location"
                  ).join(", ")
                }}</strong>
              </li>
              <li v-if="appliedFilters.vendor_id">
                <i class="fa-solid fa-store"></i>
                Vendor:
                <strong>{{
                  resolveFilterNames(
                    appliedFilters.vendor_id,
                    vendors,
                    "name"
                  ).join(", ")
                }}</strong>
              </li>

            </ul>
          </div>

          <!-- CARD: RIEPILOGO -->
          <div class="summary-box">
            <h3>
              <i class="fa-solid fa-list-ol icon-green"></i> Totale
              Appuntamenti:
              <strong>{{ summary.total }}</strong>
            </h3>
            <ul class="status-summary">
              <li
                v-for="(count, status) in summary.statusBreakdown"
                :key="status"
              >
                <i class="fa-solid fa-circle-info icon-green"></i>
                {{ capitalize(status) }}:
                <strong>{{ count }}</strong>
                <span class="percentage">({{ percentage(count) }}%)</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- AZIONI + RICERCA -->
        <div class="top-controls">
          <div class="left-controls">
            <button class="function-button-primary" 
            @click="exportCSV" 
            title="Scarica il report in formato CSV"
            >
              <i class="fa-solid fa-download"></i>
            </button>

            <button class="function-button-primary"
              @click="showModal = true"
              title="Modifica i filtri applicati"
            >
              <i class="fa-solid fa-filter-circle-xmark"></i>
            </button>

            <button class="function-button-primary"
              @click="sendModalOpen = true"
              title="Invia il report via email"
            >
              <i class="fa-solid fa-paper-plane"></i>
            </button>
            <button class="function-button-primary"
            @click="copyAllReportToClipboard" 
            title="Copia tutti dati">
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

        <SendReportModal
          v-if="sendModalOpen"
          :csvBase64="generateCSVBase64()"
          :reportType="'appointments'"
          :defaultSubject="`Report Appuntamenti (${formatDateOnly(
            dates.from
          )} - ${formatDateOnly(dates.to)})`"
          :filters="computedFilters"
          :summary="summary.statusBreakdown"
          :total="summary.total"
          @close="sendModalOpen = false"
        />

        <!-- TABELLA -->
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th
                  v-for="col in columns"
                  :key="col.field"
                  @click="sort(col.field)"
                >
                  {{ col.label }}
                  <span v-if="sortField === col.field">
                    <i
                      :class="
                        sortOrder === 'asc'
                          ? 'fa-solid fa-caret-up'
                          : 'fa-solid fa-caret-down'
                      "
                    ></i>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedRows" :key="row.id">
                <td>{{ row.id }}</td>
                <td>{{ formatDate(row.date_start) }}</td>
                <td>{{ row.agent }}</td>
                <td>{{ row.operator }}</td>
                <td>{{ capitalize(row.status) }}</td>
                <td>{{ row.sede }}</td>
              </tr>
              <tr v-if="paginatedRows.length === 0">
                <td colspan="6">Nessun appuntamento trovato.</td>
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
                    v-for="opt in [5, 10, 20, 50, 100]"
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

import "@/styles/global.css";
import "@/styles/reports.css";
import "@/styles/toast.css";

export default {
  name: "AppointmentsReport",
  components: { ReportFilterModal, SendReportModal },
  data() {
    return {
      showModal: true,
      loading: false,
      data: [],
      summary: { total: 0, statusBreakdown: {} },
      dates: { from: null, to: null },
      columns: [
        { label: "ID", field: "id" },
        { label: "Data", field: "date_start" },
        { label: "Agente", field: "agent" },
        { label: "Operatore", field: "operator" },
        { label: "Stato", field: "status" },
        { label: "Sede", field: "sede" },
      ],
      sortField: "date_start",
      sortOrder: "asc",
      currentPage: 1,
      itemsPerPage: 10,
      searchText: "",
      reportReady: false,
      appliedFilters: {},
      sendModalOpen: false,
    };
  },

  computed: {
    filteredRows() {
      const search = this.searchText.toLowerCase();
      const filtered = this.data.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(search)
        )
      );
      return this.sortRows(filtered);
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
    computedFilters() {
      return {
        from: this.appliedFilters.from,
        to: this.appliedFilters.to,
        agentLabel: this.resolveFilterNames(
          this.appliedFilters.agent_id,
          this.agents
        ).join(", "),
        operatorLabel: this.resolveFilterNames(
          this.appliedFilters.operator_id,
          this.operators
        ).join(", "),
        locationLabel: this.resolveFilterNames(
          this.appliedFilters.location_id,
          this.locations,
          "location"
        ).join(", "),
        vendorLabel: this.resolveFilterNames(
          this.appliedFilters.vendor_id,
          this.vendors,
          "name"
        ).join(", "),
      };
    },
  },

  mounted() {
    this.loadLookupData();
  },

  methods: {
    async loadLookupData() {
      try {
        const [usersRes, locRes, vendorRes] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/users`),
          axios.get(`${process.env.VUE_APP_API_URL}/locations-table`),
          axios.get(`${process.env.VUE_APP_API_URL}/vendors`),
        ]);

        const allUsers = Array.isArray(usersRes.data)
          ? usersRes.data.flat()
          : [];

        this.agents = allUsers.filter((u) => u.role_id === 2);
        this.operators = allUsers.filter((u) => u.role_id === 1);
        this.locations = locRes.data || [];
        this.vendors = vendorRes.data || [];
        this.lookupReady = true;
      } catch (err) {
        console.error("Errore caricamento lookup:", err);
      }
    },

    async handleGenerate(params) {
      this.loading = true;
      try {
        if (!this.lookupReady) await this.loadLookupData();

        const res = await axios.get(
          `${process.env.VUE_APP_API_URL}/reports/appointments`,
          { params }
        );

        this.data = res.data.data || [];
        this.summary.total = res.data.total || 0;
        this.summary.statusBreakdown = res.data.summary || {};
        this.dates = { from: params.from, to: params.to };
        this.currentPage = 1;
        this.reportReady = true;
        this.showModal = false;

        this.appliedFilters = {
          ...params,
          agent_names: this.resolveFilterNames(params.agent_id, this.agents),
          operator_names: this.resolveFilterNames(
            params.operator_id,
            this.operators
          ),
          location_names: this.resolveFilterNames(
            params.location_id,
            this.locations,
            "location"
          ),
          vendor_names: this.resolveFilterNames(
            params.vendor_id,
            this.vendors,
            "name"
          ),
        };
      } catch (err) {
        console.error("Errore caricamento report:", err);
        this.$toast.show("L'inserimento delle date è obbligatorio.", {
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
        //second: "2-digit",
      });
      return `${day} ${time}`; // no virgola
    },

    formatDateOnly(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("it-IT"); // formato: gg/mm/yyyy
    },

    capitalize(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
    },

    percentage(value) {
      const total = this.summary.total || 1;
      return ((value / total) * 100).toFixed(2);
    },

    extractNames(data, field) {
      const unique = [
        ...new Set(data.map((row) => row[field]).filter(Boolean)),
      ];
      return unique.length === 0 ? ["Tutti"] : unique;
    },

    async exportCSV() {
      this.loading = true;
      try {
        const headers = ["ID", "Data", "Agente", "Operatore", "Stato", "Sede"];
        const csv = [
          headers.join(","),
          ...this.data.map((row) =>
            [
              row.id,
              this.formatDate(row.date_start),
              row.agent,
              row.operator,
              row.status,
              row.sede,
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "report_appuntamenti.csv";
        link.click();
      } catch (err) {
        console.error("Errore CSV:", err);
        this.$toast.show("Errore durante l'esportazione CSV", {
          type: "error",
          position: "bottom-right",
        });
      } finally {
        this.loading = false;
      }
    },

    copyAllReportToClipboard() {
      const headers = this.columns.map((col) => col.label).join("\t");

      const rows = this.data.map((row) =>
        this.columns.map((col) => row[col.field]).join("\t")
      );

      const clipboardText = [headers, ...rows].join("\n");

      navigator.clipboard
        .writeText(clipboardText)
        .then(() => {
          this.$toast?.show?.("Righe copiate negli appunti.", {
            type: "success",
            position: "bottom-right",
          });
        })
        .catch((err) => {
          console.error("❌ Errore durante la copia:", err);
          this.$toast?.show?.("Errore durante la copia", {
            type: "error",
            position: "bottom-right",
          });
        });
    },

    generateCSVBase64() {
      const headers = ["ID", "Data", "Agente", "Operatore", "Stato", "Sede"];
      const csv = [
        headers.join(","),
        ...this.data.map((row) =>
          [
            row.id,
            this.formatDate(row.date_start),
            row.agent,
            row.operator,
            row.status,
            row.sede,
          ].join(",")
        ),
      ].join("\n");

      return btoa(unescape(encodeURIComponent(csv))); // Safe base64 encoding
    },

    sort(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortField = field;
        this.sortOrder = "asc";
      }

      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, 200);
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
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    isAllSelected(selectedIds, fullList) {
      if (!Array.isArray(selectedIds)) return true; // ← considera null/undefined = tutti selezionati

      const allIds = fullList.map((x) => String(x.id)).sort();
      const selectedSorted = selectedIds.map(String).sort();

      return JSON.stringify(selectedSorted) === JSON.stringify(allIds);
    },

    resolveFilterNames(ids, fullList, labelKey = "cognome_nome") {
      const idsArray = Array.isArray(ids) ? ids : ids != null ? [ids] : [];

      if (idsArray.length === 0 || this.isAllSelected(idsArray, fullList)) {
        return ["Tutti"];
      }

      const names = fullList
        .filter((item) => idsArray.includes(item.id))
        .map((item) => {
          if (labelKey === "cognome_nome") {
            return `${item.cognome} ${item.nome}`;
          }
          return item[labelKey];
        });

      return names.length > 0 ? names : ["Tutti"];
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



</style>
