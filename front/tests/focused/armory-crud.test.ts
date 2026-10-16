import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArmoryView from '../../src/views/armory/ArmoryView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { ArmoryApiResponseError } from '../../src/features/armory/api'
import type { ArmoryDTO } from '../../src/features/armory/api'
import type { AuthContext } from '../../src/types/contexto'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento de tests exclusivamente: la API real de armerías se
// sustituye en el módulo mock para la unidad de componente; el producto nunca
// ve mocks. Clases (ArmoryApiResponseError) y constantes quedan intactas por
// importOriginal. Sólo la rama armerías (VIEW.ARMORIES): nada de armas/calibres.
const armoryApiDoubles = vi.hoisted(() => ({
  getArmories: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getArmory: vi.fn<(id: number, connection: ApiConnection) => Promise<unknown>>(),
  createArmory: vi.fn<(body: Record<string, unknown>, connection: ApiConnection) => Promise<unknown>>(),
  replaceArmory: vi.fn<(
    id: number,
    body: Record<string, unknown>,
    connection: ApiConnection,
  ) => Promise<unknown>>(),
  patchArmory: vi.fn<(
    id: number,
    body: Record<string, unknown>,
    connection: ApiConnection,
  ) => Promise<unknown>>(),
  deleteArmory: vi.fn<(id: number, connection: ApiConnection) => Promise<void>>(),
  getWeapons: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getActiveArmories: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
  getActiveCalibres: vi.fn<(connection: ApiConnection) => Promise<unknown[]>>(),
}))

vi.mock('../../src/features/armory/api', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...armoryApiDoubles }
})

const sharedDomainDoubles = vi.hoisted(() => ({
  getOrganizationUnitsLookup: vi.fn<(connection: ApiConnection) => Promise<unknown>>(),
}))

vi.mock('../../src/api/shared/domain', async (importOriginal) => {
  const actual = await importOriginal<object>()
  return { ...actual, ...sharedDomainDoubles }
})

const STUB_COMPONENT = defineComponent({
  name: 'ArmoryCrudStub',
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
    permissions: ['view_warehouse', 'create_warehouse_records', 'update_warehouse_records'],
    assignments: [{
      role: 'encargado_almacen',
      scope: 'unidad_propia',
      organization_unit: 'unit-fixture',
      is_primary: true,
    }],
  }
  return validateAuthContext(raw)
}

function makeArmory(overrides: Partial<ArmoryDTO> = {}): ArmoryDTO {
  return {
    id: 7,
    tenant: 2,
    organization_unit: 3,
    organization_unit_code: 'CIA-A',
    code: 'AR-7',
    name: 'Armería Test',
    descripcion: 'sintética',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    armas_count: 0,
    ...overrides,
  }
}

interface Harness {
  pinia: Pinia
  router: Router
  app: App
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
  text(): string
  input(id: string): HTMLInputElement | null
  select(id: string): HTMLSelectElement | null
  form(): HTMLFormElement | null
  toolbarCreate(): HTMLButtonElement
  rowButton(code: string, label: string): HTMLButtonElement | null
  modalButton(label: string): HTMLButtonElement | null
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

async function mountArmoryView(overrides: Partial<SessionState> = {}): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: TEST_ROUTES })
  await router.push('/almacen/armerias')
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
  const app = createApp(ArmoryView)
  app.use(pinia)
  app.use(router)
  app.mount(host)
  await flushRound()

  const toolbarCreateButton = buttonByText(host, 'Crear armería')
  expect(toolbarCreateButton, 'botón Crear armería en la barra de acciones').not.toBeNull()

  const harness: Harness = {
    pinia,
    router,
    app,
    host,
    session,
    // DsModal teleporta su contenido a <body>: el interior del modal (form,
    // inputs, alerts, pie con PUT/PATCH/baja) se consulta en document, no en
    // host; la lista/ficha inline quedan bajo host.
    text: () => document.body.textContent ?? '',
    input: (id: string) => document.getElementById(id) as HTMLInputElement | null,
    select: (id: string) => document.getElementById(id) as HTMLSelectElement | null,
    form: () => document.querySelector('form#armory-editor-form'),
    toolbarCreate: () => toolbarCreateButton as HTMLButtonElement,
    rowButton: (code: string, label: string) => {
      const row = [...host.querySelectorAll('tbody tr')]
        .find((tr) => (tr.textContent ?? '').includes(code))
      return row ? buttonByText(row, label) : null
    },
    modalButton: (label: string) => buttonByText(document.body, label),
  }
  harnesses.push(harness)
  return harness
}

