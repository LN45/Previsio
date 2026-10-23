<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { installPrompt, promptInstall } from './lib/install'
import { useFinanceStore } from './stores/finance'

const route = useRoute()
const store = useFinanceStore()
const confirmClear = ref(false)
const mobileMenuOpen = ref(false)

onMounted(async () => {
  await store.loadCollections()
  await store.loadOperations()
  await store.loadRecurrences()
  await store.loadAccount()
})

const resetDemo = async () => {
  await store.resetDemoData()
}

const clearPersonalData = async () => {
  await store.clearPersonalData()
  confirmClear.value = false
}

const switchMode = async (mode: 'real' | 'demo') => {
  await store.setMode(mode)
}

const navItems = computed(() => [
  { label: 'Compte principal', name: 'account', path: '/account' },
  { label: 'Opérations', name: 'operations', path: '/operations' },
  { label: 'Catégories', name: 'categories', path: '/categories' },
  { label: 'Budgets', name: 'budgets', path: '/budgets' },
  { label: 'Récurrences', name: 'recurrences', path: '/recurrences' },
  { label: 'Graphiques', name: 'charts', path: '/charts' },
])

const mobileActionItem = computed(() =>
  store.appMode === 'real'
    ? { label: 'Nettoyer les données perso', action: 'clear' as const }
    : { label: 'Réinitialiser la démo', action: 'reset' as const },
)
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <RouterLink to="/" class="brand-link">
          <h1>Prévisio</h1>
        </RouterLink>
        <p class="eyebrow">Gestion financière</p>
      </div>

      <div class="topbar-right">
        <div class="header-actions">
          <div class="mode-switch" aria-label="Choisir le mode de données">
            <button
              v-for="option in store.modeOptions"
              :key="option.value"
              type="button"
              class="mode-button"
              :class="{ active: store.appMode === option.value }"
              @click="switchMode(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <button v-if="store.appMode === 'real'" class="danger-button" type="button" @click="confirmClear = true">
            Nettoyer les données perso
          </button>
          <button v-if="store.appMode === 'demo'" class="primary-button" type="button" @click="resetDemo">
            Réinitialiser la démo
          </button>
        </div>

        <nav class="mobile-menu" aria-label="Menu rapide mobile">
          <button
            class="apps-menu-button"
            type="button"
            aria-label="Ouvrir le menu rapide"
            :aria-expanded="mobileMenuOpen"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span class="apps-grid">
              <span v-for="index in 9" :key="index" class="apps-dot" />
            </span>
          </button>

          <div v-if="mobileMenuOpen" class="mobile-menu-panel">
            <div class="mobile-mode-switch" aria-label="Choisir le mode de données">
              <button
                v-for="option in store.modeOptions"
                :key="option.value"
                type="button"
                class="mode-button"
                :class="{ active: store.appMode === option.value }"
                @click=";[switchMode(option.value), (mobileMenuOpen = false)]"
              >
                {{ option.label }}
              </button>
            </div>

            <RouterLink
              v-for="item in navItems"
              :key="item.name"
              :to="item.path"
              class="app-menu-item"
              :class="{ 'is-active': route.name === item.name }"
              @click="mobileMenuOpen = false"
            >
              {{ item.label }}
            </RouterLink>

            <button
              v-if="installPrompt"
              type="button"
              class="app-menu-item primary-item"
              @click=";[promptInstall(), (mobileMenuOpen = false)]"
            >
              Installer l’application
            </button>

            <button
              v-if="mobileActionItem.action === 'clear'"
              type="button"
              class="app-menu-item danger-item"
              @click=";[confirmClear = true, mobileMenuOpen = false]"
            >
              {{ mobileActionItem.label }}
            </button>

            <button
              v-else
              type="button"
              class="app-menu-item primary-item"
              @click=";[resetDemo(), mobileMenuOpen = false]"
            >
              {{ mobileActionItem.label }}
            </button>
          </div>
        </nav>
      </div>
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

    <div v-if="installPrompt" class="install-banner" role="status">
      <p>Installe Prévisio sur ton écran d’accueil pour l’ouvrir comme une application, même hors connexion.</p>
      <button class="primary-button" type="button" @click="promptInstall">Installer</button>
    </div>

    <div v-if="store.appMode === 'demo'" class="demo-banner" role="status">
      <span class="demo-badge">Démo</span>
      <p>Mode démonstration actif : les données d’exemple montrent le parcours complet du produit.</p>
    </div>

    <div v-if="confirmClear" class="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmation de nettoyage">
      <div class="confirm-dialog">
        <h2>Confirmer le nettoyage</h2>
        <p>
          Cette action supprime toutes les données personnelles enregistrées dans ce compte réel.
          Cette opération ne peut pas être annulée.
        </p>
        <div class="confirm-actions">
          <button class="secondary-button" type="button" @click="confirmClear = false">Annuler</button>
          <button class="danger-button" type="button" @click="clearPersonalData">Confirmer</button>
        </div>
      </div>
    </div>

    <RouterView />
  </div>
</template>
