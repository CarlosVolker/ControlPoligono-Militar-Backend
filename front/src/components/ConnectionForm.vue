<script setup lang="ts">
const tenantCode = defineModel<string>('tenantCode', { default: '' })

withDefaults(
  defineProps<{
    busy?: boolean
  }>(),
  {
    busy: false,
  },
)

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <section class="card connection-card" aria-labelledby="connection-title">
    <div class="card-head">
      <h2 id="connection-title" class="card-title">Contexto de consulta</h2>
    </div>
    <div class="card-body">
      <form class="connection-form" @submit.prevent="emit('submit')">
        <div class="connection-field">
          <label class="form-label" for="tenant-code">Código de institución</label>
          <input
            id="tenant-code"
            v-model="tenantCode"
            class="form-control"
            type="text"
            required
            spellcheck="false"
            autocapitalize="none"
            placeholder="Código real de institución"
            aria-describedby="tenant-code-help"
          />
          <p id="tenant-code-help" class="form-text">Escríbelo tal como lo entrega la institución (por ejemplo, <code>ejercito-demo</code>).</p>
        </div>
        <button class="btn btn-primary" type="submit" :disabled="busy">
          {{ busy ? 'Consultando…' : 'Consultar institución' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.form-text {
  margin-top: 6px;
  margin-bottom: 0;
  color: var(--muted);
  font-size: 12px;
}
</style>
