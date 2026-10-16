---
plan_id: final-frontend-complete-promotion-plan
workstream_id: final-frontend-complete-promotion-plan
spec_id: spec-complete-promotion-001
tier: PROTECTED
created_by: Cunning-Bard
persisted_by: Lore-Master
created_at: "2026-10-05"
updated_at: "2026-10-05"
payload_revision: p1
status: draft
spec_meta: ./spec-meta.yaml
---

# Plan — final-frontend-complete-promotion-plan: promoción completa de usuario temporal

> 🕯️ **Nota de persistencia (`Lore Master`, `p1`, 2026-10-05).** **Cuerpo del plan:** §1–§8 son la transcripción **literal** del `plan_payload` que `Cunning-Bard` entregó en su `HANDOFF` terminal (sesión `ses_ef152b5b2ffeuSkvumZaEz4U9q`): las 8 secciones canónicas en su orden original, con sus listas, tablas, subsecciones `### Fase 0`–`### Fase 7` y voz de autor tal como los escribió. Sin reempaquetado, sin reinterpretación, sin correcciones técnicas, sin renombrado de identificadores y sin cambio de aprobaciones. **§9 Dependencias** y **§10 Referencia a spec** son las **únicas** derivaciones, exigidas por `~/.config/opencode/docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`; el mapeo de los elementos obligatorios de la SSOT queda explícito: `Dependencias` → §9, `Pasos` → §5, `Criterios de aceptación / verificación` → §7, `Riesgos / bloqueos` → §6, `Handoff` → §8, `Referencia a spec` → §10. **Sin tabla de contenidos**, por coherencia con los planes hermanos y porque el cuerpo es transcripción literal. **Identificadores:** `plan_id` y `workstream_id` declaran **el mismo valor por definición** (SSOT: `plan_id: <workstream-id>`); no son dos identificadores distintos. **Ruta declarada por el preflight:** este archivo dentro de la carpeta canónica de la spec (`docs/specs/complete-promotion/`), no `docs/plans/`, porque existe `spec_id` con `spec-meta.yaml` propio (`./spec-meta.yaml:4`). **Resoluciones de `CP-P-01..09`:** §5 Fase 1 **propone** las nueve resoluciones como contenido del autor del plan; esta persistencia **no las resuelve, no las arbitra y no las cierra**. [`spec.md`](./spec.md) §8 sigue declarándolas abiertas (`spec.md:328-336`, `spec.md:383`, `spec.md:428`, `spec.md:474`) y [`index.md`](./index.md) lo repite; ambos documentos quedan **fuera** de este `IN_SCOPE` y **no** se modifican. Su cierre corresponde al orquestador y al Plan Review Gate, no a este artefacto. **Gates de arquitectura pendientes de arbitraje:** la Fase 0 exige revisión de `Arcane Architect` y `Portal Warden`, y la receta de Fase 3 se propone *para* esa decisión. Esa exigencia del autor es un **claim a arbitrar por el orquestador**, no una invocación: esta escritura no despacha ni habilita subagente alguno. **Gate no despachado:** el Plan Review Gate de este `plan_id` **no ha sido activado** — no existe sección `## Plan Review Gate` y el frontmatter **no** declara `review_gate` ni `review_gate_revision` (esas claves pertenecen a la SSOT del gate, `docs/plan-review-gate.md > Frontmatter`). Esta escritura **no** es el checkpoint prelaunch: aún no hay selección congelada ni estado `REVIEWING`. Si el orquestador lo activa después, su primer ciclo será `r1` y este `PLAN_PATH` es su prerequisito duro. **Estado `DRAFT_PERSISTED`, no aprobación:** este archivo **no** autoriza implementación, instalación de dependencias, ejecución por agentes, navegador, shell, seeds, migraciones ni escritura en base de datos; la separación planificación-ejecución permanece dura y la orden explícita del operador sigue siendo necesaria (`./spec-meta.yaml:67-78`, `spec.md` §1.2, §12). **`status: draft`:** primer cuerpo de este `plan_id`; el estado vive aquí como marca de este artefacto y **no** duplica ni mueve el estado de la spec, que sigue en `approved` con `verified_at: null` (`./spec-meta.yaml:7,14`). **Citas de código fuente:** las referencias `archivo:línea` a `models.py`, `serializers.py`, `views.py`, DRF y Django que aparecen en §4, §5 y §6 son **evidencia del autor sobre source leída por `Cunning-Bard`**, transcrita sin comprobarla; esta persistencia **no** releyó ni ejecutó esa fuente y **no** observó runtime. El mismo límite aplica a las anclas de la spec padre citadas en §5 y §7 (`experience/states.md`, `experience/flows.md`, `acceptance/identity.md`). **Documentos no tocados:** [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md) y [`./index.md`](./index.md) de esta spec, y los tres planes de [`../final-frontend/`](../final-frontend/). [`./index.md`](./index.md) no enlaza este plan y su tabla «Orden de lectura» sólo lista `spec.md` y `spec-meta.yaml`; ese drift queda **registrado, no corregido**, en §10 y en `## Historial de revisiones`, porque su corrección no pertenece a este `IN_SCOPE`. **Sin acción técnica:** esta escritura es persistencia documental `TIER: FAST`; no hay comandos, tests, navegador, subagentes, base de datos, migraciones ni verificación de comportamiento.

---

## 1. Objetivo 🎭

Dejo preparado el recorrido completo de promoción: detectar un temporal autorizado, rellenar un formulario editable y confirmar sobre el mismo Usuario, reactivando su Account y conservando Person e historial.

---

## 2. Scope

Delimito este suplemento a la spec `spec-complete-promotion-001`, aprobada con `verified_at: null` (`spec-meta.yaml:4-14`).

