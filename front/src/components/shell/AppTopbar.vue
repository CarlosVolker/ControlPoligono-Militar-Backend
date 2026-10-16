<script setup lang="ts">
import type { VNode } from 'vue'
import DashboardTopbar from '../DashboardTopbar.vue'
import { SHELL_THEME } from '../../types/shell'
import type { TopbarEmits, TopbarProps } from '../../types/shell'

const props = withDefaults(defineProps<TopbarProps>(), {
  theme: SHELL_THEME.DARK,
  userName: 'Usuario no disponible',
  context: null,
  contextFormOpen: false,
  contextToggleVisible: true,
})

const emit = defineEmits<TopbarEmits>()
defineSlots<{ default?: () => VNode[] }>()
</script>

<template>
  <DashboardTopbar
    :theme="props.theme"
    :user-name="props.userName"
    :context="props.context"
    :context-form-open="props.contextFormOpen"
    :context-toggle-visible="props.contextToggleVisible"
    :logout-busy="props.logoutBusy"
    @toggle-sidebar="emit('toggle-sidebar')"
    @toggle-theme="emit('toggle-theme')"
    @toggle-context="emit('toggle-context')"
    @logout="emit('logout')"
  >
    <slot />
  </DashboardTopbar>
</template>
