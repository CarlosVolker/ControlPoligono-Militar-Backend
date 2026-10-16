import { createApp, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { HttpRequestError } from '../../src/api/http'
import FormFeedback from '../../src/components/ds/FormFeedback.vue'
import {
  shootingHttpErrorMessage,
  shootingPayloadErrorMessage,
} from '../../src/features/shooting/error-message'

const mountedApps: Array<{ app: ReturnType<typeof createApp>; host: HTMLElement }> = []

afterEach(() => {
  for (const { app, host } of mountedApps.splice(0)) {
    app.unmount()
    host.remove()
  }
})

describe('errores de validación de tiro', () => {
  it('muestra todos los non_field_errors que son strings y omite valores irregulares', () => {
    const error = new HttpRequestError('http', 400, null, null, {
      non_field_errors: [
        'La fracción no pertenece a la unidad organizacional del recurso.',
        null,
        7,
        'La relación de la fracción tampoco es válida.',
        '   ',
      ],
    })

    expect(shootingHttpErrorMessage(error)).toBe(
      'La fracción no pertenece a la unidad organizacional del recurso. La relación de la fracción tampoco es válida.',
    )
  })

  it('conserva detail y agrega non_field_errors sin duplicar el mismo texto', () => {
    const error = new HttpRequestError('http', 400, 'Detalle del servidor.', null, {
      detail: 'Detalle del servidor.',
      non_field_errors: ['Regla contextual del servidor.'],
    })

    expect(shootingHttpErrorMessage(error)).toBe(
      'Detalle del servidor. Regla contextual del servidor.',
    )
  })

  it('mantiene el fallback HTTP si el payload no contiene strings de error válidos', () => {
    const error = new HttpRequestError('http', 400, null, null, {
      detail: { message: 'No es un texto válido.' },
      non_field_errors: [null, 0, { message: 'Tampoco es texto.' }, '  '],
    })

    expect(shootingPayloadErrorMessage(error.payload)).toBeNull()
    expect(shootingHttpErrorMessage(error)).toBe('El backend respondió con HTTP 400.')
  })

  it('renderiza el feedback como texto y no interpreta contenido HTML del servidor', () => {
    const message = '<img src=x onerror="alert(1)">'
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(FormFeedback, {
        feedback: { tone: 'danger', message },
        busy: false,
        busyMessage: null,
      }),
    })
    app.mount(host)
    mountedApps.push({ app, host })

    const feedback = host.querySelector('[role="alert"]')
    expect(feedback?.textContent).toContain(message)
    expect(feedback?.querySelector('img')).toBeNull()
  })
})
