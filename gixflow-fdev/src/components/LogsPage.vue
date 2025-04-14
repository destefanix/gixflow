<template>
  <div class="header">
    <h1>Log di Sistema</h1>
    <div class="actions">
      <!-- <button class="create-button" @click="openCreateModal">+</button>-->
      <button class="csv-button" @click="exportAppointments">CSV</button> 
    </div>
  </div>
  <div class="logs-page">
    <!-- Sezione Filtri -->
    <div class="filters">
      <label>
        Metodo:
        <select v-model="filters.method">
          <option value="">Tutti</option>
          <option v-for="method in methodOptions" :key="method" :value="method">{{ method }}</option>
        </select>
      </label>
      <label>
        Utente:
        <input type="text" v-model="filters.user" placeholder="Username" />
      </label>
      <label>
        IP:
        <input type="text" v-model="filters.ip" placeholder="Indirizzo IP" />
      </label>
      <label>
        Status:
        <select v-model="filters.status">
          <option value="">Tutti</option>
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
      </label>
      <label>
        Endpoint:
        <input type="text" v-model="filters.endpoint" placeholder="/api/..." />
      </label>
      <button @click="applyFilters">Applica</button>
      <button @click="resetFilters">Reset</button>
    </div>

   
    <table class="table">
  <thead>
    <tr>
      <th>Timestamp</th>
      <th>Metodo</th>
      <th>Endpoint</th>
      <th>Utente</th>
      <th>IP</th>
      <th>Status</th>
      <th>Data</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(log, index) in paginatedLogs" :key="index">
      <td>{{ log.timestamp }}</td>
      <td :class="getMethodClass(log.method)">{{ log.method }}</td>
      <td>{{ log.endpoint }}</td>
      <td>{{ log.user }}</td>
      <td>{{ log.ip }}</td>
      <td>{{ log.status }}</td>
      <td>
        <button class = "in-grid" v-if="log.data !== 'N/A' && log.method !== 'LOGIN' && log.method !== 'LOGOUT'"
          @click="openModal(log.data)">Vedi</button>
      </td>
    </tr>
    <tr v-if="filteredLogs.length === 0">
      <td colspan="7">Nessun log trovato.</td>
    </tr>
  </tbody>
</table>


   <!--  <p v-else>Nessun log disponibile.</p> -->

    <!-- Paginazione -->
    <div class="pagination-controls">
      <label>
        Elementi per pagina:
        <select v-model="itemsPerPage">
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>
    <div class="pagination">
  <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
    Precedente
  </button>

  <span v-for="page in visiblePages()" :key="page">
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
    Successivo
  </button>
</div>

    <!-- MODAL POPUP -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>Dati Log</h3>
        <pre>{{ modalData }}</pre>
        <button class="close-btn" @click="closeModal">Chiudi</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

