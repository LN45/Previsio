<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import MonthOperationList from '../components/MonthOperationList.vue'
import { formatMonthLabel } from '../lib/forecast'
import { formatCurrency } from '../lib/labels'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()

const monthLabel = computed(() => formatMonthLabel(store.currentMonthKey))
// Entrées et sorties du mois en cours : réelles, prévues, estimées et échéances de récurrences
const currentMonth = computed(() => store.monthlyPlan[0])
const today = format(new Date(), 'dd/MM/yyyy')
</script>

<template>
  <main class="dashboard">
    <section class="summary-row">
      <article class="summary-card">
        <span>Prévisionnel fin de mois</span>
        <strong :class="store.monthEndBalance >= 0 ? 'positive' : 'negative'">{{ formatCurrency(store.monthEndBalance) }}</strong>
        <small v-if="currentMonth">
          {{ monthLabel }} · entrées <span class="positive">+{{ formatCurrency(currentMonth.income) }}</span>
          · sorties <span class="negative">-{{ formatCurrency(currentMonth.expense) }}</span>
        </small>
      </article>
      <article class="summary-card">
        <span>Solde à la date du jour</span>
        <strong :class="store.realBalance >= 0 ? 'positive' : 'negative'">{{ formatCurrency(store.realBalance) }}</strong>
        <small>Au {{ today }} · opérations réelles</small>
      </article>
    </section>

    <section class="panel compact-panel">
      <div class="panel-header">
        <h2>Plan prévisionnel 3 mois</h2>
      </div>

      <div class="plan-table">
        <div class="plan-table-row plan-table-head">
          <span>Mois</span>
          <span>Début</span>
          <span>Entrées</span>
          <span>Sorties</span>
          <span>Fin</span>
        </div>
        <div v-for="month in store.monthlyPlan" :key="month.monthKey" class="plan-table-row">
          <span class="plan-month">{{ month.label }}</span>
          <span>{{ formatCurrency(month.opening) }}</span>
          <span class="positive">+{{ formatCurrency(month.income) }}</span>
          <span class="negative">-{{ formatCurrency(month.expense) }}</span>
          <strong :class="month.closing >= 0 ? 'positive' : 'negative'">{{ formatCurrency(month.closing) }}</strong>
        </div>
      </div>
    </section>

    <section class="panel compact-panel">
      <div class="panel-header">
        <h2>Opérations · {{ monthLabel }}</h2>
        <span>Cocher = opération passée (réelle)</span>
      </div>

      <MonthOperationList :month-key="store.currentMonthKey" />
    </section>
  </main>
</template>
