/**
 * Contratos de shell y de componentes compartidos — hito 1 del plan
 * `frontend-build-base` (§5#1, §8): A los publica aquí, B los implementa en
 * `components/shell/` SIN editarlos (todo cambio de interfaz: vía orquestador,
 * riesgo §6#5).
 *
 * Compatibilidad garantizada con los nueve componentes locales existentes
 * (ya `lang="ts"`, reutilizados sin reescribir): los nombres y shapes de props/
 * emits reflejan exactamente los que declaran hoy `DashboardTopbar.vue`,
 * `DashboardSidebar.vue`, `StateMessage.vue` y `ConnectionForm.vue`, para que
 * el shell los componga con forward directo y App.vue (paso 5) los cablee sin
 * renombrar nada.
 *
 * Uso previsto en componentes:
 *   defineProps<SidebarProps>() / withDefaults(...)
 *   defineEmits<SidebarEmits>()          (estilo record-de-túplas, Vue ≥ 3.3)
 *   defineSlots<AppShellSlots>()
 */
import type { VNode } from 'vue'
import type { AuthContext } from './contexto'

/** Tema del documento: los dos literales del DS (`data-theme`). */
export const SHELL_THEME = {
  DARK: 'dark',
  LIGHT: 'light',
} as const

export type ShellTheme = (typeof SHELL_THEME)[keyof typeof SHELL_THEME]

/* ------------------------------------------------------------------ topbar */

/**
 * Props de la barra superior. Defaults a cargo del componente (como hoy):
 * theme 'dark', userName 'Usuario no disponible', context null,
 * contextFormOpen false, contextToggleVisible true.
 */
export interface TopbarProps {
  theme?: ShellTheme
  userName?: string
  /**
   * `AuthContext` validado (contexto.ts). El componente lo lee de forma
   * defensiva con sus interfaces locales —más anchas— y este tipo le es
   * asignable sin casteos.
   */
  context?: AuthContext | null
  contextFormOpen?: boolean
  contextToggleVisible?: boolean
  logoutBusy?: boolean
}

/** Emits de la topbar. `toggle-sidebar`: colapso desktop / apertura mobile (decisión del shell). */
export interface TopbarEmits {
  'toggle-sidebar': []
  'toggle-theme': []
  /** Alterna la visibilidad de la captura manual de tenant (ConnectionForm). */
  'toggle-context': []
  logout: []
}

/* ----------------------------------------------------------------- sidebar */

/** Props del sidebar. Defaults: collapsed false, mobileOpen false. El
 *  resaltado activo es route-based y la navegación es RouterLink (plan
 *  frontend-ux-corrections F4: mecanismo legacy de secciones retirado). */
export interface SidebarProps {
  collapsed?: boolean
  mobileOpen?: boolean
}

/** Emits del sidebar (`close`: cierre del drawer móvil; RouterLink es la
 *  única fuente de navegación). */
export interface SidebarEmits {
  'toggle-collapse': []
  close: []
}

/* ------------------------------------------------------------------- shell */

/**
 * Props del `AppShell` (sidebar fija 250px / 75px colapsada, topbar 70px,
 * `main.page-content` según visual-contract §Composición — paso 2, dominio de B).
 * Unión de TopbarProps + SidebarProps con nombres de dominio del shell.
 */
export interface AppShellProps {
  theme?: ShellTheme
  userName?: string
  context?: AuthContext | null
  tenantCode?: string
  contextFormOpen?: boolean
  contextToggleVisible?: boolean
  sidebarCollapsed?: boolean
  mobileSidebarOpen?: boolean
  unitCodes?: string[]
  activeUnitCode?: string | null
  unitSwitchBusy?: boolean
  logoutBusy?: boolean
}

/**
 * Emits del shell: forward directo de TopbarEmits + SidebarEmits con sus
 * nombres actuales (el shell no renombra; App.vue cablea igual que hoy).
 */
export interface AppShellEmits extends TopbarEmits, SidebarEmits {
  'select-unit': [organizationUnitCode: string]
}

/** Props/emits de UnitSwitcher; los códigos proceden del contexto validado. */
export interface UnitSwitcherProps {
  unitCodes: string[]
  activeUnitCode: string | null
  busy: boolean
  /** Nombre de la unidad por código, cuando el contexto lo expone. */
  unitNames?: Record<string, string>
  /** Segundos restantes del enfriamiento por 429; 0 o ausente = sin espera. */
  cooldownSeconds?: number
}

export interface UnitSwitcherEmits {
  'select-unit': [organizationUnitCode: string]
}

/**
 * Slots del shell. `default` es el contenido de página (paso 5: `<RouterView/>`
 * desde App.vue). `sidebar`/`topbar` son opcionales: si el padre los pasa,
 * inyecta los componentes locales y el shell solo aporta el layout DS; si no,
 * el shell renderiza su propia topbar/sidebar.
 */
export interface AppShellSlots {
  default: () => VNode[]
  sidebar?: () => VNode[]
  topbar?: () => VNode[]
}

/* ------------------------------------------------- componentes de estado */

/** Tono del mensaje de estado (StateMessage). Default del componente: 'info'. */
export const MESSAGE_TONE = {
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger',
} as const

export type MessageTone = (typeof MESSAGE_TONE)[keyof typeof MESSAGE_TONE]

/** Props de `StateMessage` (`title`/`message` requeridos; actionLabel default ''). */
export interface StateMessageProps {
  title: string
  message: string
  tone?: MessageTone
  actionLabel?: string
}

export interface StateMessageEmits {
  action: []
}

/**
 * Props de la captura manual de tenant — única vía de contexto en esta fase
 * (plan §3: sin ruta `/contexto`, sin storage, sin login inventado).
 * `tenantCode` es `defineModel<string>('tenantCode', { default: '' })` en el
 * componente actual; en plantillas se enlaza con `v-model:tenant-code`.
 */
export interface ConnectionFormProps {
  tenantCode?: string
  busy?: boolean
}

export interface ConnectionFormEmits {
  submit: []
  'update:tenantCode': [value: string]
}
