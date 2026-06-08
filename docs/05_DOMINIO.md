# Dominio: Modelos de Negocio

## Visión general

El sistema gestiona el ciclo completo de una sesión de tiro militar:

```
Tenant (institución)
  └── OrganizationUnit (unidad militar)
       ├── Armory (almacén de armas)
       │    └── Arma (arma individual)
       └── PoligonoTiro (instalación física)
            └── LeccionTiro (sesión de tiro)
                 └── FraccionTiro (grupo de tiradores)
                      └── ResultadoTiro (resultado individual)
                           ├── Usuario (tirador)
                           └── Arma (arma usada)
```

---

## Tenant

La raíz de todo el modelo multi-tenant.

```python
Tenant
  ├── code       ← identificador único, ej: "ejercito-demo"
  ├── name
  ├── context    ← siempre "military"
  └── is_active
```

---

## OrganizationUnit

Árbol jerárquico de unidades militares dentro de un tenant.

```python
OrganizationUnit
  ├── tenant FK
  ├── parent FK (self, nullable)
  ├── code (único por tenant)
  ├── name
  └── unit_type  ← command/division/regiment/battalion/company/section/squad/staff/range/other
```

### Endpoints

- `GET /api/organization-units/` → listar (filtrado por scope)
- `GET /api/organization-units/lookup/` → todas las unidades (para selects, sin filtro scope)
- `GET /api/organization-units/{id}/previsualizar-eliminacion/`
- `POST /api/organization-units/{id}/eliminar-con-migracion/`

---

## Armory

Almacén de armamento de una unidad.

```python
Armory
  ├── tenant FK
  ├── organization_unit FK
  ├── code (único por tenant)
  ├── name
  └── is_active
```

### Endpoints

- `GET/POST /api/armorias/`
- `GET/PUT/PATCH/DELETE /api/armorias/{id}/`

---

## Arma

Arma individual registrada en el sistema.

```python
Arma
  ├── tenant FK
  ├── armory FK              ← fuente de verdad de la unidad
  ├── organization_unit FK   ← legacy, derivado de armory.organization_unit
  ├── tipo_arma
  ├── modelo_arma
  └── numero_serie           ← único por (modelo, serie)
```

**Nota**: `organization_unit` es campo legacy. En código nuevo, derivar la unidad desde `arma.armory.organization_unit`.

### Endpoints

- `GET/POST /api/armas/`
- `GET/PUT/PATCH/DELETE /api/armas/{id}/`

---

## PoligonoTiro

Instalación física donde se realizan las sesiones de tiro.

```python
PoligonoTiro
  ├── tenant FK
  ├── organization_unit FK
  ├── nombre
  ├── ciudad
  ├── carriles_maximos
  └── distancia_maxima      ← en metros
```

### Endpoints

- `GET/POST /api/poligonos/`
- `GET/PUT/PATCH/DELETE /api/poligonos/{id}/`
- `GET /api/poligonos/{id}/lecciones/`

---

## LeccionTiro

Una sesión de tiro en el polígono. Puede involucrar múltiples unidades.

```python
LeccionTiro
  ├── tenant FK
  ├── organization_unit FK
  ├── id_poligono FK
  ├── fecha_tiro
  ├── numero_orden
  ├── fecha_orden
  ├── tipo_tiro              ← "evaluacion" o "entrenamiento"
  ├── cant_tiros_cereo
  ├── cant_tiros_leccion
  ├── distancia              ← en metros
  └── unidades_participantes M2M → OrganizationUnit
```

`unidades_participantes` permite que unidades distintas a la organizadora participen como tiradores.

### Endpoints

- `GET/POST /api/lecciones/`
- `GET/PUT/PATCH/DELETE /api/lecciones/{id}/`
- `GET /api/lecciones/{id}/fracciones/`
- `GET /api/lecciones/{id}/usuarios/`
- `GET /api/lecciones/{id}/resultados/`
- `GET /api/lecciones/{id}/resultados-resumen/`
- `GET /api/lecciones/{id}/reporte/`
- `GET /api/lecciones/{id}/tiradores-elegibles/`

---

## FraccionTiro

Grupo de tiradores dentro de una lección.

