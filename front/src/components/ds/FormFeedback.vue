<script setup lang="ts">
import '../../styles/access-forms.css'
import type { FormFeedbackProps } from '../../types/access-ui'

const props = withDefaults(defineProps<FormFeedbackProps>(), {
  busyMessage: null,
})
</script>

<template>
  <div
    v-if="props.feedback"
    class="alert access-feedback"
    :class="`alert-${props.feedback.tone}`"
    :role="props.feedback.tone === 'danger' ? 'alert' : 'status'"
    :aria-live="props.feedback.tone === 'danger' ? 'assertive' : 'polite'"
  >
    {{ props.feedback.message }}
  </div>
  <div v-if="props.busy" class="access-busy" role="status" aria-live="polite">
    <span class="spinner-border" aria-hidden="true"></span>
    <span>{{ props.busyMessage ?? 'Procesando…' }}</span>
  </div>
</template>

<style scoped>
/* baseui.css:718-739; page-content override: baseui-content.css:101. */
.access-feedback {
  position: relative;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: var(--bui-radius);
  color: var(--bui-text);
}

.access-feedback.alert-info {
  color: var(--info-text);
  background-color: rgba(var(--bui-info-rgb), .15);
  border-color: rgba(var(--bui-info-rgb), .4);
}

.access-feedback.alert-success {
  color: var(--success-text);
  background-color: rgba(var(--bui-success-rgb), .15);
  border-color: rgba(var(--bui-success-rgb), .4);
}

.access-feedback.alert-warning {
  color: var(--warning-text);
  background-color: rgba(var(--bui-warning-rgb), .15);
  border-color: rgba(var(--bui-warning-rgb), .4);
}

.access-feedback.alert-danger {
  color: var(--danger-text);
  background-color: rgba(var(--bui-danger-rgb), .15);
  border-color: rgba(var(--bui-danger-rgb), .4);
}

:global(.page-content .access-feedback) {
  padding: 12px 20px;
  margin-bottom: 20px;
  border: 0;
}
</style>
