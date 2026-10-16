<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue'
import AuthField from '../ds/AuthField.vue'
import FormFeedback from '../ds/FormFeedback.vue'
import type { LoginFormEmits, LoginFormProps } from '../../types/access-ui'
import type { LoginRequest } from '../../types/auth'

const props = defineProps<LoginFormProps>()
const emit = defineEmits<LoginFormEmits>()

const rut = shallowRef('')
const password = shallowRef('')
const showPassword = shallowRef(false)

function submit(): void {
  if (props.busy) return

  const credentials: LoginRequest = {
    rut: rut.value,
    password: password.value,
  }

  password.value = ''
  emit('submit', credentials)
}

function clearFields(): void {
  rut.value = ''
  password.value = ''
}

onUnmounted(clearFields)
</script>

<template>
  <form class="mt-4 auth-form" @submit.prevent="submit">
    <div class="mb-3 auth-field">
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

    <div class="mb-3 auth-field">
      <div class="d-flex justify-content-between align-items-center auth-field-row">
        <label class="form-label auth-field-label" for="password">Contraseña</label>
        <button
          class="text-decoration-none small text-muted auth-link-muted"
          type="button"
          :disabled="props.busy"
          @click="emit('open-recovery')"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      <input
        id="password"
        v-model="password"
        class="form-control auth-control"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        required
        :disabled="props.busy"
      />
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm auth-secret-toggle"
        :aria-pressed="showPassword"
        :disabled="props.busy"
        @click="showPassword = !showPassword"
      >
        {{ showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña' }}
      </button>
    </div>

    <div class="mb-3 auth-field">
      <AuthField
        :model-value="props.tenantCode"
        label="Código de institución"
        name="tenantCode"
        type="text"
        autocomplete="off"
        required
        :disabled="props.busy"
        :error="null"
        @update:model-value="emit('update:tenantCode', $event)"
      />
    </div>

    <FormFeedback
      :feedback="props.feedback"
      :busy="props.busy"
      :busy-message="props.feedback?.tone === 'warning' ? props.feedback.message : 'Validando acceso…'"
    />

    <div class="d-grid auth-submit">
      <button class="btn btn-dark btn-lg fw-medium auth-button" type="submit" :disabled="props.busy">
        {{ props.busy ? (props.feedback?.tone === 'warning' ? 'Espera para continuar' : 'Ingresando…') : 'Ingresar' }}
      </button>
    </div>
  </form>
</template>