Incluyo:
- Preview read-only por RUT, autorizado con `user:create`.
- Alta formal compatible con clientes antiguos y precondición obligatoria en el cliente nuevo.
- Respuesta directa `201` con `creation_outcome` e `is_temporary`; lectura aditiva de esta bandera.
- Validación previa, revalidación transaccional, activación de Account y preservación de relaciones.
- DTOs, validadores y flujo de alta real en `IdentityView.vue`.
- Tests focales nuevos y documentación aditiva del suplemento, mediante sus writers correspondientes.

Mantengo la trazabilidad con FL-IDT-003, T-FL-IDT-003 y AC-OP-USR-002. La spec suplementaria prevalece para el cable nuevo y reserva OP-AZC-004 a personas existentes (`spec.md:247-253`); no copio al alta la referencia antigua a ese selector.

---

## 3. Out of scope

Excluyo:
- Toda ejecución o escritura durante esta planificación.
- Cambios en auth, RBAC general, permisos, seeds, tenant middleware o contratos ajenos.
- Sincronización de Person, cambio de Account.person/tenant/user, nueva Account para el candidato o nuevo Usuario durante una promoción.
- Migraciones, campos/modelos nuevos, auditoría persistente, Service/Repository y modificaciones de infraestructura.
- Cambiar `crear-temporal` para promover o normalizar retrospectivamente RUT existentes.
- Stores, router/guards globales, HTTP compartido, apariencia, stack, dependencias y storage.
- Datos sintéticos en producto, credenciales inventadas y uso de una base real para preparar demostraciones.
- Planes padre base p3/r2, access p2/r2 y remaining p2/r2; metadata, índices y gates padre.

No amplío automáticamente el scope ante un hallazgo. Si completar el objetivo exige tocar Person global, modelos, permisos o configuración DB, detengo ese camino y devuelvo la dependencia concreta al orquestador.

---

## 4. Archivos probables 📜

Todas las rutas son relativas al proyecto. Distingo modificaciones de archivos nuevos propuestos.

| Archivo / zona | Cambio previsto |
|---|---|
| `apipoligono/serializers.py:101-172` | Añadir `is_temporary` RO; serializers específicos de alta/preview que preserven la validación de identidad y distingan ausencia de precondición de null. |
| `apipoligono/views.py:184-328,534-538` | Preview, validación previa, resolución scoped del candidato, escritura atómica y respuesta de resultado. |
| `apipoligono/views.py:103-122` | Sólo si lo requiere preservar histórico: opción acotada del helper para asegurar un tirador activo sin reutilizar silenciosamente una fila histórica inactiva; defaults de otros callers intactos. |
| `apipoligono/tests/test_complete_promotion.py` — nuevo | Casos API, preservación, rollback y concurrencia; reutilizar factories existentes. |
| `front/src/features/identity/api.ts` | DTOs, validadores `unknown`, proyección del body y cliente de preview. |
| `front/src/features/identity/usePromotionPreview.ts` — nuevo | Estado local del preview, snapshot, invalidación y descarte de respuestas tardías. |
| `front/src/components/identity/PromotionPreviewPanel.vue` — nuevo | Presentación del estado/aviso y acción de consulta; sin HTTP ni mutación de props. |
| `front/src/views/identity/IdentityView.vue` | Integración limitada al alta formal, confirmación, fallos, purga y refresco autorizado. |
| `front/tests/focused/identity-promotion-api.test.ts` — nuevo | Contrato HTTP, DTOs, precondición y errores. |
| `front/tests/focused/identity-promotion-flow.test.ts` — nuevo | Interacciones del formulario y carreras de respuestas con dobles test-only. |
| `docs/specs/complete-promotion/spec.md` | Lore Master añade precisiones/trazabilidad; no sustituye entradas anteriores ni declara aceptación. |

No cambio `urls.py`: el router ya registra UsuarioViewSet (`urls.py:39-41`).
No cambio modelos ni helpers globales de scope/permisos.

Confirmé que el formulario actual está en `IdentityView.vue:2518-2537`; `UserFormModal.vue` sólo figura como ruta probable en las tareas y no apareció en la búsqueda dirigida. No planifico contra un componente inexistente.

---

## 5. Pasos / fases 🎵

### Fase 0 — Dependencias y apertura de ejecución

Antes del writer, exijo:
1. Persistencia automática de este payload y Plan Review Gate del suplemento PROTECTED.
2. Revisión requerida de Arcane Architect sobre transacción/preservación y de Portal Warden sobre contrato/prioridades. Su entrega consultiva anterior no acredita estos gates.
3. Comprobación del orquestador de la orden efectiva de implementación, separada de aprobar el diseño.
4. Reserva exclusiva de write sets: backend y consumidor/tests; Lore escribe documentación secuencialmente. Los writers actuales de apariencia/guards no adquieren promoción por proximidad de directorio.

Propongo la receta local de Fase 3 para la decisión de Arcane Architect; no introduzco una arquitectura nueva. Si requiere configuración DB, esquema o un patrón excluido, queda bloqueado ese paso hasta decisión explícita.

### Fase 1 — Congelar contrato y CP-P-01..09

Fijo las siguientes resoluciones para revisión antes de implementar:

| Precisión | Resolución |
|---|---|
| CP-P-01 | Si `expected_id_usuario` está ausente, uso el camino legacy autorizado: nuevo → created; temporal visible → promoted; formal → 400. El cliente nuevo siempre envía la clave. |
| CP-P-02 | `null` significa «el RUT no debe existir», no «sin precondición». Si existe cualquier registro coincidente, respondo 409 uniforme, sin explicar tipo ni ubicación. |
| CP-P-03 | Con clave presente, un formal incumple la precondición: 409. Sin clave, conservo el 400 de duplicado formal. |
| CP-P-04 | Si otro actor promovió el temporal esperado, respondo 409; no creo otra fila ni sobrescribo al ganador. |
| CP-P-05 | Primero permisos/sesión/tenant; después validación de campos → 400; contexto inicial no autorizado → 403; finalmente precondición → 409. Repito las comprobaciones necesarias dentro de la transacción. |
| CP-P-06 | Candidate usa `apellido_paterno` y `apellido_materno`, separados; nunca `apellidos`. |
| CP-P-07 | Devuelvo exactamente los campos necesarios de identidad/formulario dentro del scope; no recorto el formulario ni expongo datos de acceso, asignaciones o Person. |
| CP-P-08 | El 409 es conflicto local en ST-04 con ST-09 conservado; invalida preview y exige reconsulta/nueva confirmación. No reutilizo F-05, reservado a 400 de unicidad, ni añado un catálogo global F-*. |
| CP-P-09 | Muestro `detail` literalmente con interpolación escapada; no traduzco ni reconstruyo el mensaje. |

