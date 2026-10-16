<script setup lang="ts">
import { computed, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import AuthCard from '../../components/ds/AuthCard.vue'
import RecoveryStepForm from '../../components/auth/RecoveryStepForm.vue'
import { useRecovery } from '../../composables/auth/useRecovery'
import { ACCESS_ACTION_RESULT, RECOVERY_STEP } from '../../types/auth'
import type { RecoverySubmission } from '../../types/access-ui'
import { ACCESS_FEEDBACK_TONE } from '../../types/access-ui'
import type { AccessFeedback } from '../../types/access-ui'

const router = useRouter()
const flow = useRecovery()
const localFeedback = shallowRef<AccessFeedback | null>(null)
const feedback = computed(() => localFeedback.value ?? flow.feedback)

const title = computed(() =>
  flow.step === RECOVERY_STEP.CHANGE_PASSWORD ? 'Crear una nueva contraseña' : 'Recuperar acceso',
)
const description = computed(() => {
  switch (flow.step) {
    case RECOVERY_STEP.IDENTIFY:
      return 'Ingresa tu RUT para iniciar la recuperación.'
    case RECOVERY_STEP.CREATE_CODE:
      return 'Ingresa el correo asociado para recibir instrucciones.'
    case RECOVERY_STEP.CHECK_CODE:
      return 'Ingresa el código de recuperación recibido.'
    case RECOVERY_STEP.CHANGE_PASSWORD:
      return 'Define una nueva contraseña para tu cuenta.'
    default:
      return 'Continúa con la recuperación de acceso.'
  }
})

let mounted = true

async function submit(submission: RecoverySubmission): Promise<void> {
  const startingAttempt = flow.attempt
  localFeedback.value = null

  try {
    switch (submission.step) {
      case RECOVERY_STEP.IDENTIFY:
        await flow.identify(submission.request)
        return
      case RECOVERY_STEP.CREATE_CODE:
        await flow.createCode(submission.request)
        return
      case RECOVERY_STEP.CHECK_CODE:
        await flow.checkCode(submission.request)
        return
      case RECOVERY_STEP.CHANGE_PASSWORD:
        {
          const result = await flow.changePassword(submission.request)
          if (
            result.kind === ACCESS_ACTION_RESULT.SUCCESS &&
            mounted &&
            flow.step === RECOVERY_STEP.IDENTIFY &&
            flow.attempt === startingAttempt + 1 &&
            flow.feedback?.tone === ACCESS_FEEDBACK_TONE.SUCCESS &&
            flow.feedback.message === result.response.mensaje
          ) {
            await router.replace('/login')
          }
        }
        return
    }
  } catch (error: unknown) {
    if (!mounted) return

    if (
      flow.step === RECOVERY_STEP.IDENTIFY &&
      flow.attempt === startingAttempt + 1 &&
      flow.feedback?.tone === ACCESS_FEEDBACK_TONE.SUCCESS
    ) {
      localFeedback.value = {
        message: 'La contraseña se actualizó, pero no se pudo abrir el inicio de sesión.',
        tone: ACCESS_FEEDBACK_TONE.WARNING,
      }
    } else if (flow.attempt === startingAttempt && flow.feedback === null) {
      const wasAborted = error instanceof Error && error.name === 'AbortError'
      localFeedback.value = {
        message: wasAborted
          ? 'La solicitud se canceló y el paso no avanzó.'
          : 'No se pudo completar la solicitud. El paso no avanzó.',
        tone: ACCESS_FEEDBACK_TONE.DANGER,
      }
    }
  }
}

function cancel(): void {
  flow.cancel()
  void router.replace('/login')
}

function restart(): void {
  flow.restart()
}

onUnmounted(() => {
  mounted = false
})
</script>

<template>
  <main class="authentication-bg auth-reset account-pages py-5">
    <div class="container auth-container">
      <div class="row justify-content-center auth-row">
        <div class="col-md-6 col-lg-5 auth-column">
          <AuthCard :title="title" :description="description">
            <RecoveryStepForm
              :step="flow.step"
              :busy="flow.busy"
              :feedback="feedback"
              :uncertain="flow.uncertain !== null"
              @submit="submit"
              @back="flow.back"
              @restart="restart"
              @cancel="cancel"
            />
            <template #footer>
              <RouterLink class="text-decoration-none text-white fw-bold" to="/login" @click="flow.cancel()">
                Volver al inicio de sesión
              </RouterLink>
            </template>
          </AuthCard>
        </div>
      </div>
    </div>
  </main>
</template>
