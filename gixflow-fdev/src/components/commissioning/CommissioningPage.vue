<template>
    <div>
      <h1>Gestione Provvigioni</h1>
  
      <!-- Navbar -->
      <div class="tabs">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          @click="selectedTab = tab.name"
          :class="['tab', { active: selectedTab === tab.name }]"
        >
          <i :class="tab.icon" class="tab-icon"></i>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>
  
      <!-- Contenuto dinamico -->
      <div class="tab-content">
        <component :is="selectedTabComponent" />
      </div>
    </div>
  </template>
  
  <script>
  import CommissioningVendors from "./CommissioningVendors.vue";
import CommissioningProducts from "./CommissioningProducts.vue"; 
  import CommissioningPrices from "./CommissioningPrices.vue";
  import CommissioningAdj from "./CommissioningAdj.vue";
  
  export default {
    components: {
      CommissioningVendors,
       CommissioningProducts, 
      CommissioningPrices,
      CommissioningAdj,      

    },
  
    data() {
      return {
        selectedTab: "CommissioningVendors",
        tabs: [
          { name: "CommissioningVendors", label: "Vendors", icon: "fas fa-building" },
           { name: "CommissioningProducts", label: "Prodotti", icon: "fas fa-box" }, 
          { name: "CommissioningPrices", label: "Provvigioni", icon: "fas fa-percent" },
          { name: "CommissioningAdj", label: "Aggiustamenti", icon: "fas fa-cogs" },

        ],
      };
    },
  
    computed: {
      selectedTabComponent() {
        return this.selectedTab;
      },
    },
  };
  </script>
  
  <style scoped>
  /* Stili per la navbar delle schede */
  .tabs {
    display: flex;
    gap: 15px;
    padding: 10px;
    border-bottom: 2px solid #dcdde1;
  }
  
  .tab {
    cursor: pointer;
    padding: 10px;
    font-weight: bold;
  }
  
  .tab.active {
    border-bottom: 3px solid #71b095;
  }
  </style>
  