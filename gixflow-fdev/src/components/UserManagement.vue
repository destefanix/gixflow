<template>
  <div class="user-page">
    <div class="header">
      <h1>Gestione Utenti</h1>
      <div class="actions">
        <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportToCSV">CSV</button>
      </div>
    </div>

    <!-- Filtri per la ricerca -->
    <div class="filters">
      <label>
        Ruolo:
        <select v-model="filters.role">
          <option value="">Tutti</option>
          <option v-for="role in roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
      </label>
      <label>
        Attivo:
        <select v-model="filters.is_active">
          <option value="">Tutti</option>
          <option :value="true">Sì</option>
          <option :value="false">No</option>
        </select>
      </label>
      <label>
        Nome/Cognome:
        <input type="text" v-model="filters.name" placeholder="Cerca..." />
      </label>
      <button @click="applyFilters">Applica Filtri</button>
      <button @click="resetFilters">Reset</button>
    </div>

    <!-- Tabella degli utenti -->
    <table class="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cognome</th>
          <th>Nome</th>
          <th>Username</th>
          <th>Email</th>
          <th>Ruolo</th>
          <th>Codice Fiscale</th>
          <th>Sede</th>
          <th>Utente Asterisk</th>
          <th>Attivo</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in paginatedUsers" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.cognome || "" }}</td>
          <td>{{ user.nome || "" }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.email || "" }}</td>
          <td>{{ user.role_name || "" }}</td>
          <td>{{ user.codice_fiscale || "" }}</td>
          <td>{{ user.location_name }}</td>
          <td>{{ user.ast_user || "" }}</td>
          <td>{{ user.is_active ? "Sì" : "No" }}</td>
          <td>
            <button @click="openEditModal(user)">Modifica</button>
            <button @click="deleteUser(user.id)">Elimina</button>
          </td>
        </tr>
        <tr v-if="filteredUsers.length === 0">
          <td colspan="11">Nessun utente trovato.</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        Precedente
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
        Successivo
      </button>
    </div>

    <!-- Modale di modifica utente -->

    <!-- Modale di modifica utente -->
    <div v-if="isEditModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Modifica Utente</h2>
        <form @submit.prevent="updateUser">
          <div class="form-grid">
            <!-- COLONNA 1 - INFORMAZIONI BASE -->
            <fieldset>
              <legend>Informazioni Personali</legend>
              <div class="form-column">
                <label
                  >Nome:
                  <input type="text" v-model="selectedUser.nome" required
                /></label>
                <label
                  >Cognome:
                  <input type="text" v-model="selectedUser.cognome" required
                /></label>
                <label
                  >Email:
                  <input type="email" v-model="selectedUser.email" required
                /></label>
                <label
                  >Telefono:
                  <input type="text" v-model="selectedUser.telefono" required
                /></label>
                <label
                  >Codice Fiscale:
                  <input
                    type="text"
                    v-model="selectedUser.codice_fiscale"
                    required
                /></label>
                <label
                  >Partita IVA:
                  <input type="text" v-model="selectedUser.partita_iva"
                /></label>
              </div>
            </fieldset>

            <!-- COLONNA 2 - INDIRIZZO E LOGIN -->
            <fieldset>
              <legend>Dati di Accesso</legend>
              <div class="form-column">
                <label
                  >Indirizzo:
                  <input type="text" v-model="selectedUser.indirizzo" required
                /></label>
                <label
                  >Città:
                  <input type="text" v-model="selectedUser.city" required
                /></label>
                <label
                  >Provincia:
                  <input type="text" v-model="selectedUser.provincia" required
                /></label>
                <label
                  >CAP: <input type="text" v-model="selectedUser.cap" required
                /></label>
                <label
                  >Username:
                  <input type="text" v-model="selectedUser.username" required
                /></label>
                <label
                  >Password:
                  <input
                    type="password"
                    v-model="selectedUser.password"
                    placeholder="Lascia vuoto per non cambiare"
                /></label>
              </div>
            </fieldset>

            <!-- COLONNA 3 - DETTAGLI UTENTE -->
            <fieldset>
              <legend>Dettagli</legend>
              <div class="form-column">
                <label
                  >Ruolo:
                  <select
                    v-model="selectedUser.role_id"
                    @change="updateAsteriskField"
                    required
                  >
                    <option
                      v-for="role in roles"
                      :key="role.id"
                      :value="role.id"
                    >
                      {{ role.name }}
                    </option>
                  </select>
                </label>

                <label
                  >Location:
                  <select v-model="selectedUser.location_id">
                    <option
                      v-for="location in locations"
                      :key="location.id"
                      :value="location.id"
                    >
                      {{ location.location }}
                    </option>
                  </select>
                </label>

                <label
                  >Paga Oraria:
                  <select v-model="selectedUser.hourly_payment_id">
                    <option
                      v-for="payment in hourlyPayments"
                      :key="payment.id"
                      :value="payment.id"
                    >
                      {{ payment.description }} - €{{ payment.payment }}
                    </option>
                  </select>
                </label>

                <label
                  >Utente Asterisk:
                  <input
                    type="text"
                    v-model="selectedUser.ast_user"
                    :disabled="!isOperatorSelected"
                  />
                </label>

                <label
                  >Attivo:
                  <select v-model="selectedUser.is_active" required>
                    <option :value="true">Sì</option>
                    <option :value="false">No</option>
                  </select>
                </label>
              </div>
            </fieldset>
          </div>

          <div class="modal-buttons">
            <button type="button" @click="closeEditModal">Annulla</button>
            <button type="submit">Salva Modifiche</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modale di creazione utente -->
    <div v-if="isCreateModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Aggiungi Nuovo Utente</h2>
        <form @submit.prevent="createUser">
          <div class="form-grid">
            <!-- COLONNA 1 - INFORMAZIONI BASE -->
            <fieldset>
              <legend>Informazioni Personali</legend>
              <div class="form-column">
                <label
                  >Nome: <input type="text" v-model="newUser.nome" required
                /></label>
                <label
                  >Cognome:
                  <input type="text" v-model="newUser.cognome" required
                /></label>
                <label
                  >Email: <input type="email" v-model="newUser.email" required
                /></label>
                <label
                  >Telefono:
                  <input type="text" v-model="newUser.telefono" required
                /></label>
                <label
                  >Codice Fiscale:
                  <input type="text" v-model="newUser.codice_fiscale" required
                /></label>
                <label
                  >Partita IVA:
                  <input type="text" v-model="newUser.partita_iva"
                /></label>
              </div>
            </fieldset>

            <!-- COLONNA 2 - INDIRIZZO E LOGIN -->
            <fieldset>
              <legend>Dati di Accesso</legend>
              <div class="form-column">
                <label
                  >Indirizzo:
                  <input type="text" v-model="newUser.indirizzo" required
                /></label>
                <label
                  >Città: <input type="text" v-model="newUser.city" required
                /></label>
                <label
                  >Provincia:
                  <input type="text" v-model="newUser.provincia" required
                /></label>
                <label
                  >CAP: <input type="text" v-model="newUser.cap" required
                /></label>
                <label
                  >Username:
                  <input type="text" v-model="newUser.username" required
                /></label>
                <label
                  >Password:
                  <input type="password" v-model="newUser.password" required
                /></label>
              </div>
            </fieldset>

            <!-- COLONNA 3 - DETTAGLI UTENTE -->
            <fieldset>
              <legend>Dettagli</legend>
              <div class="form-column">
                <label
                  >Ruolo:
                  <select
                    v-model="newUser.role_id"
                    @change="updateAsteriskField"
                    required
                  >
                    <option
                      v-for="role in roles"
                      :key="role.id"
                      :value="role.id"
                    >
                      {{ role.name }}
                    </option>
                  </select>
                </label>

                <label
                  >Location:
                  <select v-model="newUser.location_id">
                    <option
                      v-for="location in locations"
                      :key="location.id"
                      :value="location.id"
                    >
                      {{ location.location }}
                    </option>
                  </select>
                </label>

                <label
                  >Paga Oraria:
                  <select v-model="newUser.hourly_payment_id">
                    <option
                      v-for="payment in hourlyPayments"
                      :key="payment.id"
                      :value="payment.id"
                    >
                      {{ payment.description }} - €{{ payment.payment }}
                    </option>
                  </select>
                </label>

                <label
                  >Utente Asterisk:
                  <input
                    type="text"
                    v-model="newUser.ast_user"
                    :disabled="!isOperatorSelected"
                  />
                </label>

                <label
                  >Attivo:
                  <select v-model="newUser.is_active" required>
                    <option :value="true">Sì</option>
                    <option :value="false">No</option>
                  </select>
                </label>
              </div>
            </fieldset>
          </div>

          <div class="modal-buttons">
            <button type="button" @click="closeCreateModal">Annulla</button>
            <button type="submit">Crea Utente</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

