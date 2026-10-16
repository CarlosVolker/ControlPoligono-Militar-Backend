import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import OrganizationView from '../../src/views/organization/OrganizationView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { OrganizationApiResponseError } from '../../src/features/organization/api'
import type {
  AddUnitToRecintoResponseDTO,
  CreateOrganizationUnitBody,
  OrganizationUnitRecord,
  RecintoDTO,
} from '../../src/features/organization/api'
import type {
  AssignableUnitsResponse,
  OrganizationUnitDTO,
  OrganizationUnitLookupResponse,
} from '../../src/types/shared/domain'
import type { AuthContext } from '../../src/types/contexto'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento de tests exclusivamente: la API real de organización se
// sustituye en el módulo mock para la unidad de componente; el producto nunca ve
// mocks. Clases (OrganizationApiResponseError) y constantes quedan intactas por
// importOriginal.
const organizationApiDoubles = vi.hoisted(() => ({
  getOrganizationUnits: vi.fn<
    (connection: ApiConnection) => Promise<readonly OrganizationUnitRecord[]>
  >(),
  createOrganizationUnit: vi.fn<(
    body: CreateOrganizationUnitBody,
    connection: ApiConnection,
  ) => Promise<OrganizationUnitRecord>>(),
  getRecintos: vi.fn<(connection: ApiConnection) => Promise<readonly RecintoDTO[]>>(),
  getRecinto: vi.fn<(id: number, connection: ApiConnection) => Promise<RecintoDTO>>(),
  addUnitToRecinto: vi.fn<(
    id: number,
    unitCode: string,
    connection: ApiConnection,
  ) => Promise<AddUnitToRecintoResponseDTO>>(),
}))

vi.mock('../../src/features/organization/api', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...organizationApiDoubles }
})

const sharedDomainDoubles = vi.hoisted(() => ({
  getOrganizationUnitsLookup: vi.fn<
    (connection: ApiConnection) => Promise<OrganizationUnitLookupResponse>
  >(),
  getAssignableUnits: vi.fn<
    (connection: ApiConnection) => Promise<AssignableUnitsResponse>
  >(),
}))

vi.mock('../../src/api/shared/domain', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...sharedDomainDoubles }
})

const STUB_COMPONENT = defineComponent({
  name: 'OrganizationAutocloseStub',
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
    unit_membership: null,
    scopes: [],
    permissions: ['view_unit', 'create_unit', 'view_recinto', 'manage_recinto'],
    assignments: [{
      role: 'comandante',
      scope: 'unidad_y_descendientes',
      organization_unit: 'unit-fixture',
      is_primary: true,
    }],
  }
  return validateAuthContext(raw)
}

function makeUnit(overrides: Partial<OrganizationUnitDTO> = {}): OrganizationUnitDTO {
  return {
    id: 8,
    tenant: 1,
    parent: 7,
    parent_code: 'CMD-1',
    code: 'CMD-1-A',
    name: 'Compañía A',
    unit_type: 'company',
    is_active: true,
    ...overrides,
  }
}

function makeRecinto(overrides: Partial<RecintoDTO> = {}): RecintoDTO {
  return {
    id: 9,
    tenant: 1,
    code: 'REC-9',
    name: 'Recinto 9',
    description: 'recinto devuelto por el doble de prueba',
    is_active: true,
    units: [3],
    unit_codes: ['CMD-1'],
    unit_count: 1,
    ...overrides,
  }
}

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  text(): string
  form(): HTMLFormElement | null
  button(label: string): HTMLButtonElement | null
}

const harnesses: Harness[] = []

async function flushRound(): Promise<void> {
  for (let index = 0; index < 24; index += 1) {
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

// DsModal teleporta su contenido a <body> y lo retira al terminar la transición
// declarada de 200 ms (DsModal.vue: `:duration="200"`): la presencia del diálogo
// es el discriminador de modal abierto, igual que en la evidencia de runtime.
function modalDialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.ds-modal[role="dialog"]')
}

// Narrowing por null-check: cuando la prueba exige el modal montado no se fuerza
// el tipo con un cast, se falla con el motivo explícito.
function requireModalDialog(): HTMLElement {
  const dialog = modalDialog()
  if (dialog === null) throw new Error('No hay diálogo de modal montado en el documento.')
  return dialog
}

function requireInput(id: string): HTMLInputElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLInputElement)) throw new Error(`Input #${id} no montado.`)
  return element
}

function requireSelect(id: string): HTMLSelectElement {
  const element = document.getElementById(id)
  if (!(element instanceof HTMLSelectElement)) throw new Error(`Select #${id} no montado.`)
  return element
}

async function settleModalTeardown(): Promise<void> {
  await flushRound()
  await new Promise<void>((resolve) => { window.setTimeout(resolve, 250) })
  await flushRound()
}

