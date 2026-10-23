<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useFinanceStore } from '../stores/finance'
import type { Category } from '../types/finance'

const store = useFinanceStore()
const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  type: 'expense' as 'income' | 'expense',
  color: '#66d9c1',
})

const resetForm = () => {
  editingId.value = null
  form.value = {
    name: '',
    type: 'expense',
    color: '#66d9c1',
  }
}

const submit = async () => {
  if (!form.value.name.trim()) {
    return
  }

  if (editingId.value) {
    await store.updateCategory(editingId.value, {
      name: form.value.name.trim(),
      type: form.value.type,
      color: form.value.color,
    })
  } else {
    await store.addCategory({
      name: form.value.name.trim(),
      type: form.value.type,
      color: form.value.color,
    })
  }

  resetForm()
}

const startEditing = (category: Category) => {
  editingId.value = category.id
  form.value = {
    name: category.name,
    type: category.type,
    color: category.color ?? '#66d9c1',
  }
}

const categoriesByType = computed(() => ({
  income: store.categories.filter((category) => category.type === 'income'),
  expense: store.categories.filter((category) => category.type === 'expense'),
}))

onMounted(async () => {
  await store.loadCollections()
})
</script>

<template>
  <main class="operations-screen">
    <section class="panel">
      <div class="panel-header">
        <h2>{{ editingId ? 'Modifier la catégorie' : 'Catégories' }}</h2>
      </div>

      <form class="form-grid" @submit.prevent="submit">
        <label class="field">
          <span>Nom</span>
          <input v-model="form.name" type="text" placeholder="Ex: Courses, Salaire..." />
        </label>

        <label class="field">
          <span>Type</span>
          <select v-model="form.type">
            <option value="income">Revenu</option>
            <option value="expense">Dépense</option>
          </select>
        </label>

        <label class="field">
          <span>Couleur</span>
          <input v-model="form.color" type="color" />
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">{{ editingId ? 'Enregistrer' : 'Ajouter' }}</button>
          <button v-if="editingId" class="secondary-button" type="button" @click="resetForm">Annuler</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Liste des catégories</h2>
      </div>

      <div class="category-stack">
        <div v-for="group in Object.entries(categoriesByType)" :key="group[0]" class="category-group">
          <h3>{{ group[0] === 'income' ? 'Revenus' : 'Dépenses' }}</h3>
          <ul>
            <li v-for="category in group[1]" :key="category.id" class="category-row-item">
              <div class="category-chip">
                <span class="dot" :style="{ background: category.color || '#66d9c1' }"></span>
                <span>{{ category.name }}</span>
              </div>
              <div class="row-actions">
                <button class="secondary-button" type="button" @click="startEditing(category)">Modifier</button>
                <button class="delete-button" @click="store.deleteCategory(category.id)">Supprimer</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>
