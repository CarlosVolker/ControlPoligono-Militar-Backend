import { createApp, defineComponent, nextTick, type App } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExercisesView from '../../src/views/exercises/ExercisesView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { ExercisesApiResponseError } from '../../src/features/exercises/api'
import type {
  ExerciseDTO,
  MunitionConsumptionDTO,
  WeaponConsumptionDTO,
} from '../../src/features/exercises/api'
import type { OrganizationUnitRecord } from '../../src/features/organization/api'
import type { AuthContext } from '../../src/types/contexto'
import type { ApiConnection } from '../../src/types/dashboard'
import type { SessionState } from '../../src/types/session'
import { SESSION_STATUS } from '../../src/types/session'

// Dobles de aislamiento de tests: la API real de ejercicios/consumos se
// sustituye para la unidad de componente; las clases y constantes del contrato
// quedan intactas por importOriginal. El producto nunca ve mocks.
const exercisesApiDoubles = vi.hoisted(() => ({
  getExercises: vi.fn<(connection: ApiConnection) => Promise<ExerciseDTO[]>>(),
  getExercise: vi.fn<(id: number, connection: ApiConnection) => Promise<ExerciseDTO>>(),
  patchExercise: vi.fn<(id: number, body: unknown, connection: ApiConnection) => Promise<ExerciseDTO>>(),
  replaceExercise: vi.fn<(id: number, body: unknown, connection: ApiConnection) => Promise<ExerciseDTO>>(),
  getMunitionConsumptions: vi.fn<(connection: ApiConnection) => Promise<MunitionConsumptionDTO[]>>(),
  getWeaponConsumptions: vi.fn<(connection: ApiConnection) => Promise<WeaponConsumptionDTO[]>>(),
}))

vi.mock('../../src/features/exercises/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/exercises/api')>()
  return { ...actual, ...exercisesApiDoubles }
})

const organizationApiDoubles = vi.hoisted(() => ({
  getAssignableOrganizationUnits: vi.fn<(connection: ApiConnection) => Promise<{ results: OrganizationUnitRecord[] }>>(),
}))

vi.mock('../../src/features/organization/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/features/organization/api')>()
  return { ...actual, ...organizationApiDoubles }
})

const STUB_COMPONENT = defineComponent({
  name: 'ExercisesUxSweepStub',
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
    permissions: ['view_exercises', 'create_exercises', 'update_exercises', 'delete_exercises'],
    assignments: [{
      role: 'tirador',
      scope: 'unidad_propia',
      organization_unit: 'unit-fixture',
      is_primary: true,
    }],
  }
  return validateAuthContext(raw)
}

function makeExercise(overrides: Partial<ExerciseDTO> = {}): ExerciseDTO {
  return {
    id_ejercicio: 1,
    tenant: 2,
    organization_unit: 3,
    nombre: 'Alfa',
    fecha: '2026-10-15',
    zona: 'Norte',
    tipo_ejercicio: 'asalto',
    numero_orden: null,
    fecha_orden: null,
    observaciones: '',
    unidades_participantes_codes: [],
    created_at: '2026-10-15T12:33:45.123456-03:00',
    ...overrides,
  }
}

