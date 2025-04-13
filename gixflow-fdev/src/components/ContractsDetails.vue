<template>
  <div>
    <h1>Modifica Contratto #{{ contract.id }}</h1>

    <!-- Dati Cliente -->
    <section class="client-info">
      <div class="input-row">
        <label>Cliente:</label>
        <input type="text" :value="formattedClientName" disabled />
        <button @click="openClientModal" class="info-button">Dettagli</button>
      </div>

      <div class="input-row">
        <label>Agente:</label>
        <input type="text" v-model="contract.agent_name" disabled />
        <button @click="openAgentModal" class="info-button">Dettagli</button>
      </div>

      <div class="input-row">
        <label>Firmato il:</label>
        <flat-pickr
          v-model="contract.signature_date"
          :config="configDate"
          class="custom-datepicker"
          disabled
        />
      </div>

      <div class="input-row">
        <label>Creato il:</label>

        <flat-pickr
          v-model="contract.creation_date"
          :config="configDate"
          class="custom-datepicker"
          disabled
        />
      </div>
    </section>

    <!-- MODALE DETTAGLI CLIENTE -->
    <div v-if="isClientModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Dettagli Cliente</h2>
        <div class="form-grid">
          <div class="form-column">
            <label
              >Ragione Sociale:
              <input type="text" v-model="clientData.ragsoc" disabled
            /></label>
            <label
              >Partita IVA:
              <input type="text" v-model="clientData.partita_iva" disabled
            /></label>
            <label
              >Codice Fiscale:
              <input type="text" v-model="clientData.codice_fiscale" disabled
            /></label>
            <label
              >Telefono:
              <input type="text" v-model="clientData.telefono" disabled
            /></label>
            <label
              >Email: <input type="email" v-model="clientData.email" disabled
            /></label>
          </div>
          <div class="form-column">
            <label
              >Indirizzo:
              <input type="text" v-model="clientData.indirizzo" disabled
            /></label>
            <label
              >Città: <input type="text" v-model="clientData.city" disabled
            /></label>
            <label
              >Provincia:
              <input type="text" v-model="clientData.provincia" disabled
            /></label>
            <label
              >CAP: <input type="text" v-model="clientData.cap" disabled
            /></label>
          </div>
          <div class="form-column">
            <label
              >Nome Referente:
              <input type="text" v-model="clientData.ref_nome" disabled
            /></label>
            <label
              >Cognome Referente:
              <input type="text" v-model="clientData.ref_cognome" disabled
            /></label>
            <label
              >Ruolo Referente:
              <input type="text" v-model="clientData.ref_ruolo" disabled
            /></label>
            <label
              >Email Referente:
              <input type="email" v-model="clientData.ref_email" disabled
            /></label>
            <label
              >Telefono Referente:
              <input type="text" v-model="clientData.ref_telefono" disabled
            /></label>
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="closeClientModal">Chiudi</button>
        </div>
      </div>
    </div>

    <!-- MODALE DETTAGLI AGENTE -->
    <div v-if="isAgentModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Dettagli Agente</h2>
        <div class="form-grid">
          <div class="form-column">
            <label
              >Nome: <input type="text" v-model="agentData.nome" disabled
            /></label>
            <label
              >Cognome: <input type="text" v-model="agentData.cognome" disabled
            /></label>
            <label
              >Email: <input type="email" v-model="agentData.email" disabled
            /></label>
            <label
              >Telefono:
              <input type="text" v-model="agentData.telefono" disabled
            /></label>
          </div>
          <div class="form-column">
            <label
              >Indirizzo:
              <input type="text" v-model="agentData.indirizzo" disabled
            /></label>
            <label
              >Città: <input type="text" v-model="agentData.city" disabled
            /></label>
            <label
              >Provincia:
              <input type="text" v-model="agentData.provincia" disabled
            /></label>
            <label
              >CAP: <input type="text" v-model="agentData.cap" disabled
            /></label>
          </div>
          <div class="form-column">
            <label
              >Codice Fiscale:
              <input type="text" v-model="agentData.codice_fiscale" disabled
            /></label>
            <label
              >Partita IVA:
              <input type="text" v-model="agentData.partita_iva" disabled
            /></label>
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="closeAgentModal">Chiudi</button>
        </div>
      </div>
    </div>

    <section>
      <h3>Prodotti</h3>

      <!-- Bottone per aprire il modale -->
      <form @submit.prevent class="file-upload-form">
        <label class="file-input-label">
          <input type="button" @click="openProductModal" hidden />
          <i class="fas fa-box-open"></i> Aggiungi Prodotti
        </label>
      </form>

      <table class="contracts-table">
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
          <tr v-for="product in contractProducts" :key="product.product_id">
            <td>{{ product.vendor_name }}</td>
            <td>{{ product.product_code }}</td>
            <td>{{ product.product_name }}</td>
            <td>{{ product.product_description }}</td>
            <td>
              <input
                type="number"
                v-model="product.quantity"
                min="1"
                class="quantity-input"
              />
            </td>
            <td>
              <button
                class="in-grid-red"
                @click="removeProduct(product.product_id)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modale per aggiungere prodotti -->
      <div v-if="isProductModalOpen" class="modal-overlay">
        <div class="modal-content">
          <h2>Inserisci Prodotti per il Contratto</h2>
          <p>
            Seleziona un Vendor, scegli i prodotti associati ed inserisci la
            quantità.
          </p>

          <form @submit.prevent="addProductToContract">
            <label>
              Vendor:

              <input
                type="text"
                :value="vendorName"
                class="input-readonly"
                disabled
              />
            </label>

            <!-- Selezione Prodotto -->
            <label>
              Prodotto:
              <select v-model="selectedProduct" :disabled="!products.length">
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

            <!-- Quantità -->
            <label>
              Quantità:
              <input type="number" v-model.number="quantity" min="1" required />
            </label>

            <div class="modal-buttons">
              <button
                type="submit"
                :disabled="!selectedProduct || quantity < 1"
              >
                Aggiungi
              </button>
              <button type="button" @click="closeProductModal">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section>
      <div>
        <!-- Lista documenti già caricati -->
        <h3>Documenti esistenti</h3>

        <table class="contracts-table">
          <thead>
            <tr>
              <th>Nome File</th>
              <th>Dimensione</th>
              <th>Tipo Documento</th>
              <th>Data Upload</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in contractDocuments" :key="doc.id">
              <td>{{ doc.file_name }}</td>
              <td>{{ formatFileSize(doc.size) }}</td>
              <td>{{ doc.document_description }}</td>
              <td>{{ formatDate(doc.upload_date) }}</td>
              <td>
                <button class="in-grid-blue" @click="previewDocument(doc)">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="in-grid-red" @click="deleteDocument(doc.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Modal Preview PDF -->
        <div
          v-if="pdfPreviewUrl"
          class="modal-overlay"
          @click.self="pdfPreviewUrl = null"
        >
          <div class="modal-content pdf-modal">
            <button class="close-btn" @click="pdfPreviewUrl = null">×</button>
            <iframe
              :src="pdfPreviewUrl"
              width="100%"
              height="600px"
              style="border: none"
            ></iframe>
          </div>
        </div>

        <!-- Sezione Selezione File -->
        <form @submit.prevent class="file-upload-form">
          <label class="file-input-label">
            <input
              type="file"
              multiple
              @change="handleFileSelection"
              hidden
              required
            />
            <i class="fas fa-upload"></i> Aggiungi File
          </label>

          <label class="file-reset-label">
            <input type="button" @click="resetFileSelection" hidden />
            <i class="fas fa-trash"></i> Reset
          </label>

          <label
            class="file-upload-label"
            :class="{ 'disabled-button': !canUploadFiles }"
          >
            <input
              type="button"
              @click="uploadSelectedFiles"
              hidden
              :disabled="!canUploadFiles"
            />
            <i class="fas fa-upload"></i> Carica Documenti
          </label>
        </form>

        <!-- Lista file selezionati per l'upload -->
        <table class="contracts-table" v-if="selectedFiles.length">
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
                <select v-model="file.documentType" required>
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
                <button
                  @click="removeFile(index)"
                  class="cancel-contract-button"
                >
                  Rimuovi
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Stato Contratto -->
    <section>
      <h3>Stato Contratto</h3>
      <div class="status-container">
        <label>Stato Contratto:</label>
        <select v-model="contract.status_id">
          <option
            v-for="status in contractStatus"
            :key="status.id"
            :value="status.id"
          >
            {{ status.name }}
          </option>
        </select>
      </div>

      <!-- Mostra la Data completamento solo se lo stato è "Completato" -->
      <div class="completion-container" v-if="isCompleted">
        <label>Data Completamento:</label>

        <flat-pickr
          v-model="contract.completion_date"
          :config="configDate"
          class="custom-datepicker"
          required
        />

        <!-- TRICK -->
        <input
          type="text"
          v-model="contract.completion_date"
          :required="isCompleted"
          style="
            opacity: 0;
            height: 0;
            position: absolute;
            pointer-events: none;
          "
        />
      </div>
    </section>

    <!-- Note -->
    <section class="note-container">
      <h3>Note</h3>
      <textarea
        v-model="contract.notes"
        class="note-textarea"
        placeholder="Aggiungi eventuali note per il contratto..."
      ></textarea>
    </section>

    <!-- Pulsanti Azioni -->
    <section class="action-buttons">
      <form @submit.prevent class="file-upload-form">
        <label class="file-input-label">
          <input type="button" @click="saveContract" hidden />
          <i class="fas fa-save"></i> Salva Contratto
        </label>

        <label class="file-reset-label">
          <input type="button" @click="deleteContract" hidden />
          <i class="fas fa-eraser"></i> Elimina Contratto
        </label>

        <label class="file-upload-label">
          <input type="button" @click="goToContractList" hidden />
          <i class="fas fa-arrow-left"></i> Torna all'elenco contratti
        </label>
      </form>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/contracts-page.css";

