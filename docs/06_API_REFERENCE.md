# Referencia de API

Base URL: `/api/`

Todos los endpoints (excepto auth público y recuperación) requieren:
- Cookie `sessionid` (seteada tras el login)
- Header `X-Tenant-Code: <tenant-code>`
- Header `X-CSRFToken: <csrftoken>` en POST/PUT/PATCH/DELETE

---

## Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login/` | Público | Login con RUT + password → cookie sessionid |
| GET | `/api/auth/context/` | Auth+Tenant | Datos del usuario, permisos, membresía, assignments |
| POST | `/api/auth/select-unit/` | Auth+Tenant | Cambiar unidad activa |
| GET | `/api/auth/audit-log/` | Auth+Tenant+Admin | Log de accesos |
| POST | `/api/logout/` | Auth | Cerrar sesión |

**Body login:**
```json
{ "rut": "12345678-9", "password": "MiPassword123" }
```

**Respuesta login:**
```json
{ "id_usuario": 42, "must_change_password": false }
```

### Recuperación de contraseña (todos públicos)

| POST | `/api/recuperar/` | Verificar RUT |
|---|---|---|
| POST | `/api/recuperar/crear/` | Enviar código al correo |
| POST | `/api/recuperar/comprobar/` | Verificar código (expira 5 min) |
| POST | `/api/recuperar/cambiar/` | Establecer nueva contraseña |

---

## Usuarios `/api/usuarios/`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/usuarios/` | `view_personnel_basic` | Listar (filtrado por scope) |
| POST | `/api/usuarios/` | `create_users` | Crear usuario formal |
| GET | `/api/usuarios/{id}/` | `view_personnel_basic` | Detalle |
| PUT/PATCH | `/api/usuarios/{id}/` | `update_users` | Editar |
| DELETE | `/api/usuarios/{id}/` | `disable_users` | Eliminar |
| PUT/PATCH | `/api/usuarios/{id}/asignacion-principal/` | `update_users` | Crear/cambiar rol principal |
| POST | `/api/usuarios/{id}/desactivar-asignacion-principal/` | `update_users` | Quitar rol funcional |
| POST | `/api/usuarios/{id}/agregar-asignacion/` | `update_users` | Agregar rol adicional |
| POST | `/api/usuarios/{id}/quitar-asignacion/{aid}/` | `update_users` | Desactivar assignment |
| POST | `/api/usuarios/{id}/cambiar-contrasena/` | Propio o `update_users` | Cambiar contraseña |
| POST | `/api/usuarios/{id}/resetear-contrasena/` | `update_users` | Admin resetea contraseña |
| POST | `/api/usuarios/crear-temporal/` | `create_users` | Tirador sin cuenta formal |
| GET | `/api/usuarios/{id}/estado-bloqueo/` | `view_personnel_basic` | Ver si la cuenta está bloqueada |
| POST | `/api/usuarios/{id}/desbloquear/` | `update_users` | Desbloquear cuenta bloqueada por intentos fallidos |

**Body crear usuario:**
```json
{
  "rut": "12345678-9",
  "nombre": "Juan",
  "apellido_paterno": "Pérez",
  "grado": "Teniente",
  "correo": "juan@ejemplo.com",
  "initial_unit_code": "CO-A",
  "initial_role_code": "oficial_tiro",
  "initial_scope_code": "unidad_y_descendientes"
}
```

---

## Armas `/api/armas/`

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/armas/` | `view_warehouse` |
| POST | `/api/armas/` | `create_warehouse_records` |
| GET/PUT/PATCH/DELETE | `/api/armas/{id}/` | `view_warehouse` / `update_warehouse_records` / `delete_warehouse_records` |

---

## Polígonos `/api/poligonos/`

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/poligonos/` | `view_unit` |
| POST | `/api/poligonos/` | `create_shooting_lessons` |
| GET/PUT/PATCH/DELETE | `/api/poligonos/{id}/` | — |
| GET | `/api/poligonos/{id}/lecciones/` | `view_unit` |

---

