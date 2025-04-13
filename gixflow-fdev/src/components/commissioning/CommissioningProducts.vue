<template>
    <div>
      <h1>Gestione Prodotti</h1>
  
      <div class="product-form">
        <input v-model="newProduct.name" placeholder="Nome Prodotto" />
        <input v-model="newProduct.code" placeholder="Codice" />
        <select v-model="newProduct.vendor_id">
          <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
            {{ vendor.name }}
          </option>
        </select>
        <button @click="addProduct">Aggiungi Prodotto</button>
      </div>
  
      <table class="commissioning-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Codice</th>
            <th>Vendor</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td><input v-model="product.name" /></td>
            <td><input v-model="product.code" /></td>
            <td>
              <select v-model="product.vendor_id">
                <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                  {{ vendor.name }}
                </option>
              </select>
            </td>
            <td>
              <button @click="updateProduct(product)">Salva</button>
              <button @click="deleteProduct(product.id)">Elimina</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import "@/styles/global.css";
  
  export default {
    data() {
      return {
        products: [],
        vendors: [],
        newProduct: { name: "", code: "", vendor_id: "" },
      };
    },
    methods: {
      async fetchData() {
        try {
          this.products = (await axios.get(`${process.env.VUE_APP_API_URL}/productsComm`)).data;
          this.vendors = (await axios.get(`${process.env.VUE_APP_API_URL}/vendors`)).data;
        } catch (error) {
          console.error("Errore nel recupero dei dati:", error);
        }
      },
      async addProduct() {
        try {
          await axios.post(`${process.env.VUE_APP_API_URL}/products`, this.newProduct);
          this.newProduct = { name: "", code: "", vendor_id: "" };
          this.fetchData();
        } catch (error) {
          console.error("Errore nella creazione del prodotto:", error);
        }
      },
      async updateProduct(product) {
        try {
          await axios.put(`${process.env.VUE_APP_API_URL}/products/${product.id}`, product);
          alert("Prodotto aggiornato!");
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
    },
    mounted() {
      this.fetchData();
    },
  };
  </script>
  