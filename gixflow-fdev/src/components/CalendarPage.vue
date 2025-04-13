<template>
  <div class="calendar-page">
    <h1>Calendario Appuntamenti</h1>

    <FullCalendar :options="calendarOptions" class="custom-calendar" />

    <!-- Modale per i dettagli dell'appuntamento -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2 v-if="selectedAppointment">
          Modifica Appuntamento #{{ selectedAppointment.id }}
        </h2>
        <form @submit.prevent="updateAppointment">
          <div class="form-grid">
            <!-- Colonna Sinistra -->
            <div class="form-column">
              <fieldset class="readonly-fields">
                <legend>Informazioni Cliente</legend>
                <label>
                  Cliente:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_name"
                    readonly
                  />
                </label>
                <label>
                  Forma Giuridica:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_forma_giuridica"
                    readonly
                  />
                </label>
                <label>
                  Telefono:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_phone"
                    readonly
                  />
                </label>
                <label>
                  Indirizzo:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_address"
                    readonly
                  />
                </label>
                <label>
                  CAP:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_cap"
                    readonly
                  />
                </label>
                <label>
                  Città:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_city"
                    readonly
                  />
                </label>
                <label>
                  Provincia:
                  <input
                    type="text"
                    v-model="selectedAppointment.client_province"
                    readonly
                  />
                </label>
              </fieldset>
            </div>

            <!-- Colonna Destra -->
            <div class="form-column">
              <fieldset class="editable-fields">
                <legend>Dettagli Appuntamento</legend>

                <label>
                  Operatore:
                  <select v-model="selectedAppointment.operator_id" required>
                    <option
                      v-for="operator in operators"
                      :key="operator.id"
                      :value="operator.id"
                    >
                      {{
                        operator.cognome
                          ? `${operator.cognome} ${operator.nome || ""}`
                          : "Senza Nome"
                      }}
                    </option>
                  </select>
                </label>

                <label>
                  Agente:
                  <select v-model="selectedAppointment.agent_id" required>
                    <option
                      v-for="agent in agents"
                      :key="agent.id"
                      :value="agent.id"
                    >
                      {{
                        agent.cognome
                          ? `${agent.cognome} ${agent.nome || ""}`
                          : "Senza Nome"
                      }}
                    </option>
                  </select>
                </label>

                <label>
                  Data Inizio:
                  <input
                    type="datetime-local"
                    v-model="selectedAppointment.date_start"
                    required
                  />
                </label>
                <label>
                  Data Fine:
                  <input
                    type="datetime-local"
                    v-model="selectedAppointment.date_end"
                    required
                  />
                </label>
                <label>
                  Stato:
                  <select v-model="selectedAppointment.status" required>
                    <option
                      v-for="status in appointmentStatuses"
                      :key="status.id"
                      :value="status.id"
                    >
                      {{ status.name }}
                    </option>
                  </select>
                </label>
              </fieldset>
            </div>
          </div>

          <!-- Campo Note -->
          <div class="notes-section">
            <label>
              Note:
              <textarea
                v-model="selectedAppointment.notes"
                rows="4"
                placeholder="Aggiungi eventuali note qui..."
              ></textarea>
            </label>
          </div>

          <!-- Pulsanti -->
          <div class="modal-buttons">
            <button type="button" @click="closeModal">Annulla</button>
            <button type="submit">Salva Modifiche</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import "@/styles/calendar.css";

