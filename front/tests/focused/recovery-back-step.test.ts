import { createApp, defineComponent, h, nextTick, type App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RecoveryStepForm from '../../src/components/auth/RecoveryStepForm.vue'
import { useRecovery } from '../../src/composables/auth/useRecovery'
import type { AccessActionResult, RecoveryIdentifyResponse } from '../../src/types/auth'
import { ACCESS_ACTION_RESULT, RECOVERY_STEP } from '../../src/types/auth'

const recoveryApiDoubles = vi.hoisted(() => ({
  recoveryIdentify: vi.fn(),
  recoveryCreateCode: vi.fn(),
  recoveryCheckCode: vi.fn(),
  recoveryChangePassword: vi.fn(),
}))

vi.mock('../../src/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/api/auth')>()
  return {
    ...actual,
    recoveryIdentify: recoveryApiDoubles.recoveryIdentify,
    recoveryCreateCode: recoveryApiDoubles.recoveryCreateCode,
    recoveryCheckCode: recoveryApiDoubles.recoveryCheckCode,
    recoveryChangePassword: recoveryApiDoubles.recoveryChangePassword,
  }
})

const apps: Array<{ app: App; host: HTMLElement }> = []

interface FlowHarness {
  step: number
  busy: boolean
  feedback: unknown
  back(): void
  identify(request: unknown): Promise<unknown>
  createCode(request: unknown): Promise<unknown>
}

function makeFlowHarness(holder: { flow: FlowHarness | null }) {
  return defineComponent({
    name: 'RecoveryFlowHarness',
    setup() {
      const flow = useRecovery()
      holder.flow = flow as unknown as FlowHarness
      return () => h('div')
    },
  })
}

async function mountFlow(): Promise<FlowHarness> {
  const holder: { flow: FlowHarness | null } = { flow: null }
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(makeFlowHarness(holder))
  app.mount(host)
  await nextTick()
  apps.push({ app, host })

  if (!holder.flow) throw new Error('El flujo de recuperación no se montó.')
  return holder.flow
}

async function mountForm(step: number): Promise<HTMLElement> {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({
    render: () => h(RecoveryStepForm, {
      step,
      busy: false,
      feedback: null,
      uncertain: false,
      onBack: () => {
        backEmissions += 1
      },
    }),
  })
  app.mount(host)
  await nextTick()
  apps.push({ app, host })
  return host
}

let backEmissions = 0

function successResponse(): AccessActionResult<RecoveryIdentifyResponse> {
  return {
    kind: ACCESS_ACTION_RESULT.SUCCESS,
    response: { detail: 'ok', correo_censurado: null } as unknown as RecoveryIdentifyResponse,
  }
}

function backControl(host: HTMLElement): HTMLButtonElement | null {
  return [...host.querySelectorAll<HTMLButtonElement>('button')]
    .find((button) => (button.textContent ?? '').trim() === 'Volver al paso anterior') ?? null
}

beforeEach(() => {
  backEmissions = 0
  for (const double of Object.values(recoveryApiDoubles)) double.mockReset()
  recoveryApiDoubles.recoveryIdentify.mockResolvedValue(successResponse())
})

afterEach(() => {
  for (const { app, host } of apps.splice(0)) {
    app.unmount()
    host.remove()
  }
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('Recuperación: paso atrás', () => {
  it('vuelve al paso anterior y descarta la constancia del intento abandonado', async () => {
    const flow = await mountFlow()

    expect(flow.step).toBe(RECOVERY_STEP.IDENTIFY)
    flow.back()
    // En el primer paso no hay a dónde volver: sigue igual.
    expect(flow.step).toBe(RECOVERY_STEP.IDENTIFY)

    await flow.identify({ rut: '11111111-1' })
    expect(flow.step).toBe(RECOVERY_STEP.CREATE_CODE)
    expect(flow.feedback).not.toBeNull()

    flow.back()

    expect(flow.step).toBe(RECOVERY_STEP.IDENTIFY)
    // La constancia del intento anterior no reaparece al volver.
    expect(flow.feedback).toBeNull()
    expect(flow.busy).toBe(false)
  })

  it('el formulario ofrece «Volver al paso anterior» salvo en el primero, y conserva lo escrito', async () => {
    const first = await mountForm(RECOVERY_STEP.IDENTIFY)
    expect(backControl(first)).toBeNull()

    const harness = await mountForm(RECOVERY_STEP.CHECK_CODE)
    const control = backControl(harness)
    expect(control).not.toBeNull()

    // Lo escrito antes de volver sigue en el campo: el borrador no se pierde.
    const code = harness.querySelector<HTMLInputElement>('#code')
    expect(code).not.toBeNull()
    code!.value = 'ABC123'
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(backEmissions).toBe(1)
    expect(harness.querySelector<HTMLInputElement>('#code')?.value).toBe('ABC123')
  })
})
