import { createApp, defineComponent, nextTick, type App } from 'vue'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IdentityView from '../../src/views/identity/IdentityView.vue'
import { routes } from '../../src/router/routes'
import { useSessionStore } from '../../src/stores/session'
import { validateAuthContext } from '../../src/api/dashboard'
import { SESSION_STATUS } from '../../src/types/session'
import type { IdentityUserDTO, PositionDTO } from '../../src/features/identity/api'

const api = vi.hoisted(() => ({
  getUser: vi.fn(), getUserLockStatus: vi.fn(), getMemberships: vi.fn(),
  getPositions: vi.fn(), getPosition: vi.fn(), getPositionHolderHistory: vi.fn(),
  replacePrimaryAssignment: vi.fn(), patchPrimaryAssignment: vi.fn(),
  addSecondaryAssignment: vi.fn(), deactivatePrimaryAssignment: vi.fn(), removeUserAssignment: vi.fn(),
  replacePosition: vi.fn(), patchPosition: vi.fn(), deletePosition: vi.fn(),
  assignPositionHolder: vi.fn(), removePositionHolder: vi.fn(),
  replaceUser: vi.fn(), patchUser: vi.fn(),
}))
vi.mock('../../src/features/identity/api', async (original) => ({
  ...await original<typeof import('../../src/features/identity/api')>(), ...api,
}))
const catalogs = vi.hoisted(() => ({
  getEligibleTargetUnits: vi.fn(), getRoleCategories: vi.fn(), getAuthorizationCatalog: vi.fn(),
}))
vi.mock('../../src/features/authorization/api', async (original) => ({
  ...await original<typeof import('../../src/features/authorization/api')>(), ...catalogs,
}))
vi.mock('../../src/api/shared/domain', async (original) => ({
  ...await original<typeof import('../../src/api/shared/domain')>(),
  getAssignableUnits: vi.fn().mockResolvedValue({ results: [{ id: 3, code: 'unit-test', name: 'Unidad test' }] }),
}))
vi.mock('../../src/features/armory/api', async (original) => ({
  ...await original<typeof import('../../src/features/armory/api')>(), getArmories: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../src/features/organization/api', async (original) => ({
  ...await original<typeof import('../../src/features/organization/api')>(), getRecintos: vi.fn().mockResolvedValue([]),
}))

function context(permissions = ['view_personnel_basic', 'update_users', 'view_unit', 'assign_positions', 'revoke_positions']) {
  return validateAuthContext({
    user: { id_usuario: 701, rut: 'rut-principal-test', must_change_password: false },
    tenant: { code: 'tenant-test', context: 'militar' }, active_organization_unit: 'unit-test',
    unit_membership: null, scopes: [], permissions,
    assignments: [{ role: 'role-test', scope: 'unidad_propia', organization_unit: 'unit-test', is_primary: true }],
  })
}

function user(id = 701): IdentityUserDTO {
  return {
    id_usuario: id, rut: id === 701 ? 'rut-principal-test' : 'rut-other-test', grado: null,
    nombre: 'Ficha privada anterior', apellido_paterno: 'Test', apellido_materno: 'Test', correo: null,
    habilitado: true, is_locked: false, must_change_password: false, password_changed_at: null,
    primary_assignment: { unit_code: 'unit-test', role_code: 'role-test', scope_code: 'unidad_propia' },
    assignments: [{ id: 44, unit_code: 'unit-test', role_code: 'role-test', role_name: 'Rol test', scope_code: 'unidad_propia', is_primary: false }],
  }
}

function position(): PositionDTO {
  return {
    id: 7, tenant: 2, code: 'P-TEST', name: 'Puesto privado anterior', organization_unit: 3,
    organization_unit_code: 'unit-test', organization_unit_name: 'Unidad test', armory: null,
    armory_code: null, role: 5, role_code: 'role-test', role_name: 'Rol test', scope_policy: null,
    scope_code: null, recinto: null, recinto_code: null, recinto_name: null, description: '',
    is_active: true, is_unique_holder: true, current_holders_count: 1, created_at: '', updated_at: '',
  }
}

