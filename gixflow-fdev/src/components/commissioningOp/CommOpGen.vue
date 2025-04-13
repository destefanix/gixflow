<template>

  <div class="header">
    <h3><i class="fa-solid fa-calendar-days icon-green"></i>Imposta Generazione Automatica</h3>
    <div class="actions">
    </div>
  </div>

  <div class="auto-generate-row">
    <label class="checkbox-label">
      <input
        type="checkbox"
        v-model="autoGenerateEnabled"
        class="big-checkbox"
      />
      <span>Abilita Generazione Automatica</span>
    </label>

    <label v-if="autoGenerateEnabled" class="time-label">
      Orario di esecuzione:
      <input type="time" v-model="autoGenerateTime" class="time-input" />
    </label>

    <button @click="saveAutoGenerateSettings" class="saveITEM-button">
      Salva
    </button>
  </div>
  <pre>
Tramite questo strumento è possibile schedulare la sincronizzazione automatica da Asterisk. Essa verrà eseguita per tutte le sedi disponibili.</pre
  >
  <!--   </div>  -->

  <!-- Separatore -->
  <hr class="section-divider" />

  <div>
    <h3><i class="fa-solid fa-clock icon-green"></i>Genera Ore da Asterisk</h3>

    <!-- Sezione Generazione Manuale -->
    <div class="manual-generate">
      <!-- <label class="label">
        Data:
        <input type="date" v-model="selectedDate" class="input" />
      </label> -->
      <label>
        Dal:
        <input type="date" v-model="startDate" class="input" />
      </label>
      <label>
        Al:
        <input type="date" v-model="endDate" class="input" />
      </label>
      <label>
        Sede:
        <select v-model="selectedLocation">
          <option value="">Tutte</option>
          <option
            v-for="location in locations"
            :key="location.id"
            :value="location.id"
          >
            {{ location.location }}
          </option>
        </select>
      </label>
      <button
        @click="generatePreview"
        :disabled="loading"
        class="saveITEM-button"
      >
        Genera Anteprima
      </button>
    </div>

    <p v-if="loading">Caricamento in corso...</p>

    <table v-if="hours.length > 0" class="table">
      <thead>
        <tr>
          <th>Operatore</th>
          <th>Chiamate</th>
          <th>Login (h)</th>
          <th>Attesa (h)</th>
          <th>Parlato (h)</th>
          <th>Dispo (h)</th>
          <th>Pausa (h)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="h in hours" :key="h.user_id">
          <td>{{ h.operator_name || "Sconosciuto" }}</td>
          <td>{{ h.calls }}</td>
          <td>{{ h.login }} h</td>
          <td>{{ h.wait }} h</td>
          <td>{{ h.talk }} h</td>
          <td>{{ h.dispo }} h</td>
          <td>{{ h.pause }} h</td>
        </tr>
      </tbody>
    </table>

    <pre
      v-if="feedbackDetails"
      style="
        margin-top: 20px;
        background: #f4f4f4;
        padding: 10px;
        border-radius: 5px;
      "
    >
  {{ feedbackDetails }}
</pre
    >

    <div v-if="hours.length > 0" class="actions">
      <button
        @click="saveHours"
        :disabled="!canSave || saving"
        class="saveITEM-button"
      >
        Salva Ore
      </button>
      <button @click="resetPreview" class="resetITEM-button">Reset</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import "@/styles/global.css";

