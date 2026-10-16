---
actualizado: 2026-10-13
---

# Sesión de frontend autónomo — resumen del 2026-10-13

> 🕯️ **Qué es y qué no.** `Lore Master`. Resumen documental de la sesión de UI del **2026-10-13**:
> un barrido de rutas con los ocho actores, el personalizador de ocho ejes, dos correcciones de
> frontend verificadas, dos intentos de escritura acotados por el harness y la comprobación de
> prerrequisitos. **Consolida avances comprobados**; **no** cierra aceptación integral, **no** emite
> veredicto de producto (corresponde al orquestador) y **no** propone ni aplica arreglos de backend.
> Fuentes primarias **inalteradas** en [`evidence/2026-10-13/`](./), celdas y conteos en
> [`../2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json). Sin secretos, sin
> RUT, sin contraseñas y sin cookies.

## 1. Índice

1. [Conteos de celdas](#2-conteos-de-celdas) · 2. [Qué se acreditó](#3-qué-se-acreditó) ·
3. [Movimientos de celda](#4-movimientos-de-celda) · 4. [Decisiones conservadoras](#5-decisiones-conservadoras) ·
5. [Límites](#6-límites)

---

## 2. Conteos de celdas

| Estado | Antes de la sesión | Después | Δ |
|---|---:|---:|---:|
| `OBSERVED_OK` | 14 | **174** | +160 |
| `PARTIAL` | 22 | **20** | −2 |
| `NOT_EXERCISED` | 1284 | **1126** | −158 |
| Denominador | 165 OP / 1320 celdas | **165 OP / 1320 celdas** | sin cambio |

**176 celdas** cambiaron: 142 `NOT_EXERCISED` → `OBSERVED_OK`, 18 `PARTIAL` → `OBSERVED_OK` y 16
`NOT_EXERCISED` → `PARTIAL`. Recuento obtenido recorriendo las 165 filas × 8 actores del archivo, no
por agregación de conteos declarados a mano. **No** se modificó ninguna fila `OP-*`, ningún actor ni
`total_cells`, y **ninguna** evidencia previa se borró: cada fila conserva su texto y añade el de esta
sesión.

> 🕯️ El salto de `OBSERVED_OK` es **de lectura**: 144 celdas provienen del barrido de rutas y 8 del
> login por UI. **Ninguna** celda nueva acredita una escritura de negocio exitosa.

---

## 3. Qué se acreditó

### 3.1 Barrido de rutas: 144 navegaciones, ocho actores

Contexto de navegador nuevo por actor, login por UI real, 18 rutas por actor y **sólo GET de
negocio**. Resultado: **144 navegaciones**, **164 respuestas GET** de negocio, todas **200**, que
colapsan en **144 celdas distintas** (operación, actor). Hubo **14 denegaciones neutrales**: rutas
pintadas sin `h1` y **sin request de dominio**. Lectura por operación:

| Lectura de listado | Actores con `GET` 200 |
|---|---|
| `/organization-units/`, `/posiciones/`, `/memberships/`, `/usuarios/`, `/authz/roles/`, `/authz/role-categories/`, `/authz/scopes/`, `/authz/permissions/`, `/calibres/`, `/poligonos/`, `/lecciones/`, `/ejercicios/`, `/consumos-municion/`, `/consumos-arma/` | los 8 |
| `/organization-units/lookup/` | A1..A5, A7 |
| `/armorias/`, `/armas/` | A1..A5, A7 |
| `/recintos/` | A1..A4 |
| `/auth/audit-log/` | A1, A2 |
| `/usuarios/{id}/` (ficha propia en `/cuenta`) | los 8 |

Además, `POST /api/auth/login/` **200** y `GET /api/auth/context/` **200** para los **8** actores.

### 3.2 Personalizador de ocho ejes, contra el backend

Ocho escrituras por UI, **una por eje**, `PUT /api/me/preferences/appearance/design-system/` →
**200** en las ocho, cada una confirmada por `GET`. Persistencia verificada **tras cerrar sesión y
volver a entrar por UI**, con los atributos aplicados en el DOM. Aislamiento observado: **A8 leyó
200 y permaneció intacto tras cada escritura de A7**. Reset por UI: `DELETE` → **204**, con los ocho
ejes de A7 y de A8 de vuelta a los defaults del Design System.

### 3.3 Dos correcciones de frontend, verificadas

| Corrección | Verificación |
|---|---|
| El motivo concreto del backend se muestra en la UI en lugar del mensaje HTTP genérico | `PATCH /api/resultados/1/` → **400** con el `non_field_errors` visible; resultados 1 y 2 intactos (**8/10** y **7/10**) |
| `position: relative` en `.table-responsive` de armerías | El scroll del documento iguala al ancho del cliente en **8 anchos (320 a 1920)**; la tabla conserva su propio scroll horizontal |

Comandos corridos por el orquestador: `typecheck` **exit 0**, `test:focused` **exit 0** con **15
archivos y 232 tests**, `build` **exit 0**. Quedan dos advertencias que **no** se acreditan: el
import de `vite.config` sin extensión y un chunk por encima de 500 kB.

### 3.4 Escrituras intentadas y acotadas por el harness

| Familia | Qué se observó | Estado |
|---|---|---|
| Organización (A1) | El editor se sembró desde la respuesta real y el `PATCH` de nombre devolvió `response.ok` con aviso «Unidad actualizada» | `PARTIAL`. El artefacto **no** registra el estado HTTP exacto de esa escritura y prohíbe promover `response.ok` a un 200 supuesto |
| Armas (A1) | La escritura de UI **sí** persistió un cambio, verificado después por lectura | `PARTIAL` por la misma razón |

**Los dos casos no se equiparan**, y su evidencia tampoco:

| | Organización | Armas |
|---|---|---|
| Escritura de UI | `response.ok` y aviso en pantalla; **sin** estado HTTP registrado | Persistencia del cambio verificada por lectura posterior; **sin** estado HTTP registrado |
| Compensación | El artefacto registra **un `PATCH` de compensación** por API pública que devolvió la unidad a su nombre original, **pero no consigna su estado HTTP**: no se afirma ningún 200 | `PATCH` de compensación por API pública con **estado HTTP 200 registrado de forma explícita** en el artefacto |
| Verificación de restauración | `GET` final **200** con igualdad exacta contra la línea base | `GET` final **200** con igualdad campo a campo del DTO contra la línea base |

En ambos casos la compensación la hizo el harness y **no** se acredita como éxito de UI. **No** hay
roundtrip de edición por UI acreditado, ni alta ni baja en ninguna de las dos familias.

### 3.5 Denegaciones de backend observadas

El barrido de runtime del worker terminó en `harness_error` para los **8** actores y **no** evaluó
superficie de UI. Aun así dejó **14 `GET` reales** con **403** en lectura directa a la API con sesión
real: `/auth/audit-log/` (A3..A8), `/recintos/` (A5..A8), `/armorias/` (A6, A8) y `/armas/` (A6, A8).
Esas celdas quedan **`PARTIAL`**: documentan denegación de backend, no la superficie de UI.

### 3.6 Prerrequisitos que siguen bloqueados

| Prerrequisito | Comprobación | Estado |
|---|---|---|
| Recuperación por correo | Backend SMTP apuntando a loopback:puerto 1025, **sin listener** y sin capturador local disponible; no se instaló nada | `BLOCKED_PREREQUISITE` |
| Cambio forzado de contraseña | Una sola cuenta legacy marcada, **sin credencial conocida**; no se fabricó flujo verde | `BLOCKED_PREREQUISITE` |
| Aislamiento entre tenants | **Un** solo tenant; no se proveyó un segundo | `BLOCKED_PREREQUISITE` |

### 3.7 Capturas

**24 PNG** en tema claro en `~/Desktop/capturas-frontend-2026-10-13-actualizadas/` (armerías, cuenta
y personalizador, ocho anchos). Son **snapshots del estado actual**: **no** son parejas antes-después
y **no** acreditan fidelidad ni paridad visual con el Design System.

---

## 4. Movimientos de celda

| Grupo | Filas | Actores | Cambio | Observado |
|---|---|---|---|---|
| Lecturas del barrido | 20 filas `GET` | ver §3.1 | → `OBSERVED_OK` | `GET` de negocio **200** por navegación de ruta |
| Sesión | `POST /auth/login/`, `GET /auth/context/` | los 8 | → `OBSERVED_OK` | Login por UI **200** y contexto **200** en las 18 rutas de cada actor |
| Ficha propia | `GET /usuarios/{id}/` | los 8 | `PARTIAL` → `OBSERVED_OK` | Observación directa que supera el reporte previo del worker |
| Unidades | `GET /organization-units/` | A8 | `PARTIAL` → `OBSERVED_OK` | Ídem sondeo previo del worker |
| Preferencias | `GET …/design-system/` | A8 | → `OBSERVED_OK` | A8 lee **200** sin cambios; **no** escribe |
| Enforcement | 4 filas `GET` | 14 combinaciones | → `PARTIAL` | **403** real en lectura directa (§3.5) |
| Escritura acotada | `PATCH /organization-units/{id}/`, `PATCH /armas/{id}/` | A1 | → `PARTIAL` | Escritura de UI sin estado HTTP exacto (§3.4) |

Filas que **conservaron** su estado y sólo reciben evidencia enlazada: `GET
/organization-units/{id}/` y `GET /armas/{id}/` siguen `NOT_EXERCISED`; `PATCH /resultados/{id}/`
sigue `PARTIAL` pese a la corrección de presentación del error.

---

## 5. Decisiones conservadoras

Dónde la evidencia **no** daba para promover, y por qué no se promovió:

| No se promovió | Motivo |
|---|---|
| Las **14 denegaciones neutrales** del barrido | No hubo request de dominio que leer: una ruta pintada en estado denegado **no** es un 403 de backend. Los `403` que sí existen vienen de la lectura directa real del §3.5 |
| Los **estados HTTP exactos** de las dos escrituras acotadas | En organización y en armas el artefacto no conserva el estado HTTP de la escritura de UI; un 200 supuesto sería inventado. La compensación por API es del harness y no se acredita como éxito de UI; sólo el `PATCH` de compensación de armas tiene un 200 explícito en la fuente (§3.4) |
| `GET /organization-units/{id}/` y `GET /armas/{id}/` | El artefacto no registra el path del `GET` observado, así que no permite distinguir el detalle abierto por la UI de una lectura de verificación del harness. El listado de esas familias ya está acreditado en el barrido |
| El **logout** de los ocho actores del barrido | Cerrar el contexto de navegador no es `POST /api/logout/` |
| `PUT` y `DELETE` de preferencias del actor A8 | A8 leyó, no escribió |
| Filas de `tbody` como inventario | Son filas renderizadas; organización se pinta como árbol y cuenta combina varias tablas. No son recursos ni denominador |
| Fidelidad visual del Design System | No hay comparación con navegador; las capturas son estado actual, no prueba de paridad |

> 📜 **Deriva detectada en el texto previo.** La flecha de conteo de la §1 del estado consolidado
> apuntaba a `1285 / 21 / 14`, mientras que §6.1 y el archivo de la matriz dan `1284 / 22 / 14` para
> la misma fecha. Ambas sumas dan 1320, así que la diferencia es de una celda entre `NOT_EXERCISED` y
> `PARTIAL`. **Prevalece el archivo**: el recuento de las 165 filas da `1284 / 22 / 14` antes de esta
> sesión. Esas flechas son punteros vivos, así que se reorientaron a §7.1; el corte del 2026-10-12 y el
> apéndice §6 se conservan sin reescribir. Queda registrado en §7.1 del estado consolidado.

---

## 6. Límites

- **Sólo lectura** en el barrido: **no** se acredita CRUD, ni alta, ni baja, ni edición.
- **Un solo tenant**: no hay aislamiento entre tenants.
- `expected_by_actor` sigue **`NOT_VERIFIED`** en las 165 filas: se acredita que la lectura responde
  **200** con datos reales, **no** que el conjunto visible sea el correcto para cada actor.
- Los conteos por rol son **observación**, no veredicto de seguridad sobre los permisos de backend.
- Un valor alternativo por eje en el personalizador; no todo el catálogo del Design System.
- Los errores de selector y de espera fueron **del harness** y se corrigieron: no se infiere defecto
  de producto a partir de ellos.
- Se trabajó sobre la copia de trabajo existente: **no** hay commit limpio de base ni cambio de rama.
- **Backend sin tocar**: sin cambios de código, schema ni credenciales; sin acceso a producción;
  **sin commit ni push**.
- El estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`** y las specs siguen **`in-progress`**.

### Trazabilidad

| Documento | Ruta |
|---|---|
| Barrido de rutas | [`family-route-sweep-orchestrator.json`](./family-route-sweep-orchestrator.json) |
| Personalizador de 8 ejes | [`appearance-eight-axes-results.json`](./appearance-eight-axes-results.json) |
| Correcciones y responsive | [`frontend-fixes-verification.json`](./frontend-fixes-verification.json) · [`armory-responsive-results.json`](./armory-responsive-results.json) |
| Escrituras acotadas | [`organization-write-limited-results.json`](./organization-write-limited-results.json) · [`weapon-write-limited-results.json`](./weapon-write-limited-results.json) |
| Prerrequisitos | [`prerequisite-checks.json`](./prerequisite-checks.json) |
| Celdas y conteos | [`acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json) · bloques `observations.session_2026_10_13` y `observations.family_route_sweep_2026_10_13` |
| Estado consolidado | [`estado-integral-2026-10-12.md`](../../estado-integral-2026-10-12.md) §7 |