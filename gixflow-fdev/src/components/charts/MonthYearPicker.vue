<template>
  <div class="month-year-picker">
    <select v-model="selectedMonth" @change="emitDate">
      <option v-for="(m, i) in months" :key="i" :value="i + 1">
        {{ m }}
      </option>
    </select>

    <select v-model="selectedYear" @change="emitDate">
      <option v-for="y in years" :key="y" :value="y">
        {{ y }}
      </option>
    </select>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/it";

export default {
  name: "MonthYearPicker",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const months = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    const selectedMonth = ref(1);
    const selectedYear = ref(dayjs().year());

    const years = computed(() => {
      const current = dayjs().year();
      return Array.from({ length: 5 }, (_, i) => current - 2 + i);
    });

    onMounted(() => {
      if (props.modelValue) {
        const [y, m] = props.modelValue.split("-");
        selectedYear.value = parseInt(y);
        selectedMonth.value = parseInt(m);
      }
    });

    function emitDate() {
      const m = String(selectedMonth.value).padStart(2, "0");
      emit("update:modelValue", `${selectedYear.value}-${m}`);
    }

    return {
      months,
      years,
      selectedMonth,
      selectedYear,
      emitDate,
    };
  },
};
</script>

<style scoped>
.month-year-picker {
  display: flex;
  gap: 12px;
}

select {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}
</style>