Anclas: `spec.md:197-225,235-255,261-315,326-336`; `experience/states.md:35-40,94-101,134`; `experience/flows.md:61-70`.

Preciso además:

**RUT.** La canonicalización actual del alta es la de CharField: trim exterior, sin quitar puntos/guiones, cambiar mayúsculas o calcular dígito verificador. DRF admite coerción numérica en este campo; no endureceré por omisión el body legacy válido. Preview reutiliza esa misma conversión/validación, sin unicidad. `crear-temporal` mantiene su `.strip()` actual.
Evidencia: `models.py:126`; DRF `fields.py:733,749-766`; `views.py:552-561`.

**Candidate exacto.** `id_usuario`, `rut`, `grado`, `nombre`, `apellido_paterno`, `apellido_materno`, `correo`, `is_temporary: true`. Respeto null en grado/correo y string en nombre/apellidos. `not_eligible` exige `candidate: null`. Ningún ID ilustrativo de la spec se transforma en dato operativo.

**Precondición.** Ausencia es un sentinel distinto de null. Un ID presente debe ser entero positivo representable por el cliente; rechazo bool, cadenas, fracciones y valores fuera de rango como 400. Resuelvo siempre por RUT, nunca buscando primero el ID recibido.

**Scope.** Reutilizo `get_queryset()`:
- Tenant obligatorio.
- `allowed is None`: visibilidad tenant del admin, incluso sin assignment.
- Set vacío: rama propia que implementa actualmente el listado.
- Set no vacío: assignment activo en unidad permitida, con distinct.
No filtro al candidato por Account activa: el temporal tiene Account inactiva precisamente antes de promoverse.
Evidencia: `views.py:202-219,589-604`; `mixins.py:13-21`.

**No enumeración ajena.** Preview formal/inexistente/fuera de scope tiene idéntica respuesta. Con precondición presente, todos los estados incumplidos usan el mismo 409. En legacy, un temporal no visible se rechaza con error genérico de RUT, sin promoverlo ni indicar dónde existe; no preservo el alcance inseguro de la búsqueda global antigua.

**Contexto inicial.** Conservo los códigos actuales: no-admin sin unidad/rol, unidad inexistente/fuera de rama y rol inexistente → 403. Ausente/null/vacío mantiene el tratamiento vigente. `initial_scope_code` no resuelto actualmente produce None; no invento un 400 ni una política nueva de permisos para cambiarlo. El cliente nuevo sólo ofrece los valores retornados por sus catálogos.
Evidencia: `views.py:269-296`; `IdentityView.vue:1600-1626`.

**Límite de obsolescencia.** ID/RUT/temporalidad/scope no son un número de versión de todos los campos. No prometo detectar cada edición concurrente de nombre/correo. El snapshot de formulario protege coherencia local; una garantía general de versiones exigiría otro contrato.

### Fase 2 — Backend: serializers y preview

Encargo este orden:

1. En `serializers.py`, añadir `is_temporary` a campos y read_only_fields de UsuarioSerializer.
2. Añadir un serializer de alta específico, conservando required/blank/null/max_length/email del modelo. Sólo en create, diferir el UniqueValidator de RUT a la resolución de alta; no quitar unicidad de DB ni modificar PUT/PATCH.
3. Declarar `expected_id_usuario` write-only, opcional sin default, y validar `initial_*` antes de guardar. Consumir esas entradas fuera de los kwargs de modelo.
4. Añadir serializer de preview que valide únicamente RUT con la misma canonicalización y sin consultar unicidad global.
5. En `views.py`, añadir acción `previsualizar_promocion`, `url_path='previsualizar-promocion'`, y mapa explícito a `create`.
6. Consultar temporal sólo desde el queryset scoped, proyectar las claves exactas y emitir `Cache-Control: no-store`. No invocar helpers de escritura ni onboarding.

Hay una discrepancia material del baseline que no oculto: el modelo marca RUT único, el serializer no lo exceptúa y CreateModelMixin llama a `is_valid()` antes de `perform_create`. La fuente local de DRF genera UniqueValidator, que rechaza cualquier RUT existente. Por tanto, la rama de promoción existe en código, pero no doy por demostrado que sea alcanzable por el POST actual.
Evidencia: `models.py:126`; `serializers.py:101-114`; DRF `utils/field_mapping.py:65-85,242-245`, `validators.py:63-74`, `mixins.py:16-21`.

Salida de fase: contrato de lectura y validación implementado, sin afirmar runtime ni promoción completada.

### Fase 3 — Backend: confirmación atómica y preservación

Propongo esta receta para el gate arquitectónico y posterior implementación:

