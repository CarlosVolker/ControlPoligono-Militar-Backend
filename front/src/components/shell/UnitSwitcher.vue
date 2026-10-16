<script setup lang="ts">
import { computed } from 'vue'
import type { UnitSwitcherEmits, UnitSwitcherProps } from '../../types/shell'

const props = withDefaults(defineProps<UnitSwitcherProps>(), {
  unitNames: () => ({}),
  cooldownSeconds: 0,
})

const emit = defineEmits<UnitSwitcherEmits>()

const cooldownLabel = computed<string>(() => (
  props.cooldownSeconds > 0 ? `Disponible en ${props.cooldownSeconds} s` : ''
))

function selectUnit(event: Event): void {
  const select = event.currentTarget
  if (select instanceof HTMLSelectElement && select.value) {
    emit('select-unit', select.value)
  }
}

// El nombre de la unidad cuando el contexto lo expone; el código queda como
// apoyo (y es lo único disponible si el payload no trae nombre).
function optionLabel(unitCode: string): string {
  const name = props.unitNames?.[unitCode]?.trim()
  return name ? `${name} (${unitCode})` : unitCode
}
</script>

<template>
  <div class="unit-switcher">
    <label class="visually-hidden" for="shell-unit-switcher">Unidad activa</label>
    <select
      id="shell-unit-switcher"
      class="form-select"
      :value="props.activeUnitCode ?? ''"
      :disabled="props.busy || props.unitCodes.length === 0"
      :aria-describedby="cooldownLabel ? 'shell-unit-switcher-cooldown' : undefined"
      @change="selectUnit"
    >
      <option value="" disabled>Unidad activa</option>
      <option v-for="unitCode in props.unitCodes" :key="unitCode" :value="unitCode">
        {{ optionLabel(unitCode) }}
      </option>
    </select>
    <p
      v-if="cooldownLabel"
      id="shell-unit-switcher-cooldown"
      class="unit-switcher-cooldown"
      role="status"
    >
      {{ cooldownLabel }}
    </p>
  </div>
</template>
