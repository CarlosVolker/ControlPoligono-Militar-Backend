---
spec_meta: "../spec-meta.yaml"
---

# Tasks — Tiro: fracciones y captura de resultados (T-FL-SHT-013…019)

> 📜 Yo registro aquí las siete tareas que completan la cadena lección → fracciones →
> elegibles → captura → detalle. Regla de oro conservada del volumen de flujos: los
> selectores de captura sólo contienen usuarios y armas **retornados por el backend**;
> las FKs se envían directas, nunca códigos sustitutos (R-RUL-02, R-DOM-SHT-017). Pasos
> y shapes **no se copian**: cada tarea cita su ancla `FL-*`. Índice y reglas:
> [../tasks.md](../tasks.md). Ninguna tarea está autorizada a ejecutarse.

## Bloque común de la familia

- **Dependencias comunes:** T-CORE-TYPES, T-CORE-HTTP, T-CORE-SESSION, T-CORE-ROUTER
  (`/tiro/lecciones/:idLeccion/fracciones/:idFraccion`,
  `/tiro/fracciones/:idFraccion/resultados`), T-CORE-UI.
- **Archivos probables** (raíz `front/src/`): `api/shooting.ts` (compartido con
  [shooting-lessons.md](shooting-lessons.md)), `views/tiro/FractionDetailView.vue`,
  `views/tiro/ResultsCaptureView.vue`, `components/shooting/*` (fracciones, captura).
  Todos con `<script setup lang="ts">`.
- **Convención de AC:** hogar canónico único por OP. **Reservas declaradas:** OP-FRC-001
  (listado de soporte; la colección visible de la pestaña proviene de OP-LES-007 según
  [../experience/screens.md](../experience/screens.md)) ⇒ hogar T-FL-SHT-013; OP-FRC-003
  (detalle de fracción, resolución de contexto en entrada directa) ⇒ hogar
  T-FL-SHT-015, compartido con la ficha (T-FL-SHT-019); OP-RES-001 (colección de apoyo
  de la captura) y OP-RES-003 (prefill de edición) ⇒ hogares T-FL-SHT-016 y
  T-FL-SHT-017 respectivamente.
- **Huecos del dominio (D-02, sin endpoint):** validación de resultados, exportación,
  transferencia de stock y edición de datos propios no tienen tarea, botón ni pantalla;
  se reportan como hueco ([../requirements/exercises-consumption.md](../requirements/exercises-consumption.md)
  R-DOM-EXC-014 como patrón; `requirements.md` §8 vía volúmenes citantes).

---

## T-FL-SHT-013 — Alta y edición de fracción

