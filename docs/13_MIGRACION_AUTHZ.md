# Plan de Migración del Sistema de Autorización

**Estado:** Pendiente de implementación  
**Fecha de análisis:** 2026-06-03  
**Prioridad:** Alta — la arquitectura actual tiene deudas técnicas que limitan el crecimiento del sistema

---

## Contexto y motivación

El sistema actual de autorización funciona, pero tiene tres limitaciones estructurales que se hacen evidentes a medida que el proyecto crece:

1. **No existe separación entre pertenencia orgánica y puesto funcional.** Hoy un `Assignment` cumple ambos roles: "Juan pertenece a la Compañía A" y "Juan es Oficial de Tiro de la Compañía A" son el mismo objeto. Esto impide representar correctamente a un tirador sin puesto funcional.

2. **Los roles son globales**, no por institución (tenant). Dos instituciones no pueden configurar permisos distintos para el mismo rol.

3. **Los permisos son strings `recurso:acción`** sin catálogo tipado. El frontend no puede hacer introspección; los permisos se inventan dispersos en el código.

Adicionalmente, existe una **migración a mitad** en el código: la arquitectura nueva (`Position → Assignment`) está creada en BD, pero el código todavía usa campos legacy (`role/scope_policy/organization_unit` directos en `Assignment`) en varios puntos.

---

## Principios del nuevo modelo

Conforme al análisis del dominio:

- Las **unidades NO otorgan permisos** — son contexto organizacional
- La **pertenencia** a una unidad (`UnitMembership`) es distinta de **ocupar un puesto** en ella (`Assignment`)
- Los **puestos** (`Position`) otorgan permisos en el contexto de una unidad específica
- Los **roles técnicos** (`Role`) son privilegios de sistema, no cargos militares
- Un usuario puede tener **múltiples puestos** activos simultáneamente

---

## Diagnóstico del sistema actual

### Pipeline de autorización (cómo funciona hoy)

```
Request HTTP
  │
  ├── SessionCsrfAuthentication → request.user (sesión Django)
  ├── TenantContextMiddleware   → request.tenant (header X-Tenant-Code)
  │
  └── DRF Permission classes:
       ├── IsAuthenticated
       ├── HasTenantAccess        → busca Account activo (user, tenant)
       │                            → request.identity_account
       └── HasResourcePermission  → evalúa en orden:
            1. MASTER bypass (super_admin → ALLOW todo)
            2. Override DENY       → DENY
            3. Override ALLOW      → ALLOW
            4. PermissionRule      → ALLOW/DENY según (role, resource, action)
            5. sin match           → DENY 403
```

### Modelos existentes y sus relaciones

```
Tenant
  ├── OrganizationUnit (árbol jerárquico, parent FK a self)
  ├── Account (User + Person + Tenant)
  │    └── Assignment (holder de un Position)
  │         ├── position FK → Position (nuevo)
  │         ├── role FK          (legacy, deprecado)
  │         ├── scope_policy FK  (legacy, deprecado)
  │         └── organization_unit FK (legacy, deprecado)
  └── Position (puesto estable)
       ├── role FK → Role
       ├── scope_policy FK → ScopePolicy
       ├── organization_unit FK
       └── armory FK (opcional)

Role (global, sin tenant)
  └── PermissionRule (resource, action, allowed)

ScopePolicy (global, sin tenant)
UserPermissionOverride (override individual por account)
AccessAudit (log)
```

### Deudas técnicas identificadas

| ID | Deuda | Severidad | Impacto |
|---|---|---|---|
| D1 | `Assignment` tiene campos legacy (`role`, `scope_policy`, `organization_unit`) conviviendo con `position` | Alta | Código ambiguo, dos fuentes de verdad |
| D2 | `Role` sin FK tenant — no permite permisos por institución | Media | Todos los tenants comparten el mismo catálogo |
| D3 | No existe `UnitMembership` — pertenencia y puesto son el mismo objeto | Alta | No se puede representar tiradores sin puesto formal |
| D4 | Permisos como strings `recurso:acción` sin catálogo tipado | Media | Frontend no puede hacer introspección |
| D5 | `views.py::_is_global_admin` lee campo legacy `role__code__in` | Media | Inconsistencia: ignora Position |
| D6 | `TenantScopedQuerysetMixin.perform_create` lee `assignment.organization_unit` legacy | Media | Puede derivar unidad incorrecta |
| D7 | `_ensure_tirador_assignment` crea Assignment sin Position | Media | Assignments sin Position en producción |
| D8 | `Usuario.rol` (`admin/limitado/tirador`) no controla ningún permiso | Baja | Campo confuso que no hace nada |

