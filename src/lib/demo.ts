export type AppMode = 'real' | 'demo'

export interface DemoStep {
  title: string
  description: string
  detail: string
}

export interface AppModeOption {
  label: string
  value: AppMode
  description: string
}

export function getModeOptions(): AppModeOption[] {
  return [
    {
      label: 'Compte réel',
      value: 'real',
      description: 'Mes données financières personnelles',
    },
    {
      label: 'Démo',
      value: 'demo',
      description: 'Données d’exemple pour la présentation',
    },
  ]
}

export function getDemoSteps(): DemoStep[] {
  return [
    {
      title: 'Dashboard',
      description: 'Le tableau de bord affiche immédiatement le solde réel et les prévisions des 30, 90 et 365 prochains jours.',
      detail: 'Suivi rapide de la trésorerie',
    },
    {
      title: 'Opérations',
      description: 'Ajoute une entrée ou une dépense, choisis la catégorie et le statut pour simuler un vrai suivi financier.',
      detail: 'Gestion des mouvements',
    },
    {
      title: 'Budgets',
      description: 'Définit un montant prévu par mois et compare-le au réel pour repérer les écarts de dépenses.',
      detail: 'Contrôle des objectifs',
    },
    {
      title: 'Récurrences',
      description: 'Configure les loyers, abonnements et autres dépenses récurrentes pour visualiser les paiements à venir.',
      detail: 'Prévisions automatiques',
    },
  ]
}
