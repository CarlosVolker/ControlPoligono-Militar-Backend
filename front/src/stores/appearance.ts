import { computed, onScopeDispose, readonly, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  getDesignSystemAppearance,
  putDesignSystemAppearance,
  resetDesignSystemAppearance,
} from '../api/appearance'
import { SESSION_STATUS } from '../types/session'
import type { SessionIdentity } from '../types/session'
import { useSessionStore } from './session'
import {
  DEFAULT_DESIGN_SYSTEM_APPEARANCE,
  DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES,
  DESIGN_SYSTEM_APPEARANCE_OPTIONS,
  DESIGN_SYSTEM_FONT_OPTIONS,
  DESIGN_SYSTEM_ICON_CONCEPTS,
  DESIGN_SYSTEM_ICON_FAMILY_ATTRIBUTION,
  DESIGN_SYSTEM_ICON_FAMILY,
  DESIGN_SYSTEM_ICON_FAMILY_MAP,
  DESIGN_SYSTEM_ICON_FAMILY_OPTIONS,
  getDesignSystemAppearanceDomAttributeValues,
  isDesignSystemAccent,
  isDesignSystemAmbcolor,
  isDesignSystemAmbient,
  isDesignSystemAppearance,
  isDesignSystemBg,
  isDesignSystemFont,
  isDesignSystemIconFamily,
  isDesignSystemRadius,
  isDesignSystemTheme,
} from '../types/appearance'
import type {
  DesignSystemAppearance,
  DesignSystemIconConcept,
} from '../types/appearance'

const RESTORE_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const

type RestoreStatus = (typeof RESTORE_STATUS)[keyof typeof RESTORE_STATUS]

const SAVE_STATUS = {
  IDLE: 'idle',
  DIRTY: 'dirty',
  SAVING: 'saving',
  RESETTING: 'resetting',
  SAVED: 'saved',
  ERROR: 'error',
} as const

type SaveStatus = (typeof SAVE_STATUS)[keyof typeof SAVE_STATUS]
type AppearanceAxis = keyof DesignSystemAppearance
type PrincipalId = SessionIdentity['id_usuario']
type MutationKind = 'put' | 'delete'

const SAVE_DEBOUNCE_MS = 300

/**
 * Integration is intentionally external to this store: the DS stylesheet must
 * be loaded last. Its ambient engine is not bundled or imported here. The DS
 * app.js listener for darkone:themechange also persists the theme in the
 * prototype, so this store leaves that event to an adapted integration owner.
 */
export const DESIGN_SYSTEM_APPEARANCE_EFFECT_REQUIREMENTS = {
  stylesheet: '../../Inume Design System/assets/css/theme-customizer.css',
  stylesheetOrder: 'last-in-head',
  ambientEngine: '../../Inume Design System/assets/js/app.js',
  ambientEngineEvent: 'darkone:themechange',
  ambientEngineEventDispatchedByStore: false,
  iconMap: 'DESIGN_SYSTEM_ICON_FAMILY_MAP (44 concepts × 7 families)',
} as const

interface QueuedSnapshot {
  readonly snapshot: DesignSystemAppearance
  readonly principalGeneration: number
  readonly intentGeneration: number
  readonly snapshotRevision: number
}

interface PendingMutationIntent extends QueuedSnapshot {
  readonly kind: MutationKind
}

interface RestoreTicket {
  readonly principalId: PrincipalId
  readonly principalGeneration: number
  readonly intentGeneration: number
  readonly attempt: number
  readonly controller: AbortController
  readonly promise: Promise<boolean>
}

interface MutationTicket {
  readonly kind: MutationKind
  readonly principalId: PrincipalId
  readonly principalGeneration: number
  readonly intentGeneration: number
  readonly snapshotRevision: number
  readonly attempt: number
  readonly controller: AbortController
  readonly snapshot: DesignSystemAppearance | null
}

interface OwnedHtmlAttribute {
  readonly previousValue: string | null
  appliedValue: string | null
}

interface OwnedIconAttribute {
  originalValue: string
  appliedValue: string
}

interface DefaultIconAlias {
  readonly name: string
  readonly concept: DesignSystemIconConcept
}

function cloneAppearance(appearance: DesignSystemAppearance): DesignSystemAppearance {
  return {
    theme: appearance.theme,
    accent: appearance.accent,
    bg: appearance.bg,
    font: appearance.font,
    radius: appearance.radius,
    iconfam: appearance.iconfam,
    ambient: appearance.ambient,
    ambcolor: appearance.ambcolor,
  }
}

