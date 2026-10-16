---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Polígonos y lecciones

> 📜 Yo detallo aquí los doce primeros flujos de tiro: polígonos y la lección con sus
> cinco lecturas (fracciones, tiradores, resultados, resumen, reporte). Requisitos de
> familia: [shooting.md](../../requirements/shooting.md); contrato:
> [domain-shooting.md](../../contracts/domain-shooting.md) §§2–4. Regla común: cada
> pestaña carga de forma independiente; un `403` de detalle es alcance insuficiente,
> nunca ausencia de registros (R-RUL-11).

## Índice

1. [FL-SHT-001 — Consulta de polígonos](#fl-sht-001--consulta-de-polígonos)
2. [FL-SHT-002 — Alta y edición de polígono](#fl-sht-002--alta-y-edición-de-polígono)
3. [FL-SHT-003 — Eliminación de polígono (restringida)](#fl-sht-003--eliminación-de-polígono-restringida)
4. [FL-SHT-004 — Lecciones del polígono](#fl-sht-004--lecciones-del-polígono)
5. [FL-SHT-005 — Alta de lección](#fl-sht-005--alta-de-lección)
6. [FL-SHT-006 — Edición de lección](#fl-sht-006--edición-de-lección)
7. [FL-SHT-007 — Eliminación de lección](#fl-sht-007--eliminación-de-lección)
8. [FL-SHT-008 — Ficha: fracciones y tiradores](#fl-sht-008--ficha-fracciones-y-tiradores)
9. [FL-SHT-009 — Resultados detallados](#fl-sht-009--resultados-detallados)
10. [FL-SHT-010 — Resumen](#fl-sht-010--resumen)
11. [FL-SHT-011 — Reporte](#fl-sht-011--reporte)
12. [FL-SHT-012 — Tiradores elegibles](#fl-sht-012--tiradores-elegibles)

---

### FL-SHT-001 — Consulta de polígonos

- **Actor / permiso:** `range:read → view_unit` (OP-RNG-001/003; tenant+unidad).
- **Pantalla:** polígonos (`SCREEN/poligonos` provisional).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre el listado | `GET /poligonos/` (OP-RNG-001) | array con `id_poligono`, tenant, unidad, `nombre, ciudad, carriles_maximos, distancia_maxima` | Lista (R-DOM-SHT-001); conserva el identificador para navegar a sus lecciones |
| 2 | Abre un polígono | `GET /poligonos/{id}/` (OP-RNG-003) | objeto | Ficha con acción a FL-SHT-004 |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-SHT-002 — Alta y edición de polígono

- **Actor / permiso:** `range:create → create_shooting_lessons` (OP-RNG-002) /
  `range:update → update_shooting_lessons` (OP-RNG-004/005).
- **Entradas:** `nombre`*, `ciudad`*, `carriles_maximos`*, `distancia_maxima`*;
  tenant/unidad sólo lectura (R-DOM-SHT-002).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /poligonos/` (OP-RNG-002) o `PUT`/`PATCH` (OP-RNG-004/005) | `201`/`200` con el polígono | ST-06; refresca listado/ficha; errores del backend asociados al formulario |

- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06. Cancelar → F-09.

---

### FL-SHT-003 — Eliminación de polígono (restringida)

- **Actor / permiso:** el inventario declara que **no hay mapa `range:delete`**: por
  inferencia estática, `DELETE /poligonos/{id}/` (OP-RNG-006) llega a
  `HasResourcePermission` sin `permission_code` y puede recibir `403`
  (`backend-inventory.md` §Límites comprobados). No es prueba runtime.
- **Precondición:** polígono cargado.

| # | Paso | Conducta obligatoria |
|---:|---|---|
| 1 | El usuario busca la acción destructiva | La UI **no muestra una acción destructiva como disponible por defecto** (R-DOM-SHT-003) |
| 2 | Si una solicitud llegara a emitirse y denegarse | Mostrar la denegación literal (F-02) **sin ocultar el registro** (R-DOM-SHT-003) |

- **Postcondición observable:** el polígono sigue visible tras una denegación; ningún
  borrado local.
- **Fallos:** `403` esperado → F-02. Red → F-06.

---

### FL-SHT-004 — Lecciones del polígono

- **Actor / permiso:** `range:read → view_unit` (OP-RNG-007).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre «lecciones» desde la ficha | `GET /poligonos/{id}/lecciones/` (OP-RNG-007) | `LeccionTiroSerializer[]` del mismo tenant del polígono | Muestra exclusivamente el arreglo devuelto y permite selección hacia la ficha de lección (R-DOM-SHT-004) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10. Vacío → ST-03.

---

### FL-SHT-005 — Alta de lección

- **Actor / permiso:** `shooting_session:create` (OP-LES-002; tenant+unidad/M2M).
- **Precondición:** selector de polígono desde OP-RNG-001; selector de unidades
  participantes desde FL-ORG-006.
- **Entradas:** `id_poligono`*, `fecha_tiro`*, `cant_tiros_cereo`*,
  `cant_tiros_leccion`*, `distancia`*; opcionales: orden, fecha, `tipo_tiro` —limitado a
  `evaluacion|entrenamiento`—, `unidades_participantes_codes_write` (R-DOM-SHT-006).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /lecciones/` (OP-LES-002) | `201` con la lección; el polígono debe ser del tenant ([contrato](../../contracts/domain-shooting.md) §Polígonos y lecciones) | ST-06; refresca listado |
| 2 | — (alta sin participantes) | ninguna adicional | sin lista escrita, el backend agrega la unidad inyectada por el mixin (R-RUL-05) | Muestra el valor **efectivo** devuelto tras crear; no afirma que no existen participantes (R-DOM-SHT-007) |

- **Postcondición observable:** `unidades_participantes_codes` de la respuesta refleja
  la unidad efectiva.
- **Fallos:** `400` (incluido polígono fuera de tenant) → F-01. `403` → F-02. Red →
  F-06. Cancelar → F-09.

---

### FL-SHT-006 — Edición de lección

- **Actor / permiso:** `shooting_session:update` (OP-LES-004/005).
- **Entradas:** las mismas del alta sobre la lección existente.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Edita y envía | `PUT` (OP-LES-004) o `PATCH` (OP-LES-005) `/lecciones/{id}/` | `200` con la lección | ST-06; refresca ficha y sus pestañas al recargarlas |

- **Fallos:** `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06. Cancelar → F-09.

---

### FL-SHT-007 — Eliminación de lección

- **Actor / permiso:** `shooting_session:delete` (OP-LES-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 destructiva que identifica lección y fecha (R-DOM-SHT-008) | — | Modal abierto |
| 2 | Confirma | `DELETE /lecciones/{id}/` (OP-LES-006) | respuesta del backend; el error contractual si las relaciones impiden la operación | Refresca polígonos, fracciones y reportes relacionados **sólo tras éxito** (R-DOM-SHT-008) |

- **Fallos:** `400` por relaciones → F-01 literal. `403` → F-02. `404` → F-04. Red →
  F-06 sin borrado local.

---

### FL-SHT-008 — Ficha: fracciones y tiradores

- **Actor / permiso:** `shooting_session:read` (OP-LES-007/008).
- **Pantalla:** ficha de lección de 5 pestañas (R-RES-04; `SCREEN/lección` provisional).
- **Precondición:** lección cargada; cada pestaña tiene carga independiente.
- **Nota de alcance:** si el usuario es tirador puro, el backend limita a lecciones donde
  su unidad participa o donde tiene resultado propio: la ficha **rotula el alcance como
  restringido**, no como lista completa (R-RUL-13, R-DOM-SHT-005).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre la pestaña fracciones | `GET /lecciones/{id}/fracciones/` (OP-LES-007) | `FraccionTiroSerializer[]` (tenant) | Muestra fracciones **sin mezclar resultados** (R-DOM-SHT-009) |
| 2 | Abre la pestaña tiradores | `GET /lecciones/{id}/usuarios/` (OP-LES-008) | `UsuarioSerializer[]` — usuarios con resultado | Diferencia vacío de error (R-DOM-SHT-009) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10 por pestaña: el fallo de una
  pestaña no invalida las demás. Vacío → ST-03 por pestaña.

---

### FL-SHT-009 — Resultados detallados

- **Actor / permiso:** `shooting_session:read` **+ `can_read_detail`** (OP-LES-009).
- **Pantalla:** pestaña de resultados de la ficha.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre la pestaña resultados | `GET /lecciones/{id}/resultados/` (OP-LES-009) | filas con identidad, unidad, arma, carril y tiros; el backend escribe en `AccessAudit` (R-RUL-11) | Tabla de detalle por fila |
| 2 | — (`403`) | ninguna | `403 {detail}`: `Su alcance no permite ver resultados detallados.` | Informa «sin permiso de detalle» (ST-07) y ofrece las consultas agregadas disponibles (FL-SHT-010/011); **no sustituye detalle por resumen**: son pantallas independientes (R-DOM-SHT-010, `requirements.md` B-01) |

- **Riesgo registrado:** la hipótesis estática B-01 (`primary_unit()` invocado fuera de
  su ámbito en `views.py:880`) puede romper esta OP; no está comprobada en runtime. Si la
  petición falla, se trata como error explícito (ST-04) y **no** se sustituye por
  resumen/reporte (`requirements.md` §9 B-01, T-04).
- **Fallos:** `403` → F-02 con la distinción de detalle. Red/`500` → F-06. Vacío con
  permiso → ST-03 («sin resultados»), distinto de ST-07.

---

### FL-SHT-010 — Resumen

- **Actor / permiso:** `shooting_session:read_summary → view_unit` (OP-LES-010).

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Abre la pestaña resumen | `GET /lecciones/{id}/resultados-resumen/` (OP-LES-010) | `{id_leccion, fracciones, tiradores_unicos, tiros_acertados_total, tiros_total}` | Muestra las cuatro cifras con rótulo de lección y fecha, **nunca como total institucional** (R-DOM-SHT-011, R-DAT-04) |

- **Métrica derivada única:** porcentaje de acierto = `acertados / total * 100` con un
  decimal, sólo si `total > 0`; con `total = 0` se muestra `—`, nunca `0`
  (`technical-design.md` §10).
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10.

---

### FL-SHT-011 — Reporte

- **Actor / permiso:** `shooting_session:read` (OP-LES-011).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre la pestaña reporte | `GET /lecciones/{id}/reporte/` (OP-LES-011) | `{leccion, resumen, por_fraccion, por_tirador, por_unidad, por_arma, por_arma_unidad, aggregate_only}` | Con `aggregate_only: false` → muestra exclusivamente los desgloses recibidos (R-DOM-SHT-012) |
| 2 | — (`aggregate_only: true`) | ninguna adicional | los tres desgloses personales/arma vienen vacíos | Muestra `resumen`, `por_fraccion` y `por_unidad`; **no solicita ni representa** `por_tirador`, `por_arma` ni `por_arma_unidad` (R-DAT-03) |

- **Semántica exacta:** `aggregate_only` es un **indicador de la respuesta de reporte**,
  no un rol ni un permiso; lo emite `can_read_detail(account) == false` (R-DAT-03).
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10.

---

### FL-SHT-012 — Tiradores elegibles

- **Actor / permiso:** `shooting_session:read` (OP-LES-012; consumidor `FL/captura-tiro`).
- **Pantalla:** flujo permitido de participantes de la lección.
- **Entradas:** `id` de la lección.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el selector de tiradores | `GET /lecciones/{id}/tiradores-elegibles/` (OP-LES-012) | `{results: UsuarioSerializer[]}` — unidades participantes y descendientes | Presenta únicamente los usuarios retornados (R-DOM-SHT-013) |

- **Límite explícito:** este flujo **no** se convierte en alta de usuario (R-DOM-SHT-013);
  un tirador sin cuenta se registra por FL-IDT-004 (temporal), que es la operación
  contratada para eso.
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06. `results` vacío → ST-03: sin
  opciones inventadas.