---

## Mapa entre modelo actual y modelo propuesto

| Entidad propuesta | Estado actual | Cambios |
|---|---|---|
| `User` | `Usuario` (AbstractUser) | Mantener. Limpiar `rol` legacy en FASE 6 |
| `Unit` | `OrganizationUnit` | Sin cambios |
| **`UnitMembership`** | No existe | Crear nuevo modelo |
| `Position` | `Position` en `identity` | Sin cambios estructurales |
| `Role` | `Role` en `authorization` | Agregar FK `tenant` nullable |
| **`Permission`** | Implícito en `PermissionRule.resource:action` | Crear modelo con catálogo tipado |
| `UserPosition` | `Assignment` | Limpiar campos legacy, hacer `position` NOT NULL en FASE 5 |
| `UserRole` | Assignment sin Position | Cubrir con `UnitMembership` + Assignment con Position |
| **`RolePermission`** | `PermissionRule` | Nuevo modelo que reemplaza `PermissionRule` |
| **`PositionPermission`** | No existe | Nuevo modelo — permisos extra por puesto específico |
| `UserPermissionOverride` | Existe | Agregar FK a `Permission` (FASE 3) |
| `ScopePolicy` | Existe | Sin cambios |
| `AccessAudit` | Existe | Sin cambios |

---

## Catálogo de permisos propuesto

El nuevo sistema usa permisos atómicos con códigos descriptivos en lugar de pares `resource:action`.

### Información personal
| Código | Descripción |
|---|---|
| `view_self` | Ver propio perfil |
| `edit_self` | Editar información personal autorizada |

### Personal
| Código | Descripción |
|---|---|
| `view_personnel_basic` | Ver información básica del personal |
| `view_personnel_full` | Ver información completa del personal |
| `manage_personnel` | Gestionar información de personal |

### Puestos
| Código | Descripción |
|---|---|
| `assign_positions` | Asignar puestos a personas |
| `revoke_positions` | Revocar puestos |

### Unidades
| Código | Descripción |
|---|---|
| `view_unit` | Ver información de una unidad |
| `view_unit_hierarchy` | Ver estructura jerárquica de unidades |
| `create_unit` | Crear unidades |
| `update_unit` | Modificar unidades |
| `delete_unit` | Eliminar unidades |

### Comandancias
| Código | Descripción |
|---|---|
| `assign_commanders` | Designar comandantes de unidad |
| `revoke_commanders` | Revocar comandancias |

### Usuarios
| Código | Descripción |
|---|---|
| `create_users` | Crear usuarios en el sistema |
| `update_users` | Modificar información de usuarios |
| `disable_users` | Desactivar usuarios |

### Lecciones de tiro
| Código | Descripción |
|---|---|
| `create_shooting_lessons` | Crear lecciones de tiro |
| `update_shooting_lessons` | Modificar lecciones de tiro |
| `delete_shooting_lessons` | Eliminar lecciones de tiro |
| `assign_shooters` | Asignar tiradores a una lección |
| `remove_shooters` | Retirar tiradores de una lección |
| `score_shooters` | Registrar resultados de tiro |
| `validate_scores` | Validar y certificar resultados |

### Almacenes
| Código | Descripción |
|---|---|
| `view_warehouse` | Ver inventario de almacén |
| `create_warehouse_records` | Registrar material en almacén |
| `update_warehouse_records` | Modificar registros de almacén |
| `delete_warehouse_records` | Eliminar registros de almacén |
| `transfer_warehouse_material` | Registrar movimientos de material |
| `inventory_warehouse` | Realizar inventario formal |

