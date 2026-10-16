<script setup lang="ts">
import { computed, onUnmounted, shallowRef, toRaw } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import AuthCard from '../../components/ds/AuthCard.vue'
import LoginForm from '../../components/auth/LoginForm.vue'
import { consumeRecoverySuccessFeedback } from '../../composables/auth/useRecovery'
import { consumeAccountPasswordChangeNotice } from '../../features/account/useOwnAccount'
import { useSessionStore } from '../../stores/session'
import { getAccessErrorMessages } from '../../api/auth'
import { ACCESS_ACTION_RESULT, ACCESS_OPERATION_ERROR_KIND } from '../../types/auth'
import type { AccessOperationError, LoginRequest, LoginResponse } from '../../types/auth'
import { ACCESS_FEEDBACK_TONE } from '../../types/access-ui'
import type { AccessFeedback } from '../../types/access-ui'
import { SESSION_IDENTITY_SOURCE, SESSION_OPERATION, SESSION_STATUS } from '../../types/session'
import { ROUTE_NAMES } from '../../router/routes'

const router = useRouter()
const session = useSessionStore()
const { busy: sessionBusy, logoutBusy } = storeToRefs(session)

const tenantCode = shallowRef('')
const feedback = shallowRef<AccessFeedback | null>(
  consumeRecoverySuccessFeedback() ?? consumeAccountPasswordChangeNotice(),
)
const submitting = shallowRef(false)
const retrySeconds = shallowRef(0)
const busy = computed(() => sessionBusy.value.login || logoutBusy.value || submitting.value || retrySeconds.value > 0)

let mounted = true
let attempt = 0
let activeCredentials: LoginRequest | null = null
let activeController: AbortController | null = null
let retryTimer: ReturnType<typeof setInterval> | null = null
let retryDeadlineAt: number | null = null

function clearCredentials(credentials: LoginRequest): void {
  credentials.rut = ''
  credentials.password = ''
}

function clearRetryWait(): void {
  if (retryTimer !== null) clearInterval(retryTimer)
  retryTimer = null
  retryDeadlineAt = null
  retrySeconds.value = 0
}

function deadlineFromRetryAfter(value: string | null): number | null {
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds > 0) return Date.now() + seconds * 1000
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > Date.now() ? timestamp : null
}

function messagesFor(error: AccessOperationError): string[] {
  const messages = getAccessErrorMessages(error)
  if (messages.length > 0) return messages
  return error.detail ? [error.detail] : []
}

function httpFailureMessage(error: AccessOperationError): string {
  if (error.kind === ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE) {
    return 'La respuesta del servidor no tuvo el formato esperado. No se completó el inicio de sesión.'
  }
  if (error.kind === ACCESS_OPERATION_ERROR_KIND.CONFIGURATION) {
    return 'No se pudo preparar la solicitud de inicio de sesión. El formulario permanece disponible.'
  }
  if (error.status !== null && error.status >= 500) {
    return `El servidor respondió con un error (código ${error.status}). No se completó el inicio de sesión.`
  }
  if (error.status !== null) {
    return `No se completó el inicio de sesión (código ${error.status}). El formulario permanece disponible.`
  }
  return 'No se completó el inicio de sesión. El formulario permanece disponible.'
}

