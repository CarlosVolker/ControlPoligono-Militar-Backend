---
spec_meta: "../spec-meta.yaml"
---

# Contrato: autenticación, contexto y recuperación

## Sesión y recuperación

| OP | Request | Response y errores declarados | Fuente |
|---|---|---|---|
| OP-AUT-001 | `{rut, password}`; ambos requeridos | `200 {id_usuario, must_change_password}`. Crea sesión; no devuelve token. Error de validación `400`. | `apipoligono/views.py:1380-1401`; `serializers.py:437-456` |
| OP-AUT-005 | sin body | `200 {detail}`; cierra sesión. | `views.py:1404-1409` |
| OP-RCV-001 | `{rut}` | `200 {detail}`; puede añadir `correo_censurado`. | `utils/recuperacion_utilidades.py:45-57` |
| OP-RCV-002 | `{rut, correo}` | `200 {detail}`. | `:62-77` |
| OP-RCV-003 | `{rut, codigo}` | `200 {mensaje}` o `400 {mensaje}`. | `:81-100` |
| OP-RCV-004 | `{rut, codigo, nueva_contrasena}` | `200 {mensaje}` o `400 {mensaje, errores[]}`. | `:103-138` |

El código expira a cinco minutos y se elimina tras un cambio exitoso. Los pasos iniciales conservan respuesta genérica según el handler; no documento datos de correo (`utils/recuperacion_utilidades.py:17,94,121,136`).

## Contexto y cabeceras

Los endpoints con `TA` requieren sesión, `request.tenant` y una `Account` activa; el middleware obtiene tenant desde `X-Tenant-Code` y unidad activa desde `X-Org-Unit-Code` cuando corresponda. La autenticación de sesión usa cookie HttpOnly y las mutaciones requieren el flujo CSRF del proyecto; no hay JWT (`apps/authorization/permissions.py:242-258`; `AGENTS.md` §Arquitectura).

| OP | Request | Respuesta exacta | Fuente |
|---|---|---|---|
| OP-AUT-002 | `GET`, IA+TA | `{user:{id_usuario,rut?,must_change_password},tenant:{code?,context?},active_organization_unit?,unit_membership?,scopes:string[],assignments:[{role,scope?,organization_unit?,is_primary}],permissions:string[]}` | `apipoligono/views.py:1412-1474` |
| OP-AUT-003 | `{organization_unit_code}` requerido | `200 {detail,organization_unit_code,tenant_code}`; `400` ausente; `403` si no es pertenencia/asignación activa según modo. | `:1477-1539` |
| OP-AUT-006 | sin body | `{"Detalle: Esta es una vista protegida"}`; infraestructura, no pantalla. | `:1373-1377` |

## Auditoría y contraseña de usuario

| OP | Request | Resultado / restricciones | Fuente |
|---|---|---|---|
| OP-AUT-004 | `?limit=N`, default `100`, tope superior `500` | `{count,results:[{created_at,endpoint,action,allowed,reason,organization_unit_code,user_id_value}]}`; `403` salvo `tenant_admin`, `super_admin` o `auditor`. | `apipoligono/views.py:1731-1762` |
| OP-USR-013 | `{new_password, old_password?}` | `new_password` requerido. Cambio propio exige la actual salvo `must_change_password`; propio usa IA+TA, otro usa `user:update`. `400 {error}` por validación. | `:606-651` |
| OP-USR-014 | sin body | `200 {detail}`; rechaza reset propio con `400`. | `:653-674` |
| OP-USR-015 | sin body | `{rut,is_locked,failures,failure_limit,last_attempt?}`. | `:676-695` |
| OP-USR-016 | sin body | `{detail,rut?,registros_eliminados?}`. | `:697-727` |

> 🕯️ Los defaults de throttle y de configuración no se derivan aquí: requieren runtime/settings, fuera de esta lectura.