```python
FraccionTiro
  ├── tenant FK
  ├── organization_unit FK
  ├── id_leccion FK
  ├── tiradores_totales
  └── numero_fraccion        ← único por lección
```

### Endpoints

- `GET/POST /api/fracciones/`
- `GET/PUT/PATCH/DELETE /api/fracciones/{id}/`
- `GET /api/fracciones/{id}/tiradores/`
- `GET /api/fracciones/{id}/resultados/`

---

## ResultadoTiro

Resultado de un tirador en una fracción.

```python
ResultadoTiro
  ├── tenant FK
  ├── organization_unit FK
  ├── id_fraccion FK
  ├── id_usuario FK
  ├── id_arma FK
  ├── tiros_acertados
  ├── total_tiros
  └── numero_carril          ← nullable
```

**Constraints únicos** (un tirador, arma y carril por fracción):
- `(id_fraccion, id_usuario)` único
- `(id_fraccion, id_arma)` único
- `(id_fraccion, numero_carril)` único cuando `numero_carril IS NOT NULL`

### Endpoints

- `GET/POST /api/resultados/`
- `GET/PUT/PATCH/DELETE /api/resultados/{id}/`

---

## Usuario

Extiende `AbstractUser` de Django.

```python
Usuario
  ├── id_usuario (BigAutoField, PK)
  ├── rut (unique)
  ├── nombre
  ├── apellido_paterno
  ├── apellido_materno
  ├── correo
  ├── grado
  ├── must_change_password   ← True en el primer login
  ├── password_changed_at
  ├── is_temporary           ← True para tiradores sin cuenta formal
  └── (preferencias UI) theme, palette, density
```

**Nota**: Los campos `rol`, `unidad_regimentaria`, `unidad_combate`, `unidad_fundamental` fueron eliminados en FASE 6. Los permisos y la unidad vienen del `Assignment → Position`.

### Tiradores temporales

Un tirador "temporal" (`is_temporary=True`) existe solo para registrar resultados, sin credenciales. Al crear la cuenta formal con el mismo RUT, el sistema lo **promueve** (no duplica).

```http
POST /api/usuarios/crear-temporal/
{ "rut": "11111111-1", "grado": "Cabo", "nombre": "Pedro", "apellido_paterno": "González" }
```

### Endpoints de usuario

- `GET/POST /api/usuarios/`
- `GET/PUT/PATCH/DELETE /api/usuarios/{id}/`
- `PUT/PATCH /api/usuarios/{id}/asignacion-principal/`
- `POST /api/usuarios/{id}/desactivar-asignacion-principal/`
- `POST /api/usuarios/{id}/agregar-asignacion/`
- `POST /api/usuarios/{id}/quitar-asignacion/{assignment_id}/`
- `POST /api/usuarios/{id}/cambiar-contrasena/`
- `POST /api/usuarios/{id}/resetear-contrasena/`
- `POST /api/usuarios/crear-temporal/`
- `GET/PUT /api/me/preferences/appearance/`
- `GET /api/me/assignable-units/`

---

---

## Recinto

Espacio físico que agrupa múltiples unidades militares. **No es un escalón de mando** — las unidades dentro mantienen su propia jerarquía.

```python
Recinto
  ├── tenant FK
  ├── code (único por tenant)   ← ej: "CMV", "CMP", "CMLR"
  ├── name                      ← ej: "Campo Militar Valdivia"
  ├── description
  ├── is_active
  └── units M2M → OrganizationUnit
```

**Para qué sirve:**
- Permite al SICE de un recinto administrar **todas** las unidades físicamente presentes, sin importar su rama o jerarquía de mando.
- La Position del SICE tiene `scope_policy = todo_recinto` y `recinto = CMV`.
- `get_allowed_unit_ids` devuelve todos los IDs de unidades del recinto.

**Diferencia con `OrganizationUnit` padre:**
- Un parent jerárquico implica mando. Un recinto solo implica ubicación física.
- Una unidad puede estar en un recinto sin reportarle administrativamente.

### Endpoints de Recinto

- `GET/POST /api/recintos/`
- `GET/PUT/PATCH/DELETE /api/recintos/{id}/`
- `POST /api/recintos/{id}/agregar-unidad/{unit_code}/`
- `DELETE /api/recintos/{id}/quitar-unidad/{unit_code}/`

