<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    message: string
    tone?: 'info' | 'warning' | 'danger'
    actionLabel?: string
  }>(),
  {
    tone: 'info',
    actionLabel: '',
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="alert state-message" :class="`alert-${tone}`" :role="tone === 'danger' ? 'alert' : 'status'" :aria-live="tone === 'danger' ? 'assertive' : 'polite'">
    <div class="state-copy">
      <p class="alert-heading state-title">{{ title }}</p>
      <p class="state-description">{{ message }}</p>
    </div>
    <button
      v-if="actionLabel"
      class="btn btn-primary state-action"
      type="button"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
