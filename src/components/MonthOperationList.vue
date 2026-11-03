<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { formatCurrency, paymentMethodLabels, statusLabels } from '../lib/labels'
import { useFinanceStore } from '../stores/finance'
import type { Operation } from '../types/finance'

const props = defineProps<{
  monthKey: string
  // Affiche les boutons Modifier / Supprimer des opérations enregistrées
  editable?: boolean
}>()

const emit = defineEmits<{ edit: [operation: Operation] }>()

const store = useFinanceStore()
const items = computed(() => store.getMonthOperations(props.monthKey))

const toggle = (operation: Operation, event: Event) =>
  store.setOperationConfirmed(operation, (event.target as HTMLInputElement).checked)
</script>

<template>
  <div v-if="items.length === 0" class="empty-state">Aucune opération ce mois-ci.</div>

  <ul v-else class="month-list">
    <li
      v-for="{ operation, projected } in items"
      :key="operation.id"
      class="month-row"
      :class="{ confirmed: operation.status === 'real' }"
    >
      <input
        type="checkbox"
        class="month-check"
        :checked="operation.status === 'real'"
        :aria-label="`Confirmer ${operation.description || 'l’opération'} comme réelle`"
        @change="toggle(operation, $event)"
      />
      <div class="month-row-main">
        <strong>{{ operation.description || store.categoryById(operation.categoryId)?.name || 'Opération' }}</strong>
        <small>
          {{ format(parseISO(operation.date), 'dd/MM') }}
          <template v-if="operation.paymentMethod"> · {{ paymentMethodLabels[operation.paymentMethod] }}</template>
          <template v-if="operation.recurrenceId"> · Récurrence</template>
          <template v-if="operation.savingsTransfer"> · Épargne</template>
          <template v-if="operation.status !== 'real'"> · {{ statusLabels[operation.status] }}</template>
        </small>
      </div>
      <span class="month-row-amount" :class="operation.type === 'income' ? 'positive' : 'negative'">
        {{ operation.type === 'income' ? '+' : '-' }}{{ formatCurrency(operation.amount) }}
      </span>
      <div v-if="editable && !projected" class="row-actions">
        <!-- Les virements d'épargne se gèrent depuis Compte principal › Épargne -->
        <button v-if="!operation.savingsTransfer" class="secondary-button" type="button" @click="emit('edit', operation)">
          Modifier
        </button>
        <button class="delete-button" type="button" @click="store.deleteOperation(operation.id)">Supprimer</button>
      </div>
    </li>
  </ul>
</template>
