<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import brandLogo from '../assets/img/Inumito.png'
import { ROUTE_NAMES, type RouteName } from '../router/routes'
import {
  buildVisibilitySnapshot,
  canViewSurface,
  visibilityOfMeta,
} from '../router/visibility'
import { useSessionStore } from '../stores/session'

// Retirado el mecanismo legacy de secciones (plan frontend-ux-corrections F4):
// RouterLink es la única fuente de navegación; el emit conservado es `close`
// (cierre del drawer móvil) y `toggle-collapse`. El resaltado es route-based
// (activeGroupId/isActive sobre route.name).
interface SidebarNavigationItem {
  id: string
  label: string
  icon: string
  routeName: RouteName
  activeRouteNames: readonly RouteName[]
}

interface SidebarNavigationGroup {
  id: string
  label: string
  items: readonly SidebarNavigationItem[]
}

const NAVIGATION_GROUPS: readonly SidebarNavigationGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [
      {
        id: 'dashboard',
        label: 'Resumen',
        icon: 'mingcute:home-3-line',
        routeName: ROUTE_NAMES.DASHBOARD,
        activeRouteNames: [ROUTE_NAMES.DASHBOARD],
      },
    ],
  },
  {
    id: 'context',
    label: 'Contexto',
    items: [
      {
        id: 'context',
        label: 'Unidad activa',
        icon: 'mingcute:user-3-line',
        routeName: ROUTE_NAMES.CONTEXT,
        activeRouteNames: [ROUTE_NAMES.CONTEXT],
      },
    ],
  },
  {
    id: 'organization',
    label: 'Organización',
    items: [
      {
        id: 'units',
        label: 'Unidades',
        icon: 'mingcute:table-line',
        routeName: ROUTE_NAMES.UNITS,
        activeRouteNames: [ROUTE_NAMES.UNITS, ROUTE_NAMES.UNIT_DETAIL],
      },
      {
        id: 'precincts',
        label: 'Recintos',
        icon: 'mingcute:table-line',
        routeName: ROUTE_NAMES.PRECINCTS,
        activeRouteNames: [ROUTE_NAMES.PRECINCTS, ROUTE_NAMES.PRECINCT_DETAIL],
      },
      {
        id: 'positions',
        label: 'Puestos',
        icon: 'mingcute:table-line',
        routeName: ROUTE_NAMES.POSITIONS,
        activeRouteNames: [ROUTE_NAMES.POSITIONS, ROUTE_NAMES.POSITION_DETAIL],
      },
      {
        id: 'memberships',
        label: 'Membresías',
        icon: 'mingcute:table-line',
        routeName: ROUTE_NAMES.MEMBERSHIPS,
        activeRouteNames: [ROUTE_NAMES.MEMBERSHIPS],
      },
    ],
  },
  {
    id: 'people-authorization',
    label: 'Personas y autorización',
    items: [
      {
        id: 'people',
        label: 'Personas',
        icon: 'mingcute:user-3-line',
        routeName: ROUTE_NAMES.PEOPLE,
        activeRouteNames: [ROUTE_NAMES.PEOPLE, ROUTE_NAMES.PERSON_DETAIL],
      },
      {
        id: 'roles',
        label: 'Roles',
        icon: 'mingcute:user-3-line',
        routeName: ROUTE_NAMES.ROLES,
        activeRouteNames: [ROUTE_NAMES.ROLES],
      },
      {
        id: 'scopes',
        label: 'Scopes',
        icon: 'mingcute:user-3-line',
        routeName: ROUTE_NAMES.SCOPES,
        activeRouteNames: [ROUTE_NAMES.SCOPES],
      },
      {
        id: 'permissions',
        label: 'Permisos y matrices',
        icon: 'mingcute:user-3-line',
        routeName: ROUTE_NAMES.PERMISSIONS,
        activeRouteNames: [ROUTE_NAMES.PERMISSIONS],
      },
      {
        id: 'overrides',
        label: 'Overrides',
        icon: 'mingcute:user-3-line',
        routeName: ROUTE_NAMES.OVERRIDES,
        activeRouteNames: [ROUTE_NAMES.OVERRIDES],
      },
    ],
  },
  {
    id: 'armory',
    label: 'Almacén',
    items: [
      {
        id: 'armories',
        label: 'Armerías',
        icon: 'mingcute:box-line',
        routeName: ROUTE_NAMES.ARMORIES,
        activeRouteNames: [ROUTE_NAMES.ARMORIES],
      },
      {
        id: 'weapons',
        label: 'Armas',
        icon: 'mingcute:box-line',
        routeName: ROUTE_NAMES.WEAPONS,
        activeRouteNames: [ROUTE_NAMES.WEAPONS, ROUTE_NAMES.WEAPON_DETAIL],
      },
      {
        id: 'calibers',
        label: 'Calibres',
        icon: 'mingcute:box-line',
        routeName: ROUTE_NAMES.CALIBERS,
        activeRouteNames: [ROUTE_NAMES.CALIBERS],
      },
    ],
  },
  {
    id: 'shooting',
    label: 'Tiro',
    items: [
      {
        id: 'polygons',
        label: 'Polígonos',
        icon: 'mingcute:map-line',
        routeName: ROUTE_NAMES.POLYGONS,
        activeRouteNames: [ROUTE_NAMES.POLYGONS, ROUTE_NAMES.POLYGON_DETAIL],
      },
      {
        id: 'lessons',
        label: 'Lecciones',
        icon: 'mingcute:table-line',
        routeName: ROUTE_NAMES.LESSONS,
        activeRouteNames: [
          ROUTE_NAMES.LESSONS,
          ROUTE_NAMES.LESSON_DETAIL,
          ROUTE_NAMES.FRACTION_DETAIL,
          ROUTE_NAMES.RESULTS_CAPTURE,
        ],
      },
    ],
  },
  {
    id: 'exercises',
    label: 'Ejercicios',
    items: [
      {
        id: 'exercises',
        label: 'Ejercicios',
        icon: 'mingcute:chart-bar-line',
        routeName: ROUTE_NAMES.EXERCISES,
        activeRouteNames: [ROUTE_NAMES.EXERCISES, ROUTE_NAMES.EXERCISE_DETAIL],
      },
      {
        id: 'munition-consumption',
        label: 'Consumos de munición',
        icon: 'mingcute:chart-bar-line',
        routeName: ROUTE_NAMES.MUNITION_CONSUMPTION,
        activeRouteNames: [ROUTE_NAMES.MUNITION_CONSUMPTION],
      },
      {
        id: 'weapon-consumption',
        label: 'Consumos por arma',
        icon: 'mingcute:chart-bar-line',
        routeName: ROUTE_NAMES.WEAPON_CONSUMPTION,
        activeRouteNames: [ROUTE_NAMES.WEAPON_CONSUMPTION],
      },
    ],
  },
  {
    id: 'audit',
    label: 'Auditoría',
    items: [
      {
        id: 'audit',
        label: 'Bitácora',
        icon: 'mingcute:table-line',
        routeName: ROUTE_NAMES.AUDIT,
        activeRouteNames: [ROUTE_NAMES.AUDIT],
      },
    ],
  },
]

