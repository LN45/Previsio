<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format } from 'date-fns'
import { useFinanceStore } from '../stores/finance'
import type { OperationType, Recurrence, RecurrenceType } from '../types/finance'

const store = useFinanceStore()

const editingId = ref<string | null>(null)

const form = ref<{
  name: string
  type: RecurrenceType
  startDate: string
  amount: number
  categoryId: string
  accountId: string
  operationType: OperationType
  description: string
}>({
  name: '',
  type: 'monthly',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  amount: 0,
  categoryId: 'housing',
  accountId: 'main',
  operationType: 'expense',
  description: '',
})

const filteredCategories = computed(() =>
  store.categories.filter((category) => category.type === form.value.operationType),
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
    name: '',
    type: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    categoryId: 'housing',
    accountId: 'main',
    operationType: 'expense',
    description: '',
  }
}

const submit = async () => {
  if (!form.value.name || Number(form.value.amount) <= 0) {
    return
  }

  if (editingId.value) {
    await store.updateRecurrence(editingId.value, {
      name: form.value.name,
      type: form.value.type,
      startDate: form.value.startDate,
      amount: Number(form.value.amount),
      categoryId: form.value.categoryId,
      accountId: form.value.accountId,
      operationType: form.value.operationType,
      description: form.value.description,
    })
  } else {
    await store.addRecurrence({
      name: form.value.name,
      type: form.value.type,
      startDate: form.value.startDate,
      amount: Number(form.value.amount),
      categoryId: form.value.categoryId,
      accountId: form.value.accountId,
      operationType: form.value.operationType,
      description: form.value.description,
    })
  }

  resetForm()
}

const startEditing = (item: Recurrence) => {
  editingId.value = item.id
  form.value = {
    name: item.name,
    type: item.type,
    startDate: item.startDate,
    amount: item.amount,
    categoryId: item.categoryId,
    accountId: item.accountId,
    operationType: item.operationType,
    description: item.description,
  }
}

onMounted(async () => {
  await store.loadCollections()
  await store.loadRecurrences()
})
</script>

<template>
  <main class="operations-screen recurrence-screen">
    <section class="panel">
      <div class="panel-header">
        <h2>{{ editingId ? 'Modifier la récurrence' : 'Nouvelle récurrence' }}</h2>
      </div>

      <form class="form-grid" @submit.prevent="submit">
        <label class="field">
          <span>Nom</span>
          <input v-model="form.name" type="text" placeholder="Ex: Loyer, abonnement, salaire" />
        </label>

        <label class="field">
          <span>Fréquence</span>
          <select v-model="form.type">
            <option value="monthly">Mensuelle</option>
            <option value="quarterly">Trimestrielle</option>
            <option value="yearly">Annuelle</option>
          </select>
        </label>

        <label class="field">
          <span>Début</span>
          <input v-model="form.startDate" type="date" />
        </label>

        <label class="field">
          <span>Montant</span>
          <input v-model.number="form.amount" type="number" min="0" step="0.01" />
        </label>

        <label class="field">
          <span>Type</span>
          <select v-model="form.operationType">
            <option value="income">Revenu</option>
            <option value="expense">Dépense</option>
          </select>
        </label>

        <label class="field">
          <span>Catégorie</span>
          <select v-model="form.categoryId">
            <option v-for="category in filteredCategories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="field field-wide">
          <span>Description</span>
          <input v-model="form.description" type="text" placeholder="Ex: Loyer mensuel de l'appartement" />
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">{{ editingId ? 'Enregistrer' : 'Ajouter' }}</button>
          <button v-if="editingId" class="secondary-button" type="button" @click="resetForm">Annuler</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Calendrier</h2>
        <span>{{ store.recurrences.length }} règles</span>
      </div>

      <div v-if="store.recurrences.length === 0" class="empty-state">Aucune récurrence configurée.</div>

      <div v-else class="operation-table">
        <div v-for="item in store.recurrences" :key="item.id" class="row">
          <div>
            <strong>{{ item.name }}</strong>
            <small class="recurrence-meta">
              {{ item.description || 'Sans description' }}
              <span class="recurrence-frequency">{{ item.type }}</span>
            </small>
          </div>

          <div class="row-amount">
            <span :class="item.operationType === 'income' ? 'positive' : 'negative'">
              {{ item.operationType === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
            </span>
            <span class="muted">{{ item.startDate }}</span>
            <div class="row-actions">
              <button class="secondary-button" type="button" @click="startEditing(item)">Modifier</button>
              <button class="delete-button" @click="store.deleteRecurrence(item.id)">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
