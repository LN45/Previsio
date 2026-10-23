<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format } from 'date-fns'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()
const editingId = ref<string | null>(null)
const form = ref({
  categoryId: '',
  month: format(new Date(), 'yyyy-MM'),
  plannedAmount: 0,
})

const rows = computed(() =>
  store.budgets.map((budget) => ({
    ...budget,
    categoryName: store.categoryById(budget.categoryId)?.name ?? 'Catégorie',
    actualAmount: store.getActualAmountForBudget(budget),
  })),
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
    categoryId: '',
    month: format(new Date(), 'yyyy-MM'),
    plannedAmount: 0,
  }
}

const submit = async () => {
  if (!form.value.categoryId || Number(form.value.plannedAmount) <= 0) {
    return
  }

  if (editingId.value) {
    await store.updateBudget(editingId.value, {
      categoryId: form.value.categoryId,
      month: form.value.month,
      plannedAmount: Number(form.value.plannedAmount),
    })
  } else {
    await store.addBudget({
      categoryId: form.value.categoryId,
      month: form.value.month,
      plannedAmount: Number(form.value.plannedAmount),
    })
  }

  resetForm()
}

const startEditing = (row: { id: string; categoryId: string; month: string; plannedAmount: number }) => {
  editingId.value = row.id
  form.value = {
    categoryId: row.categoryId,
    month: row.month,
    plannedAmount: row.plannedAmount,
  }
}

onMounted(async () => {
  await store.loadCollections()
})
</script>

<template>
  <main class="operations-screen">
    <section class="panel">
      <div class="panel-header">
        <h2>{{ editingId ? 'Modifier le budget' : 'Budget mensuel' }}</h2>
      </div>

      <form class="form-grid" @submit.prevent="submit">
        <label class="field">
          <span>Catégorie</span>
          <select v-model="form.categoryId">
            <option v-for="category in store.categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Mois</span>
          <input v-model="form.month" type="month" />
        </label>

        <label class="field">
          <span>Montant prévu</span>
          <input v-model.number="form.plannedAmount" type="number" min="0" step="0.01" />
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">{{ editingId ? 'Enregistrer' : 'Ajouter' }}</button>
          <button v-if="editingId" class="secondary-button" type="button" @click="resetForm">Annuler</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Vue budgétaire</h2>
      </div>

      <div v-if="rows.length === 0" class="empty-state">Aucun budget défini.</div>

      <div v-else class="budget-list">
        <div v-for="row in rows" :key="row.id" class="budget-item">
          <div>
            <strong>{{ row.categoryName }}</strong>
            <small>{{ row.month }}</small>
          </div>
          <div class="budget-value">
            <span>Prévu : {{ formatCurrency(row.plannedAmount) }}</span>
            <span>Réel : {{ formatCurrency(row.actualAmount) }}</span>
            <div class="row-actions">
              <button class="secondary-button" type="button" @click="startEditing(row)">Modifier</button>
              <button class="delete-button" type="button" @click="store.deleteBudget(row.id)">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
