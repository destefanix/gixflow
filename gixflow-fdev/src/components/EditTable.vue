<template>
  <div class="edit-table-container">
    <h3>Modifica {{ tableLabel }}</h3>

    <!-- Tabella Dati -->
    <div v-if="isLoading" class="loading-spinner">Caricamento...</div>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column">{{ column }}</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData" :key="row.id">
            <td v-for="column in columns" :key="column">
              <input
                v-model="row[column]"
                class="editable-input"
                v-if="row.isEditing"
              />
              <span v-else>{{ row[column] }}</span>
            </td>
            <td class="actions">
              <button @click="toggleEdit(row)" class="in-grid">
                {{ row.isEditing ? "Salva" : "Modifica" }}
              </button>
              <button @click="deleteRow(row.id)" class="in-grid-red">
                Elimina
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Aggiunta Nuova Voce -->
    <h2>Aggiungi Nuova Entry</h2>
    <div class="add-form">
      <input
        v-for="column in columns"
        :key="column"
        v-model="newRow[column]"
        :placeholder="column"
      />
      <button @click="addRow" class="add-button">Aggiungi</button>
    </div>
  </div>
   
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

export default {
  props: {
    tableName: String, // Nome della tabella passato dalla navigazione a schede
  },

  data() {
    return {
      tableLabel: "",
      columns: [],
      tableData: [],
      newRow: {},
      tables: [
        { name: "legal-forms-table", label: "Forme Giuridiche" },
        { name: "documents-template-table", label: "Template Documenti" },
        { name: "roles-table", label: "Ruoli" },
        { name: "appointment-status-table", label: "Stati Appuntamento" },
        { name: "contract-status-table", label: "Stati Contratto" },
        { name: "adjustment-types-table", label: "Aggiustamenti manuali" },
        { name: "locations-table", label: "Sedi" },
        { name: "hourly-payments-table", label: "Paghe orarie" },


      ],
    };
  },

  watch: {
    tableName: {
      immediate: true,
      handler(newTable) {
        this.tableLabel =
          this.tables.find((t) => t.name === newTable)?.label || newTable;
        this.fetchTableData();
      },
    },
  },

  methods: {
    async fetchTableData() {
      this.isLoading = true;
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/${this.tableName}`
        );
        this.tableData = response.data.map((row) => ({
          ...row,
          isEditing: false,
        }));
        this.columns = response.data.length
          ? Object.keys(response.data[0])
          : [];
        this.resetNewRow();
      } catch (error) {
        console.error("Errore nel caricamento:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async updateRow(row) {
      try {
        await axios.put(
          `${process.env.VUE_APP_API_URL}/${this.tableName}/${row.id}`,
          row
        );
        this.$toast.show("Aggiornato con successo!", { type: "success" });
      } catch (error) {
        console.error("Errore nell'aggiornamento:", error);
      }
    },

    async deleteRow(id) {
      if (!confirm("Sei sicuro di voler eliminare questa voce?")) return;
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_URL}/${this.tableName}/${id}`
        );
        this.tableData = this.tableData.filter((row) => row.id !== id);
        this.$toast.show("Eliminato con successo!", { type: "success" });
      } catch (error) {
        console.error("Errore nell'eliminazione:", error);
      }
    },

    async addRow() {
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/${this.tableName}`,
          this.newRow
        );
        this.tableData.push({ id: response.data.id, ...this.newRow });
        this.resetNewRow();
        this.$toast.show("Aggiunto con successo!", { type: "success" });
      } catch (error) {
        console.error("Errore nella creazione:", error);
      }
    },

    resetNewRow() {
      this.newRow = this.columns.reduce(
        (acc, column) => ({ ...acc, [column]: "" }),
        {}
      );
    },

   

    toggleEdit(row) {
      if (row.isEditing) {
        this.updateRow(row); // 👈 Se sto salvando, aggiorno il database
      }
      row.isEditing = !row.isEditing; // 👈 Cambia tra Modifica/Salva
    },
  },
};
</script>

<style scoped>

/* Celle */
.table th,
.table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px; /* FONT PIÙ PICCOLO */
 
}

/* Se i bottoni non sono allineati, usa flexbox */
/* .edit-table td:last-child {
  justify-content: center;
} */

.table-container {
  width: 95%;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  background: white;
  text-align: left;
}



/* Input dentro le celle */
.input {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 13px; /* FONT PIÙ PICCOLO */
}


/* Form aggiunta */
.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.add-form input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  max-width: 250px;
  font-size: 13px; /* FONT PIÙ PICCOLO */
}

</style>