export default {
  data() {
    return {
      logs: [],
      filteredLogs: [],
      currentPage: 1,
      itemsPerPage: 15,
      itemsPerPageOptions: [5, 10, 20, 50],
      showModal: false,
      modalData: "",
      filters: {
        method: "",
        user: "",
        ip: "",
        status: "",
        endpoint: "",
      },
      methodOptions: ["GET", "POST", "PUT", "DELETE", "LOGIN", "LOGOUT"],
      statusOptions: ["200", "400", "401", "403", "404", "500"],
    };
  },
  computed: {
    formattedLogs() {
      return this.logs.map((log) => {
        const logParts = log.match(
          /\[(.*?)\] (LOGIN|LOGOUT|PUT|POST|DELETE|GET)?\s*(\/[^\s]*)?\s*\|\s*User:\s*(.*?)\s*\|\s*IP:\s*(.*?)\s*\|\s*Status:\s*(\d+)(?:\s*\|\s*Data:\s*(.*))?/
        );

        if (!logParts) {
          return {
            timestamp: "❓",
            method: "❓",
            endpoint: "—",
            user: "❓",
            ip: "❓",
            status: "❓",
            data: "❓",
          };
        }

        const formattedTimestamp = this.formatDate(logParts[1]);
        let formattedData = "N/A";

        if (logParts[7] && logParts[7].trim() !== "{}" && logParts[7].trim() !== "undefined") {
          try {
            formattedData = JSON.stringify(JSON.parse(logParts[7]), null, 2);
          } catch (error) {
            formattedData = logParts[7] || "N/A";
          }
        }

        return {
          timestamp: formattedTimestamp,
          method: logParts[2] || "—",
          endpoint: logParts[3] || "—",
          user: logParts[4],
          ip: logParts[5],
          status: logParts[6],
          data: formattedData,
        };
      });
    },

    paginatedLogs() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredLogs.slice(start, end);
    },

    totalPages() {
      return Math.ceil(this.filteredLogs.length / this.itemsPerPage);
    },
  },

  methods: {
    async fetchLogs() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await axios.get("https://app.gixflow.cloud/api/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.logs = response.data.logs;
        this.filteredLogs = [...this.formattedLogs];
      } catch (error) {
        console.error("Errore nel recupero dei log:", error.response?.data || error.message);
      }
    },

    visiblePages() {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxPages = 5; // Numero massimo di pagine visibili

    if (total <= maxPages) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    
    if (current > 2) pages.push(1);
    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push("...");
    if (current < total - 1) pages.push(total);

    return pages;
  },

    /** Metodo per colorare il tipo di richiesta HTTP */
    getMethodClass(method) {
      return {
        "log-get": method === "GET",
        "log-post": method === "POST",
        "log-put": method === "PUT",
        "log-delete": method === "DELETE",
        "log-login": method === "LOGIN",
        "log-logout": method === "LOGOUT",
      };
    },

    applyFilters() {
      this.filteredLogs = this.formattedLogs.filter(log => {
        return (!this.filters.method || log.method === this.filters.method) &&
               (!this.filters.user || log.user.includes(this.filters.user)) &&
               (!this.filters.ip || log.ip.includes(this.filters.ip)) &&
               (!this.filters.status || log.status === this.filters.status) &&
               (!this.filters.endpoint || log.endpoint.includes(this.filters.endpoint));
      });
      this.currentPage = 1;
    },

    resetFilters() {
      this.filters = {
        method: "",
        user: "",
        ip: "",
        status: "",
        endpoint: "",
      };
      this.filteredLogs = [...this.formattedLogs];
    },

    changePage(page) {
      if (page > 0 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    formatDate(isoString) {
      if (!isoString) return "❓";
      const date = new Date(isoString);
      return `${date.toLocaleDateString("it-IT")} - ${date.toLocaleTimeString("it-IT")}`;
    },

    openModal(data) {
      this.modalData = data;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.modalData = "";
    },

  },

  mounted() {
    this.fetchLogs();
  },
};
</script>

<style scoped>

/* Tabella */
.table td:first-child {
  text-align: center !important;
  padding-left: 10px;
  /* font-weight: bold; */
  width: 180px;
}

.table th:first-child {
  text-align: center !important;
  padding-left: 10px;
  width: 180px;
  /* 📏 Aumentiamo la larghezza */
}

/* Centra le colonne Metodo, IP e Status */
.table td:nth-child(2),
.table td:nth-child(5),
.table td:nth-child(6),
.table td:nth-child(7),
.table th:nth-child(2),
.table th:nth-child(5),
.table th:nth-child(6),
.table th:nth-child(7) {

  text-align: center !important;
}

/* Colori delle etichette api */

.log-get {
  color: #34495e;
  font-weight: bold;
}

.log-post {
  color: #71b095;
  font-weight: bold;
}

.log-put {
  color: rgb(233, 163, 33);
  font-weight: bold;
}

.log-delete {
  color: #c35573;
  font-weight: bold; 
}

.log-login {
  color: purple;
  font-weight: bold;
}

.log-logout {
  color: gray;
  font-weight: bold;
}

.ellipsis {
  padding: 0 10px;
  font-weight: bold;
}


</style>
