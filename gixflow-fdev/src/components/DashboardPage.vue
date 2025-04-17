<template>
  <div class="header">
    <!-- <h1><i class="fa-solid fa-calendar-check icon-green"></i>Dashboard</h1> -->
    <div class="actions">
      <!-- <button class="create-button" @click="openCreateModal">+</button>
        <button class="csv-button" @click="exportAppointments">CSV</button> -->
      <div class="filter-bar">
        <label>Periodo:</label>

        <!-- <flat-pickr v-model="selectedMonth" :config="configMonth" /> --> 

        <!-- <input
          type="month"
          v-model="selectedMonth"
          @change="fetchAllData"
          class="month-picker"
        /> -->
        <MonthYearPicker v-model="selectedMonth" />
      </div>
    </div>
  </div>

  <div class="dashboard">
    <h3>Rese orarie per sede</h3>

    <div class="sparkline-grid">
      <SparkBox
        v-for="(stat, idx) in hourlyYieldStats"
        :key="idx"
        :title="`${parseFloat(stat.yield).toFixed(2)} app/h`"
        :subtitle="stat.location"
        :data="[stat.hours, stat.appointments, stat.yield]"
        :color="getColorByIndex(idx)"
        :class="`spark-${idx}`"
      />
    </div>

    <div class="charts-container">
      <!-- LOGIN PER SEDE (MONTH)-->
      <div class="chart wide-3">
        <apexchart
          type="bar"
          height="250"
          :options="loginHeatmapOptions"
          :series="loginHeatmapSeries"
        ></apexchart>
        <!-- <h1>Ore Login per sede</h1> -->
      </div>

      <!-- UTENTI ATTIVI AS IS -->
      <div class="chart">
        <apexchart
          type="bar"
          height="250"
          :options="usersStackedBarOptions"
          :series="usersStackedBarSeries"
        />
        <!-- <p>Utenti attivi per ruolo e sede</p> -->
      </div>

      <!-- APP PER SEDE -->
      <div class="chart wide-3">
        <apexchart
          type="area"
          height="250"
          :options="appointmentsHeatmapOptions"
          :series="appointmentsHeatmapSeries"
        />
      </div>

      <!-- CONVERSIONI PER SEDE (MESE) -->
      <div class="chart">
        <apexchart
          type="bar"
          height="320"
          :options="conversionChartOptions"
          :series="conversionChartSeries"
        />
      </div>

      <!-- TREEMAP: CONTRATTI PER VENDOR (MENSILE) -->
      <div class="chart">
        <apexchart
          type="treemap"
          height="300"
          :options="contractsVendorTreemapOptions"
          :series="contractsVendorTreemapSeries"
        />
      </div>

      <!-- APPORTO CONVERSIONI PER SEDE (MESE) -->
      <div class="chart">
        <apexchart
          type="donut"
          height="250"
          :options="conversionsDonutOptions"
          :series="conversionsDonutSeries"
        />
      </div>

      <!-- CONTRATTI ATTIVATI PER AGENTI (MESE) -->
      <div class="chart wide-2">
        <apexchart
          type="line"
          height="250"
          :options="contractsLineOptions"
          :series="contractsLineSeries"
        />
        <!-- <p>Contratti attivati per agente (settimanale)</p> -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

import dayjs from "dayjs";
import "dayjs/locale/it";
dayjs.locale("it");

import { defineComponent } from "vue";
import VueApexCharts from "vue3-apexcharts";
import SparkBox from "@/components/charts/SparkBox.vue";
import MonthYearPicker from "@/components/charts/MonthYearPicker.vue";




import "@/styles/global.css";
import "@/styles/toast.css";

/* import { ref } from "vue";
import FlatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.min.css";
import { Italian } from "flatpickr/dist/l10n/it.js";
import "flatpickr/dist/plugins/monthSelect/style.css";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/themes/airbnb.css";
 */
