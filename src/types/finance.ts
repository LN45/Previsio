export type OperationType = 'income' | 'expense'
export type OperationStatus = 'real' | 'planned' | 'estimated'
export type RecurrenceType = 'monthly' | 'quarterly' | 'yearly'

export interface Category {
  id: string
  name: string
  type: OperationType
  color?: string
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  name: string
  initialBalance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Operation {
  id: string
  type: OperationType
  amount: number
  date: string
  categoryId: string
  accountId: string
  status: OperationStatus
  description: string
  isRecurring: boolean
  recurrenceId?: string
  createdAt: string
  updatedAt: string
}

export interface Recurrence {
  id: string
  name: string
  type: RecurrenceType
  startDate: string
  nextDate: string
  amount: number
  categoryId: string
  accountId: string
  operationType: OperationType
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  categoryId: string
  month: string
  plannedAmount: number
  actualAmount: number
  createdAt: string
  updatedAt: string
}

export interface ForecastScenario {
  id: string
  name: string
  baseDate: string
  horizonDays: number
  variableExpensesPerMonth: number
  extraIncomePerMonth: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ForecastSnapshot {
  realBalance: number
  projectedBalance: number
  futureOperationsTotal: number
  estimatedVariableExpenses: number
  dateFrom: string
  dateTo: string
}