1. Validar body y contexto antes de cualquier save/update/helper. Los PermissionError deben propagarse hasta fuera del bloque atomic antes de convertirse en Response 403.
2. Abrir `transaction.atomic()` para la operación completa; releer RUT, candidato scoped, Account y contexto relevante, sin usar objetos cacheados como autoridad.
3. Evaluar ausencia/null/ID con la tabla de Fase 1.
4. Para promoción, ejecutar una actualización condicional sobre Usuario con predicados exteriores `pk`, RUT e `is_temporary=True`; añadir la elegibilidad mediante subquery scoped, sin convertir esos predicados de estado en una lista de IDs previamente materializada.
5. Exigir exactamente una fila actualizada. Cero filas es conflicto; ninguna continuación con save de una instancia obsoleta.
6. Escribir los campos formales validados, `is_temporary=False`, `is_active=True`, username y onboarding vigente sobre esa misma fila.
7. Reactivar únicamente la Account existente, condicionada por su PK/user/tenant/person capturados y releídos. Sólo cambia `is_active`; si no coincide, abortar toda la promoción.
8. Conservar Person íntegra. Para alta verdaderamente nueva, conservar el get_or_create existente, sin actualizar una Person ya existente.
9. Ejecutar los helpers/contexto inicial dentro de la misma transacción y conservar relaciones previas según el siguiente apartado.
10. Serializar la instancia final y salir del bloque con commit antes de devolver 201 directo, añadiendo `creation_outcome` sólo a la respuesta del alta formal.

**SQLite no recibe garantías imaginarias.** La fuente instalada hereda `has_select_for_update=False`; BEGIN puede ser diferido. La garantía propuesta se apoya en la escritura condicional comprobada y rollback, no en un row lock inexistente.
Evidencia: Django `db/backends/base/features.py:49-52`, `db/backends/sqlite3/base.py:322-332`, `db/models/query.py:1262-1265`, `db/transaction.py:260-299`.

Mantengo el predicado exterior de estado porque el compilador puede trasladar filtros con joins a una subconsulta (`db/models/sql/compiler.py:2074-2137`). El writer y el revisor comprobarán el SQL generado focalmente; una colección de IDs leída antes no sustituye el compare-and-set.

Para alta nueva, la ausencia se revalida dentro de atomic y la unicidad existente resuelve colisiones concurrentes. Tras rollback, sólo una colisión comprobada del mismo RUT/username se traduce conforme al modo recibido: 409 con precondición, 400 legacy. No convierto cualquier IntegrityError de Person, Position o relación en supuesto conflicto de RUT.

Si SQLite impide obtener la serialización necesaria por un conflicto de lock reconocido en este camino, aborto y devuelvo el conflicto seguro previsto por CP-R-02; no reintento la mutación automáticamente. Otros OperationalError no se disfrazan de PROMOTION_STATE_CHANGED.

**Asignaciones y memberships.**
- No borrar, desactivar, reasociar ni reconstruir filas previas.
- Reutilizar una Assignment activa del mismo account/position; no duplicarla por repetir `initial_*`.
- Si ya existe una primaria activa, conservarla; una combinación inicial distinta se añade sin crear otra primaria. Si no existe, la nueva puede ser primaria.
- Invocar `_ensure_unit_membership` con `is_primary=False` cuando ya haya primaria, evitando su democión automática.
- Mantener `_ensure_tirador_assignment`. Su lookup actual puede devolver una fila inactiva (`views.py:118-122`): si ese caso aparece en los tests de promoción, añadir una opción acotada que busque la fila activa y preserve la histórica, sin cambiar defaults de otros callers.
- No reparar duplicados/primarias incoherentes preexistentes silenciosamente: abortar el caso afectado y reportar la anomalía.

Evidencia: `views.py:103-178,311-327`; `apps/identity/models.py:128-150,168-213`. Esos modelos no declaran unicidad de assignment activo ni de primaria; no atribuyo la protección a una constraint inexistente.

Salida de fase: un resultado explícito y transacción completa, sin filas nuevas durante promoción ni alteración de FKs de ResultadoTiro (`models.py:322-339`).

### Fase 4 — Consumidor: contrato TypeScript

Este frente puede avanzar tras congelar Fase 1; la integración real depende de Fase 3.

En `api.ts`:
1. Añadir const objects para estados/outcomes y derivar sus tipos, sin `any`.
2. Añadir PromotionCandidate, PromotionPreview discriminado y CreateUserResponse; mantener interfaces separadas para datos anidados.
3. Añadir `is_temporary: boolean` al DTO/validador general, sin default false cuando falte.
4. Hacer `expected_id_usuario` obligatorio en CreateUserRequest del cliente nuevo y en la proyección del body.
5. Validar preview desde unknown: eligible exige candidato completo, ID válido y bandera true; not_eligible exige null.
6. Validar 201 directo: todos los campos, bandera false y outcome reconocido.
7. Añadir preview mediante `requestJson`; conservar sesión, CSRF, tenant, unidad y AbortSignal del transporte actual.
8. Consumir el 409 desde HttpRequestError existente: status/code/detail provienen del backend, no de un wrapper nuevo.

Anclas: `api.ts:320-460,736-879`; `http.ts:99-190`.
No cambio HTTP compartido ni el consumidor AuthorizationView: éste recibe un DTO aditivo; el typecheck focal del paquete comprobará esa frontera.

### Fase 5 — Formulario, snapshot y confirmación

Mantengo las partes existentes y separo sólo la lógica/presentación nueva:
- IdentityView conserva modal, drafts, catálogos y autorización.
- usePromotionPreview administra estado y snapshot local.
- PromotionPreviewPanel recibe estado/candidato/detail/busy y emite consulta/reconsulta; no accede a stores ni hace HTTP.

