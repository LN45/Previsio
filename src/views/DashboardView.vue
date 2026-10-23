<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { formatMonthLabel } from '../lib/forecast'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()

const expenseBreakdown = computed(() => store.getExpenseBreakdown(store.currentMonthKey))
const monthLabel = computed(() => formatMonthLabel(store.currentMonthKey))

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

</script>

<template>
  <main class="dashboard">
    <section class="top-summary">
      <article class="stat-card featured balance-card">
        <div class="balance-item">
          <span>Solde compte</span>
          <strong :class="store.realBalance >= 0 ? 'positive' : 'negative'">{{ formatCurrency(store.realBalance) }}</strong>
          <small>Aujourd’hui</small>
        </div>
        <div class="balance-item">
          <span>Fin de mois</span>
          <strong :class="store.monthEndBalance >= 0 ? 'positive' : 'negative'">{{ formatCurrency(store.monthEndBalance) }}</strong>
          <small>Prévision {{ monthLabel }}</small>
        </div>
      </article>

      <section class="panel monthly-plan-panel">
        <div class="panel-header">
          <h2>Plan mensuel</h2>
          <span>3 prochains mois</span>
        </div>

        <div class="plan-grid">
          <article v-for="(month, index) in store.monthlyPlan" :key="month.monthKey" class="plan-card">
            <div class="plan-header">
              <span>{{ month.label }}</span>
              <div class="plan-closing">
                <small>Fin de mois</small>
                <strong :class="month.closing >= 0 ? 'positive' : 'negative'">{{ formatCurrency(month.closing) }}</strong>
              </div>
            </div>
            <div class="plan-values">
              <div class="plan-opening">
                <small>{{ index === 0 ? 'Solde début' : 'Report' }}</small>
                <strong>{{ formatCurrency(month.opening) }}</strong>
              </div>
              <div>
                <small>Entrées</small>
                <strong>{{ formatCurrency(month.income) }}</strong>
              </div>
              <div>
                <small>Dépenses</small>
                <strong>{{ formatCurrency(month.expense) }}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
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
          <h2>Dépenses · {{ expenseBreakdown.label }}</h2>
          <span>{{ formatCurrency(expenseBreakdown.total) }}</span>
        </div>

        <div v-if="expenseBreakdown.items.length" class="category-list">
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
        <p v-else class="muted">Aucune dépense ce mois-ci.</p>
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

    <section class="panel secondary-panel">
      <div class="panel-header">
        <h2>Vision à moyen et long terme</h2>
        <span>À venir</span>
      </div>

      <div class="secondary-grid">
        <div class="mini-stat">
          <small>30 jours</small>
          <strong>{{ formatCurrency(store.forecast.short.projectedBalance) }}</strong>
        </div>
        <div class="mini-stat">
          <small>90 jours</small>
          <strong>{{ formatCurrency(store.forecast.medium.projectedBalance) }}</strong>
        </div>
        <div class="mini-stat">
          <small>365 jours</small>
          <strong>{{ formatCurrency(store.forecast.long.projectedBalance) }}</strong>
        </div>
      </div>
    </section>
  </main>
</template>
