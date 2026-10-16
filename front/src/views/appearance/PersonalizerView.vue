<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAppearanceStore } from '../../stores/appearance'
import { useSessionStore } from '../../stores/session'
import {
  ensurePreviewFontLinks,
  registerPreviewIconCollections,
} from '../../features/appearance/preview-assets'
import { ROUTE_NAMES } from '../../router/routes'
import {
  DESIGN_SYSTEM_APPEARANCE_API_FIELDS,
  DESIGN_SYSTEM_ICON_FAMILY,
  DESIGN_SYSTEM_ICON_FAMILY_MAP,
} from '../../types/appearance'
import type {
  DesignSystemAppearance,
  DesignSystemAppearanceOption,
} from '../../types/appearance'

type AppearanceAxis = keyof DesignSystemAppearance

interface AppearanceErrorIssue {
  readonly field: string
  readonly axis: AppearanceAxis | null
  readonly messages: readonly string[]
}

interface AppearanceErrorPresentation {
  readonly status: number | null
  readonly detail: string | null
  readonly issues: readonly AppearanceErrorIssue[]
  readonly message: string
}

const store = useAppearanceStore()
const session = useSessionStore()
const router = useRouter()

// Salida de la barrera (F5 plan frontend-ux-corrections): patrón literal del
// cierre existente (App.vue handleLogout / ContextLostView): purga local
// inmediata, retorno a login sin esperar el POST, fallo posterior sólo
// acredita purga. No aplica defaults ni bypasea la barrera.
async function handleBarrierLogout(): Promise<void> {
  if (session.logoutBusy) return
  const closing = session.logout()
  try {
    await router.replace({ name: ROUTE_NAMES.LOGIN })
  } catch {
    // Cierre en vuelo tras navegación más nueva: la purga local ya rigió.
  }
  await closing
}

type AppearanceOptions = {
  readonly [Axis in AppearanceAxis]: readonly DesignSystemAppearanceOption<DesignSystemAppearance[Axis]>[]
}

const appearanceOptions: AppearanceOptions = store.options
const panelOpen = shallowRef(true)
const panelElement = shallowRef<HTMLElement | null>(null)
const closeButton = shallowRef<HTMLButtonElement | null>(null)
const fabButton = shallowRef<HTMLButtonElement | null>(null)

