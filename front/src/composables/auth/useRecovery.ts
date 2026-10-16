import { onUnmounted, reactive } from 'vue'
import {
  recoveryChangePassword,
  recoveryCheckCode,
  recoveryCreateCode,
  recoveryIdentify,
  getAccessErrorMessages,
} from '../../api/auth'
import {
  ACCESS_ACTION_BLOCK_REASON,
  ACCESS_ACTION_RESULT,
  ACCESS_OPERATION_ERROR_KIND,
  RECOVERY_STEP,
} from '../../types/auth'
import type {
  AccessActionResult,
  AccessOperationError,
  RecoveryChangeRequest,
  RecoveryChangeResponse,
  RecoveryCheckRequest,
  RecoveryCheckResponse,
  RecoveryCreateRequest,
  RecoveryCreateResponse,
  RecoveryIdentifyRequest,
  RecoveryIdentifyResponse,
  RecoveryStep,
} from '../../types/auth'
import { ACCESS_FEEDBACK_TONE, RECOVERY_UNCERTAIN_OPERATION } from '../../types/access-ui'
import type {
  AccessFeedback,
  RecoveryFlowContract,
  RecoveryFlowState,
  RecoveryUncertainOperation,
} from '../../types/access-ui'

const GENERIC_RECOVERY_FEEDBACK = 'Si el RUT está registrado, recibirás instrucciones.'

let recoverySuccessFeedback: AccessFeedback | null = null

export function consumeRecoverySuccessFeedback(): AccessFeedback | null {
  const feedback = recoverySuccessFeedback
  recoverySuccessFeedback = null
  return feedback
}

interface RecoveryRequestSecrets {
  rut?: string
  correo?: string
  codigo?: string
  nueva_contrasena?: string
}

function clearRequestSecrets(request: RecoveryRequestSecrets): void {
  request.rut = ''
  request.correo = ''
  request.codigo = ''
  request.nueva_contrasena = ''
}

function messagesFor(error: AccessOperationError): string[] {
  const messages = getAccessErrorMessages(error)
  if (messages.length > 0) return messages
  return error.detail ? [error.detail] : []
}

function retryDeadline(retryAfter: string | null): number | null {
  if (!retryAfter) return null

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) return Date.now() + seconds * 1000

  const timestamp = Date.parse(retryAfter)
  return Number.isFinite(timestamp) && timestamp > Date.now() ? timestamp : null
}

function withWaitMessage(message: string, seconds: number): string {
  const waitMessage = `Espera ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'} antes de volver a enviar.`
  return message ? `${message}\n${waitMessage}` : waitMessage
}

