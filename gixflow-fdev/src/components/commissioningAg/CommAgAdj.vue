<template>
  <div>
    <div class="header">
      <h3>Aggiustamenti Manuali</h3>

      <div class="actions">
        <button class="create-button" @click="openAddModal">+</button>
      </div>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <!-- Filtro per Tipo di Aggiustamento -->
      <label>
        Tipo Aggiustamento:
        <select v-model="filterAdjustmentType">
          <option value="">Tutti</option>
          <option
            v-for="type in adjustmentTypes"
            :key="type.id"
            :value="type.name"
          >
            {{ type.name }}
          </option>
        </select>
      </label>

      <!-- Filtro per Agente -->
      <label>
        Agente:
        <select v-model="filterAgent">
          <option value="">Tutti</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">
            {{ agent.cognome }} {{ agent.nome }}
          </option>
        </select>
      </label>

      <!-- Filtro per Mostrare/Nascondere Archiviate -->
      <label class="switch">
        <input type="checkbox" v-model="showArchived" />
        <span class="slider"></span>
      </label>
      <span>Mostra archiviate</span>

      <!-- Pulsante Reset Filtri -->
      <button @click="resetFilters">Reset</button>
    </div>

    <!-- Tabella aggiustamenti -->
    <table class="commissioning-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome Aggiustamento</th>
          <th>Agente</th>
          <th>Importo (€)</th>
          <th>Valido dal</th>
          <th>Valido fino al</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="adjustment in paginatedAdjustments"
          :key="adjustment.id"
          :class="{ 'archived-row': adjustment.is_archived }"
        >
          <td>{{ adjustment.id }}</td>
          <td>{{ adjustment.adjustment_name }}</td>
          <td>{{ adjustment.agent_name }}</td>
          <td>{{ adjustment.amount }} €</td>
          <td>{{ formatDate(adjustment.valid_from) }}</td>
          <td>{{ formatDate(adjustment.valid_to) }}</td>
          <td>
            <span :class="{ archived: adjustment.is_archived }">
              {{ adjustment.is_archived ? "Archiviato" : "Attivo" }}
            </span>
          </td>
          <td>
            <button
              class="in-grid"
              @click="openEditModal(adjustment)"
              title="Modifica"
            >
              <i class="fa fa-pen"></i>
            </button>
            <button
              class="in-grid-red"
              @click="deleteAdjustment(adjustment.id)"
              title="Elimina"
            >
              <i class="fa fa-trash"></i>
            </button>
            <button
              class="in-grid-blue"
              @click="toggleArchive(adjustment)"
              :title="adjustment.is_archived ? 'Ripristina' : 'Archivia'"
            >
              <i v-if="adjustment.is_archived" class="fas fa-undo"></i>
              <i v-else class="fa fa-archive"></i>
            </button>
          </td>
        </tr>
        <!-- MESSAGGIO SE NON CI SONO RISULTATI -->
        <tr v-if="paginatedAdjustments.length === 0">
          <td colspan="8" class="no-results">Nessun risultato trovato</td>
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

    <!-- MODALE PER AGGIUNGERE / MODIFICARE -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>
          {{ isEditing ? "Modifica Aggiustamento" : "Nuovo Aggiustamento" }}
        </h2>

        <!-- Selezione Tipo Aggiustamento -->
        <label>Tipo Aggiustamento</label>
        <select v-model="currentAdjustment.adjustment_type_id">
          <option value="" disabled>Seleziona un tipo</option>
          <option
            v-for="type in adjustmentTypes"
            :key="type.id"
            :value="type.id"
          >
            {{ type.name }}
          </option>
        </select>

        <!-- Selezione Agente -->
        <label>Agente</label>
        <select v-model="currentAdjustment.user_id">
          <option value="" disabled>Seleziona un agente</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">
            {{ agent.cognome }} {{ agent.nome }}
          </option>
        </select>

        <!-- Importo -->
        <label>Importo (€)</label>
        <input
          v-model="currentAdjustment.amount"
          type="number"
          step="0.01"
          placeholder="Importo in €"
        />

        <!-- Date -->
        <label>Valido dal</label>
        <input v-model="currentAdjustment.valid_from" type="date" />
        <label>Valido fino</label>
        <input v-model="currentAdjustment.valid_to" type="date" />

        <div class="modal-buttons">
          <button class="close-button" @click="closeModal">Annulla</button>
          <button
            type="submit"
            @click="isEditing ? updateAdjustment() : addAdjustment()"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      adjustments: [],
      adjustmentTypes: [],
      agents: [],
      currentAdjustment: {
        adjustment_type_id: "",
        user_id: "",
        amount: "",
        valid_from: "",
        valid_to: "",
      },
      filterAdjustmentType: "",
      filterAgent: "",
      showModal: false,
      isEditing: false,
      showArchived: JSON.parse(localStorage.getItem("showArchived")) || false,

      currentPage: 1,
      itemsPerPage: 10,
    };
  },

  async mounted() {
    await this.fetchAdjustments();
    await this.fetchAdjustmentTypes();
    await this.fetchAgents();
  },

  watch: {
    showArchived(newValue) {
      localStorage.setItem("showArchived", JSON.stringify(newValue));
      this.fetchAdjustments();
    },
  },

  computed: {
    filteredAdjustments() {
      return this.adjustments.filter((adjustment) => {
        const matchType = this.filterAdjustmentType
          ? adjustment.adjustment_name === this.filterAdjustmentType
          : true;
        const matchAgent = this.filterAgent
          ? adjustment.agent_name === this.filterAgent
          : true;
        return matchType && matchAgent;
      });
    },
    paginatedAdjustments() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredAdjustments.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredAdjustments.length / this.itemsPerPage);
    },
  },

  methods: {
    async fetchAdjustments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/manual-adjustments`,
          {
            params: { showArchived: this.showArchived }, // Passiamo il parametro
          }
        );
        this.adjustments = response.data;
      } catch (error) {
        console.error("Errore nel recupero degli aggiustamenti:", error);
      }
    },

    async fetchAdjustmentTypes() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/adjustment-types-table`
        );

        // Controlliamo se la risposta ha un array annidato
        this.adjustmentTypes = response.data.types || response.data || [];
      } catch (error) {
        console.error("Errore nel recupero dei tipi di aggiustamenti:", error);
      }
    },

    async fetchAgents() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );
        const allUsers = Array.isArray(response.data)
          ? response.data.flat()
          : [];

        // Filtra solo gli agenti e rinomina i campi se necessario
        this.agents = this.removeDuplicates(
          allUsers
            .filter((user) => user.role_id === 2)
            .map((agent) => ({
              ...agent,
              surname: agent.surname || agent.last_name, // Assicura la compatibilità con il backend
              name: agent.name || agent.first_name, // Assicura la compatibilità con il backend
            }))
        );
      } catch (error) {
        console.error("Errore nel recupero degli agenti:", error);
      }
    },

    async addAdjustment() {
      try {
        const payload = {
          adjustment_type_id: this.currentAdjustment.adjustment_type_id,
          user_id: this.currentAdjustment.user_id,
          amount: this.currentAdjustment.amount,
          valid_from: this.formatDateForBackend(
            this.currentAdjustment.valid_from
          ),
          valid_to: this.formatDateForBackend(this.currentAdjustment.valid_to),
        };

        await axios.post(
          `${process.env.VUE_APP_API_URL}/manual-adjustments`,
          payload
        );
        this.closeModal();
        this.fetchAdjustments();
      } catch (error) {
        console.error(
          "Errore nella creazione dell'aggiustamento:",
          error.response?.data || error
        );
      }
    },

    async updateAdjustment() {
      try {
        if (!this.currentAdjustment.id) {
          console.error("Errore: ID aggiustamento mancante!");
          return;
        }

        const payload = {
          adjustment_type_id: this.currentAdjustment.adjustment_type_id,
          user_id: this.currentAdjustment.user_id,
          amount: this.currentAdjustment.amount,
          valid_from: this.formatDateForBackend(
            this.currentAdjustment.valid_from
          ),
          valid_to: this.formatDateForBackend(this.currentAdjustment.valid_to),
        };

        await axios.put(
          `${process.env.VUE_APP_API_URL}/manual-adjustments/${this.currentAdjustment.id}`,
          payload
        );
        this.closeModal();
        this.fetchAdjustments();
      } catch (error) {
        console.error(
          "Errore nell'aggiornamento dell'aggiustamento:",
          error.response?.data || error
        );
      }
    },

    async deleteAdjustment(id) {
      if (!confirm("Eliminare questo aggiustamento?")) return;
      await axios.delete(
        `${process.env.VUE_APP_API_URL}/manual-adjustments/${id}`
      );
      this.fetchAdjustments();
    },

    async toggleArchive(adjustment) {
      try {
        const newStatus = adjustment.is_archived ? 0 : 1;
        await axios.put(
          `${process.env.VUE_APP_API_URL}/manual-adjustments/${adjustment.id}/archive`,
          { is_archived: newStatus }
        );
        await this.fetchAdjustments();
      } catch (error) {
        console.error("Errore nell'archiviazione dell'aggiustamento:", error);
      }
    },

    openAddModal() {
      this.currentAdjustment = {
        adjustment_type_id: "",
        user_id: "",
        amount: "",
        valid_from: "",
        valid_to: "",
      };
      this.isEditing = false;
      this.showModal = true;
    },

    openEditModal(adjustment) {
      this.currentAdjustment = {
        ...adjustment,
        valid_from: this.formatDateForInput(adjustment.valid_from),
        valid_to: this.formatDateForInput(adjustment.valid_to),
      };
      this.isEditing = true;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    removeDuplicates(array) {
      return array.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("it-IT");
    },

    formatDateForInput(dateString) {
      if (!dateString) return "";
      return dateString.split("T")[0];
    },

    formatDateForBackend(dateString) {
      if (!dateString) return null;
      return new Date(dateString).toISOString().split("T")[0];
    },

    resetFilters() {
      this.filterAdjustmentType = "";
      this.filterAgent = "";
      this.showArchived = false;
    },

    changePage(page) {
      if (page !== this.currentPage) {
        this.currentPage = page;
        this.fetchAdjustments();
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchAdjustments();
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.fetchAdjustments();
      }
    },
  },
};
</script>

<style scoped>
.archived-row {
  color: #c35573 !important;
  font-weight: bold;
}
</style>
