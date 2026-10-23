import type { Account, Budget, Category, Operation, Recurrence } from '../types/finance'

export const BACKUP_APP = 'previsio'
export const BACKUP_VERSION = 1

export interface BackupData {
  accounts: Account[]
  categories: Category[]
  operations: Operation[]
  recurrences: Recurrence[]
  budgets: Budget[]
}

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: BackupData
}

const COLLECTIONS: (keyof BackupData)[] = ['accounts', 'categories', 'operations', 'recurrences', 'budgets']

export const createBackup = (data: BackupData, now = new Date()): BackupFile => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: now.toISOString(),
  data,
})

export const backupFileName = (now = new Date()) => `previsio-sauvegarde-${now.toISOString().slice(0, 10)}.json`

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseBackup = (text: string): BackupData => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Le fichier n’est pas un JSON valide.')
  }

  if (!isRecord(parsed) || parsed.app !== BACKUP_APP || !isRecord(parsed.data)) {
    throw new Error('Ce fichier n’est pas une sauvegarde Prévisio.')
  }

  if (typeof parsed.version !== 'number' || parsed.version > BACKUP_VERSION) {
    throw new Error('Cette sauvegarde provient d’une version plus récente de Prévisio.')
  }

  const data = parsed.data
  for (const collection of COLLECTIONS) {
    const items = data[collection]
    if (!Array.isArray(items) || !items.every((item) => isRecord(item) && typeof item.id === 'string')) {
      throw new Error(`La sauvegarde est incomplète ou corrompue (${collection}).`)
    }
  }

  return data as unknown as BackupData
}
