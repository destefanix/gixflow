<template>
  <div>
    <div class="header">
      <h1>
        <i class="fa-solid fa-file-signature icon-green"></i>Elenco Contratti
      </h1>
      <div class="actions">
        <!-- <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportAppointments">CSV</button> -->
      </div>
    </div>

    <!-- Sezione Filtri -->
    <div class="filters">
      <!-- Filtro per Cliente -->
      <label>
        Cerca:
        <input
          type="text"
          v-model="filters.client"
          placeholder="Ragione sociale, Partita IVA o Telefono..."
          @input="debouncedSearch"
        />
      </label>

      <!-- Filtro per Agente -->
      <label>
        Agente:
        <select v-model="filters.agent" @change="applyFilters">
          <option value="">Tutti</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">
            {{
              agent.cognome
                ? `${agent.cognome} ${agent.nome || ""}`
                : "Senza Nome"
            }}
          </option>
        </select>
      </label>

      <!-- Filtro per Stato del Contratto -->
      <label>
        Stato:
        <select v-model="filters.status_id">
          <option value="">Tutti</option>
          <option
            v-for="status in contractStatuses"
            :key="status.id"
            :value="status.id"
          >
            {{ status.name }}
          </option>
        </select>
      </label>

      <!-- Filtro per Data Inizio -->
      <label>
        Data Inizio:
        <!-- <input type="date" v-model="filters.dateStart" /> -->
        <flat-pickr
          v-model="filters.dateStart"
          @change="applyFilters"
          :config="configDate"
          class="custom-datepicker"
          placeholder="Data inizio"
        />
      </label>

      <!-- Filtro per Data Fine -->
      <label>
        Data Fine:
        <!-- <input type="date" v-model="filters.dateEnd" /> -->
        <flat-pickr
          v-model="filters.dateEnd"
          :config="configDate"
          class="custom-datepicker"
          placeholder="Data fine"
        />
      </label>

      <!-- Pulsanti -->
      <button @click="applyFilters">Applica Filtri</button>
      <button @click="resetFilters">Reset</button>
    </div>

    <table class="contracts-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Agente</th>
          <th>Vendor</th>
          <th>Data Inserimento</th>
          <th>Data Firma</th>
          <th>Data Completamento</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contract in filteredContracts" :key="contract.id">
          <td>{{ contract.id }}</td>
          <td>{{ contract.client_name }}</td>
          <td>{{ contract.agent_name }}</td>
          <td>{{ contract.vendor_name }}</td>
          <td>{{ formatDate(contract.creation_date) }}</td>
          <td>{{ formatDate(contract.signature_date) }}</td>
          <td>
            {{
              contract.completion_date
                ? formatDate(contract.completion_date)
                : "Non completato"
            }}
          </td>
          <td>{{ contract.status_name }}</td>
          <td>
            <button @click="editContract(contract.id)" class="edit-btn">
              Modifica
            </button>
          </td>
        </tr>

        <tr v-if="filteredContracts.length === 0">
          <td colspan="9" class="no-data">Nessun contratto trovato.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

import { ref } from "vue";
import FlatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";
import "flatpickr/dist/themes/dark.css";