const props = withDefaults(
  defineProps<{
    collapsed?: boolean
    mobileOpen?: boolean
  }>(),
  {
    collapsed: false,
    mobileOpen: false,
  },
)

// F4: el menú resuelve el MISMO criterio que las rutas. La visibilidad se lee
// del meta declarado en routes.ts (router.resolve → única fuente, sin
// duplicar) y se evalúa con el helper compartido de visibility.ts. Visibilidad
// cerrada = no-render (nunca disabled). Con snapshot unknown/stale (booting,
// generación avanzada, contexto fallido) toda entrada privilegiada queda
// cerrada (AC-3) y cero entradas huecas (D-02): un grupo sin ítems visibles no
// se renderiza. Ningún request se emite para averiguar permisos (AC-1): el
// filtro sólo lee el snapshot vigente del SessionStore.
const session = useSessionStore()
const router = useRouter()

const visibilitySnapshot = computed(() => buildVisibilitySnapshot({
  status: session.status,
  context: session.context,
  principalId: session.identity?.id_usuario ?? null,
  tenantCode: session.tenantCode,
  logoutBusy: session.logoutBusy,
}))

const visibleGroups = computed(() => {
  const snapshot = visibilitySnapshot.value
  return NAVIGATION_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (
        canViewSurface(
          visibilityOfMeta(router.resolve({ name: item.routeName }).meta),
          snapshot,
        )
      )),
    }))
    .filter((group) => group.items.length > 0)
})

