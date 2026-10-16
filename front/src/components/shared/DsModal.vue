<script lang="ts">
interface InlineStyleSnapshot {
  value: string
  priority: string
}

interface BodyLockRecord {
  users: number
  overflow: InlineStyleSnapshot
  paddingRight: InlineStyleSnapshot
}

const bodyLockRecords = new WeakMap<HTMLElement, BodyLockRecord>()
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

interface DsModalProps {
  modelValue: boolean
  title: string
  busy?: boolean
  modalId: string
}

const props = withDefaults(defineProps<DsModalProps>(), {
  busy: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalElement = shallowRef<HTMLDivElement | null>(null)
const titleId = computed(() => `${props.modalId}-title`)

let isActive = false
let returnFocusTarget: HTMLElement | null = null
let lockedBody: HTMLElement | null = null

function captureInlineStyle(style: CSSStyleDeclaration, property: string): InlineStyleSnapshot {
  return {
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }
}

function restoreInlineStyle(
  style: CSSStyleDeclaration,
  property: string,
  snapshot: InlineStyleSnapshot,
): void {
  if (snapshot.value) {
    style.setProperty(property, snapshot.value, snapshot.priority)
    return
  }

  style.removeProperty(property)
}

function acquireBodyScrollLock(): HTMLElement | null {
  const body = document.body
  if (!body) return null

  const existingRecord = bodyLockRecords.get(body)
  if (existingRecord) {
    existingRecord.users += 1
    body.style.setProperty('overflow', 'hidden')
    return body
  }

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  const record: BodyLockRecord = {
    users: 1,
    overflow: captureInlineStyle(body.style, 'overflow'),
    paddingRight: captureInlineStyle(body.style, 'padding-right'),
  }

  if (scrollbarWidth > 0) {
    body.style.setProperty('padding-right', `${scrollbarWidth}px`)
  }

  body.style.setProperty('overflow', 'hidden')
  bodyLockRecords.set(body, record)
  return body
}

function releaseBodyScrollLock(body: HTMLElement): void {
  const record = bodyLockRecords.get(body)
  if (!record) return

  record.users -= 1
  if (record.users > 0) return

  restoreInlineStyle(body.style, 'overflow', record.overflow)
  restoreInlineStyle(body.style, 'padding-right', record.paddingRight)
  bodyLockRecords.delete(body)
}

function visibleFocusables(container: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter((element) => element.offsetWidth || element.offsetHeight || element.getClientRects().length > 0)
}

function trapTabKey(event: KeyboardEvent): void {
  const modal = modalElement.value
  if (!modal) return

  const items = visibleFocusables(modal)
  if (items.length === 0) {
    event.preventDefault()
    modal.focus()
    return
  }

  const first = items[0]
  const last = items[items.length - 1]
  const activeElement = document.activeElement

  if (event.shiftKey) {
    if (activeElement === modal || activeElement === first || !modal.contains(activeElement)) {
      event.preventDefault()
      last.focus()
    }
    return
  }

  if (activeElement === modal || activeElement === last || !modal.contains(activeElement)) {
    event.preventDefault()
    first.focus()
  }
}

function requestClose(): void {
  if (props.busy || !props.modelValue) return

  emit('update:modelValue', false)
  emit('close')
}

function handleModalKeydown(event: KeyboardEvent): void {
  if (!isActive) return

  if (event.key === 'Escape') {
    requestClose()
    return
  }

  if (event.key === 'Tab') trapTabKey(event)
}

function focusInitialElement(): void {
  const modal = modalElement.value
  if (!modal) return

  // Prioridad de destino del foco inicial, evaluada en orden (una consulta por
  // paso: `querySelector` devuelve orden de documento, no de la lista):
  // [autofocus] → primer campo del cuerpo → primario del pie → «Cerrar» → contenedor.
  const candidates = [
    '[autofocus]:not(:disabled)',
    '.modal-body input:not(:disabled), .modal-body select:not(:disabled), .modal-body textarea:not(:disabled)',
    '.modal-footer .btn-primary:not(:disabled)',
    '.btn-close:not(:disabled)',
  ]

  for (const selector of candidates) {
    const candidate = modal.querySelector<HTMLElement>(selector)
    if (candidate) {
      candidate.focus()
      return
    }
  }

  modal.focus()
}

function beginModalSession(): void {
  if (isActive) return

  isActive = true
  const activeElement = document.activeElement
  returnFocusTarget = activeElement instanceof HTMLElement && activeElement !== document.body
    ? activeElement
    : null
  lockedBody = acquireBodyScrollLock()
  document.addEventListener('keydown', handleModalKeydown)

  void nextTick(() => {
    if (isActive && props.modelValue) focusInitialElement()
  })
}

function restoreFocus(): void {
  const target = returnFocusTarget
  returnFocusTarget = null

  if (!target || !target.isConnected || target.matches(':disabled') || target.tabIndex < 0) return

  window.setTimeout(() => {
    if (target.isConnected && !target.matches(':disabled') && target.tabIndex >= 0) {
      target.focus()
    }
  }, 0)
}

function endModalSession(): void {
  if (!isActive) return

  isActive = false
  document.removeEventListener('keydown', handleModalKeydown)

  if (lockedBody) {
    releaseBodyScrollLock(lockedBody)
    lockedBody = null
  }

  restoreFocus()
}

function finishLeave(): void {
  if (!props.modelValue) endModalSession()
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) requestClose()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) beginModalSession()
  },
  { flush: 'post' },
)

