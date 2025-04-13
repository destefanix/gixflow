<template>
    <div>
      <h2>Aggiustamenti Manuali</h2>
  
      <div class="form">
        <label>Fisso Agente (€)</label>
        <input v-model="adjustments.fixed_salary" type="number" />
  
        <label>Rimborso Spese (€)</label>
        <input v-model="adjustments.expense_reimbursement" type="number" />
  
        <label>Altri Aggiustamenti (€)</label>
        <input v-model="adjustments.manual_adjustments" type="number" />
  
        <button @click="saveAdjustments">Salva</button>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        adjustments: { fixed_salary: 0, expense_reimbursement: 0, manual_adjustments: 0 },
      };
    },
    methods: {
      async saveAdjustments() {
        await axios.post(`${process.env.VUE_APP_API_URL}/adjustments`, this.adjustments);
        alert("Aggiustamenti salvati!");
      }
    }
  };
  </script>
  