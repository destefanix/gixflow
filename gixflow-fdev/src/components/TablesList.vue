<template>
  <div class="header">
      <h1>Modifica Tabelle di sistema</h1>
      <div class="actions">
        <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportAppointments">CSV</button>
      </div>
    </div>
  
  <div class="tabs-container">
    <!-- Navbar con le schede -->
    <div class="tabs">
      <div
        v-for="table in tables"
        :key="table.name"
        @click="selectedTab = table.name"
        :class="['tab', { active: selectedTab === table.name }]"
      >
        <i :class="table.icon" class="tab-icon"></i>
        <span class="tab-label">{{ table.label }}</span>
      </div>
    </div>

    <!-- Contenuto della tab selezionata -->
    <div class="tab-content">
      <EditTable :tableName="selectedTab" />
    </div>
  </div>
</template>

<script>
import EditTable from "@/components/EditTable.vue";
import "@/styles/global.css";


export default {
  components: {
    EditTable,
  },
  data() {
    return {
      selectedTab: "legal-forms-table", // Imposta la tab iniziale
      tables: [
        { name: "legal-forms-table", label: "Forme Giuridiche", icon: "" },
        { name: "documents-template-table", label: "Tipi di Documenti", icon: "" },
        { name: "roles-table", label: "Ruoli", icon: "" },
        { name: "appointment-status-table", label: "Stati Appuntamento", icon: "" },
        { name: "contract-status-table", label: "Stati Contratto", icon: "" },
        { name: "locations-table", label: "Sedi", icon: "" },
        { name: "hourly-payments-table", label: "Paghe orarie", icon: "" }


        
      ],
    };
  }
};
</script>

<style scoped>


/* Contenitore principale */
.tabs-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6fa; /* Sfondo chiaro */
  color: #2c3e50;
  overflow: hidden;
}

/* Barra delle schede */
.tabs {
  display: flex;
  justify-content: flex-start;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 2px solid #dcdde1;
  background: white;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.1);
}

/* Singola tab */
.tab {
  padding: 12px 18px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2c3e50;
  transition: all 0.3s ease;
  position: relative;
}

/* Icone delle tab */
.tab-icon {
  font-size: 18px;
  color: #71b095;
  transition: transform 0.3s ease;
}

/* Tab attiva */
.tab.active {
  color: #71b095;
}

.tab.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 3px;
  background-color: #71b095;
  border-radius: 5px;
}

/* Effetto hover */
.tab:hover {
  color: #71b095;
}

.tab:hover .tab-icon {
  transform: scale(1.1);
}

/* Contenuto della tab selezionata */
.tab-content {
  flex: 1;
  padding: 0px;
  background: white;
  overflow-y: auto;
}


</style>