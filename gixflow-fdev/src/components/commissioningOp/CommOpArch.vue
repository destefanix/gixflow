<template>
  <div>
    <div class="header">
      <h3><i class="fa-solid fa-box-open icon-green"></i>Archivio Consuntivi</h3>
    </div>
    <!-- FILTRI -->
    <div class="filters">
      <label>Data Inizio: <input type="date" v-model="startDate" /></label>
      <label>Data Fine: <input type="date" v-model="endDate" /></label>
      <label
        >Sede:
        <select v-model="selectedLocation">
          <option value="">Tutte</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.id">
            {{ loc.location }}
          </option>
        </select>
      </label>
      <label
        >Operatore:
        <select v-model="selectedUser">
          <option value="">Tutti</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.cognome }} {{ user.nome }}
          </option>
        </select>
      </label>
      <button @click="fetchTimelogs" class="btn primary">Cerca</button>
    </div>

    <p v-if="loading">Caricamento in corso...</p>

    <!-- TABELLA CONSUNTIVO -->
    <table v-if="timelogs.length > 0" class="table">
      <thead>
        <tr>
          <th>Operatore</th>
          <th>Sede</th>
          <th>Chiamate</th>
          <th>Login (h)</th>
          <th>Attesa (h)</th>
          <th>Parlato (h)</th>
          <th>Dispo (h)</th>
          <th>Pausa (h)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in timelogs" :key="log.user_id">
          <td>{{ log.cognome }} {{ log.nome }}</td>
          <td>{{ log.location_name }}</td>
          <td>{{ log.calls }}</td>
          <td>{{ Number(log.login).toFixed(2) }}</td>
          <td>{{ Number(log.wait).toFixed(2) }}</td>
          <td>{{ Number(log.talk).toFixed(2) }}</td>
          <td>{{ Number(log.dispo).toFixed(2) }}</td>
          <td>{{ Number(log.pause).toFixed(2) }}</td>
        </tr>
      </tbody>

      <tfoot>
        <tr class="totals-row">
          <td colspan="2"><strong>Totali</strong></td>
          <td>
            <strong>{{ totals.calls }}</strong>
          </td>
          <td>
            <strong>{{ totals.login.toFixed(2) }}</strong>
          </td>
          <td>
            <strong>{{ totals.wait.toFixed(2) }}</strong>
          </td>
          <td>
            <strong>{{ totals.talk.toFixed(2) }}</strong>
          </td>
          <td>
            <strong>{{ totals.dispo.toFixed(2) }}</strong>
          </td>
          <td>
            <strong>{{ totals.pause.toFixed(2) }}</strong>
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- PAGINAZIONE -->
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="prevPage">
        <i class="fa-solid fa-backward-step"></i>
      </button>
      <span v-for="page in totalPages" :key="page">
        <button
          :class="{ active: page === currentPage }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </span>
      <button :disabled="currentPage === totalPages" @click="nextPage">
        <i class="fa-solid fa-forward-step"></i>
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      startDate: new Date().toISOString().split("T")[0], // Data di oggi
      endDate: new Date().toISOString().split("T")[0], // Data di oggi
      selectedUser: "",
      users: [], // Lista utenti
      selectedLocation: "",
      locations: [],
      timelogs: [],
      loading: false,
      currentPage: 1,
      limit: 10,
      totalPages: 1,
    };
  },
  methods: {
    // Recupera gli utenti con ruolo "operatore" (role_id === 1)
    async fetchUsers() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );

        // Verifica se la risposta è un array e filtra gli utenti con role_id = 1
        const allUsers = Array.isArray(response.data)
          ? response.data.flat()
          : [];
        this.users = allUsers.filter((user) => user.role_id === 1);
      } catch (error) {
        this.$toast.show("Errore durante il caricamento degli operatori.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async fetchLocations() {
      try {
        const res = await axios.get(
          `${process.env.VUE_APP_API_URL}/locations-table`
        );
        this.locations = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error("Errore nel recupero delle sedi", error);
      }
    },

     async fetchTimelogs() {
      this.loading = true;
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/ast/timelogs/summary`,
          {
            params: {
              startDate: this.startDate,
              endDate: this.endDate,
              userId: this.selectedUser,
              locationId: this.selectedLocation,
            },
          }
        );

        this.timelogs = data.map((log) => ({
          ...log,
          calls: Number(log.calls) || 0,
          login: Number(log.login) || 0,
          wait: Number(log.wait) || 0,
          talk: Number(log.talk) || 0,
          dispo: Number(log.dispo) || 0,
          pause: Number(log.pause) || 0,
        }));
      } catch (error) {
        alert("Errore nel recupero dei consuntivi.");
      } finally {
        this.loading = false;
      }
    },

    // Paginazione
    changePage(page) {
      if (page !== this.currentPage) {
        this.currentPage = page;
        this.fetchTimelogs();
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchTimelogs();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.fetchTimelogs();
      }
    },

    // Formatta la data in dd/mm/yyyy
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;
    },
  },

  computed: {
    totals() {
      return this.timelogs.reduce(
        (acc, log) => {
          acc.calls += log.calls;
          acc.login += log.login;
          acc.wait += log.wait;
          acc.talk += log.talk;
          acc.dispo += log.dispo;
          acc.pause += log.pause;
          return acc;
        },
        {
          calls: 0,
          login: 0,
          wait: 0,
          talk: 0,
          dispo: 0,
          pause: 0,
        }
      );
    },
  },

  mounted() {
    this.fetchUsers();
    this.fetchTimelogs();
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
.pagination {
  margin-top: 15px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.pagination button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f9f9f9;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
}
.pagination button:hover {
  background: #ddd;
}
.pagination button.active {
  background: #71b095;
  color: white;
  border-color: #5a8c7a;
}

.totals-row {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #2c3e50;
}
</style>
