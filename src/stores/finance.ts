import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { buildForecastSnapshot, calculateRealBalanceAtDate } from '../lib/forecast'
import { sampleOperations } from '../data/sampleData'
import { db } from '../lib/db'
import type { Operation, OperationType } from '../types/finance'

export const useFinanceStore = defineStore('finance', () => {
  const operations = ref<Operation[]>([])
  const isLoaded = ref(false)

  const loadOperations = async () => {
    if (isLoaded.value) {
      return
    }

    const stored = await db.operations.toArray()

    if (stored.length === 0) {
      await db.operations.bulkAdd(sampleOperations)
      operations.value = [...sampleOperations]
    } else {
      operations.value = stored
    }

    isLoaded.value = true
  }

  const addOperation = async (payload: {
    type: OperationType
    amount: number
    date: string
    categoryId: string
    accountId: string
    status: Operation['status']
    description: string
    isRecurring: boolean
  }) => {
    const operation: Operation = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.operations.add(operation)
    operations.value = [operation, ...operations.value]
    return operation
  }

  const deleteOperation = async (id: string) => {
    await db.operations.delete(id)
    operations.value = operations.value.filter((operation) => operation.id !== id)
  }

  const realBalance = computed(() => calculateRealBalanceAtDate(operations.value, new Date()))

  const forecast = computed(() => ({
    short: buildForecastSnapshot(operations.value, new Date(), 30),
    medium: buildForecastSnapshot(operations.value, new Date(), 90),
    long: buildForecastSnapshot(operations.value, new Date(), 365),
  }))

  const nextMovements = computed(() =>
    [...operations.value]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5),
  )

  const spendingTotal = computed(() =>
    operations.value
      .filter((operation) => operation.type === 'expense')
      .reduce((sum, operation) => sum + operation.amount, 0),
  )

  return {
    operations,
    isLoaded,
    loadOperations,
    addOperation,
    deleteOperation,
    realBalance,
    forecast,
    nextMovements,
    spendingTotal,
  }
})