Encargo:
1. Consultar preview al terminar de introducir el RUT —blur— y mediante acción explícita de reconsulta. No hacer POST de alta durante detección.
2. Capturar RUT canónico, principal, tenant, unidad, generation, permissionsKey y revisión del modal/RUT junto al resultado.
3. Usar los tickets/AbortController existentes; invalidar primero y abortar después. Un RUT A→B→A o cerrar/reabrir modal también invalida la respuesta anterior.
4. Eligible: rellenar los campos exactos del candidato y mostrar aviso antes del envío; todos siguen editables. No inferir unidad/rol desde el candidate.
5. Proteger ediciones realizadas mientras llega el preview mediante revisión/dirty por campo. Una reconsulta del mismo RUT no sobrescribe silenciosamente valores editados.
6. Al cambiar a otro RUT, descartar snapshot/expected ID y limpiar valores no editados que provenían del candidato anterior; no trasladar PII entre candidatos.
7. Not eligible: mantener alta normal y snapshot con expected null. Ausencia/error/preview pendiente no habilita confirmación.
8. Confirmar sólo con snapshot vigente y catálogos reales válidos. Capturar un body inmutable con campos editados, `initial_*` y expected ID/null; emitir un único POST formal.
9. Bloquear reenvío y edición que pudiera cambiar el body durante saving.
10. Cancelar antes del envío: cerrar, purgar y abortar preview pendiente, sin alta ni preview adicional. No presentar abortar un POST ya enviado como rollback de servidor.

Reutilizo el ciclo de purga de `IdentityView.vue:630-775,1277-1299,2105-2156` y el modal existente. No añado persistencia ni un store nuevo.

Conservo catálogos de `IdentityView.vue:1111-1121`: OP-UNT-010, roles por categoría y catálogo de scopes. No invoco OP-AZC-004 ni una segunda mutación de contexto.

La composición usa los componentes/clases actuales del DS. El writer debe consultar las fuentes externas literales de `AGENTS.md > Regla dura del Design System` para cualquier markup/estilo nuevo; esta lectura de código no acredita equivalencia visual.

### Fase 6 — Fallos, resultado y refresco

Cambio sólo la rama CREATE_USER:
- 400: errores por campo y valores conservados.
- 403 de negocio: detail literal y draft conservado; no aplicar el cierre genérico actual del modal (`IdentityView.vue:1475-1486`). Pérdida real de sesión/contexto conserva la purga existente.
- 409 PROMOTION_STATE_CHANGED: conservar formulario, mostrar detail literal, invalidar snapshot y realizar una sola reconsulta read-only si el contexto/modal sigue vigente. Nunca reenviar el alta; la siguiente confirmación requiere una nueva acción del usuario.
- Error de preview: sin alta fallback ni detección desde la tabla.
- Red/timeout después de alta: resultado incierto, sin replay ni éxito supuesto; conservar el guard existente.

Antes de mostrar éxito, contrastar la respuesta con el snapshot del envío:
- expected ID → outcome promoted, mismo ID/RUT y bandera false.
- expected null → outcome created y bandera false.
Si el 201 es incoherente, tratarlo como fallo de contrato con posible mutación aplicada; no afirmar éxito ni repetir el POST.

Después del 201 válido:
- Mostrar resultado devuelto, no una fila fabricada.
- Refrescar listado/ficha sólo con `user:read`.
- Sin `user:read`, conservar el 201 como autoridad del resultado y no navegar a una ficha que fuerce lectura administrativa.
- No comprobar acceso de la persona promovida modificando la sesión del operador.

Evidencia: `spec.md:241-245`; `IdentityView.vue:1752-1763,1492-1499`.

### Fase 7 — Tests y documentación, después de la orden

Backend escribe sus tests nuevos; consumidor escribe los dos archivos Vitest. No absorbo ni modifico tests existentes de apariencia/guards.

Lore Master añade al suplemento:
- Resoluciones CP-P con anclas y límites de snapshot.
- Contrato/prioridad definitivos tras revisión.
- Relación con FL-IDT-003, AC-OP-USR-002 y T-FL-IDT-003.
- Evidencia de entrega y pendientes observables, sin sustituir entradas anteriores ni declarar passed/verified.

La integración se serializa: backend aditivo primero, consumidor estricto después. El cliente antiguo puede ignorar los nuevos campos; el cliente nuevo no puede depender de un backend anterior sin preview.

---

## 6. Riesgos 🪕

Identifico estos riesgos concretos:

- **Rama actualmente posiblemente inalcanzable por unicidad DRF:** corregir sólo el serializer de alta; conservar constraint y PUT/PATCH.
- **Mutación antes de 403:** hoy Usuario se guarda en `views.py:245-259` antes de validar `initial_*:273-296`; el plan mueve esas validaciones y encapsula todas las escrituras.
- **Account inactiva:** get_or_create no reactiva la existente (`views.py:306-308`); la promoción debe actualizar esa fila, no crear otra.
- **Person compartida:** es global y única por document_id (`identity/models.py:9-39`); preservar íntegramente. La frontera de login leída usa Usuario/Account, no exige sincronizar Person. Esto es evidencia de fuente, no una prueba de login real.
- **Concurrencia SQLite/PostgreSQL:** atomic sin compare-and-set no acredita exclusión. La receta y el SQL generado requieren revisión de Arcane Architect y pruebas focales.
- **Helpers sin constraints suficientes:** evitar duplicados activos y cambios de primaria implícitos dentro del camino de promoción; no refactorizar globalmente.
- **PII:** candidate sólo scoped, no-store y sin logs/storage; cualquier propuesta de recorte o ampliación debe volver al contrato, no aplicarse unilateralmente.
- **UI genérica:** el handler actual cierra 403/409; limitar el cambio al alta formal evita alterar otros editores.
- **Contrato de versiones limitado:** expected ID no detecta toda edición concurrente de campos.
- **Observable bloqueado por entorno:** sin desarrollo autenticado y datos reales autorizados, no puedo acreditar el recorrido de usuario.

**Rollback acotado.**
- Fallo de operación: rollback de toda la transacción; ningún 201 antes de commit.
- Retirada de código: consumidor primero, backend después, preservando cambios ajenos y entradas documentales anteriores.
- No hay down migration ni limpieza de datos.
- Una promoción ya confirmada no se "deshace" volviendo a temporal, borrando Account o reasociando resultados. Esa compensación es otra acción sensible y queda fuera del plan.

---

## 7. Verificaciones

