<template> 
  <div>
    <div class="header">
      <h3><i class="fa-solid fa-trophy icon-green"></i>Gestione Bonus Operatori</h3>
      <div class="actions">
        <button class="create-button" @click="openModal(null)">+</button>
      </div>
    </div>

    <!-- FILTRI -->
    <div class="filters">
      <label>
        Anno:
        <select v-model="filterYear">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>

      <label>
        Mese:
        <select v-model="filterMonth">
          <option
            v-for="(month, index) in months"
            :key="index"
            :value="index + 1"
          >
            {{ month }}
          </option>
        </select>
      </label>

      <label class="switch">
        <input type="checkbox" v-model="showArchived" @change="fetchBonuses" />
        <span class="slider"></span>
      </label>
      <span>Mostra archiviate</span>

      <button @click="resetFilters">Reset</button>
    </div>

    <!-- TABELLA BONUS -->
    <table class="table">
      <thead>
        <tr>
          <th>Tipo Gara</th>
          <th>Min Appuntamenti</th>
          <th>Min Appuntamenti Positivi</th>
          <th>Min Ore</th>
          <th>% Min Conversione</th>
          <th>Bonus (€)</th>
          <th>Validità</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedBonuses.length === 0">
          <td colspan="9" class="no-results">Nessun bonus trovato</td>
        </tr>
        <tr
          v-for="bonus in paginatedBonuses"
          :key="bonus.id"
          :class="{ 'archived-row': bonus.is_archived }"
        >
          <td>{{ bonus.rule_type }}</td>
          <td>{{ bonus.min_appointments || "-" }}</td>
          <td>{{ bonus.min_positive_appointments || "-" }}</td>
          <td>{{ bonus.min_hours || "-" }}</td>
          <td>{{ bonus.min_conversion ? bonus.min_conversion + "%" : "-" }}</td>
          <td>{{ bonus.bonus_amount }}</td>
          <td>
            {{ formatDate(bonus.valid_from) }} →
            {{ formatDate(bonus.valid_to) }}
          </td>
          <td>
            <span :class="{ archived: bonus.is_archived }">
              {{ bonus.is_archived ? "Archiviato" : "Attivo" }}
            </span>
          </td>
          <td>
            <!-- Modifica Bonus -->
            <button
              class="in-grid"
              @click="openEditModal(bonus)"
              :title="'Modifica Bonus'"
            >
              <i class="fa-duotone fa-solid fa-pen"></i>
            </button>

            <!-- Cancella Bonus -->
            <button
              class="in-grid-red"
              @click="deleteBonus(bonus.id)"
              :title="'Cancella Bonus'"
            >
              <i class="fa-duotone fa-solid fa-trash"></i>
            </button>

            <!-- Archivia/Ripristina Bonus -->
            <button
              class="in-grid-blue"
              @click="toggleArchive(bonus)"
              :title="bonus.is_archived ? 'Ripristina Bonus' : 'Archivia Bonus'"
            >
              <i
                v-if="bonus.is_archived"
                class="fas fa-undo"
                aria-hidden="true"
              ></i>
              <i v-else class="fa fa-archive" aria-hidden="true"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginazione -->
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

    <!-- MODALE PER AGGIUNGERE / MODIFICARE BONUS -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ isEditing ? "Modifica Bonus" : "Nuovo Bonus" }}</h2>

        <!-- Selezione Tipo Gara -->
        <label
          >Tipo Gara:
          <select v-model="currentBonus.rule_type">
            <option value="positivi">Numero Appuntamenti</option>
            <option value="appuntamenti_positivi">
              Numero Appuntamenti Positivi
            </option>
            <option value="resa_oraria">Resa Oraria</option>
            <option value="mix">Mix di criteri</option>
          </select>
        </label>

        <!-- Campi dinamici -->
        <label
          >Min Appuntamenti:
          <input
            type="number"
            v-model="currentBonus.min_appointments"
            :disabled="!enableMinAppointments"
          />
        </label>

        <label
          >Numero Appuntamenti Positivi:
          <input
            type="number"
            v-model="currentBonus.min_positive_appointments"
            :disabled="!enableMinPositiveAppointments"
          />
        </label>

        <label
          >Min Ore:
          <input
            type="number"
            v-model="currentBonus.min_hours"
            :disabled="!enableMinHours"
          />
        </label>

        <label
          >% Min Conversione:
          <input
            type="number"
            step="0.1"
            v-model="currentBonus.min_conversion"
            :disabled="!enableMinConversion"
          />
        </label>

        <!-- BONUS: Campo sempre obbligatorio -->
        <label
          >Bonus (€):
          <input
            type="number"
            step="0.01"
            v-model="currentBonus.bonus_amount"
            required
          />
        </label>

        <!-- Validità -->
        <label
          >Validità Inizio:
          <input type="date" v-model="currentBonus.valid_from" />
        </label>
        <label
          >Validità Fine:
          <input type="date" v-model="currentBonus.valid_to" />
        </label>

        <!-- Pulsanti -->
        <div class="modal-buttons">
          <button class="close-button" @click="closeModal">Annulla</button>
          <button @click="isEditing ? updateBonus() : saveBonus()">
            Salva
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";
import "@/styles/toast.css";

