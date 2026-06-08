# Guía para el Desarrollador Frontend

Esta guía explica todo lo necesario para consumir la API REST de PoligonoTiro.

## Resumen del sistema

PoligonoTiro es una aplicación para la gestión de sesiones de tiro en unidades militares:

- **Autenticación** por sesiones Django con cookies HttpOnly — no se maneja el token directamente
- **Protección CSRF** — el frontend lee la cookie `csrftoken` y la envía como header en métodos no-seguros
- **Multi-tenant** — header `X-Tenant-Code` obligatorio en cada request autenticado
- **Permisos atómicos** — el contexto de auth retorna un array de `permission_codes` para controlar la UI

---

## Configuración del cliente HTTP

### Axios (recomendado)

```javascript
import axios from 'axios'

function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1]
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,   // CRÍTICO: envía cookies en requests cross-origin
})

// Interceptor CSRF para métodos no-seguros
api.interceptors.request.use(config => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
    config.headers['X-CSRFToken'] = getCsrfToken()
  }
  return config
})

// Header X-Tenant-Code desde el estado de sesión
api.interceptors.request.use(config => {
  const tenantCode = store.tenantCode  // o donde tengas el tenant activo
  if (tenantCode) config.headers['X-Tenant-Code'] = tenantCode
  return config
})

// 401 → redirigir al login (no hay refresh token)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) window.location.href = '/login'
    return Promise.reject(error)
  }
)

export default api
```

---

## Flujo de autenticación

### 1. Inicialización de la app

Al montar la app, hacer un `GET /api/auth/context/`. Esto:
- Carga los datos del usuario si hay sesión activa
- Siempre emite la cookie `csrftoken` que se necesita para el login

```javascript
async function initApp() {
  try {
    const response = await api.get('/api/auth/context/')
    store.setUser(response.data.user)
    store.setPermissions(response.data.permissions)  // array de permission_codes
    store.setUnitMembership(response.data.unit_membership)
    store.setAuthenticated(true)
  } catch (err) {
    if ([401, 403].includes(err.response?.status)) {
      store.setAuthenticated(false)
      router.push('/login')
    }
  }
}
```

### 2. Login

```javascript
const login = async (rut, password) => {
  const response = await api.post('/api/auth/login/', { rut, password })
  const { id_usuario, must_change_password } = response.data

  if (must_change_password) {
    router.push('/cambiar-contrasena')
    return
  }
  router.push('/dashboard')
}
```

**Respuesta del login:**
```json
{
  "id_usuario": 42,
  "must_change_password": false
}
```

> **Nota**: la respuesta ya **no incluye `rol`** — los permisos se obtienen del campo `permissions` en `/api/auth/context/`.

### 3. Logout

```javascript
const logout = async () => {
  await api.post('/api/logout/')
  store.clearUser()
  router.push('/login')
}
```

---

## Contexto del usuario autenticado

```http
GET /api/auth/context/
X-Tenant-Code: ejercito-demo
```

**Respuesta completa:**
```json
{
  "user": {
    "id_usuario": 42,
    "rut": "12345678-9",
    "nombre": "Juan",
    "apellido_paterno": "Pérez",
    "grado": "Teniente",
    "must_change_password": false
  },
  "tenant": {
    "code": "ejercito-demo",
    "context": "military"
  },
  "unit_membership": {
    "id": 5,
    "unit_code": "CO-A",
    "unit_name": "Compañía A"
  },
  "scopes": ["unidad_y_descendientes"],
  "assignments": [
    {
      "role": "oficial_tiro",
      "scope": "unidad_y_descendientes",
      "organization_unit": "CO-A",
      "is_primary": true
    }
  ],
  "permissions": [
    "view_unit",
    "create_shooting_lessons",
    "score_shooters",
    "view_personnel_basic",
    "view_warehouse"
  ]
}
```

---

## Manejo de permisos en la UI

