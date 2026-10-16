---
spec_meta: "../spec-meta.yaml"
---

# Requisitos de frontend — Tiro, lecciones y resultados

## Alcance y estados comunes

Este tomo cubre polígonos, lecciones, fracciones, resultados y sus consultas. La evidencia contractual es [domain-shooting.md](../contracts/domain-shooting.md) §§2–4. Cada detalle usa carga independiente por pestaña; un `403` de detalle de resultados se muestra como alcance insuficiente, nunca como ausencia de registros. Las mutaciones no envían tenant/unidad inyectados, muestran guardado, conservan errores por campo y refrescan únicamente después de éxito.

---

## Polígonos

- **R-DOM-SHT-001** — WHEN se lista o consulta un polígono, THEN SHALL mostrar `id_poligono`, nombre, ciudad, `carriles_maximos`, `distancia_maxima`, tenant y unidad retornados; SHALL mantener el identificador para navegar a sus lecciones. *Fuente: `contracts/domain-shooting.md:18`.*
- **R-DOM-SHT-002** — WHEN se crea o edita un polígono, THEN SHALL requerir `nombre`, `ciudad`, `carriles_maximos` y `distancia_maxima`; SHALL tratar tenant/unidad como sólo lectura. Los errores del backend permanecen asociados al formulario.
- **R-DOM-SHT-003** — WHEN se solicita eliminar un polígono, THEN SHALL no mostrar una acción destructiva como disponible por defecto: el contrato no declara el mapeo `range:delete`. Si una solicitud llega a denegarse, SHALL mostrar la denegación sin ocultar el registro. *Fuente: `contracts/domain-shooting.md:18`.*
- **R-DOM-SHT-004** — WHEN se abre “lecciones del polígono”, THEN SHALL mostrar exclusivamente el arreglo de lecciones del mismo tenant devuelto por la acción y permitir su selección. *Fuente: OP-RNG-007, `contracts/domain-shooting.md:19`.*

## Lecciones

- **R-DOM-SHT-005** — WHEN se lista o abre una lección, THEN SHALL presentar identificadores, polígono, fecha, conteos, distancia, tipo y unidades participantes retornadas; SHALL rotular el alcance restringido cuando el backend limita un tirador a participación o resultado propio. *Fuente: `contracts/domain-shooting.md:20`; `requirements.md:R-RUL-13`.*
- **R-DOM-SHT-006** — WHEN se crea o edita una lección, THEN SHALL requerir `id_poligono`, `fecha_tiro`, `cant_tiros_cereo`, `cant_tiros_leccion` y `distancia`; SHALL permitir campos opcionales documentados, `tipo_tiro` limitado a `evaluacion|entrenamiento`, y unidades por `unidades_participantes_codes_write`. *Fuente: `contracts/domain-shooting.md:20`.*
- **R-DOM-SHT-007** — WHEN el alta omite participantes, THEN SHALL mostrar la unidad efectiva devuelta tras éxito y SHALL NOT afirmar que no existen participantes. *Fuente: `requirements.md:R-RUL-05`; `contracts/domain-shooting.md:20`.*
- **R-DOM-SHT-008** — WHEN se elimina una lección mediante el CRUD expuesto, THEN SHALL pedir confirmación destructiva y refrescar polígonos, fracciones y reportes relacionados sólo tras éxito; SHALL mostrar el error contractual si las relaciones impiden la operación.
- **R-DOM-SHT-009** — WHEN se abre la pestaña de fracciones, THEN SHALL cargar OP-LES-007 y mostrar sus datos sin mezclar resultados; WHEN se abre la pestaña de tiradores, THEN SHALL cargar OP-LES-008 y diferenciar vacío de error. *Fuente: `contracts/domain-shooting.md:33–34`.*
- **R-DOM-SHT-010** — WHEN se abre resultados detallados de una lección, THEN SHALL cargar OP-LES-009 y mostrar filas con identidad, unidad, arma, carril y tiros. WHEN responde `403`, THEN SHALL informar “sin permiso de detalle” y ofrecer las consultas agregadas que sí estén disponibles; SHALL NOT sustituir detalle con resumen. *Fuente: `contracts/domain-shooting.md:35`.*
- **R-DOM-SHT-011** — WHEN se abre resumen, THEN SHALL mostrar `fracciones`, `tiradores_unicos`, tiros acertados y total de la lección retornada, con rótulo de lección y fecha, nunca como total institucional. *Fuente: OP-LES-010, `contracts/domain-shooting.md:36`.*
- **R-DOM-SHT-012** — WHEN se abre reporte, THEN SHALL mostrar `leccion`, `resumen`, `por_fraccion` y `por_unidad`. WHEN `aggregate_only` es verdadero, THEN SHALL no solicitar ni representar `por_tirador`, `por_arma` o `por_arma_unidad`; WHEN es falso, SHALL mostrar exclusivamente los desgloses recibidos. *Fuente: OP-LES-011, `contracts/domain-shooting.md:37`.*
- **R-DOM-SHT-013** — WHEN se agregan participantes a una lección desde el flujo permitido, THEN SHALL usar OP-LES-012 y presentar únicamente usuarios retornados desde participantes y descendientes; no SHALL convertirlo en alta de usuario. *Fuente: `contracts/domain-shooting.md:38`.*