onMounted(() => {
  if (props.modelValue) beginModalSession()
})

onBeforeUnmount(endModalSession)
</script>

<template>
  <Teleport to="body">
    <Transition name="ds-modal" :duration="200" @after-leave="finishLeave">
      <div
        v-if="props.modelValue"
        :id="props.modalId"
        ref="modalElement"
        class="ds-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-busy="props.busy ? 'true' : undefined"
        tabindex="-1"
        @click="handleBackdropClick"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 :id="titleId" class="modal-title">{{ props.title }}</h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Cerrar"
                :disabled="props.busy"
                @click="requestClose"
              />
            </div>

            <div class="modal-body">
              <slot name="body">
                <slot />
              </slot>
            </div>

            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ds-modal {
  position: fixed;
  inset: 0;
  z-index: var(--bui-z-modal, 1050);
  display: block;
  overflow-x: hidden;
  overflow-y: auto;
  outline: 0;
}

.ds-modal::before {
  position: fixed;
  z-index: 0;
  inset: 0;
  background-color: #dee2e6;
  opacity: .5;
  content: "";
}

:global([data-theme="light"] .ds-modal::before) {
  background-color: rgba(93, 113, 134, .75);
}

.modal-dialog {
  position: relative;
  z-index: 1;
  width: auto;
  max-width: 500px;
  margin: 30px auto;
  pointer-events: none;
  transform: none;
  transition: transform .2s ease-out;
}

.ds-modal-enter-from .modal-dialog,
.ds-modal-leave-to .modal-dialog {
  transform: translateY(-30px);
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: var(--bui-surface, var(--surface));
  border: 1px solid transparent;
  border-radius: var(--bui-radius-lg, 8px);
  box-shadow: 0 14px 30px rgba(0,0,0,.45);
  outline: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bui-border, var(--border));
}

.modal-title {
  margin: 0;
  color: var(--bui-heading, var(--heading));
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.btn-close {
  box-sizing: content-box;
  width: 12px;
  height: 12px;
  margin: -12px -12px -12px auto;
  padding: 12px;
  color: var(--bui-text, var(--text));
  background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23aab8c5'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center / 12px auto no-repeat;
  border: 0;
  border-radius: var(--bui-radius-sm, 4px);
  opacity: .5;
  cursor: pointer;
}

.btn-close:hover {
  opacity: .9;
}

.btn-close:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 .15rem rgba(var(--bui-primary-rgb, 126, 103, 254), .25);
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 24px;
  color: var(--bui-text, var(--text));
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  padding: 20px;
  border-top: 1px solid var(--bui-border, var(--border));
}

.modal-footer > :slotted(*) {
  margin: 4px;
}

/* baseui.css:409-410 also disables class/fieldset-driven button states. */
.ds-modal :deep(.btn.disabled),
.ds-modal :deep(fieldset:disabled .btn) {
  pointer-events: none;
  opacity: .65;
}

/* Shared DS anatomy for the operation modal forms (slotted content). Single block
   instead of six duplicates. Source: forms-basic.html + baseui-forms.css:245-276 +
   baseui-content.css:262-291 (form-check) and baseui.css:718-739 (alerts). */
.modal-body :deep(.form-check) {
  display: block;
  min-height: 21px;
  padding-left: 1.612em;
  margin-bottom: 0;
}

.modal-body :deep(.form-check-input) {
  float: left;
  margin-left: -1.612em;
  margin-top: 2px;
  flex-shrink: 0;
  width: 1.112em;
  height: 1.112em;
  font-size: 14px;
  vertical-align: top;
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bui-surface);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: 1px solid #8391a2;              /* baseui-content.css:273 literal */
  border-radius: 3.5px;
  print-color-adjust: exact;
}