Separaré inspección, pruebas técnicas y resultado de usuario. No intercambiaré sus papeles.

### Inspección — nivel 1

Después de cada fase:
- Write set y diff/lectura focal: cero archivos ajenos, cero migraciones/config/storage.
- Campos exactos, ro flags, sentinel de ausencia y prioridades.
- Preview sin helpers/escrituras; no-store; ninguna consulta por ID arbitrario.
- Atomic abarca Usuario, Account, assignments y membership; errores salen del bloque antes de convertirse en Response.
- Compare-and-set conserva predicado exterior de temporalidad.
- Un único POST formal; OP-AZC-004 ausente del alta; purga de snapshots y respuestas tardías.

### Tests Django focales — nivel 3

Usaré APITestCase/APIClient y factories existentes, sólo sobre DB de test aislada. Propondré estos grupos:

1. Preview eligible y los tres not_eligible indistinguibles; header no-store y ausencia de SQL de escritura durante la petición.
2. Actor create sin read puede previsualizar; sin create, sin tenant o tenant ajeno no obtiene candidato.
3. Scope admin, rama limitada, sin unidades y candidate con Account inactiva; misma semántica del listado.
4. Canonicalización actual de RUT, requeridos/longitudes/email y apellidos separados.
5. Body legacy nuevo/temporal/formal; rechazo genérico de temporal no visible.
6. null nuevo frente a RUT existente; ID correcto/incorrecto/inexistente/formal; tipos inválidos.
7. Combinaciones 400/403/409, incluyendo contexto inválido más precondición obsoleta.
8. 201 directo/outcome/bandera; GET/PUT/PATCH mantienen bandera RO y unicidad.
9. Account misma PK/user/tenant/person y activa; Person sin cambios.
10. Usuario misma PK y todos los ResultadoTiro conservan PK/FK y contenido.
11. Assignments/memberships activos e históricos conservados; sin duplicado activo ni segunda primaria; helper con histórico inactivo.
12. Excepción inyectada después de cada punto de escritura → rollback completo.
13. `crear-temporal` con RUT existente sigue 400 y no promueve.
14. TransactionTestCase con conexiones independientes y coordinación determinista: dos confirmaciones del mismo temporal no producen dos promociones; perdedor/conflicto sin efectos.
15. Colisión de alta nueva, compare-and-set cero filas y lock SQLite reconocido; errores DB no relacionados no se reclasifican arbitrariamente.

No usaré mock del ORM para demostrar atomicidad. SQLite de test en memoria con una conexión no prueba concurrencia entre conexiones: el caso debe ejecutarse en un backend de test aislado adecuado, con autorización específica, sin cambiar la configuración productiva.

### Vitest focal — nivel 3

Conservaré Vitest/jsdom y dobles sólo en tests:
- API real del cliente sobre fetch sustituido: path, sesión/CSRF/tenant/unidad, body y estados HTTP.
- DTOs completos/malformados; correlación eligible/candidate; resultado 201 incoherente.
- Relleno editable, dirty durante preview, RUT A→B→A, cierre/reapertura y respuesta tardía.
- Cancelación sin POST adicional; doble confirmación bloqueada; único body con initial_*.
- 400/403 conservan formulario; 409 muestra literal, reconsulta una vez y no replay.
- Sin read no GET administrativo ni navegación a ficha; con read, refresco posterior al 201.
- Cambio de principal/tenant/unidad/generation/permisos y unmount purgan/desestiman PII.
- Red después del envío no muestra éxito ni permite reenvío automático.

No instalo Vue Test Utils ni otra dependencia: montaré con `createApp`, Pinia/Vue Router disponibles y DOM de jsdom. No mockearé el componente/composable sujeto del test. Restauraré app, fetch, contexto y globals entre casos.

### Typecheck — nivel 4

Typecheck del paquete `front` por el DTO compartido, nuevos SFCs y sus contratos. Mantengo TypeScript 5.9.3 (`package.json:21`) y configuración strict existente. No propongo build ni suite completa por defecto.

Referencias de runner para una ejecución futura expresamente autorizada:
- Raíz, intérprete del proyecto: `python manage.py test apipoligono.tests.test_complete_promotion`.
- `front/`: `pnpm exec vitest run tests/focused/identity-promotion-api.test.ts tests/focused/identity-promotion-flow.test.ts`.
- `front/`: `pnpm typecheck`.

Estos comandos son handoff, no acciones ejecutadas ni autorización de ejecución.

### Gates

Mantengo los requeridos en `spec-meta.yaml:20-30`: tests, security_review, code_review, documentation, Portal Warden, Arcane Architect y QA Goblin. No reasigno Kobold/Hasted por reflejo ni marco gates passed.

El orquestador organiza su revisión con evidencia del suplemento; el plan-review previo no sustituye revisión de código ni comprobación de usuario.

### Observable completo — nivel 2, pendiente de autorización y entorno

Con sesión/contexto y registros reales autorizados:
1. Preview eligible entrega candidato scoped, no-store y sin escritura.
2. Aviso previo visible y formulario relleno pero editable, con DS literal.
3. Cancelar no emite alta ni preview adicional; temporal, Account e historial permanecen iguales.
4. Reabrir, consultar, editar y confirmar emite sólo un POST formal con initial_* y expected ID.
5. 201 promoted devuelve el mismo ID/RUT y bandera false.
6. Account queda activa con PK/tenant/person intactos; Person y resultados previos permanecen íntegros.
7. Con permisos adecuados, historial sigue consultable y la persona promovida puede iniciar sesión por el mecanismo existente, sin inventar ni publicar credenciales.
8. Refresco únicamente con user:read; sin él, resultado visible desde el 201 sin lectura administrativa.
9. Conflicto real muestra detail literal, conserva edición, reconsulta y no reenvía solo.

