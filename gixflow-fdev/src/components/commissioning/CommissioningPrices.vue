<template>
    <div>
      <h2>Assegna Provvigioni</h2>
      <table>
        <thead>
          <tr>
            <th>Prodotto</th>
            <th>Commissione (%)</th>
            <th>Valido dal</th>
            <th>Valido fino</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="commission in commissions" :key="commission.id">
            <td>{{ commission.product_name }}</td>
            <td><input v-model="commission.commission" type="number" /></td>
            <td><input v-model="commission.valid_from" type="date" /></td>
            <td><input v-model="commission.valid_to" type="date" /></td>
            <td><button @click="updateCommission(commission)">Salva</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        commissions: [],
      };
    },
    async mounted() {
      this.commissions = (await axios.get(`${process.env.VUE_APP_API_URL}/products_commissioning`)).data;
    },
    methods: {
      async updateCommission(commission) {
        await axios.put(`${process.env.VUE_APP_API_URL}/products_commissioning/${commission.id}`, commission);
      },
    },
  };
  </script>
  