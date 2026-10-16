<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import type { VNode } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useSessionStore } from '../stores/session'
import { ROUTE_NAMES } from '../router/routes'
import type { TopbarEmits, TopbarProps } from '../types/shell'
import { SESSION_STATUS } from '../types/session'

const props = withDefaults(
  defineProps<TopbarProps>(),
  {
    theme: 'dark',
    userName: 'Usuario no disponible',
    context: null,
    contextFormOpen: false,
    contextToggleVisible: true,
    logoutBusy: false,
  },
)

const emit = defineEmits<TopbarEmits>()
defineSlots<{ default?: () => VNode[] }>()

const session = useSessionStore()
const route = useRoute()
const profileOpen = shallowRef(false)
const dropdownRoot = shallowRef<HTMLElement | null>(null)

const principalUserId = computed<number | null>(() => {
  const id = session.identity?.id_usuario
  if (session.status !== SESSION_STATUS.READY || typeof id !== 'number') return null
  return Number.isSafeInteger(id) && id > 0 ? id : null
})

const primaryAssignment = computed(() => (
  props.context?.assignments?.find((assignment) => assignment?.is_primary === true) ?? null
))

const institution = computed<string>(() => {
  return displayValue(props.context?.tenant.code)
})

const membership = computed<string>(() => {
  const unit = props.context?.unit_membership
  return displayValue(unit?.unit_name ?? unit?.unit_code)
})

// Autoridad única de la unidad activa: la MISMA resolución que alimenta el
// selector (SessionStore.unitCode). Leer el contexto aquí producía un chip que
// contradecía la selección real; «—» queda sólo para ausencia real.
const activeUnit = computed<string>(() => displayValue(session.unitCode))
// Iniciales del avatar de texto: el chip de lectura duplicaba al selector, así
// que el botón muestra la identidad en vez de una «Unidad activa» repetida.
const userInitials = computed<string>(() => {
  const parts = props.userName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'

  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
})
const primaryRole = computed<string>(() => displayValue(primaryAssignment.value?.role))

function displayValue(value: string | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function closeProfileMenu(): void {
  profileOpen.value = false
}

function toggleProfileMenu(): void {
  profileOpen.value = !profileOpen.value
}

function focusMenuItem(edge: 'first' | 'last'): void {
  const items = dropdownRoot.value?.querySelectorAll<HTMLElement>(
    '[role="menuitem"]:not([disabled])',
  )
  if (!items?.length) return
  items[edge === 'first' ? 0 : items.length - 1]?.focus()
}

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  profileOpen.value = true
  focusMenuItem(event.key === 'ArrowDown' ? 'first' : 'last')
}

function handleMenuKeydown(event: KeyboardEvent): void {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

  const items = Array.from(
    dropdownRoot.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
  )
  if (!items.length) return

  const currentIndex = items.indexOf(document.activeElement as HTMLElement)
  let nextIndex = currentIndex
  if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = items.length - 1
  else if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + items.length) % items.length
  else nextIndex = (currentIndex <= 0 ? items.length : currentIndex) - 1

  event.preventDefault()
  items[nextIndex]?.focus()
}

function closeWhenFocusLeavesMenu(event: FocusEvent): void {
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && dropdownRoot.value?.contains(nextTarget)) return
  closeProfileMenu()
}

function closeOnOutsidePointer(event: PointerEvent): void {
  const target = event.target
  if (!(target instanceof Node) || !dropdownRoot.value?.contains(target)) closeProfileMenu()
}

function closeOnEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !profileOpen.value) return
  closeProfileMenu()
  document.getElementById('actor-menu-trigger')?.focus()
}

watch([() => route.fullPath, principalUserId], closeProfileMenu)

onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutsidePointer)
  document.addEventListener('keydown', closeOnEscape)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', closeOnOutsidePointer)
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <header class="topbar">
    <button
      class="icon-btn sidebar-toggle"
      type="button"
      aria-label="Alternar menú lateral"
      aria-controls="dashboard-sidebar"
      @click="emit('toggle-sidebar')"
    >
      <iconify-icon icon="ph:list" width="24" aria-hidden="true"></iconify-icon>
    </button>

    <div class="topbar-context" role="group" aria-label="Contexto operativo">
      <div class="topbar-context-item">
        <span>Institución</span>
        <strong :title="institution">{{ institution }}</strong>
      </div>
      <div class="topbar-context-item">
        <span>Membresía orgánica</span>
        <strong :title="membership">{{ membership }}</strong>
      </div>
    </div>

    <slot />

    <div class="topbar-actions">
      <button
        v-if="props.contextToggleVisible"
        class="icon-btn context-toggle"
        type="button"
        aria-label="Cambiar contexto de consulta"
        :aria-expanded="props.contextFormOpen"
        aria-controls="context-setup"
        @click="emit('toggle-context')"
      >
        <iconify-icon icon="ph:sliders-horizontal" width="22" aria-hidden="true"></iconify-icon>
      </button>
      <button
        class="icon-btn theme-toggle"
        type="button"
        :aria-label="props.theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
        @click="emit('toggle-theme')"
      >
        <iconify-icon :icon="props.theme === 'dark' ? 'ph:sun' : 'ph:moon'" width="22" aria-hidden="true"></iconify-icon>
      </button>

      <div ref="dropdownRoot" class="dropdown user-dropdown">
        <button
          id="actor-menu-trigger"
          class="user-btn"
          type="button"
          aria-haspopup="menu"
          aria-controls="actor-context-menu"
          :aria-label="`Abrir menú de identidad y contexto · ${props.userName}`"
          :aria-expanded="profileOpen"
          @click="toggleProfileMenu"
          @keydown="handleTriggerKeydown"
        >
          <span aria-hidden="true">{{ userInitials }}</span>
        </button>

        <div
          v-show="profileOpen"
          id="actor-context-menu"
          class="dropdown-menu user-menu actor-context-menu"
          role="menu"
          aria-label="Identidad y contexto"
          @keydown="handleMenuKeydown"
          @focusout="closeWhenFocusLeavesMenu"
        >
          <div class="dropdown-header actor-menu-header" role="none">
            <strong>{{ props.userName }}</strong>
            <span>Rol principal · {{ primaryRole }}</span>
          </div>
          <dl class="actor-context-list" role="none">
            <div>
              <dt>Institución</dt>
              <dd>{{ institution }}</dd>
            </div>
            <div>
              <dt>Membresía orgánica</dt>
              <dd>{{ membership }}</dd>
            </div>
            <div>
              <dt>Unidad activa</dt>
              <dd>{{ activeUnit }}</dd>
            </div>
          </dl>
          <div class="dropdown-divider" role="separator"></div>
          <!-- AC-6 (plan frontend-account-self-service): «Mi cuenta» para todo
               principal, destino /cuenta (superficie self-service sin
               permisos). «Mi ficha» conserva destino y visibilidad actuales.
               Icono: único solar:user-outline ya registrado en esta superficie. -->
          <RouterLink
            v-if="principalUserId !== null"
            class="dropdown-item"
            role="menuitem"
            :to="{ name: ROUTE_NAMES.ACCOUNT }"
            @click="closeProfileMenu"
          >
            <iconify-icon icon="solar:user-outline" width="18" aria-hidden="true"></iconify-icon>
            <span>Mi cuenta</span>
          </RouterLink>
          <RouterLink
            v-if="principalUserId !== null"
            class="dropdown-item"
            role="menuitem"
            :to="`/personas/${principalUserId}`"
            @click="closeProfileMenu"
          >
            <iconify-icon icon="solar:user-outline" width="18" aria-hidden="true"></iconify-icon>
            <span>Mi ficha</span>
          </RouterLink>
          <RouterLink
            v-if="principalUserId !== null"
            class="dropdown-item"
            role="menuitem"
            to="/personalizador"
            @click="closeProfileMenu"
          >
            <iconify-icon icon="solar:palette-outline" width="18" aria-hidden="true"></iconify-icon>
            <span>Personalizador de apariencia</span>
          </RouterLink>
          <RouterLink
            v-if="principalUserId === null"
            class="dropdown-item"
            role="menuitem"
            to="/login"
            @click="closeProfileMenu"
          >
            <iconify-icon icon="solar:user-outline" width="18" aria-hidden="true"></iconify-icon>
            <span>Iniciar sesión</span>
          </RouterLink>
          <div v-if="principalUserId !== null" class="dropdown-divider" role="separator"></div>
          <button
            v-if="principalUserId !== null"
            class="dropdown-item dropdown-item-danger"
            type="button"
            role="menuitem"
            :disabled="props.logoutBusy"
            :aria-busy="props.logoutBusy"
            @click="closeProfileMenu(); emit('logout')"
          >
            <iconify-icon icon="solar:logout-3-outline" width="18" aria-hidden="true"></iconify-icon>
            <span>{{ props.logoutBusy ? 'Cerrando sesión…' : 'Cerrar sesión' }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