### Administración del sistema
| Código | Descripción |
|---|---|
| `manage_roles` | Administrar roles técnicos |
| `manage_permissions` | Administrar permisos del sistema |
| `view_audit_logs` | Revisar registros de auditoría |
| `manage_system_settings` | Modificar configuración global |

---

## Mapa de equivalencias: permisos actuales → nuevos

| Actual (`resource:action`) | Nuevo (`permission_code`) |
|---|---|
| `user:create` | `create_users` |
| `user:read` | `view_personnel_basic` |
| `user:update` | `update_users` |
| `user:delete` | `disable_users` |
| `user:read_own` | `view_self` |
| `organization_unit:read` | `view_unit` |
| `organization_unit:create` | `create_unit` |
| `organization_unit:update` | `update_unit` |
| `organization_unit:delete` | `delete_unit` |
| `weapon:read` | `view_warehouse` |
| `weapon:create` | `create_warehouse_records` |
| `weapon:update` | `update_warehouse_records` |
| `weapon:delete` | `delete_warehouse_records` |
| `armory:read` | `view_warehouse` |
| `armory:create` | `create_warehouse_records` |
| `armory:update` | `update_warehouse_records` |
| `armory:delete` | `delete_warehouse_records` |
| `range:read` | `view_unit` |
| `range:create` | `create_shooting_lessons` |
| `range:update` | `update_shooting_lessons` |
| `shooting_session:create` | `create_shooting_lessons` |
| `shooting_session:read` | `view_unit` |
| `shooting_session:update` | `update_shooting_lessons` |
| `shooting_session:delete` | `delete_shooting_lessons` |
| `shooting_fraction:create` | `create_shooting_lessons` |
| `shooting_fraction:read` | `view_unit` |
| `shooting_fraction:update` | `update_shooting_lessons` |
| `shooting_fraction:delete` | `delete_shooting_lessons` |
| `shooting_result:create` | `score_shooters` |
| `shooting_result:read` | `view_personnel_basic` |
| `shooting_result:read_own` | `view_self` |
| `shooting_result:update` | `score_shooters` |
| `shooting_result:delete` | `score_shooters` |
| `shooting_result:read_summary` | `view_unit` |
| `shooting_result:export` | `view_personnel_full` |
| `position:read` | `view_unit` |
| `position:create` | `assign_positions` |
| `position:update` | `assign_positions` |
| `position:delete` | `revoke_positions` |
| `*:*` | todos los permisos (super_admin / tenant_admin) |

---

## Riesgos de migración

| ID | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | `Role` sin tenant FK: al agregar FK, las reglas de unicidad `code` deben reemplazarse | Alta | Migración en dos pasos: añadir FK nullable → crear constraints nuevos → eliminar constraint viejo |
| R2 | Assignments sin `position_id` (legacy): hacer position NOT NULL antes de migrar todos rompería tests y datos | Alta | `position` pasa a NOT NULL solo en FASE 5, después de verificar que no existen orphans |
| R3 | `test_legacy.py` crea Assignments con campos legacy directamente | Alta | Los tests se actualizan en FASE 1 para usar `force_login` + `position`-based setup |
| R4 | `_is_global_admin` en views.py lee campo legacy | Media | Corregir en FASE 1 para leer `effective_role` |
| R5 | Mapeo `resource:action → permission_code` no es 1:1 | Media | Algunos permisos actuales mapean a más de un código nuevo; mantener compatibilidad en `HasResourcePermission` durante FASE 3 |
| R6 | `init_access_model.py` crea Assignments sin Position | Media | Reescribir en FASE 1 para crear Positions antes de Assignments |
| R7 | `Person.document_id` es unique global | Baja | No afecta esta migración; deuda futura si hay traslados entre ramas |

---

## Plan de implementación por fases

### FASE 1 — Completar compatibilidad del código existente
**Tipo:** Solo código, cero cambios de esquema  
**Riesgo:** Mínimo  
**Duración estimada:** 1–2 días

**Objetivo:** Que todo el código use `effective_role/effective_scope/effective_unit` en vez de los campos legacy directamente. Sin esta fase, las fases siguientes construyen sobre base inestable.

