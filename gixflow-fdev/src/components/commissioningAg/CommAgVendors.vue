<template>
  <div>
    <div class="header">
      <h3>Gestione Vendor</h3>
      <div class="actions">
        <button class="create-button" @click="openAddModal">+</button>
      </div>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <label>
        Nome Vendor:
        <input type="text" v-model="filterName" placeholder="Cerca vendor..." />
      </label>

      <label class="switch">
        <input type="checkbox" v-model="showArchived" />
        <span class="slider"></span>
      </label>
      <span>Mostra archiviati</span>

      <button @click="resetFilters">Reset</button>
    </div>

    <!-- MODALE PER AGGIUNGERE / MODIFICARE VENDOR -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ isEditing ? "Modifica Vendor" : "Nuovo Vendor" }}</h2>

        <label>Nome Vendor</label>
        <input v-model="currentVendor.name" placeholder="Inserisci nome" />

        <label>Descrizione</label>
        <input
          v-model="currentVendor.description"
          placeholder="Inserisci descrizione"
        />

        <div class="modal-buttons">
          <button class="close-button" @click="closeModal">Annulla</button>
          <button
            type="submit"
            @click="isEditing ? updateVendor() : addVendor()"
          >
            Salva
          </button>
        </div>
      </div>
    </div>

    <!-- Tabella Vendor -->
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Descrizione</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="vendor in paginatedVendors"
          :key="vendor.id"
          :class="{ 'archived-row': vendor.is_archived }"
        >
          <td>{{ vendor.id }}</td>
          <td>{{ vendor.name }}</td>
          <td>{{ vendor.description }}</td>
          <td>
            <span :class="{ archived: vendor.is_archived }">
              {{ vendor.is_archived ? "Archiviato" : "Attivo" }}
            </span>
          </td>
          <td>
            <button
              class="in-grid"
              @click="openEditModal(vendor)"
              title="Modifica"
            >
              <i class="fa-duotone fa-solid fa-pen"></i>
            </button>
            <button
              class="in-grid-red"
              @click="deleteVendor(vendor.id)"
              title="Elimina"
            >
              <i class="fa-duotone fa-solid fa-trash"></i>
            </button>
            <button
              class="in-grid-blue"
              @click="toggleArchive(vendor)"
              :title="
                vendor.is_archived ? 'Ripristina vendor' : 'Archivia vendor'
              "
            >
              <i
                v-if="vendor.is_archived"
                class="fas fa-undo"
                aria-hidden="true"
              ></i>
              <i v-else class="fa fa-archive" aria-hidden="true"></i>
            </button>
          </td>
        </tr>
        <tr v-if="paginatedVendors.length === 0">
          <td colspan="5" class="no-results">Nessun risultato trovato</td>
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
      vendors: [],
      currentVendor: { name: "", description: "", is_archived: 0 },
      showModal: false,
      isEditing: false,

      filterName: "",
      showArchived: false,

      currentPage: 1,
      itemsPerPage: 10,
    };
  },

  watch: {
    showArchived() {
      this.fetchVendors();
    },
  },

  computed: {
    filteredVendors() {
      return this.vendors.filter((vendor) => {
        const matchName = this.filterName
          ? vendor.name.toLowerCase().includes(this.filterName.toLowerCase())
          : true;
        const matchArchived = this.showArchived || vendor.is_archived === 0;
        return matchName && matchArchived;
      });
    },

    paginatedVendors() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredVendors.slice(start, start + this.itemsPerPage);
    },

    totalPages() {
      return Math.ceil(this.filteredVendors.length / this.itemsPerPage);
    },
  },

  async mounted() {
    await this.fetchVendors();
  },

  methods: {
    async fetchVendors() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/vendors`,
          {
            params: { showArchived: this.showArchived },
          }
        );
        this.vendors = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei vendor:", error);
      }
    },

    async addVendor() {
      if (!this.currentVendor.name) {
        return alert("Compila tutti i campi!");
      }

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/vendors`,
          this.currentVendor
        );
        this.closeModal();
        this.fetchVendors();
      } catch (error) {
        console.error("Errore nella creazione del vendor:", error);
      }
    },

    async updateVendor() {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/vendors/${this.currentVendor.id}`,
          this.currentVendor
        );
        alert("Vendor aggiornato!");
        this.closeModal();
        this.fetchVendors();
      } catch (error) {
        console.error("Errore nell'aggiornamento del vendor:", error);
      }
    },

    async deleteVendor(id) {
      if (!confirm("Eliminare questo vendor?")) return;
      try {
        await axios.delete(`${process.env.VUE_APP_API_URL}/vendors/${id}`);
        this.fetchVendors();
      } catch (error) {
        console.error("Errore nell'eliminazione del vendor:", error);
      }
    },

    async toggleArchive(vendor) {
      try {
        const newStatus = vendor.is_archived ? 0 : 1;
        await axios.put(
          `${process.env.VUE_APP_API_URL}/vendors/${vendor.id}/archive`,
          {
            is_archived: newStatus,
          }
        );
        this.fetchVendors();
      } catch (error) {
        console.error("Errore nell'archiviazione del vendor:", error);
      }
    },

    openEditModal(vendor) {
      this.currentVendor = { ...vendor };
      this.isEditing = true;
      this.showModal = true;
    },

    openAddModal() {
      this.currentVendor = { name: "", description: "", is_archived: 0 };
      this.isEditing = false;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    resetFilters() {
      this.filterName = "";
      this.showArchived = false;
    },

    changePage(page) {
      if (page !== this.currentPage) {
        this.currentPage = page;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
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
