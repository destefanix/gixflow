<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Parametri Report<span v-if="reportName"> – {{ reportName }}</span></h2>
      <form @submit.prevent="submit">
        <!-- SCORCIATOIE PER LE DATE -->
        <div class="quick-range-buttons">
          <button
            type="button"
            @click="setYesterday"
            :class="{ active: activeQuickRange === 'yesterday' }"
          >
            Ieri
          </button>
          <button
            type="button"
            @click="setThisWeek"
            :class="{ active: activeQuickRange === 'thisWeek' }"
          >
            Settimana in corso
          </button>
          <button
            type="button"
            @click="setLastWeek"
            :class="{ active: activeQuickRange === 'lastWeek' }"
          >
            Settimana scorsa
          </button>
          <button
            type="button"
            @click="setCurrentMonth"
            :class="{ active: activeQuickRange === 'currentMonth' }"
          >
            Mese in corso
          </button>
          <button
            type="button"
            @click="setLastMonth"
            :class="{ active: activeQuickRange === 'lastMonth' }"
          >
            Mese precedente
          </button>
          <button
            type="button"
            @click="setLastThreeMonths"
            :class="{ active: activeQuickRange === 'lastThreeMonths' }"
          >
            Ultimi 3 mesi
          </button>
        </div>

        <label>
          Da:
          <flat-pickr
            v-model="form.from"
            :config="configDate"
            class="custom-datepicker"
          />
        </label>

        <label>
          A:
          <flat-pickr
            v-model="form.to"
            :config="configDate"
            class="custom-datepicker"
          />
        </label>

        <MultiSelectField
          v-if="filters.includes('agent')"
          v-model="form.agent_id"
          :options="agents"
          label="Agente:"
          labelKey="cognome_nome"
          trackBy="id"
          placeholder="Seleziona agenti"
        />

        <MultiSelectField
          v-if="filters.includes('operator')"
          v-model="form.operator_id"
          :options="enhancedOperators"
          label="Operatore:"
          labelKey="cognome_nome"
          trackBy="id"
          placeholder="Seleziona operatori"
        />

        <MultiSelectField
          v-if="filters.includes('location')"
          v-model="form.location_id"
          :options="locations"
          label="Sede:"
          labelKey="location"
          trackBy="id"
          placeholder="Seleziona sedi"
        />

        <MultiSelectField
          v-if="filters.includes('vendor')"
          v-model="form.vendor_id"
          :options="vendors"
          label="Vendor:"
          labelKey="name"
          trackBy="id"
          placeholder="Seleziona vendor"
        />

        <div class="modal-buttons">
          <button
            class="function-button-primary"
            type="submit"
            :disabled="loading"
          >
            Genera
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

import FlatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";

import MultiSelectField from "./MultiSelectField.vue";
//import "vue-multiselect/dist/vue-multiselect.min.css";