async function mountOrganizationView(path: string): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push(path)
  await router.isReady()

  const session = useSessionStore(pinia)
  const sessionPatch: Partial<SessionState> = {
    status: SESSION_STATUS.READY,
    tenantCode: 'tenant-fixture',
    unitCode: 'unit-fixture',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' },
    context: makeContext(),
  }
  session.$patch(sessionPatch)

  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(OrganizationView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const harness: Harness = {
    pinia,
    router,
    app,
    host,
    text: () => document.body.textContent ?? '',
    form: () => document.querySelector<HTMLFormElement>('form#organization-unit-form'),
    button: (label: string) => buttonByText(host, label),
  }
  harnesses.push(harness)
  return harness
}

function fillInput(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function chooseSelect(select: HTMLSelectElement, value: string): void {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

function click(element: HTMLElement | null): void {
  expect(element, 'elemento a pulsar presente').not.toBeNull()
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

async function submitForm(harness: Harness): Promise<void> {
  harness.form()?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushRound()
}

beforeEach(() => {
  for (const fn of Object.values(organizationApiDoubles)) fn.mockReset()
  for (const fn of Object.values(sharedDomainDoubles)) fn.mockReset()

  organizationApiDoubles.getOrganizationUnits.mockResolvedValue([])
  organizationApiDoubles.getRecintos.mockResolvedValue([])
  organizationApiDoubles.getRecinto.mockResolvedValue(makeRecinto())
  sharedDomainDoubles.getOrganizationUnitsLookup.mockResolvedValue({ results: [makeUnit()] })
  sharedDomainDoubles.getAssignableUnits.mockResolvedValue({ results: [] })
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

describe('OrganizationView: el modal se cierra solo tras una mutación con éxito', () => {
  it('«Agregar unidad al recinto» cierra el modal cuando el servidor confirma', async () => {
    organizationApiDoubles.getRecintos.mockResolvedValue([makeRecinto({ unit_count: 2 })])
    organizationApiDoubles.addUnitToRecinto.mockResolvedValue({
      detail: 'Unidad relacionada.',
      unit_count: 2,
    })
    const harness = await mountOrganizationView('/organizacion/recintos/9')

    click(harness.button('Agregar unidad'))
    await flushRound()

    const dialog = requireModalDialog()
    expect(harness.text()).toContain('Agregar unidad al recinto')

    chooseSelect(requireSelect('organization-unit-lookup-select'), 'CMD-1-A')
    await flushRound()

    const confirm = buttonByText(dialog, 'Agregar unidad')
    expect(confirm, 'confirmación del pie del modal').not.toBeNull()
    expect(confirm?.disabled, 'confirmación habilitada con unidad seleccionada').toBe(false)

    click(confirm)
    await flushRound()

    expect(organizationApiDoubles.addUnitToRecinto).toHaveBeenCalledTimes(1)
    expect(harness.text()).toContain('Unidad relacionada. Conteo devuelto: 2.')

    await settleModalTeardown()
    expect(modalDialog(), 'el modal se cierra solo tras el éxito').toBeNull()
  })

  it('el alta de unidad (POST) cierra el modal y recarga la lista', async () => {
    organizationApiDoubles.createOrganizationUnit.mockResolvedValue(makeUnit({ code: 'CMD-9' }))
    const harness = await mountOrganizationView('/organizacion/unidades')

    click(harness.button('Crear unidad'))
    await flushRound()
    expect(harness.form(), 'formulario del modal de alta').not.toBeNull()

    fillInput(requireInput('organization-unit-code'), '  CMD-9  ')
    fillInput(requireInput('organization-unit-name'), 'Compañía Nueva')
    await submitForm(harness)

    expect(organizationApiDoubles.createOrganizationUnit).toHaveBeenCalledTimes(1)
    const body = organizationApiDoubles.createOrganizationUnit.mock.calls[0]?.[0]
    expect(body).toMatchObject({ code: 'CMD-9', name: 'Compañía Nueva' })
    expect(harness.text()).toContain('Unidad creada: CMD-9 — Compañía A.')
    expect(organizationApiDoubles.getOrganizationUnits).toHaveBeenCalledTimes(2)

    await settleModalTeardown()
    expect(modalDialog(), 'el modal se cierra solo tras el POST').toBeNull()
  })

  it('el fallo del servidor preserva el modal abierto con el detalle y sin bloqueo de busy', async () => {
    organizationApiDoubles.createOrganizationUnit.mockRejectedValue(
      new OrganizationApiResponseError(403, 'Sin permiso para unidades en esta unidad.', null, null),
    )
    const harness = await mountOrganizationView('/organizacion/unidades')

    click(harness.button('Crear unidad'))
    await flushRound()

    fillInput(requireInput('organization-unit-code'), 'CMD-403')
    fillInput(requireInput('organization-unit-name'), 'Nombre')
    await submitForm(harness)
    await settleModalTeardown()

    const dialog = requireModalDialog()
    expect(dialog.textContent ?? '').toContain('Sin permiso para unidades en esta unidad.')
    expect(harness.text()).not.toContain('resultado incierto')
    expect(buttonByText(dialog, 'Cancelar')?.disabled, 'busy liberado').toBe(false)
    expect(requireInput('organization-unit-code').value).toBe('CMD-403')
  })
})