.modal-body :deep(.form-check-input:active) {
  filter: brightness(90%);
}

.modal-body :deep(.form-check-input:focus) {
  border-color: rgba(var(--bui-primary-rgb), 1);
  outline: 0;
  box-shadow: 0 0 0 .15rem rgba(var(--bui-primary-rgb), .25);
}

.modal-body :deep(.form-check-input:focus-visible) {
  border-color: var(--buf-input-focus);
  box-shadow: none;                        /* baseui-forms.css:259-262 */
}

.modal-body :deep(.form-check-input:checked) {
  background-color: rgba(var(--bui-primary-rgb), 1);
  border-color: rgba(var(--bui-primary-rgb), 1);
}

.modal-body :deep(.form-check-input:checked[type="checkbox"]) {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e");
}

.modal-body :deep(.form-check-input:disabled) {
  pointer-events: none;
  filter: none;
  opacity: .5;
}

.modal-body :deep(.form-check-label) {
  cursor: pointer;
  color: #f1f1f1;                          /* baseui-content.css:288 literal (dark) */
}

.modal-body :deep(.form-check-input:disabled ~ .form-check-label) {
  cursor: default;
  opacity: .5;
}

/* theme-customizer.css:357-362 wins globally; whole-selector :global keeps the modal. */
:global(html[data-accent] .ds-modal .form-check-input:focus) {
  box-shadow: 0 0 0 2.4px color-mix(in srgb, var(--primary) 25%, transparent);
}

:global(html[data-accent] .ds-modal .form-check-input:checked) {
  background-color: var(--primary);
  border-color: var(--primary);
}

:global([data-theme="light"] .ds-modal .form-check-input) {
  background-color: var(--bui-surface);
  border-color: rgba(0, 0, 0, .176);
}

:global([data-theme="light"] .ds-modal .form-check-input:checked) {
  background-color: rgba(var(--bui-primary-rgb), 1);
  border-color: rgba(var(--bui-primary-rgb), 1);
}

:global([data-theme="light"] .ds-modal .form-check-label) {
  color: var(--bui-text);
}

/* Validation states: baseui-forms.css:460-478. */
.ds-modal .modal-body :deep(.form-check-input.is-valid),
.ds-modal .modal-body :deep(.was-validated .form-check-input:valid) {
  border-color: var(--buf-valid);
}

.ds-modal .modal-body :deep(.form-check-input.is-valid:checked),
.ds-modal .modal-body :deep(.was-validated .form-check-input:valid:checked) {
  background-color: var(--buf-valid);
  border-color: var(--buf-valid);
}

.ds-modal .modal-body :deep(.form-check-input.is-valid:focus),
.ds-modal .modal-body :deep(.was-validated .form-check-input:valid:focus) {
  box-shadow: 0 0 0 .15rem rgba(104, 206, 125, .25);
}

.ds-modal .modal-body :deep(.form-check-input.is-valid ~ .form-check-label),
.ds-modal .modal-body :deep(.was-validated .form-check-input:valid ~ .form-check-label) {
  color: var(--success-text);
}

.ds-modal .modal-body :deep(.form-check-input.is-invalid),
.ds-modal .modal-body :deep(.was-validated .form-check-input:invalid) {
  border-color: var(--buf-invalid);
}

.ds-modal .modal-body :deep(.form-check-input.is-invalid:checked),
.ds-modal .modal-body :deep(.was-validated .form-check-input:invalid:checked) {
  background-color: var(--buf-invalid);
  border-color: var(--buf-invalid);
}

.ds-modal .modal-body :deep(.form-check-input.is-invalid:focus),
.ds-modal .modal-body :deep(.was-validated .form-check-input:invalid:focus) {
  box-shadow: 0 0 0 .15rem rgba(215, 83, 65, .25);
}

.ds-modal .modal-body :deep(.form-check-input.is-invalid ~ .form-check-label),
.ds-modal .modal-body :deep(.was-validated .form-check-input:invalid ~ .form-check-label) {
  color: var(--danger-text);
}

.ds-modal .modal-body :deep(.form-check-inline .form-check-input ~ .valid-feedback),
.ds-modal .modal-body :deep(.form-check-inline .form-check-input ~ .invalid-feedback) {
  margin-left: .5em;
}

