<template>
  <div class="calendar-page">
    <h1>
      <i class="fa-solid fa-calendar-days icon-green"></i>Calendario
      Appuntamenti
    </h1>

    <FullCalendar :options="calendarOptions" class="custom-calendar" />

    <!-- Modale per i dettagli dell'appuntamento -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2 v-if="selectedAppointment">
          Modifica Appuntamento #{{ selectedAppointment.id }}
        </h2>
        <form @submit.prevent="updateAppointmentClickFC">
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
import moment from "moment-timezone";
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
        timeZone: "Europe/Rome",
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

        this.appointments = response.data.map((appointment) => {
          return {
            id: appointment.id,
            client_name: appointment.client_name || "N/A",
            client_forma_giuridica:
              appointment.client_forma_giuridica || "Non specificata",
            client_phone: appointment.client_phone || "N/A",
            client_address: appointment.client_address || "N/A",
            client_city: appointment.client_city || "N/A",
            client_province: appointment.client_province || "N/A",
            client_cap: appointment.client_cap || "N/A",
            operator_id: appointment.operator_id || null,
            agent_id: appointment.agent_id || null,

            date_start: appointment.date_start, // Manteniamo il valore originale
            date_end: appointment.date_end,

            status_id: appointment.status_id || "",
            notes: appointment.notes || "",
          };
        });

        this.updateCalendarData();
      } catch (error) {
        console.error("❌ Errore nel fetch degli appuntamenti:", error);
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
        this.$toast.show("Errore durante il caricamento degli stati.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async updateAppointmentClickFC() {
      try {
        const updatedData = {
          id: this.selectedAppointment.id,
          date_start: this.formatDateForBackend(
            this.selectedAppointment.date_start
          ), // Salva in UTC
          date_end: this.formatDateForBackend(
            this.selectedAppointment.date_end
          ), // Salva in UTC
          notes: this.selectedAppointment.notes,
          agent_id: this.selectedAppointment.agent_id,
          operator_id: this.selectedAppointment.operator_id,
          status_id: this.selectedAppointment.status,
        };

        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments-clickfc/${updatedData.id}`,
          updatedData
        );

        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });

        await this.fetchAppointments();
        this.updateCalendarData();
        this.closeModal();
      } catch (error) {
        console.error("❌ Errore aggiornamento appuntamento:", error);
        this.$toast.show("Errore durante l'aggiornamento.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
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

        date_start: this.formatDateForInput(event.start),
        date_end: this.formatDateForInput(event.end),

        notes: event.extendedProps.notes || "",
        agent_id: event.extendedProps.agent_id || null,
        operator_id: event.extendedProps.operator_id || null,
        status:
          event.extendedProps.status_id || event.extendedProps.status || null,
      };

      this.isModalOpen = true;
    },

    async handleEventDrop(info) {
      try {
        const event = info.event;
        const agentId = event.getResources()[0]?.id;

        const updatedData = {
          id: event.id,
          agent_id: agentId,
          date_start: this.formatDateForBackendResDrop(event.start),
          date_end: this.formatDateForBackendResDrop(event.end),
          notes: event.extendedProps.notes || "",
          operator_id: event.extendedProps.operator_id || null,
          //status_id: event.extendedProps.status_id || null,
          status_id:
            event.extendedProps.status_id ?? event.extendedProps.status ?? null,
        };

        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments-drop/${updatedData.id}`,
          updatedData
        );

        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });

        event.setExtendedProp("agent_id", agentId); // aggiornamento nel calendario
      } catch (error) {
        console.error("❌ Errore nel drop:", error);
        info.revert();
      }
    },

    async handleEventResize(info) {
      try {
        const event = info.event;

        const updatedData = {
          id: event.id,
          agent_id: event.getResources()[0]?.id || null,
          date_start: this.formatDateForBackendResDrop(event.start),
          date_end: this.formatDateForBackendResDrop(event.end),
          notes: event.extendedProps.notes || "",
          operator_id: event.extendedProps.operator_id || null,
          status_id:
            event.extendedProps.status_id ?? event.extendedProps.status ?? null,
        };

        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments/${updatedData.id}`,
          updatedData
        );

        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
      } catch (error) {
        console.error("❌ Errore nel resize:", error);
        info.revert();
      }
    },

    updateCalendarData() {
      this.calendarOptions.resources = this.agents.map((agent) => ({
        id: agent.id,
        title: `${agent.cognome || ""} ${agent.nome || ""}`.trim(),
      }));

      this.calendarOptions.events = this.appointments.map((appt) => ({
        id: appt.id,
        title: appt.client_name || "Appuntamento",
        start: moment
          .tz(appt.date_start, "UTC")
          .tz("Europe/Rome")
          .toISOString(),
        end: moment.tz(appt.date_end, "UTC").tz("Europe/Rome").toISOString(),

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
    },

    // Converti la data dal backend (UTC) al fuso locale per la visualizzazione
    formatDateTime(dateString) {
      if (!dateString) return "N/A";

      return moment
        .utc(dateString)
        .tz("Europe/Rome")
        .format("DD/MM/YYYY HH:mm");
    },

    // Converte la data per essere usata in un campo datetime-local (input form)
    formatDateForInput(dateString) {
      if (!dateString) return "";

      return moment.utc(dateString).format("YYYY-MM-DDTHH:mm");
    },

    // Converti la data locale in UTC prima di salvarla nel backend
    formatDateForBackend(dateString) {
      if (!dateString) return null;
      return dateString.replace("T", ":") + ":00";
    },

    // Converti la data locale in UTC prima di salvarla nel backend
    formatDateForBackendResDrop(dateString) {
      if (!dateString) return null;

      return moment(dateString, "YYYY-MM-DDTHH:mm") // Interpreta come ora locale
        .tz("Europe/Rome") // Applica il fuso orario locale
        .utc() // Converte in UTC per il backend
        .format("YYYY-MM-DD HH:mm:ss"); // Formatta correttamente
    },

    closeModal() {
      this.isModalOpen = false;
    },
  },
});
</script>

<style scoped></style>
