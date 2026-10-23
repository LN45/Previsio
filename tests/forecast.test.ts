import { describe, expect, it } from 'vitest'
import { addDays, parseISO } from 'date-fns'
import {
  buildForecastSnapshot,
  buildMonthlyPlan,
  calculateMonthEndBalance,
  calculateProjectedBalance,
  calculateRealBalanceAtDate,
  generateRecurringOccurrences,
  getRecurringOperationsInRange,
} from '../src/lib/forecast'

describe('financial forecast engine', () => {
  it('calculates the real balance from real operations only', () => {
    const operations = [
      { id: 'o1', type: 'income', amount: 2500, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o2', type: 'expense', amount: 1200, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o3', type: 'expense', amount: 180, date: '2026-10-25', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Courses', isRecurring: false, createdAt: '2026-10-01', updatedAt: '2026-10-01' },
    ]

    expect(calculateRealBalanceAtDate(operations, parseISO('2026-10-15'))).toBe(1300)
  })

  it('projects the upcoming balance including planned operations', () => {
    const operations = [
      { id: 'o1', type: 'income', amount: 2500, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o2', type: 'expense', amount: 1200, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o3', type: 'expense', amount: 180, date: '2026-10-25', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Courses', isRecurring: false, createdAt: '2026-10-01', updatedAt: '2026-10-01' },
      { id: 'o4', type: 'income', amount: 2500, date: '2026-11-01', categoryId: 'salary', accountId: 'main', status: 'planned', description: 'Salaire du mois prochain', isRecurring: true, createdAt: '2026-10-15', updatedAt: '2026-10-15' },
    ]

    const balance = calculateProjectedBalance(operations, parseISO('2026-10-15'), 45)

    expect(balance).toBe(1300 + 2500 - 180)
  })

  it('generates recurring monthly occurrences in a date window', () => {
    const recurring = {
      id: 'r1',
      name: 'Loyer',
      type: 'monthly',
      startDate: '2026-10-05',
      nextDate: '2026-10-05',
      amount: 1200,
      categoryId: 'housing',
      accountId: 'main',
      operationType: 'expense',
      description: 'Loyer',
      isActive: true,
    }

    const occurrences = generateRecurringOccurrences(recurring, parseISO('2026-10-01'), addDays(parseISO('2026-12-31'), 1))

    expect(occurrences).toHaveLength(3)
    expect(occurrences[0].amount).toBe(1200)
    expect(occurrences[1].date).toBe('2026-11-05')
    expect(occurrences[2].date).toBe('2026-12-05')
  })

  it('builds a forecast snapshot with real and projected balance', () => {
    const operations = [
      { id: 'o1', type: 'income', amount: 2500, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o2', type: 'expense', amount: 1200, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o3', type: 'expense', amount: 180, date: '2026-10-25', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Courses', isRecurring: false, createdAt: '2026-10-01', updatedAt: '2026-10-01' },
      { id: 'o4', type: 'income', amount: 2500, date: '2026-11-01', categoryId: 'salary', accountId: 'main', status: 'planned', description: 'Salaire suivant', isRecurring: true, createdAt: '2026-10-15', updatedAt: '2026-10-15' },
    ]

    const snapshot = buildForecastSnapshot(operations, parseISO('2026-10-15'), 45)

    expect(snapshot.realBalance).toBe(1300)
    expect(snapshot.projectedBalance).toBe(1300 + 2500 - 180)
    expect(snapshot.futureOperationsTotal).toBe(2320)
  })

  it('aggregates active recurring occurrences within a date window', () => {
    const recurrences = [
      {
        id: 'r1',
        name: 'Loyer',
        type: 'monthly',
        startDate: '2026-10-05',
        nextDate: '2026-10-05',
        amount: 1200,
        categoryId: 'housing',
        accountId: 'main',
        operationType: 'expense',
        description: 'Loyer',
        isActive: true,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
      },
      {
        id: 'r2',
        name: 'Assurance',
        type: 'yearly',
        startDate: '2026-12-10',
        nextDate: '2026-12-10',
        amount: 320,
        categoryId: 'insurance',
        accountId: 'main',
        operationType: 'expense',
        description: 'Assurance auto',
        isActive: true,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
      },
    ]

    const occurrences = getRecurringOperationsInRange(recurrences, parseISO('2026-10-01'), parseISO('2026-12-31'))

    expect(occurrences.map((entry) => entry.date)).toEqual(['2026-10-05', '2026-11-05', '2026-12-05', '2026-12-10'])
    expect(occurrences.reduce((sum, entry) => sum + entry.amount, 0)).toBe(1200 + 1200 + 1200 + 320)
  })

  it('builds a monthly planning summary for the next months', () => {
    const operations = [
      { id: 'o1', type: 'income', amount: 2600, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o2', type: 'expense', amount: 1200, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o3', type: 'income', amount: 2600, date: '2026-11-01', categoryId: 'salary', accountId: 'main', status: 'planned', description: 'Salaire novembre', isRecurring: true, createdAt: '2026-10-15', updatedAt: '2026-10-15' },
      { id: 'o4', type: 'expense', amount: 1350, date: '2026-11-20', categoryId: 'housing', accountId: 'main', status: 'planned', description: 'Loyer novembre', isRecurring: true, createdAt: '2026-10-15', updatedAt: '2026-10-15' },
      { id: 'o5', type: 'income', amount: 2800, date: '2026-12-01', categoryId: 'salary', accountId: 'main', status: 'planned', description: 'Salaire décembre', isRecurring: true, createdAt: '2026-10-15', updatedAt: '2026-10-15' },
      { id: 'o6', type: 'expense', amount: 1400, date: '2026-12-12', categoryId: 'housing', accountId: 'main', status: 'planned', description: 'Loyer décembre', isRecurring: true, createdAt: '2026-10-15', updatedAt: '2026-10-15' },
    ]

    const plan = buildMonthlyPlan(operations, parseISO('2026-10-10'), 3)

    expect(plan).toHaveLength(3)
    expect(plan[0].label).toBe('oct. 2026')
    expect(plan[0].income).toBe(2600)
    expect(plan[0].expense).toBe(1200)
    expect(plan[0].net).toBe(1400)
    expect(plan[1].label).toBe('nov. 2026')
    expect(plan[1].net).toBe(1250)
    expect(plan[2].label).toBe('déc. 2026')
    expect(plan[2].net).toBe(1400)
  })

  it('carries each month closing balance over to the next month', () => {
    const operations = [
      { id: 'o0', type: 'income', amount: 300, date: '2026-09-15', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Avant le plan', isRecurring: false, createdAt: '', updatedAt: '' },
      { id: 'o9', type: 'expense', amount: 999, date: '2026-09-20', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Prévu jamais confirmé', isRecurring: false, createdAt: '', updatedAt: '' },
      { id: 'o1', type: 'income', amount: 2600, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '', updatedAt: '' },
      { id: 'o2', type: 'expense', amount: 1200, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '', updatedAt: '' },
      { id: 'o3', type: 'expense', amount: 1500, date: '2026-11-05', categoryId: 'housing', accountId: 'main', status: 'planned', description: 'Loyer', isRecurring: true, createdAt: '', updatedAt: '' },
    ]

    const plan = buildMonthlyPlan(operations, parseISO('2026-10-23T10:00:00'), 3, 1000)

    expect(plan.map((month) => [month.opening, month.closing])).toEqual([
      [1300, 2700],
      [2700, 1200],
      [1200, 1200],
    ])
    expect(plan[0].closing).toBe(1000 + calculateMonthEndBalance(operations, parseISO('2026-10-23T10:00:00')))
  })

  it('computes the month-end balance from past real operations and everything left in the month', () => {
    const operations = [
      { id: 'o1', type: 'income', amount: 2500, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '', updatedAt: '' },
      { id: 'o2', type: 'expense', amount: 1200, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '', updatedAt: '' },
      { id: 'o3', type: 'expense', amount: 180, date: '2026-10-25', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Courses', isRecurring: false, createdAt: '', updatedAt: '' },
      { id: 'o4', type: 'expense', amount: 40, date: '2026-10-10', categoryId: 'food', accountId: 'main', status: 'estimated', description: 'Restaurant non confirmé', isRecurring: false, createdAt: '', updatedAt: '' },
      { id: 'o5', type: 'expense', amount: 60, date: '2026-10-28', categoryId: 'transport', accountId: 'main', status: 'real', description: 'Train déjà réservé', isRecurring: false, createdAt: '', updatedAt: '' },
      { id: 'o6', type: 'expense', amount: 999, date: '2026-11-02', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Mois suivant', isRecurring: false, createdAt: '', updatedAt: '' },
      { id: 'o7', type: 'expense', amount: 500, date: '2026-09-20', categoryId: 'food', accountId: 'main', status: 'planned', description: 'Ancien prévu jamais confirmé', isRecurring: false, createdAt: '', updatedAt: '' },
    ]

    expect(calculateMonthEndBalance(operations, parseISO('2026-10-23T10:00:00'))).toBe(2500 - 1200 - 180 - 40 - 60)
  })

  it('keeps decimal values when calculating entries and expenses', () => {
    const operations = [
      { id: 'o1', type: 'income', amount: 1250.5, date: '2026-10-01', categoryId: 'salary', accountId: 'main', status: 'real', description: 'Salaire', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
      { id: 'o2', type: 'expense', amount: 420.35, date: '2026-10-05', categoryId: 'housing', accountId: 'main', status: 'real', description: 'Loyer', isRecurring: true, createdAt: '2026-09-28', updatedAt: '2026-09-28' },
    ]

    expect(calculateRealBalanceAtDate(operations, parseISO('2026-10-10'))).toBe(830.15)
  })
})
