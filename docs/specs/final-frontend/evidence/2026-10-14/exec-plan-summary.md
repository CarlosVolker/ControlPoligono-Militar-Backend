# Ejecución del plan maestro `completion-plan-2026-10-14` — resumen de evidencia

> 🕯️ **Qué es.** Registro breve de lo que la corrida del **2026-10-14** produjo al ejecutar el plan
> maestro [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md) aprobado por el
> operador. Es un **resumen**, no la fuente primaria: las fuentes son los cuatro JSON copiados en
> este directorio, con su manifiesto en
> [`sources-manifest.json`](./sources-manifest.json) (`second_batch_exec_plan`).
>
> **No promueve ninguna celda de la matriz de aceptación.** Los conteos siguen **198 `OBSERVED_OK` /
> 19 `PARTIAL` / 1103 `NOT_EXERCISED`** sobre 1320 celdas, y `expected_by_actor` sigue
> **`NOT_VERIFIED`** en las 1320.
>
> 📜 **Actualización (misma fecha, tanda posterior).** La corrida de **acreditación del alias A1**
> (§5 quinquies) **sí promueve 8 celdas** de A1 y deja los conteos en **206 `OBSERVED_OK` /
> 19 `PARTIAL` / 1095 `NOT_EXERCISED`** sobre 1320. Las viñetas de las tandas anteriores describen
> su propio corte y se conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, segunda tanda posterior).** La corrida de **acreditación del alias
> A2** (§5 sexies) **promueve 44 celdas** de A2 —**43** a `OBSERVED_OK` y **1** (`OP-POS-006`) a
> `PARTIAL`— y deja los conteos en **249 `OBSERVED_OK` / 20 `PARTIAL` / 1051 `NOT_EXERCISED`** sobre
> 1320. Las viñetas de las tandas anteriores describen su propio corte y se conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, tercera tanda posterior).** La corrida de **acreditación del alias
> A3** (§5 septies) **promueve 33 celdas** de A3 —**28** a `OBSERVED_OK` y **5** a `PARTIAL` por
> denegación real de backend observada— y deja los conteos en **277 `OBSERVED_OK` / 25 `PARTIAL` /
> 1018 `NOT_EXERCISED`** sobre 1320. Las viñetas de las tandas anteriores describen su propio corte y se
> conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, cuarta tanda posterior).** La corrida de **acreditación del alias
> A4** (§5 octies) **promueve 9 celdas** de A4 —**6** a `OBSERVED_OK` y **3** a `PARTIAL` por denegación
> real de backend observada— y deja los conteos en **283 `OBSERVED_OK` / 28 `PARTIAL` / 1009
> `NOT_EXERCISED`** sobre 1320. Las viñetas de las tandas anteriores describen su propio corte y se
> conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, limpieza del residuo de A3).** La corrida de **limpieza del residuo de
> A3** (§5 nonies), con el alias **A1 acreditado**, dio de baja por UI los tres registros descartables que
> A3 no pudo borrar —arma **14**, ejercicio **15** y usuario temporal **40**— y cerró el barrido de
> residuo propio en **0**. **No** promueve celdas: los conteos siguen **283 / 28 / 1009** sobre 1320.
>
> 📜 **Actualización (misma fecha, quinta tanda posterior).** La corrida de **acreditación del alias A5**
> (§5 decies) **promueve 21 celdas** de A5 —**18** a `OBSERVED_OK` y **3** a `PARTIAL` por denegación real
> de backend observada— y deja los conteos en **301 `OBSERVED_OK` / 31 `PARTIAL` / 988 `NOT_EXERCISED`**
> sobre 1320. Las viñetas de las tandas anteriores describen su propio corte y se conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, sexta tanda posterior).** La corrida de **acreditación del alias A6**
> (§5 undecies) **promueve 12 celdas** de A6 —**10** a `OBSERVED_OK` y **2** a `PARTIAL` por denegación real
> de backend observada— y deja los conteos en **311 `OBSERVED_OK` / 33 `PARTIAL` / 976 `NOT_EXERCISED`**
> sobre 1320. Las viñetas de las tandas anteriores describen su propio corte y se conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, limpieza del residuo de A5 y A6).** La corrida de **limpieza del residuo
> de A5 y A6** (§5 duodecies), con el alias **A1 acreditado**, dio de baja por UI los tres registros
> descartables que A5 no pudo borrar —arma **15**, ejercicio **16** y usuario temporal **41**— y cerró el
> barrido por marcadores **A5CF** y **A6CF** en **0** propios. **No** promueve celdas: los conteos siguen
> **311 / 33 / 976** sobre 1320.
>
> 📜 **Actualización (misma fecha, séptima tanda posterior).** La corrida de **acreditación del alias A7**
> (§5 terdecies) **promueve 14 celdas** de A7 —**11** a `OBSERVED_OK` y **3** a `PARTIAL` por denegación real
> de backend observada— y deja los conteos en **322 `OBSERVED_OK` / 36 `PARTIAL` / 962 `NOT_EXERCISED`**
> sobre 1320. Las viñetas de las tandas anteriores describen su propio corte y se conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, limpieza del residuo de A7).** La corrida de **limpieza del residuo
> de A7** (§5 quaterdecies), con el alias **A1 acreditado**, dio de baja por UI el ejercicio **17** y cerró
> el barrido por marcador **A7CF** en **0** propios. **No** promueve celdas: los conteos siguen
> **322 / 36 / 962** sobre 1320.
>
> 📜 **Actualización (misma fecha, octava tanda posterior).** La corrida de **acreditación del alias A8**
> (§5 quindecies) **promueve 10 celdas** de A8 —**8** a `OBSERVED_OK` y **2** a `PARTIAL` por denegación real
> de backend observada— y deja los conteos en **330 `OBSERVED_OK` / 38 `PARTIAL` / 952 `NOT_EXERCISED`**
> sobre 1320. Las viñetas de las tandas anteriores describen su propio corte y se conservan sin reescribir.
>
> 📜 **Actualización (misma fecha, limpieza del residuo de A8).** La corrida de **limpieza del residuo de A8**
> (§5 sexdecies), con el alias **A1 acreditado**, no halló residuo: A8 no pudo crear nada —el rol más
> restringido no ofreció altas— y el barrido por marcador **A8CF** en **8** familias dio **0** propios. **No**
> promueve celdas: los conteos siguen **330 / 38 / 952** sobre 1320.
>
> 📜 **Cierre de campaña (misma fecha).** Con las **ocho** tandas de acreditación por actor del **2026-10-14**
> —**A1 a A8**— y sus limpiezas, el corte vigente queda en **330 `OBSERVED_OK` / 38 `PARTIAL` / 952
> `NOT_EXERCISED`** sobre 1320 (§5 septendecies). **No** hay cierre de aceptación integral: `expected_by_actor`
> sigue **`NOT_VERIFIED`** en las 1320 y el estado global sigue **`NOT_VERIFIED` / `NO_CUMPLIDO`**.

---

## 1. Alcance de la corrida

| Elemento | Contenido |
|---|---|
| Plan ejecutado | [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md), `status: in-progress` |
| Autorización | El operador aprobó el plan y emitió la orden de ejecución en la misma frase explícita |
| Trabajo de código | Acotado: identidad (reconciliación de contexto), modal compartido (foco) y router (carga diferida) |
| Trabajo de auditoría | Mapa focalizado de capacidades y auditorías posteriores, acotadas |
| **No** ejecutado | Backend, base de datos, credenciales, dependencias, commits, reinicio de servidores, escrituras sintéticas |

> 📜 **Fuentes de la sección:** el plan y su tabla de tareas, en
> [`completion-plan-2026-10-14.md`](../../completion-plan-2026-10-14.md) §Tareas.

---

## 2. Tareas: qué se completó y qué queda pendiente

El detalle con el alcance concreto de cada tarea vive en la **tabla de tareas del plan**, columna
`Estado de ejecución`. Este resumen no la duplica: la conserva como única fuente.

| Hito | Resultado registrado | Fuente primaria |
|---|---|---|
| T0 — aprobación y orden de ejecución | Aprobada y emitida por el operador; gates previos revocados **no** se restauran | Plan §Notas y decisiones |
| T1 — mapa focalizado de capacidades | **En progreso**, acotado | Plan §Tareas |
| T2 y T9 — compartidos, calidad | Correcciones verificadas dentro de su alcance parcial | Ver §3 de este resumen |
| T3 a T8 — familias de producto | Implementaciones localizadas; **verificación pendiente**, no `done` | Plan §Tareas |
| T10 — performance | Medición inicial y corrección de entrada **acotadas** | Ver §4 |
| T11 — aceptación por flujos y actores | Parcial | Plan §Tareas |
| T12 — cierre | Pendiente | Plan §Tareas |

---

## 3. Correcciones verificadas

### 3.1 Identidad — reconciliación de contexto (severidad media)