## Fracciones y resultados

- **R-DOM-SHT-014** — WHEN se crea o edita una fracción, THEN SHALL requerir `id_leccion`, `tiradores_totales` y `numero_fraccion`; SHALL tratar tenant/unidad como sólo lectura. Un error de duplicidad lección+número se muestra en `numero_fraccion`. *Fuente: `contracts/domain-shooting.md:26`.*
- **R-DOM-SHT-015** — WHEN se elimina una fracción, THEN SHALL requerir confirmación y refrescar la lección; SHALL no eliminar resultados locales antes de respuesta exitosa.
- **R-DOM-SHT-016** — WHEN se prepara captura de una fracción, THEN SHALL cargar OP-FRC-007 y usar los arrays `usuarios` y `armas` como selectores reales de la captura. Si uno está vacío, SHALL permitir ver el estado vacío y no inventar opciones. *Fuente: `contracts/domain-shooting.md:39`.*
- **R-DOM-SHT-017** — WHEN se crea o edita un resultado, THEN SHALL requerir `id_fraccion`, `id_usuario`, `id_arma`, `tiros_acertados` y `total_tiros`; SHALL permitir `numero_carril` opcional. SHALL enviar FKs directas, no códigos sustitutos. *Fuente: `contracts/domain-shooting.md:27`.*
- **R-DOM-SHT-018** — WHEN el backend rechaza duplicidad por fracción+usuario, fracción+arma o carril no nulo, THEN SHALL asociar el error al selector o carril correspondiente y SHALL NOT ofrecer el resultado como capturado. *Fuente: `contracts/domain-shooting.md:27`; `requirements.md:R-RUL-03`.*
- **R-DOM-SHT-019** — WHEN se abre el detalle de resultados de fracción, THEN SHALL mostrar pares resultado/usuario/arma de OP-FRC-008. Un `403` mantiene la captura y el detalle separados, indicando falta de autorización para ver detalle. *Fuente: `contracts/domain-shooting.md:40`.*
- **R-DOM-SHT-020** — WHEN se elimina un resultado, THEN SHALL pedir confirmación, esperar éxito y refrescar fracción, resumen y reporte al volver a consultarlos; SHALL no recalcular métricas locales como sustituto de la respuesta del backend.

## Criterio observable de la familia

Una lección puede recorrerse por sus pestañas de fracciones, participantes, resultados, resumen y reporte; la captura sólo usa usuarios y armas retornados y los alcances agregados no se presentan como detalle individual. La hipótesis estática sobre `primary_unit()` de OP-LES-009 se trata como posible error visible, no como funcionalidad inventada. *Fuente: `contracts/domain-shooting.md:35,42`.*
