<script setup lang="ts">
import FormFeedback from '../ds/FormFeedback.vue'
import type { ContextSelectorEmits, ContextSelectorProps } from '../../types/access-ui'

const props = defineProps<ContextSelectorProps>()
const emit = defineEmits<ContextSelectorEmits>()

function selectUnit(event: Event): void {
  const select = event.currentTarget
  if (select instanceof HTMLSelectElement && select.value) emit('select', select.value)
}
</script>

<template>
  <section class="card context-unit-selector" aria-labelledby="context-unit-title">
    <div class="card-head">
      <h2 id="context-unit-title" class="card-title">Unidad activa</h2>
    </div>
    <div class="card-body">
      <div class="context-unit-control">
        <label class="form-label" for="context-unit">Selecciona una unidad</label>
        <select
          id="context-unit"
          class="form-select"
          :value="props.activeUnitCode ?? ''"
          :disabled="props.busy || props.unitCodes.length === 0"
          @change="selectUnit"
        >
          <option value="" disabled>Selecciona una unidad</option>
          <option v-for="unitCode in props.unitCodes" :key="unitCode" :value="unitCode">
            {{ unitCode }}
          </option>
        </select>
      </div>
      <p v-if="props.unitCodes.length === 0" class="context-empty">
        El contexto recibido no incluye unidades disponibles.
      </p>
      <FormFeedback :feedback="props.feedback" :busy="props.busy" busy-message="Actualizando unidad…" />
    </div>
  </section>
</template>