| Aspecto | Contenido |
|---|---|
| Hallazgo | La vista de identidad no reconciliaba el contexto tras editar: asignaciones propias, posiciones y holders quedaban desalineados |
| Corrección | `front/src/views/identity/IdentityView.vue` y su prueba dirigida `identity-context-reconcile` |
| Verificación estática | Revisión de seguridad posterior: **resuelto** |
| Pruebas del ejecutor | 18 pruebas, salida 0; `typecheck` salida 0 |
| Recorrido del orquestador | 127 pruebas en 4 archivos, salida 0; `typecheck` salida 0. Corrida **anterior** a la corrección de foco del diálogo: **no** cubre los últimos cambios |
| **Límite** | La revocación de escrituras propias **no** está verificada en runtime: no hubo ejercicio de escrituras |

### 3.2 Modal compartido — foco del diálogo

| Aspecto | Contenido |
|---|---|
| Defecto | El primer `Shift+Tab` sacaba el foco fuera del diálogo: el contenedor `DIV` del diálogo tenía `tabindex="-1"` y no era ni primero ni último, de modo que la rama de interceptación no se activaba |
| Corrección | `activeElement === modal` en ambas ramas |
| Regresión | La prueba de regresión **falló antes** (salida 1) y **pasó después**: 9 pruebas dirigidas, salida 0; `typecheck` salida 0 |
| Runtime posterior | Foco inicial en el `DIV` del diálogo; tras `Shift+Tab` y tras `Tab`, foco en `BUTTON` **dentro**; `Escape` cerró; **cero** escrituras de negocio observadas |
| **Límite** | La paridad visual total **no** está aprobada por los auditores: `visualParity: NOT_VERIFIED` |

Fuente primaria: [`modal-focus-fix.json`](./modal-focus-fix.json).

### 3.3 Modal compartido — fidelidad al Design System (acotada)

Dos capas distintas, y no se mezclan:

| Capa | Origen | Contenido | Estado |
|---|---|---|---|
| **Literales CSS** del Design System | Fuente y código, **estáticos** | `padding` `16px 20px`; transición `200 ms`; `margin` `30px auto`; desplazamiento de entrada `translateY(-30px)`; sombra `0 14px 30px rgba(0,0,0,.45)` | Declarados, **no** observados en runtime |
| **Observación runtime** | Estilo calculado del diálogo abierto, en el estado **asentado** | `padding` `16px 20px`; duración `0,2 s`; `margin` `30px auto` resuelto; sombra equivalente; `transform` observado **`none`** | Coincide con los literales **en ese estado** |

> 🕯️ **Lo que no se midió.** El desplazamiento de entrada `translateY(-30px)` y la **trayectoria**
> de la transición **no** se observaron: en el estado asentado el `transform` calculado es `none`.
> Tampoco se midieron el movimiento reducido ni otros estados de viewport. La coincidencia es de
> estilos calculados **en el estado abierto asentado**, **no** de paridad visual total.

> 🕯️ **Límite declarado.** La coincidencia observada es de **estilos calculados** en el estado
> abierto asentado. **No** es paridad visual total: la trayectoria de la transición, el
> desplazamiento de entrada oculto, movimiento reducido y otros estados de viewport **no** se
> midieron, y la fidelidad completa al Design System **no** está acreditada.

Fuente primaria: [`modal-router-runtime.json`](./modal-router-runtime.json).

---

## 4. Performance — medición y corrección acotadas

### 4.1 Baseline de navegación

Dos recorridos completos de siete pasos en modo `DEV`, con caché caliente, sin *throttling* de CPU
ni de red y sin conjunto de datos representativo.

| Dato | Valor |
|---|---|
| Condiciones | `DEV`, API real por proxy existente, tema oscuro, viewport 1277×1285 |
| Sesión reutilizada | **Alias A1 NO acreditado**: el propio artefacto declara que no pudo confirmar la correspondencia |
| Compilación estática | **15 vistas**, **1 chunk**, **856 249 bytes** de entry |
| Proxy de tiempo hasta contenido útil | Observado por paso; **no** es primer pintado ni garantiza visibilidad geométrica de cada dato |

> 🕯️ **Límites declarados en la fuente.** No se midieron búsqueda, orden, ficha, pestañas,
> consumos, CPU de cliente ni Core Web Vitals; no se demostraron limpieza ni estabilidad de
> memoria. Es navegación de lectura limitada, **no** T10 completo.

Fuente primaria: [`performance-baseline.json`](./performance-baseline.json).

### 4.2 División de rutas por carga diferida — antes y después

Cambio acotado: `front/src/router/routes.ts` pasa a 15 cargadores perezosos **preservando nombres,
rutas y `meta`**. La condición de reproducibilidad quedó registrada: *lockfile*, configuración,
Node y pnpm idénticos, y SHA-256 del `routes.ts` normalizado idéntico antes y después.

| Métrica | Antes | Después | Δ |
|---|---:|---:|---:|
| Entry, bytes | 856 249 | 153 318 | **−82,1 %** |
| Entry + preloads, bytes | 856 249 | 254 167 | **−70,3 %** |
| Entry + preloads, gzip | 215 196 | 84 877 | **−60,6 %** |
| Total JS, bytes | 856 249 | 868 059 | +11 810 |
| Total JS, gzip | 215 196 | 238 003 | +22 807 |
| Chunks | 1 | 32 | +31 |

Comprobaciones: `build` antes y después con salida 0; `typecheck` salida 0; **146** pruebas en 6
archivos dirigidos con salida 0. El orquestador revisó ese cambio con **127** pruebas en 4 archivos
y salida 0 más `typecheck` con salida 0: esa corrida es **anterior** a la corrección de foco del
diálogo, de modo que **no** cubre los últimos cambios y **no** se afirma que los cubra. En esta
documentación **no** se ejecutaron pruebas ni compilaciones nuevas.

> 🕯️ **Advertencia conservada de la fuente.** El personalizador sigue en la entrada por un import
> estático en `App.vue`, fuera del alcance del cambio: se observó `INEFFECTIVE_DYNAMIC_IMPORT`.

> 🕯️ **Dos metodologías, dos cifras.** Los tamaños redondeados que muestra Vite (`217,14 kB` de
> entry antes, `46,16 kB` después) y los conteos gzip reproducibles con zlib nivel 6 **son
> métodos distintos y no se mezclan**. El total gzip **aumenta**; la mejora es de la entrada, no
> del total.

> 🕯️ **Límites declarados.** No se midieron Core Web Vitals, tiempos de contenido útil en red real
> ni rendimiento de campo. No hay resultado de performance final: **falta** conjunto de datos
> representativo y **falta** la medición final bajo condiciones comparables. El paquete de entrada
> del personalizador queda fuera del alcance.

Fuente primaria: [`router-splitting-results.json`](./router-splitting-results.json).

---

## 5. Recorrido runtime de rutas

Tres rutas recorridas con encabezado visible y `GET` **200** de dominio: *dashboard*,
*organización* y *almacén de armerías*. **Cero** errores de chunk, de consola y de página en el
periodo observado. Los collectors fueron **sólo observadores** y la ausencia de un conteo fuera de
ellos **no** se infiere.

> 🕯️ **Límite declarado.** El alias **A1 NO está verificado** y `actorCellsPromoted` es `false`:
> **no** se promueve ninguna fila. No se midió la carga en frío de chunks perezosos ni el
> comportamiento de la compilación de producción. La presión de teclado se midió por puntos de
> control registrados, no en cada posición intermedia de foco.

Fuente primaria: [`modal-router-runtime.json`](./modal-router-runtime.json).

---

## 5 bis. Lectura acotada de dos actores (A1 y A2)

Recorrido de **sólo lectura** para dos alias, con su provisión privada y login por interfaz real;
ninguna escritura de negocio. Se acreditó la correspondencia alias↔contexto para **A1**
(`super_admin`) y **A2** (`tenant_admin`), y se observaron `GET` **200** de organización, identidad
propia y catálogos, con `POST /api/logout/` **200** por interfaz en la travesía que terminó.

| Límite | Detalle |
|---|---|
| Expectativa por actor | Sigue **`NOT_VERIFIED`**: no se deriva veredicto de autorización desde el contexto de la sesión |
| Fuentes de permiso por rol/puesto | **No** ejercitadas: el enlace de overrides quedó disponible pero no abierto; `RolePermission` y `PositionPermission` sin lectura dedicada |
| Cobertura | Dos alias, sin barrido de las 165 operaciones y sin escrituras |
| Primera travesía | Agotó tiempo tras la lista de organización; sus contextos aislados se cerraron sin `logout` observado. No se infiere falta de cierre |

> 🕯️ **Límite declarado.** La ausencia de tabla en la lista de organización es una observación del
> DOM, **no** ausencia de datos ni denegación HTTP; no se convierte en `403`. La revisión de
> overrides y de las fuentes de permiso por rol y puesto permanece pendiente.

Fuente primaria: [`actors-a1-a2-readonly.json`](./actors-a1-a2-readonly.json).

---

## 5 ter. Verificaciones runtime read-only — superficies de producto (2026-10-14)

Tercera tanda de lectura del **2026-10-14**, ejecutada sin mutaciones de negocio y con sesiones
aisladas por interfaz real. Ninguna promueve filas: **el alias de actor queda `NOT_VERIFIED`** en las
cuatro, igual que `expected_by_actor` en las 1320 celdas. Los conteos de la matriz **no** cambian.