export default defineComponent({
  name: "CalendarView",
  components: { FullCalendar },
  data() {
    return {
      agents: [],
      appointments: [],
      isModalOpen: false,
      legalForms: [],
      selectedAppointment: {
        id: null,
        client_name: "",
        date_start: "",
        date_end: "",
        notes: "",
        agent_id: null,
        operator_id: null,
        status: null,
      },
      operatorSearch: "",
      agentSearch: "",
      appointmentStatuses: [],

      calendarOptions: {
        plugins: [resourceTimeGridPlugin, interactionPlugin],
        initialView: "resourceTimeGridDay",
        slotMinTime: "09:00:00",
        slotMaxTime: "20:00:00",
        allDaySlot: true,
        editable: true,
        eventResizableFromStart: false,
        eventDrop: this.handleEventDrop,
        eventResize: this.handleEventResize,
        eventClick: this.handleEventClick,
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "",
        },

        customButtons: {},

        resources: [],
        events: [],
        height: "auto",
        locale: "it",
      },
    };
  },

  computed: {
    // Filtraggio dinamico degli operatori

    filteredOperators() {
      return this.operators.filter((operator) =>
        (operator.name || operator.username || "")
          .toLowerCase()
          .includes(this.operatorSearch.toLowerCase())
      );
    },
    // Filtraggio dinamico degli agenti
    filteredAgents() {
      return this.agents.filter((agent) =>
        (agent.name || agent.username || "")
          .toLowerCase()
          .includes(this.agentSearch.toLowerCase())
      );
    },
  },

  async created() {
    await this.fetchAgents();
    await this.fetchOperators();
    await this.fetchAppointments();
    await this.fetchAppointmentStatuses();
    await this.fetchLegalForms();
    this.updateCalendarData();
  },

  methods: {
    async fetchAgents() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );

        const flatAgents = Array.isArray(response.data)
          ? response.data.flatMap((user) =>
              Array.isArray(user) ? user : [user]
            )
          : [];

        console.log("Agenti ricevuti:", flatAgents);
        this.agents = flatAgents.filter((user) => user.role_id === 2);
      } catch (error) {
        console.error("Errore nel caricamento agenti:", error);
      }
    },

    async fetchLegalForms() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/legal-forms`
        );
        this.legalForms = response.data;
      } catch (error) {
        console.error(
          "Errore durante il recupero delle forme giuridiche:",
          error
        );
        //alert("Errore durante il caricamento delle forme giuridiche.");
        this.$toast.show(
          "Errore durante il caricamento delle forme giuridiche.",
          {
            position: "bottom-right",
            duration: 5000,
            type: "error",
          }
        );
      }
    },

    async fetchOperators() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );

        const flatUsers = Array.isArray(response.data)
          ? response.data.flatMap((user) =>
              Array.isArray(user) ? user : [user]
            )
          : [];

        // Filtro corretto per il ruolo operatore
        this.operators = flatUsers.filter((user) => user.role_id === 1);
      } catch (error) {
        console.error("Errore nel caricamento operatori:", error);
      }
    },

    async fetchAppointments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/appointments`
        );
        this.appointments = response.data.map((appt) => ({
          id: appt.id,
          client_name: appt.client_name || "N/A",
          client_forma_giuridica: appt.client_forma_giuridica || "N/A",
          client_address: appt.client_address || "",
          client_city: appt.client_city || "",
          client_cap: appt.client_cap || "",
          client_phone: appt.client_phone || "",
          client_province: appt.client_province || "",
          date_start: appt.date_start,
          date_end: appt.date_end,
          notes: appt.notes || "",
          agent_id: appt.agent_id || null,
          operator_id: appt.operator_id || null,
          status: appt.status_id || null,
        }));
      } catch (error) {
        console.error("Errore nel caricamento appuntamenti:", error);
      }
    },

    async fetchAppointmentStatuses() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/appointment-status`
        );
        this.appointmentStatuses = Array.isArray(response.data)
          ? response.data
          : [];
      } catch (error) {
        console.error("Errore durante il recupero degli stati:", error);
        //alert("Errore durante il caricamento degli stati.");
        this.$toast.show("Errore durante il caricamento degli stati.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    updateCalendarData() {
      // Popola gli agenti come risorse
      this.calendarOptions.resources = this.agents.map((agent) => ({
        id: agent.id,
        title: `${agent.cognome || ""} ${agent.nome || ""}`.trim(),
      }));

      // Popola gli appuntamenti come eventi
      this.calendarOptions.events = this.appointments.map((appt) => ({
        id: appt.id,
        title: appt.client_name || "Appuntamento",
        start: appt.date_start,
        end: appt.date_end,
        resourceId: appt.agent_id,
        extendedProps: {
          client_name: appt.client_name,
          client_forma_giuridica: appt.client_forma_giuridica || "N/A",
          client_address: appt.client_address,
          client_city: appt.client_city,
          client_cap: appt.client_cap,
          client_phone: appt.client_phone,
          client_province: appt.client_province,
          notes: appt.notes || "Nessuna nota",
          agent_id: appt.agent_id || null,
          operator_id: appt.operator_id || null,
          status: appt.status || appt.status_id || null,
        },
      }));

      console.log(
        "Dati mappati per il calendario:",
        this.calendarOptions.events
      );
    },

    handleEventClick(info) {
      const event = info.event;
      this.selectedAppointment = {
        id: event.id,
        client_name: event.title || "",
        client_forma_giuridica:
          event.extendedProps.client_forma_giuridica || "N/A",
        client_address: event.extendedProps.client_address || "",
        client_city: event.extendedProps.client_city || "",
        client_cap: event.extendedProps.client_cap || "",
        client_phone: event.extendedProps.client_phone || "",
        client_province: event.extendedProps.client_province || "",
        date_start: event.start.toISOString().slice(0, 16),
        date_end: event.end ? event.end.toISOString().slice(0, 16) : "",
        notes: event.extendedProps.notes || "",
        agent_id: event.extendedProps.agent_id || null,
        operator_id: event.extendedProps.operator_id || null,
        status: event.extendedProps.status || null,
      };
      this.isModalOpen = true;
    },

    async handleEventDrop(info) {
      try {
        const resources = info.event.getResources();
        const agentId = resources[0]?._resource?.id;

        const updatedEvent = {
          id: info.event.id,
          date_start: info.event.start.toISOString(),
          date_end: info.event.end ? info.event.end.toISOString() : null,
          agent_id: agentId,
        };

        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments-drop/${updatedEvent.id}`,
          updatedEvent
        );

        //alert("Appuntamento aggiornato con successo.");
        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });

        // Aggiorna manualmente i dati dell'evento nel frontend
        info.event.setExtendedProp("agent_id", agentId);
      } catch (error) {
        console.error("Errore nell'aggiornamento:", error);
        info.revert();
      }
    },

    // Gestisce il ridimensionamento di un evento
    async handleEventResize(info) {
      const updatedEvent = {
        id: info.event.id,
        date_start: info.event.start.toISOString(),
        date_end: info.event.end.toISOString(),
        agent_id: info.event.getResources()[0]?.id,
      };
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments/${updatedEvent.id}`,
          updatedEvent
        );
        //alert("Appuntamento aggiornato con successo!");
        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
      } catch (error) {
        console.error("Errore nell'aggiornamento:", error);
        info.revert();
      }
    },

    closeModal() {
      this.isModalOpen = false;
    },

    async updateAppointment() {
      try {
        // Mappa il campo `status` nel valore corretto per il backend (`status_id`)
        const updatedData = {
          ...this.selectedAppointment,
          status_id: this.selectedAppointment.status, // Trasforma il campo `status` in `status_id`
        };

        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments/${this.selectedAppointment.id}`,
          updatedData
        );

        //alert("Appuntamento aggiornato con successo!");
        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
        await this.fetchAppointments();
        this.updateCalendarData();
        this.closeModal();
      } catch (error) {
        console.error("Errore durante l'aggiornamento:", error);
        //alert("Errore durante l'aggiornamento dell'appuntamento.");
        this.$toast.show("Errore durante l'aggiornamento dell'appuntamento.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },
  },
});
</script>

<style scoped></style>
