<template>
  <div>
    <div class="header">
      <h3>Provvigioni</h3>

      <div class="actions">
        <button class="create-button" @click="openAddModal">+</button>
      </div>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <!-- Filtro Vendor -->
      <label>
        Vendor:
        <select v-model="filterVendor">
          <option value="">Tutti</option>
          <option
            v-for="vendor in vendors"
            :key="vendor.id"
            :value="vendor.name"
          >
            {{ vendor.name }}
          </option>
        </select>
      </label>

      <!-- Filtro Prodotto -->
      <label>
        Prodotto:
        <select v-model="currentCommission.product_id">
          <option value="" disabled>Seleziona un Prodotto</option>
          <option
            v-for="product in filteredProducts"
            :key="product.id"
            :value="product.id"
          >
            {{ product.name }}
          </option>
        </select>
      </label>

      <label class="switch">
        <input type="checkbox" v-model="showArchived" />
        <span class="slider"></span>
      </label>
      <span>Mostra archiviate</span>

      <!-- Pulsante Reset Filtri -->
      <button @click="resetFilters">Reset</button>
    </div>

    <!-- Tabella provvigioni -->
    <table class="commissioning-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Vendor</th>
          <th>Prodotto</th>
          <th>Provvigione (€)</th>
          <th>Valido dal</th>
          <th>Valido fino al</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tr v-if="paginatedCommissions.length === 0">
        <td colspan="8" class="no-results">Nessun risultato trovato</td>
      </tr>
      <tbody>
        <tr
          v-for="commission in paginatedCommissions"
          :key="commission.id"
          :class="{ 'archived-row': commission.is_archived }"
        >
          <td>{{ commission.id }}</td>
          <td>{{ commission.vendor_name }}</td>
          <td>{{ commission.product_name || "N/A" }}</td>
          <td>{{ commission.commission }} €</td>
          <td>{{ formatDate(commission.valid_from) }}</td>
          <td>{{ formatDate(commission.valid_to) }}</td>
          <td>
            <span :class="{ archived: commission.is_archived }">
              {{ commission.is_archived ? "Archiviata" : "Attiva" }}
            </span>
          </td>
          <td>
            <button
              class="in-grid"
              @click="openEditModal(commission)"
              :title="'Modifica provvigione'"
            >
              <i class="fa-duotone fa-solid fa-pen"></i>
            </button>
            <button
              class="in-grid-red"
              @click="deleteCommission(commission.id)"
              :title="'Cancella provvigione'"
            >
              <i class="fa-duotone fa-solid fa-trash"></i>
            </button>

            <button
              class="in-grid-blue"
              @click="toggleArchive(commission)"
              :title="
                commission.is_archived
                  ? 'Ripristina provvigione'
                  : 'Archivia provvigione'
              "
            >
              <i
                v-if="commission.is_archived"
                class="fas fa-undo"
                aria-hidden="true"
              ></i>
              <i v-else class="fa fa-archive" aria-hidden="true"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="prevPage">
        Precedente
      </button>

      <span v-for="page in totalPages" :key="page">
        <button
          :class="{ active: page === currentPage }"
          @click="changePage(page)"
          :disabled="page === currentPage"
        >
          {{ page }}
        </button>
      </span>

      <button :disabled="currentPage === totalPages" @click="nextPage">
        Successivo
      </button>
    </div>

    <!-- MODALE PER AGGIUNGERE / MODIFICARE PROVVIGIONI -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ isEditing ? "Modifica Provvigione" : "Nuova Provvigione" }}</h2>

        <!-- Selezione Vendor -->
        <label>Vendor</label>
        <select
          v-model="currentCommission.vendor_id"
          @change="fetchProductsByVendor"
        >
          <option value="" disabled>Seleziona un Vendor</option>
          <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
            {{ vendor.name }}
          </option>
        </select>

        <!-- Selezione Prodotto -->
        <label>Prodotto</label>
        <select v-model="currentCommission.product_id">
          <option value="" disabled>Seleziona un Prodotto</option>
          <option
            v-for="product in filteredProducts"
            :key="product.id"
            :value="product.id"
          >
            {{ product.name }}
          </option>
        </select>

        <!-- Campi di input -->
        <label>Provvigione (€)</label>
        <input
          v-model="currentCommission.commission"
          type="number"
          step="0.01"
          placeholder="Importo in €"
        />

        <label>Valido dal</label>
        <input v-model="currentCommission.valid_from" type="date" />

        <label>Valido fino</label>
        <input v-model="currentCommission.valid_to" type="date" />

        <div class="modal-buttons">
          <button class="close-button" @click="closeModal">Annulla</button>
          <button
            type="submit"
            @click="isEditing ? updateCommission() : addCommission()"
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
import "@/styles/global.css";

