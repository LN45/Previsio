<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format } from 'date-fns'
import { useFinanceStore } from '../stores/finance'
import type { OperationStatus, OperationType } from '../types/finance'

const store = useFinanceStore()
const form = ref<{
  type: OperationType
  amount: number
  date: string
  categoryId: string
  accountId: string
  status: OperationStatus
  description: string
  isRecurring: boolean
}>({
  type: 'expense',
  amount: 0,
  date: format(new Date(), 'yyyy-MM-dd'),
  categoryId: 'food',
  accountId: 'main',
  status: 'planned',
  description: '',
  isRecurring: false,
})

const categories = [
  { id: 'salary', label: 'Salaire', type: 'income' },
  { id: 'bonus', label: 'Prime', type: 'income' },
  { id: 'housing', label: 'Logement', type: 'expense' },
  { id: 'food', label: 'Alimentation', type: 'expense' },
  { id: 'transport', label: 'Transport', type: 'expense' },
  { id: 'insurance', label: 'Assurance', type: 'expense' },
]

const filteredCategories = computed(() =>
  categories.filter((category) => category.type === form.value.type),
)

const submit = async () => {
  if (!form.value.description || Number(form.value.amount) <= 0) {
    return
  }

  await store.addOperation({
    type: form.value.type,
    amount: Number(form.value.amount),
    date: form.value.date,
    categoryId: form.value.categoryId,
    accountId: form.value.accountId,
    status: form.value.status,
    description: form.value.description,
    isRecurring: form.value.isRecurring,
  })

  form.value = {
    type: 'expense',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    categoryId: 'food',
    accountId: 'main',
    status: 'planned',
    description: '',
    isRecurring: false,
  }
}

onMounted(async () => {
  await store.loadOperations()
})
</script>

<template>
  <main class="operations-screen">
    <section class="panel">
      <div class="panel-header">
        <h2>Nouvelle opération</h2>
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
              {{ category.label }}
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

        <label class="field field-wide">
          <span>Description</span>
          <input v-model="form.description" type="text" placeholder="Ex: Loyer, courses, prime..." />
        </label>

        <label class="checkbox-row">
          <input v-model="form.isRecurring" type="checkbox" />
          <span>Récurrente</span>
        </label>

        <button class="primary-button" type="submit">Enregistrer</button>
      </form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Historique</h2>
        <span>{{ store.operations.length }} opérations</span>
      </div>

      <div v-if="store.operations.length === 0" class="empty-state">Aucune opération enregistrée.</div>

      <div v-else class="operation-table">
        <div v-for="item in store.operations" :key="item.id" class="row">
          <div>
            <strong>{{ item.description }}</strong>
            <small>{{ item.date }}</small>
          </div>
          <div class="row-amount">
            <span :class="item.type === 'income' ? 'positive' : 'negative'">
              {{ item.type === 'income' ? '+' : '-' }}{{ item.amount }} €
            </span>
            <button class="delete-button" @click="store.deleteOperation(item.id)">Supprimer</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
