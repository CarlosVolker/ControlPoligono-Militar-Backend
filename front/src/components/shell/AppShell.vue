<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import UnitSwitcher from './UnitSwitcher.vue'
import { SHELL_THEME } from '../../types/shell'
import type { AppShellEmits, AppShellProps, AppShellSlots, ShellTheme } from '../../types/shell'

const props = withDefaults(defineProps<AppShellProps>(), {
  theme: SHELL_THEME.DARK,
  userName: 'Usuario no disponible',
  context: null,
  contextFormOpen: false,
  contextToggleVisible: true,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
})

const emit = defineEmits<AppShellEmits>()
defineSlots<AppShellSlots>()

let originalTheme: string | null = null
let themeCaptured = false

function applyTheme(theme: ShellTheme): void {
  if (themeCaptured) document.documentElement.setAttribute('data-theme', theme)
}

function closeMobileSidebar(): void {
  emit('close')
}

onMounted(() => {
  originalTheme = document.documentElement.getAttribute('data-theme')
  themeCaptured = true
  applyTheme(props.theme)
})

watch(() => props.theme, applyTheme)

onUnmounted(() => {
  if (!themeCaptured) return

  if (originalTheme === null) {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', originalTheme)
  }

  themeCaptured = false
})
</script>

<template>
  <div class="dashboard-shell">
    <a class="skip-link" href="#main">Saltar al contenido</a>

    <slot name="sidebar">
      <AppSidebar
        :collapsed="props.sidebarCollapsed"
        :mobile-open="props.mobileSidebarOpen"
        @toggle-collapse="emit('toggle-collapse')"
        @close="emit('close')"
      />
    </slot>

    <div class="dashboard-frame">
      <slot name="topbar">
        <AppTopbar
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
          <UnitSwitcher
            v-if="props.unitCodes?.length"
            :unit-codes="props.unitCodes ?? []"
            :active-unit-code="props.activeUnitCode ?? null"
            :busy="props.unitSwitchBusy ?? false"
            @select-unit="emit('select-unit', $event)"
          />
        </AppTopbar>
      </slot>

      <main id="main" class="page-content">
        <slot />
      </main>
    </div>

    <button
      v-if="props.mobileSidebarOpen"
      class="sidebar-backdrop"
      type="button"
      aria-label="Cerrar navegación"
      @click="closeMobileSidebar"
    ></button>
  </div>
</template>
