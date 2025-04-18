<template>
  <div class="pianificazione-agenti">
    <h1>
      <i class="fa-solid fa-calendar-check icon-green"></i> Pianificazione Agenti
    </h1>

    <div class="toolbar">
      <div class="filters">
    <label>
      <select v-model="selectedAgentId" class="select-agent">
        <option value="">Tutti gli agenti</option>
        <option v-for="agent in agents" :key="agent.id" :value="agent.id">
          {{ agent.cognome }} {{ agent.nome }}
        </option>
      </select>
    </label>
    <button class="btn btn-today">
      <i class="fa-solid fa-calendar-day"></i> Settimana corrente
    </button>
    <button class="btn btn-export">
      <i class="fa-solid fa-file-csv"></i> Esporta CSV
    </button>
  </div>
      <div class="week-navigation">
        <button class="btn button" @click="goToPrevWeek">
          <i class="fa-solid fa-backward-step"></i> 
        </button>
        <span class="week-range">
          Settimana {{ formatDate(startOfWeek) }} - {{ formatDate(endOfWeek) }}
        </span>
        <button class="btn button" @click="goToNextWeek">
           <i class="fa-solid fa-forward-step"></i>
        </button>
      </div>
    </div>

    <div v-if="agents.length === 0" class="loading">
      <i class="fa-solid fa-spinner fa-spin"></i> Caricamento agenti...
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Agente</th>
          <th v-for="day in weekDays" :key="day.date">
            {{ formatDayHeader(day.date) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="agent in filteredAgents" :key="agent.id">
          <td class="agent-name">
           {{ agent.cognome }} {{ agent.nome }}
          </td>
          <td
            v-for="day in weekDays"
            :key="day.date"
            class="zone-cell"
            :class="{
              today: isToday(day.date),
              'has-zone': !!getZone(agent.id, day.date),
              'has-notes': !!getNotes(agent.id, day.date),
            }"
            :title="getNotes(agent.id, day.date)"
          >
            <div class="zone-cell-inner">
              <input
                type="text"
                :value="getZone(agent.id, day.date)"
                @input="
                  handleZoneInput(agent.id, day.date, $event.target.value)
                "
                placeholder="ZONA"
                class="zone-input"
              />
              <button
                class="nd-button"
                :class="{ active: getZone(agent.id, day.date) === 'ND' }"
                @click="setZoneToND(agent.id, day.date)"
                title="Imposta come non disponibile"
              >
                <i class="fa-solid fa-ban"></i>
              </button>
              <button
                class="note-button"
                @click="openNotesModal(agent.id, day.date)"
                :class="{ 'has-text': !!getNotes(agent.id, day.date) }"
              >
                <i class="fa-solid fa-sticky-note"></i>
                {{
                  getNotes(agent.id, day.date)
                    ? ""
                    : ""
                }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modale Note -->
    <div v-if="noteModal.visible" class="modal-overlay">
      <div class="modal-content note-modal">
        <h3>
          <i class="fa-solid fa-sticky-note icon-green"></i>
          Note per {{ formatDate(noteModal.date) }} -
          {{ getAgentName(noteModal.agentId) }}
        </h3>

        <label for="note-textarea">Contenuto nota:</label>
        <textarea
          id="note-textarea"
          v-model="noteModal.text"
          rows="6"
          placeholder="Scrivi qui la nota per la giornata..."
          class="notes-textarea"
        ></textarea>

        <div class="modal-buttons">
          <button type="button" class="btn btn-cancel" @click="closeNoteModal">
            <i class="fa-solid fa-times"></i> Annulla
          </button>
          <button type="button" class="btn btn-save" @click="saveNote">
            <i class="fa-solid fa-save"></i> Salva
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import "moment/locale/it";
import debounce from "lodash/debounce";

moment.locale("it");

export default {
  name: "PianificazioneAgenti",
  data() {
    return {
      agents: [],
      plannings: [],
      form: {},
      startOfWeek: moment().startOf("isoWeek").toDate(),
      dirtyCells: {},
      selectedAgentId: "",
      saveDebounced: null,
      noteModal: {
        visible: false,
        agentId: null,
        date: null,
        text: "",
      },
    };
  },
  computed: {
    endOfWeek() {
      return moment(this.startOfWeek).add(6, "days").toDate();
    },
    weekDays() {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = moment(this.startOfWeek)
          .add(i, "days")
          .format("YYYY-MM-DD");
        days.push({ date });
      }
      return days;
    },
    filteredAgents() {
      return this.selectedAgentId
        ? this.agents.filter((a) => a.id === this.selectedAgentId)
        : this.agents;
    },
  },
  methods: {
    formatDate(date) {
      return moment(date).format("DD MMM");
    },
    formatDayHeader(date) {
      return moment(date).format("ddd D");
    },
    isToday(date) {
      return moment(date).isSame(moment(), "day");
    },
    async fetchAgents() {
      const res = await axios.get(`${process.env.VUE_APP_API_URL}/users`);
      const flat = Array.isArray(res.data) ? res.data.flat() : [];
      this.agents = flat
        .filter((u) => u.role_id === 2 && u.is_active === "si")
        .sort((a, b) =>
          `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`)
        );
    },
    async fetchPlannings() {
      const res = await axios.get(
        `${process.env.VUE_APP_API_URL}/agents-planning`
      );
      this.plannings = Array.isArray(res.data) ? res.data : [];
      this.form = {};

      for (const row of this.plannings) {
        const date = moment(row.plan_date).format("YYYY-MM-DD");
        if (!this.form[row.agent_id]) this.form[row.agent_id] = {};
        this.form[row.agent_id][date] = {
          zone: (row.zone || "").toUpperCase(),
          notes: row.notes || "",
          id: row.id,
        };
      }

      this.prepareEmptyCells();
    },
    prepareEmptyCells() {
      for (const agent of this.agents) {
        if (!this.form[agent.id]) this.form[agent.id] = {};
        for (const { date } of this.weekDays) {
          if (!this.form[agent.id][date]) {
            this.form[agent.id][date] = { zone: "", notes: "" };
          }
        }
      }
    },
    async saveZone(agentId, date) {
      const data = this.form[agentId][date];
      if (!data.zone) return;

      const payload = {
        agent_id: agentId,
        plan_date: date,
        zone: data.zone,
        notes: data.notes,
      };

      try {
        if (data.id) {
          await axios.put(
            `${process.env.VUE_APP_API_URL}/agents-planning/${data.id}`,
            payload
          );
        } else {
          const res = await axios.post(
            `${process.env.VUE_APP_API_URL}/agents-planning`,
            payload
          );
          this.form[agentId][date].id = res.data.id;
        }
        delete this.dirtyCells[`${agentId}-${date}`];
         // Mostra un toast di successo
    this.$toast.success("Zona salvata con successo!", {
      position: "bottom-right",
      duration: 5000,
    });
      } catch (e) {
        console.error("❌ Errore salvataggio:", e);
        // Mostra un toast di errore
    this.$toast.error("Errore durante il salvataggio della zona.", {
      position: "bottom-right",
      duration: 5000,
    });
      }
    },
    handleZoneInput(agentId, date, value) {
      this.setDirty(agentId, date);
      this.updateZone(agentId, date, value);
      this.saveDebounced(agentId, date);
    },
    handleNotesInput(agentId, date, value) {
      this.setDirty(agentId, date);
      this.updateNotes(agentId, date, value);
      this.saveDebounced(agentId, date);
    },
    setDirty(agentId, date) {
      this.dirtyCells[`${agentId}-${date}`] = true;
    },
    updateZone(agentId, date, value) {
      this.initCell(agentId, date);
      this.form[agentId][date].zone = value.toUpperCase();
    },
    updateNotes(agentId, date, value) {
      this.initCell(agentId, date);
      this.form[agentId][date].notes = value;
    },
    initCell(agentId, date) {
      if (!this.form[agentId]) this.form[agentId] = {};
      if (!this.form[agentId][date]) this.form[agentId][date] = {};
    },
    getZone(agentId, date) {
      return this.form?.[agentId]?.[date]?.zone || "";
    },
    getNotes(agentId, date) {
      return this.form?.[agentId]?.[date]?.notes || "";
    },
    goToToday() {
      this.startOfWeek = moment().startOf("isoWeek").toDate();
      this.loadWeekData();
    },
    goToPrevWeek() {
      if (this.confirmDirty()) return;
      this.startOfWeek = moment(this.startOfWeek).subtract(1, "week").toDate();
      this.loadWeekData();
    },
    goToNextWeek() {
      if (this.confirmDirty()) return;
      this.startOfWeek = moment(this.startOfWeek).add(1, "week").toDate();
      this.loadWeekData();
    },
    confirmDirty() {
      if (Object.keys(this.dirtyCells).length > 0) {
        return !confirm("Hai modifiche non salvate. Vuoi continuare?");
      }
      return false;
    },
    async loadWeekData() {
      await this.fetchPlannings();
    },
    exportToCSV() {
      const headers = [
        "Agente",
        ...this.weekDays.map((d) => this.formatDayHeader(d.date)),
      ];
      const rows = this.filteredAgents.map((agent) => {
        const name = `${agent.cognome} ${agent.nome}`;
        const cells = this.weekDays.map(({ date }) => {
          const zone = this.getZone(agent.id, date);
          const notes = this.getNotes(agent.id, date);
          return `${zone}${notes ? ` (${notes})` : ""}`;
        });
        return [name, ...cells];
      });

      const csvContent = [headers, ...rows].map((r) => r.join(";")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pianificazione_settimana_${moment(
        this.startOfWeek
      ).format("YYYY-MM-DD")}.csv`;
      link.click();
    },
    getAgentName(id) {
      const agent = this.agents.find((a) => a.id === id);
      return agent ? `${agent.cognome || ""} ${agent.nome || ""}`.trim() : "";
    },

    openNotesModal(agentId, date) {
      const zone = this.getZone(agentId, date);
      if (!zone || zone === "ND") {
        this.$toast.error(
          "Devi prima salvare una zona valida prima di aggiungere una nota.",
          {
            position: "bottom-right",
            duration: 5000,
          }
        );
        return; // Interrompe l'esecuzione se la zona è vuota o "ND"
      }
      // Se la zona è valida, apri il modale
      this.noteModal.agentId = agentId;
      this.noteModal.date = date;
      this.noteModal.text = this.getNotes(agentId, date);
      this.noteModal.visible = true;
    },

    closeNoteModal() {
      this.noteModal.visible = false;
      this.noteModal.text = "";
    },

    saveNote() {
      this.updateNotes(
        this.noteModal.agentId,
        this.noteModal.date,
        this.noteModal.text || ""
      ); // salva anche nota vuota
      this.saveZone(this.noteModal.agentId, this.noteModal.date);
      this.closeNoteModal();
    },


    /* async setZoneToND(agentId, date) {
      const currentZone = this.getZone(agentId, date);

      if (currentZone === "ND") {
        // Reset del campo input e invio richiesta DELETE al backend
        try {
          const planningId = this.form[agentId][date]?.id; // Assumi che l'ID della pianificazione sia salvato qui
          if (planningId) {
            await axios.delete(`${process.env.VUE_APP_API_URL}/agents-planning/${planningId}`);
            this.$toast.success("Pianificazione eliminata con successo.", {
              position: "bottom-right",
              duration: 5000,
            });
          }
          this.updateZone(agentId, date, ""); // Resetta il campo input
          this.updateNotes(agentId, date, ""); // Resetta le note
        } catch (error) {
          console.error("❌ Errore durante l'eliminazione della pianificazione:", error);
          this.$toast.error("Errore durante l'eliminazione della pianificazione.", {
            position: "bottom-right",
            duration: 5000,
          });
        }
      } else {
        // Imposta "ND" come valore della zona
        this.updateZone(agentId, date, "ND");
        this.saveZone(agentId, date); // Salva i dati aggiornati
      }
    } */
    async setZoneToND(agentId, date) {
  const currentZone = this.getZone(agentId, date);

  if (currentZone === "ND") {
    // Reset del campo input e invio richiesta DELETE al backend
    try {
      const planningId = this.form[agentId][date]?.id; // Assumi che l'ID della pianificazione sia salvato qui
      if (planningId) {
        await axios.delete(`${process.env.VUE_APP_API_URL}/agents-planning/${planningId}`);
        this.$toast.success("Pianificazione eliminata con successo.", {
          position: "bottom-right",
          duration: 5000,
        });
      }
      this.updateZone(agentId, date, ""); // Resetta il campo input
      this.updateNotes(agentId, date, ""); // Resetta le note
    } catch (error) {
      console.error("❌ Errore durante l'eliminazione della pianificazione:", error);
      this.$toast.error("Errore durante l'eliminazione della pianificazione.", {
        position: "bottom-right",
        duration: 5000,
      });
    }
  } else {
    // Imposta "ND" come valore della zona e cancella le note
    this.updateZone(agentId, date, "ND");
    this.updateNotes(agentId, date, ""); // Cancella le note
    this.saveZone(agentId, date); // Salva i dati aggiornati
  }
}


  },
  async mounted() {
    await this.fetchAgents();
    this.saveDebounced = debounce(this.saveZone, 800);
    await this.loadWeekData();
  },
};
</script>
<style scoped>


.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px; /* Spaziatura tra gli elementi */
}

/* .filters {
  display: flex;
  float: left;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: flex-start;
  align-items: center; 
} */

.select-agent {
  padding: 8px 12px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
}

.select-agent:focus {
  border-color: #4caf50;
  outline: none;
}

.filters {
  display: flex;
  align-items: center;
  gap: 15px; /* Spaziatura tra il select e i pulsanti */
}

.week-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}




.table th,
.table td {
 
  text-align: center;
}

.table td:first-child {
  text-align: left;
}

.zone-cell {
  position: relative;
}

.zone-cell-inner {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.zone-input {
  width: 100%;
  padding: 6px;
  font-size: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.note-button {
  background-color: #f8f8f8;
  border: 1px solid #ccc;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.note-button.has-text {
  background-color: #e9ffe6;
  border-color: #71b095;
  color: #71b095;
}

.nd-button {
  background-color: #f8f8f8;
  border: 1px solid #ccc;
  color: #721c24;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.nd-button.active {
  background-color: #f8d7da; /* Rosso chiaro */
  border-color: #f5c6cb;
  color: #721c24;
}

.nd-button:hover {
  background-color: #f5c6cb;
  color: #721c24;
}

.note-modal textarea.notes-textarea {
  width: 100%;
  padding: 10px;
  font-size: 0.95rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  resize: vertical;
  background: #fcfcfc;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.btn-save {
  background-color: #4caf50;
  color: white;
}

.btn-cancel {
  background-color: white;
  color: #f44336;
  border: 1px solid #f44336;
}
</style>