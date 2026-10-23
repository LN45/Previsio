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

export default router
