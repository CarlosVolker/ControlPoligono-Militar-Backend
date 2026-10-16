import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AuthorizationView from '../../src/views/authorization/AuthorizationView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { HttpRequestError } from '../../src/api/http'
import { validateAuthContext } from '../../src/api/dashboard'
import type {
  AuthorizationCatalogDto,
  PermissionDto,
  RoleDto,
  RolePermissionDto,
  UserPermissionOverrideDto,
} from '../../src/features/authorization/api'
import type { ApiConnection } from '../../src/types/dashboard'
import type { AuthContext } from '../../src/types/contexto'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento de tests exclusivamente: la API real de autorización,
// identidad y dominio compartido se sustituye en el módulo mock para la unidad
// de componente; el producto nunca ve mocks. Clases y constantes quedan
// intactas por importOriginal.
const authzApiDoubles = vi.hoisted(() => ({
  listRoles: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  getRoleCategories: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  listPermissions: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  listRolePermissions: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  listPositionPermissions: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  getAuthorizationCatalog: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  listOverrides: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  createRole: vi.fn<(body: Record<string, unknown>, connection: ApiConnection) => Promise<unknown>>(),
  deleteRole: vi.fn<(id: number, connection: ApiConnection) => Promise<void>>(),
  createOverride: vi.fn<(body: Record<string, unknown>, connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/features/authorization/api', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...authzApiDoubles }
})

const identityApiDoubles = vi.hoisted(() => ({
  getMemberships: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  getPositions: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
  getUsers: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/features/identity/api', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...identityApiDoubles }
})

const sharedDomainDoubles = vi.hoisted(() => ({
  getOrganizationUnitsLookup: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/api/shared/domain', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...sharedDomainDoubles }
})

const dashboardDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/api/dashboard', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...dashboardDoubles }
})

const STUB_COMPONENT = defineComponent({
  name: 'AuthorizationStub',
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
    user: { id_usuario: 701, rut: '11111111-1', must_change_password: false },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: null,
    scopes: [],
    permissions: ['view_unit'],
    assignments: [{
      role: 'tenant_admin',
      scope: 'unidad_y_descendientes',
      organization_unit: 'unit-fixture',
      is_primary: true,
    }],
  }
  return validateAuthContext(raw)
}

function makeRole(overrides: Partial<RoleDto> = {}): RoleDto {
  return {
    id: 1,
    code: 'admin_unidad',
    name: 'Administrador de unidad',
    description: 'Rol de prueba',
    is_active: true,
    is_system: false,
    ...overrides,
  }
}

function makePermission(overrides: Partial<PermissionDto> = {}): PermissionDto {
  return {
    id: 1,
    code: 'view_unit',
    name: 'Ver unidad',
    category: 'unidad',
    description: 'Alcance de unidad',
    is_active: true,
    ...overrides,
  }
}

function makeRolePermission(overrides: Partial<RolePermissionDto> = {}): RolePermissionDto {
  return {
    id: 9,
    role: 1,
    role_code: 'admin_unidad',
    permission: 1,
    permission_code: 'view_unit',
    permission_name: 'Ver unidad',
    permission_category: 'unidad',
    allowed: true,
    ...overrides,
  }
}

function makeCatalog(): AuthorizationCatalogDto {
  return {
    roles: [],
    scopes: [],
    resources: [{ code: 'unit', label: 'Unidad' }],
    actions: [{ code: 'read', label: 'Leer', description: 'Lectura' }],
  }
}

function makeOverride(overrides: Partial<UserPermissionOverrideDto> = {}): UserPermissionOverrideDto {
  return {
    id: 4,
    account: 5,
    account_rut: '22222222-2',
    permission: null,
    permission_code: null,
    resource: '',
    action: '',
    allowed: true,
    reason: '',
    created_by: null,
    created_by_rut: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// El kind de HttpRequestError no está exportado; se reencuadra el constructor
// para construir un rechazo 5xx real (instanceof sigue siendo HttpRequestError).
const HttpRequestErrorStub = HttpRequestError as unknown as new (
  kind: string,
  status?: number | null,
  detail?: string | null,
) => HttpRequestError

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
  text(): string
  element<T extends HTMLElement>(id: string): T | null
  select(id: string): HTMLSelectElement | null
  cardButton(label: string): HTMLButtonElement | null
  footerButton(label: string): HTMLButtonElement | null
  rowButton(rowText: string, label: string): HTMLButtonElement | null
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 40; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

function buttonsIn(root: ParentNode): HTMLButtonElement[] {
  return [...root.querySelectorAll('button')]
}

function buttonByText(root: ParentNode, label: string): HTMLButtonElement | null {
  return buttonsIn(root).find((button) => (button.textContent ?? '').trim() === label) ?? null
}

async function mountAuthorizationView(
  path: string,
  overrides: Partial<SessionState> = {},
): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push(path)
  await router.isReady()

  const session = useSessionStore(pinia)
  session.$patch({
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContext(),
    ...overrides,
  } as Partial<SessionState>)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(AuthorizationView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness: Harness = {
    pinia,
    router,
    app,
    host,
    session,
    // DsModal teleporta su contenido a <body>.
    text: () => document.body.textContent ?? '',
    element: <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null,
    select: (id: string) => document.getElementById(id) as HTMLSelectElement | null,
    cardButton: (label: string) => buttonByText(host, label),
    footerButton: (label: string) => {
      const footer = document.querySelector('.modal-footer')
      return footer ? buttonByText(footer, label) : null
    },
    rowButton: (rowText: string, label: string) => {
      const row = [...host.querySelectorAll('tbody tr')]
        .find((tr) => (tr.textContent ?? '').includes(rowText))
      return row ? buttonByText(row, label) : null
    },
  }
  harnesses.push(harness)
  return harness
}

function chooseSelect(select: HTMLSelectElement, value: string): void {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

function fillInput(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function click(button: HTMLButtonElement | null): void {
  button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

async function openOverrideEditor(harness: Harness): Promise<void> {
  click(harness.cardButton('Crear excepción'))
  await flushRound()
  expect(document.getElementById('authorization-override-form'), 'formulario de la excepción').not.toBeNull()
}

beforeEach(() => {
  for (const fn of Object.values(authzApiDoubles)) fn.mockReset()
  for (const fn of Object.values(identityApiDoubles)) fn.mockReset()
  for (const fn of Object.values(sharedDomainDoubles)) fn.mockReset()
  dashboardDoubles.getAuthContext.mockReset()

  authzApiDoubles.listRoles.mockResolvedValue([])
  authzApiDoubles.getRoleCategories.mockResolvedValue({ categories: [] })
  authzApiDoubles.listPermissions.mockResolvedValue([])
  authzApiDoubles.listRolePermissions.mockResolvedValue([])
  authzApiDoubles.listPositionPermissions.mockResolvedValue([])
  authzApiDoubles.getAuthorizationCatalog.mockResolvedValue(makeCatalog())
  authzApiDoubles.listOverrides.mockResolvedValue([])
  authzApiDoubles.createOverride.mockResolvedValue(makeOverride())
  identityApiDoubles.getMemberships.mockResolvedValue([])
  identityApiDoubles.getPositions.mockResolvedValue([])
  identityApiDoubles.getUsers.mockResolvedValue([])
  sharedDomainDoubles.getOrganizationUnitsLookup.mockResolvedValue({ results: [] })
  // Reconciliación tras una mutación: el contexto vuelve a confirmarse.
  dashboardDoubles.getAuthContext.mockResolvedValue(makeContext())
})

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.app.unmount()
    harness.host.remove()
    harness.router.options.history.destroy()
    disposePinia(harness.pinia)
  }
  setActivePinia(undefined)
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('AuthorizationView — excepción individual (P0: la regla es obligatoria)', () => {
  it('no ofrece la opción «Sin selector de regla» y bloquea el guardado hasta que la regla es válida', async () => {
    identityApiDoubles.getMemberships.mockResolvedValue([
      { id: 1, account: 5, rut: '22222222-2', unit: 1, unit_code: 'unit-fixture', unit_name: 'Unidad', is_primary: true, is_active: true, starts_at: null, ends_at: null, created_at: '2026-01-01T00:00:00Z' },
    ])
    authzApiDoubles.listPermissions.mockResolvedValue([
      makePermission(),
      makePermission({ id: 2, code: 'view_warehouse', name: 'Ver armería', category: 'almacen' }),
    ])

    const harness = await mountAuthorizationView('/personas/overrides')
    await openOverrideEditor(harness)

    const ruleMode = harness.select('override-rule-mode')
    expect(ruleMode, 'selector de regla').not.toBeNull()
    const labels = [...(ruleMode?.options ?? [])].map((option) => (option.textContent ?? '').trim())
    expect(labels).toEqual(['Permiso del catálogo', 'Par recurso / acción'])
    expect(labels).not.toContain('Sin selector de regla')

    const save = harness.footerButton('Crear excepción')
    expect(save, 'botón de guardado de la excepción').not.toBeNull()
    expect(save?.disabled).toBe(true)

    chooseSelect(harness.select('override-account')!, '5')
    chooseSelect(harness.select('override-allowed')!, 'true')
    await flushRound()
    // Cuenta y efecto definidos, pero la regla sigue vacía: no se habilita.
    expect(save?.disabled).toBe(true)

    chooseSelect(harness.select('override-permission-id')!, '1')
    await flushRound()
    expect(save?.disabled).toBe(false)
  })
})

describe('AuthorizationView — excepción con par recurso / acción', () => {
  it('envía permission null con recurso, acción y motivo tomados del catálogo', async () => {
    identityApiDoubles.getMemberships.mockResolvedValue([
      { id: 1, account: 5, rut: '22222222-2', unit: 1, unit_code: 'unit-fixture', unit_name: 'Unidad', is_primary: true, is_active: true, starts_at: null, ends_at: null, created_at: '2026-01-01T00:00:00Z' },
    ])
    authzApiDoubles.createOverride.mockResolvedValue(
      makeOverride({ permission: null, resource: 'unit', action: 'read' }),
    )

    const harness = await mountAuthorizationView('/personas/overrides')
    await openOverrideEditor(harness)

    chooseSelect(harness.select('override-account')!, '5')
    chooseSelect(harness.select('override-allowed')!, 'false')
    chooseSelect(harness.select('override-rule-mode')!, 'resource-action')
    await flushRound()
    chooseSelect(harness.select('override-resource')!, 'unit')
    chooseSelect(harness.select('override-action')!, 'read')
    fillInput(harness.element<HTMLTextAreaElement>('override-reason')!, 'Motivo de la excepción')
    await flushRound()

    const save = harness.footerButton('Crear excepción')
    expect(save?.disabled).toBe(false)
    save?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    document.getElementById('authorization-override-form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushRound()

    expect(authzApiDoubles.createOverride).toHaveBeenCalledTimes(1)
    const [body] = authzApiDoubles.createOverride.mock.calls[0] as [
      Record<string, unknown>,
      ApiConnection,
    ]
    expect(body).toEqual({
      account: 5,
      allowed: false,
      permission: null,
      resource: 'unit',
      action: 'read',
      reason: 'Motivo de la excepción',
    })
    expect(harness.text()).toContain('Excepción creada.')
  })
})

describe('AuthorizationView — matriz rol → permiso', () => {
  it('aplica las clases de rejilla, nombra cada acción accesible y distingue la fila ausente', async () => {
    authzApiDoubles.listRoles.mockResolvedValue([makeRole()])
    authzApiDoubles.listPermissions.mockResolvedValue([
      makePermission(),
      makePermission({ id: 2, code: 'view_warehouse', name: 'Ver armería', category: 'almacen' }),
    ])
    authzApiDoubles.listRolePermissions.mockResolvedValue([makeRolePermission()])

    const harness = await mountAuthorizationView('/personas/permisos?tab=matriz-rol')

    const table = harness.host.querySelector('table.authorization-matrix-table')
    expect(table, 'tabla de la matriz con su clase de rejilla').not.toBeNull()
    expect(harness.host.querySelector('.authorization-matrix-wrap')).not.toBeNull()
    expect(harness.host.querySelector('.authorization-matrix-legend')?.textContent).toContain('Sin regla')

    const editButton = buttonByText(harness.host, 'Editar')
    expect(editButton?.getAttribute('aria-label')).toBe('Editar regla: Administrador de unidad → Ver unidad')
    const removeButton = buttonByText(harness.host, 'Quitar')
    expect(removeButton?.getAttribute('aria-label')).toBe('Quitar regla: Administrador de unidad → Ver unidad')
    const configureButton = buttonByText(harness.host, 'Configurar')
    expect(configureButton?.getAttribute('aria-label')).toBe('Configurar regla: Administrador de unidad → Ver armería')

    // La celda sin fila se nombra como tal (no «Sin fila»).
    expect(harness.text()).toContain('Sin regla')
    expect(harness.text()).not.toContain('Sin fila')
  })
})

describe('AuthorizationView — confirmación de éxito', () => {
  it('anuncia el resultado en una región viva tras crear un rol', async () => {
    authzApiDoubles.createRole.mockResolvedValue(makeRole({ id: 2, code: 'nuevo', name: 'Rol Nuevo' }))

    const harness = await mountAuthorizationView('/personas/roles')
    click(harness.cardButton('Crear rol'))
    await flushRound()

    fillInput(harness.element<HTMLInputElement>('role-code')!, 'nuevo')
    fillInput(harness.element<HTMLInputElement>('role-name')!, 'Rol Nuevo')
    const submit = harness.footerButton('Crear rol')
    expect(submit, 'botón primario de alta de rol').not.toBeNull()
    submit?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    document.getElementById('authorization-role-form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushRound()

    expect(authzApiDoubles.createRole).toHaveBeenCalledTimes(1)
    const success = harness.host.querySelector('.authorization-alert.alert-success')
    expect(success, 'alerta de éxito').not.toBeNull()
    expect(success?.getAttribute('role')).toBe('status')
    expect(success?.textContent).toContain('Rol creado.')
  })
})

describe('AuthorizationView — baja de rol con 5xx', () => {
  it('muestra el error en el modal y conserva los datos: no la clasifica como resultado incierto', async () => {
    authzApiDoubles.listRoles.mockResolvedValue([makeRole()])
    authzApiDoubles.deleteRole.mockRejectedValue(
      new HttpRequestErrorStub('http', 500, 'El puesto usa este rol.'),
    )

    const harness = await mountAuthorizationView('/personas/roles')
    expect(harness.rowButton('admin_unidad', 'Eliminar'), 'acción Eliminar de la fila').not.toBeNull()
    click(harness.rowButton('admin_unidad', 'Eliminar'))
    await flushRound()

    click(harness.footerButton('Eliminar rol'))
    await flushRound()

    expect(authzApiDoubles.deleteRole).toHaveBeenCalledTimes(1)
    // El error se muestra en el modal, no en el banner de resultado incierto.
    expect(harness.text()).toContain('El servidor rechazó la solicitud (respuesta 500): El puesto usa este rol.')
    expect(harness.text()).not.toContain('No se pudo confirmar el resultado de la mutación')
    expect(harness.host.querySelector('.alert-warning')).toBeNull()
    // Los datos se conservan: la lista no se vació ni se recargó.
    expect(authzApiDoubles.listRoles).toHaveBeenCalledTimes(1)
    expect(harness.text()).toContain('Administrador de unidad')
  })
})

describe('AuthorizationView — superficie cerrada', () => {
  it('no ofrece el chip «Overrides» mientras su ruta sigue cerrada', async () => {
    const harness = await mountAuthorizationView('/personas/permisos')
    const shortcuts = harness.host.querySelector('nav.authorization-shortcuts')
    expect(shortcuts, 'barra de superficies').not.toBeNull()
    expect(buttonByTextLike(shortcuts!, 'Overrides')).toBeNull()
    expect(buttonByTextLike(shortcuts!, 'Permisos y consultas')).not.toBeNull()
  })
})

function buttonByTextLike(root: ParentNode, label: string): Element | null {
  return [...root.querySelectorAll('a, button')]
    .find((element) => (element.textContent ?? '').trim() === label) ?? null
}
