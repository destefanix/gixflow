<template>
    <div
      :class="[
        'sidebar',
        { collapsed: isCollapsed },
        { 'mobile-open': isMobileSidebarOpen } // solo mobile
      ]"
    >

    
    <!-- LOGO -->
    <div class="logo-container">
      <img
        v-if="!isCollapsed"
        src="https://app.gixflow.cloud/flow_logo-removebg.png"
        alt="GIX Flow Logo"
        class="logo"
      />
      <div v-else class="logo-text">GF</div>
    </div>


    <!-- MENU PRINCIPALE -->
     <span class="sidebar-element">MENU</span>
    <ul>
      <!-- Dashboard -->
      <li>
        <router-link to="/">
          <i class="fas fa-home"></i>
          <span v-if="!isCollapsed">Dashboard</span>
        </router-link>
      </li>

      <!-- Appuntamenti -->
      <li @click="toggleSubMenu('appointments')" class="has-submenu">
        <div :class="['submenu-title', { open: subMenus.appointments }]">
          <i class="fas fa-calendar-check"></i>
          <span v-if="!isCollapsed">Appuntamenti</span>
          <i
            v-if="!isCollapsed"
            :class="subMenus.appointments ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="submenu-icon"
          />
        </div>
        <ul :class="['submenu', { open: subMenus.appointments }]">
          <li><router-link to="/calendar"><i class="fas fa-angle-right"></i>Calendario</router-link></li>
          <li><router-link to="/appointments"><i class="fas fa-angle-right"></i>Elenco Appuntamenti</router-link></li>
          <li><router-link to="/agenda-schedules"><i class="fas fa-angle-right"></i>Schedulazioni</router-link></li>
        </ul>
      </li>

      <!-- Clienti -->
      <li>
        <router-link to="/clients">
          <i class="fas fa-users"></i>
          <span v-if="!isCollapsed">Clienti</span>
        </router-link>
      </li>

      <!-- Reports -->
      <li @click="toggleSubMenu('reports')" class="has-submenu">
        <div :class="['submenu-title', { open: subMenus.reports }]">
          <i class="fas fa-file-contract"></i>
          <span v-if="!isCollapsed">Reports</span>
          <i
            v-if="!isCollapsed"
            :class="subMenus.reports ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="submenu-icon"
          />
        </div>
        <ul :class="['submenu', { open: subMenus.reports }]">
          <li><router-link to="/reports/appointments-report"><i class="fas fa-angle-right"></i>Appuntamenti</router-link></li>
          <li><router-link to="/reports/contracts-by-agent-report"><i class="fas fa-angle-right"></i>Contratti per agente</router-link></li>
          <li><router-link to="/reports/location-efficiency-report"><i class="fas fa-angle-right"></i>Efficienza per sede</router-link></li>
          <li><router-link to="/reports/operator-performance-report"><i class="fas fa-angle-right"></i>Performance operatori</router-link></li>
        </ul>
      </li>

      <!-- Contratti -->
      <li @click="toggleSubMenu('contracts')" class="has-submenu">
        <div :class="['submenu-title', { open: subMenus.contracts }]">
          <i class="fas fa-file-signature"></i>
          <span v-if="!isCollapsed">Contratti</span>
          <i
            v-if="!isCollapsed"
            :class="subMenus.contracts ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="submenu-icon"
          />
        </div>
        <ul :class="['submenu', { open: subMenus.contracts }]">
          <li><router-link to="/contracts"><i class="fas fa-angle-right"></i>Elenco Contratti</router-link></li>
          <li><router-link to="/contracts/new"><i class="fas fa-angle-right"></i>Nuovo Contratto</router-link></li>
        </ul>
      </li>

      <!-- Commissioning -->
      <li @click="toggleSubMenu('commissioning')" class="has-submenu">
        <div :class="['submenu-title', { open: subMenus.commissioning }]">
          <i class="fas fa-credit-card"></i>
          <span v-if="!isCollapsed">Commissioning</span>
          <i
            v-if="!isCollapsed"
            :class="subMenus.commissioning ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="submenu-icon"
          />
        </div>
        <ul :class="['submenu', { open: subMenus.commissioning }]">
          <li><router-link to="/commissioning/agents"><i class="fas fa-angle-right"></i>Agenti</router-link></li>
          <li><router-link to="/commissioning/operators"><i class="fas fa-angle-right"></i>Operatori</router-link></li>
        </ul>
      </li>

      <!-- Impostazioni -->
      <li @click="toggleSubMenu('settings')" class="has-submenu">
        <div :class="['submenu-title', { open: subMenus.settings }]">
          <i class="fas fa-wrench"></i>
          <span v-if="!isCollapsed">Impostazioni</span>
          <i
            v-if="!isCollapsed"
            :class="subMenus.settings ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="submenu-icon"
          />
        </div>
        <ul :class="['submenu', { open: subMenus.settings }]">
          <li><router-link to="/user/profile"><i class="fas fa-angle-right"></i>Area Personale</router-link></li>
          <li><router-link to="/settings/email"><i class="fas fa-angle-right"></i>Configura E-Mail</router-link></li>
          <li><router-link to="/settings/generate-api-key"><i class="fas fa-angle-right"></i>API</router-link></li>
          <li><router-link to="/settings/logs"><i class="fas fa-angle-right"></i>Logs</router-link></li>
          <li><router-link to="/settings/tables"><i class="fas fa-angle-right"></i>Tabelle</router-link></li>
          <li><router-link to="/users"><i class="fas fa-angle-right"></i>Utenti</router-link></li>
        </ul>
      </li>
    </ul>

    <!-- INFO & QUOTE -->
    <div class="sidebar-quote-wrapper" v-if="!isCollapsed">
      <div class="sidebar-info">
        <div class="user-greeting">
          <i class="fas fa-hand-sparkles waving-icon"></i>
          <span>Ciao <strong>{{ user.nome }}</strong></span>
        </div>
        <div class="info-meta">
          <div class="info-item"><i class="fas fa-calendar-day"></i><span>{{ currentDate }}</span></div>
          <div class="info-item"><i class="fas fa-clock"></i><span>{{ currentTime }}</span></div>
        </div>
      </div>
      <div class="quote-box fade-in">
        <i class="fas fa-quote-left"></i>
        <span>{{ motivationalQuote }}</span>
      </div>
    </div>
  </div>

  <!-- OVERLAY MOBILE -->
  <div
    v-if="isMobileSidebarOpen"
    class="mobile-sidebar-overlay"
    @click="$emit('close-mobile-sidebar')"
  />
