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

## Cuentas ficticias de desarrollo local

### `provision_development_accounts`

Crea ocho cuentas ficticias reservadas —una por rol canónico— para que el operador y el asistente inicien sesión de forma autónoma contra el backend local, sin pedir tokens, sesiones ni credenciales a mano.

```bash
# Preflight: valida destino, contexto, catálogo y colisiones. No escribe nada
./.venv/bin/python manage.py provision_development_accounts --database default --tenant-code desarrollo-poligono-local --check

# Aplicación (idempotente)
./.venv/bin/python manage.py provision_development_accounts --database default --tenant-code desarrollo-poligono-local
```

Ambos argumentos son obligatorios y aceptan **un solo valor** cada uno. No existen opciones `force` ni bypass de desarrollo. Con `--check` el comando no crea directorios ni modifica archivos.

**Destino y contexto** (constantes del comando, no configurables):

| Elemento | Valor |
|---|---|
| Base de datos | archivo local `db.sqlite3` de la raíz del proyecto, alias `default` |
| Tenant | `desarrollo-poligono-local` |
| Unidad | `CIA-A` |
| Armería | `ALM-CIA-A-DEV` |

**Cuentas cubiertas** — una por rol. Los registros reservados llevan el prefijo `devrole_accounts_` en el usuario y `DEVROLE-ACCOUNTS-` en el código de puesto:

| Rol | Etiqueta | Ámbito principal |
|---|---|---|
| `super_admin` | Administrador global | Global |
| `tenant_admin` | Administrador de tenant | Todo el tenant |
| `admin_unidad` | Administrador de unidad | `unidad_y_descendientes` |
| `comandante_unidad` | Comandante de unidad | `unidad_y_descendientes` |
| `oficial_tiro` | Oficial de tiro | `unidad_y_descendientes` |
| `oficial_observador` | Oficial observador | `unidad_y_descendientes` |
| `encargado_almacen` | Encargado de almacén | `unidad_propia`, con armería `ALM-CIA-A-DEV` |
| `tirador` | Tirador | `solo_propio` |

Resultado sobre el destino aprobado: 8 `Usuario`/`Person`/`Account`, 8 `Position`, 15 `Assignment` (ocho primarias más las siete secundarias del puesto `tirador`) y 8 `UnitMembership`.

**Credenciales.** Viven únicamente en `.cache/development-role-accounts/credentials.json` —directorio `0700`, archivo `0600`, excluido de Git—; la base de datos solo guarda los hashes. Ese archivo es el punto de lectura del operador y del asistente autorizado: se leen sus entradas para autenticarse, en lugar de pedir tokens o sesiones al usuario.

**Repetir el comando es seguro**: reutiliza registros y contraseñas existentes, no recrea cuentas, no rota secretos y no añade filas ni entradas de auditoría. Puede ejecutarse de nuevo tras cualquier preflight sin efectos colaterales.

**Cuándo aborta**, sin adoptar, rotar ni sobrescribir nada: credenciales ausentes o divergentes para cuentas ya existentes, archivo de credenciales corrupto o incompleto, colisión de identidad o de puesto, holder incompatible, destino o contexto distintos del aprobado, o catálogo de roles distinto de los ocho soportados.

> **Alcance verificado.** La protección del directorio y del archivo, y el bloqueo de aplicación concurrente, son POSIX y se comprobaron en Linux. No se ha probado Windows ni otros destinos: no se afirma compatibilidad con ellos. Las guardas son exclusivas de desarrollo (`DEBUG`).

**Sesión de estas cuentas.** Login ordinario RUT/password contra `/api/auth/login/`, con cookies propias y `csrftoken` vigente tras el login; las operaciones llevan `X-Tenant-Code`. El aislamiento de sesión es **por cliente, no por cuenta**: aunque dos clientes usen la misma cuenta, cada uno necesita su cookie jar independiente, y cerrar sesión en uno no invalida la sesión del otro. Cada cliente cierra con su propio `csrftoken`, vigente desde su login.

**Nunca publicar** contraseñas, RUT concretos, cookies, tokens ni hashes en chat, tickets o commits.

Origen y evidencia completa: spec archivada [`docs/specs/archive/development-role-accounts.md`](specs/archive/development-role-accounts.md).

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