| Campo | Valor |
|---|---|
| Objetivo | Gestión de fracciones dentro de la pestaña de la lección: `id_leccion`* (FK directa), `tiradores_totales`*, `numero_fraccion`*; tenant/unidad sólo lectura; la duplicidad lección+número se ancla en `numero_fraccion`. Cubre la lectura de soporte reservada (OP-FRC-001). |
| Flujo | [FL-SHT-013](../experience/flows/shooting-capture.md#fl-sht-013--alta-y-edición-de-fracción) |
| OP (AC canónicos) | OP-FRC-002, OP-FRC-004, OP-FRC-005; **reserva:** OP-FRC-001 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) — modales de la pestaña fracciones; el editor compartido sirve también a [SCREEN-FRACTION-DETAIL](../experience/screens/shooting.md#screen-fraction-detail--ficha-de-fracción) |
| Requisitos | R-DOM-SHT-014 (campos; RO; error de duplicidad en `numero_fraccion`). |
| Precondiciones / dependencias | T-FL-SHT-008 (ficha y pestaña cargadas). |
| Archivos probables | `components/shooting/FractionFormModal.vue`. |
| Done when | La pestaña de fracciones refleja sólo las devueltas por el servidor; el duplicado produce error anclado sin alta doble. |

**Criterios.**

- **AC-OP-FRC-001 (reserva):** `GET /fracciones/` queda disponible como lectura de
  soporte/contexto cuando el flujo lo requiera; la colección visible de la pestaña
  proviene de OP-LES-007 (T-FL-SHT-008), no de este listado.
- **AC-OP-FRC-002 / AC-OP-FRC-004 / AC-OP-FRC-005:** `201`/`200` ⇒ ST-06 y refresco de
  la pestaña; duplicidad lección+número ⇒ F-05 anclado en `numero_fraccion`; `400` resto
  ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06; cancelar ⇒ F-09.

---

## T-FL-SHT-014 — Eliminación de fracción

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica lección y `numero_fraccion`; refresco de la lección tras éxito, sin eliminar resultados locales antes de la respuesta exitosa. |
| Flujo | [FL-SHT-014](../experience/flows/shooting-capture.md#fl-sht-014--eliminación-de-fracción) |
| OP (AC canónicos) | OP-FRC-006 |
| SCREEN | [SCREEN-LESSON-DETAIL](../experience/screens/shooting.md#screen-lesson-detail--ficha-de-lección) y [SCREEN-FRACTION-DETAIL](../experience/screens/shooting.md#screen-fraction-detail--ficha-de-fracción) (baja desde la ficha devuelve a la lección) |
| Requisitos | R-DOM-SHT-015 (confirmación; refresco; sin borrado local anticipado de resultados). |
| Precondiciones / dependencias | T-FL-SHT-013 (fracción visible). |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | La fracción desaparece sólo tras éxito; los resultados asociados no se borran localmente antes de la respuesta. |

**Criterios.**

- **AC-OP-FRC-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco de la lección; `403` ⇒
  F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local.

---

## T-FL-SHT-015 — Preparación de captura de fracción

| Campo | Valor |
|---|---|
| Objetivo | Los dos arrays de `GET /fracciones/{id}/tiradores/` (`usuarios`, `armas`) son los **únicos** selectores reales de la captura; array vacío ⇒ estado vacío visible en ese selector sin opciones inventadas; si falta un tirador, enlace a T-FL-IDT-004 (alta temporal) con re-consulta de OP-FRC-007 tras el éxito. Cubre la resolución de contexto por OP-FRC-003 en entrada directa (deep link sin pasar por la lección). |
| Flujo | [FL-SHT-015](../experience/flows/shooting-capture.md#fl-sht-015--preparación-de-captura) |
| OP (AC canónicos) | OP-FRC-007; **reserva:** OP-FRC-003 |
| SCREEN | [SCREEN-RESULTS-CAPTURE](../experience/screens/shooting.md#screen-results-capture--captura-de-resultados) y [SCREEN-FRACTION-DETAIL](../experience/screens/shooting.md#screen-fraction-detail--ficha-de-fracción) — DS `forms-basic.html` + `forms-validation.html` |
| Requisitos | R-DOM-SHT-016 (arrays como selectores reales; vacío visible sin invención); R-DOM-ID-004 vía enlace (el temporal «no inicia sesión»). |
| Precondiciones / dependencias | T-FL-SHT-013 (fracción seleccionada o navegación directa); T-FL-IDT-004 (alta temporal enlazada). |
| Archivos probables | `views/tiro/ResultsCaptureView.vue` (preparación), `views/tiro/FractionDetailView.vue` (carga de contexto). |
| Done when | La captura opera exclusivamente con usuarios y armas reales devueltos; el deep link a `/tiro/fracciones/:idFraccion/resultados` resuelve el contexto de la fracción **antes** de pintar selectores. |

**Criterios.**

- **AC-OP-FRC-003 (reserva):** `GET /fracciones/{id}/` resuelve el contexto en entrada
  directa y alimenta la ficha; `404` ⇒ F-04; `403` ⇒ ST-07.
- **AC-OP-FRC-007:** `{usuarios: UsuarioSerializer[], armas: ArmaSerializer[]}` pueblan
  los selectores; algún array vacío ⇒ ST-03 en ese selector **sin** opciones de memoria;
  `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06/F-10 (sin selectores de memoria).

---

## T-FL-SHT-016 — Alta de resultado (captura por carril)

| Campo | Valor |
|---|---|
| Objetivo | Captura con `id_fraccion`*, `id_usuario`*, `id_arma`* (FKs directas), `tiros_acertados`*, `total_tiros`* y `numero_carril` opcional; la fila capturada queda visible sólo desde la respuesta o la re-consulta; las tres unicidades (fracción+usuario, fracción+arma, carril no nulo) se anclan al selector o carril correspondiente sin ofrecer el resultado como capturado. Cubre la colección de apoyo reservada (OP-RES-001). |
| Flujo | [FL-SHT-016](../experience/flows/shooting-capture.md#fl-sht-016--alta-de-resultado-captura-por-carril) |
| OP (AC canónicos) | OP-RES-002; **reserva:** OP-RES-001 |
| SCREEN | [SCREEN-RESULTS-CAPTURE](../experience/screens/shooting.md#screen-results-capture--captura-de-resultados) |
| Requisitos | R-DOM-SHT-017 (campos; FKs directas, nunca códigos sustitutos); R-DOM-SHT-018 (las tres duplicidades ancladas; sin ofrecer como capturado); R-RUL-03 vía flujo. |
| Precondiciones / dependencias | T-FL-SHT-015 (selectores poblados). |
| Archivos probables | `components/shooting/CaptureLaneForm.vue`. |
| Done when | El resultado existe con los ids devueltos; ninguna fila se pintó antes del `201`; un cambio de unidad en vuelo descarta la respuesta vieja (F-08). |

**Criterios.**

- **AC-OP-RES-001 (reserva):** `GET /resultados/` sirve como colección de apoyo para el
  estado de la captura (el detalle por fracción lo sirve OP-FRC-008 en T-FL-SHT-019);
  vacío ⇒ ST-03.
- **AC-OP-RES-002:** `201` ⇒ ST-06; duplicidad por cualquiera de las tres reglas ⇒ F-05
  asociado al selector/carril, **sin** ofrecer el resultado como capturado; `400` resto
  ⇒ F-01; `403` ⇒ F-02; red ⇒ F-06 sin optimismo; cancelar ⇒ F-09; cambio de unidad en
  vuelo ⇒ F-08.

---

## T-FL-SHT-017 — Edición de resultado

| Campo | Valor |
|---|---|
| Objetivo | Edición con los mismos campos del alta sobre el resultado existente; prefill desde la lectura de soporte; la fila se refresca desde la respuesta. |
| Flujo | [FL-SHT-017](../experience/flows/shooting-capture.md#fl-sht-017--edición-de-resultado) |
| OP (AC canónicos) | OP-RES-004, OP-RES-005; **reserva:** OP-RES-003 |
| SCREEN | [SCREEN-RESULTS-CAPTURE](../experience/screens/shooting.md#screen-results-capture--captura-de-resultados) |
| Requisitos | R-DOM-SHT-017/018 (mismas reglas sobre la fila existente). |
| Precondiciones / dependencias | T-FL-SHT-016. |
| Archivos probables | `components/shooting/CaptureLaneForm.vue` (prefill). |
| Done when | La fila editada muestra exactamente la respuesta del servidor. |

**Criterios.**

- **AC-OP-RES-003 (reserva):** `GET /resultados/{id}/` sirve de prefill al editor; `404`
  ⇒ F-04.
- **AC-OP-RES-004 / AC-OP-RES-005:** `200` ⇒ ST-06 y refresco de la fila desde la
  respuesta; unicidades ⇒ F-05; `400` ⇒ F-01; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06.

---

## T-FL-SHT-018 — Eliminación de resultado

| Campo | Valor |
|---|---|
| Objetivo | Baja con ST-10 que identifica tirador, arma y carril; fracción, resumen y reporte se refrescan **al volver a consultarlos**; prohibido recalcular métricas locales como sustituto de la respuesta. |
| Flujo | [FL-SHT-018](../experience/flows/shooting-capture.md#fl-sht-018--eliminación-de-resultado) |
| OP (AC canónicos) | OP-RES-006 |
| SCREEN | [SCREEN-RESULTS-CAPTURE](../experience/screens/shooting.md#screen-results-capture--captura-de-resultados) |
| Requisitos | R-DOM-SHT-020 (confirmación; éxito; refresco por re-consulta; sin recálculo local). |
| Precondiciones / dependencias | T-FL-SHT-016 (fila visible). |
| Archivos probables | confirmación compartida de T-CORE-UI. |
| Done when | La fila desaparece sólo tras éxito; las métricas visibles posteriores provienen de nuevas consultas (T-FL-SHT-010/011). |

**Criterios.**

- **AC-OP-RES-006:** ST-10 ⇒ `DELETE`; éxito ⇒ ST-06 y refresco por re-consulta de
  fracción/resumen/reporte; `403` ⇒ F-02; `404` ⇒ F-04; red ⇒ F-06 sin borrado local ni
  recálculo.

---

## T-FL-SHT-019 — Detalle de resultados de fracción

| Campo | Valor |
|---|---|
| Objetivo | Tabla de pares resultado/usuario/arma gated por `can_read_detail`: un `403` mantiene **captura y detalle separados** indicando falta de autorización para ver detalle (ST-07, no ST-03); la ficha de fracción enlaza a captura, tirador y arma sólo cuando los identificadores existen en la respuesta. |
| Flujo | [FL-SHT-019](../experience/flows/shooting-capture.md#fl-sht-019--detalle-de-resultados-de-fracción) |
| OP (AC canónicos) | OP-FRC-008 (OP-FRC-003 referenciado desde T-FL-SHT-015) |
| SCREEN | [SCREEN-FRACTION-DETAIL](../experience/screens/shooting.md#screen-fraction-detail--ficha-de-fracción) |
| Requisitos | R-DOM-SHT-019 (pares; `403` = separación captura/detalle con indicación de autorización); R-RUL-11 vía flujo. |
| Precondiciones / dependencias | T-FL-SHT-015 (contexto de la fracción). |
| Archivos probables | `views/tiro/FractionDetailView.vue`, `components/shooting/FractionResultsTable.vue`. |
| Done when | Con permiso: tabla de pares; sin permiso: ST-07 con indicación explícita y captura operativa por separado; vacío con permiso ⇒ ST-03. |

**Criterios.**

- **AC-OP-FRC-008:** `[{resultado: ResultadoTiroSerializer, usuario: UsuarioSerializer,
  arma: ArmaSerializer}]` ⇒ tabla de pares (el backend escribe en `AccessAudit`; no es
  conducta del cliente); `403 {detail}` sin `can_read_detail` ⇒ ST-07 con captura y
  detalle separados; `404` ⇒ F-04; red ⇒ F-06/F-10; vacío con permiso ⇒ ST-03.

---

> 🕯️ Los cuatro huecos del dominio —validación de resultados, exportación,
> transferencia de stock y edición de datos propios— no tienen endpoint (D-02): ninguna
> tarea de este volumen los simula ni los promete. La promoción de tirador temporal a
> formal ocurre **sólo** por alta formal (T-FL-IDT-002/003), nunca desde la captura.