</template>


<script>
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "@/styles/sidebar.css";

export default {
  name: "SideBar",

  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
    isMobileSidebarOpen: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["closeMobileSidebar"],

  data() {
    return {
      user: {
        nome: "",
        cognome: "",
        role: "",
      },
      currentTime: "",
      currentDate: "",
      motivationalQuote: "",
      quotes: [
        "Sii il cambiamento che vuoi vedere nel mondo.",
        "Ogni giorno è una nuova opportunità.",
        "Dai il massimo, sempre.",
        "Il successo è una somma di piccoli sforzi.",
        "Non fermarti finché non sei fiero.",
      ],
      subMenus: {
        appointments: false,
        settings: false,
        commissioning: false,
        contracts: false,
        reports: false,
      },
      routeGroups: {
        "/calendar": "appointments",
        "/appointments": "appointments",
        "/agenda-schedules": "appointments",

        "/reports/appointments-report": "reports",
        "/reports/contracts-by-agent-report": "reports",
        "/reports/location-efficiency-report": "reports",
        "/reports/operator-performance-report": "reports",

        "/contracts": "contracts",
        "/contracts/new": "contracts",

        "/commissioning/agents": "commissioning",
        "/commissioning/operators": "commissioning",

        "/user/profile": "settings",
        "/settings/email": "settings",
        "/settings/generate-api-key": "settings",
        "/settings/logs": "settings",
        "/settings/tables": "settings",
        "/users": "settings",
      },
    };
  },

  watch: {
    '$route.path'() {
      this.setActiveSubMenuFromRoute();
    },
    isCollapsed(newVal) {
      if (newVal) {
        for (const key in this.subMenus) {
          this.subMenus[key] = false;
        }
      }
    },
  },

  methods: {
    // ✅ Attiva il sottomenu corretto in base alla route
    setActiveSubMenuFromRoute() {
      const path = this.$route.path;
      const group = this.routeGroups[path];

      for (const key in this.subMenus) {
        this.subMenus[key] = key === group;
      }
    },

    // ✅ Toggle visibilità sottomenu
    toggleSubMenu(menu) {
      if (this.isCollapsed) return;
      for (const key in this.subMenus) {
        this.subMenus[key] = key === menu ? !this.subMenus[key] : false;
      }
    },

    // ✅ Decodifica il JWT per mostrare nome/ruolo
    loadUserData() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          this.user.nome = decoded.nome || "Sconosciuto";
          this.user.cognome = decoded.cognome || "";
          this.user.role = decoded.role || "Nessun ruolo";
        } catch (error) {
          console.error("[DEBUG] Errore decodifica token:", error);
        }
      }
    },

    // ✅ Logout con fallback
    logout() {
      const token = localStorage.getItem("token");
      if (!token) {
        this.$router.push("/login");
        return;
      }

      axios
        .post("https://app.gixflow.cloud/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          this.$router.push("/login");
        })
        .catch((err) => {
          console.warn("Errore logout (fallback):", err);
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          this.$router.push("/login");
        });
    },

    // ✅ Orologio in tempo reale
    updateDateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      this.currentDate = now.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
    },

    // ✅ Frase motivazionale random
    updateQuote() {
      const index = Math.floor(Math.random() * this.quotes.length);
      this.motivationalQuote = this.quotes[index];
    },
  },

  mounted() {
    this.loadUserData();
    this.updateDateTime();
    this.updateQuote();
    this.setActiveSubMenuFromRoute();

    setInterval(this.updateDateTime, 1000);      // 🕐 Live clock
    setInterval(this.updateQuote, 10000);        // 💬 Nuova quote ogni 10s
  },
};
</script>


