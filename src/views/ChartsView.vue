<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js'
import { computed, ref } from 'vue'
import FinanceChart from '../components/FinanceChart.vue'
import { formatMonthLabel } from '../lib/forecast'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()
const selectedMonth = ref(store.currentMonthKey)
const expenseBreakdown = computed(() => store.getExpenseBreakdown(selectedMonth.value))

// Teintes validées pour rester distinctes sur le fond sombre, y compris en cas de daltonisme (avec la légende)
const INCOME_COLOR = '#1fa88e'
const EXPENSE_COLOR = '#e8566a'
const NET_COLOR = '#ecf3ff'
const PANEL_COLOR = '#111d30'
const GRID_COLOR = 'rgba(255, 255, 255, 0.06)'

const hasMonthlyData = computed(() => store.monthlyHistory.some((month) => month.income > 0 || month.expense > 0))

const monthlyChart = computed(
  () =>
    ({
      type: 'bar',
      data: {
        labels: store.monthlyHistory.map((month) => month.label),
        datasets: [
          {
            label: 'Entrées',
            data: store.monthlyHistory.map((month) => month.income),
            backgroundColor: INCOME_COLOR,
            borderRadius: { topLeft: 4, topRight: 4 },
            borderSkipped: 'bottom',
            categoryPercentage: 0.7,
            barPercentage: 0.9,
            order: 2,
          },
          {
            label: 'Dépenses',
            data: store.monthlyHistory.map((month) => month.expense),
            backgroundColor: EXPENSE_COLOR,
            borderRadius: { topLeft: 4, topRight: 4 },
            borderSkipped: 'bottom',
            categoryPercentage: 0.7,
            barPercentage: 0.9,
            order: 2,
          },
          {
            type: 'line',
            label: 'Solde net',
            data: store.monthlyHistory.map((month) => month.net),
            borderColor: NET_COLOR,
            backgroundColor: NET_COLOR,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBorderColor: PANEL_COLOR,
            pointBorderWidth: 2,
            tension: 0,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              useBorderRadius: true,
              borderRadius: 3,
              // Entrées, Dépenses puis Solde net, quel que soit l'ordre de dessin
              sort: (left, right) => (left.datasetIndex ?? 0) - (right.datasetIndex ?? 0),
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label} : ${formatCurrency(Number(context.parsed.y))}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: { maxTicksLimit: 5, callback: (value) => formatCompactCurrency(Number(value)) },
          },
        },
      },
    }) as ChartConfiguration,
)

const expenseChart = computed(
  () =>
    ({
      type: 'doughnut',
      data: {
        labels: expenseBreakdown.value.items.map((item) => item.label),
        datasets: [
          {
            data: expenseBreakdown.value.items.map((item) => item.total),
            backgroundColor: expenseBreakdown.value.items.map((item) => item.color),
            borderColor: PANEL_COLOR,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          // La liste sous le graphique sert de légende
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const share = expenseBreakdown.value.items[context.dataIndex]?.share ?? 0
                return `${context.label} : ${formatCurrency(Number(context.parsed))} (${share} %)`
              },
            },
          },
        },
      },
    }) as ChartConfiguration,
)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
</script>

<template>
  <main class="dashboard">
    <section class="panel">
      <div class="panel-header">
        <h2>Entrées et dépenses</h2>
        <span>6 derniers mois et 2 à venir</span>
      </div>

      <FinanceChart
        v-if="hasMonthlyData"
        class="chart-monthly"
        :config="monthlyChart"
        label="Graphique en barres des entrées et dépenses par mois, avec le solde net"
      />
      <p v-else class="muted">Aucune opération sur cette période.</p>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Répartition des dépenses</h2>
        <span>{{ formatCurrency(expenseBreakdown.total) }}</span>
      </div>

      <label class="field month-picker">
        <span>Mois</span>
        <select v-model="selectedMonth">
          <option v-for="month in store.expenseMonths" :key="month" :value="month">
            {{ formatMonthLabel(month) }}
          </option>
        </select>
      </label>

      <template v-if="expenseBreakdown.items.length">
        <FinanceChart
          class="chart-breakdown"
          :config="expenseChart"
          label="Graphique en anneau de la répartition des dépenses par catégorie"
        />

        <div class="category-list">
          <div v-for="item in expenseBreakdown.items" :key="item.categoryId" class="category-row">
            <div class="category-labels">
              <span class="dot" :style="{ background: item.color }"></span>
              <span>{{ item.label }}</span>
            </div>
            <div class="category-values">
              <span>{{ formatCurrency(item.total) }}</span>
              <small>{{ item.share }}%</small>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="muted">Aucune dépense sur ce mois.</p>
    </section>
  </main>
</template>