// Mecanismo literal del DS (app.js): la clase vive en <body>, no en un envoltorio
// del shell. Este componente sincroniza body.sidebar-collapsed / body.sidebar-open
// desde las props existentes; el estado y los emits no cambian.
function syncBodySidebarState(): void {
  document.body.classList.toggle('sidebar-collapsed', props.collapsed)
  document.body.classList.toggle('sidebar-open', props.mobileOpen)
}

onMounted(syncBodySidebarState)
watch([() => props.collapsed, () => props.mobileOpen], syncBodySidebarState)
onUnmounted(() => {
  document.body.classList.remove('sidebar-collapsed', 'sidebar-open')
})

const emit = defineEmits<{
  'toggle-collapse': []
  close: []
}>()

const route = useRoute()
const activeGroupId = computed(() => {
  const currentRouteName = route.name
  return visibleGroups.value.find((group) => (
    group.items.some((item) => item.activeRouteNames.some((name) => name === currentRouteName))
  ))?.id ?? null
})

// Grupos plegables: estado en memoria del componente (sin localStorage).
// TODOS parten cerrados; el usuario abre lo que necesita y su elección se
// respeta — sin autoexpansión por ruta activa ni forzado al navegar. Sobrevive
// la navegación porque el sidebar no se desmonta; se reinicia al recargar.
const collapsedGroups = shallowRef<ReadonlySet<string>>(
  new Set(NAVIGATION_GROUPS.map((group) => group.id)),
)

// Paneles por grupo y su animación en curso: cada grupo anima por su cuenta.
// El mapa de nodos NO es reactivo: un ref funcional que escribe estado reactivo
// re-renderiza, vuelve a llamar al ref y entra en bucle de actualizaciones.
const groupPanels = new Map<string, HTMLDivElement>()
const groupAnimations = new Map<string, Animation>()
const GROUP_DURATION = 300
const GROUP_EASING = 'cubic-bezier(.22,.61,.36,1)'

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setGroupPanel(groupId: string, element: unknown): void {
  if (element instanceof HTMLDivElement) groupPanels.set(groupId, element)
  else groupPanels.delete(groupId)
}

function isGroupCollapsed(groupId: string): boolean {
  return collapsedGroups.value.has(groupId)
}

function setGroupCollapsed(groupId: string, collapsed: boolean): void {
  const next = new Set(collapsedGroups.value)
  if (collapsed) next.add(groupId)
  else next.delete(groupId)
  collapsedGroups.value = next
}

// Los grupos de un solo ítem son planos (siempre visibles) y el modo achicado
// muestra todos los ítems como hoy: en ninguno de los dos hay animación.
function isGroupOpen(groupId: string, itemCount: number): boolean {
  return itemCount === 1 || props.collapsed || !isGroupCollapsed(groupId)
}

function clearGroupStyles(panel: HTMLElement): void {
  panel.style.height = ''
}

