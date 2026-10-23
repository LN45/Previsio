<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()

const categoryBreakdown = computed(() => {
  const groups = new Map<string, number>()

  store.operations
    .filter((operation) => operation.type === 'expense')
    .forEach((operation) => {
      const value = groups.get(operation.categoryId) ?? 0
      groups.set(operation.categoryId, value + operation.amount)
    })

  return [...groups.entries()].map(([categoryId, total]) => ({
    categoryId,
    total,
    label:
      categoryId === 'housing'
        ? 'Logement'
        : categoryId === 'food'
          ? 'Alimentation'
          : categoryId === 'transport'
            ? 'Transport'
            : categoryId === 'insurance'
              ? 'Assurance'
              : 'Autre',
  }))
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)

const summaryCards = computed(() => [
  {
    label: 'Solde actuel',
    value: formatCurrency(store.realBalance),
    tone: store.realBalance >= 0 ? 'positive' : 'negative',
  },
  {
    label: '30 jours',
    value: formatCurrency(store.forecast.short.projectedBalance),
    tone: 'neutral',
  },
  {
    label: '90 jours',
    value: formatCurrency(store.forecast.medium.projectedBalance),
    tone: 'neutral',
  },
  {
    label: '365 jours',
    value: formatCurrency(store.forecast.long.projectedBalance),
    tone: 'neutral',
  },
])
</script>

<template>
  <main class="dashboard">
    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="stat-card" :class="card.tone">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </article>
    </section>

    <section class="panel-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>Prochaines opérations</h2>
          <span>{{ store.nextMovements.length }} éléments</span>
        </div>

        <ul class="operation-list">
          <li v-for="item in store.nextMovements" :key="item.id" class="operation-item">
            <div class="operation-meta">
              <span class="pill" :class="item.type === 'income' ? 'income' : 'expense'">
                {{ item.type === 'income' ? 'Entrée' : 'Sortie' }}
              </span>
              <strong>{{ item.description }}</strong>
            </div>
            <div class="value-block">
              <span>{{ format(parseISO(item.date), 'dd MMM') }}</span>
              <strong :class="item.type === 'income' ? 'positive' : 'negative'">
                {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
              </strong>
            </div>
          </li>
        </ul>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>Répartition des dépenses</h2>
          <span>{{ formatCurrency(store.spendingTotal) }}</span>
        </div>

        <div class="category-list">
          <div v-for="item in categoryBreakdown" :key="item.categoryId" class="category-row">
            <div class="category-labels">
              <span class="dot" :class="item.categoryId"></span>
              <span>{{ item.label }}</span>
            </div>
            <div class="category-values">
              <span>{{ formatCurrency(item.total) }}</span>
              <small>{{ Math.round((item.total / store.spendingTotal) * 100) || 0 }}%</small>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Vue d’ensemble</h2>
        <span>À jour</span>
      </div>

      <div class="insight-grid">
        <div>
          <small>Solde prévisionnel 30 j.</small>
          <strong>{{ formatCurrency(store.forecast.short.projectedBalance) }}</strong>
        </div>
        <div>
          <small>Dépenses estimées</small>
          <strong>{{ formatCurrency(store.forecast.short.estimatedVariableExpenses) }}</strong>
        </div>
        <div>
          <small>Opérations futures</small>
          <strong>{{ formatCurrency(store.forecast.short.futureOperationsTotal) }}</strong>
        </div>
      </div>
    </section>
  </main>
</template>
