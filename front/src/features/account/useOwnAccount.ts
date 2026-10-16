/**
 * Composable de cuenta propia (plan `docs/specs/frontend-account-self-service.md`,
 * F3; AC-1/AC-2/AC-3/AC-5/AC-7/AC-9).
 *
 * Reutiliza la API exportada (`changeOwnPassword`, `getUser` en
 * `features/identity/api.ts`) y el SessionStore: no duplica cliente HTTP ni
 * inventa endpoints. Datos propios exclusivamente del snapshot `AuthContext`
 * vigente y de la lectura acreditada OP-USR-003; capacidad ausente = limitación
 * visible, nunca botón falso ni dato simulado.
 *
 * Secretos: el draft de contraseña es efímero en memoria, se limpia al
 * resultado (cualquiera), al salir del scope y al avanzar la generación. Nunca
 * va a logs, store persistente ni artefactos.
 *
 * Anti-carrera: cada envío captura generación/principal/tenant/attempt; un
 * resultado tardío se descarta (precedente `IdentityView` tickets). Resultado
 * incierto = sin replay: sólo reconciliación explícita vía `ensureContext`
 * (singleflight vigente del store); la autoridad sigue siendo el backend.
 * Continuidad tras el cambio (AC-8/F7) NO se afirma: queda condicionada al
 * contrato observado en la fase runtime autorizada.
 */
import { computed, onScopeDispose, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { changeOwnPassword, getUser } from '../identity/api'
import type { IdentityUserDTO } from '../identity/api'
import { HttpRequestError } from '../../api/http'
import { useSessionStore } from '../../stores/session'
import { SESSION_STATUS } from '../../types/session'
import { PERMISSION_CODE } from '../../permissions/catalog'
import { ACCESS_ACTION_RESULT } from '../../types/auth'
import { ACCESS_FEEDBACK_TONE } from '../../types/access-ui'
import type { AccessFeedback } from '../../types/access-ui'
import type { ApiConnection } from '../../types/dashboard'

export const OWN_PASSWORD_STATE = {
  IDLE: 'idle',
  BUSY: 'busy',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  UNCERTAIN: 'uncertain',
} as const

export type OwnPasswordState = (typeof OWN_PASSWORD_STATE)[keyof typeof OWN_PASSWORD_STATE]

export const OWN_PROFILE_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  DENIED: 'denied',
  ERROR: 'error',
} as const

export type OwnProfileState = (typeof OWN_PROFILE_STATE)[keyof typeof OWN_PROFILE_STATE]

export interface OwnAccountPasswordDraft {
  old_password: string
  new_password: string
  confirm_password: string
}

function initialPasswordDraft(): OwnAccountPasswordDraft {
  return { old_password: '', new_password: '', confirm_password: '' }
}

interface ChangeTicket {
  attempt: number
  generation: number
  principalId: number
  tenantCode: string
  controller: AbortController
}

// Aviso efímero del cambio propio confirmado (F7/AC-8): memoria del módulo,
// un solo consumo, sin secretos ni persistencia (ni localStorage, ni cookies,
// ni params). LoginView lo consume al llegar, mismo transporte del precedente
// consumeRecoverySuccessFeedback en composables/auth/useRecovery.ts.
let accountChangeNotice: AccessFeedback | null = null

export function consumeAccountPasswordChangeNotice(): AccessFeedback | null {
  const notice = accountChangeNotice
  accountChangeNotice = null
  return notice
}

function requestStatus(error: unknown): number | null {
  return error instanceof HttpRequestError ? error.status : null
}

function requestDetail(error: unknown): string | null {
  return error instanceof HttpRequestError ? error.detail : null
}

