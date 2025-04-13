<template>
  <div>
    <h1>Commissioning Agenti</h1>

    <!-- Navbar -->
    <div class="tab-container">
      <div
        v-for="tab in tabs"
        :key="tab.name"
        :class="['tab-item', { active: selectedTab === tab.name }]"
        @click="selectedTab = tab.name"
      >
        <i :class="tab.icon"></i>
        <span>{{ tab.label }}</span>
      </div>
    </div>

    <!-- Contenuto dinamico -->
    <div class="tab-content">
      <component :is="selectedTab"></component>
    </div>
  </div>
</template>


<script>
import "@/styles/global.css";

import CommAgVendors from "./CommAgVendors.vue";
import CommAgProducts from "./CommAgProducts.vue";
import CommAgPrices from "./CommAgPrices.vue";
import CommAgAdj from "./CommAgAdj.vue"; 
import CommAgGen from "./CommAgGen.vue"; 
import CommAgArch from "./CommAgArch.vue"; 

export default {
  components: {
    CommAgVendors,
    CommAgProducts,
    CommAgPrices,
    CommAgAdj,
    CommAgGen,
    CommAgArch,
  },

  data() {
    return {
      selectedTab: "CommAgVendors", // Tab predefinita
      tabs: [
        { name: "CommAgVendors", label: "Vendors", icon: "fas fa-building" },
        { name: "CommAgProducts", label: "Prodotti", icon: "fas fa-box" },
        { name: "CommAgPrices", label: "Provvigioni", icon: "fas fa-percent" },
        { name: "CommAgAdj", label: "Altri elementi", icon: "fas fa-cogs" },
        { name: "CommAgGen", label: "Genera consuntivi", icon: "fas fa-coins" },
        { name: "CommAgArch", label: "Archivio consuntivi", icon: "fas fa-coins" },   
      ],
    };
  },
};
</script>


<style scoped>
.tab-container {
  display: flex;
  border-bottom: 2px solid #ddd;
  margin-bottom: 20px;
  justify-content: left;
}

.tab-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: #555;
  transition: all 0.2s ease-in-out;
  border-radius: 5px 5px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-item:hover {
  background-color: #f8f9fa;
}

.tab-item.active {
  color: #71b095;
  border-bottom: 3px solid #71b095;
  background-color: #e9f3ff;
}

.tab-item i {
  font-size: 18px;
}

</style>
