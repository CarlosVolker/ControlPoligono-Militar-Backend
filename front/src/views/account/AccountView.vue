<script setup lang="ts">
/**
 * Mi cuenta — superficie self-service del principal autenticado (plan
 * `docs/specs/frontend-account-self-service.md`, F3; AC-1/AC-2/AC-3/AC-5/
 * AC-7/AC-9). Composición del composable `useOwnAccount` sobre el snapshot
 * vigente del SessionStore: datos propios reales, cero fixtures, `—` ante
 * falta real y limitaciones visibles donde la capacidad no existe. La
 * visibilidad la gobierna la clasificación de sesión de plan1 (meta
 * `visibility: session`); el forzado lo gobierna el guard.
 */
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AuthField from '../../components/ds/AuthField.vue'
import FormFeedback from '../../components/ds/FormFeedback.vue'
import { useSessionStore } from '../../stores/session'
import { useOwnAccount, OWN_PASSWORD_STATE, OWN_PROFILE_STATE } from '../../features/account/useOwnAccount'
import { getAuthorizationCatalog } from '../../features/authorization/api'
import type { AuthorizationCatalogDto } from '../../features/authorization/api'
import { ROUTE_NAMES } from '../../router/routes'

const session = useSessionStore()
const account = useOwnAccount()

const context = computed(() => session.context)

const credentialStateLabel = computed<string>(() => {
  if (context.value === null) return '—'
  return context.value.user.must_change_password ? 'Cambio requerido' : 'Al día'
})

