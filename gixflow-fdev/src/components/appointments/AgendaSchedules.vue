<template>
  <div class="notifications-container">
    <div class="header">
      <h1>
        <i class="fa-solid fa-calendar-check icon-green"></i>Schedulazioni &
        Invio Agende
      </h1>
      <div class="actions">
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

    <!-- FORM PER INVIO MANUALE -->
    <div class="form-container">
      <h2><i class="fa-solid fa-paper-plane icon-green"></i>Invio manuale</h2>
      <pre>
Tramite questo strumento è possibile inviare una singola agenda ad un singolo agente, selezionando dalla lista agente e data.</pre
      >

      <form @submit.prevent="sendManualAgenda">
        <label>
          Seleziona Agente:
          <select v-model="manualAgent" required>
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">
              {{ agent.cognome }} {{ agent.nome }} ({{ agent.email }})
            </option>
          </select>
        </label>

        <label>
          Seleziona Data:
          <!-- <input type="date" v-model="manualDate" required />  -->
          <flat-pickr
            v-model="manualDate"
            :config="configDate"
            class="custom-datepicker"
          />
        </label>

        <button class="save-button" type="submit">Invia Manualmente</button>
      </form>
    </div>

    <!-- FORM PER SCHEDULARE INVIO MULTIPLO -->
    <div class="form-container">
      <h2><i class="fa-solid fa-list-check icon-green"></i>Schedulazioni</h2>
      <pre>
Tramite questo strumento è possibile schedulare l'invio giornaliero delle agende agli agenti. Gli invii vengolo schedulati ogni giorno per il giorno lavorativo successivo.</pre
      >

      <form @submit.prevent="scheduleNotifications">
        <label>
          Seleziona Agenti:
          <select v-model="selectedAgents" multiple required>
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">
              {{ agent.cognome }} {{ agent.nome }} ({{ agent.email }})
            </option>
          </select>
        </label>

        <label>
          Orario di Invio:
          <input type="time" v-model="send_time" required />
        </label>

        <button class="save-button" type="submit">Pianifica Invio</button>
      </form>
    </div>

    <hr />

    <!-- TABELLA NOTIFICHE -->
    <h2>
      <i class="fa-solid fa-calendar-days icon-green"></i>Schedulazione attive
    </h2>

    <table class="table">
      <thead>
        <tr>
          <th>Agente</th>
          <th>Tipo</th>
          <th>Orario</th>
          <th>Email/Telefono</th>
          <th>Attivo</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
  <!-- Nessuna notifica trovata -->
  <tr v-if="notifications.length === 0">
    <td colspan="6" class="no-results">Nessuna schedulazione programmata</td>
  </tr>

  <!-- Elenco delle notifiche -->
  <tr v-else v-for="notification in notifications" :key="notification.id">
    <td>{{ notification.cognome }} {{ notification.nome }}</td>
    <td>{{ notification.type }}</td>
    <td>{{ notification.send_time }}</td>
    <td>{{ notification.email }}</td>
    <td>
      <input
        type="checkbox"
        :checked="notification.is_enabled == 1"
        @change="toggleNotification(notification)"
      />
    </td>
    <td>
      <button
        class="in-grid-red"
        @click="deleteNotification(notification.id)"
      >
        <i class="fas fa-trash"></i>
      </button>
    </td>
  </tr>
</tbody>
    </table>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";
import "@/styles/toast.css";

import { ref } from "vue";
import FlatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";
import "flatpickr/dist/themes/dark.css";