Tests/build/typecheck no acreditan estos pasos. Mientras el entorno autenticado o los datos reales no estén disponibles, el resultado observable permanece NOT_VERIFIED por el orquestador.

---

## 8. Handoff para Code Transmuter 🎭

Entrego una secuencia, no permiso de ejecución:

1. Esperar persistencia/gate del suplemento, decisión técnica requerida y orden de implementación comprobada por el orquestador.
2. Backend: serializers → preview/views → confirmación transaccional/preservación → tests focales.
3. Consumidor: DTOs/cliente → composable/panel → integración limitada en IdentityView → tests focales.
4. Integrar backend aditivo antes del consumidor estricto; Lore conserva y añade la documentación del suplemento, sin tocar planes padre.
5. Cargar `typescript`, `vue-best-practices`, `vue-router-best-practices` y `pinia`; mantener referencias Vue esenciales y reglas literales del DS. Para pruebas, aplicar el diseño focal de este plan sin instalar infraestructura.
6. Cerrar con inspección focal, pruebas nuevas y typecheck sólo bajo autorización de ejecución correspondiente; si ésta falta, declarar exactamente qué no se ejecutó.
7. Entregar DELIVERED/BLOCKED/FAILED, rutas propias tocadas, evidencia y cuatro declaraciones de Branch Scope Guard. No declarar VERIFIED, no aceptar gates ni confundir pruebas técnicas con el recorrido observable.

Si la preservación de Person/Account, la atomicidad o la fidelidad visual exige salir de los límites descritos, detener ese paso y devolver la dependencia concreta. No convertir el suplemento en una reforma de auth, RBAC o arquitectura.

---

## 9. Dependencias (derivación de la persistencia)

> Derivación exigida por `~/.config/opencode/docs/plan-persistence.md > Estructura obligatoria` (punto 4). Compuesta desde §5 Fase 0, §5 Fase 1 y §5 Fase 7 del cuerpo, y desde las dependencias normativas de la spec. Una línea por dependencia. Estas dependencias **no** están resueltas por esta persistencia.

| # | Dependencia | Origen | Estado al cierre de esta escritura |
|---|---|---|---|
| `DP-1` | `PLAN_PATH` de este plan (`docs/specs/complete-promotion/implementation-plan.md`) como artefacto canónico del workstream `final-frontend-complete-promotion-plan` | SSOT de persistencia | **Resuelta** por esta escritura (`p1`, `DRAFT_PERSISTED`) |
| `DP-2` | Plan Review Gate del suplemento (`TIER: PROTECTED` según §5 Fase 0) | §5 Fase 0, punto 1 | **No despachado.** Sin sección `## Plan Review Gate`, sin claves `review_gate`/`review_gate_revision`. Requisito de fase posterior, no de esta escritura |
| `DP-3` | Decisiones de `CP-P-01..09` (`D-4` en la spec) | §5 Fase 1 | **Propuestas por el autor del plan; pendientes de arbitraje.** La spec las mantiene abiertas (`spec.md:428`, `spec.md:383`); esta persistencia no las cierra |
| `DP-4` | Revisión de `Arcane Architect` sobre transacción/preservación (transacción, compare-and-set, receta de Fase 3) | §5 Fase 0, punto 2; §5 Fase 3; §6 | **Reclamación del plan, no autorización de invocación.** El arbitraje de routing es del orquestador |
| `DP-5` | Revisión de `Portal Warden` sobre contrato y prioridades | §5 Fase 0, punto 2 | **Reclamación del plan, no autorización de invocación.** El diseño read-only previo es evidencia técnica, no veredicto |
| `DP-6` | Comprobación del orquestador de la orden efectiva de implementación, separada de aprobar el diseño | §5 Fase 0, punto 3 | **Pendiente.** La separación planificación-ejecución permanece dura |
| `DP-7` | Reserva exclusiva de write sets (backend; consumidor/tests; documentación por `Lore Master` en serie) | §5 Fase 0, punto 4 | **Pendiente de asignación por el orquestador** |
| `DP-8` | Gates de la spec: `tests`, `security_review`, `code_review`, `documentation` (`required`) y `portal_warden`, `arcane_architect`, `qa_goblin` (`required`) | §5 Fase 7, §7 Gates; `spec-meta.yaml:19-30` | **Ninguno en `passed`.** Ninguno se marca ni se autoriza desde este archivo |
| `DP-9` | Criterios observables (`CP-V-01..16`) ejecutados sobre entorno autenticado y datos reales autorizados | §7 «Observable completo — nivel 2» | **Pendiente de entorno y autorización.** Resultado observable permanece `NOT_VERIFIED` a cargo del orquestador |
| `DP-10` | Planes de la spec padre intactos: base `p3`/`VALIDATED`/`r2`, access `p2`/`VALIDATED`/`r2`, remaining `p2`/`VALIDATED`/`r2` | §3 «Out of scope»; `spec.md:429` (`D-5`) | **Intactos.** No leídos para modificar, no editados, no ampliados |
| `DP-11` | Código de promoción no escrito: sin endpoint de preview, `expected_id_usuario`, `creation_outcome` ni `is_temporary` serializado | `spec.md:430` (`D-6`); §3 | **Fuera de esta escritura.** No se ejecutó ni se verified nada de runtime |
| `DP-12` | Migración de esquema no requerida | `spec.md:431` (`D-7`); §3 | **Fuera de alcance.** Ninguna migración creada ni propuesta por esta escritura |

---

## 10. Referencia a spec (derivación de la persistencia)

> Derivación exigida por `~/.config/opencode/docs/plan-persistence.md > Estructura obligatoria` (punto 9).

**Spec asociada:** `spec-complete-promotion-001` — *Promoción completa de usuario temporal (recorrido íntegro en el cable)*. Es un artefacto auxiliar de esa spec, **no** un spec en sí mismo: no introduce estado, gates, riesgo ni trazabilidad propios.