function sameAppearance(
  left: DesignSystemAppearance | null,
  right: DesignSystemAppearance | null,
): boolean {
  return left !== null
    && right !== null
    && left.theme === right.theme
    && left.accent === right.accent
    && left.bg === right.bg
    && left.font === right.font
    && left.radius === right.radius
    && left.iconfam === right.iconfam
    && left.ambient === right.ambient
    && left.ambcolor === right.ambcolor
}

function isAxisValue(axis: AppearanceAxis, value: unknown): boolean {
  switch (axis) {
    case 'theme': return isDesignSystemTheme(value)
    case 'accent': return isDesignSystemAccent(value)
    case 'bg': return isDesignSystemBg(value)
    case 'font': return isDesignSystemFont(value)
    case 'radius': return isDesignSystemRadius(value)
    case 'iconfam': return isDesignSystemIconFamily(value)
    case 'ambient': return isDesignSystemAmbient(value)
    case 'ambcolor': return isDesignSystemAmbcolor(value)
  }
  return false
}

const DEFAULT_ICON_ALIASES = [
  { name: 'solar:alt-arrow-down-outline', concept: 'caret-down' },
  { name: 'solar:logout-3-outline', concept: 'logout' },
  { name: 'solar:bell-bing-outline', concept: 'bell' },
] as const satisfies readonly DefaultIconAlias[]

function makeIconReverseMap(): ReadonlyMap<string, DesignSystemIconConcept> {
  const reverse = new Map<string, DesignSystemIconConcept>()

  for (const concept of DESIGN_SYSTEM_ICON_CONCEPTS) {
    const defaultName = DESIGN_SYSTEM_ICON_FAMILY_MAP[concept][DESIGN_SYSTEM_ICON_FAMILY.DEFAULT]
    if (!reverse.has(defaultName)) reverse.set(defaultName, concept)
  }

  for (const alias of DEFAULT_ICON_ALIASES) {
    if (!reverse.has(alias.name)) reverse.set(alias.name, alias.concept)
  }

  for (const family of DESIGN_SYSTEM_ICON_FAMILY_OPTIONS) {
    if (family.value === DESIGN_SYSTEM_ICON_FAMILY.DEFAULT) continue
    for (const concept of DESIGN_SYSTEM_ICON_CONCEPTS) {
      const name = DESIGN_SYSTEM_ICON_FAMILY_MAP[concept][family.value]
      if (!reverse.has(name)) reverse.set(name, concept)
    }
  }

  return reverse
}

const ICON_REVERSE_MAP = makeIconReverseMap()
const DEFAULT_ICON_NAMES = new Set(
  [
    ...DESIGN_SYSTEM_ICON_CONCEPTS.map(
      (concept) => DESIGN_SYSTEM_ICON_FAMILY_MAP[concept][DESIGN_SYSTEM_ICON_FAMILY.DEFAULT],
    ),
    ...DEFAULT_ICON_ALIASES.map((alias) => alias.name),
  ],
)
type DefaultIconName = typeof DEFAULT_ICON_NAMES extends ReadonlySet<infer Name>
  ? Name
  : never

function isDefaultIconName(name: string): name is DefaultIconName {
  for (const defaultName of DEFAULT_ICON_NAMES) {
    if (defaultName === name) return true
  }
  return false
}

