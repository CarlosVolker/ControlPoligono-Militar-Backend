import type { NavigationGuardReturn, Router } from 'vue-router'
import { useSessionStore } from '../stores/session'
import { SESSION_OPERATION, SESSION_STATUS } from '../types/session'
import type { SessionState, SessionStatus } from '../types/session'
import { ROUTE_NAMES } from './routes'

const REGISTERED_ROUTE_NAMES = new Set<string>(Object.values(ROUTE_NAMES))

// Login, recuperación, contexto-perdido y 404 se permiten sin GET por
// mero montaje o navegación.
const FETCH_FREE_ROUTE_NAMES: readonly string[] = [
  ROUTE_NAMES.LOGIN,
  ROUTE_NAMES.RECOVERY,
  ROUTE_NAMES.CONTEXT_LOST,
  ROUTE_NAMES.NOT_FOUND,
]

// Rutas de control auth/contexto: nunca son destino de retorno válido.
const CONTROL_ROUTE_NAMES: readonly string[] = [
  ROUTE_NAMES.LOGIN,
  ROUTE_NAMES.RECOVERY,
  ROUTE_NAMES.PASSWORD_REQUIRED,
  ROUTE_NAMES.CONTEXT,
  ROUTE_NAMES.CONTEXT_LOST,
]

// Query sensible o redirect anidado descartan el destino. 'tenant' es la
// entrada manual del baseline y se conserva.
const SENSITIVE_QUERY_KEY_PATTERN = /(token|secret|password|contrase|csrf|otp|codigo|sessionid|session_id)/i

function resolveSafeReturnDestination(
  router: Router,
  raw: string,
): ReturnType<Router['resolve']> | null {
  if (!raw.startsWith('/')) return null
  // protocol-relative (//host) y backslash tricks (\/host): origen externo.
  if (raw.startsWith('//') || raw.includes('\\')) return null

  let resolved: ReturnType<Router['resolve']>
  try {
    resolved = router.resolve(raw)
  } catch {
    return null
  }
  if (resolved.matched.length === 0) return null

  const name = resolved.name
  if (name === null || name === undefined) return null
  if (!REGISTERED_ROUTE_NAMES.has(String(name))) return null
  // El catch-all cubre rutas futuras: un destino no registrado se descarta.
  if (String(name) === ROUTE_NAMES.NOT_FOUND) return null
  // Ciclos auth: /login, /recuperar, /password-required, /contexto,
  // /contexto-perdido nunca son destino seguro.
  if (CONTROL_ROUTE_NAMES.includes(String(name))) return null

  for (const key of Object.keys(resolved.query)) {
    if (key.toLowerCase() === 'redirect') return null
    if (SENSITIVE_QUERY_KEY_PATTERN.test(key)) return null
  }
  return resolved
}

