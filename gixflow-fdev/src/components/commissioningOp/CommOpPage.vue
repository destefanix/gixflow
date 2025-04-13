<template>
  <div>     

    <div class="header">
      <h1>
        <i class="fa-solid fa-money-check icon-green"></i>Commissioning Operatori 
      </h1>
      <div class="actions">
        <!-- <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportAppointments">CSV</button> -->
        <button class="in-grid-blue">
          <i
            v-tippy="{
              content: tooltipText,
              allowHTML: true,
              maxWidth: '450px',
            }"
            class="fa-solid fa-question icon-tip"
          ></i>
        </button>
      </div>
    </div>

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
import "@/styles/toast.css";

import CommOpConfig from "./CommOpConfig.vue";
import CommOpGen from "./CommOpGen.vue";
import CommOpLogs from "./CommOpLogs.vue";
import CommOpArch from "./CommOpArch.vue";
import CommOpBonus from "./CommOpBonus.vue";
import CommOpComm from "./CommOpComm.vue";

export default {
  components: {
    CommOpConfig,
    CommOpGen,
    CommOpLogs,
    CommOpArch,
    CommOpBonus,
    CommOpComm,
  },

  data() {
    return {
      selectedTab: "CommOpConfig", // Tab predefinita
      tabs: [
        {
          name: "CommOpConfig",
          label: "Configurazioni",
          icon: "fa fa-asterisk",
        },
        {
          name: "CommOpGen",
          label: "Genera Ore",
          icon: "fa fa-calendar-days",
        },
        {
          name: "CommOpLogs",
          label: "Correggi Ore",
          icon: "fa fa-pen",
        },
        {
          name: "CommOpArch",
          label: "Archivio Ore",
          icon: "fa fa-box-open",
        },
        {
          name: "CommOpBonus",
          label: "Bonus",
          icon: "fa fa-trophy",
        },
        {
          name: "CommOpComm",
          label: "Genera paghe",
          icon: "fa fa-money-bill",
        },
      ],
      tooltipText: `
  <div style='text-align: left; font-size: 14px; line-height: 1.5; max-width: 450px;'>
    <strong>Commissioning Operatori</strong><br>
    Questo modulo permette la gestione completa delle ore, bonus e paghe degli operatori.<br><br>

    <strong>Configurazioni</strong><br>
    Imposta i parametri di collegamento con Asterisk/Vicidial (URL, credenziali, gruppi, campagne). Questi dati sono fondamentali per l'estrazione delle ore.<br><br>

    <strong>Genera Ore</strong><br>
    Calcola automaticamente le ore lavorate dagli operatori per un intervallo di date. È possibile filtrare per sede e salvare i dati nel sistema.<br><br>

    <strong>Correggi Ore</strong><br>
    Visualizza e modifica manualmente i timelog degli operatori. Utile per correggere dati errati o incompleti.<br><br>

    <strong>Archivio Ore</strong><br>
    Consulta lo storico dei timelog già registrati nel sistema. Puoi filtrare per data, sede e operatore.<br><br>

    <strong>Bonus</strong><br>
    Gestisci le regole di bonus: puoi crearle, archiviarle o modificarle. I bonus sono applicati automaticamente durante il calcolo delle paghe.<br><br>

    <strong>Genera Paghe</strong><br>
    Calcola la retribuzione totale degli operatori (ore x tariffa + bonus). Include i dettagli su ore lavorate, appuntamenti positivi e importo del bonus.<br><br>

    <em>💡 Suggerimento: imposta correttamente le configurazioni prima di generare ore o paghe!</em>
  </div>
`

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