export default defineComponent({
  name: "DashboardPage",

  components: {
   // FlatPickr,
   MonthYearPicker,
    apexchart: VueApexCharts,
    SparkBox,
  },

  /* setup() {
    const configMonth = ref({
      altInput: true,
      altFormat: "F Y", // es: "Aprile 2025"
      dateFormat: "Y-m", // es: "2025-04"
      locale: Italian,
      plugins: [
        new monthSelectPlugin({
          shorthand: false, // mostra "Aprile" invece di "Apr"
          dateFormat: "Y-m", // valore inviato a v-model / DB
          altFormat: "F Y", // valore visivo all'utente
          theme: "dark", // o "dark"
        }),
      ],
    });

    return { configMonth };
  }, */

  data() {
    return {
      // LOGIN PER SEDE
      loginHeatmapOptions: {
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "13px",
          fontWeight: 500,
          markers: {
            width: 12,
            height: 12,
            radius: 4,
          },
          floating: false,
          offsetY: -40,
        },
        chart: { type: "bar", stacked: true, toolbar: { show: false } },
        title: {
          text: "Login per sede",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati al mese selezionato",
          align: "left",
          margin: 10,
          offsetX: 0,
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        xaxis: {
          type: "category",

          labels: {
            style: { fontSize: "13px" },
            formatter: (val) => dayjs(val, "YYYY-MM-DD").format("DD MMM"),
          },
        },
        yaxis: {
          // title: { text: "Sedi", style: { fontWeight: "bold" } },
          labels: { style: { fontSize: "13px" } },
        },
        dataLabels: { enabled: false },
        colors: ["#c35573", "#71b095", "#34495e"],
      },

      // UTENTI ATTIVI AS IS
      usersStackedBarOptions: {
        chart: {
          stacked: true,
          toolbar: { show: false },
        },
        title: {
          text: "Utenti attivi",
          align: "left",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati in real time",
          align: "left",
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            dataLabels: {
              position: "center",
            },
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            colors: ["#fff"],
          },
        },
        xaxis: {
          title: {
            // text: "Utenti Attivi",
            style: { fontWeight: "bold" },
          },
          labels: {
            style: { fontSize: "13px" },
          },
        },
        yaxis: {
          categories: [],
          title: {
            //  text: "Sedi",
            style: { fontWeight: "bold" },
          },
          labels: {
            style: { fontSize: "13px" },
          },
        },

        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "13px",
          fontWeight: 500,
          markers: {
            width: 12,
            height: 12,
            radius: 4,
          },
          floating: false,
          offsetY: -40,
        },
        colors: ["#c35573", "#34495e", "#8e24aa"],
      },

      // APPUNTAMENTI PER SEDE
      appointmentsHeatmapOptions: {
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "13px",
          fontWeight: 500,
          markers: {
            width: 12,
            height: 12,
            radius: 4,
          },
          floating: false,
          offsetY: -40,
        },
        chart: {
          type: "area",
          stacked: true,
          toolbar: { show: false },
        },
        title: {
          text: "Appuntamenti per sede",
          align: "left",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati al mese selezionato",
          align: "left",
          margin: 10,
          offsetX: 0,
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        xaxis: {
          type: "datetime",
          // title: { text: "Giorni", style: { fontWeight: "bold" } },
          labels: {
            format: "dd MMM", // es: "12 Mar"
            style: { fontSize: "12px" },
          },
        },

        yaxis: {
          // title: { text: "Appuntamenti", style: { fontWeight: "bold" } },
        },

        stroke: {
          curve: "smooth",
          width: 2,
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.5,
            opacityTo: 0.2,
            stops: [0, 90, 100],
          },
        },
        colors: ["#c35573", "#71b095", "#34495e"], // personalizzabile
      },

      // CONVERSIONI PER SEDE
      conversionChartOptions: {
        chart: {
          type: "bar",
          stacked: false,
          toolbar: { show: true },
        },
        title: {
          text: "% Conversione per sede",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati al mese selezionato",
          align: "left",
          margin: 10,
          offsetX: 0,
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        xaxis: {
          categories: [],
          // title: { text: "Sedi", style: { fontWeight: "bold" } },
          labels: { style: { fontSize: "13px" } },
        },
        yaxis: {
          // title: { text: "% Conversione", style: { fontWeight: "bold" } },
          labels: {
            formatter: (val) => `${val.toFixed(1)}%`,
          },
        },
        tooltip: {
          y: {
            formatter: function (val, { seriesIndex, dataPointIndex, w }) {
              const vendor = w.globals.seriesNames[seriesIndex];
              const locationLabel = w.config.xaxis.categories[dataPointIndex];
              return `${vendor} @ ${locationLabel}: ${val.toFixed(1)}%`;
            },
          },
        },

        plotOptions: {
          bar: { horizontal: false },
        },
        legend: { position: "bottom" },
        fill: { opacity: 1 },
        colors: ["#c35573", "#71b095", "#34495e", "#ff8c00", "#17a2b8"], // palette
      },

      // CONTRATTI PER VENDOR
      contractsVendorTreemapOptions: {
        chart: {
          type: "treemap",
          toolbar: { show: false },
        },
        title: {
          text: "Contratti per vendor (mensile)",
          align: "left",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati al mese selezionato",
          align: "left",
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        colors: [
          "#71b095",
          "#34495e",
          "#c35573",
          "#ff8c00",
          "#20c997",
          "#007bff",
          "#e83e8c",
          "#ffc107",
          "#6f42c1",
        ],
        dataLabels: {
          enabled: true,
          style: {
            fontSize: "14px",
            colors: ["#fff"],
          },
          formatter: function (text, opt) {
            return `${text}: ${
              opt.w.globals.series[opt.seriesIndex][opt.dataPointIndex]
            }`;
          },
        },
        plotOptions: {
          treemap: {
            distributed: true,
            enableShades: true,
            shadeIntensity: 0.4,
          },
        },
      },

      conversionsDonutOptions: {
        labels: [],
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "13px",
          fontWeight: 500,
          markers: {
            width: 12,
            height: 12,
            radius: 4,
          },
          floating: false,
          offsetY: -15,
        },
        title: {
          text: "Conversioni per sede",
          align: "left",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati al mese selezionato",
          align: "left",
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        colors: ["#c35573", "#71b095", "#34495e"],
      },

      contractsLineOptions: {
        chart: {
          id: "contracts-line",
          toolbar: { show: false },
        },
        title: {
          text: "Contratti attivati per agente (settimanale)",
          align: "left",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "inherit",
          },
        },
        subtitle: {
          text: "Dati aggiornati al mese selezionato",
          align: "left",
          style: {
            fontSize: "14px",
            color: "#666",
          },
        },
        xaxis: {
          categories: [],
          title: { text: "Settimana", style: { fontWeight: "bold" } },
          labels: { style: { fontSize: "13px" } },
        },
        yaxis: {
          title: { text: "Numero contratti", style: { fontWeight: "bold" } },
          labels: { style: { fontSize: "13px" } },
        },
        stroke: { curve: "smooth" },
        legend: {
          position: "top",
          horizontalAlign: "right",
          fontSize: "13px",
          fontWeight: 500,
          markers: {
            width: 12,
            height: 12,
            radius: 4,
          },
          floating: false,
          offsetY: -40,
        },        colors: ["#c35573", "#71b095", "#34495e"],
      },

      selectedMonth: dayjs().format("YYYY-MM"),

      loginHeatmapSeries: [],
      usersStackedBarSeries: [],
      appointmentsHeatmapSeries: [],
      conversionChartSeries: [],
      contractsVendorTreemapSeries: [],
      conversionsDonutSeries: [],
      contractsLineSeries: [],

      hourlyYieldStats: [],
    };
  },

  mounted() {
    this.fetchAllData();
    this.fetchActiveUsersSummary();
  },

  methods: {
    async fetchLoginSummary(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/ast/login-summary`,
          { params: { month } }
        );

        const grouped = {};

        data.forEach(({ location, date, total_hours }) => {
          if (!grouped[location]) grouped[location] = [];
          grouped[location].push({ x: date, y: total_hours });
        });

        this.loginHeatmapSeries = Object.entries(grouped).map(
          ([location, data]) => ({ name: location, data })
        );
      } catch (err) {
        console.error("Errore nel recupero login summary:", err);
      }
    },

    async fetchPositiveAppointmentsMonthlySummary(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/positive-appointments/daily-summary`,
          { params: { month } }
        );

        if (!data || data.length === 0) {
          this.posAppointmentsHeatmapSeries = [];
          console.warn("⚠️ Nessun dato disponibile per il mese:", month);
          return;
        }

        // Step 1: genera tutti i giorni del mese selezionato
        const { startDate, endDate } = this.getStartEndDate(month);
        const allDaysInMonth = [];
        let current = dayjs(startDate);

        while (current.isBefore(endDate) || current.isSame(endDate)) {
          allDaysInMonth.push(current.format("YYYY-MM-DD"));
          current = current.add(1, "day");
        }

        // Step 2: raggruppa i dati per location
        const grouped = {};

        data.forEach(({ date, location, total }) => {
          if (!grouped[location]) grouped[location] = {};
          grouped[location][date] = total;
        });

        // Step 3: costruisci la serie completa per ogni sede
        this.posAppointmentsHeatmapSeries = Object.entries(grouped).map(
          ([location, dateMap]) => ({
            name: location,
            data: allDaysInMonth.map((date) => ({
              x: date,
              y: dateMap[date] || 0,
            })),
          })
        );
      } catch (err) {
        console.error("❌ Errore nel fetch app positivi per sede:", err);
      }
    },

    async fetchAppointmentsMonthlySummary(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/appointments/daily-summary`,
          { params: { month } }
        );

        if (!data || data.length === 0) {
          this.appointmentsHeatmapSeries = [];
          console.warn("⚠️ Nessun dato disponibile per il mese:", month);
          return;
        }

        // Step 1: genera tutti i giorni del mese selezionato
        const { startDate, endDate } = this.getStartEndDate(month);
        const allDaysInMonth = [];
        let current = dayjs(startDate);

        while (current.isBefore(endDate) || current.isSame(endDate)) {
          allDaysInMonth.push(current.format("YYYY-MM-DD"));
          current = current.add(1, "day");
        }

        // Step 2: raggruppa i dati per location
        const grouped = {};

        data.forEach(({ date, location, total }) => {
          if (!grouped[location]) grouped[location] = {};
          grouped[location][date] = total;
        });

        // Step 3: costruisci la serie completa per ogni sede
        this.appointmentsHeatmapSeries = Object.entries(grouped).map(
          ([location, dateMap]) => ({
            name: location,
            data: allDaysInMonth.map((date) => ({
              x: date,
              y: dateMap[date] || 0,
            })),
          })
        );
      } catch (err) {
        console.error("❌ Errore nel fetch app per sede:", err);
      }
    },

    async fetchConversionsSummary(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/appointments/conversions-summary`,
          { params: { month } }
        );

        // Serie dati
        this.conversionsDonutSeries = data.map((item) => item.total);

        // 💥 Triggera aggiornamento reactive delle labels
        this.conversionsDonutOptions = {
          ...this.conversionsDonutOptions,
          labels: data.map((item) => item.location),
        };
      } catch (err) {
        console.error("Errore nel fetch conversion summary:", err);
      }
    },

    async fetchActiveUsersSummary() {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/users/active-summary`
        );

        const rolesSet = new Set();
        const locationsSet = new Set();
        const tempMatrix = {};

        data.forEach(({ location, role, total }) => {
          rolesSet.add(role);
          locationsSet.add(location);
          if (!tempMatrix[role]) tempMatrix[role] = {};
          tempMatrix[role][location] = total;
        });

        const roles = Array.from(rolesSet);
        this.locations = Array.from(locationsSet).filter(Boolean);

        // aggiorniamo correttamente le categorie (sedi)
        this.usersStackedBarOptions = {
          ...this.usersStackedBarOptions,
          yaxis: {
            ...this.usersStackedBarOptions.yaxis,
            categories: this.locations,
          },
        };

        // dati della serie
        this.usersStackedBarSeries = roles.map((role) => ({
          name: role,
          data: this.locations.map((loc) => tempMatrix[role][loc] || 0),
        }));
      } catch (err) {
        console.error("Errore nel fetch utenti attivi per ruolo/sede:", err);
      }
    },

    async fetchContractsPerAgent(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/contracts/weekly-agent-summary`,
          { params: { month } }
        );

        const agentsSet = new Set();
        const weeksSet = new Set();
        const matrix = {};

        data.forEach(({ agent, week, total }) => {
          agentsSet.add(agent);
          weeksSet.add(week);
          if (!matrix[agent]) matrix[agent] = {};
          matrix[agent][week] = total;
        });

        const sortedWeeks = Array.from(weeksSet).sort((a, b) => a - b);
        this.contractsLineOptions.xaxis.categories = sortedWeeks.map(
          (w) => `W${w}`
        );

        this.contractsLineSeries = Array.from(agentsSet).map((agent) => ({
          name: agent,
          data: sortedWeeks.map((week) => matrix[agent][week] || 0),
        }));
      } catch (err) {
        console.error("Errore nel fetch contratti per agente:", err);
      }
    },

    async fetchSPH() {
      const month = this.selectedMonth;
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/contracts/sphbylocation`,
          { params: { month } }
        );
        this.hourlyYieldStats = data;
      } catch (err) {
        console.error("❌ Errore nel recupero resa oraria per sede:", err);
      }
    },

    async fetchVendorContractsTreemap(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/contracts/monthly-vendor-summary`,
          { params: { month } }
        );

        this.contractsVendorTreemapSeries = [
          {
            data: data.map((item) => ({
              x: item.vendor,
              y: item.total,
            })),
          },
        ];
      } catch (err) {
        console.error("Errore fetch contracts per vendor (treemap):", err);
      }
    },

    async fetchConversionRateByLocationAndVendor(month) {
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_API_URL}/db/appointments/conversion-rate-by-location-vendor`,
          { params: { month } }
        );

        const locationSet = new Set();
        const vendorSet = new Set();
        const grouped = {};

        data.forEach(({ location, vendor, conversion }) => {
          locationSet.add(location);
          vendorSet.add(vendor);
          if (!grouped[vendor]) grouped[vendor] = {};
          grouped[vendor][location] = conversion;
        });

        const locations = Array.from(locationSet).sort(); // <--- Questa va usata come xaxis.categories
        const vendors = Array.from(vendorSet).sort();

        // 🧠 FIX: imposta le vere sedi come etichette sull'asse X
        this.conversionChartOptions = {
          ...this.conversionChartOptions,
          xaxis: {
            ...this.conversionChartOptions.xaxis,
            categories: locations,
          },
        };

        // Serie corretta
        this.conversionChartSeries = vendors.map((vendor) => ({
          name: vendor,
          data: locations.map((loc) => grouped[vendor]?.[loc] || 0),
        }));
      } catch (err) {
        console.error("❌ Errore fetch conversioni per sede/vendor:", err);
      }
    },

    getStartEndDate(month) {
      const [year, m] = month.split("-");
      const startDate = `${year}-${m}-01`;
      const endDate = new Date(year, m, 0).toISOString().split("T")[0]; // last day
      return { startDate, endDate };
    },

    formatDate(date) {
      return dayjs(date).format("DD-MM-YYYY");
    },

    fetchAllData() {
      const month = this.selectedMonth;

      Promise.all([
        this.fetchLoginSummary(month),
        this.fetchConversionsSummary(month),
        this.fetchAppointmentsMonthlySummary(month),
        this.fetchPositiveAppointmentsMonthlySummary(month),
        this.fetchContractsPerAgent(month),
        this.fetchVendorContractsTreemap(month),
        this.fetchSPH(),
        this.fetchConversionRateByLocationAndVendor(month),
      ]).catch((err) => console.error("Errore fetchAllData:", err));
    },
  },
  computed: {
    getColorByIndex() {
      return (index) => {
        const colors = ["#c35573", "#71b095", "#34495e"];
        return colors[index % colors.length];
      };
    },
  },

  watch: {
    selectedMonth() {
      this.fetchAllData();
    },
  },
});
</script>

<style scoped>
/* Contenitore Dashboard */
.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.chart {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.07);
  text-align: center;
  /* transition: all 0.2s ease-in-out; */
}

.chart:hover {
  /* transform: scale(1.01); */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 2 colonne */
.wide-2 {
  grid-column: span 2;
}
/* 3 colonne */
.wide-3 {
  grid-column: span 3;
}
/* Full width (4 su 4) */
.wide-4 {
  grid-column: span 4;
}

.full-width {
  grid-column: span 5;
}

.month-picker {
  padding: 6px 12px;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  color: #333;
}


h1 {
  text-align: center;
  color: #343a40;
  font-size: 2rem;
  margin-bottom: 40px;
}

p {
  margin-top: 12px;
  font-weight: 500;
  color: #555;
}

.filter-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
}

.filter-bar label {
  font-weight: bold;
  color: #343a40;
}

.filter-bar input[type="month"] {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  font-size: 1rem;
}

/* .sparkline-grid {
  display: grid;
  max-width: 75%;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  padding-bottom: 24px;
} */

.sparkline-grid {
  display: grid;
  max-width: 75%; /* Mantiene la larghezza massima */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Riduce la larghezza minima */
  gap: 12px; /* Riduce lo spazio tra gli elementi */
  padding-bottom: 16px; /* Riduce il padding inferiore */

}

.spark-0 {
  background: linear-gradient(135deg, #c35573 0%, #f7d4dd 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(195, 85, 115, 0.25);
  transition: transform 0.2s ease;
}

.spark-1 {
  background: linear-gradient(135deg, #71b095 0%, #d8f0e3 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(113, 176, 149, 0.25);
  transition: transform 0.2s ease;
}

.spark-2 {
  background: linear-gradient(135deg, #34495e 0%, #cfd8dc 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(52, 73, 94, 0.25);
  transition: transform 0.2s ease;
}

/* Glow + hover effect per un tocco in più */
[class^="spark-"]:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

/* Override stile interno del componente SparkBox se serve */
[class^="spark-"] :deep(h2),
[class^="spark-"] :deep(p) {
  color: white !important;

}

/* fallback per altri sparkline se mai ne avrai di più */
[class^="spark-"] {
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}


@media (max-width: 768px) {
  /* Contenitore griglie chart */
  .charts-container {
    grid-template-columns: 1fr !important;
    padding: 0 8px;
    gap: 16px;
  }

  .chart {
    padding: 16px;
    font-size: 14px;
  }

  /* Override larghezza colonne */
  .wide-2,
  .wide-3,
  .wide-4,
  .full-width {
    grid-column: span 1 !important;
  }

  /* Titolo */
  h1 {
    font-size: 1.4rem;
    margin-bottom: 20px;
  }

  /* Paragrafi */
  p {
    font-size: 0.9rem;
    margin-top: 8px;
  }

  /* Barra dei filtri */
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 20px;
  }

  .filter-bar input[type="month"] {
    width: 100%;
    font-size: 0.95rem;
  }

  /* Sparkline wrapper */
  .sparkline-grid {
    grid-template-columns: 1fr;
    max-width: 100%;
    gap: 16px;
  }

  [class^="spark-"] {
    padding: 16px;
    
  }

  [class^="spark-"]:hover {
    transform: none;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  }

  /* Spark titles override (fallback per sicurezza) */
  [class^="spark-"] :deep(h2) {
    font-size: 1.1rem;
  }

  [class^="spark-"] :deep(p) {
    font-size: 0.9rem;
  }
}

</style>
