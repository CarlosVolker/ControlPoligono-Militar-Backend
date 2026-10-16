---
spec_meta: "../../spec-meta.yaml"
---

# Flujos — Fracciones y captura de resultados

> 📜 Yo detallo aquí los siete flujos que completan la cadena
> lección → fracciones → elegibles → captura → detalle: alta/edición/baja de fracción,
> preparación de captura, alta/edición/baja de resultado y el detalle de resultados por
> fracción. Requisitos: [shooting.md](../../requirements/shooting.md) §§Fracciones y
> resultados; contrato: [domain-shooting.md](../../contracts/domain-shooting.md) §§3–4.
> Regla de oro: los selectores de captura sólo contienen usuarios y armas **retornados
> por el backend**; las FKs se envían directas, nunca códigos sustitutos (R-RUL-02,
> R-DOM-SHT-017).

## Índice

1. [FL-SHT-013 — Alta y edición de fracción](#fl-sht-013--alta-y-edición-de-fracción)
2. [FL-SHT-014 — Eliminación de fracción](#fl-sht-014--eliminación-de-fracción)
3. [FL-SHT-015 — Preparación de captura](#fl-sht-015--preparación-de-captura)
4. [FL-SHT-016 — Alta de resultado (captura por carril)](#fl-sht-016--alta-de-resultado-captura-por-carril)
5. [FL-SHT-017 — Edición de resultado](#fl-sht-017--edición-de-resultado)
6. [FL-SHT-018 — Eliminación de resultado](#fl-sht-018--eliminación-de-resultado)
7. [FL-SHT-019 — Detalle de resultados de fracción](#fl-sht-019--detalle-de-resultados-de-fracción)

---

### FL-SHT-013 — Alta y edición de fracción

- **Actor / permiso:** `shooting_fraction:create` (OP-FRC-002) /
  `shooting_fraction:update` (OP-FRC-004/005); tenant+unidad.
- **Pantalla:** pestaña de fracciones de la ficha de lección (FL-SHT-008).
- **Precondición:** lección cargada del mismo tenant/unidad.
- **Entradas:** `id_leccion`* (FK directa), `tiradores_totales`*, `numero_fraccion`*;
  tenant/unidad sólo lectura (R-DOM-SHT-014).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Completa y envía | `POST /fracciones/` (OP-FRC-002) | `201`; el contrato valida lección mismo tenant/unidad y unicidad lección+número | ST-06; refresca la pestaña de fracciones |
| 2 | Edita una existente | `PUT` (OP-FRC-004) o `PATCH` (OP-FRC-005) | `200` con la fracción | ST-06; refresca pestaña |

- **Fallos:** duplicidad lección+número → F-05 anclado en `numero_fraccion`
  (R-DOM-SHT-014). `400` resto → F-01. `403` → F-02. `404` → F-04. Red → F-06.
  Cancelar → F-09.

---

### FL-SHT-014 — Eliminación de fracción

- **Actor / permiso:** `shooting_fraction:delete` (OP-FRC-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica lección y `numero_fraccion` (R-DOM-SHT-015) | — | Modal abierto |
| 2 | Confirma | `DELETE /fracciones/{id}/` (OP-FRC-006) | respuesta del backend | Refresca la lección; **no elimina resultados locales antes de la respuesta exitosa** (R-DOM-SHT-015) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-SHT-015 — Preparación de captura

- **Actor / permiso:** `shooting_fraction:read` (OP-FRC-007; consumidor
  `FL/captura-tiro`).
- **Pantalla:** captura de resultados por carril (ruta declarada
  `/tiro/fracciones/:idFraccion/resultados` en `technical-design.md` §4; referencia
  descriptiva hasta el cruce de SCREEN IDs).
- **Precondición:** fracción seleccionada desde FL-SHT-008 o navegación directa.
- **Entradas:** `id` de la fracción.

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre la captura | `GET /fracciones/{id}/tiradores/` (OP-FRC-007) | `{usuarios: UsuarioSerializer[], armas: ArmaSerializer[]}` | Los dos arrays alimentan los selectores de tirador y arma (R-DOM-SHT-016) |
| 2 | — (algún array vacío) | ninguna | array vacío | Estado vacío visible (ST-03) en ese selector; **sin opciones inventadas** (R-DOM-SHT-016) |
| 3 | — (tirador sin cuenta necesario) | enlaza a FL-IDT-004 (alta temporal, OP-USR-012) y re-consulta OP-FRC-007 tras el éxito | nuevo usuario real en `usuarios` | El selector se puebla sólo con la respuesta re-consultada |

- **Postcondición observable:** la captura opera exclusivamente con usuarios y armas
  reales devueltos; el alta temporal queda indicada como «no inicia sesión»
  (R-DOM-ID-004).
- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06/F-10: sin selectores de memoria.

---

### FL-SHT-016 — Alta de resultado (captura por carril)

- **Actor / permiso:** `shooting_result:create` (OP-RES-002; tirador propio o
  unidad/M2M).
- **Pantalla:** captura de FL-SHT-015.
- **Precondición:** selectores poblados por OP-FRC-007.
- **Entradas:** `id_fraccion`*, `id_usuario`*, `id_arma`*, `tiros_acertados`*,
  `total_tiros`*, `numero_carril` opcional — FKs **directas** (R-DOM-SHT-017).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Selecciona tirador, arma, carril y tiros; envía | `POST /resultados/` (OP-RES-002) | `201`; el contrato valida fracción/arma mismo tenant y unidad, y las tres unicidades (fracción+usuario, fracción+arma, carril no nulo) | ST-06; la fila capturada queda visible sólo desde la respuesta o la re-consulta (FL-SHT-019) |

- **Postcondición observable:** el resultado existe con los ids devueltos; ninguna fila
  se pintó antes del `201`.
- **Fallos:** duplicidad por cualquiera de las tres reglas → F-05 asociado al selector o
  carril correspondiente, **sin ofrecer el resultado como capturado** (R-RUL-03,
  R-DOM-SHT-018). `400` resto → F-01. `403` → F-02. Red → F-06: sin optimismo.
  Cancelar → F-09. Cambio de unidad en vuelo → F-08.

---

### FL-SHT-017 — Edición de resultado

- **Actor / permiso:** `shooting_result:update` (OP-RES-004/005); alcance: tirador
  propio o unidad/M2M (inventario).
- **Entradas:** las mismas del alta sobre el resultado existente.

| # | Paso | Operación | Respuesta real | UI |
|---:|---|---|---|---|
| 1 | Edita y envía | `PUT` (OP-RES-004) o `PATCH` (OP-RES-005) `/resultados/{id}/` | `200` con el resultado | ST-06; refresca la fila desde la respuesta |

- **Fallos:** unicidades → F-05. `400` → F-01. `403` → F-02. `404` → F-04. Red → F-06.

---

### FL-SHT-018 — Eliminación de resultado

- **Actor / permiso:** `shooting_result:delete` (OP-RES-006).

| # | Paso | Operación | Respuesta | UI |
|---:|---|---|---|---|
| 1 | Pulsa eliminar | ST-10 que identifica tirador, arma y carril | — | Modal abierto |
| 2 | Confirma | `DELETE /resultados/{id}/` (OP-RES-006) | respuesta del backend | Refresca fracción, resumen y reporte **al volver a consultarlos** (FL-SHT-008/010/011); no recalcula métricas locales como sustituto de la respuesta (R-DOM-SHT-020) |

- **Fallos:** `403` → F-02. `404` → F-04. Red → F-06 sin borrado local.

---

### FL-SHT-019 — Detalle de resultados de fracción

- **Actor / permiso:** `shooting_fraction:read` **+ detalle** (OP-FRC-008).

| # | Paso del usuario | Operación | Respuesta real | Actualización de UI |
|---:|---|---|---|---|
| 1 | Abre el detalle de la fracción | `GET /fracciones/{id}/resultados/` (OP-FRC-008) | `[{resultado: ResultadoTiroSerializer, usuario: UsuarioSerializer, arma: ArmaSerializer}]`; el backend escribe en `AccessAudit` (R-RUL-11) | Tabla de pares resultado/usuario/arma |
| 2 | — (`403`) | ninguna | `403 {detail}` sin `can_read_detail` | Mantiene **captura y detalle separados**, indicando falta de autorización para ver detalle (R-DOM-SHT-019; ST-07, no ST-03) |

- **Fallos:** `403` → F-02 con la distinción captura/detalle. `404` → F-04. Red →
  F-06/F-10. Vacío con permiso → ST-03.

> 🕯️ Los cuatro huecos del dominio —validación de resultados, exportación, transferencia
> de stock y edición de datos propios— no tienen endpoint (`requirements.md` §8, D-02):
> ningún flujo de este volumen los simula ni los promete.