export function registerDashboardGuards(router: Router): void {
  let attemptSequence = 0
  let guardSequence = 0

  router.beforeEach(async (to): Promise<NavigationGuardReturn> => {
    const guardAttempt = ++guardSequence
    // Store dentro del callback, tras Pinia instalado por main.ts.
    const session = useSessionStore()
    const readSessionStatus = (): SessionStatus => session.status
    const readSessionContext = () => session.context
    const toName = to.name === null || to.name === undefined ? null : String(to.name)

    // Redirect sin self-redirect: si el destino coincide con la ruta
    // actual, la navegación continúa.
    const redirectControl = (name: string): NavigationGuardReturn =>
      toName === name ? true : { name }

    const requiresTenant = to.meta.requiresTenant === true
      || toName === ROUTE_NAMES.DASHBOARD
    const requiresPrincipal = to.meta.requiresTenant === false
    const isReturnCandidate = requiresTenant || requiresPrincipal

    // La URL porta el tenant: ?tenant= es el único portador del código a
    // través de una recarga completa. Un valor no-cadena (ausente o array)
    // se trata como vacío y la fusión final lo reescribe con el store.
    const queryTenant = typeof to.query.tenant === 'string'
      ? to.query.tenant.trim()
      : ''

    const retainReturnDestination = (): void => {
      if (!isReturnCandidate || session.pendingRedirect !== null) return
      if (!resolveSafeReturnDestination(router, to.fullPath)) return

      attemptSequence += 1
      if (!Number.isSafeInteger(attemptSequence)) attemptSequence = 1
      session.setPendingRedirect(to.fullPath, attemptSequence)
    }

    const consumePrincipalOnlyReturn = (): string | null => {
      if (!session.identity || session.identity.must_change_password) return null
      const pending = session.pendingRedirect
      if (!pending) return null

      const destination = resolveSafeReturnDestination(router, pending.destination)
      if (destination?.meta.requiresTenant !== false) return null

      const consumed = session.consumePendingRedirect(pending.attempt)
      return consumed !== null && consumed !== to.fullPath ? consumed : null
    }

    // Públicos y 404: permitidos, cero GET, cero consumo del slot.
    if (toName !== null && FETCH_FREE_ROUTE_NAMES.includes(toName)) return true

    let mustChangePassword = session.identity?.must_change_password === true

    if (toName === ROUTE_NAMES.PASSWORD_REQUIRED) {
      // Camino propio acreditado: login 200 con flag true, id disponible,
      // sin contexto previo ni unidad.
      if (mustChangePassword) return true
      // Sin identidad forzada: resuelve por el flujo central (no se
      // redirige a la misma superficie).
    } else if (toName === ROUTE_NAMES.CONTEXT) {
      if (mustChangePassword) return redirectControl(ROUTE_NAMES.PASSWORD_REQUIRED)
      // Captura inicial sin T o consolidación con T: permitida, cero GET.
      return true
    }

    // Las rutas sin clasificación de control o privacidad quedan cerradas.
    if (!requiresTenant && !requiresPrincipal && toName !== ROUTE_NAMES.PASSWORD_REQUIRED) {
      return redirectControl(ROUTE_NAMES.LOGIN)
    }

    if (session.status === SESSION_STATUS.CONTEXT_LOST) {
      // Contexto ya resuelto sin tenant: superficie distinta de la
      // captura inicial, sin consumo y sin consulta.
      retainReturnDestination()
      return redirectControl(ROUTE_NAMES.CONTEXT_LOST)
    }

    if (session.status === SESSION_STATUS.ANONYMOUS) {
      // Ausencia/pérdida de sesión acreditada o cierre local: login.
      // El destino seguro persiste si el store no lo purgó; no hay
      // rebootstrap automático desde cookie.
      retainReturnDestination()
      return redirectControl(ROUTE_NAMES.LOGIN)
    }

    // Recarga fresca: el store adopta el tenant portado por la URL antes de
    // decidir. Las ausencias acreditadas (CONTEXT_LOST/ANONYMOUS) ya
    // resolvieron arriba: sobre ellas no hay captura ni auto-login (F7).
    if ((requiresTenant || requiresPrincipal)
      && queryTenant
      && queryTenant !== session.tenantCode.trim()) {
      session.captureTenant(queryTenant)
      mustChangePassword = session.identity?.must_change_password === true
    }

    if (requiresPrincipal) {
      if (mustChangePassword) {
        retainReturnDestination()
        return redirectControl(ROUTE_NAMES.PASSWORD_REQUIRED)
      }
      if (!session.identity) {
        // Recarga completa en ruta principal-only: la URL porta el tenant y
        // la cookie de sesión puede seguir viva. Reautenticar contra el
        // backend antes de expulsar a login; ausencia acreditada no se
        // re-bootstrappea.
        if (session.tenantCode.trim() && readSessionStatus() !== SESSION_STATUS.ANONYMOUS) {
          await session.ensureContext()
          if (guardAttempt !== guardSequence) return false
          const statusAfterBootstrap: SessionStatus = readSessionStatus()
          if (statusAfterBootstrap === SESSION_STATUS.CONTEXT_LOST) {
            retainReturnDestination()
            return redirectControl(ROUTE_NAMES.CONTEXT_LOST)
          }
        }
        const restoredIdentity = session.identity as SessionState['identity']
        if (!restoredIdentity) {
          retainReturnDestination()
          return redirectControl(ROUTE_NAMES.LOGIN)
        }
        if (restoredIdentity.must_change_password === true) {
          retainReturnDestination()
          return redirectControl(ROUTE_NAMES.PASSWORD_REQUIRED)
        }
      }

      const principalReturn = consumePrincipalOnlyReturn()
      if (principalReturn !== null) return principalReturn
      // requiresTenant:false no convierte la ruta en pública ni exige
      // tenant, contexto o unidad para la identidad autenticada.
      return true
    }

    // Una vuelta a preferencias propias solo necesita principal autenticado,
    // aunque el destino intermedio tras login sea el dashboard.
    if (!mustChangePassword) {
      const principalReturn = consumePrincipalOnlyReturn()
      if (principalReturn !== null) return principalReturn
    }

    if (!session.tenantCode.trim()) {
      // needs-tenant: captura manual en /contexto. Cero GET de contexto
      // sin T y no expulsión a login por memoria vacía.
      retainReturnDestination()
      return redirectControl(ROUTE_NAMES.CONTEXT)
    }

    if (mustChangePassword) {
      // Identidad con flag true antes de cualquier superficie operativa.
      retainReturnDestination()
      return redirectControl(ROUTE_NAMES.PASSWORD_REQUIRED)
    }

    if (session.status === SESSION_STATUS.FAILURE) {
      // failure: error visible en la superficie que originó la operación,
      // sin reconsulta por back/reentry ni auto-fetch.
      retainReturnDestination()
      const origin = session.failure?.operation
      if (origin === SESSION_OPERATION.LOGIN) return redirectControl(ROUTE_NAMES.LOGIN)
      if (origin === SESSION_OPERATION.CHANGE_REQUIRED_PASSWORD) {
        return redirectControl(ROUTE_NAMES.PASSWORD_REQUIRED)
      }
      return redirectControl(ROUTE_NAMES.CONTEXT)
    }

    // Con T y contexto pendiente: única consulta en vuelo por generación,
    // compartida entre sesión, guards y dashboard (singleflight del store).
    // booting/needs-tenant con T son transitorios y se esperan aquí.
    if (!session.context) {
      retainReturnDestination()
      const generationBeforeEnsure = session.generation
      const principalBeforeEnsure = session.identity?.id_usuario ?? null
      const tenantBeforeEnsure = session.tenantCode.trim()
      const pendingAttemptBeforeEnsure = session.pendingRedirect?.attempt ?? null
      await session.ensureContext()

      const statusAfterEnsure: SessionStatus = readSessionStatus()
      const contextAfterEnsure = readSessionContext()
      if (guardAttempt !== guardSequence) return false
      if (statusAfterEnsure === SESSION_STATUS.CONTEXT_LOST) {
        return redirectControl(ROUTE_NAMES.CONTEXT_LOST)
      }
      if (statusAfterEnsure === SESSION_STATUS.ANONYMOUS) {
        return redirectControl(ROUTE_NAMES.LOGIN)
      }

      const principalAfterEnsure = session.identity?.id_usuario ?? null
      if (
        principalBeforeEnsure !== null
        && principalAfterEnsure !== null
        && principalAfterEnsure !== principalBeforeEnsure
      ) return false
      if (session.pendingRedirect?.attempt !== pendingAttemptBeforeEnsure) return false
      if (session.tenantCode.trim() !== tenantBeforeEnsure) return false

      if (
        session.generation !== generationBeforeEnsure
        && statusAfterEnsure === SESSION_STATUS.READY
        && (
          !contextAfterEnsure
          || !session.identity
          || contextAfterEnsure.user.id_usuario !== session.identity.id_usuario
          || (contextAfterEnsure.tenant.code?.trim() ?? '') !== session.tenantCode.trim()
        )
      ) return false

      if (session.identity?.must_change_password === true) {
        return redirectControl(ROUTE_NAMES.PASSWORD_REQUIRED)
      }
      if (statusAfterEnsure === SESSION_STATUS.FAILURE || !contextAfterEnsure) {
        // Red/timeout/abort/429 o payload inválido: error visible, cero
        // reconsulta automática en esta navegación.
        if (session.failure?.operation === SESSION_OPERATION.LOGIN) {
          return redirectControl(ROUTE_NAMES.LOGIN)
        }
        return redirectControl(ROUTE_NAMES.CONTEXT)
      }
    }

    const principalReturnAfterEnsure = consumePrincipalOnlyReturn()
    if (principalReturnAfterEnsure !== null) return principalReturnAfterEnsure

    if (!session.unitCode.trim()) {
      // Contexto 200 sin unidad: consolidación en /contexto conservando
      // el destino; el guard no hace un segundo retorno desde la vista.
      retainReturnDestination()
      return redirectControl(ROUTE_NAMES.CONTEXT)
    }

    // READY + flag false + contexto/unidad consolidados: resolución final.
    // Único consumidor: consume por el attempt del propio slot antes del
    // replace. READY de sesión no afirma éxito de datos del dashboard.
    const pending = session.pendingRedirect
    if (pending) {
      const resolvedDestination = resolveSafeReturnDestination(router, pending.destination)
      if (resolvedDestination?.meta.requiresTenant !== false) {
        const destination = session.consumePendingRedirect(pending.attempt)
        if (destination !== null && destination !== to.fullPath) {
          if (resolveSafeReturnDestination(router, destination) !== null) return destination
        }
      }
      // Sin destino, destino coincidente o invalidado: se retira igual el
      // slot de control (ya consumido) y se resuelve a '/' o a la
      // superficie destino original de esta navegación.
    }

    // Las vistas privadas aprobadas continúan en su destino; solo el control
    // password-required conserva su resolución F2 al dashboard.
    if (toName === ROUTE_NAMES.PASSWORD_REQUIRED) return redirectControl(ROUTE_NAMES.DASHBOARD)

    // Conservación del portador: una navegación autenticada que resuelve en
    // ruta requiresTenant sin ?tenant= se reescribe con el tenant del store
    // (replace), conservando path, queries y hash. Rutas públicas, /contexto
    // y principal-only nunca se reescriben. El re-run encuentra queryTenant
    // igual al store y resuelve: no hay ciclo.
    const knownTenant = session.tenantCode.trim()
    if (requiresTenant && knownTenant && queryTenant !== knownTenant) {
      return {
        path: to.path,
        query: { ...to.query, tenant: knownTenant },
        hash: to.hash,
        replace: true,
      }
    }
    return true
  })
}
