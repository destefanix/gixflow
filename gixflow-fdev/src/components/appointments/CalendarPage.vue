<template>
  <div class="calendar-page">
    <h1>
      <i class="fa-solid fa-calendar-days icon-green"></i>Calendario
      Appuntamenti
    </h1>

    <!-- Contenitore principale con Flexbox -->
    <div class="calendar-container">

      <!-- Barra laterale per il multi-select -->
      <div class="sidebar-multiselect">

        <!-- Calendarietto -->
        <h3>Vai a data</h3>
        <div class="mini-calendar">
          <div class="calendar-header">
            <button @click="prevMonth">&lt;</button>
            <span>{{ currentMonth }}</span>
            <button @click="nextMonth">&gt;</button>
          </div>
          <div class="calendar-weekdays">
            <span v-for="day in weekdays" :key="day" class="weekday">{{
              day
            }}</span>
          </div>
          <div class="calendar-grid">
            <div
              v-for="day in daysInMonth"
              :key="day.date"
              class="calendar-day"
              :class="{ selected: isSelected(day.date) }"
              @click="selectDate(day.date)"
            >
              {{ day.day }}
            </div>
          </div>
        </div>
        <div class="button-group">
          <button @click="refreshData">
            <i class="fa-solid fa-arrows-rotate"></i> Aggiorna eventi
          </button>
        </div>

        <div class="filter-section">
          <h3>Filtra per Sede</h3>
          <select v-model="selectedLocation" @change="filterByLocation">
            <option value="">Tutte le sedi</option>
            <!-- Opzione di default -->
            <option
              v-for="location in uniqueLocations"
              :key="location"
              :value="location"
            >
              {{ location }}
            </option>
          </select>
        </div>

        <h3>Sub-calendars</h3>
        <div class="button-group">
          <button @click="selectAllAgents">Tutti</button>
          <button @click="deselectAllAgents">Deseleziona</button>
        </div>
        <ul>
          <li
            v-for="agent in agents"
            :key="agent.id"
            :class="{ selected: selectedAgentIds.includes(agent.id) }"
            @click="toggleAgentSelection(agent.id)"
          >
            {{ agent.cognome || "" }}
            {{ agent.nome || "" }}
          </li>
        </ul>
      </div>

      <!-- Calendario -->
      <div>
        <FullCalendar
          ref="fullCalendar"
          :options="calendarOptions"
          class="custom-calendar"
        />
      </div>
    </div>

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
                          ?`${operator.cognome || ""} ${operator.nome || ""} (${operator.location_name || ""})`
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
              <fieldset class="meta-info">
                <legend>Informazioni di Tracciamento</legend>
                <p>
                  <strong>Creato il:</strong>
                  {{ formatDateTime(selectedAppointment.creation_date) }}
                </p>
                <p>
                  <strong>Creato da:</strong>
                  {{ selectedAppointment.created_by_name }}
                </p>
                <p>
                  <strong>Ultima modifica:</strong>
                  {{ formatDateTime(selectedAppointment.last_modified_date) }}
                </p>
                <p>
                  <strong>Modificato da:</strong>
                  {{ selectedAppointment.updated_by_name }}
                </p>
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
import "moment/locale/it"; // Importa la localizzazione italiana
moment.locale("it"); // Imposta la lingua italiana
import "@/styles/calendar.css";