function setFailure(
  error: AccessOperationError,
  currentAttempt: number,
  fallbackMessage?: string,
): void {
  const messages = messagesFor(error)
  const baseMessage = messages.join('\n')

  if (error.status === 429) {
    const message = baseMessage || 'El servicio solicitó esperar antes de volver a enviar la solicitud.'
    feedback.value = { message, tone: ACCESS_FEEDBACK_TONE.WARNING }
    const deadline = deadlineFromRetryAfter(error.retryAfter)
    if (deadline === null) return

    clearRetryWait()
    retryDeadlineAt = deadline
    const updateWait = (): void => {
      if (!mounted || attempt !== currentAttempt || retryDeadlineAt === null) {
        clearRetryWait()
        return
      }
      const remaining = Math.max(0, Math.ceil((retryDeadlineAt - Date.now()) / 1000))
      retrySeconds.value = remaining
      if (remaining === 0) {
        clearRetryWait()
        feedback.value = {
          message: baseMessage || 'La espera terminó. Puedes volver a enviar manualmente.',
          tone: ACCESS_FEEDBACK_TONE.WARNING,
        }
        return
      }
      // El anuncio del 429 se hace UNA vez: el conteo vive fuera de la región
      // viva (`aria-hidden`), así no se re-anuncia cada segundo.
      const waitMessage = 'La espera termina sola; vuelve a intentar cuando se habilite el botón.'
      feedback.value = {
        message: baseMessage ? `${baseMessage}\n${waitMessage}` : waitMessage,
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
    }
    updateWait()
    retryTimer = setInterval(updateWait, 1000)
    return
  }

  if (baseMessage) {
    feedback.value = { message: baseMessage, tone: ACCESS_FEEDBACK_TONE.DANGER }
    return
  }

  if (fallbackMessage) {
    feedback.value = { message: fallbackMessage, tone: ACCESS_FEEDBACK_TONE.DANGER }
    return
  }

  if (
    error.kind === ACCESS_OPERATION_ERROR_KIND.NETWORK ||
    error.kind === ACCESS_OPERATION_ERROR_KIND.TIMEOUT ||
    error.kind === ACCESS_OPERATION_ERROR_KIND.ABORTED
  ) {
    feedback.value = {
      message: 'No se pudo completar el inicio de sesión. El formulario permanece disponible.',
      tone: ACCESS_FEEDBACK_TONE.DANGER,
    }
    return
  }

  if (
    error.kind === ACCESS_OPERATION_ERROR_KIND.HTTP ||
    error.kind === ACCESS_OPERATION_ERROR_KIND.INVALID_RESPONSE ||
    error.kind === ACCESS_OPERATION_ERROR_KIND.CONFIGURATION
  ) {
    feedback.value = {
      message: httpFailureMessage(error),
      tone: ACCESS_FEEDBACK_TONE.DANGER,
    }
  }
}

function isAttemptCurrent(currentAttempt: number, controller: AbortController): boolean {
  return mounted
    && attempt === currentAttempt
    && activeController === controller
    && !controller.signal.aborted
    && !session.logoutBusy
}

function isLoginIdentityCurrent(
  response: LoginResponse,
  expectedTenantCode: string,
): boolean {
  const identity = session.identity
  return session.tenantCode.trim() === expectedTenantCode
    && session.context === null
    && session.status === (
      response.must_change_password ? SESSION_STATUS.READY : SESSION_STATUS.BOOTING
    )
    && identity?.source === SESSION_IDENTITY_SOURCE.LOGIN
    && identity.id_usuario === response.id_usuario
    && identity.must_change_password === response.must_change_password
}

function contextUnitCode(context: NonNullable<typeof session.context>): string {
  return context.active_organization_unit?.trim()
    || context.unit_membership?.unit_code.trim()
    || ''
}

function isContextCurrent(
  context: NonNullable<typeof session.context>,
  expectedTenantCode: string,
  expectedUserId: number,
): boolean {
  const identity = session.identity
  return session.status === SESSION_STATUS.READY
    && toRaw(session.context) === context
    && session.tenantCode.trim() === expectedTenantCode
    && context.tenant.code?.trim() === expectedTenantCode
    && context.user.id_usuario === expectedUserId
    && identity?.source === SESSION_IDENTITY_SOURCE.CONTEXT
    && identity.id_usuario === expectedUserId
    && identity.must_change_password === context.user.must_change_password
    && session.unitCode.trim() === contextUnitCode(context)
}

async function navigateTo(
  routeName: (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES],
  currentAttempt: number,
  controller: AbortController,
): Promise<void> {
  if (!isAttemptCurrent(currentAttempt, controller)) return

  // La URL porta el tenant: los destinos de sesión (dashboard y
  // consolidación de contexto) aterrizan con ?tenant= para que una recarga
  // completa reencuentre la institución. Los destinos públicos
  // (password-required, contexto-perdido) nunca lo llevan.
  const landingTenant = session.tenantCode.trim()
  const carriesTenant = landingTenant !== ''
    && (routeName === ROUTE_NAMES.DASHBOARD || routeName === ROUTE_NAMES.CONTEXT)
  const destination = carriesTenant
    ? { name: routeName, query: { tenant: landingTenant } }
    : { name: routeName }

  try {
    await router.replace(destination)
  } catch (error: unknown) {
    if (!isAttemptCurrent(currentAttempt, controller)) return
    const wasAborted = error instanceof Error && error.name === 'AbortError'
    feedback.value = {
      message: wasAborted
        ? 'La navegación después del acceso se canceló.'
        : 'El acceso se inició, pero no se pudo abrir la siguiente pantalla.',
      tone: ACCESS_FEEDBACK_TONE.WARNING,
    }
  }
}

async function submit(credentials: LoginRequest): Promise<void> {
  if (busy.value) {
    clearCredentials(credentials)
    return
  }

  clearRetryWait()
  const currentAttempt = ++attempt
  activeCredentials = credentials
  const controller = new AbortController()
  activeController = controller
  submitting.value = true
  feedback.value = null
  const expectedTenantCode = tenantCode.value.trim()
  let confirmingContext = false

  try {
    const loginPromise = session.login(credentials, tenantCode.value, controller.signal)
    const loginGeneration = session.generation
    const result = await loginPromise
    if (!isAttemptCurrent(currentAttempt, controller)) return

    if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
      if (
        session.generation !== loginGeneration
        || !isLoginIdentityCurrent(result.response, expectedTenantCode)
      ) return

      if (result.response.must_change_password) {
        if (session.status !== SESSION_STATUS.READY || session.context !== null) return
        await navigateTo(ROUTE_NAMES.PASSWORD_REQUIRED, currentAttempt, controller)
        return
      }

      const contextGeneration = session.generation
      confirmingContext = true
      const contextResult = await session.ensureContext()
      if (!isAttemptCurrent(currentAttempt, controller)) return

      if (contextResult.kind === ACCESS_ACTION_RESULT.SUCCESS) {
        const context = contextResult.response
        const unitCode = contextUnitCode(context)
        const expectedContextGeneration = contextGeneration
          + (unitCode || context.user.must_change_password ? 1 : 0)
        if (
          session.generation !== expectedContextGeneration
          || !isContextCurrent(context, expectedTenantCode, result.response.id_usuario)
        ) return

        if (context.user.must_change_password) {
          await navigateTo(ROUTE_NAMES.PASSWORD_REQUIRED, currentAttempt, controller)
        } else if (unitCode) {
          await navigateTo(ROUTE_NAMES.DASHBOARD, currentAttempt, controller)
        } else {
          await navigateTo(ROUTE_NAMES.CONTEXT, currentAttempt, controller)
        }
        return
      }

      if (
        contextResult.kind === ACCESS_ACTION_RESULT.REJECTED
        || contextResult.kind === ACCESS_ACTION_RESULT.UNCERTAIN
      ) {
        if (
          session.status === SESSION_STATUS.CONTEXT_LOST
          && session.generation === contextGeneration + 1
        ) {
          await navigateTo(ROUTE_NAMES.CONTEXT_LOST, currentAttempt, controller)
          return
        }

        if (
          session.status === SESSION_STATUS.FAILURE
          && session.failure?.operation === SESSION_OPERATION.CONTEXT
          && session.failure.kind === ACCESS_OPERATION_ERROR_KIND.IDENTITY_MISMATCH
        ) return

        const currentContextFailure = (
          session.status === SESSION_STATUS.ANONYMOUS
          && (contextResult.error.status === 401 || contextResult.error.status === 403)
          && session.generation === contextGeneration + 1
        ) || (
          session.status === SESSION_STATUS.FAILURE
          && session.failure?.operation === SESSION_OPERATION.CONTEXT
          && session.generation === contextGeneration
        )
        if (!currentContextFailure) return

        setFailure(
          contextResult.error,
          currentAttempt,
          'No se pudo confirmar el contexto. El acceso permanece bloqueado.',
        )
      }
      return
    }

    if (
      result.kind === ACCESS_ACTION_RESULT.REJECTED ||
      result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
    ) {
      setFailure(result.error, currentAttempt)
    } else if (result.kind === ACCESS_ACTION_RESULT.BLOCKED) {
      if (session.generation !== loginGeneration) return
      feedback.value = {
        message: 'El inicio de sesión no se envió porque la acción está bloqueada.',
        tone: ACCESS_FEEDBACK_TONE.DANGER,
      }
    }
  } catch (error: unknown) {
    if (isAttemptCurrent(currentAttempt, controller)) {
      const wasAborted = error instanceof Error && error.name === 'AbortError'
      feedback.value = {
        message: wasAborted
          ? 'El inicio de sesión se canceló. El formulario permanece disponible.'
          : confirmingContext
            ? 'No se pudo confirmar el contexto. El acceso permanece bloqueado.'
            : 'No se pudo completar el inicio de sesión. El formulario permanece disponible.',
        tone: ACCESS_FEEDBACK_TONE.DANGER,
      }
    }
  } finally {
    clearCredentials(credentials)
    if (activeCredentials === credentials) activeCredentials = null
    if (activeController === controller) activeController = null
    if (mounted && attempt === currentAttempt) submitting.value = false
  }
}