### 5 ter.1 C3 — previsualización de eliminación con migración (AC-4)

| Aspecto | Resultado |
|---|---|
| Contadores de destino | **8/8** renderizados desde la respuesta de previsualización; las etiquetas coinciden con `MIGRATION_COUNT_FIELDS` (`front/src/views/organization/OrganizationView.vue:105-117`) |
| Destino exigido | Control «Confirmar eliminación» **deshabilitado** sin destino y **habilitado** tras seleccionar un destino válido |
| Previsualización | `GET /api/organization-units/{id}/previsualizar-eliminacion/` → **200**; lectura de sólo consulta |
| Mutaciones | **0** de negocio y **0** `POST /eliminar-con-migracion/` (el `POST /api/auth/login/` se excluye del conteo) |
| Refresco sólo tras éxito | **NO ejercitado**: la eliminación no se ejecutó por diseño |

> 🕯️ **Límites.** Una sola unidad y un solo rol (`super_admin`); el alias y `expected_by_actor`
> siguen `NOT_VERIFIED`. Los valores de destino se redujeron a plantillas y **no** se retuvieron
> códigos ni nombres de unidad, ni tenant, cookies o credenciales.

Fuente primaria: [`organization-deletion-preview.json`](./organization-deletion-preview.json).

### 5 ter.2 C8 — apariencia: lectura del backend y no-localStorage

| Aspecto | Resultado |
|---|---|
| Lectura de apariencia | `GET /api/me/preferences/appearance/design-system/` **200** con las **ocho** claves `ds_*`, reflejadas eje por eje en los atributos `data-*` de `<html>` |
| Almacenamiento del navegador | **Cero** claves de apariencia/theme en `localStorage` y `sessionStorage`; sólo aparecen la caché de Iconify (`iconify*`) y la cookie `csrftoken` de sesión |
| Catálogos por eje | Conteos medidos en runtime: **accent 27 · bg 26 · font 9 · radius 3 · iconfam 7 · ambient 8 · ambcolor 7 · theme 2** |
| Fuente del catálogo | Coincide con la biblioteca externa del Design System (`assets/js/theme-customizer.js`) y con `front/src/types/appearance.ts`; el backend entrega valores vigentes, **no** la lista de opciones |
| Mutaciones | **0** PUT/PATCH/DELETE |
| Aislamiento entre cuentas | **Ya acreditado el 2026-10-13** (A7 → A8); **no** se repite aquí |

> 🕯️ **Límites.** Se usó la cuenta del rol `tirador`; **no** se atribuye alias A1..A8. No se midió
> paridad de render ni estados completos. El catálogo es estático del bundle y **no** se sirve por
> endpoint. No se afirma paridad visual total.

Fuente primaria: [`appearance-persistence-readonly.json`](./appearance-persistence-readonly.json).

### 5 ter.3 C5 — superficies de autorización

| Ruta | Superficie | Estado | Lectura |
|---|---|---|---|
| `/personas/roles` | roles | landed | 1 tabla, **8** filas; **4** categorías |
| `/personas/scopes` | scopes | landed | 1 tabla, **5** filas |
| `/personas/permisos?tab=catalogo` | catálogo de permisos | landed | 1 tabla, **41** filas |
| `/personas/permisos?tab=matriz-rol` | matriz de rol | landed | **131** insignias de regla, **8** cabeceras de fila |
| `/personas/permisos?tab=matriz-puesto` | matriz de puesto | landed | **42** filas |
| `/personas/permisos?tab=personas-unidad` | personas por unidad | landed | **sin consulta** enviada |
| `/personas/overrides` | overrides | fail-closed | contenedor neutral «Acceso denegado»; sin petición y sin `403` |

| Aspecto | Resultado |
|---|---|
| `GET` de superficie | **200** en roles, categorías de rol, scopes, permisos, permisos por rol y permisos por puesto |
| Overrides | Enlace de overrides disponible en atajos pero **no** abierto; `GET /api/authz/overrides/` **NO observado** |
| Actor | Rol **`tenant_admin`** ejercitado; **no** se usó el bypass `super_admin` |
| Mutaciones / denegaciones | **0** de negocio y **ningún** `403` observado |

> 🕯️ **Límites.** Disponibilidad de enlace **no** es lectura ejercitada, y ausencia de tabla **no**
> es denegación HTTP: se registran por separado. Los conteos son de filas y reglas renderizadas.
> `expected_by_actor` sigue `NOT_VERIFIED`.

Fuente primaria: [`authorization-surfaces-readonly.json`](./authorization-surfaces-readonly.json).

### 5 ter.4 C6 — superficies de tiro

| Aspecto | Resultado |
|---|---|
| Pestañas de la ficha de lección | **5** presentes (Fracciones, Tiradores, Resultados, Resumen, Reporte); por defecto «Fracciones» |
| `GET` con estado | Todos **200** salvo un único `GET` **500**: `/api/lecciones/1/resultados/` (pestaña «Resultados») |
| Control de captura | «Capturar resultado» **HABILITADO**, con elegibles reales **2/2** (tiradores y armas) desde `GET /api/fracciones/1/tiradores/` **200** |
| Rama sin elegibles | **NO ejercitada**: no había escenario de ausencia; **no** se inventa ese estado |
| Mutaciones | **0** de negocio (el `POST /api/auth/login/` se registra aparte) |

