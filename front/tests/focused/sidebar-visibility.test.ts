import { createApp, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { defineComponent } from 'vue'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import DashboardSidebar from '../../src/components/DashboardSidebar.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import type { AuthContext, AuthContextAssignment } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

const STUB_COMPONENT = defineComponent({
  name: 'SidebarRouteStub',
  render: () => null,
})

const SIDEBAR_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
  path: route.path,
  name: route.name,
  meta: route.meta,
  component: STUB_COMPONENT,
}))

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
}

const harnesses: Harness[] = []

function makeFixtureContext(
  permissions: readonly string[] = [],
  assignments: readonly AuthContextAssignment[] = [],
): AuthContext {
  const raw: unknown = {
    user: { id_usuario: 701, rut: null, must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [...permissions],
    assignments: [...assignments],
  }
  return validateAuthContext(raw)
}

async function mountSidebar(overrides: Partial<SessionState>): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: SIDEBAR_ROUTES })
  await router.push('/')
  await router.isReady()

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(DashboardSidebar)
  app.use(pinia)
  app.use(router)
  app.mount(host)

  const session = useSessionStore(pinia)
  const harness: Harness = { pinia, router, app, host, session }
  harnesses.push(harness)

  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeFixtureContext(),
    ...overrides,
  } as Partial<SessionState>)
  await nextTick()
  return harness
}

function hrefs(harness: Harness): string[] {
  // Sólo los enlaces del nav filtrado: la marca del sidebar apunta siempre a
  // '/' y no es una entrada de navegación sujeta al criterio.
  return [...harness.host.querySelectorAll('a.menu-link')].map(
    (link) => link.getAttribute('href') ?? '',
  )
}

function groupLabels(harness: Harness): string[] {
  return [...harness.host.querySelectorAll('.sidebar-nav .menu-label')].map(
    (label) => label.textContent?.trim() ?? '',
  )
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
})

