<template>
  <div class="multiselect-field">
    <label class="field-label">{{ label }}</label>

    <MultiSelectCustom
      :model-value="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :options="options"
      :multiple="true"
      :close-on-select="false"
      :clear-on-select="false"
      :preserve-search="true"
      :custom-label="formatLabel"
      :track-by="trackBy"
      :placeholder="placeholder"
      :hide-selected="true"
      class="multiselect-custom"
    >
      <!-- 🔁 Traduzione -->
      <template #noOptions> Nessuna opzione disponibile </template>

      <template #noResult> Nessun risultato trovato </template>

      <template #tag="{ option, remove }">
        <span
          v-if="modelValue.length !== options.length"
          class="multiselect__tag tag-it"
        >
          {{ formatLabel(option) }}
          <i class="remove-tag" @click.stop="remove(option)">×</i>
        </span>
        <!-- Se è il caso "Tutti", lo slot selection mostra già, qui non serve -->
      </template>

      <!-- ✅ CUSTOM SLOT PER MOSTRARE "Tutti" -->
      <template #selection="{ values, remove }">
        <template v-if="values.length === options.length && options.length > 0">
          <!-- Mostra solo "Tutti" SENZA la X -->
          <span class="multiselect__single" style="cursor: default"> Tutti </span>
        </template>
        <template v-else>
          <span
            v-for="(option, index) in values"
            :key="index"
            class="multiselect__tag"
            @click="remove(option)"
            style="cursor: pointer"
          >
            {{ formatLabel(option) }}
          </span>
        </template>
      </template>
    </MultiSelectCustom>

    <div v-if="showControls" class="select-controls">
      <button type="button" class="control-btn" @click="selectAll">
        Tutti
      </button>
      <button type="button" class="control-btn" @click="clearAll">
        Deseleziona
      </button>
    </div>
  </div>
</template>

<script>

import MultiSelectCustom from "../_helpers/vue-multiselect-custom/Multiselect.vue";

export default {
  name: "MultiSelectField",
  components: { MultiSelectCustom },
  props: {
    label: String,
    modelValue: Array,
    options: Array,
    labelKey: { type: String, default: "label" },
    trackBy: { type: String, default: "id" },
    placeholder: { type: String, default: "Seleziona..." },
    showControls: { type: Boolean, default: true },
  },
  emits: ["update:modelValue"],
  methods: {
    formatLabel(option) {
      return option[this.labelKey];
    },
    selectAll() {
      this.$emit("update:modelValue", [...this.options]);
    },
    clearAll() {
      this.$emit("update:modelValue", []);
      this.$toast.show("Deselezionando tutti gli elementi la ricerca avverrà su tutti.", {
          type: "default",
          position: "bottom-right",
        });


    },
  },
};
</script>

<style scoped>
.multiselect__tag {
  background-color: #71b095;
  color: #fff;
  font-size: 13px;
  border-radius: 4px;
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  line-height: 1.4;
  margin-right: 5px;
}


.multiselect__tag:hover {
  background-color: #5c907f;
}

.multiselect__tag.all-selected {
  background-color: #71b095;
  color: #fff;
}

.multiselect__tag::after {
  content: " ×";
  margin-left: 6px;
  color: #fff;
}

.select-controls {
  display: flex;
  justify-content: flex-end; /* ⬅️ Pulsanti a DESTRA */
  gap: 8px;
  margin-top: 6px;
}

.control-btn {
  font-size: 13px;
  padding: 4px 10px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-family: "Poppins", sans-serif;
  transition: background 0.2s ease;
}

.control-btn:hover {
  background-color: #e0e0e0;
}
</style>
