<script setup lang="ts">
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartConfiguration,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// N'enregistre que les éléments utilisés pour garder le bundle léger
Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
)

Chart.defaults.color = '#9fb5d9'
Chart.defaults.font.size = 12

const props = defineProps<{
  config: ChartConfiguration
  label: string
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => {
  if (canvas.value) {
    // Le canvas n'hérite pas du CSS : on lui passe la police de l'application
    Chart.defaults.font.family = getComputedStyle(canvas.value).fontFamily
    chart = new Chart(canvas.value, props.config)
  }
})

watch(
  () => props.config,
  (config) => {
    if (!chart) {
      return
    }
    chart.data = config.data
    chart.options = config.options ?? {}
    chart.update()
  },
)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="chart-container">
    <canvas ref="canvas" role="img" :aria-label="label" />
  </div>
</template>
