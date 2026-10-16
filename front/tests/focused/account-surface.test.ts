import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountView from '../../src/views/account/AccountView.vue'
import { consumeAccountPasswordChangeNotice } from '../../src/features/account/useOwnAccount'
import { routes, ROUTE_NAMES } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { HttpRequestError } from '../../src/api/http'
import type { AuthContext, AuthContextAssignment } from '../../src/types/contexto'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'
import { ACCESS_ACTION_RESULT } from '../../src/types/auth'
import type { IdentityUserDTO } from '../../src/features/identity/api'

const identityApiDoubles = vi.hoisted(() => ({
  getUser: vi.fn<(id: number, connection: ApiConnection) => Promise<IdentityUserDTO>>(),
  changeOwnPassword: vi.fn<(
    id: number,
    body: { old_password: string; new_password: string },
    connection: ApiConnection,
  ) => Promise<{ detail: string }>>(),
}))

vi.mock('../../src/features/identity/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/identity/api')>()
  return {
    ...actual,
    getUser: identityApiDoubles.getUser,
    changeOwnPassword: identityApiDoubles.changeOwnPassword,
  }
})

const authApiDoubles = vi.hoisted(() => ({
  getAuthContext: vi.fn<(connection: ApiConnection) => Promise<AuthContext>>(),
}))

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return {
    ...actual,
    getAuthContext: authApiDoubles.getAuthContext,
  }
})

// Catálogo real de roles/alcances (`/authz/catalog/`) para acreditar la
// humanización de códigos; la validación del borde real queda fuera del doble.
const authorizationApiDoubles = vi.hoisted(() => ({
  getAuthorizationCatalog: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/features/authorization/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/authorization/api')>()
  return {
    ...actual,
    getAuthorizationCatalog: authorizationApiDoubles.getAuthorizationCatalog,
  }
})

function makeAuthorizationCatalog(): unknown {
  return {
    roles: [{ id: 1, code: 'tirador', name: 'Tirador', description: '', is_active: true }],
    scopes: [{ id: 1, code: 'solo_propio', name: 'Solo propio', description: '' }],
    resources: [],
    actions: [],
  }
}

const STUB_COMPONENT = defineComponent({
  name: 'AccountSurfaceStub',
  render: () => null,
})

const TEST_ROUTES: RouteRecordRaw[] = routes.map((route) => ({
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
  text(): string
  input(id: string): HTMLInputElement | null
  form(): HTMLFormElement | null
}

const harnesses: Harness[] = []

function makeContext(overrides: {
  permissions?: readonly string[]
  assignments?: readonly AuthContextAssignment[]
  mustChangePassword?: boolean
} = {}): AuthContext {
  const raw: unknown = {
    user: {
      id_usuario: 701,
      rut: null,
      must_change_password: overrides.mustChangePassword ?? false,
    },
    tenant: { code: 'tenant-fixture', context: 'context-fixture' },
    active_organization_unit: 'unit-fixture',
    unit_membership: { id: 801, unit_code: 'unit-fixture', unit_name: 'Unidad de prueba' },
    scopes: [],
    permissions: [...(overrides.permissions ?? [])],
    assignments: [...(overrides.assignments ?? [])],
  }
  return validateAuthContext(raw)
}

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
    await Promise.resolve()
    await nextTick()
  }
}

async function mountAccountView(overrides: Partial<SessionState> = {}): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push({ name: ROUTE_NAMES.ACCOUNT })
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
  const app = createApp(AccountView)
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
    text: () => host.textContent ?? '',
    input: (id: string) => host.querySelector<HTMLInputElement>(`#${id}`),
    form: () => host.querySelector('form'),
  }
  harnesses.push(harness)
  return harness
}

