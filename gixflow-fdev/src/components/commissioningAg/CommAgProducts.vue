<template>
  <div>
    <div class="header">
      <h3>Gestione Prodotti</h3>
      <div class="actions">
        <button class="create-button" @click="openAddModal">+</button>
      </div>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <label>
        Vendor:
        <select v-model="filterVendor">
          <option value="">Tutti</option>
          <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
            {{ vendor.name }}
          </option>
        </select>
      </label>

      <label>
        Nome Prodotto:
        <input
          type="text"
          v-model="filterName"
          placeholder="Cerca prodotto..."
        />
      </label>

      <label class="switch">
        <input type="checkbox" v-model="showArchived" />
        <span class="slider"></span>
      </label>
      <span>Mostra archiviate</span>

      <button @click="resetFilters">Reset</button>
    </div>

    <!-- MODALE PER AGGIUNGERE / MODIFICARE PRODOTTI -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ isEditing ? "Modifica Prodotto" : "Nuovo Prodotto" }}</h2>

        <label>Nome Prodotto</label>
        <input v-model="currentProduct.name" placeholder="Inserisci nome" />

        <label>Descrizione Prodotto</label>
        <input v-model="currentProduct.description" placeholder="Inserisci descrizione" />

        <label>Codice</label>
        <input v-model="currentProduct.code" placeholder="Inserisci codice" />

        <label>Vendor</label>
        <select v-model="currentProduct.vendor_id">
          <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
            {{ vendor.name }}
          </option>
        </select>

        <div class="modal-buttons">
          <button class="close-button" @click="closeModal">Annulla</button>
          <button
            type="submit"
            @click="isEditing ? updateProduct() : addProduct()"
          >
            Salva
          </button>
        </div>
      </div>
    </div>

    <!-- Tabella Prodotti -->
    <table class="commissioning-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Descrizione</th>
          <th>Vendor</th>
          <th>Codice</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tr v-if="paginatedProducts.length === 0">
        <td colspan="6" class="no-results">Nessun risultato trovato</td>
      </tr>
      <tbody>
        <tr
          v-for="product in paginatedProducts"
          :key="product.id"
          :class="{ 'archived-row': product.is_archived }"
        >
          <td>{{ product.id }}</td>
          <td>{{ product.name }}</td>
          <td>{{ product.description }}</td>
          <td>{{ getVendorName(product.vendor_id) }}</td>
          <td>{{ product.code }}</td>
          <td>
            <span :class="{ archived: product.is_archived }">
              {{ product.is_archived ? "Archiviato" : "Attivo" }}
            </span>
          </td>
          <td>
            <button
              class="in-grid"
              @click="openEditModal(product)"
              :title="'Modifica prodotto'"
            >
              <i class="fa-duotone fa-solid fa-pen"></i>
            </button>
            <button
              class="in-grid-red"
              @click="deleteProduct(product.id)"
              :title="'Cancella prodotto'"
            >
              <i class="fa-duotone fa-solid fa-trash"></i>
            </button>

            <button
              class="in-grid-blue"
              @click="toggleArchive(product)"
              :title="
                product.is_archived
                  ? 'Ripristina prodotto'
                  : 'Archivia prodotto'
              "
            >
              <i
                v-if="product.is_archived"
                class="fas fa-undo"
                aria-hidden="true"
              ></i>
              <i v-else class="fa fa-archive" aria-hidden="true"></i>
            </button>
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

export default {
  data() {
    return {
      products: [],
      vendors: [],
      currentProduct: { name: "", code: "", vendor_id: "", is_archived: 0 },
      showModal: false,
      isEditing: false,

      filterVendor: "",
      filterName: "",
      showArchived: false,

      currentPage: 1,
      itemsPerPage: 10,
    };
  },

  watch: {
    showArchived() {
      this.fetchData();
    },
  },

  computed: {
    filteredProducts() {
      return this.products.filter((product) => {
        const matchVendor = this.filterVendor
          ? product.vendor_id === this.filterVendor
          : true;
        const matchName = this.filterName
          ? product.name.toLowerCase().includes(this.filterName.toLowerCase())
          : true;
        const matchArchived = this.showArchived || product.is_archived === 0;

        return matchVendor && matchName && matchArchived;
      });
    },

    paginatedProducts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredProducts.slice(start, start + this.itemsPerPage);
    },

    totalPages() {
      return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    },
  },

  async mounted() {
    await this.fetchData();
  },

  methods: {
    async fetchData() {
      try {
        const [productsResponse, vendorsResponse] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/productsComm`, {
            params: { showArchived: this.showArchived },
          }),
          axios.get(`${process.env.VUE_APP_API_URL}/vendors`),
        ]);

        this.products = productsResponse.data;
        this.vendors = vendorsResponse.data;
      } catch (error) {
        console.error("Errore nel recupero dei dati:", error);
      }
    },

    async addProduct() {
      if (!this.currentProduct.name || !this.currentProduct.vendor_id) {
        return alert("Compila tutti i campi!");
      }

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/products`,
          this.currentProduct
        );
        this.closeModal();
        this.fetchData();
      } catch (error) {
        console.error("Errore nella creazione del prodotto:", error);
      }
    },

    async updateProduct() {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/products/${this.currentProduct.id}`,
          this.currentProduct
        );
        alert("Prodotto aggiornato!");
        this.closeModal();
        this.fetchData();
      } catch (error) {
        console.error("Errore nell'aggiornamento del prodotto:", error);
      }
    },

    async deleteProduct(id) {
      if (!confirm("Eliminare questo prodotto?")) return;
      try {
        await axios.delete(`${process.env.VUE_APP_API_URL}/products/${id}`);
        this.fetchData();
      } catch (error) {
        console.error("Errore nell'eliminazione del prodotto:", error);
      }
    },

    async toggleArchive(product) {
      try {
        const newStatus = product.is_archived ? 0 : 1;

        await axios.put(
          `${process.env.VUE_APP_API_URL}/products/${product.id}/archive`,
          { is_archived: newStatus }
        );

        this.fetchData();
      } catch (error) {
        console.error("Errore nell'archiviazione del prodotto:", error);
      }
    },

    openEditModal(product) {
      this.currentProduct = { ...product };
      this.isEditing = true;
      this.showModal = true;
    },

    openAddModal() {
      this.currentProduct = { name: "", code: "", vendor_id: "" };
      this.isEditing = false;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
    },

    resetFilters() {
      this.filterVendor = "";
      this.filterName = "";
      this.showArchived = false;
    },

    getVendorName(id) {
      const vendor = this.vendors.find((v) => v.id === id);
      return vendor ? vendor.name : "N/A";
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
