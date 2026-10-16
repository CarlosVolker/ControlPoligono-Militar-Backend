<script setup lang="ts">
import { onUnmounted, shallowRef, watch } from 'vue'
import AuthField from '../ds/AuthField.vue'
import FormFeedback from '../ds/FormFeedback.vue'
import { RECOVERY_STEP } from '../../types/auth'
import type { RecoveryFormEmits, RecoveryFormProps } from '../../types/access-ui'

const props = defineProps<RecoveryFormProps>()
const emit = defineEmits<RecoveryFormEmits>()

const rut = shallowRef('')
const email = shallowRef('')
const code = shallowRef('')
const newPassword = shallowRef('')
const showNewPassword = shallowRef(false)
const showConfirmation = shallowRef(false)
const confirmation = shallowRef('')
const confirmationError = shallowRef<string | null>(null)

function clearSecrets(): void {
  rut.value = ''
  email.value = ''
  code.value = ''
  newPassword.value = ''
  confirmation.value = ''
  confirmationError.value = null
}

function submit(): void {
  if (props.busy || props.uncertain) return

  switch (props.step) {
    case RECOVERY_STEP.IDENTIFY:
      emit('submit', {
        step: RECOVERY_STEP.IDENTIFY,
        request: { rut: rut.value },
      })
      return
    case RECOVERY_STEP.CREATE_CODE:
      emit('submit', {
        step: RECOVERY_STEP.CREATE_CODE,
        request: { rut: rut.value, correo: email.value },
      })
      return
    case RECOVERY_STEP.CHECK_CODE:
      emit('submit', {
        step: RECOVERY_STEP.CHECK_CODE,
        request: { rut: rut.value, codigo: code.value },
      })
      return
    case RECOVERY_STEP.CHANGE_PASSWORD:
      if (newPassword.value !== confirmation.value) {
        confirmationError.value = 'Las contraseñas no coinciden.'
        return
      }

      emit('submit', {
        step: RECOVERY_STEP.CHANGE_PASSWORD,
        request: {
          rut: rut.value,
          codigo: code.value,
          nueva_contrasena: newPassword.value,
        },
      })
      newPassword.value = ''
      confirmation.value = ''
      return
  }
}

function cancel(): void {
  clearSecrets()
  emit('cancel')
}

function back(): void {
  emit('back')
}

function restart(): void {
  clearSecrets()
  emit('restart')
}

watch(
  () => props.step,
  (step, previousStep) => {
    if (step === RECOVERY_STEP.IDENTIFY) {
      clearSecrets()
      return
    }

    if (previousStep === RECOVERY_STEP.CREATE_CODE && step === RECOVERY_STEP.CHECK_CODE) {
      email.value = ''
    }
  },
)

onUnmounted(clearSecrets)
</script>

<template>
  <form class="mt-4 auth-form" @submit.prevent="submit">
    <p class="auth-description">Paso {{ props.step }} de 4</p>

    <div v-if="props.step === RECOVERY_STEP.IDENTIFY" class="mb-3 auth-field">
      <AuthField
        v-model="rut"
        label="RUT"
        name="rut"
        type="text"
        autocomplete="username"
        required
        :disabled="props.busy"
        :error="null"
      />
    </div>

    <div v-else-if="props.step === RECOVERY_STEP.CREATE_CODE" class="mb-3 auth-field">
      <AuthField
        v-model="email"
        label="Correo electrónico"
        name="email"
        type="email"
        autocomplete="email"
        required
        :disabled="props.busy"
        :error="null"
      />
    </div>

    <div v-else-if="props.step === RECOVERY_STEP.CHECK_CODE" class="mb-3 auth-field">
      <AuthField
        v-model="code"
        label="Código de recuperación"
        name="code"
        type="text"
        autocomplete="one-time-code"
        required
        :disabled="props.busy"
        :error="null"
      />
    </div>

    <template v-else>
      <div class="mb-3 auth-field">
        <AuthField
          v-model="newPassword"
          label="Nueva contraseña"
          name="new-password"
          :type="showNewPassword ? 'text' : 'password'"
          autocomplete="new-password"
          required
          :disabled="props.busy"
          :error="null"
          @update:model-value="confirmationError = null"
        />
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm auth-secret-toggle"
        :aria-pressed="showNewPassword"
        :disabled="props.busy"
        @click="showNewPassword = !showNewPassword"
      >
        {{ showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña' }}
      </button>
      </div>
      <div class="mb-3 auth-field">
        <AuthField
          v-model="confirmation"
          label="Confirmar contraseña"
          name="password-confirmation"
          :type="showConfirmation ? 'text' : 'password'"
          autocomplete="new-password"
          required
          :disabled="props.busy"
          :error="confirmationError"
          @update:model-value="confirmationError = null"
        />
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm auth-secret-toggle"
        :aria-pressed="showConfirmation"
        :disabled="props.busy"
        @click="showConfirmation = !showConfirmation"
      >
        {{ showConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña' }}
      </button>
      </div>
    </template>

    <FormFeedback
      :feedback="props.feedback"
      :busy="props.busy"
      :busy-message="props.feedback?.tone === 'warning' ? props.feedback.message : 'Procesando solicitud…'"
    />

    <div class="d-grid auth-submit">
      <button
        class="btn btn-dark btn-lg fw-medium auth-button"
        type="submit"
        :disabled="props.busy || props.uncertain"
      >
        {{ props.busy ? (props.feedback?.tone === 'warning' ? 'Espera para continuar' : 'Procesando…') : props.step === RECOVERY_STEP.CHANGE_PASSWORD ? 'Cambiar contraseña' : 'Continuar' }}
      </button>
    </div>

    <div class="mb-3 auth-field">
      <button
        v-if="props.step !== RECOVERY_STEP.IDENTIFY"
        class="text-decoration-none small auth-link-muted"
        type="button"
        :disabled="props.busy"
        @click="back()"
      >
        Volver al paso anterior
      </button>
      <button
        class="text-decoration-none small text-muted auth-link-muted"
        type="button"
        @click="props.uncertain ? restart() : cancel()"
      >
        {{ props.uncertain ? 'Reiniciar recuperación' : 'Cancelar recuperación' }}
      </button>
    </div>
  </form>
</template>