## Lecciones de tiro `/api/lecciones/`

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/lecciones/` | `view_unit` |
| POST | `/api/lecciones/` | `create_shooting_lessons` |
| GET/PUT/PATCH/DELETE | `/api/lecciones/{id}/` | — |
| GET | `/api/lecciones/{id}/fracciones/` | `view_unit` |
| GET | `/api/lecciones/{id}/usuarios/` | `view_unit` |
| GET | `/api/lecciones/{id}/resultados/` | `view_personnel_basic` (+ scope no agregado) |
| GET | `/api/lecciones/{id}/resultados-resumen/` | `view_unit` |
| GET | `/api/lecciones/{id}/reporte/` | `view_unit` |
| GET | `/api/lecciones/{id}/tiradores-elegibles/` | `view_unit` |

**Body crear lección:**
```json
{
  "id_poligono": 1,
  "fecha_tiro": "2026-06-15",
  "numero_orden": "ORD-2026-045",
  "fecha_orden": "2026-06-10",
  "tipo_tiro": "evaluacion",
  "cant_tiros_cereo": 5,
  "cant_tiros_leccion": 20,
  "distancia": 100,
  "unidades_participantes_codes_write": ["CO-A", "HOSP-MIL-SCL"]
}
```

**Campos opcionales:** `numero_orden`, `fecha_orden`, `unidades_participantes_codes_write`.

**`unidades_participantes_codes_write`:** lista de `code` de `OrganizationUnit`. Acepta **cualquier unidad activa del mismo tenant**, sin restricción de scope jerárquico. Permite lecciones cruzadas entre unidades de distintas ramas (ej. Hospital Militar disparando en el polígono de la BOE). Si se omite, el backend asigna automáticamente la unidad del creador.

**Polígono:** puede pertenecer a cualquier unidad del tenant. No se restringe a la unidad del creador — una unidad puede usar el polígono de otra (ej. Campo Militar Valdivia presta su polígono al Centro Clínico Militar).

**`organization_unit` y `tenant`:** asignados automáticamente por el backend (no enviar).

---

## Fracciones `/api/fracciones/`

| Método | Ruta | Permiso |
|---|---|---|
| GET/POST | `/api/fracciones/` | `view_unit` / `create_shooting_lessons` |
| GET/PUT/PATCH/DELETE | `/api/fracciones/{id}/` | — |
| GET | `/api/fracciones/{id}/tiradores/` | `view_unit` |
| GET | `/api/fracciones/{id}/resultados/` | `view_personnel_basic` |

---

## Resultados `/api/resultados/`

| Método | Ruta | Permiso |
|---|---|---|
| GET/POST | `/api/resultados/` | `view_personnel_basic` / `score_shooters` |
| GET/PUT/PATCH/DELETE | `/api/resultados/{id}/` | — |

**Body registrar resultado:**
```json
{
  "id_fraccion": 3,
  "id_usuario": 42,
  "id_arma": 7,
  "tiros_acertados": 18,
  "total_tiros": 20,
  "numero_carril": 5
}
```

---

## Unidades `/api/organization-units/`

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/organization-units/` | `view_unit` (scope) |
| POST | `/api/organization-units/` | `create_unit` |
| GET/PUT/PATCH | `/api/organization-units/{id}/` | — |
| GET | `/api/organization-units/lookup/` | `view_unit` (sin filtro scope) |
| GET | `/api/organization-units/{id}/previsualizar-eliminacion/` | `delete_unit` |
| POST | `/api/organization-units/{id}/eliminar-con-migracion/` | `delete_unit` |

---

## Armerías `/api/armorias/`

| Método | Ruta | Permiso |
|---|---|---|
| GET/POST | `/api/armorias/` | `view_warehouse` / `create_warehouse_records` |
| GET/PUT/PATCH/DELETE | `/api/armorias/{id}/` | — |

---

## Posiciones `/api/posiciones/`

| Método | Ruta | Permiso |
|---|---|---|
| GET/POST | `/api/posiciones/` | `view_unit` / `assign_positions` |
| GET/PUT/PATCH/DELETE | `/api/posiciones/{id}/` | — |
| POST | `/api/posiciones/{id}/asignar-holder/` | `assign_positions` |
| POST | `/api/posiciones/{id}/quitar-holder/{aid}/` | `revoke_positions` |
| GET | `/api/posiciones/{id}/historico/` | `view_unit` |

---

## Recintos militares `/api/recintos/`

Permiso: `view_recinto` (lectura) / `manage_recinto` (escritura)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/recintos/` | Listar recintos del tenant |
| POST | `/api/recintos/` | Crear recinto |
| GET | `/api/recintos/{id}/` | Detalle |
| PUT/PATCH | `/api/recintos/{id}/` | Editar |
| DELETE | `/api/recintos/{id}/` | Eliminar |
| POST | `/api/recintos/{id}/agregar-unidad/{unit_code}/` | Agregar unidad al recinto |
| DELETE | `/api/recintos/{id}/quitar-unidad/{unit_code}/` | Quitar unidad del recinto |

**Body crear recinto:**
```json
{ "code": "CMV", "name": "Campo Militar Valdivia", "description": "Recinto en Valdivia" }
```

**Respuesta:**
```json
{
  "id": 1, "code": "CMV", "name": "Campo Militar Valdivia",
  "is_active": true,
  "units": [3, 5, 7],
  "unit_codes": ["JAL", "REG-X", "CLINICA"],
  "unit_count": 3
}
```

---

## Pertenencias orgánicas `/api/memberships/`

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/memberships/` | `view_unit` | Listar membresías |
| POST | `/api/memberships/` | `assign_positions` | Crear membresía |
| DELETE | `/api/memberships/{id}/` | `revoke_positions` | Eliminar membresía |

