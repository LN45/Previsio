import { addDays, format, subMonths } from 'date-fns'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { type AppMode, getModeOptions } from '../lib/demo'
import {
  buildForecastSnapshot,
  buildMonthlyPlan,
  calculateMonthEndBalance,
  calculateRealBalanceAtDate,
  formatMonthLabel,
  getRecurringOperationsInRange,
} from '../lib/forecast'
import { sampleBudgets, sampleCategories, sampleOperations, sampleRecurrences } from '../data/sampleData'
import { createBackup, parseBackup, type BackupFile } from '../lib/backup'
import { db } from '../lib/db'
import type { Account, Budget, Category, Operation, OperationType, Recurrence, RecurrenceType } from '../types/finance'

const STORAGE_KEY = 'previsio-app-mode'

const getStoredMode = (): AppMode => {
  if (typeof window === 'undefined') {
    return 'real'
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY)
  return storedValue === 'demo' ? 'demo' : 'real'
}

const createDefaultAccount = (): Account => ({
  id: 'main',
  name: 'Compte principal',
  initialBalance: 0,
  currency: 'EUR',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const useFinanceStore = defineStore('finance', () => {
  const operations = ref<Operation[]>([])
  const categories = ref<Category[]>([])
  const budgets = ref<Budget[]>([])
  const recurrences = ref<Recurrence[]>([])
  const account = ref<Account | null>(null)
  const operationsLoaded = ref(false)
  const collectionsLoaded = ref(false)
  const recurrencesLoaded = ref(false)
  const accountLoaded = ref(false)
  const appMode = ref<AppMode>(getStoredMode())

  // En mode démo, les modifications restent en mémoire et ne touchent jamais aux données réelles
  const persist = async (write: () => Promise<unknown>) => {
    if (appMode.value === 'real') {
      await write()
    }
  }

  const loadCollections = async () => {
    if (appMode.value === 'demo') {
      categories.value = [...sampleCategories]
      budgets.value = [...sampleBudgets]
      collectionsLoaded.value = true
      return
    }

    if (collectionsLoaded.value) {
      return
    }

    const storedCategories = await db.categories.toArray()
    const storedBudgets = await db.budgets.toArray()

    categories.value = storedCategories
    budgets.value = storedBudgets
    collectionsLoaded.value = true
  }

  const loadAccount = async () => {
    if (appMode.value === 'demo') {
      account.value = {
        ...createDefaultAccount(),
        name: 'Compte de démonstration',
        initialBalance: 2500,
      }
      accountLoaded.value = true
      return
    }

    if (accountLoaded.value && account.value) {
      return
    }

    const storedAccount = await db.accounts.toCollection().first()
    if (storedAccount) {
      account.value = storedAccount
      accountLoaded.value = true
      return
    }

    const defaultAccount = createDefaultAccount()
    await db.accounts.put(defaultAccount)
    account.value = defaultAccount
    accountLoaded.value = true
  }

  const loadOperations = async () => {
    if (appMode.value === 'demo') {
      operations.value = [...sampleOperations]
      operationsLoaded.value = true
      return
    }

    if (operationsLoaded.value) {
      return
    }

    const stored = await db.operations.toArray()
    operations.value = stored
    operationsLoaded.value = true
  }

  const loadRecurrences = async () => {
    if (appMode.value === 'demo') {
      recurrences.value = [...sampleRecurrences]
      recurrencesLoaded.value = true
      return
    }

    if (recurrencesLoaded.value) {
      return
    }

    const stored = await db.recurrences.toArray()
    recurrences.value = stored
    recurrencesLoaded.value = true
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

    await persist(() => db.operations.add(operation))
    operations.value = [operation, ...operations.value]
    return operation
  }

  const deleteOperation = async (id: string) => {
    await persist(() => db.operations.delete(id))
    operations.value = operations.value.filter((operation) => operation.id !== id)
  }

  const updateOperation = async (id: string, payload: {
    type: OperationType
    amount: number
    date: string
    categoryId: string
    accountId: string
    status: Operation['status']
    description: string
    isRecurring: boolean
  }) => {
    const current = operations.value.find((operation) => operation.id === id)
    const updated: Operation = {
      id,
      type: payload.type,
      amount: Number(payload.amount),
      date: payload.date,
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      status: payload.status,
      description: payload.description,
      isRecurring: payload.isRecurring,
      recurrenceId: current?.recurrenceId,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.operations.put(updated))
    operations.value = operations.value.map((operation) => (operation.id === id ? updated : operation))
    return updated
  }

  const addRecurrence = async (payload: {
    name: string
    type: RecurrenceType
    startDate: string
    amount: number
    categoryId: string
    accountId: string
    operationType: OperationType
    description: string
  }) => {
    const recurrence: Recurrence = {
      id: crypto.randomUUID(),
      ...payload,
      nextDate: payload.startDate,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.recurrences.add(recurrence))
    recurrences.value = [recurrence, ...recurrences.value]
    return recurrence
  }

  const updateRecurrence = async (id: string, payload: {
    name: string
    type: RecurrenceType
    startDate: string
    amount: number
    categoryId: string
    accountId: string
    operationType: OperationType
    description: string
    isActive?: boolean
  }) => {
    const current = recurrences.value.find((recurrence) => recurrence.id === id)
    const updated: Recurrence = {
      id,
      name: payload.name,
      type: payload.type,
      startDate: payload.startDate,
      nextDate: payload.startDate,
      amount: payload.amount,
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      operationType: payload.operationType,
      description: payload.description,
      isActive: payload.isActive ?? current?.isActive ?? true,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.recurrences.put(updated))
    recurrences.value = recurrences.value.map((recurrence) => (recurrence.id === id ? updated : recurrence))
    return updated
  }

  const deleteRecurrence = async (id: string) => {
    await persist(() => db.recurrences.delete(id))
    recurrences.value = recurrences.value.filter((recurrence) => recurrence.id !== id)
  }

  const addCategory = async (payload: { name: string; type: OperationType; color?: string }) => {
    const category: Category = {
      id: crypto.randomUUID(),
      name: payload.name,
      type: payload.type,
      color: payload.color ?? '#66d9c1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.categories.add(category))
    categories.value = [category, ...categories.value]
    return category
  }

  const deleteCategory = async (id: string) => {
    await persist(() => db.categories.delete(id))
    categories.value = categories.value.filter((category) => category.id !== id)
  }

  const updateCategory = async (id: string, payload: { name: string; type: OperationType; color?: string }) => {
    const current = categories.value.find((category) => category.id === id)
    const updated: Category = {
      id,
      name: payload.name.trim(),
      type: payload.type,
      color: payload.color ?? current?.color ?? '#66d9c1',
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.categories.put(updated))
    categories.value = categories.value.map((category) => (category.id === id ? updated : category))
    return updated
  }

  const categoryById = (id: string) => categories.value.find((category) => category.id === id)

  const addBudget = async (payload: { categoryId: string; month: string; plannedAmount: number }) => {
    const existing = budgets.value.find(
      (budget) => budget.categoryId === payload.categoryId && budget.month === payload.month,
    )

    if (existing) {
      const updated = {
        ...existing,
        plannedAmount: payload.plannedAmount,
        updatedAt: new Date().toISOString(),
      }

      await persist(() => db.budgets.put(updated))
      budgets.value = budgets.value.map((budget) => (budget.id === updated.id ? updated : budget))
      return updated
    }

    const budget: Budget = {
      id: crypto.randomUUID(),
      categoryId: payload.categoryId,
      month: payload.month,
      plannedAmount: payload.plannedAmount,
      actualAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.budgets.add(budget))
    budgets.value = [budget, ...budgets.value]
    return budget
  }

  const updateBudget = async (id: string, payload: { categoryId: string; month: string; plannedAmount: number }) => {
    const current = budgets.value.find((budget) => budget.id === id)
    const updated: Budget = {
      id,
      categoryId: payload.categoryId,
      month: payload.month,
      plannedAmount: Number(payload.plannedAmount),
      actualAmount: current?.actualAmount ?? 0,
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await persist(() => db.budgets.put(updated))
    budgets.value = budgets.value.map((budget) => (budget.id === id ? updated : budget))
    return updated
  }

  const deleteBudget = async (id: string) => {
    await persist(() => db.budgets.delete(id))
    budgets.value = budgets.value.filter((budget) => budget.id !== id)
  }

  const getActualAmountForBudget = (budget: Budget) => {
    const monthPrefix = budget.month

    return operations.value
      .filter((operation) => operation.categoryId === budget.categoryId)
      .filter((operation) => operation.date.startsWith(monthPrefix))
      .reduce((total, operation) => total + (operation.type === 'expense' ? operation.amount : 0), 0)
  }

  const realBalance = computed(
    () => (account.value?.initialBalance ?? 0) + calculateRealBalanceAtDate(operations.value, new Date()),
  )

  // Échéances des récurrences à partir d'aujourd'hui et sur un an, traitées comme des opérations prévues.
  // Les échéances passées ne comptent pas : seules les opérations saisies font foi pour le passé.
  const upcomingRecurringOperations = computed<Operation[]>(() => {
    const start = new Date()
    return getRecurringOperationsInRange(recurrences.value, start, addDays(start, 366)).map((occurrence) => ({
      ...occurrence,
      createdAt: '',
      updatedAt: '',
    }))
  })

  // Opérations saisies + échéances à venir : base de tous les calculs de plan et de prévision
  const projectedOperations = computed(() => [...operations.value, ...upcomingRecurringOperations.value])

  const monthEndBalance = computed(
    () => (account.value?.initialBalance ?? 0) + calculateMonthEndBalance(projectedOperations.value, new Date()),
  )

  const forecast = computed(() => {
    const accountInitialBalance = account.value?.initialBalance ?? 0
    const snapshot = (horizonDays: number) => {
      const result = buildForecastSnapshot(projectedOperations.value, new Date(), horizonDays)
      return {
        ...result,
        realBalance: result.realBalance + accountInitialBalance,
        projectedBalance: result.projectedBalance + accountInitialBalance,
      }
    }

    return {
      short: snapshot(30),
      medium: snapshot(90),
      long: snapshot(365),
    }
  })

  const monthlyPlan = computed(() => buildMonthlyPlan(projectedOperations.value, new Date(), 3))

  // 6 mois passés + mois en cours + 2 mois à venir, pour le graphique entrées / dépenses
  const monthlyHistory = computed(() => buildMonthlyPlan(projectedOperations.value, subMonths(new Date(), 6), 9))

  const nextMovements = computed(() =>
    [...operations.value]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5),
  )

  const setMode = async (mode: AppMode) => {
    appMode.value = mode
    window.localStorage.setItem(STORAGE_KEY, mode)

    collectionsLoaded.value = false
    operationsLoaded.value = false
    recurrencesLoaded.value = false
    accountLoaded.value = false

    await loadCollections()
    await loadOperations()
    await loadRecurrences()
    await loadAccount()
  }

  // Recharge les données d'exemple en mémoire, sans toucher à la base
  const resetDemoData = async () => {
    await setMode('demo')
  }

  const clearPersonalData = async () => {
    await db.operations.clear()
    await db.categories.clear()
    await db.budgets.clear()
    await db.recurrences.clear()

    operations.value = []
    categories.value = []
    budgets.value = []
    recurrences.value = []

    const emptyAccount = createDefaultAccount()
    await db.accounts.put(emptyAccount)
    account.value = emptyAccount

    appMode.value = 'real'
    window.localStorage.setItem(STORAGE_KEY, 'real')

    collectionsLoaded.value = true
    operationsLoaded.value = true
    recurrencesLoaded.value = true
    accountLoaded.value = true
  }

  // Lit directement la base pour exporter les données réelles, même si le mode démo est affiché
  const exportBackup = async (): Promise<BackupFile> =>
    createBackup({
      accounts: await db.accounts.toArray(),
      categories: await db.categories.toArray(),
      operations: await db.operations.toArray(),
      recurrences: await db.recurrences.toArray(),
      budgets: await db.budgets.toArray(),
    })

  // Remplace toutes les données réelles par celles de la sauvegarde
  const importBackup = async (text: string) => {
    const data = parseBackup(text)

    await db.transaction('rw', [db.accounts, db.categories, db.operations, db.recurrences, db.budgets], async () => {
      await db.accounts.clear()
      await db.categories.clear()
      await db.operations.clear()
      await db.recurrences.clear()
      await db.budgets.clear()

      await db.accounts.bulkPut(data.accounts)
      await db.categories.bulkPut(data.categories)
      await db.operations.bulkPut(data.operations)
      await db.recurrences.bulkPut(data.recurrences)
      await db.budgets.bulkPut(data.budgets)
    })

    await setMode('real')
    return data
  }

  const currentMonthKey = computed(() => format(new Date(), 'yyyy-MM'))

  // Mois ayant au moins une dépense, plus le mois en cours, du plus récent au plus ancien
  const expenseMonths = computed(() => {
    const months = new Set([currentMonthKey.value])
    projectedOperations.value
      .filter((operation) => operation.type === 'expense')
      .forEach((operation) => months.add(operation.date.slice(0, 7)))
    return [...months].sort((left, right) => right.localeCompare(left))
  })

  // Dépenses du mois (tous statuts, comme le plan mensuel) par catégorie, du plus gros poste au plus petit
  const getExpenseBreakdown = (monthKey: string) => {
    const groups = new Map<string, number>()

    projectedOperations.value
      .filter((operation) => operation.type === 'expense' && operation.date.startsWith(monthKey))
      .forEach((operation) => {
        groups.set(operation.categoryId, (groups.get(operation.categoryId) ?? 0) + operation.amount)
      })

    const total = [...groups.values()].reduce((sum, value) => sum + value, 0)
    const items = [...groups.entries()]
      .map(([categoryId, amount]) => {
        const category = categoryById(categoryId)
        return {
          categoryId,
          total: amount,
          share: total ? Math.round((amount / total) * 100) : 0,
          label: category?.name ?? 'Sans catégorie',
          color: category?.color ?? '#9fb5d9',
        }
      })
      .sort((left, right) => right.total - left.total)

    return { monthKey, label: formatMonthLabel(monthKey), total, items }
  }

  const setInitialBalance = async (value: number) => {
    const nextAccount = {
      ...(account.value ?? createDefaultAccount()),
      initialBalance: Number.isFinite(value) ? Math.max(0, value) : 0,
      currency: 'EUR',
      updatedAt: new Date().toISOString(),
    }

    if (appMode.value === 'demo') {
      account.value = nextAccount
      return nextAccount
    }

    await db.accounts.put(nextAccount)
    account.value = nextAccount
    return nextAccount
  }

  return {
    appMode,
    account,
    operations,
    categories,
    budgets,
    recurrences,
    operationsLoaded,
    collectionsLoaded,
    recurrencesLoaded,
    modeOptions: getModeOptions(),
    loadCollections,
    loadAccount,
    loadOperations,
    loadRecurrences,
    setMode,
    setInitialBalance,
    addOperation,
    updateOperation,
    deleteOperation,
    addRecurrence,
    updateRecurrence,
    deleteRecurrence,
    addCategory,
    updateCategory,
    deleteCategory,
    addBudget,
    updateBudget,
    deleteBudget,
    categoryById,
    getActualAmountForBudget,
    realBalance,
    monthEndBalance,
    forecast,
    monthlyPlan,
    monthlyHistory,
    nextMovements,
    upcomingRecurringOperations,
    resetDemoData,
    clearPersonalData,
    exportBackup,
    importBackup,
    currentMonthKey,
    expenseMonths,
    getExpenseBreakdown,
  }
})