/* Feedback: DS alert geometry/variants for the modal messages. */
.modal-body :deep(.alert) {
  position: relative;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  border-radius: var(--bui-radius);
  color: var(--bui-text);
}

.modal-body :deep(.alert.alert-danger) {
  color: var(--danger-text);
  background-color: rgba(var(--bui-danger-rgb), .15);
  border-color: rgba(var(--bui-danger-rgb), .4);
}

.modal-body :deep(.alert.alert-warning) {
  color: var(--warning-text);
  background-color: rgba(var(--bui-warning-rgb), .15);
  border-color: rgba(var(--bui-warning-rgb), .4);
}

.modal-body :deep(.alert.alert-info) {
  color: var(--info-text);
  background-color: rgba(var(--bui-info-rgb), .15);
  border-color: rgba(var(--bui-info-rgb), .4);
}

.modal-body :deep(.alert.alert-success) {
  color: var(--success-text);
  background-color: rgba(var(--bui-success-rgb), .15);
  border-color: rgba(var(--bui-success-rgb), .4);
}

/* DS field seam for the Teleported modal body (no .page-content ancestor). Corrected: the
   .ds-modal .modal-body :deep(...) prefix outranks the view-local marker (0,3,0), the invalid states
   are restored in full and the normal layer cannot drop them. Source: baseui-forms.css:53-102
   (label/control + states), :159-190 (select + states), :405-455 (invalid). */
.ds-modal .modal-body :deep(.form-label) {
  display: inline-block;
  margin-bottom: 8px;
  font-weight: 500;
}