export function useOwnAccount() {
  const session = useSessionStore()
  const router = useRouter()

  const principalId = computed<number | null>(() => session.identity?.id_usuario ?? null)
  const hasConsolidatedContext = computed<boolean>(
    () => session.status === SESSION_STATUS.READY && session.context !== null,
  )
  const tenantActive = computed<boolean>(() => session.tenantCode.trim() !== '')
  const credentialForced = computed<boolean>(
    () => session.context?.user.must_change_password === true
      || session.identity?.must_change_password === true,
  )

  // AC-3: disponibilidad del cambio voluntario — principal, snapshot vigente,
  // tenant activo y credencial sin forzado. Sin permisos administrativos: el
  // control propio es IA+TA (backend-inventory:175); el backend decide.
  const voluntaryChangeAvailable = computed<boolean>(() => (
    principalId.value !== null
    && hasConsolidatedContext.value
    && tenantActive.value
    && session.context?.user.must_change_password === false
    && session.identity?.must_change_password === false
  ))

  // AC-5: lectura read-only de la ficha propia sólo si el snapshot acredita
  // view_personnel_basic; sin acreditación no se emite request alguno.
  const canReadOwnProfile = computed<boolean>(() => (
    principalId.value !== null
    && hasConsolidatedContext.value
    && tenantActive.value
    && (session.context?.permissions.includes(PERMISSION_CODE.VIEW_PERSONNEL_BASIC) ?? false)
  ))

  const viewPersonnelBasicMissing = computed<boolean>(
    () => hasConsolidatedContext.value && !canReadOwnProfile.value,
  )

  function connection(signal: AbortSignal): ApiConnection {
    return {
      tenantCode: session.tenantCode.trim(),
      unitCode: session.unitCode.trim(),
      signal,
    }
  }

  // --- Cambio voluntario de contraseña propia -------------------------------

  const passwordDraft = reactive(initialPasswordDraft())
  const passwordState = shallowRef<OwnPasswordState>(OWN_PASSWORD_STATE.IDLE)
  const passwordFeedback = shallowRef<AccessFeedback | null>(null)
  const passwordFieldErrors = reactive<Record<string, string>>({})

  let changeAttempt = 0
  let changeController: AbortController | null = null

  function clearPasswordDraft(): void {
    Object.assign(passwordDraft, initialPasswordDraft())
    for (const key of Object.keys(passwordFieldErrors)) delete passwordFieldErrors[key]
  }

  function isTicketCurrent(ticket: ChangeTicket): boolean {
    return ticket.attempt === changeAttempt
      && session.generation === ticket.generation
      && session.identity?.id_usuario === ticket.principalId
      && session.tenantCode.trim() === ticket.tenantCode
      && !ticket.controller.signal.aborted
  }

  async function submitPasswordChange(): Promise<void> {
    if (!voluntaryChangeAvailable.value) return
    if (passwordState.value === OWN_PASSWORD_STATE.BUSY
      || passwordState.value === OWN_PASSWORD_STATE.UNCERTAIN) return

    if (!passwordDraft.old_password) {
      passwordFieldErrors.old_password = 'Indica la contraseña actual.'
      return
    }
    if (!passwordDraft.new_password) {
      passwordFieldErrors.new_password = 'Indica la nueva contraseña.'
      return
    }
    if (passwordDraft.new_password !== passwordDraft.confirm_password) {
      passwordFieldErrors.confirm_password = 'Las contraseñas no coinciden.'
      return
    }

    const identityId = principalId.value
    if (identityId === null) return

    const controller = new AbortController()
    changeController = controller
    changeAttempt += 1
    const ticket: ChangeTicket = {
      attempt: changeAttempt,
      generation: session.generation,
      principalId: identityId,
      tenantCode: session.tenantCode.trim(),
      controller,
    }

    passwordState.value = OWN_PASSWORD_STATE.BUSY
    passwordFeedback.value = null
    try {
      const response = await changeOwnPassword(
        ticket.principalId,
        { old_password: passwordDraft.old_password, new_password: passwordDraft.new_password },
        connection(controller.signal),
      )
      // El draft se limpia con CUALQUIER resultado: los secretos no sobreviven
      // a la respuesta.
      clearPasswordDraft()
      if (!isTicketCurrent(ticket)) return
      // F7/AC-8 — contrato real observado (2026-10-12, UI de producto con el
      // endpoint vigente): el 200 del cambio propio invalida la sesión del
      // servidor — el siguiente GET /auth/context/ de la propia app devolvió
      // 403 con el detail literal «Las credenciales de autenticación no se
      // proveyeron.» y el guard expulsó a /login. La UX no aparenta sesión
      // vigente tras el éxito: aviso transitorio en memoria (detail literal
      // del 200 + materia neutral de reingreso, según la fuente observada),
      // retiro local con purge() del store vigente (avanza la generación y
      // aborta en vuelo, misma semántica del logout local; identidad,
      // contexto y drafts fuera — cero persistencia, cero auto-login, cero
      // replay del POST, cero conservación de la contraseña nueva) y
      // navegación real a /login. El 403 de negocio denegado sigue rama
      // propia (detail literal, sin logout): este retiro sólo sigue a un 200
      // confirmado del cambio propio.
      const detail = typeof response.detail === 'string' ? response.detail.trim() : ''
      accountChangeNotice = {
        message: detail
          ? `${detail} Vuelve a iniciar sesión con tu nueva contraseña.`
          : 'Vuelve a iniciar sesión con tu nueva contraseña.',
        tone: ACCESS_FEEDBACK_TONE.SUCCESS,
      }
      passwordState.value = OWN_PASSWORD_STATE.CONFIRMED
      session.purge()
      try {
        await router.replace('/login')
      } catch {
        // Navegación interrumpida por una posterior: el retiro local ya rigió.
      }
    } catch (error: unknown) {
      clearPasswordDraft()
      if (!isTicketCurrent(ticket)) return
      const status = requestStatus(error)
      if (status !== null && status >= 400 && status < 500) {
        // Denegación confirmada: ST-07 con el detail literal del backend. El
        // 403 de negocio no cierra la sesión: aquí no se toca el store; la
        // autoridad es del backend.
        passwordState.value = OWN_PASSWORD_STATE.REJECTED
        passwordFeedback.value = {
          message: status === 403
            ? requestDetail(error) ?? 'El servidor denegó esta operación (403). La sesión se mantiene activa.'
            : requestDetail(error) ?? 'El servidor denegó esta operación.',
          tone: ACCESS_FEEDBACK_TONE.DANGER,
        }
      } else {
        // Sin respuesta confirmada: incierto. Cero auto-reintento, cero replay;
        // sólo reconciliación explícita.
        passwordState.value = OWN_PASSWORD_STATE.UNCERTAIN
        passwordFeedback.value = {
          message: 'No se pudo confirmar el resultado del cambio. No se reenviará automáticamente: reconcilia el contexto antes de intentar de nuevo.',
          tone: ACCESS_FEEDBACK_TONE.WARNING,
        }
      }
    } finally {
      if (changeController === controller) changeController = null
    }
  }

  async function reconcileContext(): Promise<void> {
    if (passwordState.value !== OWN_PASSWORD_STATE.UNCERTAIN) return
    const result = await session.ensureContext()
    // La reconciliación nunca reenvía el POST (sin replay). El resultado del
    // cambio sigue sin afirmarse desde el cliente; el contexto vigente manda.
    if (passwordState.value === OWN_PASSWORD_STATE.UNCERTAIN) {
      passwordState.value = OWN_PASSWORD_STATE.IDLE
      if (result.kind === ACCESS_ACTION_RESULT.REJECTED || result.kind === ACCESS_ACTION_RESULT.UNCERTAIN) {
        passwordFeedback.value = {
          message: result.error.detail ?? 'No se pudo confirmar el contexto. El acceso permanece bloqueado.',
          tone: ACCESS_FEEDBACK_TONE.DANGER,
        }
      } else if (result.kind !== ACCESS_ACTION_RESULT.SUCCESS) {
        passwordFeedback.value = {
          message: 'No se pudo confirmar el contexto. El acceso permanece bloqueado.',
          tone: ACCESS_FEEDBACK_TONE.DANGER,
        }
      } else {
        passwordFeedback.value = null
      }
    }
  }

  // --- Ficha propia read-only (OP-USR-003) ----------------------------------

  const profileState = shallowRef<OwnProfileState>(OWN_PROFILE_STATE.IDLE)
  const profile = shallowRef<IdentityUserDTO | null>(null)
  const profileDetail = shallowRef<string | null>(null)

  let profileController: AbortController | null = null

  async function readOwnProfile(): Promise<void> {
    if (!canReadOwnProfile.value) return
    const identityId = principalId.value
    if (identityId === null) return

    profileController?.abort()
    const controller = new AbortController()
    profileController = controller
    const generationAtRequest = session.generation
    profileState.value = OWN_PROFILE_STATE.LOADING
    profileDetail.value = null
    try {
      const data = await getUser(identityId, connection(controller.signal))
      if (session.generation !== generationAtRequest) return
      profile.value = data
      profileState.value = OWN_PROFILE_STATE.READY
    } catch (error: unknown) {
      if (session.generation !== generationAtRequest) return
      const status = requestStatus(error)
      if (status === 403) {
        // ST-07 literal; un 403 de lectura propia no cierra la sesión.
        profileState.value = OWN_PROFILE_STATE.DENIED
        profileDetail.value = requestDetail(error) ?? 'El backend denegó esta operación.'
      } else if (status !== null) {
        profileState.value = OWN_PROFILE_STATE.ERROR
        profileDetail.value = requestDetail(error) ?? 'El servidor denegó esta operación.'
      } else {
        profileState.value = OWN_PROFILE_STATE.ERROR
        profileDetail.value = 'No se pudo completar la consulta de la ficha.'
      }
    } finally {
      if (profileController === controller) profileController = null
    }
  }

  watch(
    [canReadOwnProfile, () => principalId.value],
    ([readable]) => {
      if (readable) {
        void readOwnProfile()
        return
      }
      profileController?.abort()
      profile.value = null
      profileDetail.value = null
      profileState.value = OWN_PROFILE_STATE.IDLE
    },
    { immediate: true },
  )

  // Cualquier avance de generación invalida resultados en vuelo y retira los
  // secretos del draft (precedente del store).
  watch(() => session.generation, () => {
    changeController?.abort()
    changeController = null
    clearPasswordDraft()
    passwordState.value = OWN_PASSWORD_STATE.IDLE
    passwordFeedback.value = null
    profileController?.abort()
    profile.value = null
    profileDetail.value = null
    profileState.value = OWN_PROFILE_STATE.IDLE
  })

  onScopeDispose(() => {
    changeController?.abort()
    profileController?.abort()
    clearPasswordDraft()
  })

  return {
    principalId,
    hasConsolidatedContext,
    tenantActive,
    credentialForced,
    voluntaryChangeAvailable,
    canReadOwnProfile,
    viewPersonnelBasicMissing,
    passwordDraft,
    passwordState,
    passwordFeedback,
    passwordFieldErrors,
    submitPasswordChange,
    reconcileContext,
    profileState,
    profile,
    profileDetail,
    readOwnProfile,
  }
}
