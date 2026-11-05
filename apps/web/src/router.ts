import { createRouter, createWebHistory } from 'vue-router'
import { auth, loadMe } from './lib/auth'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { public: true } },
    { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
    { path: '/calendar', name: 'calendar', component: () => import('./views/CalendarView.vue') },
    { path: '/intake', name: 'intake', component: () => import('./views/IntakeView.vue') },
    { path: '/work-orders', name: 'work-orders', component: () => import('./views/WorkOrdersView.vue') },
    { path: '/work-orders/:id', name: 'work-order', component: () => import('./views/WorkOrderView.vue'), props: true },
    { path: '/customers', name: 'customers', component: () => import('./views/CustomersView.vue') },
    { path: '/customers/:id', name: 'customer', component: () => import('./views/CustomerView.vue'), props: true },
    { path: '/vehicles/:id', name: 'vehicle', component: () => import('./views/VehicleView.vue'), props: true },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (!auth.loaded) await loadMe()
  if (!to.meta.public && !auth.user) return { name: 'login', query: to.fullPath !== '/' ? { next: to.fullPath } : {} }
  if (to.name === 'login' && auth.user) return { name: 'home' }
})
