<script setup lang="ts">
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { getAuthorizationCatalog } from '../features/authorization/api'
import type { AuthorizationCatalogDto } from '../features/authorization/api'
import { useSessionStore } from '../stores/session'

interface ContextTenant {
  name?: string | null
  code?: string | null
}

interface ContextUnitMembership {
  unit_name?: string | null
  unit_code?: string | null
}

interface ContextAssignment {
  role?: string | null
  scope?: string | null
  is_primary?: boolean | null
}

interface ContextOrganizationUnit {
  id?: number | string | null
  id_unidad?: number | string | null
  organization_unit_id?: number | string | null
  unit_code?: string | null
  unit_name?: string | null
  name?: string | null
  code?: string | null
}

interface AuthContext {
  tenant?: ContextTenant | null
  unit_membership?: ContextUnitMembership | null
  active_organization_unit?: string | number | ContextOrganizationUnit | null
  assignments?: ContextAssignment[] | null
}

const props = withDefaults(
  defineProps<{
    context?: AuthContext | null
  }>(),
  {
    context: null,
  },
)

const primaryAssignment = computed<ContextAssignment | null>(() => (
  props.context?.assignments?.find((assignment) => assignment?.is_primary === true) ?? null
))

// Nombres de rol/alcance desde el catálogo real (`/authz/catalog/`), mismo
// patrón que IdentityView.roleLabel/scopeLabel: nombre con el código como
// apoyo; sin catálogo se conserva el código del contexto (nunca una etiqueta
// inventada).
const session = useSessionStore()
const authorizationCatalog = shallowRef<AuthorizationCatalogDto | null>(null)
let catalogController: AbortController | null = null

function loadAuthorizationCatalog(): void {
  if (props.context === null || session.tenantCode.trim() === '') return
  catalogController?.abort()
  const controller = new AbortController()
  catalogController = controller
  const generation = session.generation
  void getAuthorizationCatalog({
    tenantCode: session.tenantCode.trim(),
    unitCode: session.unitCode.trim(),
    signal: controller.signal,
  })
    .then((data) => {
      if (session.generation !== generation) return
      authorizationCatalog.value = data
    })
    .catch(() => {
      if (session.generation !== generation) return
      authorizationCatalog.value = null
    })
}

watch(
  () => `${props.context?.tenant?.code ?? ''}|${session.generation}`,
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
  if (code === null || code === undefined || code === '') return '—'
  const name = roleNames.value.get(code)
  return name ? `${name} (${code})` : code
}

function scopeLabel(code: string | null | undefined): string {
  if (code === null || code === undefined || code === '') return '—'
  const name = scopeNames.value.get(code)
  return name ? `${name} (${code})` : code
}

function displayValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function displayUnit(unit: AuthContext['active_organization_unit']): string {
  if (unit === null || unit === undefined || unit === '') return '—'
  if (typeof unit === 'string') return unit
  if (typeof unit === 'number') return `ID #${unit}`

  const name = unit.name ?? unit.unit_name ?? unit.unit_code ?? unit.code
  if (name !== null && name !== undefined && name !== '') return String(name)

  const id = unit.id ?? unit.id_unidad ?? unit.organization_unit_id
  return id === null || id === undefined ? '—' : `ID #${id}`
}
</script>

<template>
  <article class="card context-card">
    <div class="card-head">
      <h2 id="context-title" class="card-title">Contexto recibido</h2>
    </div>
    <div class="card-body">
      <p v-if="!context" class="context-empty">Contexto no disponible.</p>
      <dl class="context-list">
        <div class="context-item">
          <dt>Institución</dt>
          <dd>{{ displayValue(context?.tenant?.name ?? context?.tenant?.code) }}</dd>
        </div>
        <div class="context-item">
          <dt>Membresía orgánica</dt>
          <dd>{{ displayValue(context?.unit_membership?.unit_name ?? context?.unit_membership?.unit_code) }}</dd>
          <dd v-if="context?.unit_membership?.unit_name && context?.unit_membership?.unit_code" class="context-detail">
            {{ context.unit_membership.unit_code }}
          </dd>
        </div>
        <div class="context-item">
          <dt>Unidad activa</dt>
          <dd>{{ displayUnit(context?.active_organization_unit) }}</dd>
        </div>
        <div class="context-item">
          <dt>Rol principal</dt>
          <dd>{{ roleLabel(primaryAssignment?.role) }}</dd>
        </div>
        <div class="context-item">
          <dt>Ámbito del puesto</dt>
          <dd>{{ scopeLabel(primaryAssignment?.scope) }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>