const authenticatedRestoreReady = computed(() => (
  store.restoreStatus === 'ready' && store.isAuthenticatedContentReady
))
const canChangeAppearance = computed(() => (
  authenticatedRestoreReady.value && !store.reconciliationRequired
))
const isBusy = computed(() => (
  store.restoreStatus === 'loading'
  || store.saveStatus === 'saving'
  || store.saveStatus === 'resetting'
))
const closeIcon = computed(() => (
  DESIGN_SYSTEM_ICON_FAMILY_MAP.close[store.snapshot.iconfam]
))
const fabIcon = computed(() => (
  DESIGN_SYSTEM_ICON_FAMILY_MAP[panelOpen.value ? 'close' : 'palette'][store.snapshot.iconfam]
))
const fabLabel = computed(() => (panelOpen.value ? 'Cerrar ajustes de tema' : 'Ajustes de tema'))
const resetDisabled = computed(() => (
  !canChangeAppearance.value
  || store.pendingReset
  || store.inFlightKind === 'delete'
))
const saveStatusMessage = computed(() => {
  switch (store.saveStatus) {
    case 'dirty': return 'Cambios pendientes de guardar.'
    case 'saving': return 'Guardando la apariencia…'
    case 'resetting': return 'Restableciendo la apariencia…'
    case 'saved': return 'Apariencia guardada.'
    case 'error': return 'El último cambio no está confirmado.'
    case 'idle': return ''
  }
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function axisForApiField(field: string): AppearanceAxis | null {
  const axes = Object.keys(DESIGN_SYSTEM_APPEARANCE_API_FIELDS) as AppearanceAxis[]
  return axes.find((axis) => DESIGN_SYSTEM_APPEARANCE_API_FIELDS[axis] === field) ?? null
}

function presentError(error: unknown, operation: 'restauración' | 'guardado'): AppearanceErrorPresentation {
  const record = isRecord(error) ? error : null
  const payload = record && isRecord(record.payload) ? record.payload : null
  const status = record && typeof record.status === 'number' ? record.status : null
  const detail = record && typeof record.detail === 'string'
    ? record.detail
    : payload && typeof payload.detail === 'string'
      ? payload.detail
      : null
  const issues: AppearanceErrorIssue[] = []

  if (payload) {
    for (const [field, value] of Object.entries(payload)) {
      if (field === 'detail') continue
      const messages = (Array.isArray(value) ? value : [value])
        .filter((message): message is string => typeof message === 'string')
      if (messages.length === 0) continue
      issues.push({ field, axis: axisForApiField(field), messages })
    }
  }

  let message = `No se pudo confirmar la ${operation}.`
  if (status === 400) message = 'El servidor rechazó los valores enviados.'
  if (status === 403) {
    message = 'El servidor rechazó la operación (403). Vuelve a intentarlo; si el problema continúa, revisa el contexto.'
  }
  if (status !== null && status !== 400 && status !== 403) {
    message = `No se pudo confirmar la ${operation} (HTTP ${status}). Vuelve a intentarlo.`
  }

  return { status, detail, issues, message }
}

const restoreError = computed(() => presentError(store.restoreError, 'restauración'))
const saveError = computed(() => presentError(store.saveError, 'guardado'))
const restoreSurfaceError = computed(() => (
  store.restoreStatus === 'error' ? restoreError.value : saveError.value
))

function selectAxis<Axis extends AppearanceAxis>(
  axis: Axis,
  value: DesignSystemAppearance[Axis],
  event: MouseEvent,
): void {
  if (!canChangeAppearance.value) return
  if (!store.previewAxis(axis, value)) return
  const button = event.currentTarget
  if (button instanceof HTMLButtonElement) button.focus()
}

// Confirmación en el sitio para el restablecimiento (sin window.confirm): el
// botón pide confirmación y la ofrece en el mismo pie del panel.
const resetConfirming = shallowRef(false)

function requestReset(): void {
  if (resetDisabled.value) return
  resetConfirming.value = true
}

function confirmReset(): void {
  resetConfirming.value = false
  if (!resetDisabled.value) store.reset()
}

function cancelReset(): void {
  resetConfirming.value = false
}

function handleRadioKeydown(event: KeyboardEvent): void {
  const group = event.currentTarget
  if (!(group instanceof HTMLElement) || !(event.target instanceof HTMLElement)) return

  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
  const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
  if (!forward && !backward && event.key !== 'Home' && event.key !== 'End') return

  const radios = Array.from(group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'))
  if (radios.length === 0) return
  event.preventDefault()

  let selectedIndex = radios.findIndex((radio) => radio.getAttribute('aria-checked') === 'true')
  if (selectedIndex < 0) selectedIndex = 0

  if (forward) selectedIndex = (selectedIndex + 1) % radios.length
  else if (backward) selectedIndex = (selectedIndex - 1 + radios.length) % radios.length
  else if (event.key === 'Home') selectedIndex = 0
  else selectedIndex = radios.length - 1

  const nextRadio = radios[selectedIndex]
  nextRadio.focus()
  nextRadio.click()
}

function setPanelOpen(open: boolean): void {
  if (panelOpen.value === open) return
  const returnFocus = !open && panelElement.value?.contains(document.activeElement)
  panelOpen.value = open
  if (!open) resetConfirming.value = false

  if (open) {
    void nextTick(() => closeButton.value?.focus({ preventScroll: true }))
  } else if (returnFocus) {
    void nextTick(() => fabButton.value?.focus({ preventScroll: true }))
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && panelOpen.value) setPanelOpen(false)
}

function retryRestore(): void {
  if (store.restoreStatus === 'error' && !store.reconciliationRequired) {
    void store.retryRestore()
  }
}

function reconcileAppearance(): void {
  if (store.reconciliationRequired && !store.mutationInFlight) {
    void store.reconcile()
  }
}

function retryPendingAppearanceMutation(): void {
  if (!store.canRetryPendingMutation || isBusy.value || store.mutationInFlight) return
  store.retryPendingMutation()
}

function retryRestoreSurface(): void {
  if (store.reconciliationRequired) {
    reconcileAppearance()
    return
  }
  retryRestore()
}

onMounted(() => {
  ensurePreviewFontLinks()
  registerPreviewIconCollections()
  document.addEventListener('keydown', handleDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <div class="personalizer-view">
    <header class="page-head">
      <div>
        <h1 class="page-title">Personalizador</h1>
        <nav class="breadcrumb" aria-label="Ruta de navegación">
          <RouterLink :to="{ name: ROUTE_NAMES.DASHBOARD }">Inicio</RouterLink>
          <iconify-icon
            :icon="DESIGN_SYSTEM_ICON_FAMILY_MAP['arrow-right'][store.snapshot.iconfam]"
            width="12"
            aria-hidden="true"
          ></iconify-icon>
          <span class="muted" aria-current="page">Personalizador</span>
        </nav>
      </div>
    </header>

    <button
      ref="fabButton"
      class="tcf-fab"
      type="button"
      aria-haspopup="dialog"
      aria-controls="tcfPanel"
      :aria-expanded="panelOpen"
      :aria-hidden="panelOpen"
      :inert="panelOpen || undefined"
      :aria-label="fabLabel"
      :title="fabLabel"
      @click="setPanelOpen(!panelOpen)"
    >
      <iconify-icon :icon="fabIcon" width="22" aria-hidden="true"></iconify-icon>
    </button>

    <!-- El panel es position:fixed z-index:1045, pero .page-content crea un
         stacking context (position:relative z-index:1) que lo encierra; el
         .topbar (z-index:50) le gana. El DS monta el panel a nivel body: se
         teletransporta para que compita en el root sin tocar CSS ni z-index. -->
    <Teleport to="body">
      <aside
        id="tcfPanel"
        ref="panelElement"
        class="tcf-panel"
        :class="{ 'is-open': panelOpen }"
        role="dialog"
        aria-label="Ajustes de tema"
        :aria-hidden="!panelOpen"
        :aria-busy="isBusy"
      >
        <header class="tcf-head">
          <div>
            <h2 class="tcf-title">Apariencia</h2>
            <p class="tcf-subtitle">Paleta de acento y fondo</p>
          </div>
          <button
            ref="closeButton"
            class="tcf-close"
            type="button"
            aria-label="Cerrar ajustes de tema"
            @click="setPanelOpen(false)"
          >
            <iconify-icon :icon="closeIcon" width="18" aria-hidden="true"></iconify-icon>
          </button>
        </header>

        <div class="tcf-body" :aria-busy="isBusy">
          <section v-if="store.restoreStatus === 'loading'" class="tcf-group" role="status" aria-live="polite">
            <h3 class="tcf-label">Cargando la apariencia</h3>
            <p class="tcf-note">Recuperando tus preferencias guardadas.</p>
          </section>

          <section v-else-if="store.restoreStatus === 'error'" class="tcf-group" role="alert" aria-labelledby="appearanceRestoreErrorTitle">
            <h3 id="appearanceRestoreErrorTitle" class="tcf-label">
              {{ store.reconciliationRequired ? 'El estado guardado no se pudo reconciliar' : 'No se pudo restaurar la apariencia' }}
            </h3>
            <p class="tcf-note">{{ restoreSurfaceError.message }}</p>
            <p v-if="restoreSurfaceError.detail" class="tcf-note">{{ restoreSurfaceError.detail }}</p>
            <ul v-if="restoreSurfaceError.issues.length" class="tcf-note">
              <li v-for="issue in restoreSurfaceError.issues" :key="issue.field">
                <strong>{{ issue.axis ? `${issue.axis} · ` : '' }}{{ issue.field }}</strong>
                <span v-for="(message, index) in issue.messages" :key="`${issue.field}-${index}`"> — {{ message }}</span>
              </li>
            </ul>
            <p v-if="restoreSurfaceError.status !== null" class="tcf-note">HTTP {{ restoreSurfaceError.status }}</p>
            <!-- Jerarquía de salidas (barrido UX 2026-10-16): el reintento es la
                 acción primaria; revisar el contexto es un enlace subrayado; cerrar
                 sesión queda separado y en tono de peligro. Sin bypass ni defaults. -->
            <div class="appearance-error-actions">
              <button
                class="btn btn-primary"
                type="button"
                :disabled="store.principalUserId === null || store.mutationInFlight"
                :aria-busy="store.mutationInFlight"
                @click="retryRestoreSurface"
              >
                {{ store.reconciliationRequired ? 'Consultar de nuevo el estado guardado' : 'Reintentar restauración' }}
              </button>
            </div>
            <RouterLink class="appearance-context-link" :to="{ name: ROUTE_NAMES.CONTEXT }">Revisar el contexto</RouterLink>
            <div class="appearance-error-danger">
              <button
                class="btn btn-danger"
                type="button"
                :disabled="session.logoutBusy"
                :aria-busy="session.logoutBusy"
                @click="handleBarrierLogout"
              >
                {{ session.logoutBusy ? 'Cerrando sesión…' : 'Cerrar sesión' }}
              </button>
            </div>
          </section>

          <section v-else-if="!authenticatedRestoreReady" class="tcf-group" role="status" aria-live="polite">
            <h3 class="tcf-label">Apariencia no disponible</h3>
            <p class="tcf-note">Inicia sesión y elige una institución para personalizar la apariencia.</p>
          </section>

          <template v-else>
            <p v-if="saveStatusMessage" class="tcf-note" role="status" aria-live="polite">{{ saveStatusMessage }}</p>

            <section v-if="store.reconciliationRequired" class="tcf-group" role="alert" aria-labelledby="appearanceReconcileTitle">
              <h3 id="appearanceReconcileTitle" class="tcf-label">El estado guardado necesita reconciliación</h3>
              <p class="tcf-note">{{ saveError.message }}</p>
              <p v-if="saveError.detail" class="tcf-note">{{ saveError.detail }}</p>
              <ul v-if="saveError.issues.length" class="tcf-note">
                <li v-for="issue in saveError.issues" :key="issue.field">
                  <strong>{{ issue.axis ? `${issue.axis} · ` : '' }}{{ issue.field }}</strong>
                  <span v-for="(message, index) in issue.messages" :key="`${issue.field}-${index}`"> — {{ message }}</span>
                </li>
              </ul>
              <p v-if="saveError.status !== null" class="tcf-note">HTTP {{ saveError.status }}</p>
              <div class="appearance-error-actions">
                <button
                  class="btn btn-primary"
                  type="button"
                  :disabled="store.principalUserId === null || store.mutationInFlight"
                  :aria-busy="store.mutationInFlight"
                  @click="reconcileAppearance"
                >
                  Consultar de nuevo el estado guardado
                </button>
                <button
                  class="btn btn-outline-primary"
                  type="button"
                  :disabled="!store.canRetryPendingMutation || isBusy || store.mutationInFlight"
                  :aria-busy="isBusy || store.mutationInFlight"
                  @click="retryPendingAppearanceMutation"
                >
                  Reintentar operación pendiente
                </button>
              </div>
              <RouterLink class="appearance-context-link" :to="{ name: ROUTE_NAMES.CONTEXT }">Revisar el contexto</RouterLink>
              <div class="appearance-error-danger">
                <button
                  class="btn btn-danger"
                  type="button"
                  :disabled="session.logoutBusy"
                  :aria-busy="session.logoutBusy"
                  @click="handleBarrierLogout"
                >
                  {{ session.logoutBusy ? 'Cerrando sesión…' : 'Cerrar sesión' }}
                </button>
              </div>
            </section>

            <section class="tcf-group" aria-labelledby="tcfAccentLabel">
              <h3 id="tcfAccentLabel" class="tcf-label">Acento</h3>
              <div
                class="tcf-swatches"
                role="radiogroup"
                aria-labelledby="tcfAccentLabel"
                data-tcf-group="accent"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.accent"
                  :key="option.value"
                  class="tcf-swatch"
                  :class="`tcf-swatch--${option.value}`"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.accent === option.value"
                  :aria-label="option.accessibleLabel ?? option.label"
                  :tabindex="store.snapshot.accent === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('accent', option.value, $event)"
                >
                  <span class="tcf-swatchname" aria-hidden="true">{{ option.label }}</span>
                </button>
              </div>
            </section>

            <section class="tcf-group" aria-labelledby="tcfBgLabel">
              <h3 id="tcfBgLabel" class="tcf-label">Fondo</h3>
              <div
                class="tcf-swatches tcf-swatches--bg"
                role="radiogroup"
                aria-labelledby="tcfBgLabel"
                data-tcf-group="bg"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.bg"
                  :key="option.value"
                  class="tcf-bgcard"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.bg === option.value"
                  :aria-label="option.accessibleLabel ?? option.label"
                  :tabindex="store.snapshot.bg === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('bg', option.value, $event)"
                >
                  <span class="tcf-bgprev" :class="`tcf-bgprev--${option.value}`" aria-hidden="true"><i></i><i></i></span>
                  <span class="tcf-bgname">{{ option.label }}</span>
                </button>
              </div>
              <p class="tcf-note">Los tintes se aplican al tema oscuro. El tema claro mantiene sus propios neutros.</p>
            </section>

            <section class="tcf-group" aria-labelledby="tcfFontLabel">
              <h3 id="tcfFontLabel" class="tcf-label">Tipografía</h3>
              <div
                class="tcf-fonts"
                role="radiogroup"
                aria-labelledby="tcfFontLabel"
                data-tcf-group="font"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.font"
                  :key="option.value"
                  class="tcf-fontcard"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.font === option.value"
                  :aria-label="option.accessibleLabel ?? option.label"
                  :tabindex="store.snapshot.font === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('font', option.value, $event)"
                >
                  <span class="tcf-fontprev" :class="`tcf-fontprev--${option.value}`" aria-hidden="true">
                    <span class="tcf-fontaa">Aa</span>
                    <span class="tcf-fontsample">Sphinx of black quartz</span>
                    <span class="tcf-fontcheck"></span>
                  </span>
                  <span class="tcf-fontmeta">
                    <span class="tcf-fontname">{{ option.label }}</span>
                    <span class="tcf-fonttag">{{ option.category }}</span>
                  </span>
                </button>
              </div>
            </section>

            <section class="tcf-group" aria-labelledby="tcfRadiusLabel">
              <h3 id="tcfRadiusLabel" class="tcf-label">Radio de esquina</h3>
              <div
                class="tcf-radius"
                role="radiogroup"
                aria-labelledby="tcfRadiusLabel"
                data-tcf-group="radius"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.radius"
                  :key="option.value"
                  class="tcf-radiuscard"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.radius === option.value"
                  :aria-label="`${option.label} — radio de esquina`"
                  :tabindex="store.snapshot.radius === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('radius', option.value, $event)"
                >
                  <span class="tcf-radiusprev" :class="`tcf-radiusprev--${option.value}`" aria-hidden="true"></span>
                  <span class="tcf-radiusname">{{ option.label }}</span>
                  <span class="tcf-radiusdesc">{{ option.description }}</span>
                </button>
              </div>
            </section>

            <section class="tcf-group" aria-labelledby="tcfIconfamLabel">
              <h3 id="tcfIconfamLabel" class="tcf-label">Familia de iconos</h3>
              <div
                class="tcf-iconfams"
                role="radiogroup"
                aria-labelledby="tcfIconfamLabel"
                data-tcf-group="iconfam"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.iconfam"
                  :key="option.value"
                  class="tcf-famcard"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.iconfam === option.value"
                  :aria-label="option.accessibleLabel ?? option.label"
                  :tabindex="store.snapshot.iconfam === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('iconfam', option.value, $event)"
                >
                  <span class="tcf-famprev" :class="`tcf-famprev--${option.value}`" aria-hidden="true">
                    <iconify-icon
                      v-for="sample in option.samples ?? []"
                      :key="sample"
                      class="tcf-famsample"
                      :icon="sample"
                      width="20"
                    ></iconify-icon>
                    <span class="tcf-famcheck"></span>
                  </span>
                  <span class="tcf-famname">{{ option.label }}</span>
                  <span class="tcf-famtag">{{ option.description }}</span>
                </button>
              </div>
              <p
                class="tcf-note tcf-attr"
                :hidden="store.snapshot.iconfam !== DESIGN_SYSTEM_ICON_FAMILY.FA7_SOLID"
              >
                {{ store.iconFamilyAttribution }}
              </p>
            </section>

            <section class="tcf-group" aria-labelledby="tcfAmbientLabel">
              <h3 id="tcfAmbientLabel" class="tcf-label">Fondo ambiental</h3>
              <div
                class="tcf-ambients"
                role="radiogroup"
                aria-labelledby="tcfAmbientLabel"
                data-tcf-group="ambient"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.ambient"
                  :key="option.value"
                  class="tcf-ambientcard"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.ambient === option.value"
                  :aria-label="option.accessibleLabel ?? option.label"
                  :tabindex="store.snapshot.ambient === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('ambient', option.value, $event)"
                >
                  <span class="tcf-ambientprev" :class="`tcf-ambientprev--${option.value}`" aria-hidden="true"></span>
                  <span class="tcf-ambientname">{{ option.label }}</span>
                  <span class="tcf-ambientdesc">{{ option.description }}</span>
                </button>
              </div>
            </section>

            <section class="tcf-group" aria-labelledby="tcfAmbcolorLabel">
              <h3 id="tcfAmbcolorLabel" class="tcf-label">Color ambiental</h3>
              <div
                class="tcf-ambcolors"
                role="radiogroup"
                aria-labelledby="tcfAmbcolorLabel"
                data-tcf-group="ambcolor"
                @keydown="handleRadioKeydown"
              >
                <button
                  v-for="option in appearanceOptions.ambcolor"
                  :key="option.value"
                  class="tcf-ambcolorcard"
                  type="button"
                  role="radio"
                  :aria-checked="store.snapshot.ambcolor === option.value"
                  :aria-label="option.accessibleLabel ?? option.label"
                  :tabindex="store.snapshot.ambcolor === option.value ? 0 : -1"
                  :data-tcf-value="option.value"
                  :disabled="!canChangeAppearance"
                  @click="selectAxis('ambcolor', option.value, $event)"
                >
                  <span class="tcf-ambcolorprev" :class="`tcf-ambcolorprev--${option.value}`" aria-hidden="true"></span>
                  <span class="tcf-ambcolorname">{{ option.label }}</span>
                </button>
              </div>
            </section>
          </template>
        </div>

        <footer v-if="authenticatedRestoreReady" class="tcf-foot">
          <button
            v-if="!resetConfirming"
            class="tcf-reset"
            type="button"
            :disabled="resetDisabled"
            :aria-busy="store.saveStatus === 'resetting' || store.inFlightKind === 'delete'"
            @click="requestReset"
          >
            Restablecer valores por defecto
          </button>
          <div v-else class="appearance-confirm" role="group" aria-label="Confirmar restablecimiento">
            <p class="tcf-note">Se restablecerán los valores por defecto del Design System.</p>
            <div class="appearance-confirm-actions">
              <button
                class="btn btn-danger"
                type="button"
                :disabled="resetDisabled"
                :aria-busy="store.saveStatus === 'resetting' || store.inFlightKind === 'delete'"
                @click="confirmReset"
              >
                Restablecer
              </button>
              <button class="btn btn-outline-secondary" type="button" @click="cancelReset">Cancelar</button>
            </div>
          </div>
        </footer>
      </aside>
    </Teleport>
  </div>
</template>

<style scoped>
/* Jerarquía de acciones del error y del restablecimiento dentro del panel.
   Tokens del DS (--primary-text, --border); sin valores nuevos de color. */
.appearance-error-actions,
.appearance-confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.appearance-error-actions .btn,
.appearance-confirm-actions .btn {
  display: block;
  width: 100%;
}

.appearance-context-link {
  display: inline-block;
  margin-top: 8px;
  color: var(--primary-text);
  font-size: 12.5px;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.appearance-error-danger {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.appearance-error-danger .btn {
  display: block;
  width: 100%;
}
</style>
