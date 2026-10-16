import { createRouter, createWebHistory } from 'vue-router'
import { registerDashboardGuards } from './guards'
import routes from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

registerDashboardGuards(router)

export { routes }
export default router
