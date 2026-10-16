import { createApp, h, nextTick, shallowRef } from 'vue'
import { expect, it, vi } from 'vitest'
import DsModal from '../../src/components/shared/DsModal.vue'

it('libera el modal y el bloqueo de scroll tras la transición de 200 ms', async () => {
  vi.useFakeTimers()
  const host = document.createElement('div')
  document.body.append(host)
  const originalOverflow = document.body.style.overflow
  const open = shallowRef(true)
  const app = createApp({
    setup: () => () => h(DsModal, {
      modelValue: open.value,
      title: 'Modal',
      modalId: 'duration-modal',
    }),
  })

  try {
    app.mount(host)
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    open.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(document.getElementById('duration-modal')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')

    await vi.advanceTimersByTimeAsync(150)
    expect(document.getElementById('duration-modal')).toBeNull()
    expect(document.body.style.overflow).toBe(originalOverflow)
  } finally {
    app.unmount()
    host.remove()
    vi.useRealTimers()
  }
})

it('cicla ShiftTab y Tab desde el contenedor hacia los controles del modal', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const visibility = vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({
    length: 1,
  } as DOMRectList)
  const app = createApp({
    setup: () => () => h(DsModal, {
      modelValue: true,
      title: 'Modal',
      modalId: 'focus-modal',
    }, {
      body: () => [h('input', { type: 'text' }), h('select')],
      footer: () => h('button', { type: 'button', class: 'btn' }, 'Cancelar'),
    }),
  })

  try {
    app.mount(host)
    await nextTick()
    const modal = document.getElementById('focus-modal')!
    const first = modal.querySelector<HTMLButtonElement>('.btn-close')!
    const last = modal.querySelector<HTMLButtonElement>('.modal-footer button')!

    modal.focus()
    const backward = new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    })
    modal.dispatchEvent(backward)
    expect(backward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)

    modal.focus()
    const forward = new KeyboardEvent('keydown', {
      key: 'Tab', bubbles: true, cancelable: true,
    })
    modal.dispatchEvent(forward)
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
  } finally {
    app.unmount()
    host.remove()
    visibility.mockRestore()
  }
})
