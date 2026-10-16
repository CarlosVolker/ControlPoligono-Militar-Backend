---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Tiro: polígonos y lecciones (T-FL-SHT-001…012)

> 📖 Yo registro aquí las doce primeras tareas de tiro: polígonos y la lección con sus
> cinco lecturas. Regla común conservada del volumen de flujos: cada pestaña carga de
> forma independiente; un `403` de detalle es alcance insuficiente, nunca ausencia de
> registros (R-RUL-11). Pasos y shapes **no se copian**: cada tarea cita su ancla
> `FL-*`. La captura y las fracciones viven en
> [shooting-capture.md](shooting-capture.md). Índice y reglas:
> [../tasks.md](../tasks.md). Ninguna tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/tiro/poligonos[/:idPoligono]`, `/tiro/lecciones[/:idLeccion]`), T-CORE-UI (tabs,
  tablas, charts de resumen/reporte desde `charts.html` como referencia visual).
- **Archivos probables** (raíz `front/src/`): `api/shooting.ts`, `stores/shooting.ts`,
  `views/tiro/RangesView.vue`, `views/tiro/RangeDetailView.vue`,
  `views/tiro/LessonsView.vue`, `views/tiro/LessonDetailView.vue`,
  `components/shooting/*` (pestañas, editor). Todos con `<script setup lang="ts">`.
- **Convención de AC:** hogar canónico único por OP. **Reservas declaradas:** OP-LES-001
  (listado global de lecciones) y OP-LES-003 (lectura de la ficha) no tienen FL propio;
  sus hogares canónicos son T-FL-SHT-005 (la superficie del listado donde vive el alta)
  y T-FL-SHT-008 (la carga de la ficha que sus pestañas presuponen), respectivamente —
  asignación de pantalla conforme a [../experience/screens.md](../experience/screens.md)
  §Cobertura OP → SCREEN.
- **Riesgo B-01 (hipótesis estática, no runtime):** OP-LES-009 podría fallar por
  `primary_unit()` invocado fuera de su ámbito (`views.py:880` vía
  [../contracts/domain-shooting.md](../contracts/domain-shooting.md)); su tratamiento
  observable vive en T-FL-SHT-009.

---

## T-FL-SHT-001 — Consulta de polígonos

| Campo | Valor |
|---|---|
| Objetivo | Listado de polígonos del scope con identificador conservado para navegar a sus lecciones; alcance restringido de tirador rotulado como tal cuando el backend limite la colección. |
| Flujo | [FL-SHT-001](../experience/flows/shooting-lessons.md#fl-sht-001--consulta-de-polígonos) |
| OP (AC canónicos) | OP-RNG-001, OP-RNG-003 |
| SCREEN | [SCREEN-RANGES, SCREEN-RANGE-DETAIL](../experience/screens/shooting.md) — DS `tables-basic.html` + `ui-card.html` |
| Requisitos | R-DOM-SHT-001 (campos; navegación a lecciones); R-RUL-13 vía tomos citantes (rotulación de alcance restringido). |
| Precondiciones / dependencias | Bloque común. |
| Archivos probables | `views/tiro/RangesView.vue`, `views/tiro/RangeDetailView.vue`, `api/shooting.ts`. |
| Done when | La lista muestra sólo polígonos devueltos; la ficha permite entrar a sus lecciones; vacío=ST-03, denegación=ST-07. |

**Criterios.**

- **AC-OP-RNG-001:** array con `id_poligono`, tenant, unidad, `nombre, ciudad,
  carriles_maximos, distancia_maxima`; vacío ⇒ ST-03; `403` ⇒ ST-07; búsqueda/orden
  client-side.
- **AC-OP-RNG-003:** la ficha muestra el objeto devuelto y la acción a
  T-FL-SHT-004; `404` ⇒ F-04.

---

## T-FL-SHT-002 — Alta y edición de polígono

| Campo | Valor |
|---|---|
| Objetivo | Editor con `nombre`*, `ciudad`*, `carriles_maximos`*, `distancia_maxima`* y tenant/unidad sólo lectura (nunca enviados); errores del backend asociados al formulario. |
| Flujo | [FL-SHT-002](../experience/flows/shooting-lessons.md#fl-sht-002--alta-y-edición-de-polígono) |
| OP (AC canónicos) | OP-RNG-002, OP-RNG-004, OP-RNG-005 |
| SCREEN | [SCREEN-RANGES](../experience/screens/shooting.md#screen-ranges--polígonos) y ficha (editor compartido) |
| Requisitos | R-DOM-SHT-002 (campos; RO de tenant/unidad). |
| Precondiciones / dependencias | T-FL-SHT-001. |
| Archivos probables | `components/shooting/RangeFormModal.vue`. |
| Done when | El polígono creado/editado muestra los datos devueltos; listado y ficha se refrescan. |

**Criterios.**

- **AC-OP-RNG-002 / AC-OP-RNG-004 / AC-OP-RNG-005:** `201`/`200` ⇒ ST-06 y refresco;
  `400` ⇒ F-01 con ST-09; `403` ⇒ F-02; `404` (edición) ⇒ F-04; red ⇒ F-06; cancelar ⇒
  F-09.

---

## T-FL-SHT-003 — Eliminación de polígono (restringida)

| Campo | Valor |
|---|---|
| Objetivo | La UI **no muestra una acción destructiva como disponible por defecto**: el inventario declara que no hay mapa `range:delete` y la solicitud puede recibir `403` (inferencia estática, no prueba runtime). Si una solicitud llegara a emitirse y denegarse, la denegación se muestra literal sin ocultar el registro. |
| Flujo | [FL-SHT-003](../experience/flows/shooting-lessons.md#fl-sht-003--eliminación-de-polígono-restringida) |
| OP (AC canónicos) | OP-RNG-006 |
| SCREEN | [SCREEN-RANGE-DETAIL](../experience/screens/shooting.md#screen-range-detail--ficha-de-polígono) |
| Requisitos | R-DOM-SHT-003 (acción no disponible por defecto; denegación sin ocultar registro). |
| Precondiciones / dependencias | T-FL-SHT-001. |
| Archivos probables | `views/tiro/RangeDetailView.vue` (ausencia deliberada de acción). |
| Gates | Reservada: ningún botón destructivo se renderiza como disponible; su habilitación futura exigiría evidencia de contrato nueva (el mapa `range:delete` no existe hoy en `permissions.py:54-57` vía inventario §Límites). |
| Done when | El polígono sigue visible tras cualquier denegación; ningún borrado local ocurre; la ausencia de acción es deliberada y documentada en el código. |

**Criterios.**

- **AC-OP-RNG-006:** la acción destructiva no se ofrece como disponible; si una
  solicitud llega a emitirse, el `403` esperado ⇒ F-02 literal **sin ocultar el
  registro**; red ⇒ F-06.

---

## T-FL-SHT-004 — Lecciones del polígono

| Campo | Valor |
|---|---|
| Objetivo | Lectura anidada `GET /poligonos/{id}/lecciones/` que muestra exclusivamente el arreglo devuelto (mismo tenant del polígono) con selección hacia la ficha de lección. |
| Flujo | [FL-SHT-004](../experience/flows/shooting-lessons.md#fl-sht-004--lecciones-del-polígono) |
| OP (AC canónicos) | OP-RNG-007 |
| SCREEN | [SCREEN-RANGE-DETAIL](../experience/screens/shooting.md#screen-range-detail--ficha-de-polígono) — pestaña/sección de lecciones |
| Requisitos | R-DOM-SHT-004 (sólo el arreglo devuelto; selección). |
| Precondiciones / dependencias | T-FL-SHT-001 (ficha de polígono). |
| Archivos probables | `components/shooting/RangeLessonsPanel.vue`. |
| Done when | Las lecciones visibles son exactamente las devueltas; cada una navega a su ficha. |

**Criterios.**

- **AC-OP-RNG-007:** `LeccionTiroSerializer[]` ⇒ lista con selección; `403` ⇒ F-02;
  `404` ⇒ F-04; red ⇒ F-06/F-10; vacío ⇒ ST-03.

---

## T-FL-SHT-005 — Alta de lección

| Campo | Valor |
|---|---|
| Objetivo | Alta con requeridos del contrato (`id_poligono`, `fecha_tiro`, `cant_tiros_cereo`, `cant_tiros_leccion`, `distancia`), opcionales documentados, `tipo_tiro` limitado a `evaluacion|entrenamiento` y participantes por `unidades_participantes_codes_write`; sin participantes escritos, se muestra la unidad **efectiva** devuelta (el backend agrega la unidad inyectada), sin afirmar que no existen participantes. Cubre además el listado global (reserva OP-LES-001) con rotulación de alcance restringido para tirador puro. |
| Flujo | [FL-SHT-005](../experience/flows/shooting-lessons.md#fl-sht-005--alta-de-lección) |
| OP (AC canónicos) | OP-LES-002; **reserva:** OP-LES-001 |
| SCREEN | [SCREEN-LESSONS](../experience/screens/shooting.md#screen-lessons--lecciones) — DS `tables-basic.html` + `forms-flatpicker.html` (fecha) |
| Requisitos | R-DOM-SHT-006 (campos y selector de tipo limitado); R-DOM-SHT-007 (unidad efectiva devuelta; sin afirmación de ausencia); R-DOM-SHT-005 faceta de listado (rotulación de alcance restringido); R-RUL-05 vía flujo. |
| Precondiciones / dependencias | Selector de polígono desde T-FL-SHT-001 (API); selector de unidades participantes desde T-FL-ORG-006 (API). |
| Archivos probables | `views/tiro/LessonsView.vue`, `components/shooting/LessonFormModal.vue`. |
| Done when | La lección creada muestra `unidades_participantes_codes` con la unidad efectiva; el listado global muestra sólo lecciones visibles con su rotulación de alcance. |

**Criterios.**

- **AC-OP-LES-001 (reserva):** `GET /lecciones/` ⇒ filas con identificadores, polígono,
  fecha, conteos, distancia, tipo y unidades participantes; tirador puro limitado a
  participación o resultado propio ⇒ colección rotulada como alcance restringido
  (R-RUL-13), nunca como lista completa; vacío ⇒ ST-03; `403` ⇒ ST-07.
- **AC-OP-LES-002:** `201` ⇒ ST-06 y refresco del listado; `400` (incluido polígono
  fuera de tenant) ⇒ F-01 con ST-09; `403` ⇒ F-02; red ⇒ F-06 sin fila optimista;
  cancelar ⇒ F-09.

---

## T-FL-SHT-006 — Edición de lección

| Campo | Valor |
|---|---|
| Objetivo | Edición con los mismos campos del alta sobre la lección existente; `PUT`/`PATCH` comparten editor; la ficha y sus pestañas se refrescan al recargarlas. |
| Flujo | [FL-SHT-006](../experience/flows/shooting-lessons.md#fl-sht-006--edición-de-lección) |
| OP (AC canónicos) | OP-LES-004, OP-LES-005 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) |
| Requisitos | R-DOM-SHT-006 (mismos campos sobre la ficha). |
| Precondiciones / dependencias | T-FL-SHT-008 (ficha cargada). |
| Archivos probables | `components/shooting/LessonFormModal.vue` (prefill). |
| Done when | La ficha muestra la lección devuelta tras el envío. |

**Criterios.**

- **AC-OP-LES-004 / AC-OP-LES-005:** `200` ⇒ ST-06 y refresco de ficha/pestañas al
  recargarlas; `400` ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-SHT-007 — Eliminación de lección

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica lección y fecha; el error contractual por relaciones que impiden la operación se muestra literal; polígonos, fracciones y reportes relacionados se refrescan sólo tras éxito. |
| Flujo | [FL-SHT-007](../experience/flows/shooting-lessons.md#fl-sht-007--eliminación-de-lección) |
| OP (AC canónicos) | OP-LES-006 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) / [SCREEN-LESSONS](../experience/screens/shooting.md#screen-lessons--lecciones) |
| Requisitos | R-DOM-SHT-008 (confirmación; refresco sólo tras éxito; error contractual visible). |
| Precondiciones / dependencias | T-FL-SHT-005 (listado) o T-FL-SHT-008 (ficha). |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | La lección desaparece de las vistas sólo tras respuesta exitosa; un `400` por relaciones se muestra tal cual. |

**Criterios.**

- **AC-OP-LES-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco; `400` por relaciones ⇒
  F-01 literal; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-SHT-008 — Ficha de lección: fracciones y tiradores

| Campo | Valor |
|---|---|
| Objetivo | La pantalla central del dominio: ficha de 5 pestañas con carga independiente; esta tarea entrega la carga de la ficha (reserva OP-LES-003) y las pestañas de fracciones (sin mezclar resultados) y tiradores (vacío ≠ error por pestaña); si el usuario es tirador puro, la ficha rotula el alcance como restringido. Cubre además el fallo de una pestaña sin invalidar las demás. |
| Flujo | [FL-SHT-008](../experience/flows/shooting-lessons.md#fl-sht-008--ficha-fracciones-y-tiradores) |
| OP (AC canónicos) | OP-LES-007, OP-LES-008; **reserva:** OP-LES-003 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) — DS `ui-tabs.html` + `tables-basic.html` |
| Requisitos | R-DOM-SHT-009 (fracciones sin mezclar resultados; tiradores con vacío ≠ error); R-DOM-SHT-005 (rotulación de alcance); R-RUL-13 vía flujo. |
| Precondiciones / dependencias | T-FL-SHT-005 (listado/navegación); la gestión de fracciones dentro de la pestaña vive en [shooting-capture.md](shooting-capture.md) (T-FL-SHT-013/014); las otras tres pestañas en T-FL-SHT-009/010/011. |
| Archivos probables | `views/tiro/LessonDetailView.vue`, `components/shooting/FractionsTab.vue`, `components/shooting/ShootersTab.vue`. |
| Done when | Cada pestaña resuelve su propio estado (ST-02/03/04/07) sin contaminar a las demás; la navegación por param de ruta permite entrada directa. |

**Criterios.**

- **AC-OP-LES-003 (reserva):** `GET /lecciones/{id}/` carga la ficha con sus datos;
  `404` ⇒ F-04; `403` ⇒ ST-07; red ⇒ F-06/F-10.
- **AC-OP-LES-007:** `FraccionTiroSerializer[]` en la pestaña fracciones **sin mezclar
  resultados**; `403` ⇒ F-02; red ⇒ fallo por pestaña con reintento propio; vacío ⇒
  ST-03 por pestaña.
- **AC-OP-LES-008:** `UsuarioSerializer[]` (usuarios con resultado) en la pestaña
  tiradores; vacío ⇒ ST-03, **distinto** de ST-04 y ST-07.

---

## T-FL-SHT-009 — Resultados detallados de lección

| Campo | Valor |
|---|---|
| Objetivo | Pestaña de detalle por fila (identidad, unidad, arma, carril y tiros) gated por `can_read_detail`: un `403` informa «sin permiso de detalle» (ST-07) y ofrece las consultas agregadas disponibles, **sin sustituir detalle por resumen** (pantallas independientes); si la petición falla —incluido el riesgo B-01— se trata como error explícito ST-04, nunca como resumen. |
| Flujo | [FL-SHT-009](../experience/flows/shooting-lessons.md#fl-sht-009--resultados-detallados) |
| OP (AC canónicos) | OP-LES-009 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) — pestaña resultados |
| Requisitos | R-DOM-SHT-010 (`403` = alcance insuficiente con oferta de agregados; prohibida la sustitución); R-RUL-11 vía flujo; riesgo B-01 tratado como error explícito (requisitos §9 vía flujos; T-04 de `technical-design.md` citado por el volumen). |
| Precondiciones / dependencias | T-FL-SHT-008 (ficha); los agregados alternativos viven en T-FL-SHT-010/011. |
| Archivos probables | `components/shooting/ResultsTab.vue`. |
| Done when | Con permiso: tabla de detalle; sin permiso: ST-07 con el `detail` literal y enlaces a resumen/reporte; con fallo: ST-04 con reintento explícito. |

**Criterios.**

- **AC-OP-LES-009:** `200` ⇒ filas por identidad, unidad, arma, carril y tiros (el
  backend escribe en `AccessAudit`; no es conducta del cliente); `403 {detail}`
  (`Su alcance no permite ver resultados detallados.`) ⇒ ST-07 + oferta de agregados,
  **sin** pintar resumen en su lugar; red/`500` (incluido B-01) ⇒ ST-04 explícito con
  F-10; vacío **con permiso** ⇒ ST-03 («sin resultados»), distinto de ST-07.

---

## T-FL-SHT-010 — Resumen de lección

| Campo | Valor |
|---|---|
| Objetivo | Las cuatro cifras del resumen (`fracciones`, `tiradores_unicos`, `tiros_acertados_total`, `tiros_total`) rotuladas con lección y fecha, nunca como total institucional; la única métrica derivada es el porcentaje de acierto (un decimal, sólo si `total > 0`; con `total = 0` se muestra `—`, nunca `0`). |
| Flujo | [FL-SHT-010](../experience/flows/shooting-lessons.md#fl-sht-010--resumen) |
| OP (AC canónicos) | OP-LES-010 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) — pestaña resumen |
| Requisitos | R-DOM-SHT-011 (rótulo de lección y fecha; nunca total institucional); R-DAT-04 vía flujo; métrica derivada de `technical-design.md` §10 vía flujo. |
| Precondiciones / dependencias | T-FL-SHT-008. |
| Archivos probables | `components/shooting/SummaryTab.vue`. |
| Done when | Las cifras mostradas son exactamente las devueltas, con su rótulo; el porcentaje sigue la regla del total. |

**Criterios.**

- **AC-OP-LES-010:** `{id_leccion, fracciones, tiradores_unicos, tiros_acertados_total,
  tiros_total}` visible con rótulo; porcentaje = `acertados / total * 100` con un
  decimal sólo si `total > 0`, si no `—`; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06/F-10.

---

## T-FL-SHT-011 — Reporte de lección

| Campo | Valor |
|---|---|
| Objetivo | Reporte con `aggregate_only` como **indicador de la respuesta** (no rol ni permiso): `false` ⇒ exclusivamente los desgloses recibidos; `true` ⇒ se muestran `resumen`, `por_fraccion` y `por_unidad` y **no se solicitan ni representan** `por_tirador`, `por_arma` ni `por_arma_unidad`. |
| Flujo | [FL-SHT-011](../experience/flows/shooting-lessons.md#fl-sht-011--reporte) |
| OP (AC canónicos) | OP-LES-011 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) — pestaña reporte |
| Requisitos | R-DOM-SHT-012 (desgloses según `aggregate_only`); R-DAT-03 vía flujo (semántica exacta del indicador). |
| Precondiciones / dependencias | T-FL-SHT-008. |
| Archivos probables | `components/shooting/ReportTab.vue`. |
| Done when | Con `aggregate_only: true` ningún desglose personal/de arma aparece ni se pide; con `false` sólo lo recibido se pinta. |

**Criterios.**

- **AC-OP-LES-011:** `{leccion, resumen, por_fraccion, por_tirador, por_unidad, por_arma,
  por_arma_unidad, aggregate_only}` ⇒ representación condicionada al indicador; `403` ⇒
  F-02; `404` ⇒ F-04; red ⇒ F-06/F-10.

---

## T-FL-SHT-012 — Tiradores elegibles

| Campo | Valor |
|---|---|
| Objetivo | Selector de participantes desde `GET /lecciones/{id}/tiradores-elegibles/` (unidades participantes y descendientes): sólo usuarios retornados; el flujo **no** se convierte en alta de usuario — un tirador sin cuenta se registra por T-FL-IDT-004 (temporal). |
| Flujo | [FL-SHT-012](../experience/flows/shooting-lessons.md#fl-sht-012--tiradores-elegibles) |
| OP (AC canónicos) | OP-LES-012 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) — selector dentro del flujo permitido de participantes |
| Requisitos | R-DOM-SHT-013 (sólo retornados; sin convertirse en alta). |
| Precondiciones / dependencias | T-FL-SHT-008; enlace a T-FL-IDT-004 cuando falta un tirador. |
| Archivos probables | `components/shooting/EligibleShootersSelect.vue`. |
| Done when | El selector ofrece exactamente los usuarios devueltos; `results` vacío ⇒ ST-03 sin opciones inventadas. |

**Criterios.**

- **AC-OP-LES-012:** `{results: UsuarioSerializer[]}` ⇒ opciones reales; `403` ⇒ F-02;
  `404` ⇒ F-04; red ⇒ F-06; vacío ⇒ ST-03.

---

> 🕯️ Las tres lecturas restantes de la lección (gestión de fracciones, preparación de
> captura, resultados por fracción) continúan en
> [shooting-capture.md](shooting-capture.md) — T-FL-SHT-013…019.
