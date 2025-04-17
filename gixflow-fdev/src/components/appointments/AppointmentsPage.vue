<template>
  <div class="appointments-page">
    <div class="header">
      <h1>
        <i class="fa-solid fa-calendar-check icon-green"></i>Elenco Appuntamenti
      </h1>
      <div class="actions">
        <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportAppointments">CSV</button>
      </div>
    </div>

    <!-- Modale per Creare un Nuovo Appuntamento -->
    <div v-if="isCreateModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Crea Nuovo Appuntamento</h2>
        <form @submit.prevent="createAppointment">
          <div class="form-grid">
            <!-- Colonna Sinistra -->
            <div class="form-column">
              <fieldset>
                <legend>Informazioni Cliente</legend>
                <label>
                  Cliente:
                  <input
                    type="text"
                    v-model="newAppointment.client_name"
                    required
                  />
                </label>
                <label>
                  Forma Giuridica:
                  <select v-model="newAppointment.forma_giuridica" required>
                    <option disabled value="">Seleziona Forma Giuridica</option>
                    <option
                      v-for="form in legalForms"
                      :key="form.id"
                      :value="form.id"
                    >
                      {{ form.name }}
                    </option>
                  </select>
                </label>

                <label>
                  Telefono:
                  <input
                    type="text"
                    v-model="newAppointment.client_phone"
                    required
                  />
                </label>
                <label>
                  Indirizzo:
                  <input
                    type="text"
                    v-model="newAppointment.client_address"
                    required
                  />
                </label>
                <label>
                  CAP:
                  <input
                    type="text"
                    v-model="newAppointment.client_cap"
                    required
                  />
                </label>
                <label>
                  Città:
                  <input
                    type="text"
                    v-model="newAppointment.client_city"
                    required
                  />
                </label>
                <label>
                  Provincia:
                  <input
                    type="text"
                    v-model="newAppointment.client_province"
                    required
                  />
                </label>
              </fieldset>
            </div>
            <!-- Colonna Destra -->
            <div class="form-column">
              <fieldset>
                <legend>Dettagli Appuntamento</legend>
                <label>
                  Operatore:
                  <select v-model="newAppointment.operator_id" required>
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
                  <select v-model="newAppointment.agent_id" required>
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
                    v-model="newAppointment.date_start"
                    required
                  />
                </label>
                <label>
                  Data Fine:
                  <input
                    type="datetime-local"
                    v-model="newAppointment.date_end"
                    required
                  />
                </label>
                <label>
                  Stato:
                  <select v-model="newAppointment.status_id" required>
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
              <textarea v-model="newAppointment.notes" rows="4"></textarea>
            </label>
          </div>

          <!-- Pulsanti -->
          <div class="modal-buttons">
            <button type="button" @click="closeCreateModal">Annulla</button>
            <button type="submit">Crea Appuntamento</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Sezione Filtri -->
    <div class="filters">
      <label>
        Agente:
        <select v-model="filters.agent">
          <option value="">Tutti</option>
          <option v-for="agent in agents" :key="agent.id" :value="agent.id">
            {{
              agent.cognome
                ? `${agent.cognome} ${agent.nome || ""}`
                : "Senza Nome"
            }}
          </option>
        </select>
      </label>

      <label>
        Operatore:
        <select v-model="filters.operator">
          <option value="">Tutti</option>
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
        Data Inizio:
        <flat-pickr
          v-model="filters.dateStart"
          :config="configDate"
          class="custom-datepicker"
        />
      </label>

      <label>
        Data Fine:
        <flat-pickr
          v-model="filters.dateEnd"
          :config="configDate"
          class="custom-datepicker"
        />
      </label>

      <label>
        Stato:
        <select v-model="filters.status_id">
          <option value="">Tutti</option>
          <!-- Opzione per non filtrare -->
          <option
            v-for="status in appointmentStatuses"
            :key="status.id"
            :value="status.id"
          >
            {{ status.name }}
          </option>
        </select>
      </label>

      <button @click="applyFilters">Applica Filtri</button>
      <button @click="resetFilters">Reset</button>
    </div>

    <!-- Tabella degli appuntamenti -->
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Telefono</th>
          <th>Indirizzo</th>
          <th>Città</th>
          <th>Provincia</th>
          <th>CAP</th>
          <th>Operatore</th>
          <th>Agente</th>
          <th>Data / Ora</th>
          <!-- <th>Data Fine</th> -->
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="appointment in paginatedAppointments" :key="appointment.id">
          <td>{{ appointment.id }}</td>
          <td>
            {{ appointment.client_name || "N/A" }} -
            {{ appointment.client_forma_giuridica }}
          </td>
          <td>{{ appointment.client_phone || "N/A" }}</td>
          <td>{{ appointment.client_address || "N/A" }}</td>
          <td>{{ appointment.client_city || "N/A" }}</td>
          <td>{{ appointment.client_province || "N/A" }}</td>
          <td>{{ appointment.client_cap || "N/A" }}</td>
          <td>{{ appointment.operator_name || "N/A" }}</td>
          <td>{{ appointment.agent_name || "N/A" }}</td>
          <td>{{ formatDateTime(appointment.date_start) }}</td>
          <!-- <td>{{ formatDateTime(appointment.date_end) }}</td> -->
          <td>{{ capitalize(appointment.status_name) || "N/A" }}</td>
          <td>
            <button class="in-grid" @click="openEditModal(appointment)">
              <i class="fa-duotone fa-solid fa-pen"></i>
            </button>
            <button
              class="in-grid-red"
              @click="deleteAppointment(appointment.id)"
            >
              <i class="fa-duotone fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
        <tr v-if="filteredAppointments.length === 0">
          <td colspan="13">Nessun appuntamento trovato.</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
      <i class="fa-solid fa-backward-step"></i>
      </button>

      <span v-for="page in totalPages" :key="page">
        <button
          :class="{ active: page === currentPage }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </span>

      <button
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
      <i class="fa-solid fa-forward-step"></i>
      </button>
    </div>

    <!-- Modale per modificare appuntamenti -->
    <div v-if="isEditModalOpen" class="modal-overlay">
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
                  <label>
                    Forma Giuridica:
                    <input
                      type="text"
                      v-model="selectedAppointment.client_forma_giuridica"
                      readonly
                    />
                  </label>

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
                      v-for="operator in filteredOperators"
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
                      v-for="agent in filteredAgents"
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

                  <flat-pickr
                    v-model="selectedAppointment.date_start"
                    :config="configDateTime"
                    class="custom-datepicker"
                  />
                </label>
                <label>
                  Data Fine:

                  <flat-pickr
                    v-model="selectedAppointment.date_end"
                    :config="configDateTime"
                    class="custom-datepicker"
                  />
                </label>
                <label>
                  Stato:
                  <select v-model="selectedAppointment.status_id" required>
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
                <legend>Meta Dati</legend>
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
            <button type="button" @click="closeEditModal">Annulla</button>
            <button type="submit">Salva Modifiche</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment-timezone";
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
      dateFormat: "Y-m-d", // Formato coerente con il backend
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

    return { configDate, configDateTime };
  },
  name: "AppointmentsPage",
  data() {
    return {
      appointments: [],
      filteredAppointments: [],
      agents: [],
      operators: [],
      appointmentStatuses: [],

      filters: {
        agent: "",
        operator: "",
        dateStart: "",
        dateEnd: "",
        status_id: "",
      },

      currentPage: 1,
      itemsPerPage: 10,

      isCreateModalOpen: false,
      legalForms: [],
      newAppointment: {
        client_name: "",
        client_forma_giuridica: "",
        client_phone: "",
        client_address: "",
        client_city: "",
        client_province: "",
        client_cap: "",
        operator_id: "",
        agent_id: "",
        date_start: "",
        date_end: "",
        status_id: "",
        notes: "",
      },
      operatorSearch: "",
      agentSearch: "",
      isEditModalOpen: false,
      selectedAppointment: null,
    };
  },

  computed: {
    paginatedAppointments() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredAppointments.slice(start, end); // Usa i dati filtrati
    },

    // Calcola il numero totale di pagine
    totalPages() {
      return Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    },

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

  methods: {
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
            operator_name: appointment.operator_name || "N/A",
            agent_id: appointment.agent_id || null,
            agent_name: appointment.agent_name || "N/A",

            date_start: appointment.date_start || "❌ ERRORE: NO DATA",
            date_end: appointment.date_end || "❌ ERRORE: NO DATA",

            status_id: appointment.status_id || "",
            status_name: appointment.status_name || "N/A",
            notes: appointment.notes || "",

            creation_date: appointment.creation_date || null,
            last_modified_date: appointment.last_modified_date || null,
            created_by_name: appointment.created_by_name || "Non specificato",
            updated_by_name: appointment.updated_by_name || "Nessuna modifica",
          };
        });

        this.filteredAppointments = [...this.appointments];
      } catch (error) {
        console.error(
          "❌ Errore durante il recupero degli appuntamenti:",
          error
        );
      }
    },
  async fetchUsersByRole() {
  try {
    const response = await axios.get(
      `${process.env.VUE_APP_API_URL}/users`
    );

    // Appiattisci l'array in caso di annidamento
    const allUsers = Array.isArray(response.data)
      ? response.data.flat()
      : []; // Fallback per evitare errori se non è un array valido

    // Filtra per ruolo, rimuove duplicati e ordina alfabeticamente
    this.operators = this.removeDuplicates(
      allUsers.filter((user) => user.role_id === 1)
    ).sort((a, b) => {
      const nameA = `${a.cognome || ""} ${a.nome || ""}`.trim().toLowerCase();
      const nameB = `${b.cognome || ""} ${b.nome || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    this.agents = this.removeDuplicates(
      allUsers.filter((user) => user.role_id === 2)
    ).sort((a, b) => {
      const nameA = `${a.cognome || ""} ${a.nome || ""}`.trim().toLowerCase();
      const nameB = `${b.cognome || ""} ${b.nome || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } catch (error) {
    this.$toast.show("Errore durante il caricamento degli utenti.", {
      position: "bottom-right",
      duration: 5000,
      type: "error",
    });
  }
},

    async createAppointment() {
      try {
        // Validazione preliminare
        if (
          !this.newAppointment.client_phone ||
          this.newAppointment.client_phone.trim() === ""
        ) {
          this.$toast.show("Il campo Telefono è obbligatorio.", {
            position: "bottom-right",
            duration: 5000,
            type: "warning",
          });
          return;
        }

        const newAppointmentData = {
          client_name: this.newAppointment.client_name,
          forma_giuridica_id: this.newAppointment.forma_giuridica, // Passa l'ID della forma giuridica
          client_phone: this.newAppointment.client_phone,
          client_address: this.newAppointment.client_address || null,
          client_city: this.newAppointment.client_city || null,
          client_province: this.newAppointment.client_province || null,
          client_cap: this.newAppointment.client_cap || null,
          operator_id: this.newAppointment.operator_id,
          agent_id: this.newAppointment.agent_id,
          date_start: this.formatDateForBackend(this.newAppointment.date_start),
          date_end: this.formatDateForBackend(this.newAppointment.date_end),
          status_id: this.newAppointment.status_id,
          notes: this.newAppointment.notes || "",
        };

        await axios.post(
          `${process.env.VUE_APP_API_URL}/appointments`,
          newAppointmentData
        );
        this.$toast.show("Appuntamento creato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
        this.closeCreateModal();
        this.fetchAppointments(); // Aggiorna la lista degli appuntamenti
      } catch (error) {
        console.error("Errore durante la creazione dell'appuntamento:", error);
        this.$toast.show("Errore durante la creazione dell'appuntamento.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async updateAppointment() {
      try {
        const id = this.selectedAppointment.id;

        const updatedData = {
          operator_id: this.selectedAppointment.operator_id,
          agent_id: this.selectedAppointment.agent_id,
          date_start: this.formatDateForBackend(
            this.selectedAppointment.date_start
          ),
          date_end: this.formatDateForBackend(
            this.selectedAppointment.date_end
          ),
          status_id: this.selectedAppointment.status_id,
          notes: this.selectedAppointment.notes,
        };
        await axios.put(
          `${process.env.VUE_APP_API_URL}/appointments/${id}`,
          updatedData
        );

        this.fetchAppointments();
        this.closeEditModal();
        this.$toast.show("Appuntamento aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
      } catch (error) {
        console.error("❌ Errore durante l'aggiornamento:", error);
        this.$toast.show("Errore durante l'aggiornamento dell'appuntamento.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async deleteAppointment(id) {
      if (confirm("Sei sicuro di voler eliminare questo appuntamento?")) {
        try {
          await axios.delete(
            `${process.env.VUE_APP_API_URL}/appointments/${id}`
          );
          this.fetchAppointments();
          this.$toast.show("Appuntamento eliminato con successo.", {
            position: "bottom-right",
            duration: 5000,
            type: "default",
          });
        } catch (error) {
          console.error(
            "Errore durante l'eliminazione dell'appuntamento:",
            error
          );
          this.$toast.show("Errore durante l'eliminazione dell'appuntamento.", {
            position: "bottom-right",
            duration: 5000,
            type: "error",
          });
        }
      }
    },

    async exportAppointments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/appointments/export`,
          {
            responseType: "blob",
          }
        );

        // Crea un URL per il download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "appuntamenti.csv"); // Nome del file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Errore durante l'export:", error);
        this.showFeedback("Errore durante l'esportazione", "error");
      }
    },

    // Rimuovi duplicati basandoti sull'id
    removeDuplicates(array) {
      const seen = new Set();
      return array.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },

    // Reset campi del nuovo appuntamento
    resetNewAppointment() {
      this.newAppointment = {
        client_name: "",
        client_forma_giuridica: "",
        client_phone: "",
        client_address: "",
        client_city: "",
        client_province: "",
        client_cap: "",
        operator_id: "",
        agent_id: "",
        date_start: "",
        date_end: "",
        status_id: "",
        notes: "",
      };
    },

    // Applicazione filtri nella tabella
    /* applyFilters() {
      this.filteredAppointments = this.appointments.filter((appointment) => {
        const matchesAgent = this.filters.agent
          ? appointment.agent_id === parseInt(this.filters.agent)
          : true;

        const matchesOperator = this.filters.operator
          ? appointment.operator_id === parseInt(this.filters.operator)
          : true;

        const matchesDateStart = this.filters.dateStart
          ? new Date(appointment.date_start) >= new Date(this.filters.dateStart)
          : true;

        const matchesDateEnd = this.filters.dateEnd
          ? new Date(appointment.date_end) <= new Date(this.filters.dateEnd)
          : true;

        const matchesStatus = this.filters.status_id // Filtra per `status_id`
          ? appointment.status_id === parseInt(this.filters.status_id)
          : true;

        return (
          matchesAgent &&
          matchesOperator &&
          matchesDateStart &&
          matchesDateEnd &&
          matchesStatus
        );
      });
    }, */

    applyFilters() {
  this.filteredAppointments = this.appointments.filter((appointment) => {
    const matchesAgent = this.filters.agent
      ? appointment.agent_id === parseInt(this.filters.agent)
      : true;

    const matchesOperator = this.filters.operator
      ? appointment.operator_id === parseInt(this.filters.operator)
      : true;

    const matchesDateStart = this.filters.dateStart
      ? moment(appointment.date_start).isSameOrAfter(
          moment(this.filters.dateStart),
          "day"
        )
      : true;

    const matchesDateEnd = this.filters.dateEnd
      ? moment(appointment.date_end).isSameOrBefore(
          moment(this.filters.dateEnd),
          "day"
        )
      : true;

    const matchesStatus = this.filters.status_id
      ? appointment.status_id === parseInt(this.filters.status_id)
      : true;

    return (
      matchesAgent &&
      matchesOperator &&
      matchesDateStart &&
      matchesDateEnd &&
      matchesStatus
    );
  });
},

    // Resetta tutti i filtri
    resetFilters() {
      this.filters = {
        agent: "",
        operator: "",
        dateStart: "",
        dateEnd: "",
        status: "",
      };
      this.filteredAppointments = [...this.appointments];
    },

    formatDateForInput(dateString) {
      if (!dateString || typeof dateString !== "string") return "";

      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (error) {
        console.error("Errore formatDateForInput:", error);
        return "";
      }
    },

    formatDateForBackend(datetime) {
      if (!datetime) return null;

      try {
        const date = new Date(datetime);
        if (isNaN(date.getTime())) return null; // Se la data non è valida, restituiamo null

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:00`;
      } catch (error) {
        console.error("Errore formatDateForBackend:", error);
        return null;
      }
    },

    // Apri il modale per creare un nuovo appuntamento
    openCreateModal() {
      this.resetNewAppointment();
      this.isCreateModalOpen = true;
    },

    // Chiudi il modale
    closeCreateModal() {
      this.isCreateModalOpen = false;
    },

    openEditModal(appointment) {
      this.selectedAppointment = {
        ...appointment,
        date_start: appointment.date_start
          ? this.formatDateForInput(appointment.date_start)
          : "",
        date_end: appointment.date_end
          ? this.formatDateForInput(appointment.date_end)
          : "",
      };

      this.isEditModalOpen = true;
    },

    // Chiudi il modale
    closeEditModal() {
      this.selectedAppointment = null;
      this.operatorSearch = "";
      this.agentSearch = "";
      this.isEditModalOpen = false;
    },

    // Formatta una data in locale
    formatDate(date) {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleString("it-IT");
    },

    // Metodo per cambiare pagina
    changePage(page) {
      if (page > 0 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    formatDateTime(dateString) {
      if (!dateString) return "N/A";

      // Usa moment.utc() per evitare conversioni di fuso automatiche
      return moment.utc(dateString).format("DD/MM/YYYY HH:mm");
    },

    // Capitalizza la prima lettera di una stringa
    capitalize(string) {
      if (!string) return ""; // Se la stringa è vuota o null
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
  },

  mounted() {
    this.fetchAppointments();
    this.fetchUsersByRole();
    this.fetchAppointmentStatuses(); // Chiama il metodo per recuperare gli stati
    this.fetchLegalForms(); // Carica le forme giuridiche al caricamento
  },
};
</script>

<style scoped></style>
