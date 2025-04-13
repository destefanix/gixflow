<template>
    <div class="notifications-container">
      <h1>Gestione Notifiche Agenti</h1>
  
      <!-- 🔹 FORM PER SCHEDULARE INVIO MULTIPLO -->
      <div class="form-container">
        <h2>Schedulazione Invio Agende</h2>
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
  
          <button type="submit">📩 Pianifica Invio</button>
        </form>
      </div>
  
      <!-- 🔹 FORM PER INVIO MANUALE -->
      <div class="form-container">
        <h2>Invia Agenda Manualmente</h2>
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
            <input type="date" v-model="manualDate" required />
          </label>
  
          <button type="submit">📤 Invia Manualmente</button>
        </form>
      </div>
  
      <!-- 🔹 TABELLA NOTIFICHE -->
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
          <tr v-for="notification in notifications" :key="notification.id">
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
              <button class="delete" @click="deleteNotification(notification.id)">
                🗑️
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
  
  export default {
    data() {
      return {
        notifications: [],
        agents: [],
        selectedAgents: [], // Array degli ID degli agenti selezionati
        send_time: "",
        manualAgent: "",
        manualDate: "",
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
  
      async fetchNotifications() { // OK
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
  
      async scheduleNotifications() { // OK
        if (this.selectedAgents.length === 0) {
          alert("Seleziona almeno un agente!");
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
  
          alert("Notifiche pianificate con successo!");
          this.fetchNotifications();
          this.selectedAgents = [];
          this.send_time = "";
        } catch (error) {
          console.error("Errore nella schedulazione delle notifiche:", error);
          alert("Errore nella schedulazione delle notifiche.");
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
  
      alert("Stato notifica aggiornato!");
      this.fetchNotifications();
    } catch (error) {
      console.error("Errore nell'aggiornamento della notifica:", error);
      alert("Errore nell'aggiornamento della notifica.");
    }
  },
  
  
      async deleteNotification(id) { // OK
        try {
          await axios.delete(
            `${process.env.VUE_APP_API_URL}/notifications/schedule/${id}`
          );
          alert("Notifica eliminata con successo!");
          this.fetchNotifications(); // Ricarica la lista dopo eliminazione
        } catch (error) {
          console.error("Errore nell'eliminazione della notifica:", error);
          alert("Errore nell'eliminazione della notifica.");
        }
      },
  
      async sendManualAgenda() { // OK
        if (!this.manualAgent || !this.manualDate) {
          alert("Seleziona un agente e una data!");
          return;
        }
  
        try {
          await axios.post(
            `${process.env.VUE_APP_API_URL}/notifications/send-agenda`,
            {
              agent_id: this.manualAgent,
              date: this.manualDate,
            }
          );
  
          alert("Agenda inviata con successo!");
        } catch (error) {
          console.error("Errore nell'invio manuale dell'agenda:", error);
          alert("Errore nell'invio dell'agenda.");
        }
      },
    },
    mounted() {
      this.fetchNotifications();
      this.fetchAgents();
    },
  };
  </script>
  