.ds-modal .modal-body :deep(.form-control) {
  display: block;
  width: 100%;
  min-height: calc(1.5em + 1rem + 2px);
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--bui-text);
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bui-surface);
  background-clip: padding-box;
  border: 1px solid var(--buf-input-border);
  border-radius: var(--bui-radius);
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.ds-modal .modal-body :deep(.form-control:focus-visible) {
  color: var(--bui-text);
  background-color: var(--bui-surface);
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.ds-modal .modal-body :deep(.form-control::placeholder) {
  color: var(--buf-placeholder);
  opacity: 1;
}

.ds-modal .modal-body :deep(.form-control[readonly]:not(:disabled)) {
  background-color: var(--bui-surface);
  opacity: 1;
}

.ds-modal .modal-body :deep(.form-control:disabled) {
  background-color: var(--bui-bg);
  opacity: 1;
}

/* Valid fields: baseui-forms.css:385-404. */
.ds-modal .modal-body :deep(.form-control.is-valid),
.ds-modal .modal-body :deep(.was-validated .form-control:valid) {
  border-color: var(--buf-valid);
  padding-right: calc(1.5em + 1rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2368ce7d' d='M2.3 6.73.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(.375em + .25rem) center;
  background-size: calc(.75em + .5rem) calc(.75em + .5rem);
}

.ds-modal .modal-body :deep(.form-control.is-valid:focus),
.ds-modal .modal-body :deep(.was-validated .form-control:valid:focus) {
  border-color: var(--buf-valid);
  box-shadow: 0 0 0 .15rem rgba(104, 206, 125, .25);
}

.ds-modal .modal-body :deep(textarea.form-control.is-valid),
.ds-modal .modal-body :deep(.was-validated textarea.form-control:valid) {
  padding-right: calc(1.5em + 1rem);
  background-position: top calc(.375em + .25rem) right calc(.375em + .25rem);
}

/* invalid (baseui-forms.css:405-426): padding/right icon + focus ring; textarea top-right */
.ds-modal .modal-body :deep(.form-control.is-invalid),
.ds-modal .modal-body :deep(.was-validated .form-control:invalid) {
  border-color: var(--buf-invalid);
  padding-right: calc(1.5em + 1rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23d75341'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23d75341' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(.375em + .25rem) center;
  background-size: calc(.75em + .5rem) calc(.75em + .5rem);
}

.ds-modal .modal-body :deep(.form-control.is-invalid:focus),
.ds-modal .modal-body :deep(.was-validated .form-control:invalid:focus) {
  border-color: var(--buf-invalid);
  box-shadow: 0 0 0 .15rem rgba(215, 83, 65, .25);
}

.ds-modal .modal-body :deep(textarea.form-control.is-invalid),
.ds-modal .modal-body :deep(.was-validated textarea.form-control:invalid) {
  padding-right: calc(1.5em + 1rem);
  background-position: top calc(.375em + .25rem) right calc(.375em + .25rem);
}

/* select (baseui-forms.css:159-190): source declares NO min-height -> restore initial;
   the source chevron is declared explicitly to avoid depending on the global rule. */
.ds-modal .modal-body :deep(.form-select) {
  --buf-select-chevron: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2336404a' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
  display: block;
  width: 100%;
  min-height: initial;
  padding: 8px 72px 8px 24px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--bui-text);
  -webkit-appearance: none;
  appearance: none;
  background-color: var(--bui-surface);
  background-image: var(--buf-select-chevron), var(--buf-select-icon, none);
  background-repeat: no-repeat;
  background-position: right 24px center;
  background-size: 14px 10px;
  border: 1px solid var(--buf-input-border);
  border-radius: var(--bui-radius);
  transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}

.ds-modal .modal-body :deep(.form-select:focus) {
  border-color: var(--buf-input-focus);
  outline: 0;
  box-shadow: none;
}

.ds-modal .modal-body :deep(.form-select[multiple]),
.ds-modal .modal-body :deep(.form-select[size]:not([size="1"])) {
  padding-right: 24px;
  background-image: none;
}

.ds-modal .modal-body :deep(.form-select:disabled) {
  background-color: var(--bui-bg);
}

/* Valid selects: baseui-forms.css:426-442. */
.ds-modal .modal-body :deep(.form-select.is-valid),
.ds-modal .modal-body :deep(.was-validated .form-select:valid) {
  border-color: var(--buf-valid);
}

.ds-modal .modal-body :deep(.form-select.is-valid:not([multiple]):not([size])),
.ds-modal .modal-body :deep(.form-select.is-valid:not([multiple])[size="1"]),
.ds-modal .modal-body :deep(.was-validated .form-select:valid:not([multiple]):not([size])),
.ds-modal .modal-body :deep(.was-validated .form-select:valid:not([multiple])[size="1"]) {
  --buf-select-icon: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2368ce7d' d='M2.3 6.73.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
  padding-right: 132px;
  background-position: right 24px center, center right 72px;
  background-size: 14px 10px, calc(.75em + .5rem) calc(.75em + .5rem);
}

.ds-modal .modal-body :deep(.form-select.is-valid:focus),
.ds-modal .modal-body :deep(.was-validated .form-select:valid:focus) {
  border-color: var(--buf-valid);
  box-shadow: 0 0 0 .15rem rgba(104, 206, 125, .25);
}

/* select invalid (baseui-forms.css:437-455): two layers (chevron + status icon), 132px + ring */
.ds-modal .modal-body :deep(.form-select.is-invalid),
.ds-modal .modal-body :deep(.was-validated .form-select:invalid) {
  border-color: var(--buf-invalid);
}

.ds-modal .modal-body :deep(.form-select.is-invalid:not([multiple]):not([size])),
.ds-modal .modal-body :deep(.form-select.is-invalid:not([multiple])[size="1"]),
.ds-modal .modal-body :deep(.was-validated .form-select:invalid:not([multiple]):not([size])),
.ds-modal .modal-body :deep(.was-validated .form-select:invalid:not([multiple])[size="1"]) {
  --buf-select-icon: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23d75341'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23d75341' stroke='none'/%3e%3c/svg%3e");
  padding-right: 132px;
  background-image: var(--buf-select-chevron), var(--buf-select-icon, none);
  background-position: right 24px center, center right 72px;
  background-size: 14px 10px, calc(.75em + .5rem) calc(.75em + .5rem);
}

.ds-modal .modal-body :deep(.form-select.is-invalid:focus),
.ds-modal .modal-body :deep(.was-validated .form-select:invalid:focus) {
  border-color: var(--buf-invalid);
  box-shadow: 0 0 0 .15rem rgba(215, 83, 65, .25);
}

/* Native valid feedback: baseui-forms.css:332-338,375-379. */
.ds-modal .modal-body :deep(.valid-feedback) {
  display: none;
  width: 100%;
  margin-top: 4px;
  font-size: 12.25px;
  color: var(--success-text);
}

.ds-modal .modal-body :deep(.is-valid ~ .valid-feedback),
.ds-modal .modal-body :deep(.was-validated :valid ~ .valid-feedback) {
  display: block;
}

/* Source: baseui-forms.css:339-345. The existing forms mount feedback with v-if,
   so presence in the DOM is the visibility gate instead of .is-invalid/was-validated. */
.ds-modal .modal-body :deep(.invalid-feedback) {
  display: block;
  width: 100%;
  margin-top: 4px;
  font-size: 12.25px;
  color: var(--danger-text);
}
</style>
