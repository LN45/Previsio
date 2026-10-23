import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backupFileName, createBackup, parseBackup, type BackupData } from '../src/lib/backup'
import { db } from '../src/lib/db'
import { useFinanceStore } from '../src/stores/finance'

const sampleData = (): BackupData => ({
  accounts: [{ id: 'main', name: 'Compte principal', initialBalance: 1200, currency: 'EUR', createdAt: '2026-10-01', updatedAt: '2026-10-01' }],
  categories: [{ id: 'food', name: 'Alimentation', type: 'expense', color: '#f8c76f', createdAt: '2026-10-01', updatedAt: '2026-10-01' }],
  operations: [
    {
      id: 'op-1',
      type: 'expense',
      amount: 42,
      date: '2026-10-02',
      categoryId: 'food',
      accountId: 'main',
      status: 'real',
      description: 'Courses',
      isRecurring: false,
      createdAt: '2026-10-02',
      updatedAt: '2026-10-02',
    },
  ],
  recurrences: [],
  budgets: [],
})

describe('backup', () => {
  it('round-trips data through createBackup and parseBackup', () => {
    const backup = createBackup(sampleData(), new Date('2026-10-23T10:00:00Z'))

    expect(backup.app).toBe('previsio')
    expect(backup.exportedAt).toBe('2026-10-23T10:00:00.000Z')
    expect(parseBackup(JSON.stringify(backup))).toEqual(sampleData())
  })

  it('names the file with the export date', () => {
    expect(backupFileName(new Date('2026-10-23T10:00:00Z'))).toBe('previsio-sauvegarde-2026-10-23.json')
  })

  it('rejects invalid files', () => {
    expect(() => parseBackup('pas du json')).toThrow('JSON valide')
    expect(() => parseBackup(JSON.stringify({ app: 'autre', data: {} }))).toThrow('pas une sauvegarde Prévisio')
    expect(() => parseBackup(JSON.stringify({ ...createBackup(sampleData()), version: 99 }))).toThrow('plus récente')

    const missingOperations = createBackup(sampleData()) as unknown as { data: Record<string, unknown> }
    delete missingOperations.data.operations
    expect(() => parseBackup(JSON.stringify(missingOperations))).toThrow('(operations)')
  })
})

describe('finance store backup', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => 'demo'),
        setItem: vi.fn(),
      },
    })
  })

  it('replaces real data on import and switches to real mode', async () => {
    const data = sampleData()
    const tables = [db.accounts, db.categories, db.operations, db.recurrences, db.budgets] as const
    vi.spyOn(db, 'transaction').mockImplementation((async (...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<void>
      await callback()
    }) as never)
    for (const table of tables) {
      vi.spyOn(table, 'clear').mockResolvedValue(undefined)
      vi.spyOn(table, 'bulkPut').mockResolvedValue('' as never)
    }
    vi.spyOn(db.accounts, 'toCollection').mockReturnValue({ first: async () => data.accounts[0] } as never)
    vi.spyOn(db.categories, 'toArray').mockResolvedValue(data.categories)
    vi.spyOn(db.budgets, 'toArray').mockResolvedValue(data.budgets)
    vi.spyOn(db.operations, 'toArray').mockResolvedValue(data.operations)
    vi.spyOn(db.recurrences, 'toArray').mockResolvedValue(data.recurrences)

    const store = useFinanceStore()
    expect(store.appMode).toBe('demo')

    await store.importBackup(JSON.stringify(createBackup(data)))

    for (const table of tables) {
      expect(table.clear).toHaveBeenCalled()
    }
    expect(db.operations.bulkPut).toHaveBeenCalledWith(data.operations)
    expect(store.appMode).toBe('real')
    expect(store.operations).toEqual(data.operations)
    expect(store.account?.initialBalance).toBe(1200)
  })

  it('leaves the database untouched when the file is invalid', async () => {
    const transaction = vi.spyOn(db, 'transaction')
    const store = useFinanceStore()

    await expect(store.importBackup('{}')).rejects.toThrow()
    expect(transaction).not.toHaveBeenCalled()
  })
})
