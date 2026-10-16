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
import type {
  CreateOrganizationUnitBody,
  OrganizationUnitDeletionPreviewDTO,
  OrganizationUnitRecord,
  PatchOrganizationUnitBody,
  RecintoDTO,
  ReplaceOrganizationUnitBody,
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

// Dobles de aislamiento de tests exclusivamente: la superficie de organización se
// monta contra la API sustituida para observar la capa visible (etiquetas, copy,
// impacto). El producto nunca ve mocks.
const organizationApiDoubles = vi.hoisted(() => ({
  getOrganizationUnits: vi.fn<
    (connection: ApiConnection) => Promise<readonly OrganizationUnitRecord[]>
  >(),
  getOrganizationUnit: vi.fn<
    (id: number, connection: ApiConnection) => Promise<OrganizationUnitRecord>
  >(),
  createOrganizationUnit: vi.fn<(
    body: CreateOrganizationUnitBody,
    connection: ApiConnection,
  ) => Promise<OrganizationUnitRecord>>(),
  patchOrganizationUnit: vi.fn<(
    id: number,
    body: PatchOrganizationUnitBody,
    connection: ApiConnection,
  ) => Promise<OrganizationUnitRecord>>(),
  replaceOrganizationUnit: vi.fn<(
    id: number,
    body: ReplaceOrganizationUnitBody,
    connection: ApiConnection,
  ) => Promise<OrganizationUnitRecord>>(),
  deleteOrganizationUnit: vi.fn<(id: number, connection: ApiConnection) => Promise<void>>(),
  previewOrganizationUnitDeletion: vi.fn<(
    id: number,
    connection: ApiConnection,
  ) => Promise<OrganizationUnitDeletionPreviewDTO>>(),
  getRecintos: vi.fn<(connection: ApiConnection) => Promise<readonly RecintoDTO[]>>(),
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
  name: 'OrganizationUxStub',
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
    permissions: [
      'view_unit',
      'create_unit',
      'update_unit',
      'delete_unit',
      'view_recinto',
      'manage_recinto',
    ],
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

function makePreview(
  overrides: Partial<OrganizationUnitDeletionPreviewDTO> = {},
): OrganizationUnitDeletionPreviewDTO {
  return {
    unit_code: 'CMD-1-A',
    unit_name: 'Compañía A',
    parent_code: 'CMD-1',
    counts: {
      assignments: 3,
      weapons: 2,
      ranges: 1,
      lessons: 4,
      fractions: 5,
      results: 6,
      child_units: 1,
      lessons_as_participant: 2,
    },
    ...overrides,
  }
}

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  text(): string
  form(id: string): HTMLFormElement | null
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

function modalDialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.ds-modal[role="dialog"]')
}

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

function requireForm(id: string): HTMLFormElement {
  const form = document.querySelector<HTMLFormElement>(`form#${id}`)
  if (form === null) throw new Error(`Formulario #${id} no montado.`)
  return form
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
    form: (id: string) => document.querySelector<HTMLFormElement>(`form#${id}`),
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

async function submitForm(form: HTMLFormElement): Promise<void> {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushRound()
}

beforeEach(() => {
  for (const fn of Object.values(organizationApiDoubles)) fn.mockReset()
  for (const fn of Object.values(sharedDomainDoubles)) fn.mockReset()

  organizationApiDoubles.getOrganizationUnits.mockResolvedValue([])
  organizationApiDoubles.getRecintos.mockResolvedValue([])
  organizationApiDoubles.getOrganizationUnit.mockResolvedValue(makeUnit())
  organizationApiDoubles.previewOrganizationUnitDeletion.mockResolvedValue(makePreview())
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

describe('OrganizationView: acciones visibles sin siglas HTTP', () => {
  it('el detalle nombra las dos eliminaciones por su efecto y no muestra siglas', async () => {
    organizationApiDoubles.getOrganizationUnit.mockResolvedValue(makeUnit())
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([makeUnit()])
    const harness = await mountOrganizationView('/organizacion/unidades/8')

    const labels = buttonsIn(harness.host).map((button) => (button.textContent ?? '').trim())
    expect(labels).toContain('Eliminar unidad')
    expect(labels).toContain('Eliminar y migrar contenido')
    expect(harness.text()).not.toMatch(/\b(PUT|PATCH|DELETE)\b/)
  })

  it('el modal de edición expone «Guardar» y el reemplazo total como acción secundaria', async () => {
    organizationApiDoubles.getOrganizationUnit.mockResolvedValue(makeUnit())
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([makeUnit()])
    const harness = await mountOrganizationView('/organizacion/unidades/8')

    click(harness.button('Editar'))
    await flushRound()

    const dialog = requireModalDialog()
    const labels = buttonsIn(dialog).map((button) => (button.textContent ?? '').trim())
    expect(labels).toContain('Guardar')
    expect(labels).toContain('Reemplazar todos los campos…')
    expect(dialog.textContent ?? '').not.toMatch(/\b(PUT|PATCH|DELETE)\b/)
  })
})

describe('OrganizationView: guardado incremental frente al reemplazo total', () => {
  it('el envío del formulario de edición usa PATCH y no PUT', async () => {
    organizationApiDoubles.getOrganizationUnit.mockResolvedValue(makeUnit())
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([makeUnit()])
    organizationApiDoubles.patchOrganizationUnit.mockResolvedValue(makeUnit({ name: 'Compañía A bis' }))
    const harness = await mountOrganizationView('/organizacion/unidades/8')

    click(harness.button('Editar'))
    await flushRound()
    fillInput(requireInput('organization-unit-name'), 'Compañía A bis')
    await submitForm(requireForm('organization-unit-form'))

    expect(organizationApiDoubles.patchOrganizationUnit).toHaveBeenCalledTimes(1)
    expect(organizationApiDoubles.replaceOrganizationUnit).not.toHaveBeenCalled()
  })

  it('el reemplazo total no se envía sin confirmación explícita', async () => {
    organizationApiDoubles.getOrganizationUnit.mockResolvedValue(makeUnit())
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([makeUnit()])
    organizationApiDoubles.replaceOrganizationUnit.mockResolvedValue(makeUnit())
    const harness = await mountOrganizationView('/organizacion/unidades/8')

    click(harness.button('Editar'))
    await flushRound()

    const dialog = requireModalDialog()
    click(buttonByText(dialog, 'Reemplazar todos los campos…'))
    await flushRound()

    expect(organizationApiDoubles.replaceOrganizationUnit).not.toHaveBeenCalled()
    expect(dialog.textContent ?? '').toContain('Vas a reemplazar todos los campos del registro')

    click(buttonByText(dialog, 'Confirmar reemplazo'))
    await flushRound()

    expect(organizationApiDoubles.replaceOrganizationUnit).toHaveBeenCalledTimes(1)
    const [firstCall] = organizationApiDoubles.replaceOrganizationUnit.mock.calls
    expect(firstCall?.[0]).toBe(8)
    expect(firstCall?.[1]).toMatchObject({ code: 'CMD-1-A', name: 'Compañía A', unit_type: 'company' })
  })
})

describe('OrganizationView: el intento de envío valida en el formulario', () => {
  it('el botón Guardar nace habilitado y el primer campo inválido recibe el estado y el foco', async () => {
    const harness = await mountOrganizationView('/organizacion/unidades')

    click(harness.button('Crear unidad'))
    await flushRound()

    const dialog = requireModalDialog()
    const save = buttonByText(dialog, 'Guardar')
    expect(save, 'botón Guardar del pie').not.toBeNull()
    expect(save?.disabled, 'no se deshabilita antes del intento').toBe(false)

    await submitForm(requireForm('organization-unit-form'))

    expect(organizationApiDoubles.createOrganizationUnit).not.toHaveBeenCalled()
    const code = requireInput('organization-unit-code')
    expect(code.classList.contains('is-invalid')).toBe(true)
    expect(code.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement, 'foco en el primer campo inválido').toBe(code)
    expect(dialog.textContent ?? '').toContain('Revisa los campos marcados antes de guardar.')
  })
})

describe('OrganizationView: la eliminación simple muestra el impacto real', () => {
  it('lista los conteos de dependencia con el vocabulario del dominio', async () => {
    organizationApiDoubles.getOrganizationUnit.mockResolvedValue(makeUnit())
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([makeUnit()])
    organizationApiDoubles.previewOrganizationUnitDeletion.mockResolvedValue(makePreview())
    const harness = await mountOrganizationView('/organizacion/unidades/8')

    click(harness.button('Eliminar unidad'))
    await flushRound()

    const dialog = requireModalDialog()
    const text = dialog.textContent ?? ''
    expect(organizationApiDoubles.previewOrganizationUnitDeletion).toHaveBeenCalledTimes(1)
    expect(text).toContain('Impacto de la eliminación')
    expect(text).toContain('Puestos')
    expect(text).toContain('Armas')
    expect(text).toContain('Recintos')
    expect(text).toContain('Lecciones como participante')
    expect(text).not.toMatch(/Assignments|Weapons|Child units|Lessons/)
    expect(text).not.toContain('DELETE')
  })
})

describe('OrganizationView: fila de consulta agrupada a la izquierda', () => {
  it('la búsqueda y los dos selectores viven en la fila de controles, y los botones fuera', async () => {
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([makeUnit()])
    const harness = await mountOrganizationView('/organizacion/unidades')

    const controls = harness.host.querySelector('.organization-view__toolbar-controls')
    expect(controls, 'fila de controles de consulta').not.toBeNull()
    expect(controls?.contains(requireInput('organization-unit-search'))).toBe(true)
    expect(controls?.contains(requireSelect('organization-unit-sort'))).toBe(true)
    expect(controls?.contains(requireSelect('organization-unit-state'))).toBe(true)

    const actions = harness.host.querySelector('.organization-view__toolbar-actions')
    expect(actions, 'fila de acciones').not.toBeNull()
    expect(actions?.querySelector('select'), 'los selectores no viven en la fila de acciones').toBeNull()
    for (const label of ['Árbol', 'Tabla', 'Actualizar', 'Crear unidad']) {
      expect(actions?.contains(buttonByText(harness.host, label)), label).toBe(true)
    }
  })

  it('la barra de recintos agrupa igual búsqueda y selectores', async () => {
    organizationApiDoubles.getRecintos.mockResolvedValue([])
    const harness = await mountOrganizationView('/organizacion/recintos')

    const controls = harness.host.querySelector('.organization-view__toolbar-controls')
    expect(controls?.contains(requireInput('organization-recinto-search'))).toBe(true)
    expect(controls?.contains(requireSelect('organization-recinto-sort'))).toBe(true)
    expect(controls?.contains(requireSelect('organization-recinto-state'))).toBe(true)

    const actions = harness.host.querySelector('.organization-view__toolbar-actions')
    expect(actions?.querySelector('select'), 'los selectores no viven en la fila de acciones').toBeNull()
    expect(actions?.contains(buttonByText(harness.host, 'Actualizar'))).toBe(true)
  })
})

describe('OrganizationView: estados vacíos con salida', () => {
  it('el vacío por búsqueda ofrece limpiarla', async () => {
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([
      makeUnit(),
      makeUnit({ id: 9, code: 'CMD-2', name: 'Sección B', parent: null, parent_code: null }),
    ])
    const harness = await mountOrganizationView('/organizacion/unidades')

    fillInput(requireInput('organization-unit-search'), 'zzz')
    await flushRound()

    const clear = buttonByText(harness.host, 'Limpiar búsqueda')
    expect(clear, 'salida del vacío por filtro').not.toBeNull()
    expect(harness.text()).toContain('Ninguna unidad coincide con la búsqueda.')

    click(clear)
    await flushRound()

    expect(requireInput('organization-unit-search').value).toBe('')
    expect(buttonByText(harness.host, 'Limpiar búsqueda')).toBeNull()
    expect(harness.text()).toContain('Sección B')
  })

  it('el filtro de estado deja fuera las unidades que no encajan', async () => {
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([
      makeUnit(),
      makeUnit({ id: 10, code: 'CMD-3', name: 'Sección Inactiva', is_active: false }),
    ])
    const harness = await mountOrganizationView('/organizacion/unidades')

    chooseSelect(requireSelect('organization-unit-state'), 'active')
    await flushRound()
    expect(harness.text()).not.toContain('Sección Inactiva')
    expect(harness.text()).toContain('Compañía A')

    chooseSelect(requireSelect('organization-unit-state'), 'inactive')
    await flushRound()
    expect(harness.text()).toContain('Sección Inactiva')
    expect(harness.text()).not.toContain('Compañía A')
  })

  it('el vacío por filtro de estado ofrece quitarlo', async () => {
    organizationApiDoubles.getOrganizationUnits.mockResolvedValue([
      makeUnit(),
      makeUnit({ id: 11, code: 'CMD-4', name: 'Sección C' }),
    ])
    const harness = await mountOrganizationView('/organizacion/unidades')

    chooseSelect(requireSelect('organization-unit-state'), 'inactive')
    await flushRound()

    expect(harness.text()).toContain('Ninguna unidad coincide con el filtro de estado.')
    const clear = buttonByText(harness.host, 'Ver todas las unidades')
    expect(clear, 'salida del filtro de estado').not.toBeNull()

    click(clear)
    await flushRound()

    expect(buttonByText(harness.host, 'Ver todas las unidades')).toBeNull()
    expect(harness.text()).toContain('Sección C')
  })
})
