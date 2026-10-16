---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Identidad y autorización

## Límites de autoridad

Esta familia cubre usuarios, puestos, memberships, RBAC, overrides, auditoría y consultas operativas. Sus contratos son [organization-identity.md](../contracts/organization-identity.md) §§3–4, [authorization.md](../contracts/authorization.md) y [auth-context.md](../contracts/auth-context.md) §3. La UI puede ocultar acciones según el contexto, pero sólo el backend decide tenant, unidad y permiso efectivo; un `403` no se convierte en un dato vacío.

Todos los listados disponen de carga, vacío, error y reintento explícito; búsqueda, orden y selección se aplican sobre la colección realmente retornada, sin paginación inventada. En mutaciones, el botón queda en guardado hasta respuesta, cancelar no emite petición y éxito refresca detalle, listado y relaciones afectadas.

---

## Usuarios y credenciales

- **R-DOM-ID-001** — WHEN se lista o abre un usuario, THEN el cliente SHALL presentar los campos de respuesta `id_usuario`, identidad, `habilitado`, `is_locked`, indicadores de contraseña, `primary_assignment` y `assignments`, diferenciando identidad de asignaciones activas. *Fuente: `contracts/organization-identity.md:27`.*
- **R-DOM-ID-002** — WHEN se crea o edita un usuario formal, THEN SHALL requerir `rut`, `apellido_paterno` y `apellido_materno`; SHALL permitir `grado`, `nombre` y `correo`; SHALL enviar los campos iniciales `initial_unit_code`, `initial_role_code` e `initial_scope_code` sólo en el alta cuando el flujo los solicite. Campos derivados y flags de contraseña son sólo lectura. *Fuente: `contracts/organization-identity.md:27`.*
- **R-DOM-ID-003** — WHEN el RUT formal coincide con un temporal, THEN la pantalla de alta SHALL advertir que la creación promueve el registro temporal y conserva su historial; SHALL NOT ofrecer alta temporal como mecanismo de promoción. *Fuente: `requirements.md:R-RUL-06`; `contracts/organization-identity.md:27,32`.*
- **R-DOM-ID-004** — WHEN se crea un usuario temporal, THEN SHALL requerir `rut`, aceptar sólo los campos opcionales documentados y `organization_unit_code` cuando corresponda; SHALL indicar que el temporal no inicia sesión. Ante RUT existente, SHALL mostrar el error del backend sin crear un duplicado en la tabla. *Fuente: OP-USR-012, `contracts/organization-identity.md:32`.*
- **R-DOM-ID-005** — WHEN se establece asignación principal, THEN SHALL seleccionar `unit_code`, `role_code` y opcionalmente `scope_code`; al éxito SHALL mostrar la respuesta efectiva y refrescar usuario, memberships y puestos implicados. La nueva principal desactiva la anterior según el contrato. *Fuente: OP-USR-007/008, `contracts/organization-identity.md:28`.*
- **R-DOM-ID-006** — WHEN se desactiva la asignación principal, THEN SHALL requerir confirmación e informar `desactivadas`; SHALL advertir que el backend preserva o recrea el tirador implícito cuando no queda otra asignación. *Fuente: OP-USR-009, `contracts/organization-identity.md:29`; `requirements.md:R-RUL-12`.*
- **R-DOM-ID-007** — WHEN se agrega una asignación secundaria, THEN SHALL enviar `unit_code`, `role_code` y `scope_code` opcional; SHALL tratar la respuesta `200` idempotente y `201` como éxito, mostrando `assignment_id`. *Fuente: OP-USR-010, `contracts/organization-identity.md:30`.*
- **R-DOM-ID-008** — WHEN se quita una asignación secundaria, THEN SHALL identificar la asignación y pedir confirmación; al éxito SHALL actualizar las asignaciones y advertir la restauración de tirador si era la última. *Fuente: OP-USR-011, `contracts/organization-identity.md:31`.*
- **R-DOM-ID-009** — WHEN un usuario cambia su contraseña, THEN SHALL requerir `new_password`; SHALL requerir `old_password` salvo en cambio forzado por `must_change_password`; SHALL permanecer en el flujo ante `400` y mostrar `error`. *Fuente: OP-USR-013, `contracts/auth-context.md:35`.*
- **R-DOM-ID-010** — WHEN se resetea la contraseña de otra persona, THEN SHALL exigir confirmación, mostrar el resultado y refrescar sus flags; SHALL bloquear el intento sobre la propia cuenta y conservar el `400` si se recibe. *Fuente: OP-USR-014, `contracts/auth-context.md:36`.*
- **R-DOM-ID-011** — WHEN se consulta o desbloquea una cuenta, THEN SHALL mostrar `rut`, `is_locked`, fallos, límite y último intento sin inventar una fecha ausente; desbloquear requiere confirmación y al éxito refresca estado. *Fuente: OP-USR-015/016, `contracts/auth-context.md:37–38`.*
- **R-DOM-ID-012** — WHEN se elimina un usuario por la operación expuesta, THEN SHALL pedir confirmación destructiva, esperar la respuesta del backend y reflejar el resultado real; SHALL NOT asumir borrado físico ni ocultar el registro antes del éxito.

## Puestos y pertenencia orgánica