export default {

  components: {
    FlatPickr,
  },

  setup() {
    const configDate = ref({
      dateFormat: "d/m/Y",
      altInput: true,
      altFormat: "d/m/Y",
      locale: Italian,
    });

    const configDateTime = ref({
      enableTime: true, // Abilita l'orario
      dateFormat: "Y-m-d H:i", // Formato per il backend
      altInput: true,
      altFormat: "d/m/Y H:i", // Formato visivo
      time_24hr: true, // Mostra orario in formato 24 ore
      locale: Italian,
    });

    return { configDate, configDateTime }; // 🔥 manualDate NON è più qui
  }, 

  data() {
    return {
      notifications: [],
      agents: [],
      selectedAgents: [], // Array degli ID degli agenti selezionati
      send_time: "",
      manualAgent: "",
      manualDate: "",

      tooltipText: `
        <div style='text-align: left; font-size: 14px; line-height: 1.5; max-width: 350px;'>
          <strong>Schedulazioni & Invio Agende</strong><br>
          Questa pagina ti permette di <strong>inviare</strong> e <strong>schedulare</strong> le agende per gli agenti.<br><br>

          <strong>Invio Manuale</strong><br>Invia un'agenda a un singolo agente selezionando un nome e una data specifica.<br>
          - <strong>Seleziona Agente:</strong> Scegli l’agente a cui inviare l’agenda.<br>
          - <strong>Seleziona Data:</strong> Imposta il giorno dell’agenda da inviare.<br>
          - <strong>Invia Manualmente:</strong> Esegue subito l'invio dell'agenda.<br><br>

          <strong>Schedulazioni</strong><br>Pianifica l'invio automatico delle agende giornaliere.<br>
          - <strong>Seleziona Agenti:</strong> Scegli uno o più agenti che riceveranno le agende ogni giorno.<br>
          - <strong>Orario di Invio:</strong> Imposta l'orario in cui il sistema invierà automaticamente le agende.<br><br>

          <em>Usa questa funzionalità per ottimizzare il processo di gestione delle agende e ridurre il lavoro manuale.</em>
        </div>
      `,
    };
  },
  methods: {
    async fetchAgents() {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );

        // 🔥 Debug: Controlliamo la struttura della risposta
        console.log("Risposta API /users:", data);

        // Se è un array annidato, appiattiamo
        const allUsers = Array.isArray(data) ? data.flat() : [];

        // 🔥 Filtriamo gli agenti con `role_id === 2` e ci assicuriamo che abbiano `id` e `cognome`
        this.agents = allUsers
          .filter((user) => user.role_id === 2 && user.id && user.cognome)
          .map((user) => ({
            id: user.id,
            nome: user.nome || "",
            cognome: user.cognome || "Senza Cognome",
            email: user.email || "N/A",
          }));

        console.log("Agenti filtrati:", this.agents);
      } catch (error) {
        console.error("Errore nel recupero degli agenti:", error);
      }
    },

    async fetchNotifications() {
      // OK
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/notifications/schedule`
        );

        console.log("[DEBUG] Notifiche ricevute dal backend:", data);

        this.notifications = data.map((n) => ({
          ...n,
          is_enabled: Number(n.is_enabled), // 🔥 Assicuriamoci che sia sempre un numero!
        }));

        console.log("[DEBUG] Notifiche salvate in Vue:", this.notifications);
      } catch (error) {
        console.error("Errore nel recupero delle notifiche:", error);
      }
    },

    async scheduleNotifications() {
      // OK
      if (this.selectedAgents.length === 0) {
        this.$toast.show("Seleziona almeno un agente.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      try {
        for (let agentId of this.selectedAgents) {
          const payload = {
            user_id: agentId,
            type: "email", // 👈 Assicurati che sia un valore valido ENUM
            send_time: `${this.send_time}:00`, // 👈 Formato corretto HH:MM:SS
            is_enabled: 1, // 👈 Valore predefinito
          };

          console.log("[DEBUG] Payload inviato al backend:", payload); // Debug

          await axios.post(
            `${process.env.VUE_APP_API_URL}/notifications/create`,
            payload
          );
        }

        this.$toast.show("Notifiche pianificate con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });

        this.fetchNotifications();
        this.selectedAgents = [];
        this.send_time = "";
      } catch (error) {
        console.error("Errore nella schedulazione delle notifiche:", error);
        this.$toast.show("Errore nella schedulazione delle notifiche.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async toggleNotification(notification) {
      try {
        const updatedNotification = {
          is_enabled: notification.is_enabled == 1 ? 0 : 1, // Assicuriamoci che sia sempre 1 o 0
        };

        console.log(
          "[DEBUG] Invio aggiornamento per notifica ID:",
          notification.id,
          updatedNotification
        );

        await axios.put(
          `${process.env.VUE_APP_API_URL}/notifications/update/${notification.id}`,
          updatedNotification
        );

        this.$toast.show("Stato notifica aggiornato.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
        this.fetchNotifications();
      } catch (error) {
        console.error("Errore nell'aggiornamento della notifica:", error);
        this.$toast.show("Errore nell'aggiornamento della notifica.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async deleteNotification(id) {
      // OK
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/notifications/schedule/${id}`
        );
        this.$toast.show("Notifica eliminata con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
        this.fetchNotifications(); // Ricarica la lista dopo eliminazione
      } catch (error) {
        console.error("Errore nell'eliminazione della notifica:", error);
        this.$toast.show("Errore nell'eliminazione della notifica.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async sendManualAgenda() {
      if (!this.manualAgent || !this.manualDate) {
        this.$toast.show("Seleziona un agente e una data.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
        return;
      }

      // 🔥 Converti la data in formato YYYY-MM-DD prima di inviarla
      const formattedDate = this.manualDate.split("/").reverse().join("-");

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/notifications/send-agenda`,
          {
            agent_id: this.manualAgent,
            date: formattedDate, // 📅 Invia la data nel formato corretto
          }
        );

        this.$toast.show("Agenda inviata con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
      } catch (error) {
        console.error("Errore nell'invio manuale dell'agenda:", error);
        this.$toast.show("Errore nell'invio dell'agenda.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },
  },
  mounted() {
    this.fetchNotifications();
    this.fetchAgents();
  },
};
</script>

<style scoped>
/****** 🌟 CONTAINER PRINCIPALE ******/

.notifications-container {
  max-width: auto;
}

hr {
  margin: 30px 0;
  border: none;
  border-top: 2px solid #f0f0f0;
}

/****** 🌟 FORM E INPUT ******/

.form-container {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.05);
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #444;
}

input,
select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 5px;
  border: 1px solid #ccc;
  background: white;
  font-size: 13px;
  transition: all 0.3s ease-in-out;
}

input:focus,
select:focus {
  border-color: #007bff;
  box-shadow: 0px 0px 6px rgba(0, 123, 255, 0.3);
  outline: none;
}

/****** 🌟 MULTI-SELECT CUSTOM ******/

select[multiple] {
  height: 140px;
  overflow-y: auto;
}

/****** 🌟 BOTTONI ******/

.saveITEM-button {
  background: #71b095;
}

.saveITEM-button:hover {
  opacity: 90%;
}

/****** 🌟 CHECKBOX CUSTOM ******/

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #71b095;
}

/****** 🌟 RESPONSIVE ******/

@media (max-width: 600px) {
  .notifications-container {
    padding: 15px;
  }

  button {
    font-size: 14px;
    padding: 10px;
  }

  input,
  select {
    font-size: 14px;
    padding: 8px;
  }

  .table th,
  .table td {
    padding: 8px;
    font-size: 14px;
  }
}

.custom-datepicker {
  padding: 8px;
  font-size: 16px;
  border: 1px solid #71b095;
  border-radius: 6px;
  width: 100%;
}

.datepicker-label {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
