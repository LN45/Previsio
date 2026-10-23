<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFinanceStore } from './stores/finance'

const route = useRoute()
const store = useFinanceStore()

onMounted(async () => {
  await store.loadOperations()
})

const navItems = computed(() => [
  { label: 'Accueil', name: 'dashboard', path: '/' },
  { label: 'Opérations', name: 'operations', path: '/operations' },
])
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Gestion financière</p>
        <h1>Prévisio</h1>
      </div>
      <button class="primary-button" type="button">+ Ajouter</button>
    </header>

    <nav class="mobile-tabs" aria-label="Navigation principale">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="tab"
        :class="{ 'is-active': route.name === item.name }"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <RouterView />
  </div>
</template>
