<template>
    <div>
      <h1>Gestione Vendor</h1>
  
      <div class="vendor-form">
        <input v-model="newVendor.name" placeholder="Nome Vendor" />
        <input v-model="newVendor.description" placeholder="Descrizione" />
        <button @click="addVendor">Aggiungi Vendor</button>
      </div>
  
      <table class="commissioning-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Descrizione</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vendor in vendors" :key="vendor.id">
            <td>{{ vendor.id }}</td>
            <td>
              <input v-model="vendor.name" />
            </td>
            <td>
              <input v-model="vendor.description" />
            </td>
            <td>
              <button @click="updateVendor(vendor)">Salva</button>
              <button @click="deleteVendor(vendor.id)">Elimina</button>
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
        vendors: [],
        newVendor: { name: "", description: "" },
      };
    },
    methods: {
      async fetchVendors() {
        try {
          const response = await axios.get(`${process.env.VUE_APP_API_URL}/vendors`);
          this.vendors = response.data;
        } catch (error) {
          console.error("Errore nel recupero dei vendor:", error);
        }
      },
      async addVendor() {
        if (!this.newVendor.name) return alert("Inserisci un nome!");
  
        try {
          await axios.post(`${process.env.VUE_APP_API_URL}/vendors`, this.newVendor);
          this.newVendor = { name: "", description: "" };
          this.fetchVendors();
        } catch (error) {
          console.error("Errore nella creazione del vendor:", error);
        }
      },
      async updateVendor(vendor) {
        try {
          await axios.put(`${process.env.VUE_APP_API_URL}/vendors/${vendor.id}`, vendor);
          alert("Vendor aggiornato!");
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
    },
    mounted() {
      this.fetchVendors();
    },
  };
  </script>
  