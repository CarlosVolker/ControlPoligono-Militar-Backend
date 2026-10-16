import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PersonalizerView from '../../src/views/appearance/PersonalizerView.vue'
import { routes } from '../../src/router/routes'
import { useAppearanceStore } from '../../src/stores/appearance'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { DEFAULT_DESIGN_SYSTEM_APPEARANCE } from '../../src/types/appearance'
import type { DesignSystemAppearance } from '../../src/types/appearance'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento: la lectura/escritura real de apariencia se sustituye
// para acreditar el contraste de las acciones y la confirmación en el sitio.
const appearanceApiDoubles = vi.hoisted(() => ({
  getDesignSystemAppearance: vi.fn<(signal?: AbortSignal | null) => Promise<DesignSystemAppearance>>(),
  putDesignSystemAppearance: vi.fn<
    (appearance: DesignSystemAppearance, signal?: AbortSignal | null) => Promise<DesignSystemAppearance>
  >(),
  resetDesignSystemAppearance: vi.fn<(signal?: AbortSignal | null) => Promise<void>>(),
}))

vi.mock('../../src/api/appearance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/appearance')>()
  return { ...actual, ...appearanceApiDoubles }
})

const STUB_COMPONENT = defineComponent({
  name: 'AppearanceUxSweepStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
  path: route.path,
  name: route.name,
  meta: route.meta,
  component: STUB_COMPONENT,
}))

function makeContext(): AuthContext {
  const raw: unknown = {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [],
    assignments: [],
  }
  return validateAuthContext(raw)
}

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
  appearance: ReturnType<typeof useAppearanceStore>
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 30; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

function panelButton(label: string): HTMLButtonElement | null {
  const panel = document.getElementById('tcfPanel')
  if (!panel) return null
  return [...panel.querySelectorAll('button')]
    .find((button) => (button.textContent ?? '').trim() === label) ?? null
}

async function mountPersonalizer(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/personalizador')
  await router.isReady()

  const session = useSessionStore(pinia)
  const appearance = useAppearanceStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContext(),
  } as Partial<SessionState>)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(PersonalizerView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness: Harness = { pinia, router, app, host, session, appearance }
  harnesses.push(harness)
  return harness
}

beforeEach(() => {
  for (const fn of Object.values(appearanceApiDoubles)) fn.mockReset()
  appearanceApiDoubles.getDesignSystemAppearance.mockResolvedValue(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
  appearanceApiDoubles.putDesignSystemAppearance.mockResolvedValue(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
  appearanceApiDoubles.resetDesignSystemAppearance.mockResolvedValue(undefined)
})

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.appearance.dispose()
    harness.app.unmount()
    harness.host.remove()
    harness.router.options.history.destroy()
    for (const route of harness.router.getRoutes()) {
      if (route.name !== undefined) harness.router.removeRoute(route.name)
    }
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('PersonalizerView — foco del FAB y confirmación del restablecimiento (barrido UX 2026-10-16)', () => {
  it('con el panel abierto el FAB queda inert y fuera del árbol accesible; al cerrarlo vuelve', async () => {
    const harness = await mountPersonalizer()
    expect(harness.appearance.restoreStatus).toBe('ready')

    const fab = document.querySelector('.tcf-fab')
    expect(fab, 'FAB del personalizador').not.toBeNull()
    expect(fab?.hasAttribute('inert')).toBe(true)
    expect(fab?.getAttribute('aria-hidden')).toBe('true')

    fab?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(fab?.hasAttribute('inert')).toBe(false)
  })

  it('«Restablecer valores por defecto» pide confirmación en el sitio y no restablece hasta confirmar', async () => {
    const harness = await mountPersonalizer()
    const resetSpy = vi.spyOn(harness.appearance, 'reset')

    const trigger = panelButton('Restablecer valores por defecto')
    expect(trigger, 'botón de restablecimiento').not.toBeNull()
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(resetSpy).not.toHaveBeenCalled()
    const panel = document.getElementById('tcfPanel')
    expect(panel?.textContent ?? '').toContain('Se restablecerán los valores por defecto')

    panelButton('Restablecer')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    expect(resetSpy).toHaveBeenCalledTimes(1)
  })
})

describe('PersonalizerView — jerarquía de acciones del error (barrido UX 2026-10-16)', () => {
  it('el reintento es primario, «Revisar el contexto» un enlace subrayado y cerrar sesión queda separado', async () => {
    appearanceApiDoubles.getDesignSystemAppearance.mockRejectedValue(new Error('sin respuesta'))
    const harness = await mountPersonalizer()
    expect(harness.appearance.restoreStatus).toBe('error')

    const panel = document.getElementById('tcfPanel')
    expect(panel).not.toBeNull()

    const retry = [...(panel?.querySelectorAll('button') ?? [])]
      .find((button) => (button.textContent ?? '').trim() === 'Reintentar restauración')
    expect(retry?.classList.contains('btn-primary')).toBe(true)

    const contextLink = panel?.querySelector('a.appearance-context-link')
    expect(contextLink?.textContent?.trim()).toBe('Revisar el contexto')

    const logout = [...(panel?.querySelectorAll('button') ?? [])]
      .find((button) => (button.textContent ?? '').trim() === 'Cerrar sesión')
    expect(logout?.classList.contains('btn-danger')).toBe(true)

    // Cerrar sesión queda en un bloque separado del reintento.
    expect(logout?.closest('.appearance-error-danger')).not.toBeNull()
  })
})
