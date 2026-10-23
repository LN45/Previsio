import { createRouter, createWebHashHistory } from 'vue-router'
import AccountView from '../views/AccountView.vue'
import BudgetView from '../views/BudgetsView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import DashboardView from '../views/DashboardView.vue'
import OperationsView from '../views/OperationsView.vue'
import RecurrencesView from '../views/RecurrencesView.vue'

const router = createRouter({
  // Hash history : GitHub Pages ne sait pas rediriger /Previsio/operations vers index.html
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
    },
    {
      path: '/operations',
      name: 'operations',
      component: OperationsView,
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView,
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: BudgetView,
    },
    {
      path: '/recurrences',
      name: 'recurrences',
      component: RecurrencesView,
    },
    {
      path: '/charts',
      name: 'charts',
      // Chargé à la demande pour ne pas embarquer Chart.js dans le bundle principal
      component: () => import('../views/ChartsView.vue'),
    },
  ],
})

// Après une mise à jour de l'application, un écran chargé à la demande peut pointer vers un fichier
// qui n'existe plus : on recharge alors la page sur l'écran demandé pour récupérer la nouvelle version.
const RELOAD_KEY = 'previsio-chunk-reload'

router.onError((error, to) => {
  const message = error instanceof Error ? error.message : String(error)
  if (!/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(message)) {
    return
  }

  // Un seul rechargement par session, pour ne pas boucler si le fichier reste introuvable (hors connexion)
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) {
      return
    }
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    return
  }

  window.location.hash = to.fullPath
  window.location.reload()
})

router.afterEach(() => {
  try {
    sessionStorage.removeItem(RELOAD_KEY)
  } catch {
    // stockage indisponible : rien à nettoyer
  }
})

export default router