function fillInput(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function chooseSelect(select: HTMLSelectElement, value: string): void {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

async function submitForm(harness: Harness): Promise<void> {
  harness.form()?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushRound()
}

async function openCreateModal(harness: Harness): Promise<void> {
  harness.toolbarCreate().dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flushRound()
  // El pie del modal repite el texto del botón de barra; el formulario es el
  // discriminador de que el modal de alta está montado.
  expect(harness.form(), 'form#armory-editor-form montado en el modal').not.toBeNull()
}

function armoryBody(call: unknown): Record<string, unknown> {
  return (call as [Record<string, unknown>, ApiConnection])[0]
}

beforeEach(() => {
  for (const fn of Object.values(armoryApiDoubles)) fn.mockReset()
  sharedDomainDoubles.getOrganizationUnitsLookup.mockReset()

  armoryApiDoubles.getArmories.mockResolvedValue([])
  armoryApiDoubles.getWeapons.mockResolvedValue([])
  armoryApiDoubles.getActiveArmories.mockResolvedValue([])
  armoryApiDoubles.getActiveCalibres.mockResolvedValue([])
  sharedDomainDoubles.getOrganizationUnitsLookup.mockResolvedValue({ results: [] })
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

describe('ArmoryView armerías: lista', () => {
  it('lista vacía del backend es estado EMPTY distinguible de error, sin requests de negocio extraños', async () => {
    const harness = await mountArmoryView()

    expect(armoryApiDoubles.getArmories).toHaveBeenCalledTimes(1)
    expect(harness.text()).toContain('No hay armerías en el ámbito activo.')
    // vacío ≠ error: ninguna alerta de peligro/denegación en la superficie.
    expect(harness.host.querySelector('[role="alert"].alert-danger')).toBeNull()
    expect(harness.text()).not.toContain('No fue posible')
    // el botón de alta sigue disponible para sesión elegible
    expect(harness.toolbarCreate().disabled).toBe(false)
  })

  it('navegación a la ficha desde la fila usa la lectura real del registro', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([makeArmory()])
    armoryApiDoubles.getArmory.mockResolvedValue(makeArmory({ descripcion: 'ficha sintética' }))
    const harness = await mountArmoryView()

    const codeButton = buttonByText(harness.host, 'AR-7')
    expect(codeButton, 'enlace de código en la fila').not.toBeNull()
    codeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(armoryApiDoubles.getArmory).toHaveBeenCalledTimes(1)
    expect((armoryApiDoubles.getArmory.mock.calls[0] as [number, unknown])[0]).toBe(7)
    expect(harness.text()).toContain('Ficha de armería')
    expect(harness.text()).toContain('Armería Test')
  })
})

describe('ArmoryView armerías: alta (POST)', () => {
  it('validación requerida bloquea el request: sin código/nombre no hay POST', async () => {
    const harness = await mountArmoryView()
    await openCreateModal(harness)
    expect(harness.form(), 'formulario del modal de alta').not.toBeNull()

    await submitForm(harness)

    expect(armoryApiDoubles.createArmory).not.toHaveBeenCalled()
    expect(harness.input('armory-code')?.getAttribute('aria-invalid')).toBe('true')
    expect(harness.input('armory-name')?.getAttribute('aria-invalid')).toBe('true')
  })

  it('POST con payload exacto del contrato: trim, campos condicionales omitidos, y refresco de lista al 200', async () => {
    const created = makeArmory({ id: 11, code: 'AR-01', name: 'Armería Nueva', descripcion: 'descriptiva' })
    armoryApiDoubles.createArmory.mockResolvedValue(created)
    const harness = await mountArmoryView()
    await openCreateModal(harness)

    fillInput(harness.input('armory-code')!, '  AR-01  ')
    fillInput(harness.input('armory-name')!, 'Armería Nueva')
    fillInput(
      document.getElementById('armory-description') as HTMLTextAreaElement,
      'descriptiva',
    )
    await submitForm(harness)

    expect(armoryApiDoubles.createArmory).toHaveBeenCalledTimes(1)
    expect(armoryBody(armoryApiDoubles.createArmory.mock.calls[0])).toEqual({
      code: 'AR-01',
      name: 'Armería Nueva',
      descripcion: 'descriptiva',
    })
    // Éxito: el listado se vuelve a cargar y la ficha del creado se muestra.
    expect(harness.text()).toContain('El servidor respondió con la armería creada')
    expect(armoryApiDoubles.getArmories).toHaveBeenCalledTimes(2)
    expect(harness.text()).toContain('AR-01')
  })
})

describe('ArmoryView armerías: edición (PUT y PATCH reales, sin inferir)', () => {
  async function openEditModal(harness: Harness): Promise<void> {
    const editButton = harness.rowButton('AR-7', 'Editar')
    expect(editButton, 'acción Editar de la fila').not.toBeNull()
    editButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
  }

  it('PUT es acción secundaria con confirmación: reemplaza el registro completo y no dispara PATCH', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([makeArmory()])
    armoryApiDoubles.getArmory.mockResolvedValue(makeArmory())
    armoryApiDoubles.replaceArmory.mockResolvedValue(makeArmory({ name: 'Renombrada' }))
    const harness = await mountArmoryView()

    await openEditModal(harness)
    expect(armoryApiDoubles.getArmory).toHaveBeenCalledTimes(1)
    // el draft se siembra con datos reales del detalle
    expect(harness.input('armory-code')?.value).toBe('AR-7')
    expect(harness.input('armory-name')?.value).toBe('Armería Test')

    fillInput(harness.input('armory-name')!, 'Renombrada')

    // La acción secundaria no envía sola: abre una confirmación explícita.
    const replaceTrigger = harness.modalButton('Reemplazar todos los campos')
    expect(replaceTrigger, 'acción secundaria de reemplazo total').not.toBeNull()
    replaceTrigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    expect(armoryApiDoubles.replaceArmory).not.toHaveBeenCalled()

    const confirmReplace = harness.modalButton('Confirmar reemplazo')
    expect(confirmReplace, 'confirmación del reemplazo total').not.toBeNull()
    confirmReplace?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(armoryApiDoubles.patchArmory).not.toHaveBeenCalled()
    expect(armoryApiDoubles.replaceArmory).toHaveBeenCalledTimes(1)
    const [id, body] = armoryApiDoubles.replaceArmory.mock.calls[0] as [
      number,
      Record<string, unknown>,
    ]
    expect(id).toBe(7)
    expect(body).toEqual({
      code: 'AR-7',
      name: 'Renombrada',
      descripcion: 'sintética',
      is_active: true,
      organization_unit_code_write: 'CIA-A',
    })
    expect(harness.text()).toContain('El servidor respondió con la armería actualizada')
  })

  it('PATCH es la acción primaria («Guardar cambios»): envía sólo el diff; sin cambios no hay request', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([makeArmory()])
    armoryApiDoubles.getArmory.mockResolvedValue(makeArmory())
    armoryApiDoubles.patchArmory.mockResolvedValue(makeArmory({ name: 'Cambiada' }))
    const harness = await mountArmoryView()

    await openEditModal(harness)

    const patchButton = harness.modalButton('Guardar cambios')
    expect(patchButton).not.toBeNull()
    patchButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    // Sin diff: mensaje explícito y cero requests.
    expect(armoryApiDoubles.patchArmory).not.toHaveBeenCalled()
    expect(armoryApiDoubles.replaceArmory).not.toHaveBeenCalled()
    expect(harness.text()).toContain('No hay cambios para enviar.')

    fillInput(harness.input('armory-name')!, 'Cambiada')
    patchButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    expect(armoryApiDoubles.replaceArmory).not.toHaveBeenCalled()
    expect(armoryApiDoubles.patchArmory).toHaveBeenCalledTimes(1)
    const [id, body] = armoryApiDoubles.patchArmory.mock.calls[0] as [
      number,
      Record<string, unknown>,
    ]
    expect(id).toBe(7)
    expect(body).toEqual({ name: 'Cambiada' })
  })
})

describe('ArmoryView armerías: copy de superficie', () => {
  it('ninguna etiqueta visible expone las siglas PUT/PATCH y el contador dice «de» cargadas', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([makeArmory()])
    armoryApiDoubles.getArmory.mockResolvedValue(makeArmory())
    const harness = await mountArmoryView()

    expect(harness.text()).toContain('1 de 1 armerías cargadas')

    const editButton = harness.rowButton('AR-7', 'Editar')
    expect(editButton, 'acción Editar de la fila').not.toBeNull()
    editButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()

    const visibleLabels = [...document.body.querySelectorAll('button, a, label, th, caption, small, dt, dd')]
      .map((node) => (node.textContent ?? '').trim())
    expect(visibleLabels.some((label) => /PUT|PATCH/.test(label))).toBe(false)
    expect(harness.modalButton('Guardar cambios')).not.toBeNull()
    expect(harness.modalButton('Reemplazar todos los campos')).not.toBeNull()
  })

  it('la baja se rotula «Dar de baja» en la fila y «Confirmar baja de armería» en el modal', async () => {
    armoryApiDoubles.getArmories.mockResolvedValue([makeArmory()])
    armoryApiDoubles.getArmory.mockResolvedValue(makeArmory())
    const harness = await mountArmoryView()

    expect(harness.rowButton('AR-7', 'Eliminar')).toBeNull()
    const bajaButton = harness.rowButton('AR-7', 'Dar de baja')
    expect(bajaButton, 'acción Dar de baja de la fila').not.toBeNull()

    bajaButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushRound()
    expect(harness.text()).toContain('Confirmar baja de armería')
    expect(harness.modalButton('Confirmar baja')).not.toBeNull()
  })
})