El campo `permissions` contiene los `permission_codes` del usuario. Usarlos para mostrar/ocultar botones:

```javascript
// Guardar en el store
store.setPermissions(response.data.permissions)  // ['view_unit', 'score_shooters', ...]

// Helper
const hasPermission = (code) => store.permissions.includes(code)

// En la UI:
// {hasPermission('create_shooting_lessons') && <Button>Nueva Lección</Button>}
// {hasPermission('score_shooters') && <Button>Registrar Resultado</Button>}
// {hasPermission('manage_permissions') && <Link>Administración</Link>}
```

### Catálogo de permission_codes

```
view_self              edit_self
view_personnel_basic   view_personnel_full    manage_personnel
assign_positions       revoke_positions
view_unit              view_unit_hierarchy    create_unit    update_unit    delete_unit
assign_commanders      revoke_commanders
create_users           update_users           disable_users
create_shooting_lessons  update_shooting_lessons  delete_shooting_lessons
assign_shooters        remove_shooters        score_shooters    validate_scores
view_warehouse         create_warehouse_records  update_warehouse_records
delete_warehouse_records  transfer_warehouse_material  inventory_warehouse
view_recinto           manage_recinto
manage_roles           manage_permissions     view_audit_logs  manage_system_settings
```

> **`view_recinto`** / **`manage_recinto`**: para gestionar Campos Militares y recintos. Ver [docs/05_DOMINIO.md](05_DOMINIO.md) para el caso de uso del SICE.

---

## Header X-Tenant-Code

**Obligatorio en cada request autenticado.** Sin él → 403.

---

## Recuperación de contraseña

Flujo de 4 pasos, todos **públicos** (sin auth, sin CSRF necesario):

```javascript
// 1. Verificar RUT
await fetch('/api/recuperar/', { method: 'POST', body: JSON.stringify({ rut }) })

// 2. Enviar código por correo
await fetch('/api/recuperar/crear/', { method: 'POST', body: JSON.stringify({ rut }) })

// 3. Verificar código (expira en 5 minutos)
await fetch('/api/recuperar/comprobar/', { method: 'POST', body: JSON.stringify({ rut, codigo }) })

// 4. Cambiar contraseña
await fetch('/api/recuperar/cambiar/', { method: 'POST', body: JSON.stringify({ rut, codigo, nueva_password }) })
```

---

## Tipos TypeScript principales

```typescript
interface Usuario {
  id_usuario: number
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  correo?: string
  grado?: string
  must_change_password: boolean
  is_temporary: boolean
}

interface AuthContext {
  user: Usuario
  tenant: { code: string; context: string }
  unit_membership: { id: number; unit_code: string; unit_name: string } | null
  scopes: string[]
  assignments: AssignmentInfo[]
  permissions: string[]   // array de permission_codes
}

interface AssignmentInfo {
  role: string
  scope: string
  organization_unit: string
  is_primary: boolean
}

interface LeccionTiro {
  id: number
  id_poligono: number
  fecha_tiro: string
  tipo_tiro: 'evaluacion' | 'entrenamiento'
  cant_tiros_cereo: number
  cant_tiros_leccion: number
  distancia: number
  unidades_participantes: number[]
}

interface ResultadoTiro {
  id: number
  id_fraccion: number
  id_usuario: number
  id_arma: number
  tiros_acertados: number
  total_tiros: number
  numero_carril?: number
}
```

---

## Flujos principales

### Crear sesión de tiro

```
1. GET /api/poligonos/                          ← seleccionar polígono (cualquier polígono del tenant)
2. GET /api/organizaciones/                     ← cargar lista de unidades del tenant para el selector
3. POST /api/lecciones/                         ← crear lección
4. POST /api/fracciones/                        ← crear fracción
5. GET /api/lecciones/{id}/tiradores-elegibles/ ← obtener tiradores de las unidades participantes
6. POST /api/resultados/                        ← registrar resultado por tirador
```