interface Harness {
  app: App
  pinia: Pinia
  router: Router
  host: HTMLElement
  session: ReturnType<typeof useSessionStore>
}
const harnesses: Harness[] = []
async function flush() {
  for (let i = 0; i < 24; i += 1) { await Promise.resolve(); await nextTick() }
}
async function mount(path = '/personas/701', permissions?: string[]): Promise<Harness> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const stub = defineComponent({ render: () => null })
  const router = createRouter({ history: createMemoryHistory(), routes: routes.map((route) => ({ ...route, component: stub })) })
  await router.push(path)
  await router.isReady()
  const session = useSessionStore(pinia)
  session.$patch({ status: SESSION_STATUS.READY, tenantCode: 'tenant-test', unitCode: 'unit-test',
    identity: { id_usuario: 701, must_change_password: false, source: 'context' }, context: context(permissions) })
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(IdentityView).use(pinia).use(router)
  app.mount(host)
  const harness = { app, pinia, router, host, session }
  harnesses.push(harness)
  await flush()
  return harness
}
async function click(label: string, root: ParentNode = document) {
  const button = [...root.querySelectorAll('button')].find((item) => item.textContent?.trim() === label)
  expect(button, `${label}: ${document.body.textContent}`).toBeDefined()
  expect(button?.disabled, label).toBe(false)
  button?.click()
  await flush()
}
async function select(id: string, value: string) {
  const element = document.getElementById(id) as HTMLSelectElement | null
  expect(element, id).not.toBeNull()
  if (!element) throw new Error(id)
  element.value = value
  element.dispatchEvent(new Event('change', { bubbles: true }))
  await flush()
}
async function submit() {
  const form = document.querySelector('form.identity-editor-form')
  expect(form).not.toBeNull()
  form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flush()
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((settle) => { resolve = settle })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const mock of Object.values(api)) mock.mockReset()
  api.getUser.mockImplementation(async (id: number) => user(id))
  api.getUserLockStatus.mockResolvedValue({ is_locked: false })
  api.getMemberships.mockResolvedValue([{ id: 9, account: 901, rut: 'rut-principal-test', unit: 3, unit_code: 'unit-test', unit_name: 'Unidad test', is_primary: true, is_active: true }])
  api.getPositions.mockResolvedValue([position()])
  api.getPosition.mockResolvedValue(position())
  api.getPositionHolderHistory.mockResolvedValue({ position_code: 'P-TEST', position_name: 'Puesto test', holders: [{ id: 44, account: 901, rut: 'rut-principal-test', nombre: 'Holder privado anterior', is_primary: true, is_active: true }] })
  for (const name of ['replacePrimaryAssignment', 'patchPrimaryAssignment', 'addSecondaryAssignment', 'deactivatePrimaryAssignment', 'removeUserAssignment', 'assignPositionHolder', 'removePositionHolder'] as const) {
    api[name].mockResolvedValue({ detail: 'Respuesta test', assignment_id: 44, desactivadas: 1 })
  }
  api.replacePosition.mockResolvedValue(position())
  api.patchPosition.mockResolvedValue(position())
  api.deletePosition.mockResolvedValue(undefined)
  catalogs.getEligibleTargetUnits.mockResolvedValue({ unidad_personal_code: 'unit-test', results: [{ id: 3, code: 'unit-test', name: 'Unidad test' }] })
  catalogs.getRoleCategories.mockResolvedValue({ categories: [{ code: 'test', label: 'Test', roles: [{ id: 5, code: 'role-test', name: 'Rol test' }] }] })
  catalogs.getAuthorizationCatalog.mockResolvedValue({ roles: [], scopes: [] })
})
afterEach(() => {
  for (const harness of harnesses.splice(0)) { harness.app.unmount(); disposePinia(harness.pinia); harness.host.remove() }
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('identity context reconciliation', () => {
  it.each([
    ['principal PUT', 'replacePrimaryAssignment'], ['principal PATCH', 'patchPrimaryAssignment'],
    ['secundaria', 'addSecondaryAssignment'], ['desactivar', 'deactivatePrimaryAssignment'],
    ['retirar', 'removeUserAssignment'],
  ] as const)('reconcilia %s propia y purga al revocarse acceso, sin repetir escritura', async (operation, method) => {
    const harness = await mount()
    const ensure = vi.spyOn(harness.session, 'ensureContext').mockImplementation(async () => {
      harness.session.$patch({ context: context([]) })
      return { kind: 'success' }
    })
    await click('Asignaciones')
    if (operation.startsWith('principal') || operation === 'secundaria') {
      await click(operation === 'secundaria' ? 'Agregar secundaria' : 'Editar asignación principal')
      await select('identity-assignment-unit-code', 'unit-test')
      await select('identity-assignment-role-code', 'role-test')
      if (operation === 'principal PATCH') await select('identity-assignment-method', 'PATCH')
      await submit()
    } else if (operation === 'desactivar') {
      await click('Desactivar'); await click('Confirmar desactivación')
    } else { await click('Quitar'); await click('Quitar asignación') }
    expect(api[method], document.body.textContent ?? '').toHaveBeenCalledTimes(1)
    expect(ensure).toHaveBeenCalledTimes(1)
    expect(api.getUser).toHaveBeenCalledTimes(1)
    expect(document.body.textContent).not.toContain('Ficha privada anterior')
  })

  it.each([
    ['editar PUT', 'replacePosition'], ['editar PATCH', 'patchPosition'], ['baja', 'deletePosition'],
    ['asignar', 'assignPositionHolder'], ['retirar', 'removePositionHolder'],
  ] as const)('reconcilia puesto/holder %s que afecta acceso propio', async (operation, method) => {
    const harness = await mount('/organizacion/puestos/7')
    const ensure = vi.spyOn(harness.session, 'ensureContext').mockImplementation(async () => {
      harness.session.$patch({ context: context([]) })
      return { kind: 'success' }
    })
    await click('Titulares')
    if (operation.startsWith('editar')) {
      await click('Editar')
      if (operation === 'editar PATCH') {
        await select('identity-position-method', 'PATCH')
        const input = document.getElementById('identity-position-name') as HTMLInputElement
        input.value = 'Puesto cambiado'; input.dispatchEvent(new Event('input', { bubbles: true }))
        await flush()
      }
      await submit()
    } else if (operation === 'baja') { await click('Dar de baja'); await click('Confirmar baja') }
    else if (operation === 'asignar') {
      await click('Asignar titular')
      await select('identity-holder-account-id', '901')
      await submit()
    } else { await click('Quitar'); await click('Quitar titular') }
    expect(api[method]).toHaveBeenCalledTimes(1)
    expect(ensure).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => {
      expect(document.body.textContent).not.toContain('Puesto privado anterior')
      expect(document.body.textContent).not.toContain('Holder privado anterior')
    })
  })

  it('preserva contexto al retirar una asignación de otro usuario', async () => {
    const harness = await mount('/personas/702')
    const before = harness.session.context
    const ensure = vi.spyOn(harness.session, 'ensureContext')
    await click('Asignaciones'); await click('Quitar'); await click('Quitar asignación')
    expect(ensure).not.toHaveBeenCalled()
    expect(harness.session.context).toBe(before)
    expect(api.getUser).toHaveBeenCalledTimes(2)
  })

  it('preserva contexto al retirar holder ajeno acreditado por histórico, no por alias de PK', async () => {
    api.getPositionHolderHistory.mockResolvedValue({ position_code: 'P-TEST', position_name: 'Puesto test', holders: [
      { id: 44, account: 701, rut: 'rut-other-test', nombre: 'Otro holder', is_primary: true, is_active: true },
    ] })
    const harness = await mount('/organizacion/puestos/7')
    const before = harness.session.context
    const ensure = vi.spyOn(harness.session, 'ensureContext')
    await click('Titulares'); await click('Quitar'); await click('Quitar titular')
    expect(ensure).not.toHaveBeenCalled()
    expect(harness.session.context).toBe(before)
    expect(api.getPosition).toHaveBeenCalledTimes(2)
  })

  it('preserva contexto al editar un puesto ocupado sólo por otro principal', async () => {
    api.getPositionHolderHistory.mockResolvedValue({ position_code: 'P-TEST', position_name: 'Puesto test', holders: [
      { id: 44, account: 701, rut: 'rut-other-test', nombre: 'Otro holder', is_primary: true, is_active: true },
    ] })
    const harness = await mount('/organizacion/puestos/7')
    const before = harness.session.context
    const ensure = vi.spyOn(harness.session, 'ensureContext')
    await click('Editar'); await submit()
    expect(api.replacePosition).toHaveBeenCalledTimes(1)
    expect(ensure).not.toHaveBeenCalled()
    expect(harness.session.context).toBe(before)
  })

  it('reconcilia un puesto si el histórico no permite descartar un holder propio', async () => {
    api.getPositionHolderHistory.mockResolvedValue({ position_code: 'P-TEST', position_name: 'Puesto test', holders: [] })
    const harness = await mount('/organizacion/puestos/7')
    const ensure = vi.spyOn(harness.session, 'ensureContext').mockResolvedValue({ kind: 'success' })
    await click('Editar'); await submit()
    expect(api.replacePosition).toHaveBeenCalledTimes(1)
    expect(ensure).toHaveBeenCalledTimes(1)
  })

  it('no encadena lecturas de memberships al completarse un refresco de usuario tras navegar', async () => {
    const harness = await mount('/personas/702')
    const late = deferred<IdentityUserDTO>()
    api.getUser.mockReturnValueOnce(late.promise)
    await click('Asignaciones'); await click('Quitar'); await click('Quitar asignación')
    expect(api.getUser).toHaveBeenCalledTimes(2)
    expect(api.getMemberships).toHaveBeenCalledTimes(1)
    await harness.router.push('/organizacion/puestos')
    await flush()
    late.resolve(user(702))
    await flush()
    expect(api.getMemberships).toHaveBeenCalledTimes(1)
    expect(document.body.textContent).not.toContain('Ficha privada anterior')
    expect(api.removeUserAssignment).toHaveBeenCalledTimes(1)
  })

  it('reconcilia al asignar otro account a puesto único que desplaza al holder propio', async () => {
    api.getMemberships.mockResolvedValue([{ id: 9, account: 701, rut: 'rut-other-test', unit: 3, unit_code: 'unit-test', unit_name: 'Unidad test' }])
    const harness = await mount('/organizacion/puestos/7')
    const ensure = vi.spyOn(harness.session, 'ensureContext').mockResolvedValue({ kind: 'success' })
    await click('Titulares'); await click('Asignar titular')
    await select('identity-holder-account-id', '701'); await submit()
    expect(ensure).toHaveBeenCalledTimes(1)
    expect(api.assignPositionHolder).toHaveBeenCalledTimes(1)
  })

  it('preserva contexto al asignar otro account a puesto no exclusivo', async () => {
    api.getPosition.mockResolvedValue({ ...position(), is_unique_holder: false })
    api.getMemberships.mockResolvedValue([{ id: 9, account: 701, rut: 'rut-other-test', unit: 3, unit_code: 'unit-test', unit_name: 'Unidad test' }])
    const harness = await mount('/organizacion/puestos/7')
    const ensure = vi.spyOn(harness.session, 'ensureContext')
    await click('Titulares'); await click('Asignar titular')
    await select('identity-holder-account-id', '701'); await submit()
    expect(ensure).not.toHaveBeenCalled()
    expect(api.assignPositionHolder).toHaveBeenCalledTimes(1)
  })

  it.each(['navegación', 'principal'] as const)('descarta lectura tardía después de reconciliar y cambiar %s', async (change) => {
    const harness = await mount()
    const late = deferred<IdentityUserDTO>()
    api.getUser.mockReturnValueOnce(late.promise)
    vi.spyOn(harness.session, 'ensureContext').mockResolvedValue({ kind: 'success' })
    await click('Asignaciones'); await click('Desactivar'); await click('Confirmar desactivación')
    expect(api.getUser).toHaveBeenCalledTimes(2)
    if (change === 'navegación') await harness.router.push('/organizacion/puestos')
    else harness.session.$patch({ identity: { id_usuario: 702, must_change_password: false, source: 'context' } })
    await flush()
    late.resolve(user())
    await flush()
    expect(document.body.textContent).not.toContain('Ficha privada anterior')
    expect(api.deactivatePrimaryAssignment).toHaveBeenCalledTimes(1)
  })

  it('bloquea acciones durante contexto incierto y no repite escritura en lectura explícita', async () => {
    const harness = await mount()
    const pending = deferred<Awaited<ReturnType<typeof harness.session.ensureContext>>>()
    const ensure = vi.spyOn(harness.session, 'ensureContext').mockReturnValueOnce(pending.promise)
    await click('Asignaciones'); await click('Desactivar'); await click('Confirmar desactivación')
    expect(document.body.textContent).not.toContain('Ficha privada anterior')
    await click('Reconciliar lectura')
    expect(api.getUser).toHaveBeenCalledTimes(1)
    await click('Reconciliar contexto')
    expect(ensure).toHaveBeenCalledTimes(1)
    pending.resolve({ kind: 'blocked' })
    await flush()
    ensure.mockResolvedValue({ kind: 'success' })
    await click('Reconciliar contexto')
    expect(api.deactivatePrimaryAssignment).toHaveBeenCalledTimes(1)
  })

  it('no repite una escritura de resultado incierto al leer el recurso explícitamente', async () => {
    const harness = await mount()
    api.deactivatePrimaryAssignment.mockRejectedValueOnce(new Error('Respuesta interrumpida test'))
    const ensure = vi.spyOn(harness.session, 'ensureContext').mockResolvedValue({ kind: 'success' })
    await click('Asignaciones'); await click('Desactivar'); await click('Confirmar desactivación')
    expect(document.body.textContent).toContain('el servidor pudo haberla aplicado')
    expect(ensure).not.toHaveBeenCalled()
    const confirm = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Confirmar desactivación')
    expect(confirm?.disabled).toBe(true)
    confirm?.click()
    await flush()
    expect(api.deactivatePrimaryAssignment).toHaveBeenCalledTimes(1)
    await click('Reconciliar lectura')
    expect(api.deactivatePrimaryAssignment).toHaveBeenCalledTimes(1)
  })

  it('distingue «no consultadas» de «sin membresías» cuando falta el permiso de lectura', async () => {
    await mount('/personas/701', ['view_personnel_basic', 'update_users'])
    await click('Credenciales y membresías')
    expect(document.body.textContent).toContain('Las membresías no se consultaron en este contexto.')
    expect(document.body.textContent).not.toContain('no tiene membresías en la lectura disponible')
    expect(api.getMemberships).not.toHaveBeenCalled()
    await click('Leer membresías')
    expect(api.getMemberships).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('no tiene permiso para ver las membresías')
  })

  it('anuncia los errores de campo tras un 400 del servidor', async () => {
    api.replaceUser.mockRejectedValueOnce({ status: 400, payload: { errors: { rut: ['Formato inválido'] } } })
    await mount()
    await click('Editar')
    const rutInput = document.getElementById('identity-user-rut') as HTMLInputElement
    rutInput.value = '12345678-9'
    rutInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flush()
    await submit()
    const input = document.getElementById('identity-user-rut') as HTMLInputElement
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('identity-feedback-rut')
    expect(document.getElementById('identity-feedback-rut')?.textContent).toContain('Formato inválido')
    expect(api.replaceUser).toHaveBeenCalledTimes(1)
  })
})
