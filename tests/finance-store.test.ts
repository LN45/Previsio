import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../src/lib/db'
import { useFinanceStore } from '../src/stores/finance'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('window', {
    localStorage: {
      getItem: vi.fn(() => 'real'),
      setItem: vi.fn(),
    },
  })

  vi.spyOn(db.operations, 'clear').mockResolvedValue(undefined)
  vi.spyOn(db.operations, 'add').mockImplementation(async (value) => value.id)
  vi.spyOn(db.operations, 'put').mockImplementation(async (value) => value.id)
  vi.spyOn(db.categories, 'clear').mockResolvedValue(undefined)
  vi.spyOn(db.categories, 'add').mockImplementation(async (value) => value.id)
  vi.spyOn(db.categories, 'put').mockImplementation(async (value) => value.id)
  vi.spyOn(db.budgets, 'clear').mockResolvedValue(undefined)
  vi.spyOn(db.budgets, 'add').mockImplementation(async (value) => value.id)
  vi.spyOn(db.budgets, 'put').mockImplementation(async (value) => value.id)
  vi.spyOn(db.recurrences, 'clear').mockResolvedValue(undefined)
  vi.spyOn(db.accounts, 'put').mockResolvedValue('main')
})

describe('finance store', () => {
  it('keeps the real account empty after cleaning personal data', async () => {
    const store = useFinanceStore()

    expect(typeof store.clearPersonalData).toBe('function')

    const result = await store.clearPersonalData()

    expect(result).toBeUndefined()
    expect(store.appMode).toBe('real')
    expect(store.operations).toHaveLength(0)
    expect(store.categories).toHaveLength(0)
    expect(store.budgets).toHaveLength(0)
    expect(store.recurrences).toHaveLength(0)
  })

  it('updates an existing operation, category and budget', async () => {
    const store = useFinanceStore()

    const createdOperation = await store.addOperation({
      type: 'expense',
      amount: 50,
      date: '2026-10-01',
      categoryId: 'food',
      accountId: 'main',
      status: 'planned',
      description: 'Courses',
      isRecurring: false,
    })

    const createdCategory = await store.addCategory({
      name: 'Courses',
      type: 'expense',
      color: '#ff0000',
    })

    const createdBudget = await store.addBudget({
      categoryId: createdCategory.id,
      month: '2026-10',
      plannedAmount: 400,
    })

    await store.updateOperation(createdOperation.id, {
      type: 'expense',
      amount: 90,
      date: '2026-10-05',
      categoryId: createdCategory.id,
      accountId: 'main',
      status: 'real',
      description: 'Courses du mois',
      isRecurring: true,
    })

    await store.updateCategory(createdCategory.id, {
      name: 'Courses maison',
      type: 'expense',
      color: '#00ff00',
    })

    await store.updateBudget(createdBudget.id, {
      categoryId: createdCategory.id,
      month: '2026-10',
      plannedAmount: 500,
    })

    expect(store.operations[0].description).toBe('Courses du mois')
    expect(store.operations[0].amount).toBe(90)
    expect(store.categories[0].name).toBe('Courses maison')
    expect(store.categories[0].color).toBe('#00ff00')
    expect(store.budgets[0].plannedAmount).toBe(500)
  })

  it('groups the expenses of a month by category with their real name and color', async () => {
    const store = useFinanceStore()
    const category = await store.addCategory({ name: 'Loisirs', type: 'expense', color: '#123456' })
    const expense = {
      type: 'expense' as const,
      date: '2026-10-01',
      accountId: 'main',
      status: 'real' as const,
      description: 'Test',
      isRecurring: false,
    }

    await store.addOperation({ ...expense, amount: 30, categoryId: category.id })
    await store.addOperation({ ...expense, amount: 20, categoryId: category.id })
    await store.addOperation({ ...expense, amount: 150, categoryId: 'deleted-category', status: 'planned' })
    await store.addOperation({ ...expense, type: 'income', amount: 1000, categoryId: category.id })
    await store.addOperation({ ...expense, amount: 999, categoryId: category.id, date: '2026-09-30' })

    expect(store.getExpenseBreakdown('2026-10')).toEqual({
      monthKey: '2026-10',
      label: 'oct. 2026',
      total: 200,
      items: [
        { categoryId: 'deleted-category', total: 150, share: 75, label: 'Sans catégorie', color: '#9fb5d9' },
        { categoryId: category.id, total: 50, share: 25, label: 'Loisirs', color: '#123456' },
      ],
    })
    expect(store.getExpenseBreakdown('2026-08')).toMatchObject({ total: 0, items: [] })
    expect(store.expenseMonths).toEqual(expect.arrayContaining(['2026-10', '2026-09', store.currentMonthKey]))
    expect(store.expenseMonths).toEqual([...store.expenseMonths].sort().reverse())
  })

  it('counts upcoming recurrence occurrences but not past ones', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-23T10:00:00'))
    vi.spyOn(db.recurrences, 'add').mockImplementation(async (value) => value.id)

    try {
      const store = useFinanceStore()
      await store.addRecurrence({
        name: 'Loyer',
        type: 'monthly',
        startDate: '2026-09-05',
        amount: 750,
        categoryId: 'housing',
        accountId: 'main',
        operationType: 'expense',
        description: 'Loyer',
      })
      await store.addRecurrence({
        name: 'Abonnement',
        type: 'monthly',
        startDate: '2026-09-28',
        amount: 20,
        categoryId: 'leisure',
        accountId: 'main',
        operationType: 'expense',
        description: 'Abonnement',
      })
      await store.addOperation({
        type: 'expense',
        amount: 750,
        date: '2026-10-05',
        categoryId: 'housing',
        accountId: 'main',
        status: 'real',
        description: 'Loyer octobre payé',
        isRecurring: true,
      })

      // Octobre : loyer saisi (750) + abonnement du 28 à venir (20) ; l'échéance passée du 5 n'est pas recomptée
      expect(store.monthlyPlan[0].expense).toBe(770)
      expect(store.monthlyPlan[1].expense).toBe(770)
      expect(store.monthEndBalance).toBe(-770)
      expect(store.realBalance).toBe(-750)
      expect(store.getExpenseBreakdown('2026-11').total).toBe(770)
      expect(store.operations).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('turns due recurrence occurrences into real operations deducted from the balance', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-05T08:00:00'))
    vi.spyOn(db.recurrences, 'add').mockImplementation(async (value) => value.id)
    vi.spyOn(db.recurrences, 'put').mockImplementation(async (value) => value.id)
    vi.spyOn(db.operations, 'bulkPut').mockImplementation(async () => '')
    vi.spyOn(db.operations, 'delete').mockResolvedValue(undefined)

    try {
      const store = useFinanceStore()
      const recurrence = await store.addRecurrence({
        name: 'Loyer',
        type: 'monthly',
        startDate: '2026-09-05',
        amount: 750,
        categoryId: 'housing',
        accountId: 'main',
        operationType: 'expense',
        description: 'Loyer',
      })

      // Échéance du jour : enregistrée comme opération réelle, pas d'échéance de septembre rattrapée
      expect(store.operations).toHaveLength(1)
      expect(store.operations[0]).toMatchObject({ date: '2026-10-05', status: 'real', recurrenceId: recurrence.id })
      expect(store.realBalance).toBe(-750)
      expect(store.monthlyPlan[0].expense).toBe(750)
      expect(recurrence.nextDate).toBe('2026-11-05')

      // Le mois suivant, l'échéance du 5 novembre bascule à son tour
      vi.setSystemTime(new Date('2026-11-06T08:00:00'))
      await store.settleDueRecurrences()
      expect(store.operations.map((operation) => operation.date)).toEqual(['2026-11-05', '2026-10-05'])
      expect(store.realBalance).toBe(-1500)

      // Une échéance supprimée n'est pas recréée
      await store.deleteOperation(store.operations[0].id)
      await store.settleDueRecurrences()
      expect(store.operations).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never writes to the database in demo mode', async () => {
    const store = useFinanceStore()
    await store.setMode('demo')
    const sampleCount = store.operations.length

    const created = await store.addOperation({
      type: 'expense',
      amount: 12,
      date: '2026-10-01',
      categoryId: 'food',
      accountId: 'main',
      status: 'real',
      description: 'Test démo',
      isRecurring: false,
    })
    await store.addCategory({ name: 'Démo', type: 'expense' })
    await store.addBudget({ categoryId: 'food', month: '2026-10', plannedAmount: 300 })

    expect(store.operations).toHaveLength(sampleCount + 1)
    expect(db.operations.add).not.toHaveBeenCalled()
    expect(db.categories.add).not.toHaveBeenCalled()
    expect(db.budgets.add).not.toHaveBeenCalled()
    expect(db.budgets.put).not.toHaveBeenCalled()

    await store.resetDemoData()

    expect(store.operations).toHaveLength(sampleCount)
    expect(store.operations.some((operation) => operation.id === created.id)).toBe(false)
    expect(db.operations.clear).not.toHaveBeenCalled()
    expect(db.accounts.put).not.toHaveBeenCalled()
  })
})
