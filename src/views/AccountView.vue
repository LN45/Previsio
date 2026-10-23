<script setup lang="ts">
import { ref, watch } from 'vue'
import { backupFileName } from '../lib/backup'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()
const accountInput = ref(0)
const importInput = ref<HTMLInputElement | null>(null)
const pendingImport = ref<string | null>(null)
const backupMessage = ref('')
const backupError = ref('')

watch(
  () => store.account?.initialBalance ?? 0,
  (value) => {
    accountInput.value = value
  },
  { immediate: true },
)

const saveAccountBalance = async () => {
  await store.setInitialBalance(accountInput.value)
}

const exportData = async () => {
  backupError.value = ''
  const backup = await store.exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName()
  link.click()
  URL.revokeObjectURL(url)
  backupMessage.value = `Sauvegarde exportée : ${backup.data.operations.length} opération(s).`
}

const selectImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }

  backupMessage.value = ''
  backupError.value = ''
  pendingImport.value = await file.text()
}

const confirmImport = async () => {
  if (pendingImport.value === null) {
    return
  }

  try {
    const data = await store.importBackup(pendingImport.value)
    backupMessage.value = `Sauvegarde importée : ${data.operations.length} opération(s), ${data.categories.length} catégorie(s).`
  } catch (error) {
    backupError.value = error instanceof Error ? error.message : 'Import impossible.'
  } finally {
    pendingImport.value = null
  }
}
</script>

<template>
  <main class="operations-screen">
    <section class="panel">
      <div class="panel-header">
        <h2>Compte principal</h2>
        <span>Solde de départ</span>
      </div>

      <div class="form-grid">
        <label class="field field-wide">
          <span>Solde actuel du compte</span>
          <input v-model.number="accountInput" type="number" step="0.01" min="0" placeholder="0" />
        </label>
      </div>

      <div class="form-actions account-actions">
        <button class="primary-button" type="button" @click="saveAccountBalance">Enregistrer le solde</button>
      </div>

      <p class="muted">Le solde affiché inclut ce montant de départ et les mouvements déjà saisis.</p>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Sauvegarde</h2>
        <span>Export / import</span>
      </div>

      <p class="muted">
        Les données réelles sont stockées uniquement sur cet appareil. Exporte-les régulièrement dans un fichier
        pour les conserver ou les transférer vers un autre appareil.
      </p>

      <div class="form-actions account-actions">
        <button class="primary-button" type="button" @click="exportData">Exporter mes données</button>
        <button class="secondary-button" type="button" @click="importInput?.click()">Importer une sauvegarde</button>
        <input ref="importInput" type="file" accept="application/json,.json" hidden @change="selectImportFile" />
      </div>

      <p v-if="backupMessage" class="muted" role="status">{{ backupMessage }}</p>
      <p v-if="backupError" class="backup-error" role="alert">{{ backupError }}</p>
    </section>

    <div v-if="pendingImport !== null" class="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirmation d’import">
      <div class="confirm-dialog">
        <h2>Remplacer les données ?</h2>
        <p>
          L’import remplace toutes les données réelles de cet appareil par celles du fichier.
          Pense à exporter tes données actuelles avant si tu veux les garder.
        </p>
        <div class="confirm-actions">
          <button class="secondary-button" type="button" @click="pendingImport = null">Annuler</button>
          <button class="danger-button" type="button" @click="confirmImport">Importer</button>
        </div>
      </div>
    </div>
  </main>
</template>