export default {
  components: {
    FlatPickr,
  },

  setup() {
    const configDate = ref({
      dateFormat: "d/m/Y",
      altInput: true,
      altFormat: "d/m/Y",
      locale: Italian,
    });

    const configDateTime = ref({
      enableTime: true, // Abilita l'orario
      dateFormat: "Y-m-d H:i", // Formato per il backend
      altInput: true,
      altFormat: "d/m/Y H:i", // Formato visivo
      time_24hr: true, // Mostra orario in formato 24 ore
      locale: Italian,
    });

    return { configDate, configDateTime };
  },
  data() {
    return {
      contracts: [],
      agents: [],
      clients: [],
      contractStatuses: [],
      filters: {
        agent: "",
        client: "",
        status_id: "",
        dateStart: "",
        dateEnd: "",
      },
      searchTimer: null, // Per gestire il debounce
    };
  },

  computed: {
    filteredContracts() {
      const searchQuery = this.filters.client.toLowerCase().trim();
      const agentFilter = this.filters.agent;
      const statusFilter = this.filters.status_id;
      const dateStartFilter = this.filters.dateStart;
      const dateEndFilter = this.filters.dateEnd;

      return this.contracts.filter((contract) => {
        const matchesClient = searchQuery
          ? (contract.client_name?.toLowerCase() || "").includes(searchQuery) ||
            (contract.partita_iva || "").includes(searchQuery) ||
            (contract.telefono || "").includes(searchQuery)
          : true;

        const matchesAgent = agentFilter
          ? String(contract.agent_id) === String(agentFilter)
          : true;

        const matchesStatus = statusFilter
          ? String(contract.status_id) === String(statusFilter)
          : true;

        const contractDate = contract.creation_date
          ? new Date(contract.creation_date)
          : null;

        const dateStart = dateStartFilter
          ? this.parseDateFromInput(dateStartFilter)
          : null;

        const dateEnd = dateEndFilter
          ? this.parseDateFromInput(dateEndFilter)
          : null;

        const matchesDate =
          contractDate &&
          (!dateStart || contractDate >= dateStart) &&
          (!dateEnd || contractDate <= dateEnd);

        return matchesClient && matchesAgent && matchesStatus && matchesDate;
      });
    },
  },

  methods: {
    async fetchContracts() {
      this.contracts = []; // 🔥 Reset per evitare dati vecchi

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contracts`
        );
        const clientsResponse = await axios.get(
          `${process.env.VUE_APP_API_URL}/clients`
        );

        const clientsMap = new Map(
          clientsResponse.data.map((client) => [client.id, client])
        );

        this.contracts = response.data.map((contract) => {
          const client = clientsMap.get(contract.client_id) || {};

          return {
            id: contract.id,
            client_id: contract.client_id,
            client_name: contract.client_name || "",
            partita_iva: client.partita_iva || "",
            telefono: client.telefono || "",
            agent_id: contract.agent_id,
            agent_name: contract.agent_name || "Senza Agente",
            vendor_name: contract.vendor || "Sconosciuto",
            status_id: contract.status_id,
            status_name: contract.status_name || "Sconosciuto",
            creation_date: contract.creation_date || "",
            signature_date: contract.signature_date || "",
            completion_date: contract.completion_date || null,
            notes: contract.notes || "",
          };
        });

        console.log("📌 Contratti aggiornati:", this.contracts);
      } catch (error) {
        console.error("❌ Errore nel caricamento dei contratti:", error);
      }
    },

    async fetchContractStatuses() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contract-status`
        );
        this.contractStatuses = response.data || [];
      } catch (error) {
        console.error(
          "Errore durante il recupero degli stati dei contratti:",
          error
        );
      }
    },

    async fetchClients() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/clients`
        );
        this.clients = response.data || [];
        console.log("Clienti ricevuti:", this.clients);
      } catch (error) {
        console.error("Errore durante il recupero dei clienti:", error);
      }
    },

    async fetchAgents() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );
        console.log("Risposta completa /users:", response.data);

        let users = response.data;

        if (Array.isArray(users) && Array.isArray(users[0])) {
          users = users[0];
        }

        this.agents = users.filter((user) => user.role_id === 2);
      } catch (error) {
        console.error("Errore durante il recupero degli agenti:", error);
        this.agents = [];
      }
    },

    applyFilters() {
      // Se hai logica di refresh asincrona mettila qui (opzionale)
      console.log("🔍 applyFilters chiamato!");
    },

    parseDateFromInput(input) {
      if (!input) return null;
      const parts = input.split("/");
      if (parts.length !== 3) return null;
      const [day, month, year] = parts;
      const formatted = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      const date = new Date(formatted);
      return isNaN(date) ? null : date;
    },

    debouncedSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.applyFilters(); // 👈 chiama qui
      }, 300);
    },

    editContract(contractId) {
      console.log("🛠️ Modifica contratto con ID:", contractId);
      this.$router.push({
        name: "ContractsDetails",
        params: { id: contractId.toString() },
      });
    },

    resetFilters() {
      this.filters = {
        agent: "",
        client: "",
        status_id: "",
        dateStart: "",
        dateEnd: "",
      };
    },

    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("it-IT");
    },
  },

  mounted() {
    this.fetchContracts();
    this.fetchAgents();
    this.fetchClients();
    this.fetchContractStatuses();
  },
};
</script>

<style scoped></style>
