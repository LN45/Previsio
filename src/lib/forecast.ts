import {
  addDays,
  addMonths,
  addYears,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
} from 'date-fns'
import type { ForecastSnapshot, Operation, Recurrence } from '../types/finance'

const normalizeDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return value
  }

  return parseISO(value)
}

const operationSignedAmount = (operation: Operation): number => {
  return operation.type === 'income' ? operation.amount : -operation.amount
}

const isWithinRange = (date: Date, from: Date, to: Date): boolean => {
  return (date >= from && date <= to) || isSameDay(date, from) || isSameDay(date, to)
}

export function calculateRealBalanceAtDate(operations: Operation[], asOfDate: Date): number {
  const limit = normalizeDate(asOfDate)

  return operations
    .filter((operation) => operation.status === 'real')
    .filter((operation) => {
      const date = normalizeDate(operation.date)
      return date <= limit
    })
    .reduce((total, operation) => total + operationSignedAmount(operation), 0)
}

export function calculateProjectedBalance(
  operations: Operation[],
  asOfDate: Date,
  horizonDays: number,
): number {
  const start = normalizeDate(asOfDate)
  const end = addDays(start, horizonDays)

  const realBalance = calculateRealBalanceAtDate(operations, start)
  const futureOperations = operations.filter((operation) => {
    if (operation.status === 'real') {
      return false
    }

    const date = normalizeDate(operation.date)
    return isAfter(date, start) && isBefore(date, end) || isSameDay(date, end)
  })

  const futureTotal = futureOperations.reduce((total, operation) => total + operationSignedAmount(operation), 0)

  return realBalance + futureTotal
}

export function generateRecurringOccurrences(
  recurrence: Recurrence,
  startDate: Date,
  endDate: Date,
): Array<{ id: string; type: Operation['type']; amount: number; date: string; categoryId: string; accountId: string; status: Operation['status']; description: string; isRecurring: true; recurrenceId: string }> {
  const occurrences: Array<{ id: string; type: Operation['type']; amount: number; date: string; categoryId: string; accountId: string; status: Operation['status']; description: string; isRecurring: true; recurrenceId: string }> = []

  const rangeStart = normalizeDate(startDate)
  const rangeEnd = normalizeDate(endDate)
  let cursor = normalizeDate(recurrence.startDate)

  while (cursor <= rangeEnd) {
    if (isWithinRange(cursor, rangeStart, rangeEnd)) {
      occurrences.push({
        id: `${recurrence.id}-${format(cursor, 'yyyy-MM-dd')}`,
        type: recurrence.operationType,
        amount: recurrence.amount,
        date: format(cursor, 'yyyy-MM-dd'),
        categoryId: recurrence.categoryId,
        accountId: recurrence.accountId,
        status: 'planned',
        description: recurrence.description,
        isRecurring: true,
        recurrenceId: recurrence.id,
      })
    }

    if (recurrence.type === 'monthly') {
      cursor = addMonths(cursor, 1)
    } else if (recurrence.type === 'quarterly') {
      cursor = addMonths(cursor, 3)
    } else {
      cursor = addYears(cursor, 1)
    }
  }

  return occurrences
}

export function getEstimatedVariableExpenses(
  operations: Operation[],
  asOfDate: Date,
  horizonDays: number,
): number {
  const start = normalizeDate(asOfDate)
  const end = addDays(start, horizonDays)

  return operations
    .filter((operation) => operation.status === 'estimated')
    .filter((operation) => {
      const date = normalizeDate(operation.date)
      return date > start && date <= end && operation.type === 'expense'
    })
    .reduce((total, operation) => total + operation.amount, 0)
}

export function buildForecastSnapshot(
  operations: Operation[],
  asOfDate: Date,
  horizonDays: number,
): ForecastSnapshot {
  const from = normalizeDate(asOfDate)
  const to = addDays(from, horizonDays)

  const realBalance = calculateRealBalanceAtDate(operations, from)
  const projectedBalance = calculateProjectedBalance(operations, from, horizonDays)
  const futureOperationsTotal = operations
    .filter((operation) => operation.status !== 'real')
    .filter((operation) => {
      const date = normalizeDate(operation.date)
      return date > from && date <= to
    })
    .reduce((total, operation) => total + operationSignedAmount(operation), 0)

  const estimatedVariableExpenses = getEstimatedVariableExpenses(operations, from, horizonDays)

  return {
    realBalance,
    projectedBalance,
    futureOperationsTotal,
    estimatedVariableExpenses,
    dateFrom: format(from, 'yyyy-MM-dd'),
    dateTo: format(to, 'yyyy-MM-dd'),
  }
}
