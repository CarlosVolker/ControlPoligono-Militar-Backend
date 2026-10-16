---
spec_meta: "../spec-meta.yaml"
---

# Contrato: RBAC y catálogos de autorización

## Evaluación de permisos

Para ViewSets con `HasResourcePermission`, el handler resuelve método/`action_permission_map` y consulta `RESOURCE_ACTION_TO_PERMISSION`. El orden efectivo es: bypass `super_admin`, override DENY, override ALLOW, `PositionPermission`, `RolePermission`, DENY. `HasTenantAccess` exige `Account` activa en tenant. Fuentes: `apps/authorization/permissions.py:26-104,124-289`.

## Roles, scopes y permisos

| Recurso | Campos | Acceso / restricciones |
|---|---|---|
| Role | `id` RO; W* `code,name`; W? `description,is_active,is_system` | GET IA+TA; mutación IA+TA+TAdmin. |
| ScopePolicy | `id,code,name,description` RO | sólo GET, IA+TA. |
| Permission | `id,code,name,category,description,is_active` RO | sólo permisos activos; GET, IA+TA. |
| RolePermission | RO `id,role_code,permission_code,permission_name,permission_category`; W* `role,permission,allowed` | IA+TA+TAdmin; rol de sistema sólo super_admin. |
| PositionPermission | RO `id,position_code,permission_code,permission_name`; W* `position,permission,allowed` | IA+TA+TAdmin; sólo posiciones del tenant. |

Fuentes: `apps/authorization/serializers.py:13-52`; `apps/authorization/views.py:24-86`; `apipoligono/views.py:1765-1783`.

## Overrides y evaluación

`UserPermissionOverride`: RO `id,account_rut,created_by,created_by_rut,created_at`; W* `account,allowed`; W? `permission`/`permission_code` (nullable), `resource`, `action`, `reason`. El account debe pertenecer al tenant; `created_by` lo fija el servidor. CRUD exige IA+TA+TAdmin. Fuente: `apps/authorization/serializers.py:55-75`; `apipoligono/views.py:1788-1815`.

## Catálogos y consultas operativas

| OP | Request | Response / límite |
|---|---|---|
| OP-AZC-001 | GET | `{roles,scopes,resources,actions}`. Es catálogo para UI; `export`/`read_own` allí no prueban endpoint implementado. |
| OP-AZC-002 | GET | `{categories:[{code,label,roles:[{code,name,description}]}]}`. |
| OP-AZC-003 | `unit_code`*; `include_descendants=true` opcional | `{results:[{user,unidad_personal_code,unidad_personal_name,assignments}]}`; `400/404/403` declarados. |
| OP-AZC-004 | `user_id`* | `{results:[{id,code,name}],unidad_personal_code}`; puede devolver `reason: sin_account|sin_unidad_personal`; `400/404/403`. |

Fuente: `apipoligono/views.py:1547-1728,1818-1898`.