function toggleGroup(groupId: string, itemCount: number): void {
  const panel = groupPanels.get(groupId)
  const collapsing = !isGroupCollapsed(groupId)

  // Sin animación posible o sin panel: el estado alterna igual, en seco.
  if (
    itemCount === 1
    || props.collapsed
    || !panel
    || typeof panel.animate !== 'function'
    || prefersReducedMotion()
  ) {
    setGroupCollapsed(groupId, collapsing)
    return
  }

  groupAnimations.get(groupId)?.cancel()

  if (collapsing) {
    // Cerrar: del alto real al 0; el estado se apaga al terminar.
    const currentHeight = panel.getBoundingClientRect().height
    const animation = panel.animate(
      [{ height: `${currentHeight}px` }, { height: '0px' }],
      { duration: GROUP_DURATION, easing: GROUP_EASING },
    )
    groupAnimations.set(groupId, animation)
    void animation.finished
      .then(() => {
        if (groupAnimations.get(groupId) !== animation) return
        groupAnimations.delete(groupId)
        setGroupCollapsed(groupId, true)
        clearGroupStyles(panel)
      })
      .catch(() => undefined)
    return
  }

  // Abrir: el contenido está siempre renderizado, así que la medición es
  // síncrona y fiable; se clampa antes de revelar y se anima 0 → alto.
  setGroupCollapsed(groupId, false)
  panel.style.height = '0px'
  const targetHeight = panel.scrollHeight
  if (targetHeight <= 0) {
    // Sin objetivo válido no se anima y el panel jamás queda clampado.
    clearGroupStyles(panel)
    return
  }

  const animation = panel.animate(
    [{ height: '0px' }, { height: `${targetHeight}px` }],
    { duration: GROUP_DURATION, easing: GROUP_EASING },
  )
  groupAnimations.set(groupId, animation)
  void animation.finished
    .then(() => {
      if (groupAnimations.get(groupId) !== animation) return
      groupAnimations.delete(groupId)
      clearGroupStyles(panel)
    })
    .catch(() => undefined)
}

function groupPanelId(groupId: string): string {
  return `sidebar-group-${groupId}`
}

function isActive(item: SidebarNavigationItem): boolean {
  return item.activeRouteNames.some((name) => name === route.name)
}
</script>

<template>
  <aside id="dashboard-sidebar" class="sidebar" aria-label="Navegación del dashboard">
    <RouterLink
      class="sidebar-brand"
      :to="{ name: ROUTE_NAMES.DASHBOARD }"
      aria-label="PoligonoTiro"
      @click="emit('close')"
    >
      <img :src="brandLogo" alt="" class="brand-logo" width="32" height="32" />
      <span class="brand-text">PoligonoTiro</span>
    </RouterLink>

    <nav class="sidebar-nav" aria-label="Navegación principal">
      <template v-for="group in visibleGroups" :key="group.id">
        <!-- Los grupos de un solo ítem son entradas de primer nivel: un
             acordeón de un elemento no aporta y escondía la ubicación. -->
        <button
          v-if="group.items.length > 1"
          type="button"
          class="menu-label"
          :data-active="activeGroupId === group.id ? 'true' : undefined"
          :aria-expanded="!isGroupCollapsed(group.id)"
          :aria-controls="groupPanelId(group.id)"
          @click="toggleGroup(group.id, group.items.length)"
        >
          <span class="menu-label-text">{{ group.label }}</span>
          <iconify-icon class="menu-caret" icon="ph:caret-down" aria-hidden="true"></iconify-icon>
        </button>
        <div
          :id="groupPanelId(group.id)"
          :ref="(element) => setGroupPanel(group.id, element)"
          class="menu-group-items"
          :class="{ 'is-open': isGroupOpen(group.id, group.items.length) }"
          :inert="isGroupOpen(group.id, group.items.length) ? undefined : true"
        >
          <RouterLink
            v-for="item in group.items"
            :key="item.id"
            class="menu-link"
            :class="{ active: isActive(item) }"
            :to="{ name: item.routeName }"
            :aria-current="isActive(item) ? 'page' : undefined"
            :aria-label="props.collapsed ? item.label : undefined"
            :title="props.collapsed ? item.label : undefined"
            @click="emit('close')"
          >
            <span class="menu-icon" aria-hidden="true">
              <iconify-icon :icon="item.icon"></iconify-icon>
            </span>
            <span class="menu-label-text">{{ item.label }}</span>
          </RouterLink>
        </div>
      </template>
    </nav>

    <div class="sidebar-footer">
      <button
        class="icon-btn sidebar-collapse-toggle"
        type="button"
        aria-label="Alternar menú lateral"
        aria-controls="dashboard-sidebar"
        @click="emit('toggle-collapse')"
      >
        <iconify-icon icon="ph:sidebar-simple" width="22" aria-hidden="true"></iconify-icon>
      </button>
    </div>
  </aside>
</template>