export function useRecovery(): RecoveryFlowContract {
  const state = reactive<RecoveryFlowState>({
    step: RECOVERY_STEP.IDENTIFY,
    attempt: 0,
    busy: false,
    feedback: null,
    uncertain: null,
  })

  let mounted = true
  let activeController: AbortController | null = null
  let retryTimer: ReturnType<typeof setInterval> | null = null
  let retryDeadlineAt: number | null = null

  function clearRetryTimer(): void {
    if (retryTimer !== null) clearInterval(retryTimer)
    retryTimer = null
    retryDeadlineAt = null
  }

  function abortActiveRequest(): void {
    const controller = activeController
    activeController = null
    controller?.abort()
  }

  function isCurrent(attempt: number, step: RecoveryStep, controller: AbortController): boolean {
    return (
      mounted &&
      state.attempt === attempt &&
      state.step === step &&
      activeController === controller &&
      !controller.signal.aborted
    )
  }

  function resetState(): void {
    state.attempt += 1
    abortActiveRequest()
    clearRetryTimer()
    state.step = RECOVERY_STEP.IDENTIFY
    state.busy = false
    state.feedback = null
    state.uncertain = null
  }

  // Paso anterior del flujo: navegación del usuario, no un resultado de
  // request. Conserva los borradores (viven en el formulario, que no se
  // remonta) y descarta la constancia del intento que se abandona.
  function back(): void {
    if (state.step === RECOVERY_STEP.IDENTIFY) return
    if (state.busy) return

    state.attempt += 1
    abortActiveRequest()
    clearRetryTimer()
    state.step = (state.step - 1) as RecoveryStep
    state.busy = false
    state.feedback = null
    state.uncertain = null
  }

  function advance(step: RecoveryStep, feedback: AccessFeedback | null): void {
    state.attempt += 1
    abortActiveRequest()
    clearRetryTimer()
    state.step = step
    state.busy = false
    state.feedback = feedback
    state.uncertain = null
  }

  function startRetryWait(
    error: AccessOperationError,
    attempt: number,
    step: RecoveryStep,
    baseMessage: string,
  ): void {
    const deadline = retryDeadline(error.retryAfter)
    if (deadline === null) return

    clearRetryTimer()
    retryDeadlineAt = deadline
    state.busy = true

    const updateWait = (): void => {
      if (!mounted || state.attempt !== attempt || state.step !== step || retryDeadlineAt === null) {
        clearRetryTimer()
        return
      }

      const remaining = Math.max(0, Math.ceil((retryDeadlineAt - Date.now()) / 1000))
      if (remaining === 0) {
        clearRetryTimer()
        state.busy = false
        state.feedback = {
          message: baseMessage || 'La espera terminó. Puedes volver a enviar manualmente.',
          tone: ACCESS_FEEDBACK_TONE.WARNING,
        }
        return
      }

      state.feedback = {
        message: withWaitMessage(baseMessage, remaining),
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
    }

    updateWait()
    retryTimer = setInterval(updateWait, 1000)
  }

  function showFailure(
    error: AccessOperationError,
    attempt: number,
    step: RecoveryStep,
    mutation: RecoveryUncertainOperation | null,
    explicitlyUncertain: boolean,
  ): void {
    const messages = messagesFor(error)
    const message = messages.join('\n')
    const isMutationUncertain =
      mutation !== null &&
      (explicitlyUncertain ||
        error.kind === ACCESS_OPERATION_ERROR_KIND.NETWORK ||
        error.kind === ACCESS_OPERATION_ERROR_KIND.TIMEOUT ||
        error.kind === ACCESS_OPERATION_ERROR_KIND.ABORTED)

    if (isMutationUncertain && mutation !== null) {
      state.uncertain = { operation: mutation, attempt }
      state.feedback = {
        message: message
          ? `${message}\nNo se pudo confirmar el resultado. No se repetirá automáticamente.`
          : 'No se pudo confirmar el resultado. No se repetirá automáticamente.',
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
      return
    }

    if (error.status === 429) {
      const feedbackMessage =
        message || 'El servicio solicitó esperar antes de volver a enviar la solicitud.'
      state.feedback = { message: feedbackMessage, tone: ACCESS_FEEDBACK_TONE.WARNING }
      startRetryWait(error, attempt, step, feedbackMessage)
      return
    }

    if (message) {
      state.feedback = { message, tone: ACCESS_FEEDBACK_TONE.DANGER }
      return
    }

    if (
      error.kind === ACCESS_OPERATION_ERROR_KIND.NETWORK ||
      error.kind === ACCESS_OPERATION_ERROR_KIND.TIMEOUT ||
      error.kind === ACCESS_OPERATION_ERROR_KIND.ABORTED
    ) {
      state.feedback = {
        message: 'No se pudo completar la solicitud. El paso no avanzó.',
        tone: ACCESS_FEEDBACK_TONE.DANGER,
      }
    }
  }

  async function runRequest<TResponse>(
    expectedStep: RecoveryStep,
    request: RecoveryRequestSecrets,
    operation: (signal: AbortSignal) => Promise<AccessActionResult<TResponse>>,
    onSuccess: (response: TResponse) => void,
    mutation: RecoveryUncertainOperation | null = null,
  ): Promise<AccessActionResult<TResponse>> {
    if (!mounted || state.step !== expectedStep) {
      return { kind: ACCESS_ACTION_RESULT.BLOCKED, reason: ACCESS_ACTION_BLOCK_REASON.INVALID_STATE }
    }
    if (state.busy) {
      return { kind: ACCESS_ACTION_RESULT.BLOCKED, reason: ACCESS_ACTION_BLOCK_REASON.BUSY }
    }
    if (state.uncertain !== null) {
      return { kind: ACCESS_ACTION_RESULT.BLOCKED, reason: ACCESS_ACTION_BLOCK_REASON.INVALID_STATE }
    }

    clearRetryTimer()
    state.feedback = null
    state.busy = true

    const attempt = state.attempt
    const controller = new AbortController()
    activeController = controller

    try {
      const result = await operation(controller.signal)
      if (!isCurrent(attempt, expectedStep, controller)) return result

      if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
        onSuccess(result.response)
      } else if (
        result.kind === ACCESS_ACTION_RESULT.REJECTED ||
        result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
      ) {
        showFailure(
          result.error,
          attempt,
          expectedStep,
          mutation,
          result.kind === ACCESS_ACTION_RESULT.UNCERTAIN,
        )
      } else if (result.kind === ACCESS_ACTION_RESULT.BLOCKED) {
        state.feedback = {
          message: 'La solicitud no se envió porque el estado actual la bloquea.',
          tone: ACCESS_FEEDBACK_TONE.DANGER,
        }
      }

      return result
    } catch (error: unknown) {
      if (isCurrent(attempt, expectedStep, controller)) {
        const uncertainMutation =
          mutation !== null &&
          (mutation === RECOVERY_UNCERTAIN_OPERATION.CREATE_CODE ||
            mutation === RECOVERY_UNCERTAIN_OPERATION.CHANGE_PASSWORD)
        state.uncertain = uncertainMutation ? { operation: mutation, attempt } : null
        state.feedback = {
          message: uncertainMutation
            ? 'No se pudo confirmar el resultado. No se repetirá automáticamente.'
            : 'No se pudo completar la solicitud. El paso no avanzó.',
          tone: ACCESS_FEEDBACK_TONE.WARNING,
        }
      }
      throw error
    } finally {
      clearRequestSecrets(request)
      if (isCurrent(attempt, expectedStep, controller)) {
        activeController = null
        if (retryDeadlineAt === null) state.busy = false
      }
    }
  }

  function identify(request: RecoveryIdentifyRequest): Promise<AccessActionResult<RecoveryIdentifyResponse>> {
    return runRequest(
      RECOVERY_STEP.IDENTIFY,
      request,
      (signal) => recoveryIdentify(request, signal),
      (response) => {
        const maskedEmail = response.correo_censurado ? `\n${response.correo_censurado}` : ''
        advance(RECOVERY_STEP.CREATE_CODE, {
          message: `${GENERIC_RECOVERY_FEEDBACK}${maskedEmail}`,
          tone: ACCESS_FEEDBACK_TONE.INFO,
        })
      },
    )
  }

  function createCode(request: RecoveryCreateRequest): Promise<AccessActionResult<RecoveryCreateResponse>> {
    return runRequest(
      RECOVERY_STEP.CREATE_CODE,
      request,
      (signal) => recoveryCreateCode(request, signal),
      () => {
        advance(RECOVERY_STEP.CHECK_CODE, {
          message: GENERIC_RECOVERY_FEEDBACK,
          tone: ACCESS_FEEDBACK_TONE.INFO,
        })
      },
      RECOVERY_UNCERTAIN_OPERATION.CREATE_CODE,
    )
  }

  function checkCode(request: RecoveryCheckRequest): Promise<AccessActionResult<RecoveryCheckResponse>> {
    return runRequest(
      RECOVERY_STEP.CHECK_CODE,
      request,
      (signal) => recoveryCheckCode(request, signal),
      (response) => {
        advance(RECOVERY_STEP.CHANGE_PASSWORD, {
          message: response.mensaje,
          tone: ACCESS_FEEDBACK_TONE.INFO,
        })
      },
    )
  }

  function changePassword(request: RecoveryChangeRequest): Promise<AccessActionResult<RecoveryChangeResponse>> {
    return runRequest(
      RECOVERY_STEP.CHANGE_PASSWORD,
      request,
      (signal) => recoveryChangePassword(request, signal),
      (response) => {
        recoverySuccessFeedback = {
          message: response.mensaje,
          tone: ACCESS_FEEDBACK_TONE.SUCCESS,
        }
        advance(RECOVERY_STEP.IDENTIFY, {
          message: response.mensaje,
          tone: ACCESS_FEEDBACK_TONE.SUCCESS,
        })
      },
      RECOVERY_UNCERTAIN_OPERATION.CHANGE_PASSWORD,
    )
  }

  const contract: RecoveryFlowContract = {
    get step() {
      return state.step
    },
    get attempt() {
      return state.attempt
    },
    get busy() {
      return state.busy
    },
    get feedback() {
      return state.feedback
    },
    get uncertain() {
      return state.uncertain
    },
    identify,
    createCode,
    checkCode,
    changePassword,
    back,
    restart: resetState,
    cancel: resetState,
  }

  onUnmounted(() => {
    mounted = false
    resetState()
  })

  return contract
}
