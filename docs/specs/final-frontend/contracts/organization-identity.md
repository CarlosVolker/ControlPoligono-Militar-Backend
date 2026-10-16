---
spec_meta: "../spec-meta.yaml"
---

# Contrato: organización, usuarios y puestos

## Unidades, recintos y migración

| Recurso / OP | Campos y shape | Reglas declaradas | Fuente |
|---|---|---|---|
| OrganizationUnit | RO `id`, `tenant`, `parent_code`; W* `code`, `name`; W? `parent`, `unit_type`, `is_active` | `unit_type`: `command|division|regiment|battalion|company|section|squad|staff|range|other`. Parent debe estar en rama; raíz requiere admin. | `apps/organizations/serializers.py:6-22`; `views.py:44-66` |
| OP-UNT-007 | `{unit_code,unit_name,parent_code,counts}` | `counts`: assignments, weapons, ranges, lessons, fractions, results, child_units, lessons_as_participant. | `views.py:68-99` |
| OP-UNT-008 | body `{target_unit_code?}`; `{detail,target_unit_code,moved}` | si no hay target usa parent; raíz exige target; target no puede ser sí misma. **La cuenta de assignments se informa pero no se reasigna en el cuerpo**: hipótesis/documentación estática, no resultado runtime. | `views.py:101-175` |
| OP-UNT-009 | `{results: OrganizationUnitSerializer[]}` | todas las unidades activas del tenant, sin filtro de rama. | `views.py:177-191` |
| Recinto | RO `id`, tenant, `unit_codes`, `unit_count`; W* `code`, `name`; W? `description`, `is_active`, `units` (PK[]) | colección por tenant; orden name. | `serializers.py:24-45`; `views.py:209-215` |
| OP-RCT-007/008 | `{detail,unit_count}` | agrega/quita por `unit_code`; `404` si unidad/relación no existe. | `views.py:217-254` |
| OP-UNT-010 | `{results: OrganizationUnitSerializer[]}` | rama de asignación; caso `admin_unidad` sin permitido muestra todo el tenant, pero create valida después. | `views.py:257-292` |

## Armerías

RO: `id`, tenant, `organization_unit`, `organization_unit_code`, `armas_count`, timestamps. W*: `code`, `name`; W?: `descripcion`, `is_active`, `organization_unit_code_write`. El campo write resuelve una unidad activa del tenant; en update `null`/vacío es `400`. La unidad se inyecta al crear si no se escribió código. Fuente: `apps/armory/serializers.py:6-59`; `apipoligono/mixins.py:34-48`.

## Usuarios y asignaciones

| Operación | Request / response | Regla |
|---|---|---|
| CRUD usuario | RO `id_usuario`, `habilitado`, `is_locked`, flags de contraseña, `primary_assignment`, `assignments`; W `rut`*, `grado?`, `nombre?`, `apellido_paterno`*, `apellido_materno`*, `correo?` | create también consume `initial_unit_code`, `initial_role_code`, `initial_scope_code`, fuera del serializer. Usuario temporal con mismo RUT se promueve. |
| OP-USR-007/008 | `{unit_code,role_code,scope_code?}` → `{detail,unit_code,role_code,scope_code}` | desactiva primary previa, crea Position/Assignment, garantiza tirador y UnitMembership. |
| OP-USR-009 | sin body → `{detail,desactivadas}` | preserva/recrea tirador. |
| OP-USR-010 | `{unit_code,role_code,scope_code?}` → `201|200 {detail,assignment_id}` | idempotente. |
| OP-USR-011 | sin body → `{detail}` | cesa assignment; restaura tirador si era último. |
| OP-USR-012 | `rut`*; `grado?`, `nombre?`, apellidos?, `organization_unit_code?` → `201 UsuarioSerializer` | temporal no inicia sesión. |

Fuentes: `apipoligono/serializers.py:17-88`; `views.py:230-604`; `apps/identity/models.py` para relaciones.

## Puestos, holders y memberships

| Recurso / OP | Campos / shape | Regla |
|---|---|---|
| Position | RO FKs y códigos/nombres derivados, `current_holders_count`, timestamps; W* `code`, `name`, `organization_unit_code_write`, `role_code_write`; W? códigos armory/scope/recinto, `description`, `is_active`, `is_unique_holder` | códigos se resuelven en tenant; `null` limpia opcionales. `recinto` sólo actúa con scope `todo_recinto`. |
| OP-POS-007 | `{account_id,is_primary?,starts_at?}` → `201 PositionHolderSerializer` o `200 {detail,assignment_id}` | holder único cesa el previo; valida rama del puesto. |
| OP-POS-008 | sin body → `{detail}` | cesa holder y fija final. |
| OP-POS-009 | `{position_code,position_name,holders[]}` | incluye activos e históricos. |
| UnitMembership | RO `id,rut,unit_code,unit_name,created_at`; W* `account,unit`; W? `is_primary,is_active,starts_at,ends_at` | la vista inyecta tenant; **no es Assignment** ni holder. |

Fuentes: `apps/identity/serializers.py:6-180`; `views.py:18-150`.
