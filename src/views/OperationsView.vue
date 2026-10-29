<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format, parseISO } from 'date-fns'
import { useFinanceStore } from '../stores/finance'
import type { Operation, OperationStatus, OperationType } from '../types/finance'

const store = useFinanceStore()
const editingId = ref<string | null>(null)
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

const filteredCategories = computed(() =>
  store.categories.filter((category) => category.type === form.value.type),
)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const resetForm = () => {
  editingId.value = null
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

const submit = async () => {
  if (Number(form.value.amount) <= 0) {
    return
  }

  if (editingId.value) {
    await store.updateOperation(editingId.value, {
      type: form.value.type,
      amount: Number(form.value.amount),
      date: form.value.date,
      categoryId: form.value.categoryId,
      accountId: form.value.accountId,
      status: form.value.status,
      description: form.value.description,
      isRecurring: form.value.isRecurring,
    })
  } else {
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
  }

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
    description: item.description,
    isRecurring: item.isRecurring,
  }
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
        <h2>Historique</h2>
        <span>{{ store.operations.length }} opérations</span>
      </div>

      <div v-if="store.operations.length === 0" class="empty-state">Aucune opération enregistrée.</div>

      <div v-else class="operation-table">
        <div v-for="item in store.operations" :key="item.id" class="row">
          <div>
            <strong>{{ item.description || 'Opération' }}</strong>
            <small>
              {{ format(parseISO(item.date), 'dd/MM/yyyy') }}<template v-if="item.savingsTransfer"> · Épargne</template>
            </small>
          </div>
          <div class="row-amount">
            <span :class="item.type === 'income' ? 'positive' : 'negative'">
              {{ item.type === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
            </span>
            <div class="row-actions">
              <!-- Les virements d'épargne se gèrent depuis Compte principal › Épargne -->
              <button v-if="!item.savingsTransfer" class="secondary-button" type="button" @click="startEditing(item)">
                Modifier
              </button>
              <button class="delete-button" @click="store.deleteOperation(item.id)">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