export const useAppearanceStore = defineStore('appearance', () => {
  const session = useSessionStore()
  const snapshot = shallowRef<DesignSystemAppearance>(
    cloneAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE),
  )
  const persistedSnapshot = shallowRef<DesignSystemAppearance | null>(null)
  const restoreStatus = shallowRef<RestoreStatus>(RESTORE_STATUS.READY)
  const saveStatus = shallowRef<SaveStatus>(SAVE_STATUS.IDLE)
  const restoreError = shallowRef<unknown | null>(null)
  const saveError = shallowRef<unknown | null>(null)
  const principalUserId = shallowRef<PrincipalId | null>(null)
  const principalGeneration = shallowRef(0)
  const intentGeneration = shallowRef(0)
  const snapshotRevision = shallowRef(0)
  const latestAttemptId = shallowRef(0)
  const mutationInFlight = shallowRef(false)
  const inFlightKind = shallowRef<MutationKind | null>(null)
  const pendingReset = shallowRef(false)
  const pendingSnapshotCount = shallowRef(0)
  const reconciliationRequired = shallowRef(false)
  const pendingIntent = shallowRef<PendingMutationIntent | null>(null)
  const retryIntentAvailable = shallowRef(false)

  let currentRestore: RestoreTicket | null = null
  let currentMutation: MutationTicket | null = null
  let queuedSnapshot: QueuedSnapshot | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let stopSessionSubscription: (() => void) | null = null
  let iconObserver: MutationObserver | null = null
  let disposed = false
  const ownedHtmlAttributes = new Map<string, OwnedHtmlAttribute>()
  const ownedIconAttributes = new Map<Element, OwnedIconAttribute>()
  const ownedIconMutationCounts = new WeakMap<Element, number>()
  const ownedFontLinks = new Map<string, HTMLLinkElement>()

  const pendingMutationCount = computed(() => (
    Number(pendingReset.value)
    + pendingSnapshotCount.value
    + Number(
      pendingIntent.value !== null
      && pendingSnapshotCount.value === 0
      && !pendingReset.value
      && !mutationInFlight.value,
    )
  ))
  const saved = computed(() => saveStatus.value === SAVE_STATUS.SAVED)
  const isAuthenticatedContentReady = computed(() => {
    const identity = session.identity
    return principalUserId.value !== null
      && restoreStatus.value === RESTORE_STATUS.READY
      && !session.logoutBusy
      && identity !== null
      && identity.id_usuario === principalUserId.value
      && identity.must_change_password === false
  })
  const isTenantContentReady = computed(() => {
    const context = session.context
    return isAuthenticatedContentReady.value
      && session.status === SESSION_STATUS.READY
      && context !== null
      && context.user.id_usuario === principalUserId.value
      && context.user.must_change_password === false
  })
  const canRetryPendingMutation = computed(() => {
    const intent = pendingIntent.value
    return retryIntentAvailable.value
      && intent !== null
      && intent.principalGeneration === principalGeneration.value
      && intent.intentGeneration === intentGeneration.value
      && intent.snapshotRevision === snapshotRevision.value
      && isAuthenticatedContentReady.value
      && !mutationInFlight.value
      && pendingSnapshotCount.value === 0
      && !pendingReset.value
      && persistedSnapshot.value !== null
      && !sameAppearance(persistedSnapshot.value, intent.snapshot)
  })

  function nextAttempt(): number {
    latestAttemptId.value += 1
    return latestAttemptId.value
  }

  function clearDebounce(): void {
    if (debounceTimer === null) return
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  function setOwnedHtmlAttribute(name: string, value: string | undefined): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (!root) return

    let ownership = ownedHtmlAttributes.get(name)
    if (!ownership) {
      ownership = { previousValue: root.getAttribute(name), appliedValue: null }
      ownedHtmlAttributes.set(name, ownership)
    }

    if (value === undefined) root.removeAttribute(name)
    else root.setAttribute(name, value)
    ownership.appliedValue = value ?? null
  }

  function ensureFontStylesheet(font: string): void {
    if (!isDesignSystemFont(font) || typeof document === 'undefined' || !document.head) return
    const option = DESIGN_SYSTEM_FONT_OPTIONS.find((item) => item.value === font)
    const sourceUrl = option?.stylesheetUrl
    if (!sourceUrl) return

    const actualUrl = new URL(sourceUrl, document.baseURI).href
    if (ownedFontLinks.has(actualUrl)) return

    for (const existing of document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"][href]',
    )) {
      if (existing.href === actualUrl) return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = actualUrl
    document.head.appendChild(link)
    ownedFontLinks.set(actualUrl, link)
  }

  function remapIcon(icon: Element, family: DesignSystemAppearance['iconfam']): void {
    if (icon.classList.contains('tcf-famsample')) return
    const currentName = icon.getAttribute('icon')
    if (!currentName) return
    if (family === DESIGN_SYSTEM_ICON_FAMILY.DEFAULT && isDefaultIconName(currentName)) {
      return
    }

    const concept = ICON_REVERSE_MAP.get(currentName)
    if (!concept) return
    const nextName = DESIGN_SYSTEM_ICON_FAMILY_MAP[concept][family]
    if (nextName === currentName) return

    const ownership = ownedIconAttributes.get(icon)
    ownedIconAttributes.set(icon, {
      originalValue: ownership?.originalValue ?? currentName,
      appliedValue: nextName,
    })
    ownedIconMutationCounts.set(icon, (ownedIconMutationCounts.get(icon) ?? 0) + 1)
    icon.setAttribute('icon', nextName)
  }

  function remapIconsInNode(node: Node, family: DesignSystemAppearance['iconfam']): void {
    if (typeof Element === 'undefined' || !(node instanceof Element)) return
    if (node.matches('iconify-icon:not(.tcf-famsample)')) remapIcon(node, family)
    for (const icon of node.querySelectorAll('iconify-icon:not(.tcf-famsample)')) {
      remapIcon(icon, family)
    }
  }

  function forgetOwnedIconsInNode(node: Node): void {
    if (typeof Element === 'undefined' || !(node instanceof Element)) return
    if (node.matches('iconify-icon')) ownedIconAttributes.delete(node)
    for (const icon of node.querySelectorAll('iconify-icon')) {
      ownedIconAttributes.delete(icon)
    }
  }

  function applyIconFamily(family: DesignSystemAppearance['iconfam']): void {
    if (typeof document === 'undefined' || !document.documentElement) return
    for (const icon of document.documentElement.querySelectorAll(
      'iconify-icon:not(.tcf-famsample)',
    )) {
      remapIcon(icon, family)
    }
  }

  function installIconObserver(): void {
    if (
      typeof document === 'undefined'
      || !document.documentElement
      || typeof MutationObserver === 'undefined'
      || iconObserver
    ) return

    iconObserver = new MutationObserver((records) => {
      const family = snapshot.value.iconfam
      for (const record of records) {
        if (record.type === 'attributes') {
          if (typeof Element === 'undefined' || !(record.target instanceof Element)) continue
          const ownWrites = ownedIconMutationCounts.get(record.target) ?? 0
          if (ownWrites > 0) {
            if (ownWrites === 1) ownedIconMutationCounts.delete(record.target)
            else ownedIconMutationCounts.set(record.target, ownWrites - 1)
            continue
          }
          const ownership = ownedIconAttributes.get(record.target)
          if (ownership && record.oldValue === ownership.appliedValue) {
            ownedIconAttributes.delete(record.target)
          }
          remapIcon(record.target, family)
          continue
        }
        for (const node of record.removedNodes) {
          if (!node.isConnected) forgetOwnedIconsInNode(node)
        }
        for (const node of record.addedNodes) remapIconsInNode(node, family)
      }
    })
    iconObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['icon'],
    })
  }

  function applyAppearance(appearance: DesignSystemAppearance): void {
    if (!isDesignSystemAppearance(appearance) || typeof document === 'undefined') return

    ensureFontStylesheet(appearance.font)
    const attributes = getDesignSystemAppearanceDomAttributeValues(appearance)
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.theme, attributes['data-theme'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.accent, attributes['data-accent'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.bg, attributes['data-bg'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.font, attributes['data-font'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.radius, attributes['data-radius'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.iconfam, attributes['data-iconfam'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.ambient, attributes['data-ambient'])
    setOwnedHtmlAttribute(DESIGN_SYSTEM_APPEARANCE_DOM_ATTRIBUTES.ambcolor, attributes['data-ambcolor'])
    applyIconFamily(appearance.iconfam)
  }

  function cleanupOwnedFontLinks(): void {
    for (const link of ownedFontLinks.values()) link.remove()
    ownedFontLinks.clear()
  }

  function cleanupOwnedDom(): void {
    iconObserver?.disconnect()
    iconObserver = null

    for (const [icon, ownership] of ownedIconAttributes) {
      if (icon.getAttribute('icon') !== ownership.appliedValue) continue
      icon.setAttribute('icon', ownership.originalValue)
    }
    ownedIconAttributes.clear()

    if (typeof document !== 'undefined' && document.documentElement) {
      for (const [name, ownership] of ownedHtmlAttributes) {
        const currentValue = document.documentElement.getAttribute(name)
        if (currentValue !== ownership.appliedValue) continue
        if (ownership.previousValue === null) document.documentElement.removeAttribute(name)
        else document.documentElement.setAttribute(name, ownership.previousValue)
      }
    }
    ownedHtmlAttributes.clear()

    cleanupOwnedFontLinks()
  }

  function isCurrentRestore(ticket: RestoreTicket): boolean {
    return !disposed
      && currentRestore === ticket
      && !ticket.controller.signal.aborted
      && latestAttemptId.value === ticket.attempt
      && principalUserId.value === ticket.principalId
      && principalGeneration.value === ticket.principalGeneration
      && intentGeneration.value === ticket.intentGeneration
  }

  function isCurrentMutation(ticket: MutationTicket): boolean {
    return !disposed
      && currentMutation === ticket
      && !ticket.controller.signal.aborted
      && latestAttemptId.value === ticket.attempt
      && principalUserId.value === ticket.principalId
      && principalGeneration.value === ticket.principalGeneration
  }

  function rememberPendingIntent(
    kind: MutationKind,
    appearance: DesignSystemAppearance,
  ): void {
    pendingIntent.value = {
      kind,
      snapshot: cloneAppearance(appearance),
      principalGeneration: principalGeneration.value,
      intentGeneration: intentGeneration.value,
      snapshotRevision: snapshotRevision.value,
    }
    retryIntentAvailable.value = false
  }

  function intentMatchesMutation(ticket: MutationTicket, kind: MutationKind): boolean {
    const intent = pendingIntent.value
    const ticketSnapshot = ticket.snapshot ?? DEFAULT_DESIGN_SYSTEM_APPEARANCE
    return intent !== null
      && intent.kind === kind
      && intent.principalGeneration === ticket.principalGeneration
      && intent.intentGeneration === ticket.intentGeneration
      && intent.snapshotRevision === ticket.snapshotRevision
      && sameAppearance(intent.snapshot, ticketSnapshot)
  }

  function setRestoredSnapshot(
    ticket: RestoreTicket,
    restored: DesignSystemAppearance,
    reconciliation: boolean,
  ): boolean {
    if (!isCurrentRestore(ticket) || !isDesignSystemAppearance(restored)) return false

    const canonical = cloneAppearance(restored)
    persistedSnapshot.value = canonical
    reconciliationRequired.value = false
    restoreError.value = null
    saveError.value = null

    const intent = pendingIntent.value
    const currentIntent = reconciliation
      && intent !== null
      && intent.principalGeneration === ticket.principalGeneration
      && intent.intentGeneration === ticket.intentGeneration
      && intent.snapshotRevision === snapshotRevision.value

    if (currentIntent && intent) {
      clearPendingSnapshot()
      pendingReset.value = false
      if (sameAppearance(canonical, intent.snapshot)) {
        pendingIntent.value = null
        retryIntentAvailable.value = false
        snapshot.value = cloneAppearance(canonical)
        applyAppearance(snapshot.value)
        saveStatus.value = SAVE_STATUS.SAVED
      } else {
        snapshot.value = cloneAppearance(intent.snapshot)
        applyAppearance(snapshot.value)
        saveStatus.value = SAVE_STATUS.DIRTY
        retryIntentAvailable.value = true
      }
    } else if (!pendingReset.value || !reconciliation) {
      snapshot.value = cloneAppearance(canonical)
      snapshotRevision.value += 1
      applyAppearance(snapshot.value)
      saveStatus.value = SAVE_STATUS.IDLE
    } else {
      saveStatus.value = SAVE_STATUS.DIRTY
    }

    restoreStatus.value = RESTORE_STATUS.READY
    return true
  }

  function startRestore(reconciliation: boolean): Promise<boolean> {
    const principalId = principalUserId.value
    if (principalId === null || disposed) return Promise.resolve(false)
    if (currentRestore) return currentRestore.promise

    const controller = new AbortController()
    const principalGenerationAtStart = principalGeneration.value
    const intentGenerationAtStart = intentGeneration.value
    const attempt = nextAttempt()
    restoreStatus.value = RESTORE_STATUS.LOADING
    restoreError.value = null

    let ticket: RestoreTicket | null = null
    const promise = (async (): Promise<boolean> => {
      try {
        const restored = await getDesignSystemAppearance(controller.signal)
        const activeTicket = ticket
        if (!activeTicket || !isCurrentRestore(activeTicket)) return false
        return setRestoredSnapshot(activeTicket, restored, reconciliation)
      } catch (error: unknown) {
        const activeTicket = ticket
        if (!activeTicket || !isCurrentRestore(activeTicket)) return false
        restoreError.value = error
        restoreStatus.value = RESTORE_STATUS.ERROR
        if (reconciliation) saveStatus.value = SAVE_STATUS.ERROR
        return false
      } finally {
        const activeTicket = ticket
        if (activeTicket && isCurrentRestore(activeTicket)) {
          currentRestore = null
          if (
            !reconciliation
            && restoreStatus.value === RESTORE_STATUS.READY
            && pendingReset.value
          ) {
            void drainQueue()
          }
        }
      }
    })()

    ticket = {
      principalId,
      principalGeneration: principalGenerationAtStart,
      intentGeneration: intentGenerationAtStart,
      attempt,
      controller,
      promise,
    }
    currentRestore = ticket
    return promise
  }

  function clearPendingSnapshot(): void {
    queuedSnapshot = null
    pendingSnapshotCount.value = 0
    clearDebounce()
  }

  function schedulePendingSnapshot(): void {
    if (
      queuedSnapshot === null
      || restoreStatus.value !== RESTORE_STATUS.READY
      || reconciliationRequired.value
      || disposed
    ) return
    clearDebounce()
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void drainQueue()
    }, SAVE_DEBOUNCE_MS)
  }

  function markMutationUncertain(error: unknown, ticket: MutationTicket): void {
    if (pendingIntent.value === null) {
      rememberPendingIntent(
        ticket.kind,
        ticket.snapshot ?? DEFAULT_DESIGN_SYSTEM_APPEARANCE,
      )
    }
    clearPendingSnapshot()
    pendingReset.value = false
    retryIntentAvailable.value = false
    reconciliationRequired.value = true
    saveError.value = error
    saveStatus.value = SAVE_STATUS.ERROR
  }

  function finishMutation(ticket: MutationTicket): void {
    if (!isCurrentMutation(ticket)) return
    currentMutation = null
    mutationInFlight.value = false
    inFlightKind.value = null

    if (reconciliationRequired.value) return
    if (pendingReset.value) {
      void drainQueue()
      return
    }
    if (queuedSnapshot) {
      if (debounceTimer === null) schedulePendingSnapshot()
      if (saveStatus.value !== SAVE_STATUS.SAVED) saveStatus.value = SAVE_STATUS.DIRTY
    }
  }

  async function runPut(ticket: MutationTicket): Promise<void> {
    const requestedSnapshot = ticket.snapshot
    if (!requestedSnapshot) return

    try {
      const response = await putDesignSystemAppearance(requestedSnapshot, ticket.controller.signal)
      if (!isCurrentMutation(ticket)) return

      persistedSnapshot.value = cloneAppearance(response)
      if (!sameAppearance(response, requestedSnapshot)) {
        markMutationUncertain(
          new Error('El servidor devolvió una instantánea distinta a la enviada.'),
          ticket,
        )
        return
      }

      const currentMatches = snapshotRevision.value === ticket.snapshotRevision
        && intentGeneration.value === ticket.intentGeneration
        && sameAppearance(snapshot.value, requestedSnapshot)
      if (currentMatches && !pendingReset.value && queuedSnapshot === null) {
        if (intentMatchesMutation(ticket, 'put')) pendingIntent.value = null
        retryIntentAvailable.value = false
        saveStatus.value = SAVE_STATUS.SAVED
        saveError.value = null
      } else {
        saveStatus.value = SAVE_STATUS.DIRTY
      }
    } catch (error: unknown) {
      if (!isCurrentMutation(ticket)) return
      markMutationUncertain(error, ticket)
    } finally {
      finishMutation(ticket)
    }
  }

  async function runDelete(ticket: MutationTicket): Promise<void> {
    try {
      await resetDesignSystemAppearance(ticket.controller.signal)
      if (!isCurrentMutation(ticket)) return

      persistedSnapshot.value = cloneAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
      const resetStillCurrent = snapshotRevision.value === ticket.snapshotRevision
        && intentGeneration.value === ticket.intentGeneration
        && sameAppearance(snapshot.value, DEFAULT_DESIGN_SYSTEM_APPEARANCE)
      if (resetStillCurrent && queuedSnapshot === null && !pendingReset.value) {
        if (intentMatchesMutation(ticket, 'delete')) pendingIntent.value = null
        retryIntentAvailable.value = false
        snapshot.value = cloneAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
        applyAppearance(snapshot.value)
        saveStatus.value = SAVE_STATUS.SAVED
        saveError.value = null
      } else {
        saveStatus.value = SAVE_STATUS.DIRTY
      }
    } catch (error: unknown) {
      if (!isCurrentMutation(ticket)) return
      markMutationUncertain(error, ticket)
    } finally {
      finishMutation(ticket)
    }
  }

  async function drainQueue(): Promise<void> {
    if (
      disposed
      || currentMutation
      || principalUserId.value === null
      || restoreStatus.value !== RESTORE_STATUS.READY
      || reconciliationRequired.value
    ) return

    const principalId = principalUserId.value
    const principalGenerationAtStart = principalGeneration.value
    const intentGenerationAtStart = intentGeneration.value
    const snapshotRevisionAtStart = snapshotRevision.value
    const controller = new AbortController()
    const attempt = nextAttempt()

    if (pendingReset.value) {
      pendingReset.value = false
      const ticket: MutationTicket = {
        kind: 'delete',
        principalId,
        principalGeneration: principalGenerationAtStart,
        intentGeneration: intentGenerationAtStart,
        snapshotRevision: snapshotRevisionAtStart,
        attempt,
        controller,
        snapshot: null,
      }
      currentMutation = ticket
      mutationInFlight.value = true
      inFlightKind.value = 'delete'
      saveStatus.value = SAVE_STATUS.RESETTING
      void runDelete(ticket)
      return
    }

    const pending = queuedSnapshot
    if (!pending) return
    clearDebounce()
    queuedSnapshot = null
    pendingSnapshotCount.value = 0

    if (
      pending.principalGeneration !== principalGenerationAtStart
      || pending.intentGeneration !== intentGeneration.value
      || pending.snapshotRevision !== snapshotRevision.value
      || !sameAppearance(snapshot.value, pending.snapshot)
    ) {
      if (queuedSnapshot) schedulePendingSnapshot()
      return
    }

    const ticket: MutationTicket = {
      kind: 'put',
      principalId,
      principalGeneration: principalGenerationAtStart,
      intentGeneration: pending.intentGeneration,
      snapshotRevision: pending.snapshotRevision,
      attempt,
      controller,
      snapshot: cloneAppearance(pending.snapshot),
    }
    currentMutation = ticket
    mutationInFlight.value = true
    inFlightKind.value = 'put'
    saveStatus.value = SAVE_STATUS.SAVING
    void runPut(ticket)
  }

  function invalidateLocalState(): void {
    const restoreController = currentRestore?.controller ?? null
    const mutationController = currentMutation?.controller ?? null

    principalGeneration.value += 1
    intentGeneration.value += 1
    snapshotRevision.value += 1
    currentRestore = null
    currentMutation = null
    mutationInFlight.value = false
    inFlightKind.value = null
    clearPendingSnapshot()
    pendingReset.value = false
    pendingSnapshotCount.value = 0
    reconciliationRequired.value = false
    pendingIntent.value = null
    retryIntentAvailable.value = false
    principalUserId.value = null
    snapshot.value = cloneAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    persistedSnapshot.value = null
    restoreStatus.value = RESTORE_STATUS.READY
    saveStatus.value = SAVE_STATUS.IDLE
    restoreError.value = null
    saveError.value = null

    cleanupOwnedFontLinks()
    applyAppearance(snapshot.value)
    restoreController?.abort()
    mutationController?.abort()
  }

  function purge(): void {
    if (
      principalUserId.value === null
      && currentRestore === null
      && currentMutation === null
      && !pendingReset.value
      && queuedSnapshot === null
      && pendingIntent.value === null
      && restoreStatus.value === RESTORE_STATUS.READY
      && saveStatus.value === SAVE_STATUS.IDLE
      && sameAppearance(snapshot.value, DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    ) return
    invalidateLocalState()
  }

  function activatePrincipal(principalId: PrincipalId): Promise<boolean> {
    if (disposed) return Promise.resolve(false)
    if (principalUserId.value === principalId) {
      if (restoreStatus.value === RESTORE_STATUS.LOADING && currentRestore) {
        return currentRestore.promise
      }
      return Promise.resolve(restoreStatus.value === RESTORE_STATUS.READY)
    }

    invalidateLocalState()
    principalUserId.value = principalId
    restoreStatus.value = RESTORE_STATUS.LOADING
    return startRestore(false)
  }

  function isUnitContextTransition(): boolean {
    return principalUserId.value !== null
      && session.identity?.id_usuario === principalUserId.value
      && session.identity?.must_change_password === false
      && (session.status === SESSION_STATUS.BOOTING || session.status === SESSION_STATUS.READY)
      && session.busy.selectUnit
      && (
        session.context === null
        || session.context.user.id_usuario === principalUserId.value
      )
      && !session.logoutBusy
  }

  function syncWithSession(): void {
    if (disposed) return
    if (session.logoutBusy) {
      purge()
      return
    }

    if (isUnitContextTransition()) return

    const identity = session.identity
    const principalId = identity?.must_change_password === false
      ? identity.id_usuario
      : null

    if (principalId !== null) {
      void activatePrincipal(principalId)
      return
    }

    purge()
  }

  function canUpdate(): boolean {
    return !disposed
      && principalUserId.value !== null
      && restoreStatus.value === RESTORE_STATUS.READY
      && !reconciliationRequired.value
  }

  function queueCurrentSnapshot(): void {
    if (pendingReset.value && sameAppearance(snapshot.value, DEFAULT_DESIGN_SYSTEM_APPEARANCE)) {
      rememberPendingIntent('delete', snapshot.value)
      queuedSnapshot = null
      pendingSnapshotCount.value = 0
      saveStatus.value = SAVE_STATUS.DIRTY
      return
    }

    rememberPendingIntent('put', snapshot.value)
    queuedSnapshot = {
      snapshot: cloneAppearance(snapshot.value),
      principalGeneration: principalGeneration.value,
      intentGeneration: intentGeneration.value,
      snapshotRevision: snapshotRevision.value,
    }
    pendingSnapshotCount.value = 1
    saveStatus.value = SAVE_STATUS.DIRTY
    schedulePendingSnapshot()
  }

  function updateAppearance(value: unknown): boolean {
    if (!canUpdate() || !isDesignSystemAppearance(value)) return false

    snapshot.value = cloneAppearance(value)
    snapshotRevision.value += 1
    intentGeneration.value += 1
    applyAppearance(snapshot.value)
    saveError.value = null
    queueCurrentSnapshot()
    return true
  }

  function updateAxis<K extends AppearanceAxis>(axis: K, value: DesignSystemAppearance[K]): boolean {
    if (!canUpdate() || !isAxisValue(axis, value)) return false
    const candidate: unknown = { ...snapshot.value, [axis]: value }
    return updateAppearance(candidate)
  }

  function previewAxis<K extends AppearanceAxis>(axis: K, value: DesignSystemAppearance[K]): boolean {
    return updateAxis(axis, value)
  }

  function reset(): boolean {
    if (!canUpdate()) return false

    clearDebounce()
    queuedSnapshot = null
    pendingSnapshotCount.value = 0
    snapshot.value = cloneAppearance(DEFAULT_DESIGN_SYSTEM_APPEARANCE)
    snapshotRevision.value += 1
    intentGeneration.value += 1
    applyAppearance(snapshot.value)
    saveError.value = null
    rememberPendingIntent('delete', snapshot.value)

    if (currentMutation?.kind === 'delete') {
      pendingReset.value = true
      saveStatus.value = SAVE_STATUS.DIRTY
      return true
    }

    pendingReset.value = true
    saveStatus.value = SAVE_STATUS.DIRTY
    void drainQueue()
    return true
  }

  async function retryRestore(): Promise<boolean> {
    if (principalUserId.value === null || disposed) return false
    if (restoreStatus.value === RESTORE_STATUS.LOADING && currentRestore) {
      return currentRestore.promise
    }
    if (restoreStatus.value !== RESTORE_STATUS.ERROR || reconciliationRequired.value) return false
    return startRestore(false)
  }

  async function reconcile(): Promise<boolean> {
    if (
      principalUserId.value === null
      || disposed
      || !reconciliationRequired.value
      || currentMutation !== null
      || currentRestore !== null
    ) return false
    return startRestore(true)
  }

  function retryPendingMutation(): boolean {
    if (!canRetryPendingMutation.value) return false
    const intent = pendingIntent.value
    if (!intent) return false

    retryIntentAvailable.value = false
    saveStatus.value = SAVE_STATUS.DIRTY
    if (intent.kind === 'delete') {
      pendingReset.value = true
    } else {
      queuedSnapshot = {
        snapshot: cloneAppearance(intent.snapshot),
        principalGeneration: intent.principalGeneration,
        intentGeneration: intent.intentGeneration,
        snapshotRevision: intent.snapshotRevision,
      }
      pendingSnapshotCount.value = 1
    }
    void drainQueue()
    return true
  }

  async function retry(): Promise<boolean> {
    if (reconciliationRequired.value) return reconcile()
    if (restoreStatus.value === RESTORE_STATUS.ERROR) return retryRestore()
    return false
  }

  async function waitForAuthenticatedContent(): Promise<boolean> {
    if (isAuthenticatedContentReady.value) return true
    const pendingRestore = currentRestore?.promise
    if (!pendingRestore) return false
    await pendingRestore
    return isAuthenticatedContentReady.value
  }

  function dispose(): void {
    if (disposed) return
    stopSessionSubscription?.()
    stopSessionSubscription = null
    invalidateLocalState()
    cleanupOwnedDom()
    disposed = true
  }

  onScopeDispose(dispose)
  installIconObserver()
  applyAppearance(snapshot.value)
  syncWithSession()
  stopSessionSubscription = session.$subscribe(syncWithSession, { flush: 'sync' })

  return {
    snapshot: readonly(snapshot),
    persistedSnapshot: readonly(persistedSnapshot),
    restoreStatus: readonly(restoreStatus),
    saveStatus: readonly(saveStatus),
    restoreError: readonly(restoreError),
    saveError: readonly(saveError),
    principalUserId: readonly(principalUserId),
    principalGeneration: readonly(principalGeneration),
    intentGeneration: readonly(intentGeneration),
    snapshotRevision: readonly(snapshotRevision),
    latestAttemptId: readonly(latestAttemptId),
    defaults: DEFAULT_DESIGN_SYSTEM_APPEARANCE,
    options: DESIGN_SYSTEM_APPEARANCE_OPTIONS,
    iconFamilyAttribution: DESIGN_SYSTEM_ICON_FAMILY_ATTRIBUTION,
    mutationInFlight: readonly(mutationInFlight),
    inFlightKind: readonly(inFlightKind),
    pendingReset: readonly(pendingReset),
    pendingMutationCount,
    reconciliationRequired: readonly(reconciliationRequired),
    canRetryPendingMutation,
    saved,
    isAuthenticatedContentReady,
    isTenantContentReady,
    updateAppearance,
    updateAxis,
    previewAxis,
    reset,
    retryRestore,
    reconcile,
    retryPendingMutation,
    retry,
    waitForAuthenticatedContent,
    purge,
    dispose,
  }
})