### Cómo crear el puesto SICE de un recinto

```
1. Crear el Recinto (POST /api/recintos/)
   { "code": "CMV", "name": "Campo Militar Valdivia" }

2. Agregar las unidades que físicamente están en él
   POST /api/recintos/{id}/agregar-unidad/REG-X/
   POST /api/recintos/{id}/agregar-unidad/JAL/
   POST /api/recintos/{id}/agregar-unidad/CLINICA/

3. Crear la Position del SICE
   POST /api/posiciones/
   {
     "code": "SICE-CMV",
     "name": "SICE Campo Militar Valdivia",
     "organization_unit_code_write": "JAL",   ← unidad orgánica del SICE
     "role_code_write": "admin_unidad",
     "scope_code_write": "todo_recinto",
     "recinto_code_write": "CMV"              ← recinto que administra
   }

4. Asignar la persona al puesto
   POST /api/posiciones/{id}/asignar-holder/
   { "account_id": 42, "is_primary": true }
```

---

## Flujo completo de una sesión de tiro

```
Preparación:
  1. Seleccionar polígono (GET /api/poligonos/)
  2. Crear lección (POST /api/lecciones/)
  3. Agregar unidades participantes si es necesario

Ejecución:
  4. Crear fracción (POST /api/fracciones/)
  5. Obtener tiradores elegibles (GET /api/lecciones/{id}/tiradores-elegibles/)
  6. Registrar ResultadoTiro por cada tirador (POST /api/resultados/)

Consulta:
  7. GET /api/lecciones/{id}/reporte/  → detallado o solo resumen según scope
```

---

## Calibre

Catálogo global de calibres de munición. No tiene tenant: es referencia compartida por todos.

```python
Calibre
  ├── id_calibre  AutoField PK
  ├── code        ← canónico único: "5.56X45", "7.62X51", "9X19", "8.6X70", "12.7X99", "84MM"
  ├── nombre      ← legible: "5.56×45mm NATO"
  └── is_active
```

El catálogo se siembra automáticamente en la migración `0018_calibre`.

---

## EjercicioMilitar

Registro de un ejercicio de combate en campo. Agrupa los consumos de munición del evento.

```python
EjercicioMilitar
  ├── id_ejercicio
  ├── tenant / organization_unit   ← scope multi-tenant
  ├── nombre            ← "Ejercicio Bayoneta 2025"
  ├── fecha
  ├── zona              ← descripción geográfica libre
  ├── tipo_ejercicio    ← asalto | defensa | movimiento | mixto | otro
  ├── numero_orden / fecha_orden   ← referencia documental
  ├── observaciones
  ├── unidades_participantes  M2M OrganizationUnit
  └── consumos          ← related: ConsumoMunicion
```

---

## ConsumoMunicion

Línea de consumo de munición dentro de un EjercicioMilitar. Representa un tipo/calibre de arma.

```python
ConsumoMunicion
  ├── id_consumo
  ├── tenant
  ├── ejercicio         FK EjercicioMilitar (CASCADE)
  ├── tipo_arma         ← choices: fusil | subfusil | pistola | francotirador | ametralladora | apoyo
  ├── modelo_arma       ← texto libre opcional
  ├── calibre           FK Calibre (PROTECT)
  ├── cantidad_armas    ← cuántas armas participaron (opcional)
  ├── cantidad_tiros
  ├── es_aproximado     ← True si es estimación de campo
  ├── observaciones
  └── detalle_armas     ← related: ConsumoArma
```

---

## ConsumoArma

Detalle de consumo por arma individual. Nivel de granularidad opcional bajo ConsumoMunicion.

```python
ConsumoArma
  ├── id_consumo_arma
  ├── tenant
  ├── consumo           FK ConsumoMunicion (CASCADE)
  ├── arma              FK Arma (PROTECT)
  ├── cantidad_tiros
  └── observaciones
  # UniqueConstraint(consumo, arma)
```

**Flujo de registro:**
```
POST /api/ejercicios/           → crear EjercicioMilitar
POST /api/consumos-municion/    → agregar línea por tipo/calibre
POST /api/consumos-arma/        → (opcional) desglosar por arma individual
```
