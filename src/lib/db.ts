import Dexie, { type Table } from 'dexie'
import type { Account, Budget, Category, ForecastScenario, Operation, Recurrence } from '../types/finance'

class FinanceDatabase extends Dexie {
  accounts!: Table<Account, string>
  categories!: Table<Category, string>
  operations!: Table<Operation, string>
  recurrences!: Table<Recurrence, string>
  budgets!: Table<Budget, string>
  scenarios!: Table<ForecastScenario, string>

  constructor() {
    super('finance-planner-db')

    this.version(1).stores({
      accounts: '&id, name, currency',
      categories: '&id, type, name',
      operations: '&id, date, status, type, categoryId, accountId',
      recurrences: '&id, type, nextDate, isActive, accountId, categoryId',
      budgets: '&id, month, categoryId',
      scenarios: '&id, baseDate, name',
    })
  }
}

export const db = new FinanceDatabase()