**Selector de polígono:** mostrar todos los polígonos activos del tenant, sin filtrar por unidad del usuario. Una unidad puede usar el polígono de otra.

**Selector de unidades participantes:** mostrar **todas las unidades activas del tenant** (no solo las del scope del usuario). El backend acepta cualquier unidad del tenant — esto permite lecciones cruzadas entre unidades de distintas ramas jerárquicas (ej. Hospital Militar usando el polígono de la BOE, o Centro Clínico Militar Valdivia disparando con el Campo Militar Valdivia).

Enviar los `code` de las unidades elegidas en `unidades_participantes_codes_write`. Si el usuario no selecciona ninguna, omitir el campo — el backend asigna automáticamente la unidad del creador.

### Gestionar usuarios

```javascript
// Listar
await api.get('/api/usuarios/')

// Crear formal
await api.post('/api/usuarios/', {
  rut: '12345678-9', nombre: 'Juan', apellido_paterno: 'Pérez', grado: 'Teniente',
  initial_unit_code: 'CO-A', initial_role_code: 'oficial_tiro', initial_scope_code: 'unidad_y_descendientes'
})

// Crear tirador temporal (sin cuenta formal)
await api.post('/api/usuarios/crear-temporal/', {
  rut: '11111111-1', grado: 'Cabo', nombre: 'Pedro', apellido_paterno: 'González'
})

// Asignar/cambiar rol principal
await api.put(`/api/usuarios/${id}/asignacion-principal/`, {
  unit_code: 'CO-A', role_code: 'oficial_tiro', scope_code: 'unidad_y_descendientes'
})
```

---

## Cambio de unidad activa

Un usuario puede tener assignments en múltiples unidades. Para cambiar la activa:

```javascript
// Los assignments disponibles vienen en context.assignments
// El que tiene is_primary: true es el activo

await api.post('/api/auth/select-unit/', { organization_unit_code: 'CO-B' })
// Luego refrescar el contexto
const ctx = await api.get('/api/auth/context/')
store.setContext(ctx.data)
```

---

## Gestión de cuentas bloqueadas

El campo `is_locked` viene incluido en cada objeto de usuario. El frontend puede mostrarlo en la lista de usuarios y habilitar el botón de desbloqueo.

```typescript
interface Usuario {
  // ...campos existentes...
  is_locked: boolean   // true = bloqueada por intentos fallidos
}
```

### Flujo recomendado en la UI

```
1. Listar usuarios → mostrar ícono de candado si is_locked === true

2. Clic en "Desbloquear" → verificar estado actual:
   GET /api/usuarios/{id}/estado-bloqueo/
   → { is_locked: true, failures: 5, last_attempt: "..." }

3. Confirmar con el operador → ejecutar desbloqueo:
   POST /api/usuarios/{id}/desbloquear/
   → { detail: "Cuenta desbloqueada correctamente.", rut: "..." }

4. Mostrar confirmación y refrescar la lista
```

### ¿Quién puede desbloquear desde el frontend?

El botón "Desbloquear" solo debe mostrarse si el usuario autenticado tiene el permission_code `update_users`. El backend ya valida el scope, pero la UI puede controlarlo así:

```javascript
const canUnlock = hasPermission('update_users')
// El endpoint rechazará con 403 si no tiene permiso, o 404 si está fuera del scope
```

---

## Manejo de errores

| Código | Causa | Acción en UI |
|---|---|---|
| 400 | Validación de campos | Mostrar errores por campo del body |
| 401 | Sesión expirada | Redirigir al login |
| 403 + "Tenant" | Falta X-Tenant-Code | Bug en el cliente |
| 403 + "CSRF" | Falta X-CSRFToken o es inválido | Verificar interceptor |
| 403 + "permisos" | Sin permiso para la acción | Ocultar la opción en la UI |
| 404 | Recurso no existe | Mostrar "no encontrado" |
| 429 | Rate limit | Esperar y reintentar |