export default {
  name: "UserManagement",
  data() {
    return {
      users: [],
      isEditModalOpen: false,
      isCreateModalOpen: false,
      currentPage: 1, // Pagina corrente
      itemsPerPage: 10, // Numero di righe per pagina
      selectedUser: null,
      newUser: {
        nome: "",
        cognome: "",
        email: "",
        telefono: "",
        role_id: "",
        password: "",
        is_active: true,
        ast_user: "",
      },
      roles: [],
      filters: {
        role: "",
        is_active: "",
        name: "",
      },
      feedbackMessage: "",
      feedbackType: "",
    };
  },
  computed: {
    // Lista utenti filtrata
    filteredUsers() {
      return this.users.filter((user) => {
        const matchesRole = this.filters.role
          ? user.role_name === this.filters.role
          : true;
        const matchesActive =
          this.filters.is_active !== ""
            ? user.is_active === JSON.parse(this.filters.is_active)
            : true;
        const matchesName = this.filters.name
          ? `${user.nome} ${user.cognome}`
              .toLowerCase()
              .includes(this.filters.name.toLowerCase())
          : true;
        return matchesRole && matchesActive && matchesName;
      });
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredUsers.slice(start, end);
    },
    // Calcola il numero totale di pagine
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    },
    isOperatorSelected() {
      const operatorRole = this.roles.find(
        (role) => role.name.toLowerCase() === "operatore"
      );
      return (
        this.selectedUser?.role_id === operatorRole?.id ||
        this.newUser?.role_id === operatorRole?.id
      );
    },
  },
  methods: {
    updateAsteriskField() {
      const operatorRole = this.roles.find(
        (role) => role.name.toLowerCase() === "operatore"
      );

      if (this.selectedUser && this.selectedUser.role_id !== operatorRole?.id) {
        this.selectedUser.ast_user = "";
      }

      if (this.newUser && this.newUser.role_id !== operatorRole?.id) {
        this.newUser.ast_user = "";
      }
    },

    changePage(page) {
      if (page > 0 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    // Metodo per esportare i dati in CSV
    exportToCSV() {
      const headers = [
        "ID",
        "Nome",
        "Cognome",
        "Username",
        "Email",
        "Ruolo",
        "Codice Fiscale",
        "Telefono",
        "Indirizzo",
        "Città",
        "Provincia",
        "CAP",
        "Attivo",
        "Utente Asterisk",
      ];

      // Prepara i dati degli utenti per il CSV
      const rows = this.users.map((user) => [
        user.id,
        user.nome || "",
        user.cognome || "",
        user.username || "",
        user.email || "",
        user.role_name || "",
        user.codice_fiscale || "",
        user.telefono || "",
        user.indirizzo || "",
        user.city || "",
        user.provincia || "",
        user.cap || "",
        user.is_active ? "Sì" : "No",
        user.ast_user || "",
      ]);

      // Unisci intestazioni e righe
      const csvContent = [
        headers.join(","), // Aggiungi le intestazioni
        ...rows.map((row) => row.map((value) => `"${value}"`).join(",")), // Aggiungi i dati
      ].join("\n");

      // Crea un file Blob e scaricalo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "utenti.csv"); // Nome del file scaricato
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    async fetchRoles() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/roles`
        );

        // Verifica se i ruoli sono annidati (es. in response.data[0])
        if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
          this.roles = response.data[0]; // Estrai i ruoli dall'array annidato
        } else {
          this.roles = response.data; // Salva direttamente i dati se non sono annidati
        }

        console.log("Ruoli caricati:", this.roles); // Log per debugging
      } catch (error) {
        console.error("Errore durante il caricamento dei ruoli:", error);
      }
    },

    async fetchUsers() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/users`
        );
        if (Array.isArray(response.data)) {
          const processedUsers = [];
          response.data.forEach((innerArray) => {
            innerArray.forEach((user) => {
              if (user && user.id && user.username) {
                processedUsers.push({
                  id: user.id,
                  username: user.username,
                  email: user.email || "",
                  nome: user.nome || "",
                  cognome: user.cognome || "",
                  telefono: user.telefono || "",
                  codice_fiscale: user.codice_fiscale || "",
                  partita_iva: user.partita_iva || "",
                  indirizzo: user.indirizzo || "",
                  city: user.city || "",
                  provincia: user.provincia || "",
                  cap: user.cap || "",
                  //role: user.role || "",
                  role_name: user.role_name || "", // Assicura che role_name sia incluso
                  is_active:
                    typeof user.is_active === "string"
                      ? user.is_active.trim().toLowerCase() === "si"
                      : !!user.is_active,
                  ast_user: user.ast_user || "",
                  location_id: user.location_id || "", // ✅ Aggiunto campo per la location
                  location_name: user.location_name || "",
                  hourly_payment_id: user.hourly_payment_id || "", // ✅ Aggiunto campo per il pagamento orario
                });
              }
            });
          });

          // Filtra utenti con almeno un valore significativo
          this.users = processedUsers.filter((user) => {
            return (
              user.nome !== "" ||
              user.cognome !== "" ||
              user.email !== "" ||
              user.telefono !== "" ||
              user.indirizzo !== ""
            );
          });

          console.log("Utenti finali assegnati a Vue:", this.users);
        } else {
          console.warn("Struttura della risposta non valida:", response.data);
          this.showFeedback(
            "Errore nella struttura dei dati ricevuti.",
            "error"
          );
        }
      } catch (error) {
        console.error("Errore nel recupero degli utenti:", error);
        this.showFeedback(
          "Errore durante il caricamento della lista utenti.",
          "error"
        );
      }
    },

    async createUser() {
      try {
        const newUser = {
          username: this.newUser.username,
          nome: this.newUser.nome,
          cognome: this.newUser.cognome,
          email: this.newUser.email,
          telefono: this.newUser.telefono,
          codice_fiscale: this.newUser.codice_fiscale,
          partita_iva: this.newUser.partita_iva,
          indirizzo: this.newUser.indirizzo,
          city: this.newUser.city,
          provincia: this.newUser.provincia,
          cap: this.newUser.cap,
          role_id: this.newUser.role_id,
          password: this.newUser.password,
          is_active: this.newUser.is_active ? "si" : "no",
          ast_user: this.newUser.ast_user,
          location_id: this.newUser.location_id,
          hourly_payment_id: this.newUser.hourly_payment_id,
        };

        console.log("Dati per la creazione:", newUser);

        await axios.post(
         // `${process.env.VUE_APP_API_URL}/auth/register`,
          `${process.env.VUE_APP_API_URL}/register`,
          newUser
        );

        this.showFeedback("Utente creato con successo.", "success");

        // 🔥 Aggiorna la lista utenti subito dopo la creazione
        await this.fetchUsers();

        this.closeCreateModal();
      } catch (error) {
        console.error("Errore durante la creazione dell'utente:", error);

        if (error.response) {
          const errorMessage =
            error.response.data.error || "Errore sconosciuto.";
          if (
            error.response.status === 400 &&
            errorMessage.includes("Email già in uso")
          ) {
            this.showFeedback(
              "Non puoi usare questa E-mail, è già registrata.",
              "warning"
            );
          } else {
            this.showFeedback(`Errore: ${errorMessage}`, "error");
          }
        } else {
          this.showFeedback("Errore nella comunicazione col server.", "error");
        }
      }
    },

    async updateUser() {
      try {
        const updatedUser = {
          username: this.selectedUser.username,
          nome: this.selectedUser.nome,
          cognome: this.selectedUser.cognome,
          email: this.selectedUser.email,
          telefono: this.selectedUser.telefono,
          codice_fiscale: this.selectedUser.codice_fiscale,
          partita_iva: this.selectedUser.partita_iva,
          indirizzo: this.selectedUser.indirizzo,
          city: this.selectedUser.city,
          provincia: this.selectedUser.provincia,
          cap: this.selectedUser.cap,
          role_id: this.selectedUser.role_id,
          is_active: this.selectedUser.is_active ? "si" : "no",
          ast_user: this.selectedUser.ast_user,
          location_id: this.selectedUser.location_id,
          hourly_payment_id: this.selectedUser.hourly_payment_id,
        };

        console.log("Dati inviati per l'aggiornamento:", updatedUser);

        await axios.put(
          `${process.env.VUE_APP_API_URL}/users/${this.selectedUser.id}`,
          updatedUser
        );

        this.showFeedback("Utente aggiornato con successo!", "success");

        // 🔥 Aggiungi questa linea per ricaricare gli utenti aggiornati
        await this.fetchUsers();

        this.closeEditModal();
      } catch (error) {
        this.showFeedback(
          "Errore durante l'aggiornamento dell'utente.",
          "error"
        );
        console.error(
          "Errore durante l'aggiornamento:",
          error.response?.data || error
        );
      }
    },

    async deleteUser(userId) {
      try {
        if (confirm("Sei sicuro di voler eliminare questo utente?")) {
          await axios.delete(`${process.env.VUE_APP_API_URL}/users/${userId}`);
          this.users = this.users.filter((user) => user.id !== userId);
          this.showFeedback("Utente eliminato con successo.", "success");
        }
      } catch (error) {
        this.showFeedback(
          "Errore durante l'eliminazione dell'utente.",
          "error"
        );
        console.error(error);
      }
    },

    async fetchLocations() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/locations-table`
        );
        this.locations = response.data;
        console.log("Locations caricate:", this.locations);
      } catch (error) {
        console.error("Errore nel caricamento delle locations:", error);
      }
    },

    // ✅ Recupera le Tariffe Orarie dal server
    async fetchHourlyPayments() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/hourly-payments-table`
        );
        this.hourlyPayments = response.data;
        console.log("Pagamenti orari caricati:", this.hourlyPayments);
      } catch (error) {
        console.error("Errore nel caricamento delle tariffe orarie:", error);
      }
    },

    openCreateModal() {
      this.isCreateModalOpen = true;
      this.newUser = {
        nome: "",
        cognome: "",
        email: "",
        telefono: "",
        codice_fiscale: "",
        partita_iva: "",
        indirizzo: "",
        city: "",
        provincia: "",
        cap: "",
        username: "",
        password: "",
        role_id: this.roles.length > 0 ? this.roles[0].id : null, // Imposta il primo ruolo disponibile
        is_active: true,
        ast_user: "",
        location_id: "", // ✅ Aggiunto campo per la location
        hourly_payment_id: "", // ✅ Aggiunto campo per il pagamento orario
      };
    },

    closeCreateModal() {
      this.isCreateModalOpen = false;
      this.newUser = {
        nome: "",
        cognome: "",
        email: "",
        telefono: "",
        role: "",
        password: "",
        is_active: true,
      };
    },

    openEditModal(user) {
      this.selectedUser = {
        ...user, // Mantieni tutti i campi
        role_id:
          this.roles.find((role) => role.name === user.role_name)?.id || null,
        is_active:
          typeof user.is_active === "string"
            ? user.is_active.trim().toLowerCase() === "si"
            : !!user.is_active,
        location_id: user.location_id || null, // Aggiunto
        hourly_payment_id: user.hourly_payment_id || null, // Aggiunto
      };

      this.isEditModalOpen = true;
      this.feedbackMessage = ""; // Resetta il feedback
    },

    closeEditModal() {
      this.selectedUser = null;
      this.isEditModalOpen = false;
      this.feedbackMessage = ""; // Resetta il feedback
    },

    applyFilters() {
      console.log("Filtri applicati:", this.filters);
    },

    resetFilters() {
      this.filters = {
        role: "",
        is_active: "",
        name: "",
      };
    },

    showFeedback(message, type) {
      this.feedbackMessage = message;
      this.feedbackType = type;
      setTimeout(() => {
        this.feedbackMessage = "";
        this.feedbackType = "";
      }, 3000);
    },
  },
  mounted() {
    this.fetchRoles();
    this.fetchUsers();
    this.fetchLocations(); // ✅ Carica le locations
    this.fetchHourlyPayments(); // ✅ Carica le tariffe orarie
  },
};
</script>

<style scoped></style>
