import type { OperationStatus, PaymentMethod } from '../types/finance'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  transfer: 'Virement',
  check: 'Chèque',
  direct_debit: 'Prélèvement',
  card: 'Carte bancaire',
}

export const statusLabels: Record<OperationStatus, string> = {
  real: 'Réelle',
  planned: 'Prévue',
  estimated: 'Estimée',
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
