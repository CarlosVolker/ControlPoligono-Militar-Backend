import { createApp, nextTick, type App } from 'vue'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContextCard from '../../src/components/ContextCard.vue'
import { useSessionStore } from '../../src/stores/session'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Doble de aislamiento: el catálogo real de roles/alcances se sustituye para
// acreditar la humanización y su repliegue honesto al código.
const authorizationApiDoubles = vi.hoisted(() => ({
  getAuthorizationCatalog: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/features/authorization/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/authorization/api')>()
  return { ...actual, getAuthorizationCatalog: authorizationApiDoubles.getAuthorizationCatalog }
})

interface ContextShape {
  tenant: { name: string; code: string }
  unit_membership: { unit_name: string; unit_code: string }
  active_organization_unit: string
  assignments: { role: string; scope: string | null; is_primary: boolean }[]
}

function makeContext(): ContextShape {
  return {
    tenant: { name: 'Institución de prueba', code: 'tenant-fixture' },
    unit_membership: { unit_name: 'Unidad de prueba', unit_code: 'unit-fixture' },
    active_organization_unit: 'unit-fixture',
    assignments: [{ role: 'tirador', scope: 'solo_propio', is_primary: true }],
  }
}

function makeCatalog(): unknown {
  return {
    roles: [{ id: 1, code: 'tirador', name: 'Tirador', description: '', is_active: true }],
    scopes: [{ id: 1, code: 'solo_propio', name: 'Solo propio', description: '' }],
    resources: [],
    actions: [],
  }
}

interface Harness {
  pinia: Pinia
  app: App
  host: HTMLElement
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountContextCard(): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
  } as Partial<SessionState>)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(ContextCard, {
    context: makeContext(),
  })
  app.use(pinia)
  app.mount(host)
  await flushRound()

  const harness: Harness = { pinia, app, host }
  harnesses.push(harness)
  return harness
}

beforeEach(() => {
  authorizationApiDoubles.getAuthorizationCatalog.mockReset()
})

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.app.unmount()
    harness.host.remove()
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('ContextCard — rol y alcance legibles (barrido UX 2026-10-16)', () => {
  it('con catálogo: muestra el nombre y conserva el código como apoyo', async () => {
    authorizationApiDoubles.getAuthorizationCatalog.mockResolvedValue(makeCatalog())
    const harness = await mountContextCard()

    expect(harness.host.textContent ?? '').toContain('Tirador (tirador)')
    expect(harness.host.textContent ?? '').toContain('Solo propio (solo_propio)')
    expect(authorizationApiDoubles.getAuthorizationCatalog).toHaveBeenCalledTimes(1)
  })

  it('sin catálogo: conserva el código del contexto, sin inventar etiqueta', async () => {
    authorizationApiDoubles.getAuthorizationCatalog.mockRejectedValue(new Error('sin respuesta'))
    const harness = await mountContextCard()

    const text = harness.host.textContent ?? ''
    expect(text).toContain('tirador')
    expect(text).toContain('solo_propio')
    expect(text).not.toContain('Tirador (')
  })
})