export default defineComponent({
  name: "CalendarView",
  components: { FullCalendar },
  data() {
    return {
      agents: [],

      selectedDate: new Date(), // Data selezionata
      currentMonth: moment().format("MMMM"),
      currentYear: moment().format("YYYY"),
      daysInMonth: [],
      weekdays: ["L", "M", "M", "G", "V", "S", "D"],

      selectedLocation: "",
      selectedButton: "today",

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

      selectedAgents: [],
      selectedAgentIds: [],

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
          left: "prev,next yesterday today tomorrow",
          center: "title",
          right: "customDayButton customWeekButton",
        },

        /* customButtons: {
          customDayButton: {
            text: "Giorno",
            click: () => {
              if (this.$refs.fullCalendar) {
                const calendarApi = this.$refs.fullCalendar.getApi(); // Ottieni l'istanza di FullCalendar
                calendarApi.changeView("resourceTimeGridDay"); // Cambia la vista in "Giorno"
                console.log("Vista cambiata a: Giorno");
              } else {
                console.error("FullCalendar non è pronto.");
              }
            },
          },

          customWeekButton: {
            text: "Settimana",
            click: () => {
              if (this.isWeekViewEnabled) {
                const calendarApi = this.$refs.fullCalendar.getApi();
                calendarApi.changeView("resourceTimeGridWeek"); // Cambia la vista in "Week"
              } else {
                this.$toast.show(
                  "Seleziona un solo agente per abilitare la vista settimanale.",
                  {
                    position: "bottom-right",
                    duration: 5000,
                    type: "default",
                  }
                );
              }
            },
          },

          yesterday: {
            text: "Ieri",
            click: () => {
              const calendarApi = this.$refs.fullCalendar.getApi();
              const yesterday = moment().subtract(1, "day").toDate();
              calendarApi.gotoDate(moment(yesterday).format("YYYY-MM-DD"));
              this.selectedDate = yesterday;
              this.selectedButton = "yesterday";
              localStorage.setItem("selectedButton", "yesterday");
              localStorage.setItem(
                "selectedDate",
                moment(yesterday).format("YYYY-MM-DD")
              );
              this.generateDaysInMonth();
            },
          },
          today: {
            text: "Oggi",
            click: () => {
              const calendarApi = this.$refs.fullCalendar.getApi();
              calendarApi.today();
              const today = new Date();
              this.selectedDate = today;
              this.selectedButton = "today";
              localStorage.setItem("selectedButton", "today");
              localStorage.setItem(
                "selectedDate",
                moment(today).format("YYYY-MM-DD")
              );
              this.generateDaysInMonth();
            },
          },
          tomorrow: {
            text: "Domani",
            click: () => {
              const calendarApi = this.$refs.fullCalendar.getApi();
              const tomorrow = moment().add(1, "day").toDate();
              calendarApi.gotoDate(moment(tomorrow).format("YYYY-MM-DD"));
              this.selectedDate = tomorrow;
              this.selectedButton = "tomorrow";
              localStorage.setItem("selectedButton", "tomorrow");
              localStorage.setItem(
                "selectedDate",
                moment(tomorrow).format("YYYY-MM-DD")
              );
              this.generateDaysInMonth();
            },
          },
          prev: {
            text: "Prev",
            click: () => {
              const calendarApi = this.$refs.fullCalendar.getApi();
              calendarApi.prev(); // Sposta il calendario indietro
              const currentDate = calendarApi.getDate(); // Ottieni la data corrente
              this.selectedDate = currentDate;
              localStorage.setItem(
                "selectedDate",
                moment(currentDate).format("YYYY-MM-DD")
              ); // Salva la data
              this.generateDaysInMonth();
            },
          },
          next: {
            text: "Next",
            click: () => {
              const calendarApi = this.$refs.fullCalendar.getApi();
              calendarApi.next(); // Sposta il calendario avanti
              const currentDate = calendarApi.getDate(); // Ottieni la data corrente
              this.selectedDate = currentDate;
              localStorage.setItem(
                "selectedDate",
                moment(currentDate).format("YYYY-MM-DD")
              ); // Salva la data
              this.generateDaysInMonth();
            },
          },
        }, */

        customButtons: {
          customDayButton: {
            text: "Giorno",
            click: null, // sarà collegato nel created()
          },
          customWeekButton: {
            text: "Settimana",
            click: null,
          },
          yesterday: {
            text: "Ieri",
            click: null,
          },
          today: {
            text: "Oggi",
            click: null,
          },
          tomorrow: {
            text: "Domani",
            click: null,
          },
          prev: {
            text: "Prev",
            click: null,
          },
          next: {
            text: "Next",
            click: null,
          },
        },
        resources: [],
        events: [],
        height: "auto",
        locale: "it",
        timeZone: "Europe/Rome",
        datesSet: this.handleDatesSet, // Aggiungi questo evento
      },
    };
  },

  computed: {
    isWeekViewEnabled() {
      return this.selectedAgentIds.length === 1; // Abilita solo se c'è un solo agente selezionato
    },
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
    uniqueLocations() {
      // Estrai le sedi uniche dagli appuntamenti
      const locations = this.appointments.map(
        (appt) => appt.location || "Sede non specificata"
      );
      return [...new Set(locations)]; // Rimuove i duplicati
    },
  },

  watch: {
    selectedAgents: {
      handler() {
        this.updateCalendarData(); // Aggiorna le risorse e gli eventi
      },
      deep: true,
    },
    selectedAgentIds: {
      handler(newVal) {
        if (newVal.length !== 1) {
          const calendarApi = this.$refs.fullCalendar.getApi();
          if (calendarApi.view.type === "resourceTimeGridWeek") {
            calendarApi.changeView("resourceTimeGridDay"); // Torna alla vista giornaliera
            this.$toast.show(
              "La vista settimanale è disponibile solo con un agente selezionato.",
              {
                position: "bottom-right",
                duration: 5000,
                type: "default",
              }
            );
          }
        }
      },
      deep: true,
    },
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

        this.agents = flatAgents
          .filter((user) => user.role_id === 2)
          .map((user) => ({
            ...user,
            cognome_nome: `${user.cognome || ""} ${user.nome || ""}`.trim(),
          }))
          .sort((a, b) => a.cognome_nome.localeCompare(b.cognome_nome));
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
            location:
              appointment.operator_location_name || "Sede non specificata", 
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
            date_start: appointment.date_start,
            date_end: appointment.date_end,
            status_id: appointment.status_id || "",
            notes: appointment.notes || "",
            creation_date: appointment.creation_date || null,
            last_modified_date: appointment.last_modified_date || null,
            created_by_name: appointment.created_by_name || "Non specificato",
            updated_by_name: appointment.updated_by_name || "Nessuna modifica",
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
          updated_by: this.currentUserId,
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
        creation_date: event.extendedProps.creation_date || null,
        last_modified_date: event.extendedProps.last_modified_date || null,
        created_by_name:
          event.extendedProps.created_by_name || "Non specificato",
        updated_by_name:
          event.extendedProps.updated_by_name || "Nessuna modifica",
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

        event.setExtendedProp("agent_id", agentId);
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

    async refreshData() {
      try {
        

        await Promise.all([
          this.fetchAgents(), 
          this.fetchAppointments(), 
        ]);

        this.updateCalendarData(); 

        this.$toast.show("Dati aggiornati.", {
          position: "bottom-right",
          duration: 3000,
          type: "success",
        });
      } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati:", error);
        this.$toast.show("Errore durante l'aggiornamento dei dati.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    updateCalendarData() {
      const visibleAgentIds = this.selectedAgentIds.length
        ? this.selectedAgentIds
        : this.agents.map((agent) => agent.id);

      this.calendarOptions.resources = this.agents
        .filter((agent) => visibleAgentIds.includes(agent.id))
        .map((agent) => ({
          id: agent.id,
          title: `${agent.cognome || ""} ${agent.nome || ""}`.trim(),
        }));

      this.calendarOptions.events = this.appointments
        .filter((appt) => visibleAgentIds.includes(appt.agent_id))
        .map((appt) => ({
          id: appt.id,
          title: appt.client_name || "Appuntamento",
          start: moment
            .tz(appt.date_start, "UTC")
            .tz("Europe/Rome")
            .toISOString(),
          end: moment.tz(appt.date_end, "UTC").tz("Europe/Rome").toISOString(),
          resourceId: appt.agent_id,
          extendedProps: {
            ...appt,
          },
        }));
    },

    filterByLocation() {
      // Salva la location selezionata nel localStorage
      localStorage.setItem("selectedLocation", this.selectedLocation);

      if (this.selectedLocation) {
        // Filtra per la sede selezionata
        this.calendarOptions.events = this.appointments
          .filter((appt) => appt.location === this.selectedLocation)
          .map((appt) => ({
            id: appt.id,
            title: appt.client_name || "Appuntamento",
            start: moment
              .tz(appt.date_start, "UTC")
              .tz("Europe/Rome")
              .toISOString(),
            end: moment
              .tz(appt.date_end, "UTC")
              .tz("Europe/Rome")
              .toISOString(),
            resourceId: appt.agent_id,
            extendedProps: {
              ...appt,
            },
          }));
      } else {
        // Mostra tutti gli appuntamenti
        this.updateCalendarData();
      }
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

    toggleAgentSelection(agentId) {
      if (this.selectedAgentIds.includes(agentId)) {
        this.selectedAgentIds = this.selectedAgentIds.filter(
          (id) => id !== agentId
        );
      } else {
        this.selectedAgentIds.push(agentId);
      }
      localStorage.setItem(
        "selectedAgentIds",
        JSON.stringify(this.selectedAgentIds)
      ); // Salva gli ID selezionati
      this.updateCalendarData(); // Aggiorna il calendario
    },

    selectAllAgents() {
      this.selectedAgentIds = this.agents.map((agent) => agent.id);
      localStorage.setItem(
        "selectedAgentIds",
        JSON.stringify(this.selectedAgentIds)
      ); // Salva tutti gli ID
      this.updateCalendarData(); // Aggiorna il calendario
    },

    deselectAllAgents() {
      this.selectedAgentIds = [];
      localStorage.setItem(
        "selectedAgentIds",
        JSON.stringify(this.selectedAgentIds)
      ); // Salva lo stato vuoto
      this.updateCalendarData(); // Aggiorna il calendario
    },

    handleDatesSet(info) {
      // Aggiorna la data selezionata con la data corrente di FullCalendar
      this.selectedDate = moment(info.start).toDate();
      this.generateDaysInMonth(); // Rigenera i giorni del mese
    },

    generateDaysInMonth() {
      const startOfMonth = moment(this.selectedDate)
        .startOf("month")
        .startOf("isoWeek"); // Inizia dal lunedì
      const endOfMonth = moment(this.selectedDate)
        .endOf("month")
        .endOf("isoWeek"); // Termina alla domenica
      const days = [];
      for (
        let date = startOfMonth;
        date.isBefore(endOfMonth);
        date.add(1, "day")
      ) {
        days.push({ date: date.toDate(), day: date.format("D") });
      }
      this.daysInMonth = days;
      this.currentMonth = moment(this.selectedDate)
        .format("MMM YYYY")
        .toUpperCase(); // Formato corretto
    },

    prevMonth() {
      this.selectedDate = moment(this.selectedDate)
        .subtract(1, "month")
        .toDate();
      this.generateDaysInMonth();
      this.updateCalendarView();
    },
    nextMonth() {
      this.selectedDate = moment(this.selectedDate).add(1, "month").toDate();
      this.generateDaysInMonth();
      this.updateCalendarView();
    },
    selectDate(date) {
      this.selectedDate = date;
      localStorage.setItem("selectedDate", moment(date).format("YYYY-MM-DD")); // Salva la data selezionata
      console.log(
        "Data salvata nel localStorage:",
        moment(date).format("YYYY-MM-DD")
      ); // Log per verifica
      this.updateCalendarView();
    },
    isSelected(date) {
      return moment(date).isSame(this.selectedDate, "day");
    },
    updateCalendarView() {
      const calendarApi = this.$refs.fullCalendar.getApi();
      console.log("Aggiornamento del calendario alla data:", this.selectedDate); // Log per verifica
      calendarApi.gotoDate(moment(this.selectedDate).format("YYYY-MM-DD")); // Vai alla data selezionata
    },

    changeToDayView() {
    const calendarApi = this.$refs.fullCalendar?.getApi();
    if (!calendarApi) return console.error("FullCalendar non inizializzato");
    calendarApi.changeView("resourceTimeGridDay");
  },
  changeToWeekView() {
    if (this.isWeekViewEnabled) {
      const calendarApi = this.$refs.fullCalendar?.getApi();
      if (!calendarApi) return console.error("FullCalendar non inizializzato");
      calendarApi.changeView("resourceTimeGridWeek");
    } else {
      this.$toast.show("Seleziona un solo agente per abilitare la vista settimanale.", {
        position: "bottom-right",
        duration: 5000,
        type: "default",
      });
    }
  },
  changeToYesterday() {
    const calendarApi = this.$refs.fullCalendar?.getApi();
    if (!calendarApi) return console.error("FullCalendar non inizializzato");
    const yesterday = moment().subtract(1, "day").toDate();
    calendarApi.gotoDate(moment(yesterday).format("YYYY-MM-DD"));
    this.selectedDate = yesterday;
    this.selectedButton = "yesterday";
    localStorage.setItem("selectedButton", "yesterday");
    localStorage.setItem("selectedDate", moment(yesterday).format("YYYY-MM-DD"));
    this.generateDaysInMonth();
  },
  changeToToday() {
    const calendarApi = this.$refs.fullCalendar?.getApi();
    if (!calendarApi) return console.error("FullCalendar non inizializzato");
    calendarApi.today();
    const today = new Date();
    this.selectedDate = today;
    this.selectedButton = "today";
    localStorage.setItem("selectedButton", "today");
    localStorage.setItem("selectedDate", moment(today).format("YYYY-MM-DD"));
    this.generateDaysInMonth();
  },
  changeToTomorrow() {
    const calendarApi = this.$refs.fullCalendar?.getApi();
    if (!calendarApi) return console.error("FullCalendar non inizializzato");
    const tomorrow = moment().add(1, "day").toDate();
    calendarApi.gotoDate(moment(tomorrow).format("YYYY-MM-DD"));
    this.selectedDate = tomorrow;
    this.selectedButton = "tomorrow";
    localStorage.setItem("selectedButton", "tomorrow");
    localStorage.setItem("selectedDate", moment(tomorrow).format("YYYY-MM-DD"));
    this.generateDaysInMonth();
  },
  changeToPrev() {
    const calendarApi = this.$refs.fullCalendar?.getApi();
    if (!calendarApi) return console.error("FullCalendar non inizializzato");
    calendarApi.prev();
    const currentDate = calendarApi.getDate();
    this.selectedDate = currentDate;
    localStorage.setItem("selectedDate", moment(currentDate).format("YYYY-MM-DD"));
    this.generateDaysInMonth();
  },
  changeToNext() {
    const calendarApi = this.$refs.fullCalendar?.getApi();
    if (!calendarApi) return console.error("FullCalendar non inizializzato");
    calendarApi.next();
    const currentDate = calendarApi.getDate();
    this.selectedDate = currentDate;
    localStorage.setItem("selectedDate", moment(currentDate).format("YYYY-MM-DD"));
    this.generateDaysInMonth();
  },
  async initApp() {
  await Promise.all([
    this.fetchAgents(),
    this.fetchOperators(),
    this.fetchAppointments(),
    this.fetchAppointmentStatuses(),
    this.fetchLegalForms(),
  ]);

  this.applySavedPreferences(); // <-- fondamentale qui

  this.updateCalendarData(); // con agenti filtrati
  this.filterByLocation(); // con location salvata
},

applySavedPreferences() {
  try {
    const savedAgentIds = localStorage.getItem("selectedAgentIds");
    const savedLocation = localStorage.getItem("selectedLocation");
    const savedDate = localStorage.getItem("selectedDate");
    const savedButton = localStorage.getItem("selectedButton");

    if (savedAgentIds) {
      this.selectedAgentIds = JSON.parse(savedAgentIds);
    }

    if (savedLocation) {
      this.selectedLocation = savedLocation;
    }

    if (savedDate) {
      this.selectedDate = moment(savedDate, "YYYY-MM-DD").toDate();
    }

    if (savedButton) {
      this.selectedButton = savedButton;
    }

    this.generateDaysInMonth(); // rigenera calendario mini
  } catch (error) {
    console.error("Errore nel recupero dati da localStorage:", error);
  }
},


  },

  mounted() {
    if (this.$refs.fullCalendar) {
      const calendarApi = this.$refs.fullCalendar.getApi(); // Assicurati che FullCalendar sia pronto

      const savedDate = localStorage.getItem("selectedDate");
      const savedButton = localStorage.getItem("selectedButton");

      if (savedDate) {
        this.selectedDate = moment(savedDate, "YYYY-MM-DD").toDate();
        calendarApi.gotoDate(moment(this.selectedDate).format("YYYY-MM-DD"));
      } else if (savedButton) {
        this.selectedButton = savedButton;
        if (savedButton === "yesterday") {
          const yesterday = moment().subtract(1, "day").toDate();
          calendarApi.gotoDate(moment(yesterday).format("YYYY-MM-DD"));
          this.selectedDate = yesterday;
        } else if (savedButton === "today") {
          calendarApi.today();
          this.selectedDate = new Date();
        } else if (savedButton === "tomorrow") {
          const tomorrow = moment().add(1, "day").toDate();
          calendarApi.gotoDate(moment(tomorrow).format("YYYY-MM-DD"));
          this.selectedDate = tomorrow;
        }
      } else {
        this.selectedDate = new Date();
        calendarApi.today();
      }

      this.generateDaysInMonth();
    } else {
      console.error("FullCalendar non è pronto.");
    }

    this.$nextTick(() => {
    if (!this.$refs.fullCalendar?.getApi) {
      console.warn("FullCalendar ancora non pronto in mounted");
    }
  });


  },
  created() {
  // Bind dei pulsanti custom
  this.calendarOptions.customButtons.customDayButton.click = this.changeToDayView;
  this.calendarOptions.customButtons.customWeekButton.click = this.changeToWeekView;
  this.calendarOptions.customButtons.yesterday.click = this.changeToYesterday;
  this.calendarOptions.customButtons.today.click = this.changeToToday;
  this.calendarOptions.customButtons.tomorrow.click = this.changeToTomorrow;
  this.calendarOptions.customButtons.prev.click = this.changeToPrev;
  this.calendarOptions.customButtons.next.click = this.changeToNext;

  // Fetch e inizializzazioni
  this.initApp(); // usa questo metodo definito sotto
},


});
</script>

<style scoped>
</style>