describe('sidebar filtrado por criterio compartido (F4)', () => {
  it('snapshot vigente sin permisos: entra por clase (b) IA+TA lo abierto por contrato; los grupos sin ítems visibles no se renderizan', async () => {
    const harness = await mountSidebar({ context: makeFixtureContext() })

    const links = hrefs(harness)
    expect(links).toContain('/')
    expect(links).toContain('/contexto')
    // Clase (b): OP-ROL-001/OP-SCP-001/002/OP-PRM-001 son lectura abierta a
    // principal autenticado con tenant activo (IA+TA): visibles sin códigos.
    expect(links).toContain('/personas/roles')
    expect(links).toContain('/personas/scopes')
    expect(links).toContain('/personas/permisos')
    // Sin códigos atómicos: ninguna entrada de clase (a) (AC-1).
    for (const denied of [
      '/organizacion/unidades',
      '/organizacion/recintos',
      '/personas',
      '/almacen/armerias',
      '/tiro/poligonos',
      '/tiro/ejercicios',
      '/auditoria',
    ]) {
      expect(links, denied).not.toContain(denied)
    }
    // Sin criterio fundado: overrides cerrado incluso con snapshot vigente.
    expect(links).not.toContain('/personas/overrides')
    // Grupo sin ítems visibles no se renderiza: sin etiquetas huecas.
    const labels = groupLabels(harness)
    // «Dashboard» y «Contexto» son grupos de un solo ítem: entradas de primer
    // nivel, sin rótulo-botón (barrido UX 2026-10-16).
    expect(labels).not.toContain('Dashboard')
    expect(labels).not.toContain('Contexto')
    expect(labels).toContain('Personas y autorización')
    expect(labels).not.toContain('Organización')
    expect(labels).not.toContain('Almacén')
    expect(labels).not.toContain('Tiro')
    expect(labels).not.toContain('Ejercicios')
    expect(labels).not.toContain('Auditoría')
  })

  it('permiso view_unit abre Unidades/Puestos/Membresías y Tiro, no Recintos ni Almacén', async () => {
    const harness = await mountSidebar({
      context: makeFixtureContext(['view_unit']),
    })

    const links = hrefs(harness)
    expect(links).toContain('/organizacion/unidades')
    expect(links).toContain('/organizacion/puestos')
    expect(links).toContain('/organizacion/membresias')
    expect(links).toContain('/tiro/poligonos')
    expect(links).toContain('/tiro/lecciones')
    expect(links).not.toContain('/organizacion/recintos')
    expect(links).not.toContain('/almacen/armerias')
    expect(links).not.toContain('/personas')
    const labels = groupLabels(harness)
    expect(labels).toContain('Organización')
    expect(labels).toContain('Tiro')
    expect(labels).toContain('Personas y autorización')
    expect(labels).not.toContain('Almacén')
    expect(labels).not.toContain('Ejercicios')
    expect(labels).not.toContain('Auditoría')
  })

  it('lecturas IA+TA (roles/scopes/permisos catálogo) visibles con snapshot vigente; overrides nunca', async () => {
    const harness = await mountSidebar({
      context: makeFixtureContext([], [{
        role: 'tirador', scope: 'solo_propio', organization_unit: 'unit-fixture', is_primary: true,
      }]),
    })

    const links = hrefs(harness)
    expect(links).toContain('/personas/roles')
    expect(links).toContain('/personas/scopes')
    expect(links).toContain('/personas/permisos')
    // Sin criterio fundado (IsTenantAdmin no documentable en cliente): cerrado
    // permanente, ni siquiera con snapshot vigente (AC-1/§4).
    expect(links).not.toContain('/personas/overrides')
    // Rol custom no abre la bitácora (criterio role-based sólo OP-AUT-004).
    expect(links).not.toContain('/auditoria')
  })

  it('bitácora visible sólo para los roles del contrato OP-AUT-004', async () => {
    for (const role of ['tenant_admin', 'super_admin', 'auditor']) {
      const harness = await mountSidebar({
        context: makeFixtureContext([], [{
          role, scope: 'todo_el_tenant', organization_unit: 'unit-fixture', is_primary: true,
        }]),
      })
      expect(hrefs(harness), role).toContain('/auditoria')
    }
  })

  it('booting/unknown: menú privilegiado cerrado mientras el de sesión acompaña la consolidación', async () => {
    const harness = await mountSidebar({
      status: SESSION_STATUS.BOOTING,
      context: null,
    })

    const links = hrefs(harness)
    expect(links).toContain('/')
    expect(links).toContain('/contexto')
    expect(links).not.toContain('/organizacion/unidades')
    expect(links).not.toContain('/personas/roles')
    expect(links).not.toContain('/auditoria')
    expect(groupLabels(harness)).not.toContain('Organización')
  })

  it('logout en vuelo o sin principal: todo el menú cerrado (fail-closed), ni siquiera Dashboard', async () => {
    const loggingOut = await mountSidebar({
      logoutBusy: true,
      context: makeFixtureContext(['view_unit']),
    })
    expect(hrefs(loggingOut)).not.toContain('/organizacion/unidades')
    expect(hrefs(loggingOut)).not.toContain('/tiro/poligonos')

    const anonymous = await mountSidebar({
      status: SESSION_STATUS.ANONYMOUS,
      identity: null,
      context: null,
    })
    const anonymousLinks = hrefs(anonymous)
    expect(anonymousLinks).not.toContain('/')
    expect(anonymousLinks).not.toContain('/contexto')
    expect(groupLabels(anonymous)).toHaveLength(0)
  })

  it('el enlace del dashboard exige tenant capturado y el de contexto sólo principal', async () => {
    const noTenant = await mountSidebar({
      status: SESSION_STATUS.NEEDS_TENANT,
      tenantCode: '',
      unitCode: '',
      context: null,
    })
    const links = hrefs(noTenant)
    expect(links).not.toContain('/')
    expect(links).toContain('/contexto')
    const labels = groupLabels(noTenant)
    // Ambos son grupos de un ítem: sin rótulo-botón, presentes como enlace.
    expect(labels).not.toContain('Dashboard')
    expect(labels).not.toContain('Contexto')
  })
})
