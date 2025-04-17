<template>
  <div>
    <div class="header">
      <h3>Archivio Consuntivi</h3>
    </div>

    <!-- 🔍 Filtri -->
    <div class="filters">
      <label>
        Anno:
        <select v-model="selectedYear" @change="applyFilters">
          <option value="">Tutti</option>
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>
      <label>
        Mese:
        <select v-model="selectedMonthFilter" @change="applyFilters">
          <option value="">Tutti</option>
          <option v-for="(m, index) in months" :key="index" :value="index + 1">
            {{ m }}
          </option>
        </select>
      </label>
      <button @click="resetSelections">Reset</button>
    </div>

    <!-- 📅 Tabella Mensilità -->
    <table class="table">
      <thead>
        <tr>
          <th>Anno</th>
          <th>Mese</th>
          <th>Agenti Coinvolti</th>
          <th>Totale Provvigioni</th>
          <th>Creata il</th>

          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <!-- Nessun risultato trovato -->
        <tr v-if="paginatedMonths.length === 0">
          <td colspan="5" class="no-results">Nessuna mensilità trovata</td>
        </tr>

        <tr
          v-for="month in paginatedMonths"
          :key="`${month.year}-${month.month}`"
          class="clickable"
          @click="toggleMonthDetails(month)"
        >
          <td>{{ month.year }}</td>
          <td>{{ getMonthName(month.month) }}</td>
          <td>{{ month.totalAgents }}</td>
          <td>
            <strong>{{ formatCurrency(month.totalCommission) }}</strong>
          </td>
          <td>{{ formatDate(month.created_at) }}</td>
          <td>
            <button
              :class="isSelectedMonth(month) ? 'in-grid-blue' : 'in-grid'"
              :title="isSelectedMonth(month) ? 'Chiudi' : 'Espandi'"
            >
              <i
                class="fa"
                :class="
                  isSelectedMonth(month) ? 'fa-minus-square' : 'fa-plus-square'
                "
              ></i>
            </button>

            <button
              class="in-grid-blue"
              @click="generatePDF(month)"
              :title="'Scarica PDF dettagliato'"
            >
              <i class="fa fa-file-pdf"></i>
            </button>

            <button
              class="in-grid-red"
              @click.stop="deleteCommissionMonth(month)"
              :title="'Cancella mensilità'"
            >
              <i class="fa-duotone fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>

        <!-- Lista agenti (sotto-tabella) -->
        <tr v-if="selectedMonth">
          <td colspan="6">
            <table class="sub-table">
              <thead>
                <tr>
                  <th>Agente</th>
                  <th>Provvigione Totale</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="agent in computedAgents"
                  :key="agent.agent_id"
                  class="clickable sub-row"
                  @click.stop="toggleAgentDetails(agent)"
                >
                  <td>{{ agent.agent_name }}</td>
                  <td>
                    <strong>{{ formatCurrency(agent.totalCommission) }}</strong>
                  </td>
                  <td>
                    <button
                      :class="
                        isSelectedAgent(agent) ? 'in-grid-blue' : 'in-grid'
                      "
                      :title="isSelectedAgent(agent) ? 'Chiudi' : 'Espandi'"
                    >
                      <i
                        class="fa"
                        :class="
                          isSelectedAgent(agent)
                            ? 'fa-minus-square'
                            : 'fa-plus-square'
                        "
                      ></i>
                    </button>
                  </td>
                </tr>

                <!-- Lista contratti -->
                <tr v-if="selectedAgent">
                  <td colspan="5">
                    <table class="sub-table deeper-level">
                      <thead>
                        <tr>
                          <th>Numero Contratto</th>
                          <th>Cliente</th>
                          <th>Data Firma</th>
                          <th>Stato</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="contract in computedContracts"
                          :key="contract.contract_id"
                          class="clickable sub-row deeper-level"
                          @click.stop="toggleContractDetails(contract)"
                        >
                          <td>{{ contract.contract_number || "N/A" }}</td>
                          <td>{{ contract.client_name || "N/A" }}</td>
                          <td>{{ formatDate(contract.signature_date) }}</td>
                          <td>{{ contract.status_name || "N/A" }}</td>
                          <td>
                            <button
                              :class="
                                isSelectedContract(contract)
                                  ? 'in-grid-blue'
                                  : 'in-grid'
                              "
                              :title="
                                isSelectedContract(contract)
                                  ? 'Chiudi'
                                  : 'Espandi'
                              "
                            >
                              <i
                                class="fa"
                                :class="
                                  isSelectedContract(contract)
                                    ? 'fa-minus-square'
                                    : 'fa-plus-square'
                                "
                              ></i>
                            </button>
                          </td>
                        </tr>

                        <!-- 🛒 Lista prodotti -->
                        <tr v-if="selectedContract">
                          <td colspan="5">
                            <table class="sub-table deepest-level">
                              <thead>
                                <tr>
                                  <th>Prodotto</th>
                                  <th>Quantità</th>
                                  <th>Provvigione</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  v-for="product in computedProducts"
                                  :key="product.id"
                                  class="sub-row deepest-level"
                                >
                                  <td>{{ product.name }}</td>
                                  <td>{{ product.quantity }}</td>
                                  <td>
                                    {{ formatCurrency(product.commission) }}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginazione -->
    <div class="pagination" v-if="totalPages > 1">
      <button @click="changePage('prev')" :disabled="currentPage === 1">
        <i class="fa-solid fa-backward-step"></i>
      </button>
      <span>Pagina {{ currentPage }} di {{ totalPages }}</span>
      <button
        @click="changePage('next')"
        :disabled="currentPage === totalPages"
      >
      <i class="fa-solid fa-forward-step"></i>
      </button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      monthsList: [],
      agentDetails: [],
      contractsDetails: [],
      selectedMonth: null,
      selectedAgent: null,
      selectedContract: null,
      selectedYear: new Date().getFullYear(),
      selectedMonthFilter: "",
      years: Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i),
      months: [
        "Gen",
        "Feb",
        "Mar",
        "Apr",
        "Mag",
        "Giu",
        "Lug",
        "Ago",
        "Set",
        "Ott",
        "Nov",
        "Dic",
      ],

      currentPage: 1,
      itemsPerPage: 10, // Mostra 10 elementi per pagina
    };
  },
  computed: {
    filteredMonths() {
      return this.monthsList.filter(
        (m) =>
          (!this.selectedYear || m.year == this.selectedYear) &&
          (!this.selectedMonthFilter || m.month == this.selectedMonthFilter)
      );
    },
    computedMonths() {
      return this.filteredMonths.filter((m) => m.totalCommission > 0);
    },
    computedAgents() {
      return this.agentDetails.filter((a) => a.totalCommission > 0);
    },
    computedContracts() {
      return this.contractsDetails.filter((c) => c.products.length > 0);
    },
    computedProducts() {
      return (
        this.selectedContract?.products.filter((p) => p.commission > 0) || []
      );
    },

    paginatedMonths() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.computedMonths.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.computedMonths.length / this.itemsPerPage);
    },
  },
  methods: {
    async fetchMonths() {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/get-archived-commissions`
        );
        this.monthsList = data;
        this.currentPage = 1; // Reset della paginazione quando i dati cambiano
      } catch (error) {
        console.error("Errore nel recupero delle mensilità:", error);
      }
    },

    async fetchAgents() {
      if (!this.selectedMonth) return;
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/get-agents-by-month`,
          {
            params: {
              year: this.selectedMonth.year,
              month: this.selectedMonth.month,
            },
          }
        );
        this.agentDetails = data;
      } catch (error) {
        console.error("Errore nel caricamento degli agenti:", error);
      }
    },

    async fetchContracts(agent) {
      if (!this.selectedAgent) return;
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/get-contracts-by-agent`,
          {
            params: {
              agentId: agent.agent_id,
              year: this.selectedMonth.year,
              month: this.selectedMonth.month,
            },
          }
        );
        this.contractsDetails = data;
      } catch (error) {
        console.error("Errore nel recupero dei contratti:", error);
      }
    },

    // Fetch Dettagli Contratto
    async fetchContractDetailsComm(contract) {
      if (!contract || !contract.contract_id) {
        console.error("Errore: `contract` non valido", contract);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contractscomm/${contract.contract_id}`
        );
        this.selectedContract = {
          ...response.data.contract,
          products: response.data.products || [],
        };
      } catch (error) {
        console.error("Errore nel recupero dettagli contratto:", error);
      }
    },

    async deleteCommissionMonth(month) {
      if (!month.year || !month.month) {
        console.error("Errore: dati della mensilità mancanti", month);
        alert("Errore: impossibile trovare i dati della mensilità.");
        return;
      }

      if (
        !confirm(
          `⚠️ Sei sicuro di voler eliminare le provvigioni di ${this.getMonthName(
            month.month
          )} ${month.year}?`
        )
      ) {
        return;
      }

      try {
        const response = await axios.delete(
          `${process.env.VUE_APP_API_URL}/delete-commission-month/${month.year}/${month.month}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        alert(response.data.message);
        this.fetchMonths(); // Aggiorna la tabella

        // Se il mese eliminato era selezionato, resettiamo i dettagli
        if (this.isSelectedMonth(month)) {
          this.selectedMonth = null;
          this.agentDetails = [];
          this.selectedAgent = null;
          this.contractsDetails = [];
          this.selectedContract = null;
        }
      } catch (error) {
        console.error("Errore durante l'eliminazione:", error);
        alert("Errore durante l'eliminazione della mensilità.");
      }
    },

    async generatePDF(month) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/export-detailed-pdf`,
          {
            params: {
              year: month.year,
              month: month.month,
            },
            responseType: "blob", // 📂 Imposta il tipo di risposta come file
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // 📥 Crea un link per il download del file
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Provvigioni_${month.year}_${month.month}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // ✅ Rilascia la memoria
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Errore nel download del PDF:", error);
        alert("❌ Errore nella generazione del PDF!");
      }
    },

    toggleMonthDetails(month) {
      if (this.isSelectedMonth(month)) {
        this.selectedMonth = null;
        this.resetSelections();
      } else {
        this.selectedMonth = { ...month };
        this.resetSelections();
        this.fetchAgents();
      }
    },

    toggleAgentDetails(agent) {
      if (this.isSelectedAgent(agent)) {
        this.selectedAgent = null;
        this.contractsDetails = [];
        this.selectedContract = null;
      } else {
        this.selectedAgent = agent;
        this.contractsDetails = [];
        this.selectedContract = null;
        this.fetchContracts(agent);
      }
    },

    toggleContractDetails(contract) {
      if (this.isSelectedContract(contract)) {
        this.selectedContract = null;
      } else {
        this.selectedContract = contract;
        this.fetchContractDetailsComm(contract);
      }
    },

    resetSelections() {
      this.agentDetails = [];
      this.selectedAgent = null;
      this.contractsDetails = [];
      this.selectedContract = null;
    },

    isSelectedMonth(month) {
      return (
        this.selectedMonth?.year === month.year &&
        this.selectedMonth?.month === month.month
      );
    },

    isSelectedAgent(agent) {
      return this.selectedAgent?.agent_id === agent.agent_id;
    },

    isSelectedContract(contract) {
      return this.selectedContract?.contract_id === contract.contract_id;
    },

    getMonthName(month) {
      return this.months[month - 1] || month;
    },

    formatDate(date) {
      return date ? new Date(date).toLocaleDateString("it-IT") : "N/A";
    },

    formatCurrency(value) {
      return value ? parseFloat(value).toFixed(2) + " €" : "N/A";
    },

    changePage(direction) {
      if (direction === "next" && this.currentPage < this.totalPages) {
        this.currentPage++;
      } else if (direction === "prev" && this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },
  created() {
    this.fetchMonths();
  },
};
</script>

<style scoped>
.container {
  padding: 20px;
}

.clickable {
  cursor: pointer;
  transition: background 0.2s;
}

.clickable:hover {
  background: #f2f2f2;
}

.sub-table {
  width: 100%;
  margin-top: 10px;
  border: 1px solid #ccc;
}

.sub-row {
  background: #f8f8f8;
}

.deeper-level {
  background: #e8e8e8;
}

.deepest-level {
  background: #d8d8d8;
}
</style>