function displayValue(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

const assignments = computed(() => context.value?.assignments ?? [])

// Clave estable por asignación: el contexto no trae id, así que se compone con
// sus datos reales; `index` solo desempata duplicados exactos.
function assignmentKey(assignment: { role: string; scope: string | null; organization_unit: string | null }, index: number): string {
  return `${assignment.role}|${assignment.scope ?? ''}|${assignment.organization_unit ?? ''}|${index}`
}

const passwordBusy = computed<boolean>(() => account.passwordState.value === OWN_PASSWORD_STATE.BUSY)
const passwordUncertain = computed<boolean>(
  () => account.passwordState.value === OWN_PASSWORD_STATE.UNCERTAIN,
)

const showPasswords = ref(false)

// Requisitos reales del backend (`control_poligono/settings.py`:
// AUTH_PASSWORD_VALIDATORS = similaridad, longitud mínima, contraseña común y
// solo-numérica). Sin catálogo no se inventa nada: son los validadores vigentes.
const PASSWORD_REQUIREMENTS = 'La nueva contraseña debe tener al menos 8 caracteres, no puede ser solo números, no puede ser una contraseña común y no debe parecerse a tus datos de cuenta.'

// Catálogo de roles/alcances para mostrar nombres en vez de códigos crudos
// (mismo patrón que IdentityView.roleLabel/scopeLabel: nombre y, si existe,
// código como apoyo; sin catálogo se conserva el código del contexto).
const authorizationCatalog = shallowRef<AuthorizationCatalogDto | null>(null)
let catalogController: AbortController | null = null

function loadAuthorizationCatalog(): void {
  if (context.value === null || session.tenantCode.trim() === '') return
  catalogController?.abort()
  const controller = new AbortController()
  catalogController = controller
  const generation = session.generation
  const connection = {
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    signal: controller.signal,
  }
  void getAuthorizationCatalog(connection)
    .then((data) => {
      if (session.generation !== generation) return
      authorizationCatalog.value = data
    })
    .catch(() => {
      // El código devuelto por el contexto sigue siendo el dato vigente.
      if (session.generation !== generation) return
      authorizationCatalog.value = null
    })
}

watch(
  () => `${context.value === null ? '' : context.value.tenant.code ?? ''}|${session.generation}`,
  () => loadAuthorizationCatalog(),
  { immediate: true },
)

onUnmounted(() => catalogController?.abort())

const roleNames = computed(() => new Map(
  (authorizationCatalog.value?.roles ?? []).map((role): [string, string] => [role.code, role.name]),
))
const scopeNames = computed(() => new Map(
  (authorizationCatalog.value?.scopes ?? []).map((scope): [string, string] => [scope.code, scope.name]),
))

function roleLabel(code: string | null | undefined): string {
  if (!code) return '—'
  const name = roleNames.value.get(code)
  return name ? `${name} (${code})` : code
}

function scopeLabel(code: string | null | undefined): string {
  if (!code) return '—'
  const name = scopeNames.value.get(code)
  return name ? `${name} (${code})` : code
}
</script>

<template>
  <div class="access-forms account-view">
    <header class="page-head">
      <div>
        <h1 class="page-title">Mi cuenta</h1>
        <p class="page-subtitle">Datos de la cuenta autenticada y cambio voluntario de contraseña.</p>
      </div>
    </header>

    <!-- AC-2: sin contexto consolidado, estado explícito con enlace a
         /contexto. Cero datos fabricados, cero GET de prueba. -->
    <article v-if="!account.hasConsolidatedContext.value" class="card">
      <div class="card-head">
        <h2 class="card-title">Contexto de cuenta</h2>
      </div>
      <div class="card-body">
        <div class="alert alert-warning" role="alert">
          Aún no hay un contexto operativo consolidado para esta sesión. La superficie muestra
          únicamente datos reales del backend; configura el contexto para verlos.
        </div>
        <RouterLink class="btn btn-primary" :to="{ name: ROUTE_NAMES.CONTEXT }">
          Configurar contexto
        </RouterLink>
      </div>
    </article>

    <template v-else>
      <!-- AC-1: datos propios del snapshot de contexto. -->
      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Cuenta</h2>
        </div>
        <div class="card-body">
          <table class="table table-centered">
            <caption class="visually-hidden">Datos propios de la cuenta desde el contexto</caption>
            <tbody>
              <tr>
                <th scope="row">Usuario</th>
                <td>{{ displayValue(context?.user.id_usuario) }}</td>
              </tr>
              <tr>
                <th scope="row">RUT</th>
                <td>{{ displayValue(context?.user.rut) }}</td>
              </tr>
              <tr>
                <th scope="row">Estado de credencial</th>
                <td>{{ credentialStateLabel }}</td>
              </tr>
              <tr>
                <th scope="row">Institución</th>
                <td>{{ displayValue(context?.tenant.code) }}</td>
              </tr>
              <tr>
                <th scope="row">Membresía orgánica</th>
                <td>{{ displayValue(context?.unit_membership?.unit_name ?? context?.unit_membership?.unit_code) }}</td>
              </tr>
              <tr>
                <th scope="row">Unidad activa</th>
                <td>{{ displayValue(context?.active_organization_unit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Asignaciones</h2>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-centered">
              <caption class="visually-hidden">Asignaciones devueltas por el contexto</caption>
              <thead>
                <tr>
                  <th scope="col">Rol</th>
                  <th scope="col">Alcance</th>
                  <th scope="col">Unidad</th>
                  <th scope="col">Principal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(assignment, index) in assignments" :key="assignmentKey(assignment, index)">
                  <td>{{ roleLabel(assignment.role) }}</td>
                  <td>{{ scopeLabel(assignment.scope) }}</td>
                  <td>{{ displayValue(assignment.organization_unit) }}</td>
                  <td>{{ assignment.is_primary ? 'Sí' : 'No' }}</td>
                </tr>
                <tr v-if="assignments.length === 0">
                  <td colspan="4">El contexto no devolvió asignaciones.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <!-- AC-5: ficha propia read-only sólo si el snapshot acredita el
           permiso; sin acreditación, limitación visible y cero request. -->
      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Ficha propia</h2>
          <p class="card-subtitle">Lectura acreditada por el contexto; sin edición desde esta superficie.</p>
        </div>
        <div class="card-body">
          <div v-if="account.canReadOwnProfile.value">
            <div v-if="account.profileState.value === OWN_PROFILE_STATE.LOADING" class="account-state" role="status">
              Consultando la ficha…
            </div>
            <div
              v-else-if="account.profileState.value === OWN_PROFILE_STATE.DENIED"
              class="alert alert-danger"
              role="alert"
            >
              <p>{{ account.profileDetail.value }}</p>
              <p class="card-text muted">Tu sesión sigue activa; el acceso lo decide el backend.</p>
            </div>
            <div
              v-else-if="account.profileState.value === OWN_PROFILE_STATE.ERROR"
              class="alert alert-danger"
              role="alert"
            >
              <p>{{ account.profileDetail.value }}</p>
              <button
                class="btn btn-outline-primary"
                type="button"
                @click="account.readOwnProfile()"
              >
                Reintentar lectura
              </button>
            </div>
            <div v-else-if="account.profile.value" class="table-responsive">
              <table class="table table-centered">
                <caption class="visually-hidden">Ficha propia devuelta por el backend (solo lectura)</caption>
                <tbody>
                  <tr>
                    <th scope="row">Nombre</th>
                    <td>{{ displayValue(`${account.profile.value.nombre} ${account.profile.value.apellido_paterno} ${account.profile.value.apellido_materno}`) }}</td>
                  </tr>
                  <tr>
                    <th scope="row">Grado</th>
                    <td>{{ displayValue(account.profile.value.grado) }}</td>
                  </tr>
                  <tr>
                    <th scope="row">Correo</th>
                    <td>{{ displayValue(account.profile.value.correo) }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="card-text muted">Solo lectura: esta superficie no edita la ficha.</p>
            </div>
            <div v-else class="account-state" role="status">
              No hay datos de ficha disponibles para el contexto acreditado.
            </div>
          </div>
          <div v-else class="alert alert-info" role="status">
            <p>
              Tu sesión no acredita permiso para ver la ficha: el nombre y el
              correo no son legibles aquí y no se consulta el backend para averiguarlo.
            </p>
            <p>
              El backend no expone edición del perfil propio: nombre y correo no
              se pueden cambiar desde este cliente.
            </p>
          </div>
        </div>
      </article>

      <!-- AC-3: cambio voluntario con disponibilidad por estado, ST-05/06/07
           y conciliación sin replay. AC-4: el forzado no se ofrece aquí; el
           guard lo gobierna. -->
      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Contraseña</h2>
        </div>
        <div class="card-body">
          <form
            v-if="account.voluntaryChangeAvailable.value"
            class="account-password-form"
            autocomplete="off"
            @submit.prevent="account.submitPasswordChange()"
          >
            <p id="account-password-requirements" class="card-text muted">{{ PASSWORD_REQUIREMENTS }}</p>
            <div class="account-actions">
              <button
                class="btn btn-outline-secondary"
                type="button"
                :aria-pressed="showPasswords"
                aria-controls="account-old-password account-new-password account-confirm-password"
                @click="showPasswords = !showPasswords"
              >
                {{ showPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas' }}
              </button>
            </div>
            <AuthField
              v-model="account.passwordDraft.old_password"
              label="Contraseña actual"
              name="account-old-password"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="current-password"
              required
              :disabled="passwordBusy || passwordUncertain"
              :error="account.passwordFieldErrors.old_password ?? null"
            />
            <AuthField
              v-model="account.passwordDraft.new_password"
              label="Nueva contraseña"
              name="account-new-password"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="new-password"
              required
              :disabled="passwordBusy || passwordUncertain"
              :error="account.passwordFieldErrors.new_password ?? null"
            />
            <AuthField
              v-model="account.passwordDraft.confirm_password"
              label="Confirmar nueva contraseña"
              name="account-confirm-password"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="new-password"
              required
              :disabled="passwordBusy || passwordUncertain"
              :error="account.passwordFieldErrors.confirm_password ?? null"
            />

            <FormFeedback :feedback="account.passwordFeedback.value" :busy="passwordBusy" busy-message="Actualizando contraseña…" />

            <div class="account-actions">
              <button
                class="btn btn-primary"
                type="submit"
                :disabled="passwordBusy || passwordUncertain"
              >
                {{ passwordBusy ? 'Procesando…' : 'Cambiar contraseña' }}
              </button>
              <button
                v-if="passwordUncertain"
                class="btn btn-outline-primary"
                type="button"
                @click="account.reconcileContext()"
              >
                Reconciliar contexto
              </button>
            </div>

            <p v-if="passwordUncertain" class="card-text muted">
              El envío anterior no se reintentará solo; reconciliar solo vuelve a
              leer el contexto vigente.
            </p>
          </form>

          <div v-else-if="account.credentialForced.value" class="alert alert-warning" role="alert">
            El sistema requiere un cambio de contraseña obligatorio; la aplicación dirige
            a ese flujo y esta superficie no lo salta.
          </div>

          <div v-else class="alert alert-warning" role="status">
            <p>
              El cambio voluntario requiere institución activa y credencial confirmada.
              Configura o consolida el contexto para habilitarlo.
            </p>
            <RouterLink class="btn btn-primary" :to="{ name: ROUTE_NAMES.CONTEXT }">
              Configurar contexto
            </RouterLink>
          </div>
        </div>
      </article>

      <!-- AC-7: la recuperación se presenta como flujo de acceso perdido, no
           autenticado; sin envío de código desde sesión. -->
      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Accesos relacionados</h2>
        </div>
        <div class="card-body">
          <div class="account-actions">
            <RouterLink class="btn btn-outline-primary" :to="{ name: ROUTE_NAMES.RECOVERY }">
              Recuperar acceso
            </RouterLink>
            <RouterLink class="btn btn-outline-primary" :to="{ name: ROUTE_NAMES.PERSONALIZER }">
              Personalizador de apariencia
            </RouterLink>
          </div>
          <p class="card-text muted">
            La recuperación es el flujo para cuando no puedes ingresar con tus credenciales
            actuales; se gestiona fuera de la sesión autenticada.
          </p>
        </div>
      </article>
    </template>
  </div>
</template>

<style scoped>
/* Valores literales del patrón vigente ya transliterado en el cliente:
   ShootingView .shooting-actions (línea 2073) y .shooting-state (2075).
   Sin valores nuevos; adaptación = nombre de clase propio con anatomía
   idéntica. Reportada en el cierre. */
.account-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}
.account-actions .btn{margin:0;}
.account-state{padding:16px 0;color:var(--muted);}
</style>
