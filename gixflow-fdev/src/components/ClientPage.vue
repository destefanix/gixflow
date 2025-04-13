<template>
  <div class="clients-page">
    <div class="header">
      <h1><i class="fa-solid fa-shop icon-green"></i>Ricerca Cliente</h1>
      <div class="actions">
        <!-- <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportAppointments">CSV</button> -->
      </div>
    </div>

    <!-- Overlay modale per risultati di ricerca -->
    <div v-if="filteredClients.length" class="modal-overlay">
      <div class="modal-content large scrollable">
        <div class="modal-header">
          <h2>Risultati Ricerca ({{ limitedResults.length }})</h2>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Ragione Sociale</th>
                <th>P.IVA</th>
                <th>Città</th>
                <th>Provincia</th>
                <th>Telefono</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="client in limitedResults"
                :key="client.id"
                @click="selectClient(client)"
              >
                <td>
                  <span class="link-name">
                    {{ client.ragione_sociale }}
                    <span v-if="client.forma_giuridica">
                      ({{ client.forma_giuridica }})
                    </span>
                  </span>
                </td>
                <td>{{ client.partita_iva }}</td>
                <td>{{ client.citta }}</td>
                <td>{{ client.provincia }}</td>
                <td>{{ client.telefono }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-footer">
          <button class="btn-close" @click="filteredClients = []">
            Chiudi
          </button>
        </div>
      </div>
    </div>

    <!-- Campo di ricerca -->
    <div class="search-bar">
      <input
        type="text"
        id="search"
        class="input-search-client"
        v-model="searchQuery"
        @input="debouncedSearch"
        placeholder="Ricerca Cliente per Ragione Sociale, PI o Telefono"
      />
      <button @click="resetSearch" class="reset-button">Reset</button>
    </div>

    <!-- Scheda cliente selezionato -->
    <div v-if="selectedClient" class="client-details">
      <div class="client-details-container">
        <!-- Intestazione con pulsante in linea -->
        <div class="header-details">
          <h2>
            Dettagli Cliente #{{ selectedClient.id }}:
            {{ selectedClient.ragione_sociale }}
          </h2>
          <button @click="openEditModal" class="edit-button">
            Modifica Cliente
          </button>
        </div>

        <div class="tab-container">
          <!-- Sottoschede -->
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.name"
              :class="{ active: currentTab === tab.name }"
              @click="currentTab = tab.name"
            >
              {{ tab.label }}
            </button>
          </div>
          <!-- Contenuto delle schede -->
          <div class="tab-content">
            <!-- Le schede come definite in precedenza -->
          </div>

          <!-- Contenuto della scheda -->
          <div class="tab-content">
            <!-- Tab: Dati Azienda -->
            <div v-if="currentTab === 'azienda'" class="tab-pane">
              <table>
                <tbody>
                  <tr>
                    <td><strong>ID:</strong></td>
                    <td>{{ selectedClient.id }}</td>
                  </tr>
                  <tr>
                    <td><strong>Stato:</strong></td>
                    <td>
                      {{
                        selectedClient.is_active === "si"
                          ? "Attivo"
                          : "Non Attivo"
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Ragione Sociale:</strong></td>
                    <td>{{ selectedClient.ragione_sociale }}</td>
                  </tr>
                  <tr>
                    <td><strong>Forma Giuridica:</strong></td>
                    <td>{{ selectedClient.forma_giuridica }}</td>
                  </tr>
                  <tr>
                    <td><strong>Partita IVA:</strong></td>
                    <td>{{ selectedClient.partita_iva }}</td>
                  </tr>
                  <tr>
                    <td><strong>Codice Fiscale:</strong></td>
                    <td>{{ selectedClient.codice_fiscale }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tab: Contatti -->
            <div v-if="currentTab === 'contatti'" class="tab-pane">
              <table>
                <tbody>
                  <tr>
                    <td><strong>Telefono:</strong></td>
                    <td>{{ selectedClient.telefono }}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{{ selectedClient.email }}</td>
                  </tr>
                  <tr>
                    <td><strong>Indirizzo:</strong></td>
                    <td>{{ selectedClient.indirizzo }}</td>
                  </tr>
                  <tr>
                    <td><strong>Città:</strong></td>
                    <td>{{ selectedClient.citta }}</td>
                  </tr>
                  <tr>
                    <td><strong>Provincia:</strong></td>
                    <td>{{ selectedClient.provincia }}</td>
                  </tr>
                  <tr>
                    <td><strong>CAP:</strong></td>
                    <td>{{ selectedClient.cap }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tab: Referente -->
            <div v-if="currentTab === 'referente'" class="tab-pane">
              <table>
                <tbody>
                  <tr>
                    <td><strong>Nome:</strong></td>
                    <td>{{ selectedClient.ref_nome }}</td>
                  </tr>
                  <tr>
                    <td><strong>Cognome:</strong></td>
                    <td>{{ selectedClient.ref_cognome }}</td>
                  </tr>
                  <tr>
                    <td><strong>Ruolo:</strong></td>
                    <td>{{ selectedClient.ref_ruolo }}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{{ selectedClient.ref_email }}</td>
                  </tr>
                  <tr>
                    <td><strong>Telefono:</strong></td>
                    <td>{{ selectedClient.ref_telefono }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modale modifica cliente -->
      <div v-if="isEditModalOpen" class="modal-overlay">
        <div class="modal-content">
          <h2>Modifica Cliente #{{ editableClient.id }}</h2>
          <!-- Debug per controllare i dati -->
          <form @submit.prevent="updateClient">
            <div class="form-grid">
              <!-- Colonna Sinistra -->
              <div class="form-column">
                <label>
                  Ragione Sociale:
                  <input
                    type="text"
                    v-model="editableClient.ragione_sociale"
                    required
                  />
                </label>
                <label>
                  Forma Giuridica:
                  <select v-model="editableClient.forma_giuridica_id" required>
                    <option disabled value="">
                      Seleziona una forma giuridica
                    </option>
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
                  Partita IVA:
                  <input
                    type="text"
                    v-model="editableClient.partita_iva"
                    required
                  />
                </label>
                <label>
                  Codice Fiscale:
                  <input
                    type="text"
                    v-model="editableClient.codice_fiscale"
                    required
                  />
                </label>
                <label>
                  Telefono:
                  <input type="text" v-model="editableClient.telefono" />
                </label>
                <label>
                  Email:
                  <input type="email" v-model="editableClient.email" />
                </label>
              </div>
              <!-- Colonna Centrale -->
              <div class="form-column">
                <label>
                  Indirizzo:
                  <input type="text" v-model="editableClient.indirizzo" />
                </label>
                <label>
                  Città:
                  <input type="text" v-model="editableClient.citta" />
                </label>
                <label>
                  Provincia:
                  <input type="text" v-model="editableClient.provincia" />
                </label>
                <label>
                  CAP:
                  <input type="text" v-model="editableClient.cap" />
                </label>
              </div>
              <!-- Colonna Destra -->
              <div class="form-column">
                <label>
                  Nome Referente:
                  <input type="text" v-model="editableClient.ref_nome" />
                </label>
                <label>
                  Cognome Referente:
                  <input type="text" v-model="editableClient.ref_cognome" />
                </label>
                <label>
                  Ruolo Referente:
                  <input type="text" v-model="editableClient.ref_ruolo" />
                </label>
                <label>
                  E-Mail Referente:
                  <input type="email" v-model="editableClient.ref_email" />
                </label>
                <label>
                  Telefono Referente:
                  <input type="text" v-model="editableClient.ref_telefono" />
                </label>
              </div>
            </div>
            <div class="modal-buttons">
              <button type="button" @click="closeEditModal">Annulla</button>
              <button type="submit">Salva Modifiche</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Storico appuntamenti -->
      <div class="section-container">
        <h3>Storico Appuntamenti</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Agente</th>
              <th>Operatore</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="clientAppointments.length === 0">
              <td colspan="6" class="no-results">
                Nessun appuntamento trovato
              </td>
            </tr>
            <tr
              v-else
              v-for="appointment in clientAppointments"
              :key="appointment.id"
            >
              <td>{{ appointment.id }}</td>
              <td>
                {{ new Date(appointment.date_start).toLocaleDateString() }}
              </td>
              <td>
                {{ appointment.agent_surname || "N/A" }}
                {{ appointment.agent_name || "" }}
              </td>
              <td>
                {{ appointment.operator_surname || "N/A" }}
                {{ appointment.operator_name || "" }}
              </td>
              <!-- <td>{{ capitalize(appointment.status) }}</td> -->
              <td>{{ appointment.status }}</td>
              <td>
                <button @click="openAppointmentModal(appointment)">
                  Dettagli
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="selectedAppointment" class="modal-overlay">
          <div class="modal-content">
            <h2>Dettagli Appuntamento #{{ selectedAppointment.id }}</h2>
            <table>
              <tbody>
                <tr>
                  <td><strong>Data Appuntamento:</strong></td>
                  <td>{{ formatDateTime(selectedAppointment.date_start) }}</td>
                </tr>

                <tr>
                  <td><strong>Agente:</strong></td>
                  <td>
                    {{ selectedAppointment.agent_surname || "N/D" }}
                    {{ selectedAppointment.agent_name || "" }}
                  </td>
                </tr>
                <tr>
                  <td><strong>Operatore:</strong></td>
                  <td>
                    {{ selectedAppointment.operator_surname || "N/D" }}
                    {{ selectedAppointment.operator_name || "" }}
                  </td>
                </tr>
                <tr>
                  <td><strong>Status:</strong></td>
                  <!-- <td>{{ capitalize(selectedAppointment.status) || "N/D" }}</td> -->
                  <td>{{ selectedAppointment.status || "N/D" }}</td>
                </tr>
                <tr>
                  <td><strong>Note:</strong></td>
                  <td>{{ selectedAppointment.notes || "Nessuna nota" }}</td>
                </tr>
              </tbody>
            </table>

            <div class="modal-buttons">
              <button @click="selectedAppointment = null">Chiudi</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Storico contratti -->
      <div class="section-container">
        <h3>Storico Contratti</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data Firma</th>
              <th>Vendor</th>
              <th>Agente</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="clientContracts.length === 0">
              <td colspan="6" class="no-results">Nessun contratto trovato</td>
            </tr>
            <tr v-else v-for="contract in clientContracts" :key="contract.id">
              <td>{{ contract.id }}</td>
              <td>{{ contract.signature_date }}</td>
              <td>{{ contract.vendor }}</td>
              <td>{{ contract.agent }}</td>
              <td>{{ contract.status }}</td>
              <td>
                <button @click="openContractModal(contract)">Dettagli</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!--  Modale dettagli contratto -->

        <div v-if="selectedContract" class="modal-overlay">
          <div class="modal-content">
            <h2>Dettagli Contratto #{{ selectedContract.id }}</h2>

            <table class="contract-details-table">
              <tbody>
                <tr>
                  <td><strong>Numero Contratto:</strong></td>
                  <td>{{ selectedContract.contract_number }}</td>
                </tr>
                <tr>
                  <td><strong>Data Firma:</strong></td>
                  <td>{{ selectedContract.signature_date }}</td>
                </tr>
                <tr>
                  <td><strong>Vendor:</strong></td>
                  <td>{{ selectedContract.vendor }}</td>
                </tr>
                <tr>
                  <td><strong>Agente:</strong></td>
                  <td>{{ selectedContract.agent }}</td>
                </tr>
                <tr>
                  <td><strong>Stato:</strong></td>
                  <td>{{ selectedContract.status }}</td>
                </tr>
                <tr>
                  <td><strong>Note:</strong></td>
                  <td>{{ selectedContract.notes || "Nessuna nota" }}</td>
                </tr>
                <tr>
                  <td><strong>Data Completamento:</strong></td>
                  <td>{{ selectedContract.completion_date || "Non disponibile" }}</td>
                </tr>
                <tr>
                  <td><strong>Prodotti:</strong></td>
                  <td>
                    <ul>
                      <li
                        v-for="(product, index) in selectedContract.products"
                        :key="index"
                      >
                        {{ product.name }} (x{{ product.quantity }})
                      </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="modal-buttons">
              <button @click="selectedContract = null">Chiudi</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { debounce } from "lodash";
//import "@/styles/clients-page.css";
import "@/styles/global.css";
import "@/styles/toast.css";

export default {
  name: "ClientsPage",

  data() {
    return {
      searchQuery: "",
      clients: [], // Lista di tutti i clienti
      filteredClients: [], // Risultati della ricerca
      selectedClient: null, // Cliente selezionato
      selectedContract: null,
      selectedAppointment: null,
      clientAppointments: [], // Storico appuntamenti
      clientContracts: [], // Storico contratti
      isEditModalOpen: false,
      editableClient: null, // Dati del cliente da modificare
      tabs: [
        { name: "azienda", label: "Dati Azienda" },
        { name: "contatti", label: "Contatti" },
        { name: "referente", label: "Referente" },
      ],
      currentTab: "azienda", // Tab predefinito
      legalForms: [], // Lista delle forme giuridiche
    };
  },
  computed: {
    limitedResults() {
      // Mostra massimo 10 risultati
      return this.filteredClients.slice(0, 10);
    },
  },

  methods: {
    openEditModal() {
      this.editableClient = { ...this.selectedClient }; // Copia i dati del cliente selezionato

      // Assicurati che `legalForms` sia caricato
      if (!this.legalForms.length) {
        this.fetchLegalForms().then(() => {});
      }

      this.isEditModalOpen = true; // Apri il modale
    },

    closeEditModal() {
      this.isEditModalOpen = false;
      this.editableClient = null;
    },

    openAppointmentModal(appointment) {
      this.selectedAppointment = appointment;
    },

    async updateClient() {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/clients/${this.editableClient.id}`,
          {
            ...this.editableClient,
            forma_giuridica: undefined,
          }
        );

        this.$toast.show("Cliente aggiornato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });

        // Ricarica il cliente aggiornato dal server
        await this.fetchClients();
        this.selectClient(
          this.clients.find((c) => c.id === this.editableClient.id)
        );
        this.closeEditModal();
      } catch (error) {
        console.error("Errore durante l'aggiornamento del cliente:", error);

        this.$toast.show("Errore durante l'aggiornamento del cliente.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    formatDateTime(date) {
      if (!date) return "N/A"; // Se non esiste la data
      const d = new Date(date);

      const dateString = d.toLocaleDateString("it-IT"); // Ottieni la data nel formato dd/MM/yyyy
      const timeString = d.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Formato 24 ore
      });
      return `${dateString} ${timeString}`; // Concatenazione della data e dell'ora
    },

    async editAppointment() {
      alert("Funziona! Aggiungi il codice per modificare l'appuntamento.");
    },

    async created() {
      try {
        await this.fetchLegalForms(); // Assicurati che sia completato prima
        await this.fetchClients(); // Ora esegui fetchClients
      } catch (error) {
        console.error("Errore durante il caricamento iniziale:", error);
      }
    },

    async fetchLegalForms() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/legal-forms`
        );

        if (Array.isArray(response.data)) {
          this.legalForms = response.data;
        } else {
          console.error(
            "Formato non valido delle forme giuridiche:",
            response.data
          );
          this.$toast.show("Errore nel caricamento delle forme giuridiche.", {
            position: "bottom-right",
            duration: 5000,
            type: "error",
          });
        }
      } catch (error) {
        console.error("Errore nel recupero delle forme giuridiche:", error);
        this.$toast.show("Errore nel caricamento delle forme giuridiche.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async fetchClients() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/clients`
        );

        if (Array.isArray(response.data)) {
          this.clients = response.data.map((client) => {
            // Usa la forma giuridica del backend se disponibile
            if (client.forma_giuridica) {
              return client; // Nessuna mappatura necessaria
            }

            // Altrimenti, mappa manualmente utilizzando legalForms
            const legalForm = this.legalForms.find(
              (form) =>
                parseInt(form.id) === parseInt(client.forma_giuridica_id)
            );

            return {
              ...client,
              forma_giuridica: legalForm ? legalForm.name : "Non specificata",
            };
          });
        } else {
          console.error(
            "Formato dei dati dei clienti non valido:",
            response.data
          );
        }
      } catch (error) {
        console.error("Errore durante il recupero dei clienti:", error);
      }
    },

    debouncedSearch: debounce(function () {
      if (this.searchQuery.length < 3) {
        this.filteredClients = []; // Mostra zero risultati se la query è troppo breve
        return;
      }
      this.filteredClients = this.clients.filter((client) =>
        [client.ragione_sociale, client.partita_iva, client.telefono]
          .join(" ")
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase())
      );
    }, 300),

    selectClient(client) {
      this.selectedClient = { ...client }; // Usa i dati originali del backend
      this.searchQuery = "";
      this.filteredClients = [];
      this.fetchClientAppointments(client.id);
      this.fetchClientContracts(client.id);
    },

    async fetchClientAppointments(clientId) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/appointments/client/${clientId}`
        );

        let appointments = [];

        // Se il backend restituisce un array vuoto o nullo, lo gestiamo elegantemente
        if (Array.isArray(response.data)) {
          // In caso di struttura annidata
          response.data.forEach((item) => {
            if (Array.isArray(item)) {
              appointments.push(...item);
            } else if (item) {
              appointments.push(item);
            }
          });
        } else if (response.data && typeof response.data === "object") {
          // Alcuni backend restituiscono oggetti vuoti invece di array
          appointments = [response.data];
        }

        this.clientAppointments = appointments;
      } catch (error) {
        console.error("Nessun appuntamento trovato:", error);
        this.$toast.show("Nessun appuntamento trovato.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
      }
    },

    async fetchClientContracts(clientId) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contracts/client/${clientId}`
        );

        if (Array.isArray(response.data)) {
          this.clientContracts = response.data.map((contract) => ({
            id: contract.id,
            contract_number: contract.contract_number,
            signature_date: contract.signature_date
              ? new Date(contract.signature_date).toLocaleDateString("it-IT")
              : "N/D",
            vendor: contract.vendor?.name || "N/D",
            agent: contract.agent?.name || "N/D",
            status: contract.status?.name || "N/D",
            notes: contract.notes,
            completion_date: contract.completion_date
              ? new Date(contract.completion_date).toLocaleDateString("it-IT")
              : null,
            products: contract.products || [],
          }));
        } else {
          this.clientContracts = [];
        }
      } catch (error) {
        console.error("Nessun contratto trovato.", error);
        this.clientContracts = [];
        this.$toast.show("Nessun contratto trovato.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
      }
    },

    openContractModal(contract) {
      this.selectedContract = contract;
    },

    resetSearch() {
      this.searchQuery = ""; // Resetta il campo di ricerca
      this.filteredClients = []; // Nasconde i risultati
      this.selectedClient = null; // Resetta il cliente selezionato
      this.clientAppointments = []; // Resetta lo storico appuntamenti
      this.clientContracts = []; // Resetta lo storico contratti
    },

  },

  mounted() {
    this.fetchClients();
    document.addEventListener("click", this.handleOutsideClick);
    document.addEventListener("keydown", this.handleKeyPress);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("keydown", this.handleKeyPress);
  },

  handleOutsideClick(event) {
    if (!this.$el.contains(event.target)) {
      this.filteredClients = []; // Nasconde i risultati
    }
  },

  handleKeyPress(event) {
    if (event.key === "Escape") {
      this.filteredClients = []; // Chiude l'overlay
    }
  },
};
</script>

<style scoped>
.no-results {
  text-align: center;
}
</style>