**Cambios:**
1. `views.py::_is_global_admin` → usar `assignment.effective_role.code` en vez de `assignment.role__code`
2. `TenantScopedQuerysetMixin.perform_create` → usar `assignment.effective_unit` en vez de `assignment.organization_unit`
3. `views.py::_ensure_tirador_assignment` → crear Assignment con `position=` si existe Position de tirador
4. `init_access_model.py` → crear Positions antes de Assignments; no crear Assignments sin position
5. Tests en `test_legacy.py` → reemplazar setup con `force_login` + Assignments via Position donde corresponda

**Criterio de completitud:** 35 tests pasan. `grep -r "assignment.role\b\|assignment\.scope_policy\b\|assignment\.organization_unit\b"` devuelve solo migraciones y factories, no lógica de negocio.

---

### FASE 2 — Catálogo Permission + UnitMembership ✅ COMPLETADA
**Tipo:** Migraciones nuevas (additive), sin cambios en lógica de autorización  
**Riesgo:** Bajo — cambios aditivos, rollback en una migración  
**Completada:** 2026-06-03

**Objetivo:** Que el nuevo catálogo de permisos y la pertenencia orgánica existan en la BD, aunque aún no se usen en el pipeline de autorización.

**Cambios:**

*Modelos nuevos:*
```python
# apps/authorization/models.py
class Permission(models.Model):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

# apps/identity/models.py
class UnitMembership(models.Model):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='unit_memberships')
    unit = models.ForeignKey('organizations.OrganizationUnit', on_delete=models.PROTECT)
    is_primary = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

*Modificación de Role:*
```python
# Agregar FK tenant nullable
tenant = models.ForeignKey('tenants.Tenant', null=True, blank=True, on_delete=models.CASCADE)
is_system = models.BooleanField(default=False)  # super_admin, tenant_admin
```

*Migraciones:*
- `authorization/0007_permission_catalog.py` → crea `Permission`, data migration puebla catálogo
- `authorization/0008_role_tenant_fk.py` → agrega `tenant` nullable a Role, reemplaza constraint unique(code)
- `identity/0004_unit_membership.py` → crea `UnitMembership`, data migration puebla desde Assignments activos

*Management command nuevo:* `init_permissions` — crea/actualiza el catálogo de Permission (idempotente)

*`init_access_model.py` actualizado:* también crea UnitMembership al poblar Assignments iniciales

**Endpoint `/api/auth/context/` — nuevo campo (aditivo, no rompe nada):**
```json
{
  "unit_membership": {
    "primary_unit_code": "BAT-4",
    "primary_unit_name": "Batallón 4 Membrillar"
  }
}
```

**Tests nuevos:**
- `test_unit_membership.py` — CRUD, unicidad de primario, data migration
- `test_permission_catalog.py` — catálogo completo, idempotencia de init_permissions

**Criterio de completitud:** 35 tests + nuevos pasan. `Permission.objects.count() == 30+`. `UnitMembership` se crea al usar `init_access_model`.

---

### FASE 3 — Nuevo pipeline de permisos con feature flag ✅ COMPLETADA
**Tipo:** Nuevos modelos + modificación de `HasResourcePermission` con dual-path  
**Riesgo:** Medio — el pipeline de autorización cambia, pero el path legacy se mantiene activo  
**Completada:** 2026-06-03

**Objetivo:** El sistema puede usar el nuevo catálogo `Permission` para evaluar accesos, activable por feature flag.

**Nuevos modelos:**
```python
class RolePermission(models.Model):
    """Reemplaza PermissionRule. Liga un Role a un Permission."""
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    allowed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('role', 'permission')