function cancelActiveAttempt(): void {
  attempt += 1
  const controller = activeController
  activeController = null
  if (activeCredentials !== null) clearCredentials(activeCredentials)
  activeCredentials = null
  submitting.value = false
  clearRetryWait()
  if (controller && !controller.signal.aborted) controller.abort()
}

function openRecovery(): void {
  if (busy.value) return
  void router.push('/recuperar')
}

onBeforeRouteLeave(cancelActiveAttempt)

onUnmounted(() => {
  mounted = false
  cancelActiveAttempt()
  tenantCode.value = ''
})
</script>

<template>
  <main class="account-pages py-5">
    <div class="container auth-container">
      <div class="row justify-content-center auth-row">
        <div class="col-md-6 col-lg-5 auth-column">
          <AuthCard title="Iniciar sesión" description="Ingresa tus credenciales y la institución para continuar.">
            <LoginForm
              :tenant-code="tenantCode"
              :busy="busy"
              :feedback="feedback"
              @update:tenant-code="tenantCode = $event"
              @submit="submit"
              @open-recovery="openRecovery"
            />
            <p v-if="retrySeconds > 0" class="muted" aria-hidden="true">
              Podrás reintentar en {{ retrySeconds }} s
            </p>
          </AuthCard>
        </div>
      </div>
    </div>
  </main>
</template>
