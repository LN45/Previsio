<script setup lang="ts">
import { ref, watch } from 'vue'
import { format, parseISO } from 'date-fns'
import { backupFileName } from '../lib/backup'
import { useFinanceStore } from '../stores/finance'
import type { SavingsDirection } from '../types/finance'

const store = useFinanceStore()
const accountInput = ref(0)
const savingsInput = ref(0)
const today = () => format(new Date(), 'yyyy-MM-dd')
const transferForm = ref<{ direction: SavingsDirection; amount: number; date: string; description: string }>({
  direction: 'deposit',
  amount: 0,
  date: today(),
  description: '',
})
const savingsError = ref('')
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

watch(
  () => store.savingsBalance,
  (value) => {
    savingsInput.value = value
  },
  { immediate: true },
)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

const saveSavingsBalance = async () => {
  await store.setSavingsBalance(savingsInput.value)
}

const submitTransfer = async () => {
  savingsError.value = ''
  try {
    await store.transferSavings(transferForm.value.direction, transferForm.value)
    transferForm.value = { direction: transferForm.value.direction, amount: 0, date: today(), description: '' }
  } catch (error) {
    savingsError.value = error instanceof Error ? error.message : 'Virement impossible.'
  }
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
        <h2>Épargne</h2>
        <span>{{ formatCurrency(store.savingsBalance) }} de côté</span>
      </div>

      <div class="form-grid">
        <label class="field field-wide">
          <span>Montant actuel de l’épargne</span>
          <input v-model.number="savingsInput" type="number" step="0.01" min="0" placeholder="0" />
        </label>
      </div>

      <div class="form-actions account-actions">
        <button class="primary-button" type="button" @click="saveSavingsBalance">Enregistrer l’épargne</button>
      </div>

      <p class="muted">
        L’épargne ne compte pas dans le solde du compte. Un virement crée une opération réelle sur le compte :
        une dépense quand tu mets de l’argent de côté, un revenu quand tu en reprends.
      </p>

      <form class="form-grid" @submit.prevent="submitTransfer">
        <label class="field">
          <span>Virement</span>
          <select v-model="transferForm.direction">
            <option value="deposit">Du compte vers l’épargne</option>
            <option value="withdrawal">De l’épargne vers le compte</option>
          </select>
        </label>

        <label class="field">
          <span>Montant</span>
          <input v-model.number="transferForm.amount" type="number" min="0" step="0.01" />
        </label>

        <label class="field">
          <span>Date</span>
          <input v-model="transferForm.date" type="date" />
        </label>

        <label class="field">
          <span>Description</span>
          <input v-model="transferForm.description" type="text" placeholder="Facultatif" />
        </label>

        <div class="form-actions">
          <button class="primary-button" type="submit">Enregistrer le virement</button>
        </div>
      </form>

      <p v-if="savingsError" class="backup-error" role="alert">{{ savingsError }}</p>

      <div v-if="store.savingsTransfers.length" class="operation-table">
        <div v-for="item in store.savingsTransfers" :key="item.id" class="row">
          <div>
            <strong>{{ item.description }}</strong>
            <small>{{ format(parseISO(item.date), 'dd/MM/yyyy') }}</small>
          </div>
          <div class="row-amount">
            <!-- Point de vue de l'épargne : un virement vers l'épargne l'augmente -->
            <span :class="item.type === 'expense' ? 'positive' : 'negative'">
              {{ item.type === 'expense' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
            </span>
            <div class="row-actions">
              <button class="delete-button" type="button" @click="store.deleteOperation(item.id)">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
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
