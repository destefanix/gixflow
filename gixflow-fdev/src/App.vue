<template>
  <div
    id="app"
    :class="{
      'sidebar-open':
        isMobileSidebarOpen ||
        (!isSidebarCollapsed && $route.meta.requiresSidebar !== false),
      'topbar-open': $route.meta.requiresTopbar !== false,
      'login-page': $route.path === '/login',
      'sidebar-collapsed': isSidebarCollapsed,
    }"
  >
  
    <SideBar
      v-if="$route.meta.requiresSidebar !== false"
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-sidebar-open="isMobileSidebarOpen"
      @close-mobile-sidebar="isMobileSidebarOpen = false"
    />

    <TopBar
      v-if="$route.meta.requiresTopbar !== false"
      :is-collapsed="isSidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
      @toggle-mobile-sidebar="toggleMobileSidebar"
    />

    <!-- Login page: solo router-view -->
    <router-view v-if="$route.path === '/login'" />

    <!-- Layout standard: contenuto dentro main-content -->
    <div v-else class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
// Importa il componente Sidebar
import SideBar from "./components/SideBar.vue";
import TopBar from "./components/TopBar.vue";

export default {
  name: "App",
  components: {
    SideBar,
    TopBar,
  },

  data() {
    return {
      isSidebarCollapsed: false,
      isMobileSidebarOpen: false,
    };
  },
  methods: {
    toggleSidebar() {
      if (window.innerWidth <= 768) {
        this.toggleMobileSidebar(); // fallback mobile
      } else {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
      }
    },

    toggleMobileSidebar() {
      if (window.innerWidth <= 768) {
        this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
      }
    },
  },
  mounted() {
    // Sidebar mobile sempre chiusa all'avvio
    this.isMobileSidebarOpen = false;
  },
};
</script>

<style scoped>
/* Base per la pagina */
#app {
  display: flex;
  height: 100vh;
  background-color: #f9f9f9; /* Sfondo grigio chiaro per contrasto */
}

#app.login-page .main-content {
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #71b095, #2c3e50);
}

#app.login-page .content-wrapper {
  background: none;
  box-shadow: none;
  padding: 0;
}

/* Quando la sidebar è compressa */
#app.sidebar-collapsed .main-content {
  margin-left: 80px;
  width: calc(100% - 80px);
}

#app.sidebar-collapsed .topbar {
  left: 80px;
  width: calc(100% - 80px);
}

.main-content {
  margin-left: 250px; /* Spazio per la sidebar */
  margin-top: 70px; /* Spazio per la topbar */
  padding: 20px;
  width: calc(100% - 250px); /* Occupa tutto lo spazio rimanente */
  background-color: #f9f9f9;
  display: flex;
  justify-content: center; /* Centra il contenuto */
  align-items: flex-start;
  min-height: calc(100vh - 70px);
  overflow: auto;
}

/*  Contenitore dinamico */
 .content-wrapper {
  width: 98%; 
  max-width: 1800px; 
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
  flex-grow: 1; 
} 

/* Header */
header {
  background-color: #71b095; /* Colore verde */
  color: white;
  padding: 20px;
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
  border-radius: 5px 5px 0 0;
}

/* Font generale */
* {
  font-family: "Poppins", sans-serif;
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: #f9f9f9;
  color: #333;
  font-size: 16px;
}

h1,
h2,
h3 {
  font-weight: 700;
}

/* Contenuto */
.content {
  padding: 20px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Se la sidebar è visibile */
.sidebar-open .main-content {
  margin-left: 250px; /* Larghezza della sidebar */
}

.topbar-open .main-content {
  margin-left: 250px; /* Larghezza della sidebar */
}

/* **Fix per la pagina di login** */
#app.login-page .main-content {
  margin-left: 0 !important; /* Elimina il margine */
  display: flex;
  justify-content: center; /* Centra il form */
  align-items: center; /* Centra verticalmente */
}

@media (max-width: 768px) {
  html, body, #app {
    overflow-x: hidden;
    width: 100vw;
    position: relative;
    overscroll-behavior: contain;
    touch-action: manipulation;
  }

  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
    padding: 16px 12px;
    min-height: calc(100vh - 70px);
    overflow-y: auto;
    box-sizing: border-box;
    position: relative;
  }

  .content-wrapper {
    width: 100% !important;
    padding: 16px;
    box-sizing: border-box;
  }

  .topbar {
    position: fixed;
    top: 0;
    left: 0 !important;
    right: 0;
    height: 70px;
    z-index: 1100;
    width: 100vw !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 250px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1500;
    background: linear-gradient(180deg, #1c2536 0%, #273142 100%);
    overflow-y: auto;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.2);
  }

  .sidebar-open .sidebar {
    transform: translateX(0);
  }

  .mobile-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1400;
  }

  
}

</style>