Formato de error de validación (400):
```json
{ "rut": ["Este campo es requerido."], "fecha_tiro": ["Ingrese una fecha válida."] }
```

---

## Preferencias de UI

```javascript
// Obtener
const { data: prefs } = await api.get('/api/me/preferences/appearance/')
// { theme: 'nexus-light', palette: 'corporate-blue', density: 'comfortable' }

// Actualizar
await api.put('/api/me/preferences/appearance/', {
  theme: 'nexus-dark', palette: 'military-teal', density: 'compact'
})
```

---

## Ejercicios en Campo

Los ejercicios militares en campo registran el consumo de munición fuera del polígono de tiro formal. El flujo tiene tres niveles de granularidad opcionales.

### Flujo de registro

**1. Crear el ejercicio**

```js
const ejercicio = await api.post('/api/ejercicios/', {
  nombre: 'Ejercicio Bayoneta 2025',
  fecha: '2025-09-15',
  zona: 'Sector Norte, Campo Marte',
  tipo_ejercicio: 'asalto',            // asalto | defensa | movimiento | mixto | otro
  numero_orden: 'ORD-2025-042',
  fecha_orden: '2025-09-01',
  observaciones: '',
  unidades_participantes_codes_write: ['BOE-I', 'CCIA-A'],
})
// Retorna: { id_ejercicio, nombre, fecha, unidades_participantes_codes, ... }
```

**2. Agregar líneas de consumo por tipo/calibre**

Cada línea representa un tipo de arma y calibre con su total de disparos.

```js
const consumo = await api.post('/api/consumos-municion/', {
  ejercicio: ejercicio.id_ejercicio,
  tipo_arma: 'fusil',                  // de TIPO_ARMA_CHOICES
  modelo_arma: 'GALIL ACE 22',         // texto libre, opcional
  calibre_code_write: '5.56X45',       // code del catálogo /api/calibres/
  cantidad_armas: 24,
  cantidad_tiros: 1200,
  es_aproximado: false,
  observaciones: '',
})
```

**3. (Opcional) Desglosar por arma individual**

Si se requiere trazabilidad por número de serie:

```js
await api.post('/api/consumos-arma/', {
  consumo: consumo.id_consumo,
  arma: 12,                            // id_arma del inventario
  cantidad_tiros: 50,
  observaciones: '',
})
```

### Catálogo de calibres

Antes de mostrar el formulario de consumo, cargar el catálogo:

```js
const { data } = await api.get('/api/calibres/')
// [{ id_calibre, code, nombre, is_active }, ...]
// Calibres disponibles: 5.56X45, 7.62X51, 9X19, 8.6X70, 12.7X99, 84MM
```

Usar `code` como valor de escritura (`calibre_code_write`) y `nombre` como label en el select.

### Tipos de arma disponibles

```js
const TIPO_ARMA_CHOICES = [
  { value: 'fusil',         label: 'Fusil de Asalto / Carabina' },
  { value: 'subfusil',      label: 'Subfusil' },
  { value: 'pistola',       label: 'Pistola' },
  { value: 'francotirador', label: 'Fusil de Precisión / Francotirador' },
  { value: 'ametralladora', label: 'Ametralladora' },
  { value: 'apoyo',         label: 'Armamento de Apoyo' },
]
```

Estos mismos valores aplican tanto para el campo `tipo_arma` de `Arma` como para `ConsumoMunicion`.

### Permisos por rol

| Rol | Puede |
|---|---|
| `tenant_admin` | CRUD completo ejercicios + gestionar calibres |
| `admin_unidad` | Crear y editar ejercicios, ver calibres |
| `oficial_tiro` | Crear y editar ejercicios, ver calibres |
| `encargado_almacen` | Ver ejercicios, CRUD consumos |
| `comandante_unidad` | Solo lectura ejercicios |
| `tirador` | Ver catálogo de calibres |