- **R-DOM-ID-013** — WHEN se lista un puesto, THEN SHALL presentar sus códigos/nombres derivados, `current_holders_count`, estado y timestamps; SHALL distinguir puesto de assignment y de membership. *Fuente: `contracts/organization-identity.md:40,44`.*
- **R-DOM-ID-014** — WHEN se crea o edita un puesto, THEN SHALL requerir `code`, `name`, `organization_unit_code_write` y `role_code_write`; SHALL permitir los códigos opcionales de armería, scope y recinto, descripción, estado y unicidad de holder. `null` limpia relaciones opcionales sólo cuando el usuario lo elige expresamente. *Fuente: `contracts/organization-identity.md:40`.*
- **R-DOM-ID-015** — WHEN se elige recinto para un puesto, THEN SHALL explicar que sólo tiene efecto con scope `todo_recinto`; SHALL conservar el valor retornado sin afirmar que amplía alcance con otro scope. *Fuente: `contracts/organization-identity.md:40`.*
- **R-DOM-ID-016** — WHEN se asigna holder, THEN SHALL seleccionar `account_id`, `is_primary` y `starts_at` opcionales, presentar la consecuencia de puesto único y aceptar tanto `201` como la respuesta idempotente `200`. *Fuente: OP-POS-007, `contracts/organization-identity.md:41`.*
- **R-DOM-ID-017** — WHEN se quita holder, THEN SHALL requerir confirmación y, al éxito, refrescar contador, holders y su histórico. El histórico SHALL incluir activos e históricos devueltos, no una cronología inferida. *Fuente: OP-POS-008/009, `contracts/organization-identity.md:42–43`.*
- **R-DOM-ID-018** — WHEN se administra UnitMembership, THEN SHALL requerir `account` y `unit`, permitir estado, primaria y fechas documentadas, e identificar la membresía como pertenencia orgánica separada de puesto/holder. *Fuente: `contracts/organization-identity.md:44`.*
- **R-DOM-ID-019** — WHEN se modifica la primaria de una membership o se desactiva/elimina una, THEN SHALL refrescar el contexto afectado antes de mostrar una unidad efectiva; SHALL NO asumir que modifica la asignación funcional.

## RBAC, overrides y consultas

- **R-DOM-AZ-001** — WHEN se administran roles, THEN SHALL mostrar `code`, `name`, descripción, actividad y `is_system`; crear/editar requiere `code` y `name`. Las mutaciones sólo se ofrecen al contexto administrativo y un `403` sigue siendo denegación. *Fuente: `contracts/authorization.md:15`.*
- **R-DOM-AZ-002** — WHEN se consultan scopes o permissions, THEN SHALL tratarlos como catálogos de sólo lectura; SHALL NOT renderizar alta, edición o eliminación. *Fuente: `contracts/authorization.md:16–17`.*
- **R-DOM-AZ-003** — WHEN se gestiona RolePermission, THEN SHALL seleccionar `role`, `permission` y `allowed`, mostrar códigos/nombre/categoría de sólo lectura y bloquear cambios de un rol de sistema salvo contexto `super_admin`. *Fuente: `contracts/authorization.md:18`.*
- **R-DOM-AZ-004** — WHEN se gestiona PositionPermission, THEN SHALL seleccionar una posición del tenant y un permiso, enviar `allowed` y refrescar la matriz tras éxito; SHALL mostrar los errores de tenant sin insertar una fila local. *Fuente: `contracts/authorization.md:19`.*
- **R-DOM-AZ-005** — WHEN se crea o edita un override, THEN SHALL requerir `account` y `allowed`, permitir `permission` o `permission_code` nulo, `resource`, `action` y `reason`; SHALL tratar `created_by` y sus metadatos como sólo lectura. *Fuente: `contracts/authorization.md:25`.*
- **R-DOM-AZ-006** — WHEN el usuario consulta el catálogo operativo, THEN SHALL presentar `roles`, `scopes`, `resources` y `actions` como ayuda de selección; SHALL NOT inferir que cada acción catalogada tiene endpoint expuesto. *Fuente: OP-AZC-001, `contracts/authorization.md:31`.*
- **R-DOM-AZ-007** — WHEN se consulta la agrupación de roles, THEN SHALL mostrar `categories` y sus roles con nombre/descripción tal como responde el backend; vacío no significa que no existan roles fuera del alcance. *Fuente: OP-AZC-002, `contracts/authorization.md:32`.*
- **R-DOM-AZ-008** — WHEN se consultan personas por unidad, THEN SHALL requerir `unit_code`, permitir `include_descendants`, y mostrar `user`, unidad personal y assignments retornados; SHALL distinguir `400`, `404` y `403`. *Fuente: OP-AZC-003, `contracts/authorization.md:33`.*
- **R-DOM-AZ-009** — WHEN se consultan unidades elegibles para una persona, THEN SHALL requerir `user_id`, mostrar resultados y `unidad_personal_code`; SHALL presentar `reason: sin_account|sin_unidad_personal` como restricción operativa, no como lista vacía. *Fuente: OP-AZC-004, `contracts/authorization.md:34`.*
- **R-DOM-AZ-010** — WHEN se abre auditoría, THEN SHALL permitir `limit` hasta 500, mostrar `count` y los campos de cada registro, y no fabricar eventos si el backend devuelve vacío. La vista sólo está disponible a los roles declarados; `403` es una denegación visible. *Fuente: OP-AUT-004, `contracts/auth-context.md:34`.*

## Criterio observable de la familia

Cada operación de identidad y autorización queda definida por controles editables/RO, confirmación cuando afecta acceso o credenciales, respuesta visible y refresco de sus relaciones. La matriz de UI no sustituye la evaluación efectiva: el orden de autoridad sigue siendo bypass, override, permisos de puesto, permisos de rol y denegación. *Fuente: `contracts/authorization.md:9`.*
