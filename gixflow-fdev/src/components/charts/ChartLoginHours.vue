<template>
    <div class="chart wide-2">
      <h2>Ore Login per sede</h2>
  
      <apexchart
        type="bar"
        height="300"
        :options="chartOptions"
        :series="series"
      />
  
      <div v-if="!hasData" class="no-data">Dati non disponibili per il periodo</div>
    </div>
  </template>
  
  <script>
  import { defineComponent, onMounted, ref } from 'vue'
  import axios from 'axios'
  import VueApexCharts from 'vue3-apexcharts'
  
  export default defineComponent({
    name: 'ChartLoginHours',
    components: {
      apexchart: VueApexCharts
    },
    setup() {
      const series = ref([])
      const hasData = ref(true)
  
      const chartOptions = ref({
        chart: { type: 'bar', stacked: false },
        xaxis: { type: 'category', title: { text: 'Giorni' } },
        yaxis: { title: { text: 'Ore' } },
        dataLabels: { enabled: false },
        colors: ['#c35573', '#71b095', '#34495e'],
        legend: { position: 'bottom' },
        tooltip: {
          y: { formatter: (val) => `${val} h` }
        }
      })
  
      const fetchData = async () => {
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/db/ast/login-summary`)
          if (data.length === 0) {
            setMock()
            return
          }
  
          const grouped = {}
          data.forEach(({ location, date, total_hours }) => {
            if (!grouped[location]) grouped[location] = []
            grouped[location].push({ x: date, y: total_hours })
          })
  
          series.value = Object.entries(grouped).map(([location, data]) => ({
            name: location,
            data
          }))
  
          hasData.value = series.value.length > 0
        } catch (err) {
          console.error('Errore nel fetch login-summary:', err)
          setMock()
        }
      }
  
      const setMock = () => {
        hasData.value = false
        series.value = [
          {
            name: 'Mock - Milano',
            data: [
              { x: '2025-03-01', y: 4.5 },
              { x: '2025-03-02', y: 6.0 },
              { x: '2025-03-03', y: 5.2 },
              { x: '2025-03-04', y: 7.0 }
            ]
          },
          {
            name: 'Mock - Roma',
            data: [
              { x: '2025-03-01', y: 3.0 },
              { x: '2025-03-02', y: 4.1 },
              { x: '2025-03-03', y: 6.3 },
              { x: '2025-03-04', y: 5.5 }
            ]
          }
        ]
      }
  
      onMounted(() => {
        fetchData()
      })
  
      return {
        series,
        chartOptions,
        hasData
      }
    }
  })
  </script>
  
  <style scoped>
  .chart {
    background: #fff;
    border-radius: 10px;
    padding: 24px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.07);
    text-align: center;
    transition: all 0.2s ease-in-out;
  }
  
  .chart h2 {
    font-size: 20px;
    margin-bottom: 12px;
    color: #333;
  }
  
  .no-data {
    margin-top: 10px;
    font-size: 14px;
    color: #999;
  }
  </style>
  