function makeUnit(overrides: Partial<OrganizationUnitRecord> = {}): OrganizationUnitRecord {
  return {
    id: 3,
    tenant: 2,
    parent: null,
    parent_code: null,
    code: 'CIA-A',
    name: 'Compañía A',
    unit_type: 'company',
    is_active: true,
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
  buttonByText(root: ParentNode, label: string): HTMLButtonElement | null
}

const harnesses: Harness[] = []

function flushRound(): Promise<void> {
  return (async () => {
    for (let index = 0; index < 24; index += 1) {
      await Promise.resolve()
      await nextTick()
    }
  })()
}

function click(element: Element | null | undefined): void {
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function fillInput(input: HTMLInputElement | null, value: string): void {
  if (!input) return
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function mountExercisesView(path: string, overrides: Partial<SessionState> = {}): Promise<Harness> {
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
  const app = createApp(ExercisesView)
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
    // DsModal teleporta el cuerpo del diálogo a <body>: el pie del modal se
    // consulta en document, no en host.
    text: () => host.textContent ?? '',
    input: (id: string) => document.getElementById(id) as HTMLInputElement | null,
    buttonByText: (root: ParentNode, label: string) => (
      [...root.querySelectorAll('button, a')]
        .find((element) => (element.textContent ?? '').trim() === label) as HTMLButtonElement | null
    ),
  }
  harnesses.push(harness)
  return harness
}

beforeEach(() => {
  for (const fn of Object.values(exercisesApiDoubles)) fn.mockReset()
  organizationApiDoubles.getAssignableOrganizationUnits.mockReset()
  exercisesApiDoubles.getExercises.mockResolvedValue([])
  exercisesApiDoubles.getMunitionConsumptions.mockResolvedValue([])
  exercisesApiDoubles.getWeaponConsumptions.mockResolvedValue([])
  organizationApiDoubles.getAssignableOrganizationUnits.mockResolvedValue({ results: [makeUnit()] })
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

describe('ExercisesView — identificadores, conteo, fechas y orden (barrido UX 2026-10-16)', () => {
  it('lista: conteo honesto «N de M», unidad con nombre del catálogo y fecha es-CL con ISO en title', async () => {
    exercisesApiDoubles.getExercises.mockResolvedValue([
      makeExercise({ id_ejercicio: 1, nombre: 'Alfa', organization_unit: 3 }),
      makeExercise({ id_ejercicio: 2, nombre: 'Beta', organization_unit: 9, fecha: '2026-01-02' }),
    ])

    const harness = await mountExercisesView('/tiro/ejercicios')

    expect(harness.text()).toContain('2 de 2 ejercicios cargados')
    expect(harness.text()).toContain('CIA-A — Compañía A')
    // Unidad sin nombre en el catálogo: se conserva el id devuelto, sin inventar.
    expect(harness.text()).toContain('Unidad 9')
    // Fecha de calendario formateada y su ISO crudo disponible en `title`.
    const fechaCell = [...harness.host.querySelectorAll('tbody tr td')]
      .find((cell) => cell.textContent?.trim() === '15-10-2026')
    expect(fechaCell, 'fecha es-CL en la tabla').not.toBeUndefined()
    expect(fechaCell?.getAttribute('title')).toBe('2026-10-15')
    // El título de columna «Tenant» desapareció (la institución activa ya rige).
    expect(harness.text()).not.toContain('Tenant')
  })

  it('orden: el botón «Orden descendente» declara aria-pressed y cambia el orden real', async () => {
    exercisesApiDoubles.getExercises.mockResolvedValue([
      makeExercise({ id_ejercicio: 1, nombre: 'Alfa', fecha: '2026-10-15' }),
      makeExercise({ id_ejercicio: 2, nombre: 'Beta', fecha: '2026-01-02' }),
    ])

    const harness = await mountExercisesView('/tiro/ejercicios')
    const sortButton = harness.buttonByText(harness.host, 'Orden descendente')
    expect(sortButton, 'botón de dirección de orden').not.toBeNull()
    expect(sortButton?.getAttribute('aria-pressed')).toBe('false')

    const firstRowBefore = harness.host.querySelector('tbody tr')?.textContent ?? ''
    expect(firstRowBefore).toContain('Beta')

    click(sortButton)
    await flushRound()

    expect(sortButton?.getAttribute('aria-pressed')).toBe('true')
    expect(harness.host.querySelector('tbody tr')?.textContent ?? '').toContain('Alfa')
  })
})

describe('ExercisesView — un solo guardado y errores de campo (barrido UX 2026-10-16)', () => {
  async function openEditor(): Promise<Harness> {
    exercisesApiDoubles.getExercise.mockResolvedValue(makeExercise({ id_ejercicio: 12, nombre: 'Alfa' }))
    const harness = await mountExercisesView('/tiro/ejercicios/12')
    click(harness.buttonByText(harness.host, 'Editar'))
    await flushRound()
    return harness
  }

  it('el editor no expone PUT/PATCH: primario «Guardar cambios» y reemplazo explícito como secundario', async () => {
    const harness = await openEditor()

    const footer = document.querySelector('.modal-footer')
    expect(footer, 'pie del modal montado').not.toBeNull()
    const labels = [...(footer?.querySelectorAll('button') ?? [])]
      .map((button) => (button.textContent ?? '').trim())

    expect(labels).toContain('Guardar cambios')
    expect(labels).toContain('Reemplazar con todos los campos')
    for (const label of labels) {
      expect(label).not.toContain('PUT')
      expect(label).not.toContain('PATCH')
    }
    // El primario «Guardar cambios» es el último: un solo verbo de guardado.
    expect(labels[labels.length - 1]).toBe('Guardar cambios')
    void harness
  })

  it('sin cambios: «Guardar cambios» avisa y no envía request', async () => {
    const harness = await openEditor()
    exercisesApiDoubles.patchExercise.mockResolvedValue(makeExercise({ id_ejercicio: 12 }))

    click(harness.buttonByText(document.body, 'Guardar cambios'))
    await flushRound()

    expect(document.body.textContent ?? '').toContain('No hay cambios que guardar')
    expect(exercisesApiDoubles.patchExercise).not.toHaveBeenCalled()
  })

  it('error de campo del backend: resumen con etiqueta visible, error con id y foco en el primer inválido', async () => {
    const harness = await openEditor()
    exercisesApiDoubles.patchExercise.mockRejectedValue(
      new ExercisesApiResponseError(400, null, { nombre: ['Ya existe un ejercicio con ese nombre.'] }, null),
    )

    fillInput(harness.input('exercise-name'), 'Alfa modificado')
    click(harness.buttonByText(document.body, 'Guardar cambios'))
    await flushRound()

    // La clave técnica del backend no aparece; la etiqueta visible sí.
    expect(document.body.textContent ?? '').not.toContain('nombre:')
    const errorNode = document.getElementById('exercise-name-error')
    expect(errorNode, 'error del campo con id').not.toBeNull()
    expect(errorNode?.textContent ?? '').toContain('Ya existe un ejercicio con ese nombre.')
    expect(harness.input('exercise-name')?.getAttribute('aria-describedby')).toBe('exercise-name-error')
    expect(document.activeElement).toBe(harness.input('exercise-name'))
  })

  it('diálogo de baja: el foco inicial cae en «Cancelar», no en el destructivo', async () => {
    exercisesApiDoubles.getExercise.mockResolvedValue(makeExercise({ id_ejercicio: 12, nombre: 'Alfa' }))
    const harness = await mountExercisesView('/tiro/ejercicios/12')

    click(harness.buttonByText(harness.host, 'Eliminar'))
    await flushRound()

    const cancel = harness.buttonByText(document.body, 'Cancelar')
    expect(cancel, 'botón Cancelar del diálogo de baja').not.toBeNull()
    expect(cancel?.hasAttribute('autofocus')).toBe(true)
    expect(document.activeElement).toBe(cancel)
  })
})
