import { createApp } from "vue";
import App from "./App.vue";
import Toaster from "@meforma/vue-toaster"; // Importa Vue Toaster
import router from "./router"; // Importa solo il router
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import VueTippy from "vue-tippy";
import "@/styles/tippy.css";

import VueGoodTablePlugin from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';

const app = createApp(App); // Crea l'istanza dell'app Vue

const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

axios.defaults.baseURL = "https://app.gixflow.cloud/api";
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("[DEBUG] Token Prelevato da LocalStorage:", token); // 🔍 LOG
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

app.use(VueTippy, {
  directive: "tippy", // Registra la direttiva v-tippy
  component: "Tippy", // Aggiunge un componente Tippy
  defaultProps: {
    placement: "top",
    allowHTML: true,
  },
});

app.use(router); // Usa il router
app.use(Toaster); // Usa Vue Toaster
app.use(VueGoodTablePlugin);
app.mount("#app"); // Monta l'app



let autoLogoutTimer;

function logout() {
  console.warn("[DEBUG] Utente inattivo per 30 minuti! Logout automatico.");
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
  window.location.href = "/login"; // Reindirizza alla pagina di login
}

function resetTimer() {
  clearTimeout(autoLogoutTimer);
  autoLogoutTimer = setTimeout(logout, 30 * 60 * 1000); // 30 minuti
}

function setupAutoLogout() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = (decoded.exp - now) * 1000;

    if (timeLeft > 0) {
      console.log(`[DEBUG] Logout automatico tra ${timeLeft / 1000} secondi.`);
      resetTimer();
    } else {
      logout();
    }
  } catch (error) {
    console.error("[DEBUG] Errore nella decodifica del token:", error);
    logout();
  }
}

// Eventi per monitorare l'attività dell'utente
window.addEventListener("mousemove", resetTimer);
window.addEventListener("keydown", resetTimer);
window.addEventListener("scroll", resetTimer);
window.addEventListener("click", resetTimer);

// Intercetta le richieste API per resettare il timer
axios.interceptors.request.use(
  (config) => {
    resetTimer();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Avvia il controllo all'avvio dell'app
setupAutoLogout();


/* 
import { createApp } from "vue";
import App from "./App.vue";
import Toaster from "@meforma/vue-toaster";
import router from "./router";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import VueTippy from "vue-tippy";
import "@/styles/tippy.css";


const app = createApp(App);

// ✅ Axios Auth setup
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}
axios.defaults.baseURL = "https://app.gixflow.cloud/api";
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Plugin
app.use(Toaster);
app.use(router);
app.use(VueTippy, {
  directive: "tippy",
  component: "Tippy",
  defaultProps: { placement: "top", allowHTML: true },
});
app.use(PrimeVue);

// ✅ Registrazione componenti PrimeVue
app.component("DataTable", DataTable);
app.component("PrimeColumn", Column); // <-- NOME MULTI-WORD ✅ ESLint friendly

app.mount("#app");

// ✅ Auto logout timer
let autoLogoutTimer;
function logout() {
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
  window.location.href = "/login";
}
function resetTimer() {
  clearTimeout(autoLogoutTimer);
  autoLogoutTimer = setTimeout(logout, 30 * 60 * 1000);
}
function setupAutoLogout() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = (decoded.exp - now) * 1000;
    if (timeLeft > 0) resetTimer();
    else logout();
  } catch {
    logout();
  }
}
["mousemove", "keydown", "scroll", "click"].forEach((e) =>
  window.addEventListener(e, resetTimer)
);
axios.interceptors.request.use((config) => {
  resetTimer();
  return config;
});
setupAutoLogout();
  */