describe('ArmoryView armerías: validación', () => {
  it('valida la obligatoriedad al perder el foco y el error no se borra al primer carácter', async () => {
    const harness = await mountArmoryView()
    await openCreateModal(harness)

    const codeInput = harness.input('armory-code')
    expect(codeInput).not.toBeNull()
    // Al montar, el campo vacío no está marcado (no se valida mientras no haya intento/foco).
    expect(codeInput?.getAttribute('aria-invalid')).toBe('false')

    codeInput?.dispatchEvent(new Event('blur', { bubbles: true }))
    await flushRound()
    expect(codeInput?.getAttribute('aria-invalid')).toBe('true')

    // Escribir revalida: el campo ya cumple, el error deja de aplicar.
    fillInput(codeInput!, 'A')
    await flushRound()
    expect(codeInput?.getAttribute('aria-invalid')).toBe('false')

    // Vaciar no reintroduce el error sin blur (no se limpia ni se marca por tecla).
    fillInput(codeInput!, '')
    await flushRound()
    expect(codeInput?.getAttribute('aria-invalid')).toBe('false')

    codeInput?.dispatchEvent(new Event('blur', { bubbles: true }))
    await flushRound()
    expect(codeInput?.getAttribute('aria-invalid')).toBe('true')
  })

  it('un error del servidor por campo no se borra al editar el valor', async () => {
    armoryApiDoubles.createArmory.mockRejectedValue(
      new ArmoryApiResponseError(400, 'Datos inválidos.', { code: 'Ya existe una armería con este código.' }, null),
    )
    const harness = await mountArmoryView()
    await openCreateModal(harness)

    fillInput(harness.input('armory-code')!, 'AR-01')
    fillInput(harness.input('armory-name')!, 'Nombre')
    await submitForm(harness)

    expect(harness.text()).toContain('Ya existe una armería con este código.')
    expect(harness.input('armory-code')?.getAttribute('aria-invalid')).toBe('true')

    fillInput(harness.input('armory-code')!, 'AR-02')
    await flushRound()
    // El error del servidor sigue vigente hasta un nuevo envío.
    expect(harness.input('armory-code')?.getAttribute('aria-invalid')).toBe('true')
    expect(harness.text()).toContain('Ya existe una armería con este código.')
  })
})

describe('ArmoryView armerías: 403 del backend', () => {
  it('detail literal del servidor preservado en el modal, draft intacto y cero banner incierto', async () => {
    armoryApiDoubles.createArmory.mockRejectedValue(
      new ArmoryApiResponseError(403, 'Sin permiso para armerías en esta unidad.', null, null),
    )
    const harness = await mountArmoryView()
    await openCreateModal(harness)

    fillInput(harness.input('armory-code')!, 'AR-403')
    fillInput(harness.input('armory-name')!, 'Nombre')
    await submitForm(harness)

    expect(armoryApiDoubles.createArmory).toHaveBeenCalledTimes(1)
    // ST-07: el detail viaja literal, sin reescritura cliente.
    expect(harness.text()).toContain('Sin permiso para armerías en esta unidad.')
    // 4xx confirmado ≠ incierto: no aparece el banner de reconciliación.
    expect(harness.text()).not.toContain('sin resultado confirmado')
    expect(harness.toolbarCreate().disabled).toBe(false)
    // el draft del formulario se preserva para corrección explícita
    expect(harness.input('armory-code')?.value).toBe('AR-403')
  })
})