| Documento | Ruta | Rol respecto a este plan |
|---|---|---|
| Metadata canónica | [`./spec-meta.yaml`](./spec-meta.yaml) | **Fuente única de verdad** del estado de la spec. Este archivo **no** replica ni mueve `spec.status`, fechas, gates, riesgo o trazabilidad |
| Cuerpo contractual | [`./spec.md`](./spec.md) | Contrato que §1–§8 de este plan implementan. Sus identificadores (`CP-*`, `CP-R-*`, `CP-P-*`, `CP-V-*`, `CP-K-*`, `CP-X-*`, `A-*`, `G-*`, `S-*`, `D-*`) se citan **sin renumerar** |
| Mapa documental | [`./index.md`](./index.md) | Índice de la spec. **No enlaza este plan** (ver «Drift registrado» abajo) |
| Spec padre (relación) | [`../final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) | Estado de referencia **por lectura**, declarado en `traceability.related_specs` de esta spec. Fuera de este `IN_SCOPE`; no modificado |
| Plan padre base | [`../final-frontend/implementation-plan.md`](../final-frontend/implementation-plan.md) | `p3`, `VALIDATED`, `r2`. Fuera de alcance (`D-5`) |
| Plan padre acceso | [`../final-frontend/implementation-plan-access.md`](../final-frontend/implementation-plan-access.md) | `p2`, `VALIDATED`, `r2`. Fuera de alcance (`D-5`) |
| Plan padre restante | [`../final-frontend/implementation-plan-remaining.md`](../final-frontend/implementation-plan-remaining.md) | `p2`, `VALIDATED`, `r2`. Fuera de alcance (`D-5`) |

### Estado y límites de lo afirmado

- **Estado del artefacto:** `status: draft` y `payload_revision: p1` en el frontmatter de este archivo. Estado `DRAFT_PERSISTED`.
- **Estado de la spec:** `approved`, `approved_at: 2026-10-05`, `verified_at: null`, ningún gate en `passed` (`./spec-meta.yaml:7,13,14`). La aprobación amplía el **diseño**, no autoriza ejecución (`./spec-meta.yaml:67-78`; [`./index.md`](./index.md) «Límites de lo afirmado»).
- **Casos abiertos:** §5 Fase 1 **propone** resoluciones para `CP-P-01..09`. Este archivo **no** las cierra; la spec las mantiene abiertas (`spec.md:328-336`; [`./index.md`](./index.md)). Su cierre es del orquestador y del gate.
- **Citas de source no verificadas por esta escritura:** todas las referencias `archivo:línea` del cuerpo son evidencia del autor del plan. Esta persistencia no releyó el código fuente del backend ni del cliente, no ejecutó comandos y no observó runtime.
- **Drift registrado, no corregido:** [`./index.md`](./index.md) §«Orden de lectura» (`:44-48`) lista sólo [`./spec.md`](./spec.md) y [`./spec-meta.yaml`](./spec-meta.yaml), y su tabla «Materias por sección» (`:56-70`) no registra este plan; además el índice afirma aún que `CP-P-01..09` siguen abiertos (`:93-94`), lo cual sigue siendo cierto. Añadir este archivo al índice **queda fuera de este `IN_SCOPE`** y no se modifica.
- **Ningún sidecar:** este plan no genera archivos auxiliares, variantes `p2`/`rev-2`, espejos ni duplicados del payload. Si el gate lo exige, las secciones se añaden en este mismo archivo.
- **Documentos que esta escritura no tocó:** [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md) de esta spec y los tres planes de [`../final-frontend/`](../final-frontend/).

---

## Historial de revisiones

### p1 — 2026-10-05 — cuerpo inicial `final-frontend-complete-promotion-plan` (persistencia mecánica `TIER: FAST`, `Lore Master`)

- **Motivo:** persistencia inicial del `plan_payload` de `Cunning-Bard` (sesión `ses_ef152b5b2ffeuSkvumZaEz4U9q`, `HANDOFF` terminal) para `spec-complete-promotion-001`, ya `approved` con `verified_at: null` (`./spec-meta.yaml:7,14`). Es el primer cuerpo de este `plan_id` y el primer artefacto de plan de esta carpeta de spec.
- **Delta breve:** primera versión del archivo. §1–§8 = transcripción literal de las 8 secciones canónicas del payload, con sus tablas, listas y subsecciones `### Fase 0`–`### Fase 7`, checkpoints y anclas `archivo:línea`. §9 y §10 son las dos derivaciones obligadas de la SSOT de persistencia. Frontmatter creado con `payload_revision: p1`, `status: draft`, `tier: PROTECTED` y `spec_meta: ./spec-meta.yaml`. No hay bloque de diff: no existe revisión previa que comparar.
- **Gate:** **no despachado** al cierre de esta escritura. Sin sección `## Plan Review Gate`, sin claves `review_gate`/`review_gate_revision`, sin checkpoint prelaunch y sin veredicto. Esta escritura **no** es el checkpoint prelaunch: no hay selección congelada ni estado `REVIEWING`. Estado `DRAFT_PERSISTED`; `payload_revision` queda en `p1`.
- **Decisiones no tomadas aquí:** las resoluciones propuestas de `CP-P-01..09` (§5 Fase 1) y los gates de `Arcane Architect` / `Portal Warden` (§5 Fase 0, Fase 3) quedan **registrados como contenido del autor del plan**, no resueltos ni arbitrados. La spec los mantiene abiertos.
- **Drift registrado, no corregido:** [`./index.md`](./index.md) no enlaza este plan (`:44-48`, `:56-70`); su corrección queda fuera de este `IN_SCOPE`.
- **No tocado en esta escritura:** [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md) de esta spec y los tres planes de [`../final-frontend/`](../final-frontend/).
- **Acciones técnicas:** ninguna. Sin comandos, tests, navegador, shell, subagentes, base de datos, migraciones ni verificación de comportamiento.