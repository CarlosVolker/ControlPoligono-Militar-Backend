# Sistema de Permisos

## Modelo conceptual

El sistema combina **RBAC** (Role-Based Access Control) con **permisos atómicos** y **filtrado por scope organizacional**.

```
UnitMembership                    ← dónde PERTENECE el usuario
       │
Assignment → Position             ← qué PUESTO ocupa
               │         │
               Role       ScopePolicy
               │
         RolePermission           ← qué permission_codes tiene
         PositionPermission       ← permisos extra del puesto específico
```

---

## Entidades del modelo de permisos

### Permission

Permiso atómico del sistema. El catálogo tiene **34 permisos** agrupados en 9 categorías.

Categorías: `personal`, `personnel`, `positions`, `units`, `commanders`, `users`, `shooting`, `warehouse`, `admin`.

Ejemplos: `view_unit`, `score_shooters`, `create_shooting_lessons`, `manage_permissions`.

Ver catálogo completo en `apps/authorization/models.py` → `PERMISSION_CATALOG`.

### Role

Define qué tipo funcional es un puesto. **8 roles predefinidos** (globales, sin tenant):

| Código | Nombre | Nivel |
|---|---|---|
| `super_admin` | Super Administrador | Sistema (bypass total) |
| `tenant_admin` | Administrador Institucional | Institución |
| `admin_unidad` | Administrador de Unidad (SICE) | Unidad |
| `comandante_unidad` | Comandante de Unidad | Unidad |
| `oficial_tiro` | Oficial de Tiro (S-3) | Funcional |
| `oficial_observador` | Oficial Observador (E-3) | Funcional |
| `encargado_almacen` | Encargado de Almacén | Funcional |
| `tirador` | Tirador | Personal |

### RolePermission

Liga un **Role** con un **Permission**. Reemplazó a `PermissionRule`.

```
RolePermission
  ├── role FK
  ├── permission FK
  └── allowed (True/False)
```

Permite preguntar: "¿tiene el rol `oficial_tiro` el permiso `score_shooters`?"

### Recinto

Un **Recinto** (Campo Militar, Cuartel, etc.) es un contenedor geográfico de unidades. La `Position` de tipo SICE de recinto tiene:

```
Position(SICE-CMV)
  ├── organization_unit = JAL        ← dónde pertenece orgánicamente
  ├── role = admin_unidad
  ├── scope_policy = todo_recinto    ← activa el cálculo por recinto
  └── recinto = CMV                  ← define qué unidades ve
```

El campo `recinto` en Position **solo tiene efecto cuando `scope_policy = todo_recinto`**. Con cualquier otro scope, el campo recinto es ignorado.

### PositionPermission

Permisos **adicionales** otorgados por un puesto específico, independiente del rol.

```
PositionPermission
  ├── position FK
  ├── permission FK
  └── allowed
```

Ejemplo: el puesto `CMTE-BRIGADA` tiene `validate_scores` aunque el rol `comandante_unidad` no lo tenga por defecto.

### ScopePolicy

Define *qué datos* puede ver el usuario:

| Código | Efecto |
|---|---|
| `solo_propio` | Solo sus propios registros |
| `unidad_propia` | Solo su unidad directa (sin descendientes) |
| `unidad_y_descendientes` | Su unidad + toda la subárbol |
| `solo_agregado` | Solo métricas agregadas, sin detalle individual |
| `todo_recinto` | **Todas las unidades del Recinto** asignado al puesto (sin importar jerarquía) |

> **`todo_recinto`** solo tiene efecto cuando `Position.recinto` está asignado. Si el scope es `todo_recinto` pero la Position no tiene recinto, el alcance se reduce a la unidad orgánica del usuario. Ver [05_DOMINIO.md](05_DOMINIO.md) → sección Recinto para el caso de uso del SICE.

### Position

Puesto estable en la organización. Persiste aunque roten las personas.

```
Position
  ├── tenant FK
  ├── code (único por tenant)
  ├── name
  ├── organization_unit FK
  ├── armory FK (opcional)
  ├── role FK
  ├── scope_policy FK (nullable)
  └── is_unique_holder
```

### Assignment

Persona ocupando una Position. **`position` es NOT NULL** — todo Assignment debe tener Position.

```
Assignment
  ├── account FK
  ├── position FK   ← NOT NULL (obligatorio)
  ├── is_primary    ← solo uno puede ser True por account activo
  ├── is_active
  ├── starts_at
  └── ends_at
```

### UnitMembership

Pertenencia orgánica de un usuario a una unidad. **Distinta del Assignment**.

Un integrante del SICE puede pertenecer a la JAL (`UnitMembership`) pero administrar todo el Campo Militar Valdivia (via su `Position`).

```
UnitMembership
  ├── tenant FK
  ├── account FK
  ├── unit FK
  ├── is_primary    ← unidad base para el scope
  └── is_active
```

Esta membresía:
- Determina en qué listas de personal aparece el usuario
- Define la unidad base para `get_allowed_unit_ids`
- **NO otorga permisos por sí misma**

### UserPermissionOverride

Excepción individual. Da o quita un permiso específico a una persona, sobreescribiendo su rol.

```
UserPermissionOverride
  ├── account FK
  ├── permission FK (nullable — si es null usa resource:action legacy)
  ├── resource / action (legacy, durante transición)
  ├── allowed (True=ALLOW, False=DENY)
  └── reason
```

---

## Pipeline de autorización

Ejecutado en `HasResourcePermission` por cada request:

```
Request
  │
  ├── (resource_name, HTTP method) → permission_code   [RESOURCE_ACTION_TO_PERMISSION]
  │
  ├── 1. MASTER bypass: position.role.code == 'super_admin' → ALLOW todo
  │
  ├── 2. Override DENY: UserPermissionOverride(permission_code, allowed=False) → DENY
  │
  ├── 3. Override ALLOW: UserPermissionOverride(permission_code, allowed=True) → ALLOW
  │
  ├── 4. PositionPermission: position tiene ese permission explícito → ALLOW
  │
  ├── 5. RolePermission: role del assignment tiene ese permission → ALLOW
  │
  └── Sin match → DENY 403
```

**Precedencia**: MASTER > Override DENY > Override ALLOW > PositionPermission > RolePermission

---

## Mapa resource:action → permission_code

El mapa completo está en `apps/authorization/permissions.py` → `RESOURCE_ACTION_TO_PERMISSION`.

Ejemplos clave:

| resource:action | permission_code |
|---|---|
| `user:create` | `create_users` |
| `user:read` | `view_personnel_basic` |
| `user:read_own` | `view_self` |
| `organization_unit:read` | `view_unit` |
| `shooting_session:create` | `create_shooting_lessons` |
| `shooting_result:create` | `score_shooters` |
| `shooting_result:export` | `view_personnel_full` |
| `weapon:read` | `view_warehouse` |
| `armory:create` | `create_warehouse_records` |
| `position:create` | `assign_positions` |

---

## Filtrado por scope

`get_allowed_unit_ids(account)` retorna:

- `None` → admin global, sin restricción
- `set()` vacío → sin acceso
- `set(ids)` → unidades permitidas

La unidad base viene de `UnitMembership` primaria. El tipo de expansión (árbol vs solo unidad) viene del `ScopePolicy` del `Assignment` primario.

`get_primary_unit(account)` → retorna la `OrganizationUnit` de la `UnitMembership` primaria.

---

## Permisos por rol — resumen operacional

| Rol | Puede hacer |
|---|---|
| `super_admin` / `tenant_admin` | Todo (todos los permission_codes) |
| `admin_unidad` | Gestionar usuarios, unidades, posiciones, armerías |
| `comandante_unidad` | Leer: unidades, armerías, armas, posiciones, resultados (incluye resumen) |
| `oficial_tiro` | Gestionar sesiones de tiro, fracciones, resultados, armas, polígonos. Exportar. |
| `oficial_observador` | Solo leer resúmenes y sesiones |
| `encargado_almacen` | CRUD armerías y armas |
| `tirador` | Ver propio perfil, propios resultados, listar sesiones |

---

## Clases de permiso DRF

| Clase | Descripción |
|---|---|
| `HasTenantAccess` | Verifica Account activo en el tenant del request |
| `HasResourcePermission` | Pipeline RBAC completo (ver arriba) |
| `IsTenantAdmin` | Solo `tenant_admin` o `super_admin` |

Todas las vistas del dominio usan:
```python
permission_classes = [IsAuthenticated, HasTenantAccess, HasResourcePermission]
```

---

## Reglas de integridad

1. **Todo Assignment debe tener `position`**: `position` es NOT NULL. Usar `_find_or_create_position()` o `assign_position()`.
2. **Un solo `is_primary=True` por account**: el primario determina el scope y la unidad activa.
3. **UnitMembership siempre que se asigne unidad**: llamar `_ensure_unit_membership()` al crear/cambiar la unidad de un usuario.
4. **El tirador implícito siempre existe**: `_ensure_tirador_assignment()` es idempotente. Si se elimina manualmente, el usuario desaparece de tiradores elegibles.
5. **`super_admin` y `tenant_admin` no necesitan `scope_policy`**: su acceso es global.

---

## Permisos de Recinto

| Permission code | Descripción | Quién lo tiene |
|---|---|---|
| `view_recinto` | Ver recintos del tenant | `admin_unidad`, `comandante_unidad` y superiores |
| `manage_recinto` | Crear, editar, eliminar recintos y gestionar sus unidades | `admin_unidad` y superiores |

---

## API del catálogo de autorización

```
GET  /api/authz/catalog/               ← Roles, scopes, recursos y acciones
GET  /api/authz/roles/                 ← Listar roles
GET  /api/authz/scopes/                ← Listar scopes
GET  /api/authz/permissions/           ← Catálogo de 34 permisos atómicos
GET  /api/authz/role-permissions/      ← Permisos asignados a roles
POST /api/authz/role-permissions/      ← Asignar permiso a rol (tenant_admin)
GET  /api/authz/position-permissions/  ← Permisos extra por puesto
POST /api/authz/position-permissions/  ← Asignar permiso extra a puesto (tenant_admin)
GET  /api/authz/overrides/             ← UserPermissionOverrides
POST /api/authz/overrides/             ← Crear override (tenant_admin)
GET  /api/authz/role-categories/       ← Roles agrupados por categoría
GET  /api/authz/personas-por-unidad/   ← Personas con roles en una unidad
GET  /api/authz/eligible-target-units/ ← Unidades elegibles para asignar rol
```

---

## Overrides: cuándo usarlos

Para **excepciones individuales**, no para configurar roles. Casos válidos:

- Dar acceso temporal de lectura a un observador externo
- Bloquear acceso de un usuario mientras está bajo investigación
- Dar permiso de exportación a un usuario específico

Siempre se requiere `reason`. Son visibles en el audit log.

---

## Tirador implícito

Todo usuario en el sistema tiene automáticamente un `Assignment` con rol `tirador` en su unidad. Este assignment persiste aunque se le quite el rol funcional.

Garantiza que todos los usuarios pueden ser seleccionados como tiradores en una sesión de tiro.

`_ensure_tirador_assignment(account, unit)` en `apipoligono/views.py` es idempotente.