export default {
  data() {
    return {
      // selectedDate: new Date().toISOString().split("T")[0],
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      hours: [],
      loading: false,
      saving: false,
      canSave: false,
      feedbackDetails: "",
      selectedLocation: "",
      locations: [],

      // Variabili per la generazione automatica
      autoGenerateEnabled: false,
      autoGenerateTime: "03:00",
    };
  },
  methods: {
    async generatePreview() {
      this.loading = true;
      this.hours = [];
      this.canSave = false;

      try {
        const { data } = await axios.post(
          `${process.env.VUE_APP_API_URL}/ast/fetch-timelogs`,
          {
            start_date: this.startDate,
            end_date: this.endDate,
            location_id: this.selectedLocation, // 👈 passiamo la sede
          }
        );

        if (Array.isArray(data) && data.length > 0) {
          this.hours = data;
          this.canSave = true;
        } else {
          this.$toast.show(
            "Nessun dato disponibile per l'intervallo selezionato.",
            { type: "error" }
          );
        }
      } catch (error) {
        this.$toast.show("Errore nel recupero dei dati.", { type: "error" });
      } finally {
        this.loading = false;
      }
    },

    async saveHours() {
      if (!this.canSave || this.hours.length === 0) {
        this.$toast.show("Nessun dato da salvare.", { type: "error" });
        return;
      }

      this.saving = true;

      try {
        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/ast/save-hours`,
          {
            hours: this.hours,
          }
        );

        this.$toast.show("Ore salvate con successo.", { type: "success" });
        this.resetPreview();

        const { inserted = [], skipped = [] } = response.data;

        if (skipped.length > 0) {
          const skippedList = skipped
            .sort((a, b) =>
              (a.date + a.user_id).localeCompare(b.date + b.user_id)
            )
            .map((item) => `- Utente ID ${item.user_id}, Data ${item.date}`)
            .join("\n");

          this.feedbackDetails = `
✅ Salvati ${inserted.length} record.
⚠️ Ignorati ${skipped.length} già presenti:\n${skippedList}
      `;
        } else {
          this.feedbackDetails = `✅ Tutti i ${inserted.length} timelog sono stati salvati.`;
        }
      } catch (error) {
        this.$toast.show("Errore nel salvataggio.", { type: "error" });
      } finally {
        this.saving = false;
      }
    },

    resetPreview() {
      this.hours = [];
      this.canSave = false;
    },

    async fetchLocations() {
      try {
        const res = await axios.get(
          `${process.env.VUE_APP_API_URL}/locations-table`
        );
        this.locations = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error("Errore nel recupero delle sedi", error);
      }
    },

    async saveAutoGenerateSettings() {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/settings/update`, {
          key_name: "auto_generate_timelog",
          value: JSON.stringify({
            enabled: this.autoGenerateEnabled,
            time: this.autoGenerateTime,
          }),
        });

        this.$toast.show("Impostazioni aggiornate con successo.", {
          position: "bottom-right",
          duration: 5000,
          type: "success",
        });
      } catch (error) {
        this.$toast.show("Errore nell'aggiornamento delle impostazioni.", {
          position: "bottom-right",
          duration: 5000,
          type: "error",
        });
      }
    },

    async loadAutoGenerateSettings() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/settings/get?key=auto_generate_timelog`
        );
        if (response.data.value) {
          const config = JSON.parse(response.data.value);
          this.autoGenerateEnabled = config.enabled;
          this.autoGenerateTime = config.time;
        }
      } catch (error) {
        console.error("Errore nel caricamento delle impostazioni");
      }
    },
  },

  mounted() {
    this.loadAutoGenerateSettings();
    this.loadAutoGenerateSettings();
    this.fetchLocations();
  },
};
</script>

<style scoped>
/* --- GENERALE --- */
.section-divider {
  margin: 30px 0;
  border: none;
  border-top: 2px solid #ddd;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* --- SEZIONE MANUALE --- */
.manual-generate {
  display: flex;
  align-items: center;
  gap: 10px;
}

.label {
  font-weight: bold;
}

.input {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

/* --- SEZIONE AUTOMATICA --- */
.auto-generate {
  background: #f9f9f9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.auto-generate-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* --- CHECKBOX --- */
.big-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #71b095;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  gap: 8px;
}

/* --- ORARIO --- */
.time-label {
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  width: 120px;
  text-align: center;
}
</style>
