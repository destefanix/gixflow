<template>
    <div class="spark-box">
      <h2>{{ title }}</h2>
      <p class="subtitle">{{ subtitle }}</p>
      <apexchart
        :type="type"
        height="100"
        :options="options"
        :series="series"
      />
    </div>
  </template>
  
  <script>
  import ApexChart from 'vue3-apexcharts'
  
  export default {
    name: 'SparkBox',
    components: {
      apexchart: ApexChart
    },
    props: {
      title: String,
      subtitle: String,
      type: {
        type: String,
        default: 'area'
      },
      color: {
        type: String,
        default: '#007bff'
      },
      data: {
        type: Array,
        required: true
      }
    },
    computed: {
      series() {
        return [{ data: this.data }]
      },
      options() {
        return {
          chart: {
            type: this.type,
            sparkline: { enabled: true }
          },
          stroke: {
            curve: 'straight',
            width: 2
          },
          fill: {
            opacity: 0.3
          },
          yaxis: {
            min: 0
          },
          colors: [this.color],
          tooltip: {
            enabled: false
          }
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .spark-box {
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
    text-align: left;
  }
  .spark-box h2 {
    font-size: 24px;
    margin: 0;
  }
  .spark-box .subtitle {
    font-size: 14px;
    margin: 2px 0 10px;
    color: #555;
  }
  </style>
  