import { HttpRequestError } from '../../api/http'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stringErrorMessages(value: unknown): string[] {
  const candidates: readonly unknown[] = typeof value === 'string'
    ? [value]
    : Array.isArray(value) ? value : []

  return candidates.filter((candidate): candidate is string => (
    typeof candidate === 'string' && candidate.trim().length > 0
  ))
}

export function shootingPayloadErrorMessage(payload: unknown, detail: string | null = null): string | null {
  const messages = [
    ...stringErrorMessages(detail),
    ...stringErrorMessages(isRecord(payload) ? payload.detail : null),
    ...stringErrorMessages(isRecord(payload) ? payload.non_field_errors : null),
  ]

  const uniqueMessages = [...new Set(messages)]
  return uniqueMessages.length > 0 ? uniqueMessages.join(' ') : null
}

export function shootingHttpErrorMessage(error: HttpRequestError): string {
  const payloadMessage = shootingPayloadErrorMessage(error.payload, error.detail)
  if (payloadMessage) return payloadMessage
  if (error.status === 403) return 'El backend denegó esta operación.'
  if (error.status === 404) return 'El recurso ya no está disponible en el backend.'
  if (error.status !== null) return `El backend respondió con HTTP ${error.status}.`
  return error.blockReason === 'missing-csrf'
    ? 'No está disponible el token CSRF requerido para esta escritura.'
    : 'No se recibió una respuesta confirmada del backend.'
}