export default {
  props: ["filters", "loading", "reportName"],
  emits: ["generate", "close"],
  components: { FlatPickr, MultiSelectField },

  data() {
    const today = dayjs();
    return {
      form: {
        from: today.startOf("month").toDate(),
        to: today.endOf("month").toDate(),
        agent_id: [],
        operator_id: [],
        location_id: [],
        vendor_id: [],
      },
      rawAgents: [],
      operators: [],
      locations: [],
      vendors: [],
      configDate: {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        locale: Italian,
      },
      activeQuickRange: null,
      isQuickRangeSelection: false,
    };
  },

  computed: {
    agents() {
      return this.formatAndSort(
        this.rawAgents,
        "cognome",
        "nome",
        "cognome_nome"
      );
    },
    enhancedOperators() {
      return this.formatAndSort(
        this.operators,
        "cognome",
        "nome",
        "cognome_nome"
      );
    },
    enhancedVendors() {
      return this.sortByKey(this.vendors, "name");
    },
    enhancedLocations() {
      return this.sortByKey(this.locations, "location");
    },
  },

  async mounted() {
    const calls = [
      axios.get(`${process.env.VUE_APP_API_URL}/users`),
      axios.get(`${process.env.VUE_APP_API_URL}/locations-table`),
    ];

    if (this.filters.includes("vendor")) {
      calls.push(axios.get(`${process.env.VUE_APP_API_URL}/vendors`));
    }

    const [usersRes, locRes, vendorRes] = await Promise.all(calls);

    const allUsers = Array.isArray(usersRes.data) ? usersRes.data.flat() : [];

    this.rawAgents = allUsers.filter((u) => u.role_id === 2);
    this.operators = allUsers.filter((u) => u.role_id === 1);
    this.locations = locRes.data || [];

    if (this.filters.includes("vendor")) {
      this.vendors = vendorRes?.data || [];
    }

    // ✅ Pre-compila i multiselect con TUTTO selezionato
    if (this.filters.includes("agent")) {
      this.form.agent_id = [...this.agents]; // computed
    }
    if (this.filters.includes("operator")) {
      this.form.operator_id = [...this.enhancedOperators]; // computed
    }
    if (this.filters.includes("location")) {
      this.form.location_id = [...this.enhancedLocations]; // computed
    }
    if (this.filters.includes("vendor")) {
      this.form.vendor_id = [...this.enhancedVendors]; // computed
    }

    console.log("✅ Dati pre-caricati:", {
      agent_id: this.form.agent_id,
      operator_id: this.form.operator_id,
      location_id: this.form.location_id,
      vendor_id: this.form.vendor_id,
    });
  },

  watch: {
    form: {
      handler() {
        if (this.isQuickRangeSelection) return;
        this.activeQuickRange = null;
      },
      deep: true,
    },
  },

  methods: {
    onDateChanged() {
      if (this.isQuickRangeSelection) return;
      this.activeQuickRange = null;
    },
    resetQuickRange() {
      this.activeQuickRange = null;
    },

    customLabel(option) {
      return `${option.cognome} ${option.nome}`;
    },

    formatAndSort(array, key1, key2, targetKey) {
      return (array || [])
        .map((item) => ({
          ...item,
          [targetKey]: `${item[key1]} ${item[key2]}`,
        }))
        .sort((a, b) => a[targetKey].localeCompare(b[targetKey]));
    },

    sortByKey(array, key) {
      return (array || []).sort((a, b) =>
        (a[key] || "").localeCompare(b[key] || "")
      );
    },

    getAllOptionsByKey(key) {
      switch (key) {
        case "agent_id":
          return this.agents;
        case "operator_id":
          return this.enhancedOperators;
        case "location_id":
          return this.enhancedLocations;
        case "vendor_id":
          return this.enhancedVendors;
        default:
          return [];
      }
    },

    submit() {
      const payload = { ...this.form };

      // 👉 PRIMA della trasformazione in ID
      console.log("🔍 form.operator_id (prima):", this.form.operator_id);

      ["agent_id", "operator_id", "location_id", "vendor_id"].forEach((key) => {
        if (Array.isArray(payload[key])) {
          if (payload[key].length === 0) {
            // 🔁 Se è vuoto ma abbiamo opzioni disponibili, interpreta come "Tutti"
            const allOptions = this.getAllOptionsByKey(key);
            payload[key] = allOptions.map((item) => item.id);
          } else {
            payload[key] = payload[key].map((item) => item.id);
          }
        }
      });

      // 👉 DOPO la trasformazione
      console.log("📤 payload finale:", payload);

      if (payload.from) {
        payload.from = dayjs(payload.from)
          .startOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
      }

      if (payload.to) {
        payload.to = dayjs(payload.to)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
      }

      Object.keys(payload).forEach(
        (key) =>
          (payload[key] == null ||
            payload[key] === "" ||
            payload[key]?.length === 0) &&
          delete payload[key]
      );

      this.$emit("generate", payload);
    },

    setYesterday() {
      this.isQuickRangeSelection = true;
      const yesterday = dayjs().subtract(1, "day");
      this.form.from = yesterday.startOf("day").toDate();
      this.form.to = yesterday.endOf("day").toDate();
      this.activeQuickRange = "yesterday";
      this.$nextTick(() => {
        setTimeout(() => {
          this.isQuickRangeSelection = false;
        }, 0);
      });
    },

    setThisWeek() {
      this.isQuickRangeSelection = true;
      const start = dayjs().startOf("isoWeek"); // Lunedì questa settimana
      const end = dayjs().endOf("isoWeek"); // Domenica questa settimana
      this.form.from = start.startOf("day").toDate();
      this.form.to = end.endOf("day").toDate();
      this.activeQuickRange = "thisWeek";
      this.$nextTick(() => {
        setTimeout(() => {
          this.isQuickRangeSelection = false;
        }, 0);
      });
    },

    setLastWeek() {
      this.isQuickRangeSelection = true;
      const start = dayjs().startOf("isoWeek").subtract(1, "week"); // Lunedì scorso
      const end = dayjs().endOf("isoWeek").subtract(1, "week"); // Domenica scorsa
      this.form.from = start.startOf("day").toDate();
      this.form.to = end.endOf("day").toDate();
      this.activeQuickRange = "lastWeek";
      this.$nextTick(() => {
        setTimeout(() => {
          this.isQuickRangeSelection = false;
        }, 0);
      });
    },

    setCurrentMonth() {
      this.isQuickRangeSelection = true;
      const today = dayjs();
      this.form.from = today.startOf("month").toDate();
      this.form.to = today.endOf("month").toDate(); // 👈 FIX QUI
      this.activeQuickRange = "currentMonth";
      this.$nextTick(() => {
        setTimeout(() => {
          this.isQuickRangeSelection = false;
        }, 0);
      });
    },

    setLastMonth() {
      this.isQuickRangeSelection = true;
      const lastMonth = dayjs().subtract(1, "month");
      this.form.from = lastMonth.startOf("month").toDate();
      this.form.to = lastMonth.endOf("month").toDate();
      this.activeQuickRange = "lastMonth";
      this.$nextTick(() => {
        setTimeout(() => {
          this.isQuickRangeSelection = false;
        }, 0);
      });
    },

    setLastThreeMonths() {
      this.isQuickRangeSelection = true;
      const today = dayjs();
      const start = today.subtract(2, "month").startOf("month"); // Due mesi fa
      const end = today.endOf("day"); // Fino ad ora
      this.form.from = start.toDate();
      this.form.to = end.toDate();
      this.activeQuickRange = "lastThreeMonths";
      this.$nextTick(() => {
        setTimeout(() => {
          this.isQuickRangeSelection = false;
        }, 0);
      });
    },
  },
};
</script>

<style scoped>
.quick-range-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.2rem;
}

.quick-range-buttons button {
  padding: 4px 10px;
  font-size: 0.85rem;
  background-color: #71b095;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.quick-range-buttons button:hover {
  background-color: #5c907f;
}

.quick-range-buttons button.active {
  background-color: #34495e;
  color: white;
  font-weight: bold;
}
</style>