class PositionPermission(models.Model):
    """Permisos extra que otorga un puesto específico (independiente del Role)."""
    position = models.ForeignKey('identity.Position', on_delete=models.CASCADE, related_name='position_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    allowed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('position', 'permission')
```

*Feature flag en settings.py:*
```python
AUTHZ_USE_PERMISSION_MODEL = False  # True activa el nuevo pipeline
```

*Modificación de `HasResourcePermission`:*
```python
if settings.AUTHZ_USE_PERMISSION_MODEL:
    return _has_permission_v2(account, permission_code)
else:
    return _has_role_permission(account, resource, action)  # path actual
```

*Nuevo pipeline `_has_permission_v2`:*
1. MASTER bypass (sin cambio)
2. Override DENY (por `permission.code` o por legacy `resource:action`)
3. Override ALLOW
4. `PositionPermission` de la Position del Assignment primario
5. `RolePermission` del Role de esa Position
6. DENY si ninguno hace match

*Data migration:* convierte `PermissionRule` existentes a `RolePermission` usando el mapa de equivalencias del catálogo.

*Modificación de `UserPermissionOverride`:* agregar `permission FK` nullable (mantener `resource/action` legacy durante transición).

*Endpoint `/api/auth/context/` — nuevo campo `permissions`:*
```json
{
  "permissions": [
    "view_unit",
    "view_personnel_basic",
    "create_shooting_lessons",
    "score_shooters"
  ],
  "scopes": ["unidad_y_descendientes"],
  "roles": ["oficial_tiro"]
}
```
Los campos `scopes` y `roles` se mantienen para compatibilidad con el frontend actual.

*Cada ViewSet agrega `permission_code` además de `resource_name`:*
```python
class LeccionTiroViewSet(...):
    resource_name = 'shooting_session'     # legacy, mantener
    permission_code_map = {                # nuevo
        'create': 'create_shooting_lessons',
        'retrieve': 'view_unit',
        'update': 'update_shooting_lessons',
        'destroy': 'delete_shooting_lessons',
    }
```

**Tests:**
- `test_permissions_v2.py` — mismo conjunto de tests de precedencia pero con `AUTHZ_USE_PERMISSION_MODEL=True`
- Verificar que activar el flag no cambia el resultado de los 35 tests existentes

**Criterio de completitud:** Con flag `False`, comportamiento idéntico al actual. Con flag `True`, mismos resultados. Tests de precedencia pasan en ambos modos.

---

### FASE 4 — UnitMembership como fuente de scope ✅ COMPLETADA (2026-06-03)
**Tipo:** Modificación de `scope.py` con feature flag  
**Riesgo:** Medio — el scope determina qué datos ve cada usuario  
**Duración estimada:** 2–3 días

**Objetivo:** `get_allowed_unit_ids` lee de `UnitMembership` en vez de `Assignment.organization_unit` legacy.

*Feature flag:*
```python
AUTHZ_USE_UNIT_MEMBERSHIP = False  # True activa UnitMembership como fuente de scope
```

*`scope.py::get_allowed_unit_ids` dual-path:*
```python
def get_allowed_unit_ids(account):
    if settings.AUTHZ_USE_UNIT_MEMBERSHIP:
        return _get_allowed_unit_ids_v2(account)
    return _get_allowed_unit_ids_legacy(account)

def _get_allowed_unit_ids_v2(account):
    # Lee UnitMembership activo del account
    # El tipo de scope (árbol vs solo unidad) sigue viniendo del Assignment primario
    membership = account.unit_memberships.filter(is_primary=True, is_active=True).first()
    if not membership:
        return set()
    assignment = account.assignments.filter(is_primary=True, is_active=True).first()
    scope = assignment.effective_scope if assignment else None
    if scope and scope.code in TREE_SCOPE_CODES:
        return {membership.unit_id} | _descendant_ids({membership.unit_id})
    return {membership.unit_id}
```

*`SelectActiveUnitView` actualizado:* cambia unidad activa usando `UnitMembership.is_primary` en vez de `Assignment.is_primary`.

*`PersonasPorUnidadView` actualizado:* usa `UnitMembership` para listar personas de una unidad.

*`perform_create` en `TenantScopedQuerysetMixin:*` deriva unidad del contexto desde `UnitMembership` primario.

**Criterio de completitud:** Con flag `True`, los scope tests pasan. `SelectActiveUnitView` actualiza `UnitMembership.is_primary`.

---

### FASE 5 — Limpieza de campos legacy en Assignment ✅ COMPLETADA (2026-06-03)
**Prerrequisito:** FASES 1–4 en producción por al menos 2 semanas sin incidentes  
**Tipo:** Migraciones destructivas + limpieza de código  
**Riesgo:** Alto — cambios irreversibles sin backup  
**Duración estimada:** 2–3 días

**Objetivo:** `Assignment.position` pasa a NOT NULL. Eliminar campos legacy.

**Verificación previa (RunPython guard):**
```python
def check_no_orphan_assignments(apps, schema_editor):
    Assignment = apps.get_model('identity', 'Assignment')
    orphans = Assignment.objects.filter(position__isnull=True, is_active=True).count()
    if orphans > 0:
        raise Exception(f'{orphans} Assignments activos sin Position. Migrar antes.')
```

**Campos eliminados de Assignment:**
- `role` FK (legacy)
- `scope_policy` FK (legacy)
- `organization_unit` FK (legacy)

**Propiedades simplificadas:**
- `effective_role` → simplemente `position.role`
- `effective_scope` → simplemente `position.scope_policy`
- `effective_unit` → simplemente `position.organization_unit`

**`PermissionRule` eliminado:** reemplazado completamente por `RolePermission`.

**Criterio de completitud:** `python manage.py check` sin warnings. Todos los tests pasan. Cero referencias a campos legacy en el código.

---

### FASE 6 — Limpieza final del modelo Usuario ✅ COMPLETADA (2026-06-03)
**Tipo:** Migraciones simples + limpieza de código  
**Riesgo:** Bajo  
**Duración estimada:** 1 día

**Objetivo:** Eliminar artefactos legacy del modelo `Usuario`.

**Cambios:**
- Campo `rol` (`admin/limitado/tirador`) → eliminar o convertir en campo de display sin lógica
- Campos `unidad_regimentaria`, `unidad_combate`, `unidad_fundamental` → derivar solo al leer, no persistir
- Método `tiene_rol()` → eliminar

---

## Cambios en la API

### Endpoints nuevos (FASE 2 en adelante)

```
GET  /api/authz/permissions/           → Catálogo completo de permisos
GET  /api/memberships/                 → UnitMemberships del usuario autenticado
POST /api/memberships/                 → Crear membresía (assign_positions)
DELETE /api/memberships/{id}/          → Revocar membresía (revoke_positions)
GET  /api/authz/role-permissions/      → RolePermissions del tenant
POST /api/authz/role-permissions/      → Crear RolePermission (manage_permissions)
GET  /api/authz/position-permissions/  → PositionPermissions del tenant
```

### Endpoint `/api/auth/context/` — evolución

**Hoy (se mantiene en FASE 2):**
```json
{
  "user": { ... },
  "tenant": { ... },
  "assignments": [ ... ],
  "permissions": { "shooting_session": ["create", "read"] },
  "preferences": { ... }
}
```

**FASE 2 (campo aditivo):**
```json
{
  ...,
  "unit_membership": { "primary_unit_code": "BAT-4", "primary_unit_name": "..." }
}
```

**FASE 3 (campo permissions evoluciona):**
```json
{
  ...,
  "permissions": ["view_unit", "create_shooting_lessons", "score_shooters"],
  "permissions_legacy": { "shooting_session": ["create", "read"] }
}
```

**FASE 5 (limpieza final):**
```json
{
  "user": { ... },
  "tenant": { ... },
  "assignments": [ ... ],
  "permissions": ["view_unit", "create_shooting_lessons"],
  "unit_membership": { "primary_unit_code": "BAT-4", "primary_unit_name": "..." },
  "preferences": { ... }
}
```

---

## Cambios en el frontend

### FASE 2
- Leer `unit_membership.primary_unit_code` del context para mostrar la unidad del usuario
- No hay cambios en la lógica de permisos

### FASE 3
- Agregar función `hasPermission(code: string): boolean` al store de autenticación
- Migrar gradualmente de `canDo('shooting_session', 'create')` a `hasPermission('create_shooting_lessons')`
- Ambos métodos coexisten durante la transición

```typescript
// Antes (mantener temporalmente):
const canDo = (resource: string, action: string) =>
  store.permissions[resource]?.includes(action) ?? false

// Nuevo (agregar en FASE 3):
const hasPermission = (code: string) =>
  store.permissionCodes?.includes(code) ?? false
```

### FASE 5
- Eliminar `canDo` legacy
- Usar solo `hasPermission(code)`
- El campo `permissions_legacy` desaparece del context

---

## Estrategia de rollback por fase

| Fase | Rollback | Impacto |
|---|---|---|
| FASE 1 | Revertir commits de código | Cero — sin cambios de esquema |
| FASE 2 | `python manage.py migrate` a migration anterior; elimina `Permission`, `UnitMembership`, FK tenant en Role | Cero pérdida de datos operativos |
| FASE 3 | Desactivar `AUTHZ_USE_PERMISSION_MODEL = False` | Inmediato, sin migración |
| FASE 4 | Desactivar `AUTHZ_USE_UNIT_MEMBERSHIP = False` | Inmediato, sin migración |
| FASE 5 | Migración inversa + RunPython que repopula campos legacy desde Position | Requiere tiempo de downtime planificado |
| FASE 6 | Revertir commit de limpieza | Bajo riesgo |

---

## Casos de prueba necesarios

### Tests existentes que deben seguir pasando en todas las fases
- `test_permissions.py` — precedencia MASTER > Override > Role
- `test_positions.py` — Assignment via Position
- `test_scope.py` — filtrado por unidad y descendientes
- `test_legacy.py` — flujos de autenticación end-to-end

### Tests nuevos por fase

**FASE 2:**
```
test_unit_membership.py
  - UnitMembership crea pertenencia sin otorgar permisos
  - Un usuario con membresía pero sin Assignment no puede acceder a recursos
  - Solo una UnitMembership puede ser primaria por account activo
  - Data migration puebla correctamente desde Assignments existentes
  - init_access_model crea UnitMembership automáticamente

test_permission_catalog.py
  - El catálogo tiene exactamente los permisos definidos
  - init_permissions es idempotente
  - Permission.code es único
```

**FASE 3:**
```
test_permissions_v2.py
  - Con AUTHZ_USE_PERMISSION_MODEL=True, mismos resultados que v1
  - MASTER bypass funciona en v2
  - Override DENY funciona en v2
  - PositionPermission otorga permiso extra no heredado del Role
  - RolePermission mapea correctamente desde PermissionRule legacy
```

**FASE 4:**
```
test_scope_v2.py
  - Con AUTHZ_USE_UNIT_MEMBERSHIP=True, scope funciona igual que v1
  - SelectActiveUnit actualiza UnitMembership.is_primary
```

**Seguridad (FASE 3 en adelante):**
```
test_security_regression.py
  - Account del tenant A no puede ver UnitMemberships del tenant B
  - tenant_admin no puede asignar manage_system_settings a un rol operativo
  - Usuario con membresía sin Assignment activo recibe 403
  - MASTER bypass sobrevive eliminación de campos legacy (FASE 5)
```

---

## Cronograma estimado

```
FASE 1   ──── 2 días    Solo código, 0 riesgo
FASE 2   ──── 3 días    Modelos aditivos, rollback fácil
FASE 3   ──── 4 días    Pipeline dual-path con feature flag
FASE 4   ──── 3 días    Scope dual-path con feature flag
─────────────────────────────────────────────────────
         14 días hasta sistema nuevo funcionando en paralelo

FASE 5   ──── 3 días    Requiere 2 semanas de verificación post-FASE 4
FASE 6   ──── 1 día     Limpieza cosmética

TOTAL    ──── ~3 semanas de desarrollo + 2 semanas de observación
```

---

## Nota sobre el entorno de desarrollo

Dado que estamos en desarrollo y no hay datos sensibles que preservar, **se puede eliminar la base de datos y comenzar desde cero** antes de iniciar FASE 1. Esto elimina la necesidad de data migrations complejas para los datos de prueba actuales.

El comando para resetear la BD en desarrollo es:
```powershell
# Eliminar BD SQLite
Remove-Item db.sqlite3 -Force

# Recrear desde cero
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py init_access_model --tenant-code ejercito-demo --tenant-name "Ejército Demo"
.venv\Scripts\python.exe manage.py seed_org_tree
.venv\Scripts\python.exe manage.py crear_master --rut 99999999-9 --password Dev1234 --tenant-code ejercito-demo
.venv\Scripts\python.exe manage.py seed_positions --tenant-code ejercito-demo
```