---

## Autorización `/api/authz/`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/authz/catalog/` | Auth+Tenant | Catálogo de roles, scopes, recursos |
| GET/POST/... | `/api/authz/roles/` | Auth+Tenant (CUD: Admin) | CRUD de Roles |
| GET | `/api/authz/scopes/` | Auth+Tenant | Listar ScopePolicies |
| GET | `/api/authz/permissions/` | Auth+Tenant | Catálogo de 34 permisos atómicos |
| GET/POST/... | `/api/authz/role-permissions/` | Admin | Permisos asignados a roles |
| GET/POST/... | `/api/authz/position-permissions/` | Admin | Permisos extra por puesto |
| GET/POST/... | `/api/authz/overrides/` | Admin | UserPermissionOverrides |
| GET | `/api/authz/role-categories/` | Auth+Tenant | Roles agrupados por categoría |
| GET | `/api/authz/personas-por-unidad/` | Auth+Tenant | Personas con roles en una unidad |
| GET | `/api/authz/eligible-target-units/` | Auth+Tenant | Unidades elegibles para asignar rol |

---

## Preferencias de usuario

| Método | Ruta | Descripción |
|---|---|---|
| GET/PUT | `/api/me/preferences/appearance/` | Tema, paleta y densidad |
| GET | `/api/me/assignable-units/` | Unidades donde puede crear usuarios |

---

## Calibres

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/calibres/` | `view_exercises` | Listar catálogo de calibres |
| GET | `/api/calibres/{id}/` | `view_exercises` | Detalle de calibre |
| POST | `/api/calibres/` | `manage_calibre` | Crear calibre (tenant_admin) |
| PUT/PATCH | `/api/calibres/{id}/` | `manage_calibre` | Editar calibre |
| DELETE | `/api/calibres/{id}/` | `manage_calibre` | Eliminar calibre |

**Respuesta:**
```json
{ "id_calibre": 1, "code": "5.56X45", "nombre": "5.56×45mm NATO", "is_active": true }
```

---

## Ejercicios Militares

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/ejercicios/` | `view_exercises` | Listar ejercicios del tenant/scope |
| GET | `/api/ejercicios/{id}/` | `view_exercises` | Detalle |
| POST | `/api/ejercicios/` | `create_exercises` | Crear ejercicio |
| PUT/PATCH | `/api/ejercicios/{id}/` | `update_exercises` | Editar |
| DELETE | `/api/ejercicios/{id}/` | `delete_exercises` | Eliminar |

**Body POST:**
```json
{
  "nombre": "Ejercicio Bayoneta 2025",
  "fecha": "2025-09-15",
  "zona": "Sector Norte, Campo Marte",
  "tipo_ejercicio": "asalto",
  "numero_orden": "ORD-2025-042",
  "fecha_orden": "2025-09-01",
  "observaciones": "",
  "unidades_participantes_codes_write": ["BOE-I", "CCIA-A"]
}
```

---

## Consumos de Municion

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/consumos-municion/` | `view_exercises` | Listar consumos |
| GET | `/api/consumos-municion/{id}/` | `view_exercises` | Detalle |
| POST | `/api/consumos-municion/` | `create_exercises` | Crear línea de consumo |
| PUT/PATCH | `/api/consumos-municion/{id}/` | `update_exercises` | Editar |
| DELETE | `/api/consumos-municion/{id}/` | `delete_exercises` | Eliminar |

**Body POST:**
```json
{
  "ejercicio": 1,
  "tipo_arma": "fusil",
  "modelo_arma": "GALIL ACE 22",
  "calibre_code_write": "5.56X45",
  "cantidad_armas": 24,
  "cantidad_tiros": 1200,
  "es_aproximado": false,
  "observaciones": ""
}
```

---

## Consumos por Arma

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/api/consumos-arma/` | `view_exercises` | Listar detalles por arma |
| GET | `/api/consumos-arma/{id}/` | `view_exercises` | Detalle |
| POST | `/api/consumos-arma/` | `create_exercises` | Registrar consumo de arma individual |
| PUT/PATCH | `/api/consumos-arma/{id}/` | `update_exercises` | Editar |
| DELETE | `/api/consumos-arma/{id}/` | `delete_exercises` | Eliminar |

**Body POST:**
```json
{
  "consumo": 5,
  "arma": 12,
  "cantidad_tiros": 50,
  "observaciones": ""
}
```
