<template>
    <div>
      <h1>Modifica Contratto #{{ contract.id }}</h1>
  
      <!-- SEZIONE: Dati Appuntamento -->
      <section>
        <h3>Step #1 - Dati dell'Appuntamento</h3>
  
        <table class="contracts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Telefono</th>
              <th>Agente</th>
              <th>Data e ora</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ contract.appointment_id }}</td>
              <td>{{ contract.client_name }}</td>
              <td>{{ contract.client_phone || "—" }}</td>
              <td>{{ contract.agent_name }}</td>
              <td>{{ formatDateTime(contract.appointment_date) }}</td>
              <td>{{ contract.status_name }}</td>
            </tr>
          </tbody>
        </table>
      </section>
  
      <!-- SEZIONE: Modifica Dati Cliente -->
      <section class="section-step">
        <h3>Step #2 - Modifica Dati Cliente</h3>
        
        <form @submit.prevent="updateClient">
          <div class="form-grid">
            <div class="form-column">
              <label>Ragione Sociale: <input type="text" v-model="client.ragsoc" required /></label>
              <label>Forma Giuridica: 
                <select v-model="client.forma_giuridica_id" required>
                  <option v-for="form in legalForms" :key="form.id" :value="form.id">{{ form.name }}</option>
                </select>
              </label>
              <label>Partita IVA: <input type="text" v-model="client.partita_iva" required /></label>
            </div>
            <div class="form-column">
              <label>Indirizzo: <input type="text" v-model="client.indirizzo" /></label>
              <label>Città: <input type="text" v-model="client.city" /></label>
              <label>Provincia: <input type="text" v-model="client.provincia" /></label>
            </div>
          </div>
          <button type="submit" class="input-button">Salva Cliente</button>
        </form>
      </section>
  
      <!-- SEZIONE: Prodotti -->
      <section class="section-step">
        <h3>Step #3 - Modifica Prodotti</h3>
  
        <table class="contracts-table">
          <thead>
            <tr>
              <th>Prodotto</th>
              <th>Quantità</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in contract.products" :key="product.id">
              <td>{{ product.name }}</td>
              <td><input type="number" v-model="product.quantity" min="1" /></td>
              <td>
                <button @click="removeProduct(product.id)" class="cancel-contract-button">Rimuovi</button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <button @click="openProductModal" class="input-button">Aggiungi Prodotto</button>
      </section>
  
      <!-- SEZIONE: Documenti -->
      <section class="section-step">
        <h3>Step #4 - Documentazione</h3>
  
        <table class="contracts-table">
          <thead>
            <tr>
              <th>Nome File</th>
              <th>Tipo Documento</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in contract.documents" :key="doc.id">
              <td><a :href="doc.file_url" target="_blank">{{ doc.file_name }}</a></td>
              <td>{{ getDocumentTypeName(doc.document_type_id) }}</td>
              <td>
                <button @click="deleteDocument(doc.id)" class="cancel-contract-button">Rimuovi</button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <input type="file" @change="uploadDocument" />
      </section>
  
      <!-- BOTTONI FINALI -->
      <section class="actions">
        <button @click="saveContract" class="input-button">Salva Modifiche</button>
        <button @click="deleteContract" class="cancel-contract-button">Elimina Contratto</button>
      </section>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    props: ["contractId"],
  
    data() {
      return {
        contract: {},
        client: {},
        legalForms: [],
      };
    },
  
    methods: {
      async fetchContract() {
        try {
          const response = await axios.get(`${process.env.VUE_APP_API_URL}/contracts/${this.contractId}`);
          this.contract = response.data;
          this.client = { ...response.data.client };
        } catch (error) {
          console.error("Errore nel caricamento del contratto:", error);
        }
      },
  
      async updateClient() {
        try {
          await axios.put(`${process.env.VUE_APP_API_URL}/clients/${this.client.id}`, this.client);
          alert("Cliente aggiornato!");
        } catch (error) {
          console.error("Errore aggiornamento cliente:", error);
        }
      },
  
      async removeProduct(productId) {
        this.contract.products = this.contract.products.filter((p) => p.id !== productId);
      },
  
      async uploadDocument(event) {
        const file = event.target.files[0];
        if (!file) return;
  
        const formData = new FormData();
        formData.append("file", file);
        formData.append("contract_id", this.contract.id);
  
        try {
          const response = await axios.post(`${process.env.VUE_APP_API_URL}/contracts/upload`, formData);
          this.contract.documents.push(response.data);
        } catch (error) {
          console.error("Errore caricamento documento:", error);
        }
      },
  
      async deleteDocument(docId) {
        try {
          await axios.delete(`${process.env.VUE_APP_API_URL}/contracts/${this.contract.id}/documents/${docId}`);
          this.contract.documents = this.contract.documents.filter((doc) => doc.id !== docId);
        } catch (error) {
          console.error("Errore eliminazione documento:", error);
        }
      },
  
      async saveContract() {
        try {
          await axios.put(`${process.env.VUE_APP_API_URL}/contracts/${this.contract.id}`, this.contract);
          alert("Contratto aggiornato con successo!");
        } catch (error) {
          console.error("Errore aggiornamento contratto:", error);
        }
      },
  
      async deleteContract() {
        if (confirm("Sei sicuro di voler eliminare questo contratto?")) {
          try {
            await axios.delete(`${process.env.VUE_APP_API_URL}/contracts/${this.contract.id}`);
            this.$router.push("/contracts");
          } catch (error) {
            console.error("Errore eliminazione contratto:", error);
          }
        }
      },
  
      formatDateTime(date) {
        return new Date(date).toLocaleString("it-IT");
      },
  
      getDocumentTypeName(documentTypeId) {
        return this.legalForms.find((type) => type.id === documentTypeId)?.name || "Sconosciuto";
      },
    },
  
    mounted() {
      this.fetchContract();
    },
  };
  </script>
  
  <style scoped>
  @import "@/styles/contracts-page.css";
  </style>
  