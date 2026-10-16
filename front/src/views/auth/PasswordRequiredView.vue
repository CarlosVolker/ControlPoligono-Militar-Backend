<script setup lang="ts">
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '../../components/ds/AuthCard.vue'
import PasswordRequiredForm from '../../components/auth/PasswordRequiredForm.vue'
import { getAccessErrorMessages } from '../../api/auth'
import { useSessionStore } from '../../stores/session'
import { ACCESS_ACTION_RESULT, ACCESS_OPERATION_ERROR_KIND } from '../../types/auth'
import type { AccessOperationError, ChangeRequiredPasswordRequest } from '../../types/auth'
import { ROUTE_NAMES } from '../../router/routes'
import { SESSION_IDENTITY_SOURCE, SESSION_STATUS } from '../../types/session'
import { ACCESS_FEEDBACK_TONE } from '../../types/access-ui'
import type { AccessFeedback, AccessFeedbackTone } from '../../types/access-ui'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const { busy: sessionBusy, logoutBusy, identity, uncertainMutation, status } = storeToRefs(session)

const feedback = shallowRef<AccessFeedback | null>(null)
const submitting = shallowRef(false)
const checkingContext = shallowRef(false)
const passwordChangeConfirmed = shallowRef(false)
const passwordChangeUncertain = shallowRef(false)
const contextConfirmationFailed = shallowRef(false)
const identityMismatch = shallowRef(false)
const retrySeconds = shallowRef(0)

const hasUsableForcedIdentity = computed(() => {
  const currentIdentity = identity.value
  return currentIdentity !== null
    && Number.isSafeInteger(currentIdentity.id_usuario)
    && currentIdentity.id_usuario > 0
    && currentIdentity.must_change_password
    && session.tenantCode.trim() !== ''
    && status.value !== SESSION_STATUS.ANONYMOUS
    && status.value !== SESSION_STATUS.CONTEXT_LOST
    && session.failure?.kind !== ACCESS_OPERATION_ERROR_KIND.IDENTITY_MISMATCH
})
const busy = computed(
  () =>
    submitting.value ||
    checkingContext.value ||
    sessionBusy.value.changeRequiredPassword ||
    sessionBusy.value.context ||
    logoutBusy.value ||
    retrySeconds.value > 0,
)
const blocked = computed(
  () =>
    !hasUsableForcedIdentity.value ||
    status.value === SESSION_STATUS.ANONYMOUS ||
    status.value === SESSION_STATUS.FAILURE ||
    status.value === SESSION_STATUS.CONTEXT_LOST ||
    logoutBusy.value ||
    passwordChangeConfirmed.value ||
    passwordChangeUncertain.value ||
    contextConfirmationFailed.value ||
    identityMismatch.value ||
    uncertainMutation.value?.operation === 'change-required-password',
)
const canRetryContext = computed(
  () =>
    hasUsableForcedIdentity.value && (
      passwordChangeConfirmed.value ||
      passwordChangeUncertain.value ||
      (contextConfirmationFailed.value && !identityMismatch.value)
    ),
)

let mounted = true
let attempt = 0
let activeRequest: ChangeRequiredPasswordRequest | null = null
let expectedIdentityId: number | null = null
let expectedTenantCode = ''
let authExitAttempt: number | null = null
let retryTimer: ReturnType<typeof setInterval> | null = null
let retryDeadlineAt: number | null = null

function isCurrent(currentAttempt: number): boolean {
  return mounted
    && attempt === currentAttempt
    && route.name === ROUTE_NAMES.PASSWORD_REQUIRED
}

