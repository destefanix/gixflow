<template>
  <div>
    <div class="header">
      <h3><i class="fa-solid fa-pen icon-green"></i>Correzioni manuali</h3>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <label>Data Inizio: <input type="date" v-model="startDate" /></label>
      <label>Data Fine: <input type="date" v-model="endDate" /></label>
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
      <label
        >Operatore:
        <select v-model="selectedUser">
          <option value="">Tutti</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.cognome }} {{ user.nome }}
          </option>
        </select>
      </label>
      <button @click="fetchTimelogs" class="btn primary">Filtra</button>
    </div>

    <!-- TABELLA TIMELOG -->
    <table class="table">
      <thead>
        <tr>
          <th>Operatore</th>
          <th>Sede</th>
          <th>Data</th>
          <th>Chiamate</th>
          <th>Login (h)</th>
          <th>Attesa (h)</th>
          <th>Parlato (h)</th>
          <th>Dispo (h)</th>
          <th>Pausa (h)</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in timelogs" :key="log.id">
          <td>{{ log.cognome }} {{ log.nome }}</td>
          <td>{{ log.location_name || "—" }}</td>
          <td>{{ formatDate(log.date) }}</td>
          <td><input type="number" v-model.number="log.calls" /></td>
          <td><input type="number" v-model.number="log.login" /></td>
          <td><input type="number" v-model.number="log.wait" /></td>
          <td><input type="number" v-model.number="log.talk" /></td>
          <td><input type="number" v-model.number="log.dispo" /></td>
          <td><input type="number" v-model.number="log.pause" /></td>
          <td>
            <button @click="updateTimelog(log)" class="in-grid">Salva</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PAGINAZIONE -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="prevPage">
        Precedente
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
        Successivo
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

export default {
  data() {
    return {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      selectedUser: "",
      selectedLocation: "",
      locations: [],
      users: [],
      timelogs: [],
      limit: 10,
      totalPages: 1,
      currentPage: 1,
    };
  },
  methods: {
    // Recupera i timelog filtrati

    async fetchTimelogs() {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/ast/timelogs`,
          {
            params: {
              startDate: this.startDate,
              endDate: this.endDate,
              userId: this.selectedUser,
              locationId: this.selectedLocation,
              page: this.currentPage,
              limit: this.limit,
            },
          }
        );

        this.timelogs = data.data;
        this.totalPages = data.totalPages;
      } catch (error) {
        alert("Errore nel recupero dei timelog.");
      }
    },

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

    // Salva le modifiche a un timelog
    async updateTimelog(log) {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/ast/timelogs/${log.id}`,
          {
            calls: log.calls,
            login: log.login,
            wait: log.wait,
            talk: log.talk,
            dispo: log.dispo,
            pause: log.pause,
          }
        );
        alert("Timelog aggiornato con successo!");
      } catch (error) {
        alert("Errore nell'aggiornamento del timelog.");
      }
    },

    // Paginazione
    changePage(page) {
      if (page !== this.currentPage) {
        this.currentPage = page;
        this.fetchTimelogs();
      }
    },

    // Vai alla pagina precedente
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

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
  },

  mounted() {
    this.fetchUsers();
    this.fetchTimelogs();
    this.fetchLocations();
  },
};
</script>

<style scoped></style>
