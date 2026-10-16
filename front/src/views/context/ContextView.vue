<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import ConnectionForm from '../../components/ConnectionForm.vue'
import ContextSelector from '../../components/context/ContextSelector.vue'
import FormFeedback from '../../components/ds/FormFeedback.vue'
import ContextCard from '../../components/ContextCard.vue'
import StateMessage from '../../components/StateMessage.vue'
import { SESSION_STATUS } from '../../types/session'
import type { ContextViewEmits, ContextViewProps } from '../../types/access-ui'

const props = defineProps<ContextViewProps>()
const emit = defineEmits<ContextViewEmits>()

const tenantDraft = shallowRef(props.tenantCode)
const captureBusy = computed(() => props.busy.context)
const showTenantCapture = computed(() => (
  props.status === SESSION_STATUS.NEEDS_TENANT
  || (!props.context && !props.tenantCode)
))
const showContextFailure = computed(() => (
  props.status === SESSION_STATUS.FAILURE && !props.feedback
))

watch(() => props.tenantCode, (tenantCode) => {
  tenantDraft.value = tenantCode
})

function captureTenant(): void {
  const tenantCode = tenantDraft.value.trim()
  if (!tenantCode || captureBusy.value) return
  emit('capture-tenant', tenantCode)
}

function retryContext(): void {
  if (!props.tenantCode.trim() || captureBusy.value) return
  emit('retry-context')
}
</script>

<template>
  <div class="access-forms context-view">
    <header class="page-head">
      <div>
        <h1 class="page-title">Contexto operativo</h1>
        <p class="page-subtitle">Selecciona el contexto recibido desde el backend.</p>
      </div>
    </header>

    <section v-if="showTenantCapture" class="card context-capture-card" aria-labelledby="context-capture-title">
      <div class="card-head">
        <h2 id="context-capture-title" class="card-title">Institución</h2>
      </div>
      <div class="card-body">
        <p class="context-empty">Escribe el código de institución para consultar el contexto. Por ejemplo: <code>ejercito-demo</code>.</p>
        <ConnectionForm
          v-model:tenant-code="tenantDraft"
          :busy="captureBusy"
          @submit="captureTenant"
        />
      </div>
    </section>

    <FormFeedback
      v-if="props.status === SESSION_STATUS.BOOTING || (props.unitCodes.length === 0 && !props.context)"
      :feedback="props.feedback"
      :busy="props.status === SESSION_STATUS.BOOTING || captureBusy"
      :busy-message="props.status === SESSION_STATUS.BOOTING ? 'Consultando contexto…' : 'Procesando…'"
    />

    <StateMessage
      v-if="showContextFailure"
      title="No se pudo consultar el contexto"
      message="La consulta no se resolvió. Reintenta de forma explícita."
      tone="danger"
    />

    <button
      v-if="props.status === SESSION_STATUS.FAILURE && props.tenantCode"
      class="btn btn-primary context-retry"
      type="button"
      :disabled="captureBusy"
      @click="retryContext"
    >
      Reconsultar contexto
    </button>

    <ContextCard v-if="props.context" :context="props.context" />

    <ContextSelector
      v-if="props.context && props.status !== SESSION_STATUS.CONTEXT_LOST"
      :unit-codes="props.unitCodes"
      :active-unit-code="props.activeUnitCode"
      :busy="props.busy.selectUnit"
      :feedback="props.feedback"
      @select="emit('select-unit', $event)"
    />

    <StateMessage
      v-if="props.status === SESSION_STATUS.CONTEXT_LOST"
      title="Contexto perdido"
      message="El contexto recibido ya no tiene una institución activa. Inicia una nueva sesión para continuar."
      tone="warning"
    />

    <div class="context-view-actions">
      <button
        class="btn btn-primary context-logout"
        type="button"
        :disabled="props.logoutBusy"
        :aria-busy="props.logoutBusy"
        @click="emit('logout')"
      >
        {{ props.logoutBusy ? 'Cerrando sesión…' : 'Cerrar sesión' }}
      </button>
    </div>
  </div>
</template>