export default {
  data() {
    return {
      commissions: [],
      vendors: [],
      products: [],
      filteredProducts: [],

      filterVendor: "",
      filterProduct: "",
      showArchived: JSON.parse(localStorage.getItem("showArchived")) || false, // Carica lo stato salvato

      currentCommission: {
        vendor_id: "",
        product_id: "",
        commission: "",
        valid_from: "",
        valid_to: "",
      },
      showModal: false,
      isEditing: false,

      currentPage: 1, // Pagina attuale
      itemsPerPage: 10, // Numero di elementi per pagina
    };
  },

  async mounted() {
    await this.fetchCommissions(); // Recupera provvigioni rispettando showArchived
    await this.fetchVendors();
    await this.fetchProducts();
  },

  watch: {
    showArchived(newValue) {
      localStorage.setItem("showArchived", JSON.stringify(newValue)); // Salva il valore
      this.fetchCommissions(); // Ricarica i dati
    },

    "currentCommission.vendor_id": function () {
      this.fetchProductsByVendor();
    },
  },

  computed: {
    filteredCommissions() {
      return this.commissions.filter((commission) => {
        const matchVendor = this.filterVendor
          ? commission.vendor_name === this.filterVendor
          : true;
        const matchProduct = this.filterProduct
          ? commission.product_name === this.filterProduct
          : true;
        const matchArchived = this.showArchived || !commission.is_archived;
        return matchVendor && matchProduct && matchArchived;
      });
    },
    paginatedCommissions() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredCommissions.slice(start, end);
    },

    totalPages() {
      return Math.ceil(this.filteredCommissions.length / this.itemsPerPage);
    },
  },

  methods: {
    async fetchProductsByVendor() {
      const vendorId = this.currentCommission.vendor_id;

      if (!vendorId) {
        console.warn("⚠️ Nessun vendor selezionato.");
        this.filteredProducts = [];
        return;
      }

      if (!this.products.length) {
        await this.fetchProducts();
      }

      this.filteredProducts = this.products.filter(
        (p) => Number(p.vendor_id) === Number(vendorId)
      );

      if (
        !this.filteredProducts.some(
          (p) => p.id === this.currentCommission.product_id
        )
      ) {
        console.warn("⚠️ Prodotto non disponibile, resetto.");
        this.currentCommission.product_id = "";
      }
    },

    async fetchCommissions() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/products_commissioning`,
          {
            params: {
              showArchived: this.showArchived,
              page: this.currentPage,
              limit: this.itemsPerPage,
            },
          }
        );

        this.commissions = response.data;
      } catch (error) {
        console.error("Errore nel recupero delle provvigioni:", error);
      }
    },

    async fetchVendors() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/vendors`
        );
        this.vendors = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei vendor:", error);
      }
    },

    async fetchProducts() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/productsComm`
        );
        this.products = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei prodotti:", error);
      }
    },

    async openEditModal(commission) {
      this.currentCommission = {
        id: commission.id,
        vendor_id: commission.vendor_id ? Number(commission.vendor_id) : null,
        product_id: commission.product_id
          ? Number(commission.product_id)
          : null,
        commission: commission.commission,
        valid_from: this.formatDateForInput(commission.valid_from),
        valid_to: this.formatDateForInput(commission.valid_to),
      };

      if (!this.currentCommission.vendor_id) {
        console.warn("⚠️ Nessun vendor assegnato! Bug nel backend o frontend?");
      } else {
        await this.fetchProductsByVendor();
      }

      this.isEditing = true;
      this.showModal = true;
    },

    async addCommission() {
      if (
        !this.currentCommission.vendor_id ||
        !this.currentCommission.product_id ||
        !this.currentCommission.commission
      ) {
        alert("Compila tutti i campi!");
        return;
      }

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/products_commissioning`,
          this.currentCommission
        );
        this.closeModal();
        this.fetchCommissions();
      } catch (error) {
        console.error("Errore nella creazione della provvigione:", error);
      }
    },

    async updateCommission() {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/products_commissioning/${this.currentCommission.id}`,
          this.currentCommission
        );
        alert("Provvigione aggiornata!");
        this.closeModal();
        this.fetchCommissions();
      } catch (error) {
        console.error("Errore nell'aggiornamento della provvigione:", error);
      }
    },

    async deleteCommission(id) {
      if (!confirm("Eliminare questa provvigione?")) return;
      await axios.delete(
        `${process.env.VUE_APP_API_URL}/products_commissioning/${id}`
      );
      this.fetchCommissions();
    },

    async toggleArchive(commission) {
      try {
        const newStatus = commission.is_archived ? 0 : 1;
        await axios.put(
          `${process.env.VUE_APP_API_URL}/products_commissioning/${commission.id}/archive`,
          { is_archived: newStatus }
        );

        await this.fetchCommissions(); // Ricarica la lista immediatamente
      } catch (error) {
        console.error("Errore nell'archiviazione della provvigione:", error);
      }
    },

    openAddModal() {
      this.currentCommission = {
        vendor_id: "",
        product_id: "",
        commission: "",
        valid_from: "",
        valid_to: "",
      };
      this.isEditing = false;
      this.showModal = true;
      this.filteredProducts = [];
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

    resetFilters() {
      this.filterVendor = "";
      this.filterProduct = "";
      this.showArchived = false;
    },

    closeModal() {
      this.showModal = false;
    },

    changePage(page) {
      if (page !== this.currentPage) {
        this.currentPage = page;
        this.fetchCommissions();
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.fetchCommissions(); // 🔄 Ricarica i dati
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.fetchCommissions(); // 🔄 Ricarica i dati
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
