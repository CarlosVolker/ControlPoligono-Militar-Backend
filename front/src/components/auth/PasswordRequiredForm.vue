<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue'
import AuthField from '../ds/AuthField.vue'
import FormFeedback from '../ds/FormFeedback.vue'
import type { PasswordRequiredFormEmits, PasswordRequiredFormProps } from '../../types/access-ui'
import type { ChangeRequiredPasswordRequest } from '../../types/auth'

const props = defineProps<PasswordRequiredFormProps>()
const emit = defineEmits<PasswordRequiredFormEmits>()

const newPassword = shallowRef('')
const confirmation = shallowRef('')
const confirmationError = shallowRef<string | null>(null)
const showNewPassword = shallowRef(false)
const showConfirmation = shallowRef(false)

function clearSecrets(): void {
  newPassword.value = ''
  confirmation.value = ''
  confirmationError.value = null
}

function submit(): void {
  if (props.busy || props.logoutBusy || props.uncertain) return
  if (newPassword.value !== confirmation.value) {
    confirmationError.value = 'Las contraseñas no coinciden.'
    return
  }

  const request: ChangeRequiredPasswordRequest = { new_password: newPassword.value }
  clearSecrets()
  emit('submit', request)
}

function logout(): void {
  clearSecrets()
  emit('logout')
}

onUnmounted(clearSecrets)
</script>

<template>
  <form class="mt-4 auth-form" @submit.prevent="submit">
    <div class="mb-3 auth-field">
      <AuthField
        v-model="newPassword"
        label="Nueva contraseña"
        name="new-password"
        :type="showNewPassword ? 'text' : 'password'"
        autocomplete="new-password"
        required
        :disabled="props.busy || props.logoutBusy || props.uncertain"
        :error="null"
        @update:model-value="confirmationError = null"
      />
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm auth-secret-toggle"
        :aria-pressed="showNewPassword"
        :disabled="props.busy || props.logoutBusy || props.uncertain"
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
        :disabled="props.busy || props.logoutBusy || props.uncertain"
        :error="confirmationError"
        @update:model-value="confirmationError = null"
      />
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm auth-secret-toggle"
        :aria-pressed="showConfirmation"
        :disabled="props.busy || props.logoutBusy || props.uncertain"
        @click="showConfirmation = !showConfirmation"
      >
        {{ showConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña' }}
      </button>
    </div>

    <FormFeedback
      :feedback="props.feedback"
      :busy="props.busy"
      :busy-message="props.feedback?.tone === 'warning' ? props.feedback.message : 'Actualizando contraseña…'"
    />

    <div class="d-grid auth-submit">
      <button
        class="btn btn-dark btn-lg fw-medium auth-button"
        type="submit"
        :disabled="props.busy || props.logoutBusy || props.uncertain"
      >
        {{ props.busy ? (props.feedback?.tone === 'warning' ? 'Espera para continuar' : 'Procesando…') : 'Cambiar contraseña' }}
      </button>
    </div>

    <div class="d-grid auth-submit">
      <button class="text-decoration-none small text-muted auth-link-muted" type="button" :disabled="props.logoutBusy" @click="logout">
        {{ props.logoutBusy ? 'Cerrando sesión…' : 'Cerrar sesión' }}
      </button>
    </div>
  </form>
</template>