> 🕯️ **Límites.** El control se observó **sin** hacer clic: no se abrió modal ni se envió alta o
> edición. Los conteos son de filas; no se persisten personas, unidades ni identificadores. El alias
> **no** se promueve. El único `GET` no-`200` es un **error de backend**, no una denegación ni una
> ausencia: se registra como deuda en
> [`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §9.

Fuente primaria: [`shooting-surfaces-readonly.json`](./shooting-surfaces-readonly.json).

---

## 5 quater. T4 — alta formal de identidad y asignaciones (interacción con mutaciones)

Cuarta tanda del **2026-10-14** y, a diferencia de las tres anteriores, con **mutaciones de negocio
emitidas por la interfaz real** en sesión aislada. Ejercita el **alta formal** de cuenta
(`POST /api/usuarios/`), **distinta** del alta temporal, sus asignaciones y su baja trazable, sobre una
persona descartable con marcador de turno propio.

| Paso | Fuente UI | Método y ruta | Estado |
|---|---|---|---|
| Alta formal de cuenta | Diálogo «Alta formal» › Crear usuario | `POST /api/usuarios/` | **201** |
| Desactivar asignación principal | Ficha › Asignaciones › Desactivar | `POST /api/usuarios/{id}/desactivar-asignacion-principal/` | **200** |
| Agregar asignación secundaria | Ficha › Asignaciones › Agregar secundaria | `POST /api/usuarios/{id}/agregar-asignacion/` | **201** |
| Quitar asignación secundaria | Ficha › Asignaciones › Quitar | `POST /api/usuarios/{id}/quitar-asignacion/{assignment_id}/` | **200** |
| Baja de cuenta | Ficha › Dar de baja | `DELETE /api/usuarios/{id}/` | **204** |
| Limpieza de posiciones laterales ×3 | Unidad › posiciones | `DELETE /api/posiciones/{id}/` | **204** ×3 |
| Limpieza de la unidad descartable | Unidad › Eliminar unidad | `DELETE /api/organization-units/{id}/` | **204** |
| Verificación de detalle | Ficha | `GET /api/usuarios/{id}/` | **200 → 404** |

| Aspecto | Resultado |
|---|---|
| Rol del actor | Rol administrativo alto **existente** (`tenant_admin`); **no** se usó el bypass `super_admin` |
| Roles de la cuenta creada | **No privilegiados**, del catálogo: `oficial_observador` (principal) y `oficial_tiro` (secundaria); `privileged_role_assigned: false` |
| Credencial | **Ninguna** credencial leída, impresa, persistida ni usada; `credentials_printed_or_persisted: false` |
| Login de la cuenta creada | **No** intentado (`created_account_login_attempted: false`); la identidad y las asignaciones se verificaron **sólo** desde la respuesta de creación |
| Barrido de residuo propio | `GET` de unidades y usuarios propios con **0** filas de marcador remanentes |
| Mutaciones fuera de alcance | **0**; sólo el `POST /api/auth/login/` del arranque de sesión se registra aparte |

**NO ejercitado** (declarado, no inventado): cambio y reinicio de contraseña, desbloqueo de cuenta,
holders (asignar/quitar titular de puesto), la variante `PUT`/`PATCH` de la asignación principal y la
membership por su formulario propio (`POST /api/usuarios/` la crea en servidor, pero su formulario
dedicado no se abrió).

> 📜 **Fuente:** [`persons-formal-create-ui.json`](./persons-formal-create-ui.json). El `204`/`404`
> acredita el contrato HTTP observado, **no** el borrado físico en base. El residuo inferido —una fila
> `identity.Person` que la baja de cuenta no alcanza— se registra en
> [`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §10 como **inferencia estática, no
> verificada en runtime**.

> 🕯️ **Sin promoción.** El alias queda **`NOT_VERIFIED`** y `global_acceptance_certified: false`. Esta
> tanda **no** promueve ninguna celda ni fila de la matriz: los conteos siguen **198 / 19 / 1103** y
> `expected_by_actor` sigue `NOT_VERIFIED`.

---

## 5 quinquies. Acreditación del alias A1 — bordes de apariencia, organización y recintos (promueve 8 celdas)

Quinta tanda del **2026-10-14** y la **primera del día que promueve celdas**. Acredita el alias
**A1** por **correspondencia privada** y ejercita por **UI real**, sobre registros descartables
propios, sus bordes pendientes. A diferencia de las tandas anteriores, los conteos de la matriz
**cambian**.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`super_admin`** —primario sin scope, secundario `tirador` con scope—, correspondiente al registro privado de A1 (`runtime-family-sweep.cjs` mapea A1→`super_admin`); **sin** cookies fabricadas |
| Apariencia | `GET` **200** (ocho claves `ds_*`), `PUT` **200** al cambiar el eje `accent` con `GET` confirmatorio **200**, y `DELETE` **204** desde «Restablecer valores por defecto» con `GET` posterior **200** en los defaults; los cuatro ejes que derivaron se restauraron al estado previo |
| Eliminación con migración | `POST /api/organization-units/{id}/eliminar-con-migracion/` **200**; refresco **sólo tras** la respuesta del `POST` (cero previo); `GET` de ficha posterior **404**. **Cierra la mitad que faltaba de AC-4** |
| Recintos | `POST /api/recintos/` **201**, `PUT /api/recintos/{id}/` **200** y `DELETE /api/recintos/{id}/` **204** con `GET` de detalle posterior **404** |
| Limpieza | Barrido final: **0** unidades y **0** recintos propios. El `204`/`404` **no** acreditan borrado físico en base |
| Celdas promovidas | **8** de A1, todas `NOT_EXERCISED` → `OBSERVED_OK`: `OP-PRF-003/004/005`, `OP-UNT-007/008` y `OP-RCT-002/004/006` |
| **NO** promovidas | `OP-PRF-002` (contrato legacy de apariencia que la UI **no** ofrece; **0** requests) y `OP-RCT-003` (sólo el `404` posterior a la baja; ninguna lectura **200** de detalle por UI); ambas siguen `NOT_EXERCISED` |
| Conteos | **206 `OBSERVED_OK` / 19 `PARTIAL` / 1095 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** **No** verificada la migración con contadores **> 0** (los ocho contadores eran 0).
> El contrato legacy de apariencia **no** lo ofrece la UI. Una corrida intermedia falló por
> *actionability* y sus registros descartables quedaron limpiados. Sólo A1 y registros descartables
> propios; **sin** tocar RBAC, backend, base de datos, dependencias ni commits.

Fuente primaria: [`a1-borders-ui.json`](./a1-borders-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `fifth_batch_a1_borders_ui`; bloque
`observations.a1_borders_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 sexies. Acreditación del alias A2 — familias núcleo por UI (promueve 44 celdas)

Sexta tanda del **2026-10-14** y **segunda del día que promueve celdas**. Acredita el alias **A2** por
**correspondencia privada** y ejercita por **UI real**, sobre registros descartables propios, las
familias núcleo pendientes de A2: unidades, recintos, puestos, membresías, usuarios temporales, armas,
ejercicios, apariencia propia y superficies de autorización.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`tenant_admin`** —primario sin scope, secundario `tirador` con scope—, correspondiente al registro privado de A2 (`runtime-family-sweep.cjs` mapea A2→`tenant_admin`); **sin** cookies fabricadas |
| Familias ejercitadas | Unidades, recintos, puestos, membresías, usuarios temporales, armas y ejercicios: alta, detalle, `PUT`, `PATCH` y baja por UI; puestos además `asignar-holder` **201** y `GET .../historico/` **200** |
| Apariencia propia | `GET` **200**, `PUT` **200** y `DELETE` **204** (restablecer por defecto) |
| Autorización (lectura) | Detalle de rol **200**, detalle de scope **200**, detalle de permiso **200**, `GET /api/authz/role-permissions/` **200** y `GET /api/authz/position-permissions/` **200** |
| **Rechazo observado** | `DELETE /api/posiciones/{id}/` **500** (`ProtectedError` por `Assignment.position` `PROTECT`): **`PARTIAL`**, no `OBSERVED_OK`. Deuda registrada en [`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §11 |
| Celdas promovidas | **44** de A2: **43** `NOT_EXERCISED` → `OBSERVED_OK` y **1** (`OP-POS-006`) `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | Calibres como mutación para A2 (la UI **no** las ofrece por gating `super_admin`; el `GET` de lista ya estaba acreditado) y detalle de membresía (**no** existe ruta); sin cambios |
| Conteos | **249 `OBSERVED_OK` / 20 `PARTIAL` / 1051 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** `OP-POS-008` (`quitar-holder`) se observó **200** por el **fallback de API** del
> harness, no por clic de UI: la fila de holder no ofrecía botón «Quitar». El barrido final de residuo
> **incluyó marcadores de corridas previas**; el residuo propio quedó en **3** puestos descartables
> (`A2CF`, ids **48, 54 y 55**) indelebles por UI y por API. El `204`/`404` **no** acreditan borrado
> físico en base. Sólo A2 y registros descartables propios; **sin** tocar RBAC, backend, base de datos,
> dependencias ni commits.

Fuente primaria: [`a2-core-families-ui.json`](./a2-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `sixth_batch_a2_core_families_ui`; bloque
`observations.a2_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 septies. Acreditación del alias A3 — familias núcleo por UI (promueve 33 celdas)

Séptima tanda del **2026-10-14** y **tercera del día que promueve celdas**. Acredita el alias **A3** por
**correspondencia privada** y ejercita por **UI real**, sobre registros descartables propios, las familias
núcleo pendientes de A3: recintos, puestos, membresías, usuarios temporales, armas, ejercicios, apariencia
propia y superficies de autorización.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`admin_unidad`** —primario `admin_unidad` con scope, secundario `tirador` con scope—, correspondiente al registro privado de A3 (`runtime-family-sweep.cjs` mapea A3→`admin_unidad`; mismo archivo privado de credenciales de desarrollo usado por las tandas del día); **sin** cookies fabricadas |
| Familias ejercitadas | Recintos, puestos, membresías, usuarios temporales, armas y ejercicios: alta, detalle, `PUT`, `PATCH` y baja por UI; puestos además `GET .../historico/` **200**. El puesto descartable se creó **SIN** holder |
| Apariencia propia | `GET` **200**, `PUT` **200** (eje `accent`) y `DELETE` **204** (restablecer por defecto), con `GET` confirmatorio **200** |
| Autorización (lectura) | Detalle de rol **200**, detalle de scope **200**, detalle de permiso **200** |
| **Denegaciones observadas** | `POST /api/organization-units/` **403**, `DELETE /api/armas/{id}/` **403**, `DELETE /api/ejercicios/{id}/` **403**, `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403**: **`PARTIAL`**, no `OBSERVED_OK` — rechazo real de backend observado, **no** certificado como resultado esperado porque `expected_by_actor` sigue `NOT_VERIFIED` |
| Contraste con A2 | `DELETE /api/posiciones/{id}/` **204** sobre el puesto **sin** holder, frente al **500** (`ProtectedError`) que observó A2 en el mismo endpoint (deuda §11): confirma la guía del encargo |
| Celdas promovidas | **33** de A3: **28** `NOT_EXERCISED` → `OBSERVED_OK` y **5** `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | `OP-MEM-004`/`OP-MEM-005` (edición y baja de membresía **no** ofrecidas por la UI en esta corrida), mutación de calibres (**no** ofrecida) y `OP-POS-007`/`OP-POS-008` (holder **retenido a propósito**: asignar holder deja el puesto indeleble por la deuda §11) |
| Conteos | **277 `OBSERVED_OK` / 25 `PARTIAL` / 1018 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** El residuo de arma **14** y ejercicio **15** quedó **sin poder darse de baja por A3**
> (`403`); la limpieza con **otro actor** se completó después (§5 nonies) y **no** se repara por base. El
> usuario temporal creado por A3 **no** fue recuperable por A3 (`GET` **404**); su baja se ejecutó después
> con el alias A1 (§5 nonies). El `204`/`404` **no** acreditan borrado físico en base. `expected_by_actor`
> sigue **`NOT_VERIFIED`** en las 1320. Sólo A3 y registros descartables propios; **sin** tocar RBAC,
> backend, base de datos, dependencias ni commits.

Fuente primaria: [`a3-core-families-ui.json`](./a3-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `seventh_batch_a3_core_families_ui`; bloque
`observations.a3_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 octies. Acreditación del alias A4 — familias núcleo por UI (promueve 9 celdas)

Octava tanda del **2026-10-14** y **cuarta del día que promueve celdas**. Acredita el alias **A4** por
**correspondencia privada** y ejercita por **UI real**, sobre registros descartables propios, las familias
núcleo pendientes de A4: apariencia propia y superficies de autorización.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`comandante_unidad`** —primario `comandante_unidad` con scope, secundario `tirador` con scope—, correspondiente al registro privado de A4 (`runtime-family-sweep.cjs` mapea A4→`comandante_unidad`); **sin** cookies fabricadas |
| Apariencia propia | `GET` **200**, `PUT` **200** (eje `accent`) y `DELETE` **204** (restablecer por defecto), con `GET` confirmatorio **200** |
| Autorización (lectura) | Detalle de rol **200**, detalle de scope **200**, detalle de permiso **200** |
| **Denegaciones observadas** | `POST /api/armas/` **403**, `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403**: **`PARTIAL`**, no `OBSERVED_OK` — rechazo real de backend observado, **no** certificado como resultado esperado porque `expected_by_actor` sigue `NOT_VERIFIED` |
| Celdas promovidas | **9** de A4: **6** `NOT_EXERCISED` → `OBSERVED_OK` y **3** `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | Altas de unidades, recintos, puestos, membresías y usuarios temporales (**botones** ausentes del DOM), alta de ejercicio (**botón** presente pero **deshabilitado**), mutaciones y detalle de calibre (**no** ofrecidos) y holder (**no** ejercido por el gate); **no** se forzó la API en ninguna de esas ramas |
| Conteos | **283 `OBSERVED_OK` / 28 `PARTIAL` / 1009 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** Para A4 la UI **no** ofreció el alta de unidades, recintos, puestos, membresías ni
> usuarios temporales (botones ausentes del DOM) y el alta de ejercicio estaba **deshabilitada**; la UI
> **sí** ofrece «Registrar arma» y el backend respondió **403**. El `204`/`404` **no** acreditan borrado
> físico en base. `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320. Sólo A4 y registros
> descartables propios; **sin** tocar RBAC, backend, base de datos, dependencias ni commits.

Fuente primaria: [`a4-core-families-ui.json`](./a4-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `eighth_batch_a4_core_families_ui`; bloque
`observations.a4_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 nonies. Limpieza del residuo de A3 (no promueve celdas)

Novena tanda del **2026-10-14**: limpieza del residuo que dejó la corrida A3. Con el alias **A1
acreditado** por **correspondencia privada**, se dieron de baja por **UI real** los tres registros
descartables que A3 no pudo borrar.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`super_admin`**, correspondiente al registro privado de A1 (`runtime-family-sweep.cjs` mapea A1→`super_admin`); **sin** cookies fabricadas |
| Arma 14 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Ejercicio 15 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Usuario temporal 40 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Barrido final | Marcador **A3CF** en **7** familias (unidades, recintos, puestos, membresías, usuarios, armas, ejercicios): **0** coincidencias propias |
| Celdas promovidas | **Ninguna**: los conteos siguen **283 / 28 / 1009** sobre 1320 |
| **NO** afirmado | El `204`/`404` documentan ausencia en la respuesta del servidor; **no** acreditan borrado físico en base. **No** se reparó por base |

> 🕯️ **Límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320 y el estado global sigue
> **`NOT_VERIFIED` / `NO_CUMPLIDO`**. Sólo registros descartables de la corrida A3; **sin** tocar RBAC,
> backend, base de datos, dependencias ni commits.

Fuente primaria: [`a3-residue-cleanup.json`](./a3-residue-cleanup.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `ninth_batch_a3_residue_cleanup`; bloque
`observations.a3_residue_cleanup_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 decies. Acreditación del alias A5 — familias núcleo por UI (promueve 21 celdas)

Décima tanda del **2026-10-14** y **quinta del día que promueve celdas**. Acredita el alias **A5** por
**correspondencia privada** y ejercita por **UI real**, sobre registros descartables propios, las familias
núcleo pendientes de A5: unidades, puestos, usuarios temporales, armas, ejercicios, apariencia propia y
superficies de autorización.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`oficial_tiro`** —primario `oficial_tiro` con scope, secundario `tirador` con scope—, correspondiente al registro privado de A5 (`runtime-family-sweep.cjs` mapea A5→`oficial_tiro`); **sin** cookies fabricadas |
| Celdas ejercitadas | Detalle de unidad **200**, de puesto **200** e histórico **200**; usuario temporal `crear-temporal` **201**; armas alta **201**, detalle **200**, `PUT` **200** y `PATCH` **200**; ejercicios alta **201**, detalle **200**, `PUT` **200** y `PATCH` **200**; apariencia propia `GET` **200**, `PUT` **200** y `DELETE` **204**; detalle de rol **200**, de scope **200** y de permiso **200** |
| **Denegaciones observadas** | `DELETE /api/armas/{id}/` **403**, `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403**: **`PARTIAL`**, no `OBSERVED_OK` — rechazo real de backend observado, **no** certificado como resultado esperado porque `expected_by_actor` sigue `NOT_VERIFIED` |
| Celdas promovidas | **21** de A5: **18** `NOT_EXERCISED` → `OBSERVED_OK` y **3** `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | Altas/ediciones/bajas de unidades, recintos, puestos, membresías y calibres (no ofrecidas por la UI o botón deshabilitado) y holder (no ejercido por el gate); **no** se forzó la API |
| Conteos | **301 `OBSERVED_OK` / 31 `PARTIAL` / 988 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** El residuo propio que A5 no pudo dar de baja por la UI —arma **15**, ejercicio **16** y
> usuario temporal **41**— se limpió después con el alias A1 (§5 duodecies) y **no** se repara por base.
> El `204`/`404` **no** acreditan borrado físico en base. `expected_by_actor` sigue **`NOT_VERIFIED`** en
> las 1320. Sólo A5 y registros descartables propios; **sin** tocar RBAC, backend, base de datos,
> dependencias ni commits.

Fuente primaria: [`a5-core-families-ui.json`](./a5-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `tenth_batch_a5_core_families_ui`; bloque
`observations.a5_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 undecies. Acreditación del alias A6 — familias núcleo por UI (promueve 12 celdas)

Undécima tanda del **2026-10-14** y **sexta del día que promueve celdas**. Acredita el alias **A6** por
**correspondencia privada** y ejercita por **UI real**, sobre registros descartables propios, las familias
núcleo pendientes de A6. A6 es rol de lectura: el contexto reportó **4** permisos efectivos (`view_unit`,
`view_self`, `view_personnel_basic`, `view_exercises`).

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`oficial_observador`** —primario `oficial_observador` con scope, secundario `tirador` con scope—, correspondiente al registro privado de A6 (`runtime-family-sweep.cjs` mapea A6→`oficial_observador`); **sin** cookies fabricadas |
| Celdas ejercitadas | Detalle de unidad **200**, de puesto **200** e histórico **200**, de ejercicio **200**; apariencia propia `GET` **200**, `PUT` **200** y `DELETE` **204**; detalle de rol **200**, de scope **200** y de permiso **200** |
| **Denegaciones observadas** | `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403**: **`PARTIAL`**, no `OBSERVED_OK` — rechazo real de backend observado, **no** certificado como resultado esperado porque `expected_by_actor` sigue `NOT_VERIFIED` |
| **Denegación neutral de UI** | Recintos (`/organizacion/recintos`, sin `view_recinto`) y armas (`/almacen/armas`, sin `view_warehouse`) se resolvieron **fail-closed** en el cliente con contenedor neutral «Acceso denegado» **SIN request** de dominio: **NO** es un `403` de backend y **no** se convierte en denegación |
| Celdas promovidas | **12** de A6: **10** `NOT_EXERCISED` → `OBSERVED_OK` y **2** `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | Altas/ediciones/bajas de unidades, recintos, puestos, membresías, usuarios temporales, calibres, armas y ejercicios (no ofrecidas por la UI o botón deshabilitado) y holder (no ejercido por el gate); **no** se forzó la API |
| Conteos | **311 `OBSERVED_OK` / 33 `PARTIAL` / 976 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** El contenedor neutral de acceso denegado **no** emite request y **no** se cuenta como
> `403`; la ausencia de tabla en la lista de membresías es observación del DOM, no denegación.
> `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320. Sólo A6 y registros descartables propios;
> **sin** tocar RBAC, backend, base de datos, dependencias ni commits.

Fuente primaria: [`a6-core-families-ui.json`](./a6-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `eleventh_batch_a6_core_families_ui`; bloque
`observations.a6_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 duodecies. Limpieza del residuo de A5 y A6 (no promueve celdas)

Duodécima tanda del **2026-10-14**: limpieza del residuo que dejó la corrida A5. Con el alias **A1
acreditado** por **correspondencia privada**, se dieron de baja por **UI real** los tres registros
descartables que A5 no pudo borrar, y se cerró el barrido de residuo de A5 y A6.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`super_admin`**, correspondiente al registro privado de A1 (`runtime-family-sweep.cjs` mapea A1→`super_admin`); **sin** cookies fabricadas |
| Arma 15 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Ejercicio 16 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Usuario temporal 41 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Barrido final | Marcadores **A5CF** y **A6CF** en **7** familias (unidades, recintos, puestos, membresías, usuarios, armas, ejercicios): **0** coincidencias propias |
| Celdas promovidas | **Ninguna**: los conteos siguen **311 / 33 / 976** sobre 1320 |
| **NO** afirmado | El `204`/`404` documentan ausencia en la respuesta del servidor; **no** acreditan borrado físico en base. **No** se reparó por base |

> 🕯️ **Límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320 y el estado global sigue
> **`NOT_VERIFIED` / `NO_CUMPLIDO`**. Sólo registros descartables de la corrida A5; **sin** tocar RBAC,
> backend, base de datos, dependencias ni commits.

Fuente primaria: [`a5-a6-residue-cleanup.json`](./a5-a6-residue-cleanup.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `twelfth_batch_a5_a6_residue_cleanup`; bloque
`observations.a5_a6_residue_cleanup_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 terdecies. Acreditación del alias A7 — familias núcleo y almacén por UI (promueve 14 celdas)

Decimotercera tanda del **2026-10-14** y **séptima del día que promueve celdas**. Acredita el alias **A7** por
**correspondencia privada** y ejercita por **UI real**, sobre registros descartables propios, las familias
núcleo y de almacén pendientes de A7. A7 es rol de almacén: el contexto reportó **10** permisos efectivos
(`create_exercises`, `create_warehouse_records`, `delete_warehouse_records`, `update_exercises`,
`update_warehouse_records`, `view_exercises`, `view_personnel_basic`, `view_self`, `view_unit`, `view_warehouse`).

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`encargado_almacen`** —primario `encargado_almacen` con scope, secundario `tirador` con scope—, correspondiente al registro privado de A7 (`runtime-family-sweep.cjs` mapea A7→`encargado_almacen`); **sin** cookies fabricadas |
| Celdas ejercitadas | Detalle de puesto **200** e histórico **200**; armas alta **201**, detalle **200**, `PUT` **200**, `PATCH` **200** y baja **204**; ejercicios alta **201**; detalle de rol **200**, de scope **200** y de permiso **200** |
| **Denegaciones observadas** | `GET /api/authz/role-permissions/` **403**, `GET /api/authz/position-permissions/` **403** y `DELETE /api/ejercicios/{id}/` **403**: **`PARTIAL`**, no `OBSERVED_OK` — rechazo real de backend observado, **no** certificado como resultado esperado porque `expected_by_actor` sigue `NOT_VERIFIED` |
| **Hallazgo de asimetría** | A7 **puede crear y editar ejercicios** (`create_exercises`/`update_exercises`) pero **no borrarlos** (sin `delete_exercises`): la UI **no** ofrece la baja y la API responde **403**. Es asimetría de **permisos del rol**, **no** de gating de UI; anotado como caso observado en [`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §12, **sin** proponer arreglo ni decidir qué parte debe cambiar |
| **Denegación neutral de UI** | `/organizacion/recintos` se resolvió **fail-closed** en el cliente (contenedor neutral «Acceso denegado») **SIN request** por no incluir `view_recinto`: **NO** es un `403` de backend y **no** se convierte en denegación |
| Celdas promovidas | **14** de A7: **11** `NOT_EXERCISED` → `OBSERVED_OK` y **3** `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | Armerías (sus celdas de A7 ya estaban `OBSERVED_OK`; no se re-promueven), mutaciones de unidades, puestos (incluido holder), membresías, usuarios temporales y calibres (**no** ofrecidas por la UI); detalle de membresía y de calibre (**no** existen rutas); detalle, `PUT` y `PATCH` de ejercicio (**no** ejercitados) |
| Conteos | **322 `OBSERVED_OK` / 36 `PARTIAL` / 962 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** La ruta `/organizacion/recintos` quedó **fail-closed neutral** (sin request), no un `403`.
> El residuo propio que A7 no pudo dar de baja por la UI —ejercicio **17**— se limpió después con el alias A1
> (§5 quaterdecies) y **no** se repara por base. El `204`/`404` **no** acreditan borrado físico en base.
> `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320. Sólo A7 y registros descartables propios; **sin**
> tocar RBAC, backend, base de datos, dependencias ni commits.

Fuente primaria: [`a7-core-families-ui.json`](./a7-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `thirteenth_batch_a7_core_families_ui`; bloque
`observations.a7_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 quaterdecies. Limpieza del residuo de A7 (no promueve celdas)

Decimocuarta tanda del **2026-10-14**: limpieza del residuo que dejó la corrida A7. Con el alias **A1
acreditado** por **correspondencia privada**, se dio de baja por **UI real** el registro descartable que A7
no pudo borrar.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`super_admin`**, correspondiente al registro privado de A1 (`runtime-family-sweep.cjs` mapea A1→`super_admin`); **sin** cookies fabricadas |
| Ejercicio 17 | `GET` **200** → `DELETE` UI **204** → `GET` **404** |
| Barrido final | Marcador **A7CF** en **8** familias (unidades, recintos, puestos, membresías, usuarios, armas, armerías y ejercicios): **0** coincidencias propias |
| Celdas promovidas | **Ninguna**: los conteos siguen **322 / 36 / 962** sobre 1320 |
| **NO** afirmado | El `204`/`404` documentan ausencia en la respuesta del servidor; **no** acreditan borrado físico en base. **No** se reparó por base |

> 🕯️ **Límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320 y el estado global sigue
> **`NOT_VERIFIED` / `NO_CUMPLIDO`**. Sólo el registro descartable de la corrida A7; **sin** tocar RBAC,
> backend, base de datos, dependencias ni commits.

Fuente primaria: [`a7-residue-cleanup.json`](./a7-residue-cleanup.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `fourteenth_batch_a7_residue_cleanup`; bloque
`observations.a7_residue_cleanup_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 quindecies. Acreditación del alias A8 — familias núcleo por UI (promueve 10 celdas)

Decimoquinta tanda del **2026-10-14** y **octava del día que promueve celdas**. Acredita el alias **A8** por
**correspondencia privada** y ejercita por **UI real** las familias núcleo pendientes de A8. A8 es el rol
**más restringido** (`tirador`): el contexto reportó **4** permisos efectivos (`view_exercises`,
`view_personnel_basic`, `view_self`, `view_unit`) y **ninguna** alta.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`tirador`** —única asignación, primaria con scope—, correspondiente al registro privado de A8 (`runtime-family-sweep.cjs` mapea A8→`tirador`); **sin** cookies fabricadas |
| Celdas ejercitadas | Detalle de unidad **200**, detalle de puesto **200** e histórico de puesto **200**; apariencia propia: `PUT` **200** y reset `DELETE` **204**; detalle de rol **200**, de scope **200** y de permiso **200** |
| **Denegaciones observadas** | `GET /api/authz/role-permissions/` **403** y `GET /api/authz/position-permissions/` **403**: **`PARTIAL`**, no `OBSERVED_OK` — rechazo real de backend observado, **no** certificado como resultado esperado porque `expected_by_actor` sigue `NOT_VERIFIED` |
| **Denegación neutral de UI** | `/organizacion/recintos` y `/almacen/armas` se resolvieron **fail-closed** en el cliente (contenedor neutral «Acceso denegado») **SIN request** por no incluir `view_recinto` y `view_warehouse`: **NO** son un `403` de backend y **no** se convierten en denegación |
| Celdas promovidas | **10** de A8: **8** `NOT_EXERCISED` → `OBSERVED_OK` y **2** `NOT_EXERCISED` → `PARTIAL` |
| **NO** promovidas | Altas, ediciones y bajas de **todas** las familias (el rol no crea nada; **no** ofrecidas por la UI), el holder (**no** ofrecido), la mutación de calibres (**no** ofrecida) y las rutas de recintos y armas (**fail-closed neutral de UI, sin request**); detalle de membresía y de calibre (**no** existen rutas) |
| Conteos | **330 `OBSERVED_OK` / 38 `PARTIAL` / 952 `NOT_EXERCISED`** sobre 1320; `expected_by_actor` sigue `NOT_VERIFIED`; estado global **`NOT_VERIFIED` / `NO_CUMPLIDO`** |

> 🕯️ **Límites.** Para A8, `/organizacion/recintos` y `/almacen/armas` quedaron **fail-closed neutrales**
> (sin request), **no** `403`. A8 **no** creó registros descartables propios, de modo que no hubo residuo
> (ver §5 sexdecies). El `204` **no** acredita borrado físico en base. `expected_by_actor` sigue
> **`NOT_VERIFIED`** en las 1320. Sólo A8; **sin** tocar RBAC, backend, base de datos, dependencias ni commits.

Fuente primaria: [`a8-core-families-ui.json`](./a8-core-families-ui.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `fifteenth_batch_a8_core_families_ui`; bloque
`observations.a8_core_families_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 sexdecies. Limpieza del residuo de A8 (no promueve celdas)

Decimosexta tanda del **2026-10-14**: limpieza del residuo de la corrida A8. Con el alias **A1 acreditado**
por **correspondencia privada**, se cerró el barrido por marcador propio. A8 no pudo crear nada —el rol más
restringido no ofreció altas—, de modo que **no hubo residuo**.

| Aspecto | Resultado |
|---|---|
| Acreditación del alias | `POST /api/auth/login/` **200** por UI (aterriza en `/dashboard`) y `GET /api/auth/context/` **200** con rol activo **`super_admin`**, correspondiente al registro privado de A1 (`runtime-family-sweep.cjs` mapea A1→`super_admin`); **sin** cookies fabricadas |
| Residuo propio | **Ninguno**: A8 no ofreció altas y no creó registros descartables propios; no hubo baja que ejecutar |
| Barrido final | Marcador **A8CF** en **8** familias (unidades, recintos, puestos, membresías, usuarios, armas, armerías y ejercicios): **0** coincidencias propias |
| Intento previo | Un intento anterior de A8 se interrumpió por reinicio y **no** dejó artefacto; el barrido por prefijo **no** halló residuo atribuible y **no** se inventa atribución |
| Celdas promovidas | **Ninguna**: los conteos siguen **330 / 38 / 952** sobre 1320 |
| **NO** afirmado | El `204`/`404` documentan ausencia en la respuesta del servidor; **no** acreditan borrado físico en base. **No** se reparó por base |

> 🕯️ **Límites.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las 1320 y el estado global sigue
> **`NOT_VERIFIED` / `NO_CUMPLIDO`**. Sólo el barrido de la corrida A8; **sin** tocar RBAC, backend, base de
> datos, dependencias ni commits.

Fuente primaria: [`a8-residue-cleanup.json`](./a8-residue-cleanup.json), con su entrada en
[`sources-manifest.json`](./sources-manifest.json) → `sixteenth_batch_a8_residue_cleanup`; bloque
`observations.a8_residue_cleanup_2026_10_14` de
[`evidence/2026-10-12/acceptance-matrix.json`](../2026-10-12/acceptance-matrix.json).

---

## 5 septendecies. Cierre de la campaña de aceptación por actor del 2026-10-14

> 🕯️ **Qué cierra y qué no.** Este apartado **cierra la campaña documental** de acreditación por actor del
> **2026-10-14**, no la aceptación del producto. Se **resume** el resultado de las ocho tandas; **no**
> reescribe los snapshots históricos, que quedan como estaban.

**Actores acreditados por correspondencia privada, en su propia sesión.** Los **ocho** actores **A1 a A8**
quedaron **acreditados** por **correspondencia privada** —login por UI (`POST /api/auth/login/` **200**) y
`GET /api/auth/context/` **200** con el rol activo esperado— y ejercitaron la UI real en su propia sesión, sin
cookies fabricadas. La correspondencia se apoya en el mapeo privado `runtime-family-sweep.cjs` y en el archivo
privado de credenciales de desarrollo, el mismo usado por todas las tandas.

| Tanda | Actor | Rol | `OBSERVED_OK` | `PARTIAL` | Celdas movidas |
|---|---|---|---:|---:|---:|
| §5 quinquies | A1 | `super_admin` | 8 | 0 | 8 |
| §5 sexies | A2 | `tenant_admin` | 43 | 1 | 44 |
| §5 septies | A3 | `admin_unidad` | 28 | 5 | 33 |
| §5 octies | A4 | `comandante_unidad` | 6 | 3 | 9 |
| §5 decies | A5 | `oficial_tiro` | 18 | 3 | 21 |
| §5 undecies | A6 | `oficial_observador` | 10 | 2 | 12 |
| §5 terdecies | A7 | `encargado_almacen` | 11 | 3 | 14 |
| §5 quindecies | A8 | `tirador` | 8 | 2 | 10 |
| **Total campaña** | **A1–A8** | — | **132** | **19** | **151** |

Las limpiezas de residuo (§5 nonies, §5 duodecies, §5 quaterdecies y §5 sexdecies) **no** promueven celdas.
El corte de partida de la campaña era **198 `OBSERVED_OK` / 19 `PARTIAL` / 1103 `NOT_EXERCISED`**; el corte
vigente tras las ocho tandas es **330 `OBSERVED_OK` / 38 `PARTIAL` / 952 `NOT_EXERCISED`** sobre **1320**,
consistente con **+132** `OBSERVED_OK`, **+19** `PARTIAL` y **−151** `NOT_EXERCISED`. El recuento se hizo por
**recorrido** de las **165 × 8** celdas, no por agregación de conteos.

**Lo que queda fuera de la campaña y su causa.** La campaña acreditó por actor lo que la UI real ofrecía con
sesión legítima; lo demás queda **fuera**, con causa declarada:

| Causa | Contenido fuera de la campaña | Referencia |
|---|---|---|
| **Bloqueo de backend** | `POST /api/consumos-municion/` **500**; consumo de arma que requiere un consumo padre válido; resultados por **elegibilidad** (huevo-gallina) y por **desalineación de unidad**; `GET /api/lecciones/{id}/resultados/` **500**; **overrides** no reflejados en el contexto de UI | `docs/bugs/backend-debt.md` §1, §7, §7.1, §8, §9 |
| **Decisiones del operador** | Escrituras de **RBAC**: alta/edición/baja de **roles**, **permisos por rol** (`role-permissions`) y **permisos por puesto** (`position-permissions`). Cero escrituras RBAC en toda la campaña; las matrices de lectura se observaron como **`403` real** (`PARTIAL`) o como lectura permitida según actor | — |
| **Prerrequisitos de entorno** | **Segundo tenant** (aislamiento entre tenants); **correo** (recuperación de acceso); **credenciales heredadas** (cuentas con credencial preexistente) | — |

**Declaración de estado.** `expected_by_actor` sigue **`NOT_VERIFIED`** en las **1320** celdas: un `200`,
`201` o `204` acredita que la operación se aceptó, **no** que el conjunto de visibles sea el correcto para el
actor. El estado global sigue **`NOT_VERIFIED`** y la conclusión de producto **`NO_CUMPLIDO`**: **no hay
cierre de aceptación integral**. Quedan **vigentes sin arreglo** la deuda de puestos
([`docs/bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §11) y el desajuste UI/backend (§12, tres
casos).

---

## 6. Mapa focalizado de capacidades — cómo se leyó

El mapa de T1 produjo **falsos positivos** que se descartaron antes de implementar nada:

| Falso positivo | Resolución |
|---|---|
| Alta temporal y validadores del dashboard | Falso positivo; descartado |
| Relación de consumo de nivel 2 | Falso positivo; descartado |
| Lookup sin consumidor | Falso positivo; descartado |

Auditorías posteriores, **acotadas**, descartaron la idea de funcionalidad faltante: los *wrappers*
compartidos **sí** están consumidos. **No** se implementó ninguna funcionalidad a partir de esos
falsos positivos.

> 🕯️ **Límite declarado.** **No** se afirma que T1 esté cerrada ni agotada: sigue **en progreso**.
>
> Un hallazgo de seguridad de severidad **ALTA** se registra como **dependencia de seguridad de
> backend**: la **aceptación de un rol existente sin límites**, por la que un usuario operativo con
> permisos `create`/`update` de usuarios **podría** otorgarse a sí mismo `super_admin`. Es
> **inferencia de fuente estática** sobre `apipoligono/views.py:188-199` y `:269-393`, más
> `apps/authorization/permissions.py:111-117`: **no** hay reproducción ni verificación runtime, y
> **no** se afirma ningún rol de sólo lectura. Se reporta; **no** se corrige en cliente ni se propone
> arreglo de backend.

---

## 7. Lo que este resumen **no** afirma

- **No** hay cierre de aceptación integral: las tandas de **sólo lectura** descritas arriba **no** movieron
  la matriz y el estado global sigue **`NOT_VERIFIED`**; la tanda de §5 quinquies movió **8** celdas de A1 y **no**
  constituye cierre integral. La tanda de §5 sexies movió **44** celdas de A2 y **tampoco** constituye
  cierre integral. La tanda de §5 septies movió **33** celdas de A3 —**28** a `OBSERVED_OK` y **5** a
  `PARTIAL`— y **tampoco** constituye cierre integral. La tanda de §5 octies movió **9** celdas de A4
  —**6** a `OBSERVED_OK` y **3** a `PARTIAL`— y **tampoco** constituye cierre integral; la limpieza de
  §5 nonies **no** promueve celdas y sólo cierra el residuo de A3. La tanda de §5 decies movió **21**
  celdas de A5 —**18** a `OBSERVED_OK` y **3** a `PARTIAL`— y **tampoco** constituye cierre integral.
  La tanda de §5 undecies movió **12** celdas de A6 —**10** a `OBSERVED_OK` y **2** a `PARTIAL`— y
  **tampoco** constituye cierre integral; la limpieza de §5 duodecies **no** promueve celdas y sólo cierra
  el residuo de A5 y A6. La tanda de §5 terdecies movió **14** celdas de A7 —**11** a `OBSERVED_OK` y **3** a
  `PARTIAL`— y **tampoco** constituye cierre integral; la limpieza de §5 quaterdecies **no** promueve celdas y
  sólo cierra el residuo de A7. La tanda de §5 quindecies movió **10** celdas de A8 —**8** a `OBSERVED_OK` y
  **2** a `PARTIAL`— y **tampoco** constituye cierre integral; la limpieza de §5 sexdecies **no** promueve
  celdas y sólo cierra el barrido de A8. El apartado de §5 septendecies **cierra la campaña documental** de
  acreditación por actor del **2026-10-14**, **no** la aceptación integral.
- **No** se escribieron datos sintéticos de producto ni se sembraron registros para aparentar interfaz,
  y **no** se ejercitó el envío del formulario de edición existente; la verificación del modal se hizo
  sobre el editor de organización abierto **sin** envío. Las tandas **de sólo lectura** (segunda y
  tercera) no crearon cuentas; la **cuarta** (§5 quater, T4) **sí** creó **una** cuenta descartable con
  marcador de turno propio, la ejercitó y la borró con barrido de residuo propio en **0**. Ninguna de
  las dos cosas promueve celdas de la matriz.
- **No** hubo cambios de backend, de base de datos, de credenciales, de dependencias, de commits ni
  de reinicio de servidores.
- **No** se promovió ninguna fila por alias de rol **no verificado**: todas las promociones de este
  resumen (§5 quinquies a §5 quindecies) se hicieron con alias **acreditados** por correspondencia privada
  —A1, A2, A3, A4, A5, A6, A7 y A8—, y las limpiezas de §5 nonies, §5 duodecies, §5 quaterdecies y
  §5 sexdecies **no** promueven celdas.
- Los gates de auditoría revocados anteriormente **no** se restauran por esta corrida; se conserva
  su historia tal como está.

---

## 8. Trazabilidad

| Artefacto | Origen | SHA-256 |
|---|---|---|
| [`performance-baseline.json`](./performance-baseline.json) | `.cache/frontend-acceptance/2026-10-14/performance-baseline.json` | `e6507a5a0f0688e0aa75ccfa61b188fd13607f010bd976a5cd78c471e8b1f437` |
| [`router-splitting-results.json`](./router-splitting-results.json) | `.cache/frontend-acceptance/2026-10-14/router-splitting-results.json` | `e48c549afa636e3db78bf6a4dffbc99a818e346c7d8619d091386fb4e6019b89` |
| [`modal-router-runtime.json`](./modal-router-runtime.json) | `.cache/frontend-acceptance/2026-10-14/modal-router-runtime.json` | `1ab1737dcaba9898a3fe7da6f9782686d16aaffe668f8fdfe81af7cf232d76e5` |
| [`modal-focus-fix.json`](./modal-focus-fix.json) | `.cache/frontend-acceptance/2026-10-14/modal-focus-fix.json` | `7fe708db242e440ec98567889b96924412e27b3a7caecc8f4318e4f997ce9977` |
| [`actors-a1-a2-readonly.json`](./actors-a1-a2-readonly.json) | `.cache/frontend-acceptance/2026-10-14/actors-a1-a2-readonly.json` | `dcbac07f0555501f…` |
| [`organization-deletion-preview.json`](./organization-deletion-preview.json) | `.cache/frontend-acceptance/2026-10-14/organization-deletion-preview.json` | `50c63ef71188fcc7053a9f5941eed60b1af1324478e2e3acc7e2f1be437b5fa4` |
| [`appearance-persistence-readonly.json`](./appearance-persistence-readonly.json) | `.cache/frontend-acceptance/2026-10-14/appearance-persistence-readonly.json` | `b44565640610201cd8a0d6c099d9035468ea6eeb143e2edffe8a196ede21fdd7` |
| [`authorization-surfaces-readonly.json`](./authorization-surfaces-readonly.json) | `.cache/frontend-acceptance/2026-10-14/authorization-surfaces-readonly.json` | `642d09088daeb4490d00c8c954882d54ff9e8a6f5123bde9dfd1ae66b32f5953` |
| [`shooting-surfaces-readonly.json`](./shooting-surfaces-readonly.json) | `.cache/frontend-acceptance/2026-10-14/shooting-surfaces-readonly.json` | `1e9ab58926f997a03d73aaf8cba7ee5e0a086e74efc872cc4a625aa9632700bd` |
| [`a1-borders-ui.json`](./a1-borders-ui.json) | `.cache/frontend-acceptance/2026-10-14/a1-borders-ui.json` | `06651cf8054c9a7643ffbc528dfc17d53ece601227bc09789e2ad979c5b4f459` |
| [`a2-core-families-ui.json`](./a2-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a2-core-families-ui.json` | `766cea8255d2d64971d107954e4508478345012e0fc45fc637cf6015c2aaf5ea` |
| [`a3-core-families-ui.json`](./a3-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a3-core-families-ui.json` | `399710b6315f48aa5e165c075fbecf5ed5e83728b4c3d5150ce194af4c395317` |
| [`a4-core-families-ui.json`](./a4-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a4-core-families-ui.json` | `aa9997ea7dc28d92a3a4119cc77db19c1fe3701839d6cf5bd6eb030ca5f37d73` |
| [`a3-residue-cleanup.json`](./a3-residue-cleanup.json) | `.cache/frontend-acceptance/2026-10-14/a3-residue-cleanup.json` | `9e08ce4e3d8acb9b3c5b351d818069218f2da04704d7c45292f710cff8968094` |
| [`a5-core-families-ui.json`](./a5-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a5-core-families-ui.json` | `05522e41da02d82503043721418303f0d73b347d2be4131c43fe125d4af016b3` |
| [`a6-core-families-ui.json`](./a6-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a6-core-families-ui.json` | `f4f0494b9060df190fb4899ec3175c37c87f5da51a976083b3465f37aedb3f9e` |
| [`a5-a6-residue-cleanup.json`](./a5-a6-residue-cleanup.json) | `.cache/frontend-acceptance/2026-10-14/a5-a6-residue-cleanup.json` | `364787d00d27fa70365fbdecfc611e2b73db7b58b711b38ee9614bb1f247f84f` |
| [`a7-core-families-ui.json`](./a7-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a7-core-families-ui.json` | `7cbcaff8985a3efbcfde1a8a104260f5cb75a930ed9c5e86b7f7f418462521d7` |
| [`a7-residue-cleanup.json`](./a7-residue-cleanup.json) | `.cache/frontend-acceptance/2026-10-14/a7-residue-cleanup.json` | `94be3bb675bc5723bc038ae66d0bb26b7db4c256b4e0b2e16124141fd26a196c` |
| [`a8-core-families-ui.json`](./a8-core-families-ui.json) | `.cache/frontend-acceptance/2026-10-14/a8-core-families-ui.json` | `2dee3905350eec4792a6d0b2478f3db9ab1e60bb14ed437ad7d5a7175cf47455` |
| [`a8-residue-cleanup.json`](./a8-residue-cleanup.json) | `.cache/frontend-acceptance/2026-10-14/a8-residue-cleanup.json` | `14e3f3c72e9c5ce25f5124eea70a0e4e1a06451fd6f5325d1f05099e180a65eb` |

Las copias de la segunda tanda son **byte a byte idénticas** a su origen; los orígenes **no** se
modificaron. Las cuatro copias de la tercera tanda (§5 ter) también son **byte a byte idénticas** y se
verificaron con `cmp`; **ningún** origen se alteró. La copia de la **quinta tanda** (§5 quinquies)
es igualmente **byte a byte idéntica** y se verificó con `cmp` y `sha256`. La copia de la **sexta
tanda** (§5 sexies) también es **byte a byte idéntica** y se verificó con `cmp` y `sha256`. La copia de la
**séptima tanda** (§5 septies) es **byte a byte idéntica** y se verificó con `cmp` (exit 0) y `sha256`.
La copia de la **octava tanda** (§5 octies) y la de la **novena tanda** (§5 nonies) son **byte a byte
idénticas** y se verificaron con `cmp` (exit 0) y `sha256`. Las copias de la **décima tanda** (§5 decies),
de la **undécima tanda** (§5 undecies) y de la **duodécima tanda** (§5 duodecies) son **byte a byte
idénticas** y se verificaron con `cmp` (exit 0) y `sha256`. Las copias de la **decimotercera tanda**
(§5 terdecies) y de la **decimocuarta tanda** (§5 quaterdecies) son **byte a byte idénticas** y se
verificaron con `cmp` (exit 0) y `sha256`. Las copias de la **decimoquinta tanda** (§5 quindecies) y de la
**decimosexta tanda** (§5 sexdecies) son **byte a byte idénticas** y se verificaron con `cmp` (exit 0) y
`sha256`.
Manifiesto completo, con revisión previa y política de redacción, en
[`sources-manifest.json`](./sources-manifest.json) → `second_batch_exec_plan`,
`third_batch_readonly_surfaces`, `fifth_batch_a1_borders_ui`, `sixth_batch_a2_core_families_ui`,
`seventh_batch_a3_core_families_ui`, `eighth_batch_a4_core_families_ui`,
`ninth_batch_a3_residue_cleanup`, `tenth_batch_a5_core_families_ui`,
`eleventh_batch_a6_core_families_ui`, `twelfth_batch_a5_a6_residue_cleanup`,
`thirteenth_batch_a7_core_families_ui`, `fourteenth_batch_a7_residue_cleanup`,
`fifteenth_batch_a8_core_families_ui` y `sixteenth_batch_a8_residue_cleanup`.

Sin secretos, cookies, credenciales, datos personales ni nombres de personas.