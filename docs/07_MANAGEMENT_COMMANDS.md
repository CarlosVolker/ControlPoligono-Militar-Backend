# Comandos de Management

Todos los comandos se ejecutan con:
```powershell
# Windows / PowerShell
.venv\Scripts\python.exe manage.py <comando> [args]

# Linux / bash
python manage.py <comando> [args]
```

---

## Inicialización del sistema

### Orden obligatorio en un entorno nuevo

```powershell
# 1. Migrar esquema
python manage.py migrate

# 2. Inicializar roles, scopes y RolePermissions
python manage.py init_access_model --tenant-code ejercito-demo --tenant-name "Ejército Demo"

# 3. Crear catálogo de permisos atómicos
python manage.py init_permissions

# 4. Crear árbol organizacional (o desde la API)
python manage.py seed_org_tree --tenant-code ejercito-demo

# 5. Crear cuenta MASTER
python manage.py crear_master --rut 99999999-9 --password Dev1234 --tenant-code ejercito-demo

# 6. Generar puestos por unidad
python manage.py seed_positions --tenant-code ejercito-demo

# 7. Levantar servidor
python manage.py runserver
```

Pasos 2–6 son **idempotentes** — se pueden re-ejecutar sin riesgo.

---

### `init_access_model`

Crea el modelo de acceso completo para un tenant: 8 roles, 4 scopes, RolePermissions.

```powershell
python manage.py init_access_model --tenant-code ejercito-demo --tenant-name "Ejército Demo"
# --reset    limpia roles/scopes obsoletos antes de sembrar
```

**Qué crea:**
- Tenant con el código indicado
- 8 roles: `super_admin`, `tenant_admin`, `admin_unidad`, `comandante_unidad`, `oficial_tiro`, `oficial_observador`, `encargado_almacen`, `tirador`
- 4 scopes: `solo_propio`, `unidad_propia`, `unidad_y_descendientes`, `solo_agregado`
- RolePermissions para cada rol (mapeo automático desde DEFAULT_PERMISSIONS)
- Person + Account para usuarios legacy si existen

---

### `init_permissions`

Crea o actualiza el **catálogo de 34 permisos atómicos** del sistema.

```powershell
python manage.py init_permissions
python manage.py init_permissions --dry-run   # muestra qué se crearía sin crear nada
```

**Idempotente.** Usar después de agregar nuevos permisos al `PERMISSION_CATALOG` en `apps/authorization/models.py`.

---

### `crear_master`

Crea la cuenta MASTER (`super_admin`) para el tenant indicado.

```powershell
python manage.py crear_master --rut 99999999-9 --password Dev1234 --tenant-code ejercito-demo
```

**Idempotente.** Si el usuario ya existe, actualiza su contraseña.

**Qué crea:**
- `Usuario` + `Person` + `Account`
- `Position` MASTER (si no existe)
- `Assignment` activo con rol `super_admin`
- `UnitMembership` en la unidad raíz del tenant

**Requisito**: el tenant debe tener al menos una unidad organizacional raíz.

---

### `seed_positions`

Genera Positions estándar para cada unidad del tenant.

```powershell
python manage.py seed_positions --tenant-code ejercito-demo
```

**Puestos creados por unidad:**
- `CMTE-<code>` → Comandante (`comandante_unidad`, `unidad_y_descendientes`)
- `S-3-<code>` → Oficial de Tiro (`oficial_tiro`, `unidad_y_descendientes`)
- `E-3-<code>` → Oficial Observador (`oficial_observador`, `unidad_y_descendientes`)
- `SICE-<code>` → Administrador SICE (`admin_unidad`, `unidad_y_descendientes`)

**Puestos por armería:**
- `ENC-<armory_code>` → Encargado de Almacén (`encargado_almacen`, `unidad_propia`)

---

### `seed_org_tree`

Puebla un árbol de unidades organizacionales de ejemplo.

```powershell
python manage.py seed_org_tree --tenant-code ejercito-demo
```

---

## Diagnóstico

### `dump_user_assignments`

Muestra assignments, roles, scopes, unidades y permisos efectivos de un usuario.

```powershell
python manage.py dump_user_assignments 12345678-9
```

**Salida de ejemplo:**
```
Usuario: 12345678-9 (Pérez, Juan) - is_active=True
Account #1 en tenant "ejercito-demo" (active=True)
  [*activo] pos=S-3-CO-A         role=oficial_tiro      scope=unidad_y_descendientes  unit=CO-A
  [ activo] pos=TIRADOR-CO-A     role=tirador            scope=solo_propio             unit=CO-A

  Permisos efectivos (por role → permission_code):
    oficial_tiro         [shooting] create_shooting_lessons
    oficial_tiro         [shooting] score_shooters
    oficial_tiro         [warehouse] view_warehouse
    ...
```

---

### `assign_tenant_admin`

Asigna rol `tenant_admin` a un usuario existente.

```powershell
python manage.py assign_tenant_admin --tenant-code ejercito-demo --username 12345678-9
```