function fillInput(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function submitForm(harness: Harness): Promise<void> {
  harness.form()?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushRound()
}

function makeProfileDto(): IdentityUserDTO {
  return {
    id_usuario: 701,
    rut: 'test-only-rut',
    grado: null,
    nombre: 'Ana',
    apellido_paterno: 'Prueba',
    apellido_materno: 'Sistema',
    correo: 'ana@test.invalid',
    habilitado: true,
    is_locked: false,
    must_change_password: false,
    password_changed_at: null,
    primary_assignment: null,
    assignments: [],
  }
}

beforeEach(() => {
  identityApiDoubles.getUser.mockReset()
  identityApiDoubles.changeOwnPassword.mockReset()
  authApiDoubles.getAuthContext.mockReset()
  authorizationApiDoubles.getAuthorizationCatalog.mockReset()
  authorizationApiDoubles.getAuthorizationCatalog.mockResolvedValue(makeAuthorizationCatalog())
  // Drene el aviso efímero del módulo entre casos (memoria compartida).
  consumeAccountPasswordChangeNotice()
})

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
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

describe('AccountView: datos propios y estados (AC-1/AC-2)', () => {
  it('sin contexto consolidado: estado explícito con enlace /contexto, cero requests de prueba', async () => {
    const harness = await mountAccountView({
      status: SESSION_STATUS.NEEDS_TENANT,
      context: null,
      tenantCode: '',
      unitCode: '',
    })

    expect(harness.text()).toContain('Mi cuenta')
    expect(harness.text()).toContain('Aún no hay un contexto operativo consolidado')
    expect(harness.host.querySelector('a[href="/contexto"]')).not.toBeNull()
    expect(identityApiDoubles.getUser).not.toHaveBeenCalled()
    expect(identityApiDoubles.changeOwnPassword).not.toHaveBeenCalled()
  })

  it('con snapshot vigente: datos propios reales, `—` ante falta real, asignaciones del contexto', async () => {
    const harness = await mountAccountView({
      context: makeContext({
        permissions: [],
        assignments: [{
          role: 'tirador', scope: 'solo_propio', organization_unit: 'unit-fixture', is_primary: true,
        }],
      }),
    })

    expect(harness.text()).toContain('701')
    // RUT null → placeholder literal, cero invención.
    expect(harness.text()).toContain('—')
    expect(harness.text()).toContain('tenant-fixture')
    expect(harness.text()).toContain('Unidad de prueba')
    expect(harness.text()).toContain('Al día')
    expect(harness.text()).toContain('Tirador (tirador)')
    expect(harness.text()).toContain('Solo propio (solo_propio)')
  })

  it('AC-5 sin acreditación: limitación visible de ficha/edición y cero request', async () => {
    const harness = await mountAccountView({ context: makeContext({ permissions: [] }) })

    expect(harness.text()).toContain('no acredita permiso para ver la ficha')
    expect(harness.text()).toContain('no expone edición del perfil propio')
    expect(identityApiDoubles.getUser).not.toHaveBeenCalled()
    // Cero botones falsos de edición de ficha.
    expect(harness.input('account-profile-correo')).toBeNull()
  })

  it('contraseña: requisitos visibles y toggle de visibilidad con aria-pressed', async () => {
    const harness = await mountAccountView()
    expect(harness.text()).toContain('al menos 8 caracteres')
    expect(harness.input('account-old-password')?.type).toBe('password')

    const toggle = [...harness.host.querySelectorAll('button')]
      .find((button) => (button.textContent ?? '').includes('Mostrar contraseñas'))
    expect(toggle, 'botón Mostrar contraseñas').not.toBeNull()
    expect(toggle?.getAttribute('aria-pressed')).toBe('false')

    toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(toggle?.getAttribute('aria-pressed')).toBe('true')
    expect(harness.input('account-old-password')?.type).toBe('text')
    expect(harness.input('account-new-password')?.type).toBe('text')
  })

  it('AC-5 acreditado: lectura read-only de la ficha propia con datos del backend', async () => {
    identityApiDoubles.getUser.mockResolvedValue(makeProfileDto())
    const harness = await mountAccountView({
      context: makeContext({ permissions: ['view_personnel_basic'] }),
    })

    expect(identityApiDoubles.getUser).toHaveBeenCalledTimes(1)
    const [id, connection] = identityApiDoubles.getUser.mock.calls[0] as [number, ApiConnection]
    expect(id).toBe(701)
    expect(connection.tenantCode).toBe('tenant-fixture')
    expect(harness.text()).toContain('Ana Prueba Sistema')
    expect(harness.text()).toContain('ana@test.invalid')
    expect(harness.text()).toContain('Solo lectura')
  })

  it('AC-5 denegación 403 en lectura propia: detail literal, sesión intacta, sin logout', async () => {
    identityApiDoubles.getUser.mockRejectedValue(
      new HttpRequestError('http', 403, 'El backend denegó esta lectura de ficha.'),
    )
    const harness = await mountAccountView({
      context: makeContext({ permissions: ['view_personnel_basic'] }),
    })

    expect(harness.text()).toContain('El backend denegó esta lectura de ficha.')
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(harness.session.identity?.id_usuario).toBe(701)
  })
})

describe('AccountView: cambio voluntario (AC-3, AC-4, F7 sin afirmar)', () => {
  it('el formulario está disponible con tenant activo y credencial al día', async () => {
    const harness = await mountAccountView()
    expect(harness.input('account-old-password')).not.toBeNull()
    expect(harness.input('account-new-password')).not.toBeNull()
    expect(harness.input('account-confirm-password')).not.toBeNull()
  })

  it('sin tenant: cambio no ofrecido, estado con enlace a /contexto', async () => {
    const harness = await mountAccountView({
      status: SESSION_STATUS.NEEDS_TENANT,
      context: null,
      tenantCode: '',
      unitCode: '',
    })
    expect(harness.input('account-old-password')).toBeNull()
    expect(harness.host.querySelector('a[href="/contexto"]')).not.toBeNull()
  })

  it('validación local: sin secretos no se envía; desaire de confirmación muestra el error literal vigente', async () => {
    const harness = await mountAccountView()
    await submitForm(harness)
    expect(identityApiDoubles.changeOwnPassword).not.toHaveBeenCalled()
    expect(harness.text()).toContain('Indica la contraseña actual.')

    fillInput(harness.input('account-old-password')!, 'draft-old')
    fillInput(harness.input('account-new-password')!, 'draft-new')
    fillInput(harness.input('account-confirm-password')!, 'draft-distinto')
    await submitForm(harness)
    expect(identityApiDoubles.changeOwnPassword).not.toHaveBeenCalled()
    expect(harness.text()).toContain('Las contraseñas no coinciden.')
  })

  it('F7/AC-8 200 propio: retiro local, aviso de éxito en memoria y login; cero replay, cero auto-login, cero GET extra', async () => {
    identityApiDoubles.changeOwnPassword.mockResolvedValue({ detail: 'Contraseña actualizada.' })
    const harness = await mountAccountView()
    fillInput(harness.input('account-old-password')!, 'draft-old')
    fillInput(harness.input('account-new-password')!, 'draft-new')
    fillInput(harness.input('account-confirm-password')!, 'draft-new')
    await submitForm(harness)

    // POST único con el cuerpo exacto del contrato; ningún reenvío.
    expect(identityApiDoubles.changeOwnPassword).toHaveBeenCalledTimes(1)
    const call = identityApiDoubles.changeOwnPassword.mock.calls[0] as [
      number,
      Record<string, unknown>,
      ApiConnection,
    ]
    expect(call[0]).toBe(701)
    expect(Object.keys(call[1]).sort()).toEqual(['new_password', 'old_password'])

    // Contrato observado: el 200 invalida la sesión; la UX no deja identidad
    // ni contexto aparentando vigencia: purge() local + navegación a /login.
    expect(harness.session.status).toBe(SESSION_STATUS.ANONYMOUS)
    expect(harness.session.identity).toBeNull()
    expect(harness.session.context).toBeNull()
    expect(harness.router.currentRoute.value.path).toBe('/login')
    // La superficie protegida desapareció del DOM (form y drafts fuera).
    expect(harness.form()).toBeNull()
    // Cero requests para aparentar sesión: ni GET contexto ni auto-login.
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()

    // Aviso efímero: detail literal del 200 + materia neutral de reingreso,
    // con consumo único y sin valores de credencial en el mensaje.
    const notice = consumeAccountPasswordChangeNotice()
    expect(notice?.message).toContain('Contraseña actualizada.')
    expect(notice?.message).toContain('Vuelve a iniciar sesión con tu nueva contraseña.')
    expect(notice?.message).not.toContain('draft-')
    expect(consumeAccountPasswordChangeNotice()).toBeNull()
  })

  it('403 en el cambio: detail literal, cero logout, draft saneado', async () => {
    identityApiDoubles.changeOwnPassword.mockRejectedValue(
      new HttpRequestError('http', 403, 'La contraseña actual no coincide.'),
    )
    const harness = await mountAccountView()
    fillInput(harness.input('account-old-password')!, 'draft-old')
    fillInput(harness.input('account-new-password')!, 'draft-new')
    fillInput(harness.input('account-confirm-password')!, 'draft-new')
    await submitForm(harness)

    expect(harness.text()).toContain('La contraseña actual no coincide.')
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    expect(harness.session.identity?.id_usuario).toBe(701)
    expect(harness.input('account-old-password')?.value).toBe('')
    // El 403 de negocio no dispara el retiro de F7: sin aviso, sesión viva.
    expect(consumeAccountPasswordChangeNotice()).toBeNull()
    expect(harness.router.currentRoute.value.path).not.toBe('/login')
  })

  it('resultado incierto: sin auto-reintento; sólo reconciliación explícita vía ensureContext (sin replay)', async () => {
    identityApiDoubles.changeOwnPassword.mockRejectedValue(new HttpRequestError('network'))
    const harness = await mountAccountView()
    fillInput(harness.input('account-old-password')!, 'draft-old')
    fillInput(harness.input('account-new-password')!, 'draft-new')
    fillInput(harness.input('account-confirm-password')!, 'draft-new')
    await submitForm(harness)

    expect(identityApiDoubles.changeOwnPassword).toHaveBeenCalledTimes(1)
    expect(harness.text()).toContain('No se pudo confirmar el resultado del cambio.')
    expect(harness.text()).toContain('No se reenviará automáticamente')
    // Incierto ≠ 200: el retiro de F7 no ocurre; la sesión aparente es la
    // vigente del store y la reconciliación sigue siendo explícita.
    expect(consumeAccountPasswordChangeNotice()).toBeNull()
    expect(harness.session.status).toBe(SESSION_STATUS.READY)
    const submit = harness.form()?.querySelector<HTMLButtonElement>('button[type="submit"]')
    expect(submit?.disabled).toBe(true)
    expect(authApiDoubles.getAuthContext).not.toHaveBeenCalled()

    // Reconciliación explícita: lee contexto, no reenvía el POST.
    authApiDoubles.getAuthContext.mockResolvedValue(makeContext())
    const reconcile = [...(harness.form()?.querySelectorAll('button') ?? [])]
      .find((button) => (button.textContent ?? '').includes('Reconciliar contexto'))
    reconcile?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(authApiDoubles.getAuthContext).toHaveBeenCalledTimes(1)
    expect(identityApiDoubles.changeOwnPassword).toHaveBeenCalledTimes(1)
    // El remitente anterior puede haber sido re-montado al consolidar el
    // contexto (BOOTING→READY re-renderiza la superficie): se consulta el
    // botón vigente del DOM actual, no la referencia vieja.
    const submitNow = harness.form()?.querySelector<HTMLButtonElement>('button[type="submit"]')
    expect(submitNow?.disabled).toBe(false)
    const submitNowText = submitNow?.textContent ?? ''
    expect(submitNowText).toBe('Cambiar contraseña')
  })

  it('anti-carrera: la generación avanzada en vuelo descarta el resultado y sanea el draft', async () => {
    let resolveChange: ((value: { detail: string }) => void) | null = null
    identityApiDoubles.changeOwnPassword.mockImplementation(
      () => new Promise<{ detail: string }>((resolve) => {
        resolveChange = resolve
      }),
    )
    const harness = await mountAccountView()
    fillInput(harness.input('account-old-password')!, 'draft-old')
    fillInput(harness.input('account-new-password')!, 'draft-new')
    fillInput(harness.input('account-confirm-password')!, 'draft-new')

    harness.form()?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushRound()

    // Avance de generación (recaptura de tenant) mientras el POST está en vuelo.
    harness.session.captureTenant('otro-tenant')
    await flushRound()
    resolveChange?.({ detail: 'Contraseña actualizada.' })
    await flushRound()

    expect(harness.text()).not.toContain('200: Contraseña actualizada.')
    expect(harness.input('account-old-password')?.value ?? '').toBe('')
    expect(harness.session.status).toBe(SESSION_STATUS.NEEDS_TENANT)
    // Resultado tardío descartado: ni aviso ni retiro disparado por el 200
    // viejo; la recaptura de tenant sigue rigiendo su propio estado.
    expect(consumeAccountPasswordChangeNotice()).toBeNull()
    expect(harness.router.currentRoute.value.path).not.toBe('/login')
  })

  it('AC-7: la recuperación se enlaza como flujo no autenticado; sin envío de códigos desde sesión', async () => {
    const harness = await mountAccountView()
    expect(harness.host.querySelector('a[href="/recuperar"]')).not.toBeNull()
    expect(harness.text()).toContain('se gestiona fuera de la sesión autenticada')
  })
})