function clearPasswordRequest(request: ChangeRequiredPasswordRequest): void {
  request.new_password = ''
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

function setFailure(error: AccessOperationError, currentAttempt: number): void {
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
      if (!isCurrent(currentAttempt) || retryDeadlineAt === null) {
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

  if (
    error.kind === ACCESS_OPERATION_ERROR_KIND.NETWORK ||
    error.kind === ACCESS_OPERATION_ERROR_KIND.TIMEOUT ||
    error.kind === ACCESS_OPERATION_ERROR_KIND.ABORTED
  ) {
    feedback.value = {
      message: 'No se pudo confirmar el cambio. El acceso sigue bloqueado.',
      tone: ACCESS_FEEDBACK_TONE.WARNING,
    }
  }
}

function showContextFailure(
  message: string,
  tone: AccessFeedbackTone = ACCESS_FEEDBACK_TONE.DANGER,
): void {
  contextConfirmationFailed.value = true
  feedback.value = { message, tone }
}

function navigateToLoginAfterPurge(currentAttempt: number): void {
  if (
    !isCurrent(currentAttempt) ||
    logoutBusy.value ||
    authExitAttempt === currentAttempt
  ) return

  authExitAttempt = currentAttempt
  void router.replace({ name: ROUTE_NAMES.LOGIN }).catch(() => {
    if (isCurrent(currentAttempt) && feedback.value === null) {
      showContextFailure('La sesión se purgó, pero no se pudo abrir el inicio de sesión.', ACCESS_FEEDBACK_TONE.WARNING)
    }
  })
}

watch(
  [status, identity],
  () => {
    if (
      status.value !== SESSION_STATUS.ANONYMOUS &&
      !(status.value === SESSION_STATUS.FAILURE && identity.value === null)
    ) return
    navigateToLoginAfterPurge(attempt)
  },
  { flush: 'sync' },
)

async function reconcileContext(currentAttempt: number): Promise<void> {
  if (!isCurrent(currentAttempt)) return

  checkingContext.value = true
  clearRetryWait()
  try {
    const result = await session.ensureContext()
    if (!isCurrent(currentAttempt)) return

    if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
      const context = session.context
      const currentIdentity = identity.value
      if (status.value !== SESSION_STATUS.READY || context === null || currentIdentity === null) {
        showContextFailure('No se pudo confirmar el contexto vigente. El acceso sigue bloqueado.')
        return
      }

      if (
        expectedIdentityId === null ||
        expectedTenantCode === '' ||
        currentIdentity.source !== SESSION_IDENTITY_SOURCE.CONTEXT ||
        currentIdentity.id_usuario !== expectedIdentityId ||
        context.user.id_usuario !== expectedIdentityId ||
        session.tenantCode.trim() !== expectedTenantCode ||
        context.tenant.code?.trim() !== expectedTenantCode ||
        currentIdentity.must_change_password !== context.user.must_change_password
      ) {
        identityMismatch.value = true
        showContextFailure('La identidad o institución del contexto no coincide con la sesión de acceso.')
        session.purge()
        return
      }

      if (context.user.must_change_password || currentIdentity.must_change_password) {
        showContextFailure('El contexto aún informa que el cambio de contraseña es obligatorio.')
        return
      }

      passwordChangeConfirmed.value = false
      passwordChangeUncertain.value = false
      contextConfirmationFailed.value = false
      identityMismatch.value = false
      feedback.value = null
      try {
        const destination = session.unitCode.trim()
          ? ROUTE_NAMES.DASHBOARD
          : ROUTE_NAMES.CONTEXT
        await router.replace({ name: destination })
      } catch (error: unknown) {
        if (!isCurrent(currentAttempt)) return
        const wasAborted = error instanceof Error && error.name === 'AbortError'
        showContextFailure(
          wasAborted
            ? 'La navegación después de confirmar el contexto se canceló.'
            : 'El contexto se confirmó, pero no se pudo abrir la siguiente pantalla.',
          ACCESS_FEEDBACK_TONE.WARNING,
        )
      }
      return
    }

    if (
      result.kind === ACCESS_ACTION_RESULT.REJECTED ||
      result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
    ) {
      const message = messagesFor(result.error).join('\n')
      showContextFailure(
        message || 'No se pudo confirmar el contexto. El acceso sigue bloqueado.',
        result.error.status === 429 ? ACCESS_FEEDBACK_TONE.WARNING : ACCESS_FEEDBACK_TONE.DANGER,
      )
      if (result.error.status === 429) setFailure(result.error, currentAttempt)
      return
    }

    showContextFailure('No se pudo consultar el contexto. El acceso sigue bloqueado.')
  } catch (error: unknown) {
    if (isCurrent(currentAttempt)) {
      const wasAborted = error instanceof Error && error.name === 'AbortError'
      showContextFailure(
        wasAborted
          ? 'La consulta de contexto se canceló. El acceso sigue bloqueado.'
          : 'No se pudo confirmar el contexto. El acceso sigue bloqueado.',
        ACCESS_FEEDBACK_TONE.WARNING,
      )
    }
  } finally {
    if (isCurrent(currentAttempt)) checkingContext.value = false
  }
}

async function submit(request: ChangeRequiredPasswordRequest): Promise<void> {
  if (busy.value || blocked.value) {
    clearPasswordRequest(request)
    return
  }

  clearRetryWait()
  const currentAttempt = ++attempt
  const startingIdentity = identity.value
  expectedIdentityId = startingIdentity?.id_usuario ?? null
  expectedTenantCode = session.tenantCode

  if (!startingIdentity || !startingIdentity.must_change_password) {
    clearPasswordRequest(request)
    feedback.value = {
      message: 'No hay una identidad validada con cambio de contraseña obligatorio.',
      tone: ACCESS_FEEDBACK_TONE.DANGER,
    }
    return
  }

  activeRequest = request
  submitting.value = true
  feedback.value = null

  try {
    const result = await session.changeRequiredPassword(request)
    if (!isCurrent(currentAttempt)) return

    if (result.kind === ACCESS_ACTION_RESULT.SUCCESS) {
      passwordChangeConfirmed.value = true
      await reconcileContext(currentAttempt)
      return
    }

    if (
      result.kind === ACCESS_ACTION_RESULT.REJECTED ||
      result.kind === ACCESS_ACTION_RESULT.UNCERTAIN
    ) {
      const uncertain =
        result.kind === ACCESS_ACTION_RESULT.UNCERTAIN ||
        result.error.kind === ACCESS_OPERATION_ERROR_KIND.NETWORK ||
        result.error.kind === ACCESS_OPERATION_ERROR_KIND.TIMEOUT ||
        result.error.kind === ACCESS_OPERATION_ERROR_KIND.ABORTED
      if (uncertain) {
        passwordChangeUncertain.value = true
        contextConfirmationFailed.value = true
      }
      setFailure(result.error, currentAttempt)
    } else if (result.kind === ACCESS_ACTION_RESULT.BLOCKED) {
      feedback.value = {
        message: 'El cambio de contraseña no se envió porque la acción está bloqueada.',
        tone: ACCESS_FEEDBACK_TONE.DANGER,
      }
    }
  } catch (error: unknown) {
    if (isCurrent(currentAttempt)) {
      passwordChangeUncertain.value = true
      contextConfirmationFailed.value = true
      feedback.value = {
        message:
          error instanceof Error && error.name === 'AbortError'
            ? 'El cambio se canceló y su resultado no se confirmó. No se repetirá y el acceso sigue bloqueado.'
            : 'No se pudo confirmar el cambio. No se repetirá y el acceso sigue bloqueado.',
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
    }
  } finally {
    clearPasswordRequest(request)
    if (activeRequest === request) activeRequest = null
    if (isCurrent(currentAttempt)) submitting.value = false
  }
}

async function retryContext(): Promise<void> {
  if (!canRetryContext.value || busy.value || logoutBusy.value) return
  if (!hasUsableForcedIdentity.value) return
  const currentAttempt = ++attempt
  expectedIdentityId = identity.value?.id_usuario ?? null
  expectedTenantCode = session.tenantCode
  feedback.value = null
  await reconcileContext(currentAttempt)
}

async function logout(): Promise<void> {
  if (logoutBusy.value) return

  attempt += 1
  clearRetryWait()
  if (activeRequest !== null) clearPasswordRequest(activeRequest)
  activeRequest = null
  submitting.value = false
  checkingContext.value = false

  const logoutRequest = session.logout()
  try {
    await router.replace('/login')
  } catch (navigationError: unknown) {
    if (mounted) {
      const wasAborted = navigationError instanceof Error && navigationError.name === 'AbortError'
      feedback.value = {
        message: wasAborted
          ? 'La navegación se canceló después de purgar el estado local.'
          : 'El estado local se purgó, pero no se pudo abrir el inicio de sesión.',
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
    }
  }
  try {
    await logoutRequest
  } catch (error: unknown) {
    if (mounted) {
      feedback.value = {
        message:
          error instanceof Error && error.name === 'AbortError'
            ? 'El cierre se canceló después de purgar el estado local.'
            : 'No se confirmó la respuesta del cierre; el estado local ya se purgó.',
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
    }
  }
}

onUnmounted(() => {
  mounted = false
  attempt += 1
  if (activeRequest !== null) clearPasswordRequest(activeRequest)
  activeRequest = null
  submitting.value = false
  checkingContext.value = false
  clearRetryWait()
})
</script>

<template>
  <main class="authentication-bg auth-reset account-pages py-5">
    <div class="container auth-container">
      <div class="row justify-content-center auth-row">
        <div class="col-md-6 col-lg-5 auth-column">
          <AuthCard
            title="Cambio de contraseña obligatorio"
            description="Define una contraseña nueva para continuar."
          >
            <PasswordRequiredForm
              :busy="busy"
              :logout-busy="logoutBusy"
              :feedback="feedback"
              :uncertain="blocked"
              @submit="submit"
              @logout="logout"
            />
            <div v-if="canRetryContext" class="d-grid auth-submit">
              <button
                class="btn btn-outline-secondary btn-lg fw-medium auth-button"
                type="button"
                :disabled="busy || logoutBusy"
                @click="retryContext"
              >
                {{ busy ? 'Confirmando contexto…' : 'Consultar contexto nuevamente' }}
              </button>
            </div>
            <p v-if="retrySeconds > 0" class="muted" aria-hidden="true">
              Podrás reintentar en {{ retrySeconds }} s
            </p>
          </AuthCard>
        </div>
      </div>
    </div>
  </main>
</template>