export default {
  data() {
    return {
      bonuses: [],
      filterStartDate: "",
      filterEndDate: "",
      filterYear: new Date().getFullYear(), // Imposta l'anno corrente
      filterMonth: new Date().getMonth() + 1, // Imposta il mese corrente (1-12)

      availableYears: Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - i
      ),
      months: [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre",
      ],
      showArchived: false,
      showModal: false,
      isEditing: false,
      currentBonus: {
        rule_type: "positivi",
        min_appointments: "",
        min_positive_appointments: "",
        min_hours: "",
        min_conversion: "",
        bonus_amount: "",
        valid_from: new Date().toISOString().split("T")[0], // Default oggi
        valid_to: "",
      },
      currentPage: 1,
      itemsPerPage: 10,
    };
  },
  computed: {
    filteredBonuses() {
    return this.bonuses.filter((bonus) => {
      const bonusYear = new Date(bonus.valid_from).getFullYear();
      const bonusMonth = new Date(bonus.valid_from).getMonth() + 1; // Mese da 1 a 12

      // Filtra per anno e mese
      const matchYearMonth = bonusYear === this.filterYear && bonusMonth === this.filterMonth;

      // Converte le date per il filtro start/end
      const filterStart = this.filterStartDate ? new Date(this.filterStartDate) : null;
      const filterEnd = this.filterEndDate ? new Date(this.filterEndDate) : null;
      const validFrom = new Date(bonus.valid_from);
      const validTo = new Date(bonus.valid_to);

      // Controllo che il bonus rientri nel range di date selezionate
      const matchStart = filterStart ? validFrom <= filterStart && validTo >= filterStart : true;
      const matchEnd = filterEnd ? validFrom <= filterEnd && validTo >= filterEnd : true;

      // Controllo se mostrare quelli archiviati
      const matchArchived = this.showArchived || !bonus.is_archived;

      // Restituisco il risultato combinato
      return matchYearMonth && matchStart && matchEnd && matchArchived;
    });
  },

   
    // ⚡ Abilitazione dinamica degli input in base alla selezione
    enableMinAppointments() {
      return (
        this.currentBonus.rule_type === "appuntamenti" ||
        this.currentBonus.rule_type === "resa_oraria" ||
        this.currentBonus.rule_type === "mix"
      );
    },
    enableMinPositiveAppointments() {
      return (
        this.currentBonus.rule_type === "appuntamenti_positivi" ||
        this.currentBonus.rule_type === "mix"
      );
    },
    enableMinHours() {
      return (
        this.currentBonus.rule_type === "resa_oraria" ||
        this.currentBonus.rule_type === "mix"
      );
    },
    enableMinConversion() {
      return this.currentBonus.rule_type === "mix";
    },
    paginatedBonuses() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredBonuses.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredBonuses.length / this.itemsPerPage);
    },
  },
  methods: {
    async fetchBonuses() {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/operators/bonus`,
          {
            params: { showArchived: this.showArchived },
          }
        );
        this.bonuses = data;
      } catch (error) {
        console.error("Errore nel recupero dei bonus:", error);
      }
    },

    async saveBonus() {
      if (!this.currentBonus.bonus_amount) {
        this.$toast.show("Devi inserire un importo per il bonus.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      if (!this.currentBonus.valid_from || !this.currentBonus.valid_to) {
        this.$toast.show("Devi selezionare un intervallo di validità.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        return;
      }

      // ✅ Correggiamo il formato della data per il database (solo YYYY-MM-DD)
      const formattedBonus = {
        ...this.currentBonus,
        min_positive_appointments:
          this.currentBonus.min_positive_appointments || null,
        valid_from: this.currentBonus.valid_from.trim(), // 🚀 Rimuove spazi inutili
        valid_to: this.currentBonus.valid_to.trim(),
      };

      try {
        const apiUrl = this.isEditing
          ? `${process.env.VUE_APP_API_URL}/operators/bonus/${this.currentBonus.id}`
          : `${process.env.VUE_APP_API_URL}/operators/bonus`;

        const method = this.isEditing ? axios.put : axios.post;

        await method(apiUrl, formattedBonus);

        this.$toast.show("Bonus salvato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });

        this.closeModal();
        this.fetchBonuses();
      } catch (error) {
        this.$toast.show("Errore nel salvataggio del bonus.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async updateBonus() {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/operators/bonus/${this.currentBonus.id}`,
          this.currentBonus
        );
        this.closeModal();
        this.fetchBonuses();
      } catch (error) {
        this.$toast.show("Errore nell'aggiornamento del bonus.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },
    async deleteBonus(id) {
      if (!confirm("Sei sicuro di voler eliminare questo bonus?")) return;

      try {
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/operators/bonus/${id}`
        );
        this.$toast.show("Bonus eliminato con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
        this.fetchBonuses();
      } catch (error) {
        console.error("Errore nell'eliminazione del bonus:", error);
        this.$toast.show("Errore nell'eliminazione.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },
    async toggleArchive(bonus) {
      try {
        const newStatus = bonus.is_archived ? 0 : 1;
        const response = await axios.put(
          `${process.env.VUE_APP_API_URL}/operators/bonus/${bonus.id}/archive`,
          { is_archived: newStatus }
        );

        if (response.status === 200) {
          bonus.is_archived = newStatus; // Aggiorna localmente senza ricaricare tutto
          this.$toast.show(
            newStatus === 0 ? "Bonus ripristinato." : "Bonus archiviato.",
            {
              position: "bottom-right",
              duration: 5000,
              type: "success",
            }
          );
        } else {
          throw new Error("Errore nell'archiviazione.");
        }
      } catch (error) {
        console.error("Errore nell'archiviazione del bonus:", error);
        this.$toast.show("Errore nell'operazione.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
        this.fetchBonuses(); // Se qualcosa va storto, ricarichiamo i dati
      }
    },

    openEditModal(bonus) {
      this.isEditing = true;
      this.currentBonus = {
        ...bonus,
        valid_from: bonus.valid_from ? bonus.valid_from.split("T")[0] : "", // Converte da ISO a YYYY-MM-DD
        valid_to: bonus.valid_to ? bonus.valid_to.split("T")[0] : "", // Converte da ISO a YYYY-MM-DD
      };
      this.showModal = true;
    },

    openModal(bonus) {
      this.isEditing = !!bonus;
      this.currentBonus = bonus
        ? { ...bonus }
        : {
            rule_type: "appuntamenti",
            min_appointments: "",
            min_positive_appointments: "",
            min_hours: "",
            min_conversion: "",
            bonus_amount: "",
            valid_from: new Date().toISOString().split("T")[0],
            valid_to: "",
          };
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    resetFilters() {
    this.filterYear = new Date().getFullYear();
    this.filterMonth = new Date().getMonth() + 1;
    this.fetchBonuses(); // Ricarica i dati
  },

    formatDate(dateString) {
      return dateString
        ? new Date(dateString).toLocaleDateString("it-IT")
        : "-";
    },
    changePage(page) {
      if (page > 0 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
  },
  mounted() {
    this.fetchBonuses();
  },
};
</script>

<style scoped>
.archived-row {
  color: #c35573 !important;
  font-weight: bold;
}
</style>
