<script setup lang="ts">
import DashboardSidebar from '../DashboardSidebar.vue'
import type { SidebarEmits, SidebarProps } from '../../types/shell'

const props = defineProps<SidebarProps>()
const emit = defineEmits<SidebarEmits>()
</script>

<template>
  <DashboardSidebar
    :collapsed="props.collapsed"
    :mobile-open="props.mobileOpen"
    @toggle-collapse="emit('toggle-collapse')"
    @close="emit('close')"
  />
</template>
