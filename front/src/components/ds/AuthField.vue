<script setup lang="ts">
import '../../styles/access-forms.css'
import type { AuthFieldEmits, AuthFieldProps } from '../../types/access-ui'

const props = withDefaults(defineProps<AuthFieldProps>(), {
  autocomplete: '',
  required: false,
  disabled: false,
  error: null,
})

const emit = defineEmits<AuthFieldEmits>()

function updateValue(event: Event): void {
  const input = event.currentTarget
  if (input instanceof HTMLInputElement) emit('update:modelValue', input.value)
}
</script>

<template>
  <div class="mb-3 auth-field">
    <label class="form-label auth-field-label" :for="props.name">{{ props.label }}</label>
    <input
      :id="props.name"
      class="form-control auth-control"
      :class="{ 'is-invalid': props.error }"
      :name="props.name"
      :type="props.type"
      :value="props.modelValue"
      :autocomplete="props.autocomplete || undefined"
      :required="props.required"
      :disabled="props.disabled"
      :aria-invalid="props.error ? 'true' : undefined"
      :aria-describedby="props.error ? `${props.name}-error` : undefined"
      @input="updateValue"
    />
    <p v-if="props.error" :id="`${props.name}-error`" class="invalid-feedback auth-field-error">
      {{ props.error }}
    </p>
  </div>
</template>
