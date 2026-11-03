<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { addMonths, format, parseISO } from 'date-fns'
import MonthOperationList from '../components/MonthOperationList.vue'
import { formatMonthLabel } from '../lib/forecast'
import { paymentMethodLabels } from '../lib/labels'
import { useFinanceStore } from '../stores/finance'
import type { Operation, OperationStatus, OperationType, PaymentMethod } from '../types/finance'

const store = useFinanceStore()
const editingId = ref<string | null>(null)
const form = ref<{
  type: OperationType
  amount: number
  date: string
  categoryId: string
  accountId: string
  status: OperationStatus
  paymentMethod?: PaymentMethod
  description: string
  isRecurring: boolean
}>({
  type: 'expense',
  amount: 0,
  date: format(new Date(), 'yyyy-MM-dd'),
  categoryId: 'food',
  accountId: 'main',
  status: 'planned',
  paymentMethod: 'card',
  description: '',
  isRecurring: false,
})

const filteredCategories = computed(() =>
  store.categories.filter((category) => category.type === form.value.type),
)

const listMonth = ref(store.currentMonthKey)
const shiftMonth = (delta: number) => {
  listMonth.value = format(addMonths(parseISO(`${listMonth.value}-01`), delta), 'yyyy-MM')
}

const resetForm = () => {
  editingId.value = null
  form.value = {
    type: 'expense',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: 'food',
    accountId: 'main',
    status: 'planned',
    paymentMethod: 'card',
    description: '',
    isRecurring: false,
  }
}

const submit = async () => {
  if (Number(form.value.amount) <= 0) {
    return
  }

  const payload = {
    type: form.value.type,
    amount: Number(form.value.amount),
    date: form.value.date,
    categoryId: form.value.categoryId,
    accountId: form.value.accountId,
    status: form.value.status,
    paymentMethod: form.value.paymentMethod,
    description: form.value.description,
    isRecurring: form.value.isRecurring,
  }

  if (editingId.value) {
    await store.updateOperation(editingId.value, payload)
  } else {
    await store.addOperation(payload)
  }

  // La liste suit le mois de l'opération enregistrée
  listMonth.value = payload.date.slice(0, 7)
  resetForm()
}

const startEditing = (item: Operation) => {
  editingId.value = item.id
  form.value = {
    type: item.type,
    amount: item.amount,
    date: item.date,
    categoryId: item.categoryId,
    accountId: item.accountId,
    status: item.status,
    paymentMethod: item.paymentMethod,
    description: item.description,
    isRecurring: item.isRecurring,
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await store.loadCollections()
  await store.loadOperations()
})
</script>

<template>
  <main class="operations-screen">
    <section class="panel">
      <div class="panel-header">
        <h2>{{ editingId ? 'Modifier l\'opération' : 'Nouvelle opération' }}</h2>
      </div>

      <form class="form-grid" @submit.prevent="submit">
        <label class="field">
          <span>Type</span>
          <select v-model="form.type">
            <option value="income">Revenu</option>
            <option value="expense">Dépense</option>
          </select>
        </label>

        <label class="field">
          <span>Montant</span>
          <input v-model.number="form.amount" type="number" min="0" step="0.01" />
        </label>

        <label class="field">
          <span>Date</span>
          <input v-model="form.date" type="date" />
        </label>

        <label class="field">
          <span>Catégorie</span>
          <select v-model="form.categoryId">
            <option v-for="category in filteredCategories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Statut</span>
          <select v-model="form.status">
            <option value="real">Réelle</option>
            <option value="planned">Prévue</option>
            <option value="estimated">Estimée</option>
          </select>
        </label>

        <label class="field">
          <span>Moyen de paiement</span>
          <select v-model="form.paymentMethod">
            <option v-for="(label, value) in paymentMethodLabels" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>

        <label class="field field-wide">
          <span>Description</span>
          <input v-model="form.description" type="text" placeholder="Ex: Loyer, courses, prime..." />
        </label>

        <label class="checkbox-row">
          <input v-model="form.isRecurring" type="checkbox" />
          <span>Récurrente</span>
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">{{ editingId ? 'Enregistrer' : 'Ajouter' }}</button>
          <button v-if="editingId" class="secondary-button" type="button" @click="resetForm">Annuler</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Opérations du mois</h2>
        <div class="month-nav">
          <button class="secondary-button" type="button" aria-label="Mois précédent" @click="shiftMonth(-1)">‹</button>
          <span>{{ formatMonthLabel(listMonth) }}</span>
          <button class="secondary-button" type="button" aria-label="Mois suivant" @click="shiftMonth(1)">›</button>
        </div>
      </div>

      <MonthOperationList :month-key="listMonth" editable @edit="startEditing" />
    </section>
  </main>
</template>
