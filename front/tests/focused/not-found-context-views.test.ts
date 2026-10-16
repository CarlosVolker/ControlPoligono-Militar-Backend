import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NotFoundView from '../../src/views/NotFoundView.vue'
import ContextLostView from '../../src/views/ContextLostView.vue'

const STUB_COMPONENT = defineComponent({
  name: 'NotFoundContextStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: STUB_COMPONENT },
  { path: '/login', name: 'login', component: STUB_COMPONENT },
  { path: '/contexto', name: 'contexto', component: STUB_COMPONENT },
  { path: '/404', name: 'not-found', component: NotFoundView },
  { path: '/contexto-perdido', name: 'context-lost', component: ContextLostView },
]

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 12; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
  // router.back() resuelve su navegación en un tick de macrotarea.
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

async function mountAt(
  component: typeof NotFoundView | typeof ContextLostView,
  history: string[],
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  for (const path of history) await router.push(path)
  await router.isReady()

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness: Harness = { pinia, router, app, host }
  harnesses.push(harness)
  return harness
}

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.app.unmount()
    harness.host.remove()
    harness.router.options.history.destroy()
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  window.history.replaceState(null, '', '/')
  vi.restoreAllMocks()
})

describe('NotFoundView (404)', () => {
  it('con historial ofrece la vuelta atrás y la acción contextual; sin <br> incrustado', async () => {
    window.history.replaceState({ back: '/login', current: '/404' }, '', '/404')
    const harness = await mountAt(NotFoundView, ['/login', '/404'])

    const controls = [...harness.host.querySelectorAll('button, a')]
    const labels = controls.map((node) => (node.textContent ?? '').trim())
    expect(labels).toContain('Volver a la página anterior')
    expect(controls).toHaveLength(2)
    expect(harness.host.querySelector('br')).toBeNull()
    expect(harness.host.textContent ?? '').toContain('La página a la que intentas acceder no está disponible.')

    const back = controls.find((node) => (node.textContent ?? '').trim() === 'Volver a la página anterior')
    back?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    expect(harness.router.currentRoute.value.path).toBe('/login')
  })

  it('sin historial previo no ofrece la vuelta atrás y deja la acción contextual', async () => {
    window.history.replaceState(null, '', '/404')
    const harness = await mountAt(NotFoundView, ['/404'])

    const controls = [...harness.host.querySelectorAll('button, a')]
    expect(controls).toHaveLength(1)
    expect((controls[0].textContent ?? '').trim()).not.toBe('Volver a la página anterior')
  })
})

describe('ContextLostView', () => {
  it('acciona «Elegir institución» hacia /contexto, deja «Cerrar sesión» como secundaria y avisa con role="status"', async () => {
    const harness = await mountAt(ContextLostView, ['/contexto-perdido'])

    const primary = harness.host.querySelector('a[href="/contexto"]')
    expect(primary, 'acción primaria hacia /contexto').not.toBeNull()
    expect((primary?.textContent ?? '').trim()).toBe('Elegir institución')

    const secondary = [...harness.host.querySelectorAll('button')]
      .find((button) => (button.textContent ?? '').trim().startsWith('Cerrar sesión'))
    expect(secondary, 'acción secundaria de cierre de sesión').not.toBeNull()

    expect(harness.host.querySelector('a[href="/login"]')).toBeNull()

    const alerts = [...harness.host.querySelectorAll('.alert')]
    expect(alerts).toHaveLength(1)
    expect(alerts[0].getAttribute('role')).toBe('status')
    expect(harness.host.querySelector('[role="alert"]')).toBeNull()

    const card = harness.host.querySelector('article.card')
    expect(card, 'tarjeta del aviso').not.toBeNull()
    expect(card?.classList.contains('context-lost-card')).toBe(false)
  })
})