import { ref } from "vue";
import FlatPickr from "vue-flatpickr-component";
//import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";
//import "flatpickr/dist/themes/dark.css";

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

    return { configDate, configDateTime };
  },
  data() {
    return {
      contract: {
        signature_date: null,
        creation_date: null,
        completion_date: null,
      },
      contractProducts: [],
      contractDocuments: [],
      contractStatus: [],
      vendors: [],
      products: [],
      selectedProduct: null,
      quantity: 1,
      isProductModalOpen: false,
      clientData: {},
      agentData: {},
      isClientModalOpen: false,
      isAgentModalOpen: false,
      selectedFiles: [],
      documentTemplates: [],
      pdfPreviewUrl: null,
    };
  },

  computed: {
    contractId() {
      return Number(this.$route.params.id); // Assicuriamoci che sia sempre un numero
    },
    canUploadFiles() {
      return (
        this.selectedFiles.length > 0 &&
        this.selectedFiles.every((file) => file.documentType)
      );
    },

    isCompleted() {
      const completedStatusIds = [2, 3, 4, 5]; // Lista di status che consideriamo "completati"
      return completedStatusIds.includes(this.contract.status_id);
    },

    vendorName() {
      if (this.contractProducts.length === 0) return "Vendor non disponibile";

      const firstVendor = this.contractProducts[0]?.vendor_name;
      return firstVendor || "Vendor non disponibile";
    },

    formattedClientName() {
      if (!this.contract.client_name) return "N/D"; // Se il nome è vuoto, mostra "N/D"

      return this.contract.forma_giuridica_name
        ? `${this.contract.client_name} - ${this.contract.forma_giuridica_name}`
        : this.contract.client_name;
    },
  },

  methods: {
    async fetchContract() {
      if (!this.contractId) {
        console.error("[ERRORE] ID contratto non valido:", this.contractId);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}`
        );

        if (!response.data || response.data.length === 0) {
          console.warn("Nessun contratto trovato!");
          this.contract = {};
          return;
        }

        const contractData = response.data;

        this.contract = {
          ...contractData,
          signature_date: contractData.signature_date
            ? new Date(contractData.signature_date)
            : null,
          creation_date: contractData.creation_date
            ? new Date(contractData.creation_date)
            : null,
          completion_date: contractData.completion_date
            ? new Date(contractData.completion_date)
            : null,
        };

        this.selectedVendor = contractData.vendor_id;
      } catch (error) {
        console.error("[ERRORE] Errore nel caricamento del contratto:", error);
      }
    },

    async fetchContractDetails() {
      if (!this.contractId) return;

      try {
        const [products, documents] = await Promise.all([
          axios.get(
            `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}/products-with-details`
          ),
          axios.get(
            `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}/documents`
          ),
        ]);

        this.contractProducts = products.data;
        this.contractDocuments = documents.data;
      } catch (error) {
        console.error("Errore nel caricamento dei dettagli:", error);
      }
    },

    async fetchContractStatus() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contract-status`
        );
        this.contractStatus = response.data;
      } catch (error) {
        console.error("Errore nel caricamento degli stati:", error);
      }
    },

    async fetchVendors() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/vendors`
        );
        this.vendors = response.data;
      } catch (error) {
        console.error("[DEBUG] Errore nel recupero dei vendor:", error);
      }
    },

    async fetchProductsByVendor() {
      const vendorName = this.contractProducts[0]?.vendor_name;
      const vendor = this.vendors.find((v) => v.name === vendorName);
      const vendorId = vendor?.id;

      if (!vendorId) {
        console.warn(
          "[DEBUG] Vendor non trovato nel contratto o vendor mancante."
        );
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/products?vendor_id=${vendorId}`
        );

        this.products = response.data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "Nessuna descrizione",
          code: p.code || "N/A",
        }));

        if (!this.products.length) {
          console.warn(
            `[DEBUG] Nessun prodotto trovato per vendor ID ${vendorId}`
          );
        }
      } catch (error) {
        console.error("[DEBUG] Errore nel recupero dei prodotti:", error);
        this.$toast.show("Errore nel caricamento dei prodotti.", {
          type: "error",
          position: "bottom-right",
        });
      }
    },

    async removeProduct(productId) {
      if (!this.contractId) return; // Controllo prima di eliminare il prodotto

      try {
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}/products/${productId}`
        );

        // Dopo la rimozione, ricarica l'elenco aggiornato dei prodotti
        await this.fetchContractDetails();
      } catch (error) {
        console.error("[DEBUG] Errore nella rimozione del prodotto:", error);
      }
    },

    async saveContract() {
      if (!this.contractId) {
        console.error("[ERRORE] ID contratto non valido:", this.contractId);
        this.$toast.show("Errore: ID contratto non valido.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      // 👇 Validazione manuale campo "completion_date" se stato è "completato"
      if (this.isCompleted && !this.contract.completion_date) {
        this.$toast.show("La data di completamento è obbligatoria.", {
          type: "error",
          position: "bottom-right",
        });
        return;
      }

      try {
        // Se "In lavorazione" (status_id = 1), la completion_date deve essere nulla
        if (this.contract.status_id === 1) {
          this.contract.completion_date = null;
        }

        // Converti tutte le date per il backend
        const payload = {
          ...this.contract,
          signature_date: this.formatDateForBackend(
            this.contract.signature_date
          ),
          creation_date: this.formatDateForBackend(this.contract.creation_date),
          completion_date: this.contract.completion_date
            ? this.formatDateForBackend(this.contract.completion_date)
            : null,
        };

        // 🛡️ Validazione firma (optional, solo se definita)
        if (
          this.isCompleted &&
          (!this.contract.signature_date || !payload.signature_date)
        ) {
          this.$toast.show("La data di firma è obbligatoria.", {
            type: "error",
            position: "bottom-right",
          });
          return;
        }

        // 🔄 Update contratto
        await axios.put(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}`,
          payload
        );

        // 🔁 Aggiorna stato appuntamento se necessario
        if (this.contract.appointment_id) {
          let newAppointmentStatus = null;

          switch (this.contract.status_id) {
            case 2:
              newAppointmentStatus = 3; // Completato → BO_OK
              break;
            case 3:
            case 4:
            case 5:
              newAppointmentStatus = 4; // KO Tecnico / Commerciale / Rinuncia → BO_KO
              break;
            default:
              console.warn(
                "Stato contratto non gestito:",
                this.contract.status_id
              );
          }

          if (newAppointmentStatus) {
            await axios.put(
              `${process.env.VUE_APP_API_URL}/appointments/${this.contract.appointment_id}/status`,
              { status_id: newAppointmentStatus }
            );
          }
        }

        // 🎉 Tutto ok
        this.$toast.show("Contratto aggiornato con successo!", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });

        this.$router.push("/contracts");
      } catch (error) {
        console.error("[ERRORE] Aggiornamento contratto fallito:", error);
        this.$toast.show("Errore nel salvataggio del contratto.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async addProductToContract() {
      if (!this.selectedProduct || this.quantity < 1) {
        this.$toast.show(
          "Seleziona un prodotto valido e una quantità maggiore di 0.",
          {
            type: "warning",
            position: "bottom-right",
          }
        );
        return;
      }

      const selected = this.products.find((p) => p.id === this.selectedProduct);

      if (!selected) {
        this.$toast.show(
          "Prodotto non valido o non appartiene al vendor selezionato.",
          {
            type: "error",
            position: "bottom-right",
          }
        );
        return;
      }

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}/products`,
          {
            product_id: this.selectedProduct,
            quantity: this.quantity,
          }
        );

        this.$toast.show("Prodotto aggiunto al contratto.", {
          type: "success",
          position: "bottom-right",
        });

        await this.fetchContractDetails(); // Aggiorna la lista prodotti
        this.closeProductModal();
      } catch (error) {
        console.error("[DEBUG] Errore nell'aggiunta del prodotto:", error);
        this.$toast.show("Errore durante l'aggiunta del prodotto.", {
          type: "error",
          position: "bottom-right",
        });
      }
    },

    async deleteContract() {
      if (!this.contractId) {
        console.error("[ERRORE] ID contratto non valido:", this.contractId);
        alert("Errore: ID contratto non valido.");
        return;
      }

      const conferma = confirm(
        "Sei sicuro di voler eliminare questo contratto?"
      );
      if (!conferma) return;

      try {
        // Recupera l'appointment_id PRIMA di eliminare il contratto
        const { appointment_id } = this.contract;

        // Step 1: Elimina il contratto
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}`
        );

        // Step 2: Se c'è un appuntamento associato, aggiorna lo stato a "BO Annullato" (id = 10)
        if (appointment_id) {
          await axios.put(
            `${process.env.VUE_APP_API_URL}/appointments/${appointment_id}/status`,
            { status_id: 10 }
          );
        } else {
          console.warn(
            "[DEBUG] Nessun appointment_id trovato, stato appuntamento non aggiornato."
          );
        }

        alert("Contratto eliminato con successo!");
        this.$router.push("/contracts");
      } catch (error) {
        console.error("[ERRORE] Eliminazione contratto fallita:", error);
        alert("Errore durante l'eliminazione del contratto.");
      }
    },

    async fetchClientDetails() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/clients/${this.contract.client_id}`
        );
        this.clientData = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei dettagli cliente:", error);
      }
    },

    async fetchAgentDetails() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users/${this.contract.agent_id}`
        );
        this.agentData = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei dettagli agente:", error);
      }
    },

    async fetchContractDocuments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}/documents`
        );
        this.contractDocuments = response.data;
      } catch (error) {
        console.error("Errore nel recupero dei documenti:", error);
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

    async uploadSelectedFiles() {
      if (!this.selectedFiles.length) return;

      const formData = new FormData();
      // eslint-disable-next-line
      this.selectedFiles.forEach((fileObj, index) => {
        formData.append("files", fileObj.file);
        formData.append("document_type_id[]", fileObj.documentType);
      });

      formData.append("contract_id", this.contractId);
      formData.append("client_id", this.contract.client_id);

      try {
        await axios.post(
          `${process.env.VUE_APP_API_URL}/contracts/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        this.selectedFiles = [];
        this.fetchContractDocuments();
        alert("Documenti caricati con successo!");
      } catch (error) {
        console.error(
          "[ERRORE] Caricamento documenti:",
          error.response?.data || error
        );
      }
    },

    async previewDocument(doc) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/documents/${doc.id}/presigned-url`
        );

        if (response.data?.url) {
          // ✅ APRI IN NUOVA TAB PER DEBUG PRIMA
          this.pdfPreviewUrl = response.data.url;
        } else {
          console.warn("⚠️ Nessuna URL ricevuta dal backend");
        }
      } catch (error) {
        console.error("❌ Errore preview documento:", error);
      }
    },

    async deleteDocument(docId) {
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/contracts/${this.contractId}/documents/${docId}`
        );
        this.fetchContractDocuments();
      } catch (error) {
        console.error("Errore nell'eliminazione del documento:", error);
      }
    },

    handleFileSelection(event) {
      const newFiles = Array.from(event.target.files);

      const existingFileNames = new Set(
        this.selectedFiles.map((file) => file.name)
      );

      newFiles.forEach((file) => {
        if (!existingFileNames.has(file.name)) {
          this.selectedFiles.push({
            file,
            name: file.name,
            size: file.size || file.file?.size || 0,
            documentType: "",
          });
        }
      });
    },

    resetFileSelection() {
      this.selectedFiles = [];
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },

    openProductModal() {
      this.isProductModalOpen = true;

      if (this.products.length === 0) {
        this.fetchProductsByVendor(); // 🔥 caricamento automatico
      }
    },

    closeProductModal() {
      this.isProductModalOpen = false;
      this.selectedVendor = null;
      this.selectedProduct = null;
      this.quantity = 1;
    },

    openClientModal() {
      this.fetchClientDetails();
      this.isClientModalOpen = true;
    },

    closeClientModal() {
      this.isClientModalOpen = false;
    },

    openAgentModal() {
      this.fetchAgentDetails();
      this.isAgentModalOpen = true;
    },

    closeAgentModal() {
      this.isAgentModalOpen = false;
    },

    formatFileSize(size) {
      return `${(size / 1024).toFixed(2)} KB`;
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("it-IT");
    },

    goToContractList() {
      this.$router.push("/contracts"); // Redirect manuale alla lista contratti
    },

    formatDateForBackend(date) {
      if (!date) return null;

      // Se è già un oggetto Date, usalo
      if (
        Object.prototype.toString.call(date) === "[object Date]" &&
        !isNaN(date)
      ) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }

      // Gestione stringa "gg/mm/yyyy"
      const parts = date.split("/");
      if (parts.length !== 3) {
        console.warn("⚠️ Data in formato non riconosciuto:", date);
        return null;
      }

      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },
  },

  watch: {
    contractId: {
      immediate: true,
      handler(newId) {
        if (!newId) return;
        this.fetchContract();
      },
    },
  },

  mounted() {
    this.fetchContract();
    this.fetchContractDetails();
    this.fetchContractStatus();
    this.fetchVendors();
    this.fetchDocumentTemplates();
  },
};
</script>

<style scoped></style>
