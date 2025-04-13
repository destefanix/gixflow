<template>
  <header class="topbar">
    <div class="left-section">
      <div class="left-section">
        <!-- DESKTOP TOGGLE -->
        <button class="toggle-btn" @click="$emit('toggle-sidebar')">
          <i :class="isCollapsed ? 'fas fa-bars' : 'fas fa-bars'"></i>
        </button>
        <!-- Loghino visibile solo da mobile -->
  <!-- <img 
   src="https://dev.gixflow.cloud/logo_f.png"
    alt="Logo App" 
    class="mobile-logo" 
  /> -->
  <h4>flow.</h4>
       
      </div>
    </div>

    <div class="right-section">
      <!-- Utente -->
      <div class="user-menu">
        <div class="user-info-tb">
          <div class="user-details-inline">
            <router-link to="/user/profile" class="user-info-link">
              <div class="user-initial-icon">
                {{ user.nome.charAt(0).toUpperCase() }}
              </div>
            </router-link>
          </div>
          <i
            class="fas fa-sign-out-alt logout-icon"
            @click="logout"
            title="Logout"
          ></i>
        </div>
      </div>
      <!-- MOBILE TOGGLE -->
      <button class="mobile-toggle-btn" @click="$emit('toggle-mobile-sidebar')">
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </header>
</template>

<script>
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default {
  name: "TopBar",
  data() {
    return {
      user: {
        nome: "Utente",
        cognome: "",
        role: "Nessun ruolo",
      },
    };
  },

  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    logout() {
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("Nessun token trovato, esco comunque.");
        this.$router.push("/login");
        return;
      }

      axios
        .post(
          "https://app.gixflow.cloud/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
          console.log("Logout registrato nel backend");
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          this.$router.push("/login");
        })
        .catch((error) => {
          console.error(
            "Errore nel logout:",
            error.response?.data || error.message
          );
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          this.$router.push("/login");
        });
    },

    loadUserData() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          console.log("[DEBUG] Dati utente decodificati:", decoded);
          this.user.nome = decoded.nome || "Sconosciuto";
          this.user.cognome = decoded.cognome || "";
          /* this.user.role = this.getRoleName(decoded.role); */
          this.user.role =
            typeof decoded.role === "number" || !isNaN(parseInt(decoded.role))
              ? this.getRoleName(decoded.role)
              : decoded.role || "Nessun ruolo";

          console.log("[DEBUG] Ruolo utente raw:", decoded.role);
        } catch (error) {
          console.error("[DEBUG] Errore nella decodifica del token:", error);
        }
      }
    },

    getRoleName(roleId) {
      const roles = {
        1: "Admin",
        2: "Manager",
        3: "Operatore",
        4: "Commerciale",
        5: "Super Admin",
      };
      const parsed = parseInt(roleId); // 🔥 Converte anche se è stringa
      return roles[parsed] || "Nessun ruolo";
    },
  },
  mounted() {
    this.loadUserData();
  },
};
</script>

<style scoped>
.user-initial-icon {
  font-type: "Poppins", sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px; /* Dimensione del cerchio */
  height: 40px; /* Dimensione del cerchio */
  background-color: var(--primary-color); /* Colore di sfondo */
  color: #fff; /* Colore del testo */
  font-size: 18px; /* Dimensione del testo */
  border-radius: 50%; /* Rende il div circolare */
  text-transform: uppercase; /* Trasforma la lettera in maiuscolo */
  cursor: pointer;
}

/* Stile della Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  width: calc(100% - 250px);
  height: 70px;
  top: 0;
  left: 250px;
  z-index: 1100;
  transition: left 0.3s ease-in-out, width 0.3s ease-in-out;
}

/* Se la sidebar è collassata */
.sidebar-collapsed .topbar {
  left: 80px;
  width: calc(100% - 80px);
}

/* Sezione destra della topbar */
.right-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Icone */
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  position: relative;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: rgb(194, 89, 89);
  color: white;
  font-size: 12px;
  border-radius: 50%;
  padding: 2px 6px;
}

/* Contenitore utente */
.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
}

/* Contenitore informazioni utente */
.user-info-tb {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  border-radius: 8px;
  transition: background 0.3s ease;
}

/* Icona utente */
.user-icon {
  font-size: 28px;
  color: #555;
}

/* Testo utente */
.user-details-tb {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.user-role {
  font-size: 12px;
  color: #777;
}

/* Icona logout */
.logout-icon {
  font-size: 18px;
  color: var(--primary-color);
  cursor: pointer;
  transition: color 0.3s ease;
  padding-left: 15px;
}

.logout-icon:hover {
  opacity: 0.9;
}

.user-name-link {
  text-decoration: none;
  color: inherit;
}

.user-name-link:hover {
  text-decoration: underline;
  color: #2c3e50; /* oppure il tuo verde: #71b095 */
}

.user-details-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.user-info-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.2s ease-in-out;
}

.user-info-link:hover {
  text-decoration: underline;
  color: #2c3e50;
}

.separator {
  color: #999;
  margin: 0 1px;
}

.role {
  color: #999;
  margin: 0 1px;
  font-size: 14px;
  font-style: italic;
  font-weight: 400;
}

.toggle-btn {
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s ease;
  color: var(--primary-color);
  /* background-color: var(--secondary-color); */
  color: var(--primary-color);
}

.toggle-btn:hover {
  opacity: 0.8;
}

/* Mostra solo in mobile */
.mobile-toggle-btn {
  display: none;
  color: var(--secondary-color);
  background-color: var(--primary-color);
}

.mobile-logo {
  display: none; /* Nascondi di default */
  width: 40px; /* Dimensione del loghino */
  height: auto;
  margin-left: 10px;
}

@media (max-width: 768px) {
  .topbar {
    background: var(--secondary-color);
  }

  .toggle-btn {
    display: none;
  }

  .mobile-toggle-btn {
    display: flex;
    color: var(--secondary-color);
    background-color: var(--primary-color);
  }
  .mobile-logo {
    display: block; /* Mostra solo su dispositivi mobili */
  }
}
</style>
