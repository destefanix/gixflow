<template>
  <div>
    <h1>Nuovo Contratto</h1>

    <!-- SEZIONE: Seleziona Appuntamento -->
    <section class="section-standard">
      <h3>
        Seleziona un appuntamento in stato positivo oppure cercalo tramite
        l'input
      </h3>
      <!-- Campo di ricerca -->
      <input
        type="text"
        v-model="search"
        placeholder="Cerca cliente o agente"
        @input="filterAppointments"
        :disabled="selectedAppointment !== null"
      />

      <!-- Tabella appuntamenti -->
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
            <th>Data e ora</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appointment in visibleAppointments" :key="appointment.id">
            <td>{{ appointment.id }}</td>
            <td>{{ appointment.client_name }}</td>
            <td>{{ appointment.telefono }}</td>
            <td>{{ appointment.indirizzo }}</td>
            <td>{{ appointment.city }}</td>
            <td>{{ appointment.provincia }}</td>
            <td>{{ appointment.cap }}</td>
            <td>{{ appointment.agent_name }}</td>
            <td>{{ appointment.operator_name }}</td>
            <td>{{ formatDateTime(appointment.date_start) }}</td>
            <td>{{ appointment.status_name }}</td>
            <td>
              <button
                v-if="selectedAppointment?.id !== appointment.id"
                @click="selectAppointment(appointment)"
              >
                Seleziona
              </button>

              <!-- Mostra il tasto "Annulla Contratto" solo per l'appuntamento selezionato -->
              <button
                v-if="
                  selectedAppointment?.id === appointment.id &&
                  temporaryContractId
                "
                @click="cancelContract"
                class="cancel-contract-button"
              >
                Annulla Contratto
              </button>
            </td>
          </tr>
          <tr v-if="visibleAppointments.length === 0">
            <td colspan="12">Nessun appuntamento trovato.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="isVendorModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h3>Seleziona il vendor per questo contratto</h3>

        <select v-model="vendorPreselected" required>
          <option disabled value="">Scegli un vendor</option>
          <option v-for="v in vendors" :value="v.id" :key="v.id">
            {{ v.name }}
          </option>
        </select>

        <div class="modal-buttons">
          <button
            @click="confirmVendorSelection"
            :disabled="!vendorPreselected"
          >
            Procedi
          </button>
          <button @click="cancelVendorSelection">Annulla</button>
        </div>
      </div>
    </div>

    <!-- SEZIONE: Completa anagrafica cliente -->
    <section class="section-step" v-if="selectedAppointment">
      <h3>Step #2 - Completa anagrafica cliente</h3>

      <!-- Bottone per aprire il modale -->
      <form @submit.prevent class="file-upload-form">
        <label class="file-input-label">
          <input type="button" @click="openEditModal" hidden />
          <i class="fas fa-list-ul"></i> Verifica Anagrafica
        </label>
      </form>

      <!-- Messaggi sull'anagrafica -->
      <p v-if="isAnagraficaCompleta" class="anagrafica-completa">
        L'anagrafica è completa! Verifica se apportare modifiche o procedi al
        prossimo passo.
      </p>
      <p v-else class="anagrafica-incompleta">
        Controlla o completa l'anagrafica per procedere al passaggio successivo.
      </p>

      <!-- Modale per modifica cliente -->

      <div v-if="isEditModalOpen && editableClient" class="modal-overlay">
        <div class="modal-content">
          <h2>Modifica Cliente #{{ editableClient.id }}</h2>
          <form @submit.prevent="updateClient">
            <div class="form-grid">
              <!-- Colonna Sinistra -->
              <div class="form-column">
                <label>
                  Ragione Sociale:
                  <input type="text" v-model="editableClient.ragsoc" required />
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
                  <input type="text" v-model="editableClient.city" />
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
              <button type="submit">Salva Modifiche</button>
              <button type="button" @click="closeEditModal">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- SEZIONE: Attributi contratto -->
    <section class="section-step" v-if="selectedAppointment">
      <h3>Step #3 - Inserisci prodotti venduti</h3>

      <div>
        <!-- Bottone per aprire il modale -->
        <form @submit.prevent class="file-upload-form">
          <label class="file-input-label">
            <input type="button" @click="openProductModal" hidden />
            <i class="fas fa-box-open"></i> Aggiungi Prodotti
          </label>
        </form>

        <!-- Modale per aggiungere prodotti -->
        <div v-if="isProductModalOpen" class="modal-overlay">
          <div class="modal-content">
            <h2>Inserisci Prodotti per il Contratto</h2>
            <p>
              Seleziona un Vendor, scegli i prodotti associati ed inserisci la
              quantità.
            </p>

            <form @submit.prevent="addProductToContract">
              <!-- VENDOR (bloccato, non modificabile) -->
              <label>
                Vendor:
                <input
                  type="text"
                  :value="
                    vendors.find((v) => v.id === selectedVendor)?.name ||
                    'Vendor selezionato'
                  "
                  disabled
                  class="input-readonly"
                />
              </label>

              <!-- PRODOTTO (selezionabile) -->
              <label>
                Prodotto:
                <select v-model="selectedProduct">
                  <option disabled value="">Seleziona un prodotto</option>
                  <option
                    v-for="product in products"
                    :key="product.id"
                    :value="product.id"
                  >
                    {{ product.name }}
                  </option>
                </select>
              </label>

              <!-- QUANTITÀ -->
              <label>
                Quantità:
                <input
                  type="number"
                  v-model.number="quantity"
                  min="1"
                  required
                />
              </label>

              <!-- AZIONI -->
              <div class="modal-buttons">
                <button
                  type="submit"
                  :disabled="!selectedProduct || quantity < 1"
                >
                  Aggiungi
                </button>
                <button type="button" @click="closeProductModal">
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Lista Prodotti Selezionati -->
      <table
        class="table"
        v-if="contractProducts.length || stagedProducts.length"
      >
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Codice</th>
            <th>Prodotto</th>
            <th>Descrizione</th>
            <th>Quantità</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in contractProducts"
            :key="`saved-${product.product_id}`"
          >
            <td>{{ product.vendor_name }}</td>
            <td>{{ product.code || "N/A" }}</td>
            <td>{{ product.product_name }}</td>
            <td>{{ product.description || "Nessuna descrizione" }}</td>
            <td>{{ product.quantity }}</td>
            <td>
              <button
                @click="removeSavedProduct(product.product_id)"
                class="cancel-contract-button"
              >
                Rimuovi
              </button>
            </td>
          </tr>

          <tr
            v-for="(product, index) in stagedProducts"
            :key="`staged-${index}`"
            class="staged"
          >
            <td>{{ product.vendor_name }}</td>
            <td>{{ product.code || "N/A" }}</td>
            <td>{{ product.product_name }}</td>
            <td>{{ product.description || "Nessuna descrizione" }}</td>
            <td>{{ product.quantity }}</td>
            <td>
              <button
                @click="removeStagedProduct(index)"
                class="cancel-contract-button"
              >
                Rimuovi
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SEZIONE: Carica Documenti -->
    <section class="section-step" v-if="selectedAppointment">
      <h3>Step #4 - Carica la documentazione</h3>

      <!-- Sezione Selezione File -->
      <form @submit.prevent class="file-upload-form">
        <!-- Bottone personalizzato per la selezione -->
        <label class="file-input-label">
          <input type="file" multiple @change="handleFileSelection" hidden />
          <i class="fas fa-upload"></i> Seleziona File
        </label>

        <!-- Bottone reset -->
        <label class="file-reset-label">
          <input type="button" @click="resetFileSelection" hidden />
          <i class="fas fa-eraser"></i> Reset
        </label>
      </form>

      <!-- Lista file selezionati -->
      <table class="table" v-if="selectedFiles.length">
        <thead>
          <tr>
            <th>Nome File</th>
            <th>Dimensione</th>
            <th>Tipo Documento</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(file, index) in selectedFiles" :key="index">
            <td>{{ file.name }}</td>
            <td>{{ formatFileSize(file.size) }}</td>
            <td>
              <select
                v-model="file.documentType"
                class="document-type-select"
                required
              >
                <option disabled value="">Seleziona Tipo</option>
                <option
                  v-for="type in documentTemplates"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.description }}
                </option>
              </select>
            </td>
            <td>
              <button @click="removeFile(index)" class="cancel-contract-button">
                Rimuovi
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SEZIONE: Prossimi Passaggi -->
    <section v-if="selectedAppointment">
      <h2>Azioni finali</h2>
      <p>
        Completa le informazioni mancanti del cliente, apri il riepilogo
        cliccando su "Conferma Contratto" o annulla l'operazione e torna alla
        lista degli appuntamenti in stato "Positivo".
      </p>

      <!-- Bottone per confermare il contratto -->
      <form @submit.prevent class="file-upload-form">
        <label
          class="file-input-label"
          :class="{ 'disabled-button': !confirmButtonEnabled }"
        >
          <input
            type="button"
            @click="openConfirmModal"
            hidden
            :disabled="!confirmButtonEnabled"
          />
          <i class="fas fa-check-circle"></i> Conferma Contratto
        </label>

        <label class="file-reset-label">
          <input type="button" @click="cancelContract" hidden />

          <i class="fas fa-ban"></i> Annulla
        </label>
      </form>

      <div v-if="isConfirmModalOpen" class="modal-overlay">
        <div class="modal-content">
          <!-- Intestazione -->
          <div class="modal-header">
            <h2>Riepilogo Contratto</h2>
            <p class="modal-subtitle">
              Controlla tutti i dettagli prima di confermare.
            </p>
          </div>

          <!-- Dati  -->
          <table class="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Agente</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ selectedAppointment.client_name }}</td>
                <td>{{ selectedAppointment.agent_name }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Prodotti Selezionati -->
          <section class="modal-section">
            <h3 class="modal-section-title">Prodotti Selezionati</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Quantità</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in contractProducts"
                  :key="`saved-${product.product_id}`"
                >
                  <td>{{ product.product_name }}</td>
                  <td>{{ product.quantity }}</td>
                </tr>
                <tr
                  v-for="(product, index) in stagedProducts"
                  :key="`staged-${index}`"
                >
                  <td>{{ product.product_name }}</td>
                  <td>{{ product.quantity }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Documenti Allegati -->
          <section class="modal-section">
            <h3 class="modal-section-title">Documenti Allegati</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Nome File</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in selectedFiles" :key="file.name">
                  <td>{{ file.name }}</td>
                  <td>{{ getDocumentTypeName(file.documentType) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Note Contratto -->
          <section class="modal-section">
            <h3 class="modal-section-title">Note Contratto</h3>
            <textarea
              v-model="contractNotes"
              placeholder="Inserisci eventuali note sul contratto..."
              class="contract-notes-input"
            ></textarea>

            <h3 class="modal-section-title">Data firma</h3>

            <flat-pickr
              v-model="contractSignatureDate"
              :config="configDate"
              class="custom-datepicker"
              placeholder="Inserisci la data di firma del contratto"
              required
            />

            <p v-if="!contractSignatureDate" class="error-message">
              Questo campo è obbligatorio!
            </p>
          </section>

          <!-- Azioni -->
          <div class="modal-buttons">
            <button @click="closeConfirmModal" class="input-button-blu">
              Torna a modificare
            </button>
            <button
              @click="confirmContract"
              class="input-button"
              :class="{ 'disabled-button': !canConfirmContract }"
              :disabled="!canConfirmContract"
            >
              Conferma Contratto
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/contracts-page.css";
//import "@/styles/gix-dashboard.css";

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

    return { configDate };
  },
  data() {
    return {
      appointments: [],
      filteredAppointments: [],
      search: "",
      selectedAppointment: null,
      legalForms: [],
      isEditModalOpen: false,
      editableClient: null,
      isConfirmModalOpen: false, // Controlla se il modale è aperto
      confirmButtonEnabled: false, // Stato del bottone

      vendors: [], // Lista dei vendor
      products: [], // Lista prodotti filtrati
      selectedVendor: "", // Vendor selezionato
      selectedProduct: "", // Prodotto selezionato
      quantity: 1, // Quantità default

      isProductModalOpen: false,
      contractProducts: [], // Prodotti selezionati per il contratto
      stagedProducts: [], // Lista temporanea dei prodotti
      isVendorModalOpen: false,
      vendorPreselected: null,

      isVendorSelectionOpen: false,

      uploadedFiles: [],
      vendorLocked: false,

      selectedFiles: [],
      documentTemplates: [], // Lista dei tipi di documenti dal DB
      contractNotes: "", // Variabile per le note del contratto
      contractSignatureDate: "",
    };
  },

  computed: {
    // Lista visibile: mostra solo l'appuntamento selezionato o i filtrati
    visibleAppointments() {
      return this.selectedAppointment
        ? [this.selectedAppointment] // Mostra solo quello selezionato
        : this.filteredAppointments; // Mostra tutti i filtrati
    },

    // Verifica se l'anagrafica è completa
    isAnagraficaCompleta() {
      if (!this.editableClient) return false;

      const campiObbligatori = [
        this.editableClient.ragsoc,
        this.editableClient.forma_giuridica_id,
        this.editableClient.partita_iva,
        this.editableClient.codice_fiscale,
        this.editableClient.indirizzo,
        this.editableClient.city,
        this.editableClient.provincia,
        this.editableClient.cap,
        this.editableClient.ref_nome,
        this.editableClient.ref_cognome,
        this.editableClient.ref_ruolo,
        this.editableClient.ref_email,
        this.editableClient.ref_telefono,
      ];

      // Verifica che tutti i campi obbligatori siano validi
      return campiObbligatori.every((campo) => {
        if (typeof campo === "string") {
          return campo.trim() !== ""; // Controlla che la stringa non sia vuota
        }
        return campo != null; // Controlla che il valore non sia `null` o `undefined`
      });
    },

    canConfirmContract() {
      return (
        !!this.contractSignatureDate &&
        (this.contractProducts.length > 0 || this.stagedProducts.length > 0) &&
        this.selectedFiles.length > 0 &&
        this.selectedFiles.every((file) => file.documentType)
      );
    },
  },

  watch: {
    editableClient: {
      handler() {
        this.updateConfirmButtonState();
      },
      deep: true,
    },
    contractProducts: {
      handler() {
        this.updateConfirmButtonState();
      },
      deep: true,
    },
    stagedProducts: {
      handler() {
        this.updateConfirmButtonState();
      },
      deep: true,
    },
    selectedFiles: {
      handler() {
        this.updateConfirmButtonState();
      },
      deep: true,
    },

    contractSignatureDate(newVal) {
      this.contractSignatureDate = newVal ? newVal.trim() : "";
      this.updateConfirmModalButtonState();
    },
  },

  methods: {
    async fetchAppointments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/appointments/positive`
        );

        this.appointments = response.data;
        this.filteredAppointments = response.data; // 🛠️ Assegna i dati anche a filteredAppointments!
      } catch (error) {
        console.error("[DEBUG] Errore nel recupero degli appuntamenti:", error);
        this.$toast.show("Errore nel caricamento degli appuntamenti.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async selectAppointment(appointment) {
      this.selectedAppointment = appointment;

      // Se il contratto NON esiste ancora, apri il modale vendor
      if (!appointment.contract_id) {
        this.isVendorModalOpen = true;
        this.vendorPreselected = null;
        return; // STOP: aspettiamo la conferma vendor
      }

      // Se il contratto già esiste, blocca il vendor e carica i prodotti
      this.selectedVendor = appointment.contract_vendor_id;
      this.vendorLocked = true;
      await this.fetchProductsByVendor();
    },

    async fetchLegalForms() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/legal-forms`
        );
        this.legalForms = response.data;
      } catch (error) {
        console.error("Errore nel recupero delle forme giuridiche:", error);
      }
    },

    // Recupera i dati del cliente
    async fetchClientDetails(clientId) {
      if (!clientId) {
        console.error("ID cliente non fornito.");
        this.$toast.show("Impossibile recuperare i dati del cliente.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/clients/${clientId}`
        );
        this.editableClient = { ...response.data }; // Aggiorna i dati
      } catch (error) {
        console.error(
          "Errore durante il recupero dei dati del cliente:",
          error
        );
        this.$toast.show("Errore durante il recupero dei dati del cliente.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async fetchDocuments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contracts/${this.selectedAppointment.contract_id}/documents`
        );

        this.uploadedFiles = response.data.map((doc) => doc.file_path);
      } catch (error) {
        console.error(
          "[DEBUG] Errore durante il recupero dei documenti:",
          error.response || error
        );
        this.$toast.show("Errore durante il recupero dei documenti.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async uploadFile() {
      if (!this.file) {
        alert("Seleziona un file prima di caricare.");
        return;
      }

      const formData = new FormData();
      formData.append("file", this.file);
      formData.append("client_id", this.selectedAppointment.client_id);
      formData.append("contract_id", this.selectedAppointment.contract_id);

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/contracts/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (response.data.fileUrl) {
          this.uploadedFiles.push(response.data.fileUrl);
          alert("File caricato con successo!");
        } else {
          console.error(
            "[DEBUG] Risposta del server senza fileUrl:",
            response.data
          );
          alert("Errore: fileUrl non presente nella risposta.");
        }
      } catch (error) {
        console.error(
          "[DEBUG] Errore durante il caricamento del file:",
          error.response || error
        );
        alert("Errore durante il caricamento del file.");
      }
    },

    // Aggiorna i dati del cliente
    async updateClient() {
      if (!this.editableClient.ragsoc) {
        return;
      }

      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/clients/${this.editableClient.id}`,
          this.editableClient
        );

        //alert("Dati cliente aggiornati con successo!");
        this.$toast.show("Dati cliente aggiornati con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
        this.closeEditModal();
      } catch (error) {
        console.error("Errore durante l'aggiornamento del cliente:", error);
        // alert("Errore durante l'aggiornamento del cliente.");
        this.$toast.show("Errore durante l'aggiornamento del cliente.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    // Recupera i vendor disponibili

    async fetchVendors() {
      try {
        // Effettua la richiesta all'endpoint corretto
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/vendors`
        );

        // Salva i dati direttamente
        this.vendors = response.data;

        // Debug: verifica i dati salvati
      } catch (error) {
        // Debug avanzato sugli errori
        console.error("[DEBUG] Errore nel recupero dei vendor:", error);
        if (error.response) {
          console.error("[DEBUG] Status Code:", error.response.status);
          console.error("[DEBUG] Response Data:", error.response.data);
        }
        alert("Errore nel recupero dei vendor.");
      }
    },

    async fetchProductsByVendor() {
      if (!this.selectedVendor) {
        console.warn(
          "[DEBUG] Nessun vendor selezionato. Interrompo la richiesta."
        );
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/products`,
          { params: { vendor_id: this.selectedVendor } }
        );

        // Assicuriamoci che ogni prodotto abbia description e code
        this.products = response.data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "Nessuna descrizione",
          code: p.code || "N/A",
        }));
      } catch (error) {
        console.error("[DEBUG] Errore nel recupero dei prodotti:", error);
        alert("Errore nel recupero dei prodotti.");
      }
    },

    // Recupera i prodotti in base al vendor selezionato
    async fetchProducts() {
      if (!this.selectedVendor) return;

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/products?vendor_id=${this.selectedVendor}`
        );
        this.products = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei prodotti:", error);
        alert("Errore nel caricamento dei prodotti.");
      }
    },

    async fetchDocumentTemplates() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/document-types`
        );
        this.documentTemplates = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei tipi di documenti:", error);
      }
    },

    // Aggiungi un prodotto al contratto
    async addProductToContract() {
      if (!this.selectedProduct || this.quantity < 1) {
        this.$toast.show("Seleziona un prodotto valido con quantità > 0.", {
          position: "bottom-right",
          type: "warning",
        });
        return;
      }

      const selectedProductData = this.products.find(
        (p) => p.id === this.selectedProduct
      );

      if (!selectedProductData) {
        this.$toast.show("Prodotto non trovato.", {
          position: "bottom-right",
          type: "warning",
        });
        return;
      }

      // 👇 QUI AGGIORNA IL CONTRATTO TEMPORANEO COL VENDOR
      if (this.selectedAppointment?.contract_id && this.selectedVendor) {
        try {
          await axios.put(
            `${process.env.VUE_APP_API_URL}/contracts/${this.selectedAppointment.contract_id}`,
            {
              client_id: this.selectedAppointment.client_id,
              agent_id: this.selectedAppointment.agent_id,
              status_id: 1,
              notes: this.contractNotes || "",
              contract_vendor_id: this.selectedVendor,
            }
          );

          // 🔐 Blocca il vendor dopo il primo salvataggio
          this.vendorLocked = true;
          
        } catch (error) {
          console.error(
            "Errore durante aggiornamento contract_vendor_id:",
            error
          );
          this.$toast.show("Errore nel salvataggio del vendor nel contratto.", {
            position: "bottom-right",
            type: "error",
          });
          return;
        }
      }

      const newProduct = {
        vendor_id: this.selectedVendor,
        vendor_name:
          this.vendors.find((v) => v.id === this.selectedVendor)?.name ||
          "Sconosciuto",
        product_id: selectedProductData.id,
        product_name: selectedProductData.name,
        description: selectedProductData.description,
        code: selectedProductData.code,
        quantity: this.quantity,
        isNew: true,
      };

      this.stagedProducts.push(newProduct);
      this.closeProductModal();

      this.$toast.show("Prodotto aggiunto alla lista temporanea.", {
        position: "bottom-right",
        type: "default",
      });
    },

    // Rimuovi un prodotto dalla lista
    async removeProduct(productId) {
      const contractId = this.selectedAppointment?.contract_id;
      const url = `${process.env.VUE_APP_API_URL}/contracts/${contractId}/products/${productId}`;

      try {
        // eslint-disable-next-line
        const response = await axios.delete(url);

        this.contractProducts = this.contractProducts.filter(
          (p) => Number(p.product_id) !== Number(productId)
        );

        this.$toast.show("Prodotto rimosso con successo!", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
      } catch (error) {
        console.error("[DEBUG] Errore nella rimozione del prodotto:", error);
        if (error.response) {
          console.error("[DEBUG] Status Code:", error.response.status);
          console.error("[DEBUG] Response Data:", error.response.data);
        }
        this.$toast.show("Errore nella rimozione del prodotto.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    // Helper per creare un contratto temporaneo
    async createTemporaryContract(appointment) {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/contracts`,
          {
            client_id: appointment.client_id,
            appointment_id: appointment.id,
            agent_id: appointment.agent_id,
            status_id: 1,
            temporary: true, // Contratto temporaneo
          }
        );

        // Aggiorna lo stato del contratto temporaneo
        this.selectedAppointment = {
          ...appointment,
          contract_id: response.data.contract_id,
        };
        this.temporaryContractId = response.data.contract_id; // Salva l'ID
        this.$toast.show("Creato contratto temporaneo", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });

      } catch (error) {
        console.error(
          "[DEBUG] Errore durante la creazione del contratto:",
          error
        );
        alert("Errore durante la creazione del contratto.");
      }
    },

    async confirmContract() {
      if (!this.selectedAppointment?.contract_id) {
        console.error("[ERRORE] Nessun contratto associato all'appuntamento!");
        this.$toast.show("Errore: Nessun contratto selezionato.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      const contractId = this.selectedAppointment.contract_id;
      const appointment_id = this.selectedAppointment?.id;
      const formattedDate = this.formatDateToISOString(
        this.contractSignatureDate
      );
      if (!formattedDate) {
        this.$toast.show("⚠️ Data firma non valida!", {
          position: "bottom-right",
          type: "error",
        });
        return;
      }

      try {
        // Passo 1: Confermare il contratto nel DB (rimuovere `temporary`)
        await axios.put(
          `${process.env.VUE_APP_API_URL}/contracts/${contractId}/confirm`
        );

        await axios.put(
          `${process.env.VUE_APP_API_URL}/contracts/${contractId}/confirm`,
          {
            notes: this.contractNotes,
            signature_date: formattedDate,
          }
        );

        // Passo 2: Salvare i prodotti nel contratto
        if (this.stagedProducts.length > 0) {
          const productRequests = this.stagedProducts.map((product) =>
            axios.post(
              `${process.env.VUE_APP_API_URL}/contracts/${contractId}/products`,
              {
                product_id: product.product_id,
                quantity: product.quantity,
              }
            )
          );
          await Promise.all(productRequests);
        }

        // Passo 3: Caricare i documenti (corretto l'uso di "files")
        if (this.selectedFiles.length > 0) {
          const formData = new FormData();

          this.selectedFiles.forEach((fileObj) => {
            formData.append("files", fileObj.file); // Cambiato da "file" a "files"
            formData.append("document_type_id", fileObj.documentType);
          });

          formData.append(
            "client_id",
            String(this.selectedAppointment.client_id)
          );
          formData.append(
            "contract_id",
            String(this.selectedAppointment.contract_id)
          );

          /*for (let pair of formData.entries()) {
          } */

          await axios.post(
            `${process.env.VUE_APP_API_URL}/contracts/upload`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }

        // Passo 4: Segna il contratto come definitivo e chiudi il modale
        this.selectedAppointment.temporary = false;
        this.temporaryContractId = null;
        this.isConfirmModalOpen = false;

        // Passo 5: Aggiorna lo stato dell'appuntamento a "BO Pending" (id = 2)
        if (appointment_id) {
          // Controlliamo che ci sia effettivamente un appuntamento
          await axios.put(
            `${process.env.VUE_APP_API_URL}/appointments/${appointment_id}/status`,
            {
              status_id: 2,
            }
          );
        } else {
          console.warn(
            "[DEBUG] Nessun appointment_id trovato, stato appuntamento non aggiornato."
          );
        }

        // Passo 6: Ricaricare la lista degli appuntamenti aggiornati
        await this.fetchAppointments(); // Richiama la funzione per aggiornare la lista

        // Reset dello stato PRIMA del redirect
        this.clearContractState();

        // Passo 5: Redirect alla pagina di nuovi contratti
        this.$router.push("/contracts/new");

        this.$toast.show("Contratto confermato con successo!", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
      } catch (error) {
        console.error("[DEBUG] Errore nella conferma del contratto:", error);
        this.$toast.show("Errore nella conferma del contratto.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async confirmVendorSelection() {
      this.isVendorModalOpen = false;

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/contracts`,
          {
            client_id: this.selectedAppointment.client_id,
            appointment_id: this.selectedAppointment.id,
            agent_id: this.selectedAppointment.agent_id,
            status_id: 1,
            temporary: true,
            contract_vendor_id: this.vendorPreselected, // ORA LO MANDI
          }
        );

        this.selectedAppointment = {
          ...this.selectedAppointment,
          contract_id: response.data.contract_id,
        };
        this.temporaryContractId = response.data.contract_id;
        this.selectedVendor = this.vendorPreselected; // blocca anche lato UI

        this.$toast.show("Contratto temporaneo creato!", {
          position: "bottom-right",
          type: "success",
        });
        this.$toast.show("Vendor selezionato per questo contratto.", {
            position: "bottom-right",
            type: "info",
          });
      } catch (error) {
        console.error("[DEBUG] Errore creazione contratto:", error);
        this.$toast.show("Errore nella creazione del contratto.", {
          position: "bottom-right",
          type: "error",
        });
      }
    },

    async cancelContract() {
      if (!this.temporaryContractId) {
        console.warn("[DEBUG] Nessun contratto temporaneo da annullare.");
        return;
      }

      try {
        // Elimina il contratto temporaneo
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/contracts/${this.temporaryContractId}`
        );

        // Reset dello stato locale
        this.clearProducts();
        this.selectedFiles = [];
        this.temporaryContractId = null;
        this.selectedAppointment = null;

        // Ricarica la lista appuntamenti aggiornata
        await this.fetchAppointments();

        // Notifica all'utente
        this.$toast.show("Contratto temporaneo annullato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "default",
        });
      } catch (error) {
        console.error("[DEBUG] Errore annullamento contratto:", error);
        this.$toast.show("Errore nell'annullamento del contratto.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    // Filtra gli appuntamenti per ricerca
    filterAppointments() {
      const searchLower = this.search.toLowerCase();
      this.filteredAppointments = this.appointments.filter(
        (appt) =>
          appt.client_name.toLowerCase().includes(searchLower) ||
          appt.agent_name.toLowerCase().includes(searchLower)
      );
    },

    // Reset della selezione
    async resetAppointments() {
      if (this.temporaryContractId) {
        await this.cancelContract();
      }
      this.clearSelectionState();
    },

    // Funzione helper per resettare lo stato della selezione
    clearSelectionState() {
      this.selectedAppointment = null; // Annulla selezione
      this.temporaryContractId = null; // Resetta il contratto temporaneo
      this.filteredAppointments = this.appointments; // Ripristina lista
      this.search = ""; // Pulisce il campo di ricerca
      this.contractProducts = [];
      this.$forceUpdate();
    },

    // Formatta le date
    formatDate(date) {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(date).toLocaleDateString("it-IT", options);
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

    formatDateToISOString(date) {
      if (!date) return null;

      if (
        Object.prototype.toString.call(date) === "[object Date]" &&
        !isNaN(date)
      ) {
        return date.toISOString();
      }

      // Se è stringa "gg/mm/yyyy"
      const parts = date.split("/");
      if (parts.length !== 3) {
        console.warn("⚠️ Data in formato non valido:", date);
        return null;
      }

      const [day, month, year] = parts;
      const isoDate = new Date(`${year}-${month}-${day}T00:00:00Z`);

      if (isNaN(isoDate)) {
        console.warn("⚠️ Errore nel parsing ISO:", isoDate);
        return null;
      }

      return isoDate.toISOString();
    },

    // Gestione del modale

    openEditModal() {
      if (this.selectedAppointment && this.selectedAppointment.client_id) {
        this.fetchClientDetails(this.selectedAppointment.client_id); // Aggiorna i dati del cliente
        this.isEditModalOpen = true; // Apri il modale
      } else {
        alert("Errore: Nessun cliente selezionato.");
        this.$toast.show("Nessun cliente selezionato.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    closeEditModal() {
      this.isEditModalOpen = false;
      if (this.isAnagraficaCompleta) {
        //alert("L'anagrafica è completa, puoi procedere.");
        this.$toast.show(
          "Anagrafica completa. Puoi procedere allo step successivo.",
          {
            position: "bottom-right",
            duration: 5000,
            type: "default",
          }
        );
      } else {
        //alert("L'anagrafica è ancora incompleta. Completala per procedere.");
        this.$toast.show("Anagrafica incompleta.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async openProductModal() {
      this.isProductModalOpen = true;

      // Se i prodotti non sono ancora stati caricati, caricali ORA
      if (this.selectedVendor && !this.products.length) {
        await this.fetchProductsByVendor();
      }
    },

    onVendorSelected() {
      if (!this.vendorLocked && this.selectedVendor) {
        this.fetchProductsByVendor(); // 🔄 carica i prodotti
      }
    },

    // Chiudi il modale
    closeProductModal() {
      this.isProductModalOpen = false;
      this.resetProductForm();
    },

    // Reset form prodotti
    resetProductForm() {
      this.selectedProduct = "";
      this.products = [];
      this.quantity = 1;
    },

    removeStagedProduct(index) {
      this.stagedProducts.splice(index, 1);
      this.$toast.show("Prodotto rimosso dalla lista temporanea.", {
        position: "bottom-right",
        duration: 5000,
        type: "default",
      });
    },

    clearProducts() {
      this.stagedProducts = [];
      this.contractProducts = [];
    },

    // Seleziona i file senza caricarli immediatamente
    handleFileSelection(event) {
      const files = Array.from(event.target.files).map((file) => ({
        file, // Mantiene il File originale
        name: file.name,
        size: file.size,
        documentType: "", // Imposta documentType inizialmente vuoto
      }));

      this.selectedFiles = [...this.selectedFiles, ...files];
    },

    // Rimuove un file dalla lista prima dell'upload
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },

    // Reset della selezione file
    resetFileSelection() {
      this.selectedFiles = [];
    },

    // Formatta la dimensione del file in KB o MB
    formatFileSize(size) {
      return size < 1024 * 1024
        ? `${(size / 1024).toFixed(1)} KB`
        : `${(size / (1024 * 1024)).toFixed(1)} MB`;
    },

    openConfirmModal() {
      this.isConfirmModalOpen = true;
    },

    closeConfirmModal() {
      this.isConfirmModalOpen = false;
    },

    updateConfirmButtonState() {
      this.confirmButtonEnabled =
        this.isAnagraficaCompleta &&
        (this.contractProducts.length > 0 || this.stagedProducts.length > 0) &&
        this.selectedFiles.length > 0 &&
        this.selectedFiles.every((file) => file.documentType);
    },

    updateConfirmModalButtonState() {
      this.$nextTick(() => {
        this.confirmButtonEnabled =
          !!this.contractSignatureDate.trim() && // Deve essere compilata
          (this.contractProducts.length > 0 ||
            this.stagedProducts.length > 0) &&
          this.selectedFiles.length > 0 &&
          this.selectedFiles.every((file) => file.documentType);
      });
    },

    clearContractState() {
      this.selectedAppointment = null;
      this.temporaryContractId = null;
      this.stagedProducts = [];
      this.contractProducts = [];
      this.selectedFiles = [];
      this.isConfirmModalOpen = false;
    },

    // Restituisce il nome del tipo di documento dato un ID
    getDocumentTypeName(documentTypeId) {
      const docType = this.documentTemplates.find(
        (type) => type.id === documentTypeId
      );
      return docType ? docType.description : "Sconosciuto";
    },

    handleSignatureDateChange(event) {
      this.contractSignatureDate = event.target.value || "";
    },
  },

  mounted() {
    this.fetchAppointments();
    this.fetchLegalForms();
    this.fetchVendors();
    this.fetchDocumentTemplates();

    window.addEventListener("beforeunload", this.cancelContract);
    this.$router.beforeEach((to, from, next) => {
      this.cancelContract();
      next();
    });
  },

  beforeUnmount() {
    window.removeEventListener("beforeunload", this.cancelContract);
  },
};
</script>

<style scoped></style>
