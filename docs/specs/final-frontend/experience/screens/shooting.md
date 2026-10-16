---
spec_meta: "../../spec-meta.yaml"
---

# Pantallas — Tiro: polígonos, lecciones, fracciones y resultados

> 📖 Tomo de catálogo del workstream `full-frontend-screens-recovery`. Contratos enlazados: [tiro, resultados y calibres](../../contracts/domain-shooting.md). Códigos de permiso transcritos del mapa verificado `apps/authorization/permissions.py:36–95`. Convenciones generales: [`../screens.md`](../screens.md).

## Índice

1. [SCREEN-RANGES](#screen-ranges--polígonos)
2. [SCREEN-RANGE-DETAIL](#screen-range-detail--ficha-de-polígono)
3. [SCREEN-LESSONS](#screen-lessons--lecciones)
4. [SCREEN-LESSON-DETAIL](#screen-lesson-detail--ficha-de-lección)
5. [SCREEN-FRACTION-DETAIL](#screen-fraction-detail--ficha-de-fracción)
6. [SCREEN-RESULTS-CAPTURE](#screen-results-capture--captura-de-resultados)

---

### SCREEN-RANGES — Polígonos

| Atributo | Valor |
|---|---|
| Propósito | Listar los polígonos de tiro del scope y dar de alta nuevos. |
| Ruta | `/tiro/poligonos` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Tiro › Polígonos. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html`/`forms-validation.html` (alta), estados estándar (`ui-spinners.html`, `ui-placeholders.html`, `ui-alerts.html`). |

**Datos y operaciones.** Contrato: [polígonos y lecciones](../../contracts/domain-shooting.md#polígonos-y-lecciones).

- `OP-RNG-001` `GET /poligonos/` — listado (tenant+unidad).
- `OP-RNG-002` `POST /poligonos/` — alta (modal).

**Acciones y formularios.** Alta: `nombre`, `ciudad`, `carriles_maximos`, `distancia_maxima` requeridos; tenant/unidad sólo lectura — nunca se envían (`R-DOM-SHT-002`, `R-RUL-01`); errores del backend asociados al formulario.

**Controles de acceso.** `range:read → view_unit`; `range:create → create_shooting_lessons` (mapa verificado).

**Estados y criterios observables.** Identificador conservado para navegar a lecciones (`R-DOM-SHT-001`); vacío ≠ error ≠ denegado; alcance restringido de tirador rotulado como tal cuando el backend limite la colección (`R-RUL-13`).

**Navegación.** Fila ⇒ SCREEN-RANGE-DETAIL. Deep link operativo.

---

### SCREEN-RANGE-DETAIL — Ficha de polígono

| Atributo | Valor |
|---|---|
| Propósito | Ver y editar un polígono y recorrer sus lecciones. |
| Ruta | `/tiro/poligonos/:idPoligono` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idPoligono`. Breadcrumb: Inicio › Tiro › Polígonos › {nombre}. |
| Fuente DS | `ui-card.html` (datos), `ui-tabs.html` o `ui-list-group.html` (lecciones del polígono), `ui-modal.html` (edición), estados estándar. |

**Datos y operaciones.**

- `OP-RNG-003` `GET /poligonos/{id}/` — carga.
- `OP-RNG-004` / `OP-RNG-005` `PUT`/`PATCH` — edición compartida (mismos campos del alta).
- `OP-RNG-007` `GET /poligonos/{id}/lecciones/` — lecciones del mismo tenant; se muestran exclusivamente las devueltas y son seleccionables (`R-DOM-SHT-004`).
- `OP-RNG-006` `DELETE /poligonos/{id}/` — **sin acción destructiva disponible por defecto**: el mapa verificado no declara `range:delete` (no existe el par en `permissions.py:36–95`) y el inventario confirma que la solicitud puede recibir `403` (`backend-inventory.md` §Límites). La UI no ofrece el botón como disponible; si una solicitud llega a denegarse, muestra la denegación sin ocultar el registro (`R-DOM-SHT-003`).

**Acciones y formularios.** Edición con prefill; confirmación en cambios que afecten lecciones sólo si el backend declara el efecto (no se promete cascada).

**Controles de acceso.** `range:read → view_unit`; `range:update → update_shooting_lessons`; delete sin mapa (arriba) (mapa verificado).

**Estados y criterios observables.** `id_poligono`, nombre, ciudad, `carriles_maximos`, `distancia_maxima`, tenant y unidad desde la respuesta (`R-DOM-SHT-001`); lecciones del polígono con carga independiente y estados propios.

**Navegación.** Atrás ⇒ SCREEN-RANGES. Lección ⇒ SCREEN-LESSON-DETAIL. Deep link operativo.

---

### SCREEN-LESSONS — Lecciones

| Atributo | Valor |
|---|---|
| Propósito | Listar las lecciones de tiro visibles y dar de alta nuevas. |
| Ruta | `/tiro/lecciones` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | Sin params. Breadcrumb: Inicio › Tiro › Lecciones. |
| Fuente DS | `tables-basic.html`, `ui-modal.html` + `forms-basic.html`/`forms-flatpicker.html` (fecha de tiro), `ui-badge.html` (`tipo_tiro`), estados estándar. |

**Datos y operaciones.** Contrato: [polígonos y lecciones](../../contracts/domain-shooting.md#polígonos-y-lecciones) (fila Lección).

- `OP-LES-001` `GET /lecciones/` — listado; visibilidad por tenant+unidad/M2M; tirador puro limitado a participación o resultado propio, rotulado como alcance restringido (`R-DOM-SHT-005`, `R-RUL-13`).
- `OP-LES-002` `POST /lecciones/` — alta (modal).

**Acciones y formularios.** Alta: `id_poligono`, `fecha_tiro`, `cant_tiros_cereo`, `cant_tiros_leccion`, `distancia` requeridos; opcionales documentados; `tipo_tiro` limitado a `evaluacion|entrenamiento`; participantes por `unidades_participantes_codes_write` (`R-DOM-SHT-006`). Si el alta omite participantes ⇒ mostrar la unidad efectiva devuelta tras éxito, sin afirmar que no existen participantes (`R-DOM-SHT-007`, `R-RUL-05`). Selector de polígono desde datos reales del contrato.

**Controles de acceso.** `shooting_session:read → view_unit`; `shooting_session:create → create_shooting_lessons` (mapa verificado).

**Estados y criterios observables.** Filas con identificadores, polígono, fecha, conteos, distancia, tipo y unidades participantes (`R-DOM-SHT-005`); éxito refresca listado.

**Navegación.** Fila ⇒ SCREEN-LESSON-DETAIL. Enlace a polígono ⇒ SCREEN-RANGE-DETAIL. Deep link operativo.

---

### SCREEN-LESSON-DETAIL — Ficha de lección

| Atributo | Valor |
|---|---|
| Propósito | Recorrer una lección por sus cinco pestañas —fracciones, tiradores, resultados, resumen y reporte— y administrar fracciones y edición de la lección. Es la pantalla central del dominio de tiro. |
| Ruta | `/tiro/lecciones/:idLeccion` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idLeccion`. Breadcrumb: Inicio › Tiro › Lecciones › {fecha o id}. |
| Fuente DS | `ui-tabs.html` (5 pestañas con carga independiente), `tables-basic.html` (filas de cada pestaña), `charts.html` (resumen y reporte), `ui-card.html`, `ui-modal.html` (edición de lección, alta/edición/baja de fracción, participantes), `ui-alerts.html` (403 de detalle), `ui-progress.html` sólo si el dato existe. |

**Datos y operaciones.** Contratos: [polígonos y lecciones](../../contracts/domain-shooting.md#polígonos-y-lecciones), [lecturas de lección](../../contracts/domain-shooting.md#lecturas-de-lección), [fracciones y resultados](../../contracts/domain-shooting.md#fracciones-y-resultados).

- `OP-LES-003` `GET /lecciones/{id}/` — carga de la ficha.
- `OP-LES-004` / `OP-LES-005` `PUT`/`PATCH` — edición compartida (mismos campos del alta).
- `OP-LES-006` `DELETE /lecciones/{id}/` — eliminación: confirmación destructiva; refresco de polígonos, fracciones y reportes sólo tras éxito; error contractual visible si las relaciones impiden la operación (`R-DOM-SHT-008`).
- Pestaña fracciones: `OP-LES-007` `GET /lecciones/{id}/fracciones/` — datos sin mezclar resultados (`R-DOM-SHT-009`). Gestión de fracciones integrada en esta pestaña (integración justificada: el recurso fracción se administra en el contexto de su lección):
  - `OP-FRC-001` `GET /fracciones/` — soporte de resolución/contexto cuando el flujo lo requiera; la colección visible de la pestaña proviene de `OP-LES-007`.
  - `OP-FRC-002` `POST /fracciones/` — alta: `id_leccion` (la lección actual), `tiradores_totales`, `numero_fraccion`; duplicidad lección+número ⇒ error en `numero_fraccion` (`R-DOM-SHT-014`).
  - `OP-FRC-004` / `OP-FRC-005` `PUT`/`PATCH` — edición compartida.
  - `OP-FRC-006` `DELETE /fracciones/{id}/` — confirmación y refresco de la lección; sin eliminar resultados locales antes de respuesta exitosa (`R-DOM-SHT-015`).
- Pestaña tiradores: `OP-LES-008` `GET /lecciones/{id}/usuarios/` — usuarios con resultado; vacío ≠ error (`R-DOM-SHT-009`).
- Pestaña resultados: `OP-LES-009` `GET /lecciones/{id}/resultados/` — filas con identidad, unidad, arma, carril y tiros; `403` ⇒ «sin permiso de detalle» y oferta de las consultas agregadas disponibles, **sin sustituir detalle por resumen** (`R-DOM-SHT-010`, `R-RUL-11`). Hipótesis estática B-01 (`primary_unit()` fuera de ámbito): un fallo de esta pestaña se trata como error explícito (`requirements.md` §9, T-04).
- Pestaña resumen: `OP-LES-010` `GET /lecciones/{id}/resultados-resumen/` — `fracciones`, `tiradores_unicos`, tiros acertados y total, rotulados con lección y fecha, nunca como total institucional (`R-DOM-SHT-011`, `R-DAT-04`).
- Pestaña reporte: `OP-LES-011` `GET /lecciones/{id}/reporte/` — `leccion`, `resumen`, `por_fraccion`, `por_unidad` siempre; `aggregate_only: true` ⇒ no solicitar ni representar `por_tirador`, `por_arma`, `por_arma_unidad`; `false` ⇒ mostrar exclusivamente los desgloses recibidos (`R-DOM-SHT-012`, `R-DAT-03`). El porcentaje de acierto es la única métrica derivada: `acertados/total*100`, un decimal, `—` si `total = 0` (`technical-design.md` §10).
- Participantes: `OP-LES-012` `GET /lecciones/{id}/tiradores-elegibles/` — usuarios de unidades participantes y descendientes; sólo presentación/selección dentro del flujo permitido, sin convertirlo en alta de usuario (`R-DOM-SHT-013`).

**Acciones y formularios.** Cada pestaña carga de forma independiente al abrirse (sin precarga masiva); los modales de fracción envían FK directas según contrato (`R-RUL-02`: `FraccionTiro.id_leccion` es FK directa).

**Controles de acceso.** `shooting_session:read → view_unit`; `read_summary → view_unit`; `update → update_shooting_lessons`; `delete → delete_shooting_lessons`; `shooting_fraction:create → create_shooting_lessons`, `read → view_unit`, `update → update_shooting_lessons`, `delete → delete_shooting_lessons` (mapa verificado). Detalle de resultados adicionalmente gated por `can_read_detail` (contrato).

**Estados y criterios observables.** Cinco pestañas con estados propios; `403` de detalle diferenciado de «sin resultados» (`R-RUL-11`); alcance restringido de tirador rotulado (`R-RUL-13`); metrics sólo desde respuesta del backend (`R-DAT-02`).

**Navegación.** Atrás ⇒ SCREEN-LESSONS o SCREEN-RANGE-DETAIL (origen). Fracción ⇒ SCREEN-FRACTION-DETAIL; captura ⇒ SCREEN-RESULTS-CAPTURE; polígono ⇒ SCREEN-RANGE-DETAIL; tirador ⇒ SCREEN-USER-DETAIL (si el permiso lo permite); arma ⇒ SCREEN-WEAPON-DETAIL. Deep link a `/tiro/lecciones/{id}` reconstruye contexto y abre la pestaña por defecto (ficha); la pestaña activa es estado de presentación.

---

### SCREEN-FRACTION-DETAIL — Ficha de fracción

| Atributo | Valor |
|---|---|
| Propósito | Ver una fracción en el contexto de su lección, con sus tiradores, armas y resultados detallados cuando el alcance lo permita. |
| Ruta | `/tiro/lecciones/:idLeccion/fracciones/:idFraccion` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idLeccion`, `idFraccion`. Breadcrumb: Inicio › Tiro › Lecciones › {lección} › Fracción {numero_fraccion}. |
| Fuente DS | `ui-card.html` (datos de la fracción), `tables-basic.html` (tiradores/armas/resultados), `ui-alerts.html` (`403` de detalle), `ui-modal.html` (edición/baja), `ui-buttons.html` (ir a captura). |

**Datos y operaciones.** Contrato: [fracciones y resultados](../../contracts/domain-shooting.md#fracciones-y-resultados).

- `OP-FRC-003` `GET /fracciones/{id}/` — carga.
- `OP-FRC-007` `GET /fracciones/{id}/tiradores/` — `{usuarios, armas}` reales de la fracción.
- `OP-FRC-008` `GET /fracciones/{id}/resultados/` — pares resultado/usuario/arma; `403` mantiene captura y detalle separados con indicación de falta de autorización para ver detalle (`R-DOM-SHT-019`, gated por `can_read_detail`).
- `OP-FRC-004` / `OP-FRC-005` — edición (mismo editor de la pestaña de fracciones).
- `OP-FRC-006` — baja con confirmación; refresco de la lección tras éxito.

**Acciones y formularios.** Edición/baja según contrato; acción principal «Capturar resultados» ⇒ SCREEN-RESULTS-CAPTURE.

**Controles de acceso.** `shooting_fraction:read → view_unit`; `update → update_shooting_lessons`; `delete → delete_shooting_lessons` (mapa verificado); `OP-FRC-008` además `can_read_detail` (contrato).

**Estados y criterios observables.** `id_fraccion`, tenant, unidad y campos del contrato; `403` de detalle ≠ vacío; éxito de baja devuelve a la lección.

**Navegación.** Atrás ⇒ pestaña fracciones de SCREEN-LESSON-DETAIL. Enlaces: lección ⇒ ficha; tirador ⇒ SCREEN-USER-DETAIL; arma ⇒ SCREEN-WEAPON-DETAIL; captura ⇒ SCREEN-RESULTS-CAPTURE. Deep link operativo con ambos params.

---

### SCREEN-RESULTS-CAPTURE — Captura de resultados

| Atributo | Valor |
|---|---|
| Propósito | Capturar y administrar los resultados de una fracción por tirador, arma y carril (FL/captura-tiro: la pantalla materializa el flujo). |
| Ruta | `/tiro/fracciones/:idFraccion/resultados` — fijada en `technical-design.md` §4. `meta.requiresTenant`. |
| Params / breadcrumbs | `idFraccion`. Breadcrumb: Inicio › Tiro › Lecciones › {lección} › Fracción {n} › Resultados. |
| Fuente DS | `forms-basic.html` + `forms-validation.html` (captura por carril), `tables-basic.html` (resultados existentes), `ui-modal.html` (confirmaciones, alta de tirador temporal), `ui-toasts.html`/`ui-alerts.html` (errores de unicidad y denegación). |

**Datos y operaciones.** Contratos: [fracciones y resultados](../../contracts/domain-shooting.md#fracciones-y-resultados), [identidad](../../contracts/organization-identity.md#usuarios-y-asignaciones).

- `OP-FRC-003` — resolución del contexto de la fracción en entrada directa (deep link sin pasar por la lección).
- `OP-FRC-007` `GET /fracciones/{id}/tiradores/` — los arrays `usuarios` y `armas` son los **únicos** selectores reales de la captura; si uno está vacío, estado vacío visible sin inventar opciones (`R-DOM-SHT-016`).
- `OP-RES-001` `GET /resultados/` — resultados existentes del scope para estado de la captura (colección de apoyo; el detalle por fracción lo sirve `OP-FRC-008` en SCREEN-FRACTION-DETAIL).
- `OP-RES-002` `POST /resultados/` — alta: `id_fraccion`, `id_usuario`, `id_arma`, `tiros_acertados`, `total_tiros` requeridos; `numero_carril` opcional; FKs directas, no códigos sustitutos (`R-DOM-SHT-017`).
- `OP-RES-003` `GET /resultados/{id}/` — lectura para prefill de edición.
- `OP-RES-004` / `OP-RES-005` `PUT`/`PATCH` — edición compartida.
- `OP-RES-006` `DELETE /resultados/{id}/` — confirmación; tras éxito, fracción/resumen/reporte se refrescan al volver a consultarlos; sin recalcular métricas locales como sustituto (`R-DOM-SHT-020`).
- `OP-USR-012` `POST /usuarios/crear-temporal/` — alta de tirador temporal dentro del flujo de captura (inventario: consumidor FL/captura-tiro): `rut` requerido, opcionales documentados, `organization_unit_code` cuando corresponda; el temporal no inicia sesión; RUT existente ⇒ error del backend sin duplicar (`R-DOM-ID-004`). La promoción a formal ocurre sólo al crear la cuenta formal desde SCREEN-USERS (`R-RUL-06`).

**Acciones y formularios.** Captura por carril con selectores poblados exclusivamente por `OP-FRC-007`. Duplicidad `(id_fraccion, id_usuario)`, `(id_fraccion, id_arma)` o carril no nulo duplicado ⇒ error asociado al selector o carril correspondiente, sin ofrecer el resultado como capturado (`R-DOM-SHT-018`, `R-RUL-03`).

**Controles de acceso.** `shooting_result:create/update/delete → score_shooters`; `shooting_result:read → view_personnel_basic`; `read_own → view_self` (mapa verificado); tirador propio o unidad/M2M según inventario.

**Estados y criterios observables.** Guardado por fila hasta respuesta; errores por campo anclados; vacío ≠ error ≠ denegado; sin `0` falsos: tiros ausentes `—`.

**Navegación.** Atrás ⇒ SCREEN-FRACTION-DETAIL. Enlaces: tirador ⇒ SCREEN-USER-DETAIL; arma ⇒ SCREEN-WEAPON-DETAIL; lección ⇒ SCREEN-LESSON-DETAIL. Deep link a `/tiro/fracciones/{id}/resultados` resuelve el contexto de la fracción con `OP-FRC-003` antes de pintar selectores.
