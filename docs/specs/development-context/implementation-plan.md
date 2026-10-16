---
plan_id: development-context-audited-create-only
workstream_id: development-context-audited-create-only
spec_id: spec-development-context-001
tier: PROTECTED
created_by: Cunning-Bard
persisted_by: Lore-Master
created_at: "2026-10-06"
updated_at: "2026-10-06"
payload_revision: p3
review_gate: VALIDATED
review_gate_revision: r1
status: draft
spec_meta: ./spec-meta.yaml
---

# Plan — development-context-audited-create-only: constructor auditado create-only de contexto de desarrollo

> 🕯️ **Nota de persistencia (`Lore Master`, `p3`, 2026-10-06) — supersede las notas de `p1` y de `p2/r2` que quedan debajo.** **Cuerpo del plan:** `§1`–`§8` son la transcripción **literal** del `plan_payload` que `Cunning-Bard` entregó en su `HANDOFF` (sesión `ses_eeec899feffeZiTrrMqhiUxHzx`), con las ocho secciones canónicas en su orden original, sus listas, sus cuatro subsecciones `### 1`–`### 4` de `§5`, sus anclas `archivo:línea` y su voz de autor tal como los escribió: sin reempaquetado, sin reinterpretación, sin correcciones técnicas, sin renombrado de identificadores, **sin residuos de `p1` ni de `p2`** y sin paráfrasis. **`§9 Dependencias`** y **`§10 Referencia a spec`** son las **únicas** derivaciones, exigidas por `~/.config/opencode/docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`. El mapeo de los elementos obligatorios de la SSOT queda explícito: `Dependencias` → §9, `Pasos` → §5, `Criterios de aceptación / verificación` → §7, `Riesgos / bloqueos` → §6, `Handoff` → §8, `Referencia a spec` → §10. **Sin tabla de contenidos**, por coherencia con los planes hermanos y porque el cuerpo es transcripción literal.
>
> 🪶 **Identificadores.** `plan_id` y `workstream_id` declaran **el mismo valor por definición** (SSOT: `plan_id: <workstream-id>`): `development-context-audited-create-only`. No son dos identificadores distintos.
>
> 🪶 **Workstream nuevo sobre la ruta canónica anterior.** Este `plan_id` es **materialmente distinto** del anterior (`final-frontend-development-context-plan`). El ciclo de aquel estaba **terminal** —cerró en `r2` con `OPERATOR_REQUIRED` e `implementation_authorized: no`— y su propio cierre exige que «un plan materialmente nuevo requiere `workstream` y `gate_id` **nuevos**». Este cuerpo se persiste por tanto en el **mismo `PLAN_PATH`** (`docs/specs/development-context/implementation-plan.md`, ruta canónica porque existe `spec_id` con `spec-meta.yaml` propio) y **sin variantes**: cero archivos `-v3`, `-review`, `-p3`, `-rev-2`, sidecars, hashes o espejos. `spec_id` se mantiene: `spec-development-context-001`. Esto **no** es un `retry` del gate anterior ni una reapertura de su ciclo.
>
> 🪶 **`created_at` de este workstream.** `created_at` pasa a `2026-10-06`, la fecha en que este plan nuevo se materializa. El `created_at: 2026-10-05` del workstream anterior **no se borra ni se reescribe**: queda registrado en la entrada `### p1` de `## Historial de revisiones` y en las notas históricas de esta cabecera, que se conservan literales.
>
> 📜 **Las claves `review_gate` y `review_gate_revision` se retiran del frontmatter, y el alcance exacto de esa retirada.** Ambas describían el ciclo **anterior** (`OPERATOR_REQUIRED` / `r2`) y el cuerpo `p2`; **no** describen este cuerpo `p3`. Retirarlas **no** borra, cierra, reabre ni altera aquel ciclo: su evidencia completa —checkpoint `1/4`, feedback `2/4` y cierre `3/4` con su `PLAN_REVIEW_VERDICT` e `implementation_authorized: no`— permanece **íntegra y literal** en `## Plan Review Gate`, y su entrada `### p2` permanece íntegra en `## Historial de revisiones`. Este workstream **no tiene gate iniciado**: no existe `gate_id` nuevo, no hay checkpoint prelaunch, no hay selección congelada, no hay ronda y no hay veredicto. **No** se escribe `NOT_REQUIRED` en ninguna parte de este archivo, y **no** se conserva el veredicto de `p2` como si fuera el veredicto de `p3`. El orquestador leerá `p3` desde este `PLAN_PATH` y emitirá `r1` después, en una escritura de gate **propia y separada**, con su propio presupuesto. Este archivo **no** declara ese gate como despachado ni como no requerido.
>
> 📜 **Lo que las notas siguientes son, y lo que no son.** Las notas fechadas `p1` (2026-10-05) y la reconciliación `p2/r2` (2026-10-06) que quedan debajo describen la persistencia y el ciclo del workstream **anterior**. Se conservan **literales** por ser historia append-only, y **deben leerse como históricas**: ninguna de sus afirmaciones sobre «`§1`–`§8`», sobre `payload_revision`, sobre el gate ni sobre lo que este archivo aprueba describe el cuerpo `p3`. En particular, **no** se afirma que el claim de orden de implementación ausente del workstream anterior (`p1:439`, `checkpoint:577`) llegara a ser verdadero —el arbitraje de `D-seguridad-2` lo **rechazó** por contrariar A-1, que es anterior— y **no** se afirma ninguna vía de recuperación íntegra del texto literal de `p1` ni del de `p2` a partir de un delta: el texto de `p1` ya no está en `§1`–`§8`, el de `p2` tampoco, y no existe en este artefacto un localizador observado que contenga cualquiera de los dos.
>
> 🪶 **Resolución de anclas del cuerpo `p3`.** Las referencias internas del tipo `p2:93-99`, `p2:100`, `p2:101-124,135-145`, `p2:130`, `plan previo:95-124,135-145`, `spec:82-92`, `spec:130`, `identity/apps.py:13-14` y `settings.py:19,99-103` son **anclas del artefacto de origen**, tal como las entregó el autor del plan, y **no** números de línea de este archivo ni de la revisión vigente de la spec. Se conservan literales por fidelidad al payload; ninguna se revalidó ni se re-resolvió aquí.
>
> 🕯️ **Lo que esta persistencia NO aprueba.** Este archivo es **prerequisito**, **no** permiso de implementación. `Lore Master` transcribe y **no** ratifica: la apertura `mode=rw`, la comprobación `PRAGMA database_list`, el preflight total, la sustitución de `bulk_create` por `Position.objects.using("default").create(...)`, la reversión conjunta de contexto y auditoría, ni ninguna otra decisión de `§5`–`§8`. La separación planificación-ejecución se mantiene dura. **Ningún** gate de SDD se declara pasado: [`./spec-meta.yaml`](./spec-meta.yaml) mantiene `tests`, `security_review`, `code_review` y `documentation` en `required`, `spec.status` sigue en `approved` y `verified_at` sigue en `null`.
>
> 📖 **Evidencia transcrita, no revalidada.** Las anclas `archivo:línea` del cuerpo son transcripción de la evidencia del autor del plan sobre source leída por él. Esta persistencia leyó [`./spec.md`](./spec.md), [`./spec-meta.yaml`](./spec-meta.yaml) y [`./index.md`](./index.md) únicamente para alinear identificadores y sincronizar la excepción de `auditlog`; **no** releyó `settings.py`, `identity/models.py`, `identity/apps.py` ni ninguna otra fuente citada en `§4`, `§5`, `§6` o `§7`, **no** ejecutó comandos, **no** consultó la base de datos y **no** corrió tests. La especificación de comportamiento queda donde el autor la dejó: pendiente de verificación.
>
> 🕯️ **Acciones técnicas de esta escritura.** Ninguna. Sin git, shell, comandos, base de datos, tests, navegador, MCP, web, código, subagentes, modelos ni permisos.
>
> 🕯️ **Nota de persistencia (`Lore Master`, `p1`, 2026-10-05).** **Cuerpo del plan:** §1–§8 son la transcripción **literal** del `plan_payload` que `Cunning-Bard` entregó en su `HANDOFF` terminal (sesión `ses_ef14bd703ffeGYluTJPkNYy7tX`): las 8 secciones canónicas en su orden original, con sus listas, subsecciones `### Fase 1`–`### Fase 5`, tablas de derivación, checkpoints y voz de autor tal como los escribió. Sin reempaquetado, sin reinterpretación, sin correcciones técnicas, sin renombrado de identificadores y sin cambio de aprobaciones. **§9 Dependencias** y **§10 Referencia a spec** son las **únicas** derivaciones, exigidas por `~/.config/opencode/docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`. El mapeo de los elementos obligatorios de la SSOT queda explícito: `Dependencias` → §9, `Pasos` → §5, `Criterios de aceptación / verificación` → §7, `Riesgos / bloqueos` → §6, `Handoff` → §8, `Referencia a spec` → §10. **Sin tabla de contenidos**, por coherencia con los planes de [`../final-frontend/`](../final-frontend/) y [`../private-master-helper/`](../private-master-helper/) y porque el cuerpo es transcripción literal.
>
> 🪶 **Identificadores:** `plan_id` y `workstream_id` declaran **el mismo valor por definición** (SSOT: `plan_id: <workstream-id>`); no son dos identificadores distintos.
>
> 🪶 **Ruta declarada por el preflight:** este archivo dentro de la carpeta canónica de la spec (`docs/specs/development-context/`), no `docs/plans/`, porque existe `spec_id` con `spec-meta.yaml` propio; es además la convención de carpeta ya usada por las specs hermanas (`final-frontend/`, `private-master-helper/`, no `spec-*-001/`). Verificado antes de escribir: la ruta estaba libre, sin artefacto previo ni sección de gate huérfana.
>
> 🪶 **`tier` del frontmatter.** El contrato de este `plan_id` declara `tier: PROTECTED` para el workstream; la fase de persistencia se ejecutó con `TIER: FAST` por ser artefacto ya aprobado (SSOT `docs/plan-persistence.md > Cadena obligatoria`, paso 3). Los dos valores no se contradicen: uno califica el workstream, el otro el costo de esta escritura. Se registran ambos en lugar de elegir uno y ocultar el otro.
>
> 🕯️ **Gate no despachado:** el Plan Review Gate de este `plan_id` **no ha sido activado** — no existe sección `## Plan Review Gate` y el frontmatter **no** declara `review_gate` ni `review_gate_revision` (esas claves pertenecen a la SSOT del gate, `docs/plan-review-gate.md > Frontmatter`). No hay checkpoint prelaunch, ni selección congelada, ni veredicto. `payload_revision` queda en `p1` y `status` en `draft`.
>
> 📜 **Lo que esta persistencia NO aprueba.** Las decisiones de §5 Fase 3 —usar `bulk_create` con `ignore_conflicts=False` y `update_conflicts=False` para el `INSERT` de filas nuevas, y no emitir señales de `auditlog` al dejar de usar `objects.create` en `Position`— quedan registradas **como propuestas del autor del plan, pendientes de revisión**. `Lore Master` las transcribe y no las ratifica: esa aprobación no existe en este artefacto, no está en el frontmatter, no aparece en `spec-meta.yaml` y no puede inferirse de la sola persistencia. Cualquier lectura de este archivo como autorización de esas decisiones es una lectura incorrecta. La separación planificación-ejecución se mantiene dura: este archivo es **prerequisito**, no permiso de implementación.
>
> 📖 **Evidencia transcrita, no revalidada.** Las citas `archivo:línea` del cuerpo son transcripción de la evidencia del autor del plan sobre source leída por él. Esta persistencia leyó [`./spec-meta.yaml`](./spec-meta.yaml), [`./index.md`](./index.md) y [`./spec.md`](./spec.md) sólo para alinear identificadores y registrar drift; **no** releyó las fuentes de código citadas en §2, §4, §5, §6 ni §7, no ejecutó comandos, no consultó la base de datos y no corrió tests. La especificación de comportamiento queda donde el autor la dejó: pendiente de verificación.
>
> 🕯️ **Reconciliación de lectoría tras la escritura 3/4 (`p2`, 2026-10-06) — supersede la nota de persistencia `p1` de esta cabecera.** Las afirmaciones de la nota `:19` —que `§1`–`§8` son la transcripción literal del `plan_payload` **terminal** de la sesión `ses_ef14bd703ffeGYluTJPkNYy7tX`, y que `payload_revision` queda en `p1`— eran **verdaderas al cierre de la persistencia `p1`** (`2026-10-05`) y se conservan literales porque el ledger y la cabecera son append-only. Desde la escritura 3/4 quedan **superadas**: `§1`–`§8` son ahora la transcripción literal del `plan_payload_revised` (`p2`) entregado por `Cunning-Bard` en la sesión `ses_eeee25b92ffeipgHeeOVtJ5Yc5` y arbitrado por el orquestador, transcritas sin compactación, reinterpretación ni diseño adicional; `payload_revision` es `p2`; el gate está **cerrado** en `r2` con veredicto `OPERATOR_REQUIRED`; y las escrituras usadas son **3 de 4**. Prevalece `## Plan Review Gate` —subsección `#### Ronda r1 cerrada — cuerpo p2 materializado y veredicto r2`— y `## Historial de revisiones` como estado vigente. El cuerpo literal de `p1` ya **no** está en `§1`–`§8`: fue sustituido por el cuerpo `p2` y **no** se conserva aquí copia íntegra de su texto; `§9`, `§10` y el ledger conservan de `p1` únicamente lo que se cita o se deriva. Por tanto **no** se afirma ninguna vía de recuperación del texto íntegro de `p1`: no existe un localizador observado en este artefacto que lo contenga, y no se inventa ninguno. Esta cabecera **no** autoriza implementación: el veredicto de este ciclo es `implementation_authorized: no`.

---

## 1. 🎭 Objetivo

Propongo completar únicamente el contexto oficial faltante en DBdev, conservando existentes y auditlog para cada nueva Position.
Integro A-1 y la nueva decisión A-2; no afirmo preparación ni verificación de la base.

---

## 2. Scope

Delimito prepare_development_context, tests aislados y documentación mínima por Lore Master.
El write boundary comprende INSERT de Tenant, OrganizationUnit y Position ausentes, más los eventos auditlog CREATE correspondientes exclusivamente a esas Position.
Conservo blueprint, mapping y preservación de p2:101-124,135-145; ningún catálogo ni existente se modifica.

---

## 3. Out of scope

Excluyo usuarios, MASTER, titulares, Assignment, UnitMembership, Person, RBAC global, armerías nuevas, negocio, frontend, modelos y migraciones.
Excluyo ejecutar seeds, init_access_model, init_permissions, reset, upserts, UPDATE/DELETE, desactivar señales o ampliar auditoría a otros modelos.
No incorporo Service/Repository, estado distribuido, retry, marcadores, infraestructura ni cambios de settings, transaction_mode, timeouts o PRAGMAs.
El gate anterior permanece terminal; no reabro su ciclo ni reutilizo su roster.

---

## 4. 📜 Archivos probables

- apps/organizations/management/commands/prepare_development_context.py: único constructor, guardas, preflight y transacción.
- apipoligono/tests/test_prepare_development_context.py: pruebas focalizadas del contrato.
Reservo a Lore Master spec.md y docs/07_MANAGEMENT_COMMANDS.md para sincronización y uso mínimo; ningún source existente requiere edición.
Anclas: settings.py:19,99-103; identity/models.py:63-121; identity/apps.py:13-14; plan previo:95-124,135-145.

---

## 5. 🎵 Pasos / fases

### 1 — Contrato y destino concreto

Mantengo --tenant-code ejercito-demo y --database default obligatorios, revalidados en handle; --check ejecuta todo el preflight sin DML (p2:93-99).
Evito checks globales y checks de migraciones implícitos que puedan abrir conexiones antes de la guarda.
Fijo el archivo autorizado como BASE_DIR / "db.sqlite3", anclado en settings.py:19,99 y p2:130.
Exijo conjuntamente: alias default; ENGINE efectivo django.db.backends.sqlite3; archivo autorizado existente y regular; NAME efectivo resoluble estrictamente al mismo archivo canónico dentro del proyecto.
Rechazo memoria, URI de entrada, backend/alias ajeno, ausencia, archivo no regular o ruta distinta antes de abrir SQLite.
Para impedir creación implícita, la apertura de esta conexión usa mode=rw sobre el archivo comprobado, como parámetro local de apertura; no modifica settings ni configura el entorno.
Compruebo después la ruta main de la conexión mediante PRAGMA database_list de sólo lectura: debe resolver al mismo archivo autorizado. No cambio PRAGMAs ni imprimo configuración/rutas.
Ante cualquier incumplimiento, rechazo antes del preflight de datos y de toda escritura.
A-1 acredita el alcance humano de desarrollo; estas comprobaciones acreditan el destinatario técnico. Ninguna identifica datos de producción por nombre.

### 2 — Preflight completo

Dentro de una única transaction.atomic(using="default", durable=True), preparo todo el write set antes del primer INSERT.
Reutilizo DEFAULT_MILITARY_TREE, UNIT_POSITIONS y los catálogos oficiales de p2:100; nunca invoco sus comandos.
Compruebo códigos reales de Role global activo, ScopePolicy y Permission activo, sin reconstruir permisos ni atribuir is_active a ScopePolicy.
Resuelvo Tenant y árbol padre→hijo; añado puestos para unidades oficiales y adicionales activas del tenant, y ENC sólo para armerías activas existentes elegibles.
Comparo claves naturales, campos de receta, estado, pertenencia, padres, rol, scope, referencias opcionales y unique_holder; valido longitudes, choices, FKs, unicidades y colisiones.
Preservo nombre del Tenant existente, description y demás campos ajenos a la receta; tomo snapshots completos de los existentes leídos.
Clasifico ausencia/coincidencia/contradicción y acumulo todos los conflictos. Una contradicción aborta sin normalizar ni insertar, conforme spec:82-92 y p2:135-145.
--check termina aquí con salida segura y cero escrituras, incluidos eventos auditlog.

### 3 — Inserción auditada y rollback

Tras preflight limpio, revalido ausencias y snapshots; inserto Tenant → unidades padre→hijo → Position por unidad → ENC elegibles.
Para cada Position nueva empleo Position.objects.using("default").create(...), conservando señales y registro auditlog existentes.
Retiro bulk_create para Position y cualquier bypass de auditoría; no fabrico eventos manuales ni asigno un actor personal.
Incluyo las altas auditlog correspondientes en la misma transacción default. Nunca guardo filas reutilizadas.
Conflicto concurrente, unicidad, FK, lock o fallo de auditoría/commit sale de atomic y revierte todas las inserciones propias, incluidos eventos.
Comparo existentes y conjunto final antes de salir; publico éxito y contadores sólo después del commit. Sin retry; segunda pasada sin DML ni nuevos eventos.

### 4 — Tests y uso mínimo

Encargo pruebas unittest/Django con DB aislada real y TransactionTestCase, sin usuarios ni DBdev.
Cubro creación exacta; mezcla/preservación/reejecución; mapping y ENC intra-tenant; catálogo ausente y conflicto tardío sin escrituras.
Cubro un CREATE auditlog por Position nueva, ninguno por reutilización, y rollback conjunto contexto/auditoría ante integridad o lock.
Pruebo las guardas contra SQLite temporal real, incluido archivo ausente que no se crea; helpers privados permiten fixtures, nunca una excepción pública por CLI.
Capturo DML durante el comando, separado del fixture: sólo INSERT autorizados, ningún UPDATE/DELETE ni escritura RBAC.
Escribo estos tests como parte del encargo; su ejecución Django requiere autorización específica todavía ausente.

---

## 6. Riesgos

Mantengo hard #3: Position.role/scope_policy fijan alcance; no altero el mapping oficial (identity/models.py:86-98; spec:130).
La configuración efectiva, archivo y conexión actuales siguen sin comprobarse; la guarda es una condición ejecutable, no evidencia actual.
Un archivo autorizado puede contener datos impropios: no prometo detectarlo por su nombre; conservo separación entre A-1 e identidad técnica.
Mantengo rechazo y rollback ante carreras/locks SQLite, sin protección ficticia por bloqueo de filas.

---

## 7. Verificaciones

Pido inspección focalizada de los dos archivos: guarda antes de conexión/DML, preflight total, mapping, señales intactas y write boundary.
Sólo con autorización específica: python manage.py test apipoligono.tests.test_prepare_development_context --noinput.
No añado suite completa, build, lint ni revisiones generales.
Tras ejecución permitida, el orquestador observa DC-V-01..05 y eventos CREATE asociados únicamente a Position nuevas; tests no sustituyen esa observación.

---

## 8. 🪕 Handoff para Code Transmuter

Encargo constructor → tests escritos, después de persistencia y nuevo gate conforme; los gates aplicables de la spec siguen vigentes, sin proceso adicional.
Limito el writer Python a los dos destinos de §4; no cambio modelos, seeds, settings, auth ni auditoría global.
Para Lore Master: registrar la nueva A-2 distinguiéndola de la fila restrictiva A-2 actual; conservar esa restricción.
Sincronizar DC-X-06 y toda formulación del write boundary con la única excepción: auditlog CREATE de nuevas Position de esta preparación; rollback también incluye esos eventos.
Documentar sólo --check, aplicación, rechazo del destino y alcance create-only. No pedir otra aprobación de A-1/A-2.
Al cerrar implementación, entregar inspección focalizada y tests escritos; declarar ejecución pendiente si continúa sin autorización. No afirmar DB preparada.

---

## 9. Dependencias (derivación de la persistencia)

Derivadas de §5 (`Pasos / fases`) y de las notas del preflight. Una línea por dependencia; ninguna queda satisfecha por este artefacto.

| Dependencia | Naturaleza | Estado |
|---|---|---|
| Alcance aprobado de `spec-development-context-001` ([`./spec-meta.yaml`](./spec-meta.yaml):7, `approved`) con `approved_at` `2026-10-05` (`:13`) | Habilita planificación y revisión; **no** habilita por sí solo la ejecución ([`./spec.md`](./spec.md) §8 `DC-X-01`) | vigente |
| Orden A-1 del operador (respuesta literal «Dale con todo, no existe produccion ni datos reales») sobre crear en DBdev sólo las filas de contexto faltantes | Autoriza **ese** paso de preparación una vez cubiertos requisitos y gates; no una segunda confirmación del mismo setup | vigente, acotada |
| **Decisión de sesión del operador sobre el `auditlog` de las `Position` nuevas** (respuesta literal «Conauditoria»), registrada en [`./spec.md`](./spec.md) §1.2 como fila `A-5` | Autoriza **exclusivamente** los eventos `auditlog` **CREATE** generados al crear las `Position` **nuevas** de esta preparación, dentro de la misma transacción. **No** autoriza ampliar la auditoría a `Tenant`, `OrganizationUnit` u otros modelos, ni datos personales, ni usuarios, `MASTER`, titulares, RBAC global o filas existentes | vigente, acotada |
| Orden explícita del operador para **implementar** el constructor | Ya existía y sigue existiendo; el arbitraje de `D-seguridad-2` del ciclo anterior la reconcilió como **requisito del mismo paso** cubierto por A-1, no como encargo separado. Este plan **no** crea una orden nueva | vigente, no es orden nueva |
| Autorización expresa para el Nivel 3 (§7: `manage.py test` focalizado) | Requisito de §5 fase 4; su gate `tests: required` no lo preautoriza y A-1 tampoco lo cubre. El propio cuerpo `p3` lo declara ausente | **ausente** |
| Gates `security_review`, `code_review`, `tests` y `documentation` ([`./spec-meta.yaml`](./spec-meta.yaml):19-23, `required`) | Sin resultados asumidos; el cuerpo `p3` los mantiene vigentes | no despachados |
| `docs/07_MANAGEMENT_COMMANDS.md` (§4, reserva a `Lore Master`) | Destino documental del uso mínimo que pide §8; **no** se escribe en esta fase | sin crear |
| Spec relacionada `spec-private-master-helper-001` ([`./spec-meta.yaml`](./spec-meta.yaml):42) | Workstream del auxiliar privado; independiente (§3) | independiente |
| Spec padre `final-frontend` y planes `access` / `remaining` | Fuera de alcance (§3); metadata e índices no reasignados | no tocados |
| Fuentes citadas en §4 y §6 (`settings.py`, `identity/models.py`, `identity/apps.py`, catálogos oficiales) | Transcritas del autor del plan; **no** revalidadas en esta persistencia | sin relectura |
| Estado real de DBdev (backend efectivo, ubicación del archivo, tablas, triggers, conexión) | Precondición declarada en §5 fase 1; el propio cuerpo `p3` la declara **no comprobada** | **no verificada** |
| Plan Review Gate del workstream **anterior** `prg-final-frontend-development-context-plan` | Ciclo **terminal**: cerró en `r2` con `OPERATOR_REQUIRED` e `implementation_authorized: no`. No se reabre, no se re-despacha, y su veredicto **no** habilita este cuerpo `p3` | **cerrado** `r2` |
| Plan Review Gate de este workstream `development-context-audited-create-only` | Este `PLAN_PATH` es su **prerequisito duro**; el orquestador lo despachará después de leer `p3`, en una escritura propia. No hay `gate_id`, ni checkpoint, ni ronda, ni veredicto | **no iniciado** |

> 🕯️ **Aclaración de A-1, append-only (escritura 3/4, `p2`/`r2`) — HISTÓRICA respecto de `p3`.** Esta aclaración se añade, **no sustituye** las afirmaciones previas del ledger, que se conservan literales en sus subsecciones. Todo lo que sigue se conserva literal por ser historia append-only y **no** describe el cuerpo `p3`. Lo que gobierna el cuerpo `p3` es la tabla de dependencias de arriba y las aclaraciones que la siguen.
>
> - **Qué autoriza A-1.** La pregunta/respuesta de A-1 («¿Autorizas un paso nuevo y acotado para crear el contexto de la receta sólo donde falte, sin reinicializar RBAC ni alterar usuarios o titulares existentes?» · «Dale con todo, no existe produccion ni datos reales») autoriza **el mismo paso de preparación**, incluidos sus requisitos: planificación, **implementación del constructor acotado** y revisión. No es una aprobación de diseño únicamente y **no exige repetir la confirmación** de ese mismo setup.
> - **Claim superado.** El claim de orden de implementación ausente que el cuerpo `p1` afirmaba (fila `§9` de `p1`, citada como `p1:439` en §8 del cuerpo `p2`) y que el checkpoint de `r1` repitió en su nota de alcance (`checkpoint:577`) queda **superado**: no es una dependencia abierta. Se conservan literales en sus lugares de origen por ser el ledger append-only.
> - **Qué NO significa la frase del ledger.** La frase de `feedback:662` —«A-1 **existe** […] el ledger no la crea, no la extiende y no la convierte en permiso de implementación»— afirma que **el ledger no crea permiso**; **no** afirma que A-1 falte. Leerla como ausencia contradice el arbitraje de `D-seguridad-2`.
> - **Lo que A-1 no cubre.** A-1 **no** autoriza: (a) ejecutar los tests Django nuevos —requiere autorización expresa, su gate `tests: required` no la concede; (b) la **decisión de riesgo** sobre la excepción de auditoría de `D-seguridad-1`, que es una decisión de riesgo/alcance humana independiente; (c) ejecutar `INSERT` alguno mientras `D-seguridad-1` siga `unresolved`; (d) `MASTER`, credenciales, titulares, RBAC global o cambios sobre filas existentes.
> - **Base de la aclaración.** Disposición `accept` del orquestador sobre `D-seguridad-2` y materialización del arbitraje en el cuerpo `p2` §5 Fase 1, §5 Fase 5 y §8. `Lore Master` transcribe y registra; **no** amplía `A-1` por sí mismo.
>
> 📜 **Reconciliación de lectoría de esa aclaración (append-only, escritura de `p3`).** La frase «el veredicto vigente del gate es `OPERATOR_REQUIRED` con `implementation_authorized: no`» era válida mientras el gate de este archivo era el del workstream anterior. Desde esta escritura queda **superada**: el workstream es `development-context-audited-create-only` y **su gate no ha comenzado**, de modo que **no** hay veredicto vigente. El `OPERATOR_REQUIRED` con `implementation_authorized: no` sigue siendo el veredicto **histórico y terminal** del ciclo `prg-final-frontend-development-context-plan`, conservado íntegro en `## Plan Review Gate`, y **no** se transfiere ni se reinterpreta como veredicto del cuerpo `p3`. La conclusión de la aclaración —«la separación planificación-ejecución permanece dura»— **sí** sigue vigente y se refuerza: el cuerpo `p3` no habilita implementación.
>
> 📜 **Dos etiquetas `A-2` distintas, y por qué la fila nueva de la spec es `A-5`.** El cuerpo `p3` llama «la nueva decisión A-2» (§1, §8) a la decisión de esta sesión sobre el `auditlog` de las `Position` nuevas. Ésa es una **etiqueta de sesión del plan** y **no** es la fila `A-2` de [`./spec.md`](./spec.md) §1.2, que es la **restricción** original del operador —«crear sólo lo faltante de la receta oficial; `reset`, RBAC, usuarios, titulares, asignaciones y membresías quedan fuera»— y que **se conserva íntegra, sin modificar y sin reemplazarse**. En la spec los identificadores `A-1` a `A-4` ya estaban ocupados antes de esta decisión (`A-3` es el mapa técnico del especialista de mapa y está citado en [`./spec.md`](./spec.md) §9), de modo que registrar aquí una segunda fila `A-3` duplicaría un identificador ya citado por el propio documento; la decisión se registra con el **siguiente identificador libre, `A-5`**. Equivalencia: **`A-5` de la spec ≡ «la nueva decisión A-2» del cuerpo `p3`**. `Lore Master` registra la equivalencia; **no** renumera, **no** reemplaza y **no** reinterpreta ninguna fila previa.
>
> 🪶 **Lo que la decisión de `auditlog` acota y lo que no.** Cubre exclusivamente los eventos `auditlog` **CREATE** de las `Position` **nuevas** creadas por esta preparación, y su reversión conjunta. **No** cubre: eventos de `Tenant` u `OrganizationUnit`, ni de cualquier otro modelo; operaciones sobre filas existentes; `UPDATE`/`DELETE`/`upsert`; desactivar, reconfigurar o silenciar el `auditlog` global; registrar auditoría de forma manual; asignar un actor personal; datos personales; usuarios, `MASTER`, titulares, RBAC global; ni ampliarse a otros entornos o bases. El `write boundary` de §2 y la reversión de §5 fase 3 se leen **sujetos a esta acotación**, y `DC-X-06` de la spec queda acotado en el mismo sentido y sólo en él.

---

## 10. Referencia a spec (derivación de la persistencia)

| Artefacto | Ruta | Estado leído / editado en esta fase |
|---|---|---|
| Metadata canónica | [`./spec-meta.yaml`](./spec-meta.yaml) | **Leída, no editada.** `status: approved` (`:7`), `created_at`/`updated_at`/`approved_at` `2026-10-05` (`:12-13`), `verified_at: null` (`:14`), `risk.level: medium` con flags `multi-tenant`, `permissions`, `data-integrity` (`:34-38`), gates `tests`/`security_review`/`code_review`/`documentation` = `required` (`:20-23`), `specialist_reviews` en `n/a` (`:26-32`), `related_specs` → `spec-private-master-helper-001` (`:42`). **No contiene** ninguna formulación de write boundary que excluya los eventos `auditlog` CREATE autorizados: sus notas de trazabilidad enumeran `DC-X-02..07` sin nombrar `logs` ni `auditlog`, por lo que **no** requirió edición |
| Cuerpo de la spec | [`./spec.md`](./spec.md) | **Leída y editada**: se añadió la fila `A-5` en §1.2 con la decisión humana exacta, se acotó `DC-X-06` con la única excepción autorizada, se declaró el `auditlog` dentro del write boundary de §1.1 y se declaró su reversión conjunta en `DC-R-02`, y se añadió el límite correspondiente en §9. `A-1`, `A-2`, `A-3`, `A-4`, `DC-X-01..05`, `DC-X-07`, `DC-R-01`, `DC-R-03..07`, `DC-V-01..05`, `status: approved`, `approved_at` y `verified_at: null` quedan **intactos** |
| Índice de la spec | [`./index.md`](./index.md) | Leído sólo para alinear identificadores. **No** editado: la corrección de su afirmación sobre la ausencia de plan sigue siendo ajena al `IN_SCOPE` de esta fase |
| Spec padre | [`../final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) · [`../final-frontend/index.md`](../final-frontend/index.md) | **no** modificada ni reasignada en esta fase |
| Plan hermano (referencia de convención) | [`../private-master-helper/implementation-plan.md`](../private-master-helper/implementation-plan.md) | Referencia de convención de frontmatter, orden de secciones y formato del historial; no editado |

> 📜 **Drift registrado, no corregido (fuera del `IN_SCOPE` de esta fase).** La existencia de este archivo deja desactualizada una afirmación del índice de la spec que declaraba su ausencia:
>
> - [`./index.md:40`](./index.md) — «No existe plan de implementación para este constructor; la aprobación de alcance no lo sustituye».
>
> No se edita aquí: la corrección del índice de la spec pertenece a otro workstream con su propio `IN_SCOPE`. Sigue registrado como riesgo documental abierto, **no** como hecho consumado, y su corrección requiere workstream propio. Obsérvese que el resto de las afirmaciones del índice **sigue siendo cierto** —el constructor **no** existe y la aprobación de alcance no lo sustituye—; lo que cambió es únicamente la existencia de un artefacto de plan, que es precisamente lo que el gate debe examinar. La existencia de este archivo tampoco satisface el gate de este workstream, que no ha comenzado.
>
> 🕯️ **Límite de lo afirmado por esta escritura `p3`.** Este archivo **no** afirma que `prepare_development_context.py` exista ni que esta persistencia comprobara su ausencia en runtime; **no** afirma que los criterios `DC-V-01..05` hayan sido observados; **no** afirma que algún gate esté superado —ni el de este workstream, que no existe todavía, ni los gates de SDD, que siguen `required`—; **no** afirma que la base de desarrollo esté preparada; y **no** afirma que la identidad efectiva de DBdev esté acreditada. Ninguna fuente de código fue leída ni ejecutada aquí. Las decisiones técnicas de `§5` —el predicado de destino, `mode=rw`, `PRAGMA database_list`, el preflight total, `Position.objects.using("default").create(...)` en lugar de `bulk_create` y la reversión conjunta— son **contenido transcrito del autor del plan**, no decisiones ratificadas por esta persistencia. La decisión humana sobre `auditlog` que este archivo registra es una **decisión de alcance** que acota qué podrá escribirse cuando exista la autorización de ejecución; **no** es esa autorización.
>
> 🕯️ **Límite de lo afirmado por esta persistencia — HISTÓRICO, Closure sobre `p2` y `p1`.** Se conserva literal y **no** describe el cuerpo `p3`: Este archivo **no** afirma que `prepare_development_context.py` exista (no existe: §4 lo declara propuesto y su ausencia fue confirmada por el autor), que sus criterios `DC-V-01..05` hayan sido observados, que ningún gate esté superado, que la base de desarrollo esté preparada ni que las propuestas de §5 Fase 3 hayan sido aprobadas. Ninguna fuente de código fue leída ni ejecutada aquí. Las decisiones `bulk_create` y ausencia de efectos `auditlog` son **propuestas pendientes de review**, registradas como tales en la nota de persistencia y en §8.
>
> 🕯️ **Reconciliación de lectoría tras la escritura 3/4 (`p2`/`r2`) — append-only e HISTÓRICA respecto de `p3`.** La frase inmediatamente anterior, «Las decisiones `bulk_create` y ausencia de efectos `auditlog` son **propuestas pendientes de review**», era verdadera al cierre de `p1` (`2026-10-05`) y se conserva literal. Desde el cierre de `r2` queda **superada en cuanto al estado de revisión, y sólo en eso**: ambas propuestas **sí** fueron revisadas por el eje `seguridad` y la revisión **no** las aprobó. `D-seguridad-1` resultó **`unresolved`** —la excepción acotada propuesta en §5 Fase 3 no está acreditada como compatible con `docs/11_SEGURIDAD.md:284,294`, que describe «cada modificación» de `Position`— y el veredicto del ciclo es `OPERATOR_REQUIRED` con `implementation_authorized: no`. El cuerpo `p2` mantiene `bulk_create` como **propuesta condicionada** y detiene el camino de escritura hasta decisión expresa del operador. Por tanto, «pendientes de review» debe leerse ahora como «revisadas y pendientes de decisión de riesgo», que es un estado **más restrictivo**, nunca una aprobación. El resto del límite anterior —constructor inexistente, criterios no observados, ningún gate superado, base no preparada, ninguna fuente leída ni ejecutada— sigue vigente sin cambios.

---

## Historial de revisiones

### p1 — 2026-10-05 — cuerpo inicial `final-frontend-development-context-plan` (persistencia mecánica `Lore Master`)

- **Motivo:** persistencia inicial del `plan_payload` de `Cunning-Bard` (sesión `ses_ef14bd703ffeGYluTJPkNYy7tX`, `HANDOFF` terminal) para `spec-development-context-001` ya aprobada ([`./spec-meta.yaml`](./spec-meta.yaml):7). Es el primer cuerpo de este `plan_id` y el primer artefacto de plan de esta spec.
- **Delta breve:** primera versión del archivo. §1–§8 = transcripción literal de las 8 secciones canónicas del payload, con sus subsecciones `### Fase 1`–`### Fase 5`, tablas de árbol y mapping, checkpoints y anclas `archivo:línea`. §9 y §10 son las dos derivaciones obligadas de la SSOT de persistencia. Frontmatter creado con `payload_revision: p1`, `tier: PROTECTED` (workstream) y `status: draft`. No hay bloque de diff: no existe revisión previa que comparar.
- **Gate:** **no despachado** al cierre de esta escritura. Sin sección `## Plan Review Gate`, sin claves `review_gate`/`review_gate_revision`, sin checkpoint prelaunch y sin veredicto. `payload_revision` queda en `p1`.
- **No tocado en esta escritura:** [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md), los planes de [`../final-frontend/`](../final-frontend/) y [`../private-master-helper/`](../private-master-helper/), `docs/07_MANAGEMENT_COMMANDS.md` y el código fuente. El drift de `index.md:40` queda registrado en §10, no corregido.
- **Acciones técnicas:** ninguna. Sin comandos, tests, navegador, subagentes, base de datos ni verificación de comportamiento.

### p2 — 2026-10-06 — cuerpo revisado por el Plan Review Gate (`Lore Master`, escritura 3/4)

- **Motivo:** materialización del `plan_payload_revised` que `Cunning-Bard` entregó tras `D-seguridad-1` y `D-seguridad-2` (sesión `ses_eeee25b92ffeipgHeeOVtJ5Yc5`, eco `payload_revision_out: p2`), y cierre del ciclo `prg-final-frontend-development-context-plan` en `r2` con veredicto `OPERATOR_REQUIRED`. Es la **tercera** de las cuatro escrituras que el gate autoriza sobre este `PLAN_PATH` y la única que incrementa `payload_revision`: `p1` → `p2`.
- **Delta breve:** `§1`–`§8` transcritas **literalmente** del `plan_payload_revised`, sin compactación nueva, reinterpretación, correcciones técnicas ni diseño añadido; se conservan las 8 secciones canónicas, las cinco `### Fase 1`–`### Fase 5`, las tablas de árbol y de mapping y las subsecciones `### Cambios r1` de `§5`, `§6`, `§7` y `§8`. El contenido compacta la prosa de `p1` sin retirar requisitos, casos, observables ni anclas `archivo:línea`; las únicas decisiones nuevas son las de `D-seguridad-1` y `D-seguridad-2`. `§5` Fase 3 pasa a declarar la excepción de auditoría como **propuesta condicionada y no autorizada**, con `D-seguridad-1` en `unresolved`; `§5` Fase 1 y Fase 5 y `§8` reconocen la continuidad de A-1. `§9` y `§10` se sincronizan desde el cuerpo nuevo y la base A-1 (fila de implementación `superada`, fila del gate `cerrado`, dependencia nueva de decisión de riesgo, aclaración A-1 y reconciliación de «pendientes de review»), con las afirmaciones previas conservadas literales.
- **Gate:** cierra `r2` con `verdict: OPERATOR_REQUIRED`, `directives_total: 2`, `accepted: 2`, `unresolved: 1`, `discarded: 1`, `deferred_axes: none`, `unverified_axes: [calidad-correctitud]` e `implementation_authorized: no`. El frontmatter pasa a `payload_revision: p2`, `review_gate_revision: r2`, `review_gate: OPERATOR_REQUIRED`, `updated_at: "2026-10-06"`.
- **Conservado literal:** el checkpoint `1/4` y el feedback `2/4` de `r1` (`FEEDBACK_PERSISTED`) y la entrada `### p1` de este historial. No se reescriben, no se recalculan ni se completan.
- **No tocado en esta escritura:** [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md) (incluido el drift de `index.md:40` registrado en §10), los planes de [`../final-frontend/`](../final-frontend/) y [`../private-master-helper/`](../private-master-helper/), `docs/07_MANAGEMENT_COMMANDS.md` y el código fuente. `status: draft` intacto.
- **Pendiente del operador:** la decisión de riesgo sobre `D-seguridad-1` (mantener `auditlog` para las nuevas `Position` —reformulando el límite que excluye logs— o admitir una excepción expresa y limitada). No habilita `INSERT` ni valida el plan.
- **Acciones técnicas:** ninguna. Sin comandos, tests, navegador, subagentes, base de datos, git, web ni verificación de comportamiento; sin lectura de las fuentes de código citadas en el cuerpo. Escritura única sobre este `PLAN_PATH`: **no** es una cuarta escritura ni produce archivos adyacentes, hashes o sidecars.

### p3 — 2026-10-06 — cuerpo nuevo `development-context-audited-create-only` (`Lore Master`, persistencia mecánica)

- **Motivo:** persistencia del `plan_payload` **materialmente nuevo** que `Cunning-Bard` entregó tras la decisión del operador sobre el `auditlog` de las `Position` nuevas (sesión `ses_eeec899feffeZiTrrMqhiUxHzx`). Es un **workstream nuevo** —`development-context-audited-create-only`—, **no** una revisión del anterior: el ciclo `prg-final-frontend-development-context-plan` estaba **terminal** (`r2`, `OPERATOR_REQUIRED`, `implementation_authorized: no`) y su propio cierre exige que «un plan materialmente nuevo requiere `workstream` y `gate_id` nuevos». **No** es un `retry` de ese gate, **no** reabre su ciclo y **no** altera su veredicto.
- **Delta material frente a `p2` — dos diferencias de fondo**, según el propio autor del plan. (1) **Señales de `auditlog` intactas:** `§2` declara los eventos `auditlog` CREATE correspondientes **exclusivamente** a esas `Position` nuevas como parte del write boundary; `§5` fase 3 **retira `bulk_create`** para `Position` y vuelve a `Position.objects.using("default").create(...)`, conservando señales y registro `auditlog` existentes, sin fabricar eventos manuales ni asignar un actor personal, e incluye esas altas en la **misma transacción** `default`; la reversión cubre también los eventos. `§5` fase 4 incorpora la cobertura de un `CREATE` `auditlog` por `Position` nueva, ninguno por reutilización y la reversión conjunta; `§7` añade la observación de eventos `CREATE` asociados únicamente a `Position` nuevas. (2) **Predicado de DB ejecutable:** `§5` fase 1 sustituye la acreditación no concretada por un predicado conjunto y comprobable —alias `default`, `ENGINE` efectivo `django.db.backends.sqlite3`, archivo autorizado `BASE_DIR / "db.sqlite3"` existente y regular, `NAME` efectivo resoluble estrictamente al mismo archivo canónico dentro del proyecto—, con apertura `mode=rw` para impedir la creación implícita y comprobación posterior de la ruta `main` por `PRAGMA database_list` de sólo lectura, **sin** cambiar `settings`, `transaction_mode`, timeouts ni `PRAGMAs`.
- **Estructura del cuerpo:** `§1`–`§8` transcritas **literalmente** del `plan_payload` recibido, sin reempaquetado, reinterpretación, correcciones técnicas ni diseño añadido; **sin residuos de `p1` ni de `p2`** y sin paráfrasis. Se conservan las ocho secciones canónicas y las cuatro subsecciones `### 1`–`### 4` de `§5`. Los bloques `### Cambios r1` de `p1`/`p2` y las tablas de árbol y de mapping **no** se replican: no pertenecen a este payload. `§9` y `§10` son las dos derivaciones obligadas de la SSOT de persistencia y se reescriben desde el cuerpo nuevo y la decisión vigente.
- **Frontmatter:** `plan_id` y `workstream_id` pasan a `development-context-audited-create-only`; `payload_revision: p3`; `tier: PROTECTED`; `status: draft`; `created_at` y `updated_at` `2026-10-06`; `spec_id` y `spec_meta` **sin cambio**. Las claves `review_gate` y `review_gate_revision` **se retiran** porque describían el ciclo `p2` anterior, no este cuerpo; el alcance de esa retirada queda explicado en la nota de persistencia `p3` de la cabecera. **No** se escribe `NOT_REQUIRED` en ninguna parte del archivo y **no** se conserva el veredicto de `p2` como veredicto de `p3`. `created_at: 2026-10-05` del workstream anterior no se borra: queda en la entrada `### p1` de este historial.
- **Gate:** **no iniciado**. No hay `gate_id` para este workstream, ni checkpoint prelaunch, ni selección congelada, ni ronda, ni `PLAN_REVIEW_VERDICT`. El orquestador leerá `p3` desde este `PLAN_PATH` y emitirá `r1` después, en una escritura de gate **propia y separada**, con presupuesto propio. **Esta fase no abre ni cierra ningún gate** y no consume ninguna de las cuatro escrituras del ciclo anterior.
- **Conservado literal:** la sección `## Plan Review Gate` **completa** del ciclo anterior (checkpoint `1/4`, feedback `2/4` y cierre `3/4` con su `PLAN_REVIEW_VERDICT` e `implementation_authorized: no`), las entradas `### p1` y `### p2` de este historial y las notas históricas de la cabecera. Nada de eso se reescribe, recalcula ni completa; las notas que quedaron desalineadas respecto de `p3` se marcaron como **históricas** mediante rótulos añadidos, sin tocar su texto.
- **Aclaración de etiquetas:** el cuerpo `p3` llama «la nueva decisión A-2» a la decisión de sesión sobre `auditlog`. La fila restrictiva `A-2` de [`./spec.md`](./spec.md) §1.2 **no** se reemplaza y se conserva íntegra. La equivalencia de identificadores y el motivo de registrar la decisión nueva como `A-5` quedan explicados en §9.
- **Sincronización de la spec (misma fase, mismo `write set`):** se editó **únicamente** [`./spec.md`](./spec.md), y **sólo** en las formulaciones que excluían los eventos `auditlog` CREATE de las `Position` nuevas: fila `A-5` en §1.2 con la **autorización humana exacta**, `DC-X-06` acotado con la única excepción, write boundary de §1.1 y reversión conjunta en `DC-R-02`, más el límite de §9. **No** se extendió la excepción a `Tenant`, `OrganizationUnit` ni otros modelos, ni a datos personales, usuarios, `MASTER`, titulares, RBAC global o filas existentes; **no** se desactivó ni reconfiguró la auditoría global. `status: approved`, `approved_at`, `verified_at: null`, `A-1`, `A-2` y el resto de requisitos quedan **intactos**. [`./spec-meta.yaml`](./spec-meta.yaml) **no** se editó: no contiene write boundary textual incompatible con la excepción, y su `ownership.updated_at` (`2026-10-05`) queda **desactualizado respecto de la edición de `spec.md`**, lo que se reporta como riesgo documental abierto para su propio workstream. [`./index.md`](./index.md) **tampoco** se editó: está fuera del `write set` de esta fase.
- **Drift no corregido:** [`./index.md`](./index.md):40 sigue declarando que no existe plan de implementación, y `spec-meta.yaml` conserva un `updated_at` anterior a la edición de `spec.md`. Ambos quedan **fuera del `write set`** de esta fase y se reportan como riesgos documentales abiertos para sus propios workstreams. Tampoco se editaron los planes hermanos, la spec padre, `docs/07_MANAGEMENT_COMMANDS.md` ni el código fuente; `docs/07_MANAGEMENT_COMMANDS.md` queda pendiente porque el uso mínimo que pide `§8` no se escribe en esta fase.
- **Pendiente:** el gate de este workstream, que el orquestador despachará después de leer `p3`. Hasta entonces este cuerpo **no** habilita implementación: los gates `security_review`, `code_review`, `tests` y `documentation` siguen `required`, `verified_at` sigue en `null` y la autorización del Nivel 3 sigue ausente.
- **Acciones técnicas:** ninguna. Sin git, shell, comandos, base de datos, tests, navegador, MCP, web, código, subagentes, modelos ni permisos; sin lectura de las fuentes de código citadas en el cuerpo. Escritura **única** sobre este `PLAN_PATH`: **no** produce variantes, sidecars, hashes ni archivos de estado.

---

## Plan Review Gate

> 🕯️ **Ledger del gate `plan-review`.** Sección **append-only**, propiedad del `Plan Review Gate` y escrita por `Lore Master` como writer único y secuencial sobre este mismo archivo. Es un ledger de eventos del gate: **no** es cuerpo del plan, **no** incrementa `payload_revision` por sí mismo y **no** se replica en `## Historial de revisiones`. En este gate el trabajo del ledger se divide en dos secciones durables separadas: esta (`## Plan Review Gate`) y la del historial del cuerpo (`## Historial de revisiones`), que registra los cambios de `pN → pN+1` y no los eventos de gate. La política que gobierna esta sección es [`~/.config/opencode/docs/plan-review-gate.md`](../../../../../.config/opencode/docs/plan-review-gate.md) (SSOT, lectura read-only en esta escritura). **Ningún veredicto de este gate autoriza implementación**; el gate es un contrato documental y la separación planificación-ejecución permanece dura.

### Ciclo `prg-final-frontend-development-context-plan` — 2026-10-06 — checkpoint prelaunch (`REVIEWING`, sin veredicto)

> 🕯️ **Alcance de esta escritura (1 de 4).** Checkpoint durable prelaunch de entrada a `REVIEWING`, escrito por `Lore Master` como writer único y secuencial de este `PLAN_PATH`, por delegación explícita del orquestador. Es la **primera** de las cuatro escrituras que el gate autoriza sobre este archivo. No es cuerpo del plan: **no** incrementa `payload_revision` (replica `p1`), **no** se replica en `## Historial de revisiones`, **no** toca `§1`–`§10` ni la entrada `### p1`, **no** mueve `status: draft`, **no** abre ni modifica spec, `spec-meta.yaml`, índice, ADR, bug ni plan hermano, y **no** declara veredicto. Los reviewers **no** fueron despachados por esta escritura.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-final-frontend-development-context-plan` |
| `PLAN_PATH` | `docs/specs/development-context/implementation-plan.md` |
| `plan_id` | `final-frontend-development-context-plan` |
| `spec_id` | `spec-development-context-001` |
| `tier` | `PROTECTED` (workstream) — activación automática del gate, sin señal adicional |
| `payload_revision` | `p1` (cuerpo vigente; replicado, **no** incrementado) |
| `review_gate_revision` | `r1` (único valor posible en la entrada; replicado) |
| Estado del gate | `REVIEWING` |
| Escrituras del gate usadas | **1 de 4** |
| Fecha del checkpoint | `2026-10-06` |
| `review_mode` | `plan` (read-only; sin barrido de repo ni auditoría de código) |
| `max_directives` | `5` por reviewer |
| `required_output` | `PLAN_REVIEW_REPORT` |
| `round_policy` | ronda única, sin retry, sin segunda invocación |
| **Ejes diferidos** | `none` (sin exclusión explícita del operador) |
| **Ejes sin verificar** | `none` (aún sin ronda) |
| Revisión inicial | `r1` |
| Revisión final | `r1` (en curso; el veredicto se persiste en la escritura 2/4) |

#### Selección congelada

Dos ejes con evidencia citable, uno por reviewer, dentro del cap local del gate (≤ 4) y del rango universal `2-6` de la matriz canónica de concurrencia. **Congelada antes del primer despacho**: no se amplía, sustituye ni recalcula durante el resto del gate; un hallazgo posterior se anota como observación y nunca abre un despacho adicional. La selección es **por evidencia**, no por nominalidad: no hay schema, migración, contrato de API ni cambio de arquitectura en el alcance (§3), y el eje UX no aplica (§3 excluye frontend), por lo que sus reviewers no se activan.

| # | Reviewer | Eje de dominio | Evidencia citable que dispara el eje (en este plan) |
|---:|---|---|---|
| 1 | `Dhampir-Slayer` | Seguridad y secretos — autorización, alcance y auditoría | `§5` Fase 1 `:157-169` (mapping `Position`/`Role`/`ScopePolicy` por unidad, hard trigger #3) y `:218-220` (comparación exacta de rol, scope y `is_unique_holder` en existentes); `§5` Fase 2 `:176-232` (límites de DB y preflight); `§5` Fase 3 `:250-258` (`bulk_create` evita señales `auditlog` en `Position`); `§6` `:353-360` (riesgos de autorización y de escritura de auditoría). |
| 2 | `Hellknight-Inspector` | Calidad, correctitud y deuda técnica del plan | `§5` Fase 2 `:182-193` (acreditación de DBdev y criterio operativo no concretado) y `:197-232` (preflight y clasificación de resultados); `§5` Fase 3 `:238-279` (secuencia preflight/`INSERT`/commit, preservación de snapshots y rollback); `§7` `:378-398` (criterios de ejecución y observación). |

#### Invocaciones lógicas previstas

Dos, en una sola ronda paralela. `Lore Master` **no** despacha: registra lo que el orquestador dará a cada reviewer cuando haya dos slots. Cada packet se ecoa con `plan_path` y los contadores del frontmatter; el reviewer verifica ambos al abrirlo y reporta la discrepancia en `unverified`.

**1 · `Dhampir-Slayer` — eje seguridad**

```text
PLAN_REVIEW_PACKET
gate_id: prg-final-frontend-development-context-plan
plan_path: docs/specs/development-context/implementation-plan.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
axis: seguridad
axis_evidence: §5 Fase1 mapping de puestos; Fase2 límites de DB; Fase3 auditoría por signals y bulk_create; §6
read_scope: PLAN_PATH; docs/specs/development-context/spec.md y spec-meta.yaml;
  apps/identity/management/commands/seed_positions.py; apps/identity/apps.py;
  modelos Tenant/OrganizationUnit/Position/Role/ScopePolicy/Armory sólo campos/relaciones
  citadas; control_poligono/settings.py sólo DB/bootstrap sin .env;
  source instalado auditlog sólo si imprescindible
out_of_axis: calidad/correctitud de pasos pertenece al segundo reviewer; diseño de
  tests/UX/performance/schema/API/arquitectura no están activos; no auditoría total ni
  fuente de secretos
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda única, sin retry, sin segunda invocación
```

**2 · `Hellknight-Inspector` — eje calidad y correctitud**

```text
PLAN_REVIEW_PACKET
gate_id: prg-final-frontend-development-context-plan
plan_path: docs/specs/development-context/implementation-plan.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
axis: calidad-correctitud
axis_evidence: §5 Fase2 acreditación DBdev; Fase3 secuencia preflight/INSERT/commit/preservación; §7 criterios operativos
read_scope: PLAN_PATH; docs/specs/development-context/spec.md y spec-meta.yaml;
  seed_org_tree.py; seed_positions.py; modelos citados sólo claves/choices;
  source instalado Django SQLite/transaction/query sólo firmas usadas en plan si imprescindible
out_of_axis: seguridad/authz/auditoría pertenece al primer reviewer; no directivas de
  tests/UX/performance/schema/API/arquitectura; no auditoría de código total
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda única, sin retry, sin segunda invocación
```

#### Nota de alcance del ledger

- Solo existen bloques de **identificación, selección congelada e invocaciones previstas**. No hay directivas, ni `Directivas válidas`, ni `Directivas descartadas`, ni tabla de `Reviewers`, ni `Veredicto`: la ronda aún no corre y la escritura 2 de 4 es la que materializa feedback y veredicto.
- **Dominio de la acreditación de DBdev.** `§5` Fase 2 `:182-193` no concretiza el mecanismo operativo de acreditación, y `§5` Fase 3 `:238-279` sostiene la secuencia preflight/`INSERT`/commit sobre él. Esta escritura **no audita ese dominio**: congela al reviewer competente (`Hellknight-Inspector`, eje calidad-correctitud) como dueño del juicio técnico. No se emite opinión, severidad ni disposición aquí.
- **Lote local del gate:** 2 reviewers (cap ≤ 4), dentro del rango `2-6` universal de la matriz canónica; write sets de reviewers vacíos y read-only. Se despachan juntos sólo después de este checkpoint y cuando haya dos slots. La activación del gate es la autorización del lote; no se pide confirmación adicional.
- **Aparición mínima en el ledger.** No se escriben hashes, fingerprints, sidecars ni archivos de estado: los contadores `pN`/`rN` son lógicos y la trazabilidad reside en esta sección y en el audit trail del orquestador.
- **Planes y artefactos hermanos intactos.** Esta escritura **no** toca [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md) (incluido el drift registrado en `§10`), los planes de [`../final-frontend/`](../final-frontend/) y [`../private-master-helper/`](../private-master-helper/), `docs/07_MANAGEMENT_COMMANDS.md` ni el código fuente.
- **Lo que este checkpoint NO autoriza.** Ni el checkpoint ni el futuro `PLAN_REVIEW_VERDICT` autorizan implementación: la separación planificación-ejecución permanece dura. La aprobación de alcance de la spec ([`./spec-meta.yaml`](./spec-meta.yaml):7) y la orden A-1 del operador sobre preparar el contexto faltante en DBdev (§9) son **hechos anteriores y separados** de este gate; existen con independencia de él y este checkpoint no los crea, amplía ni sustituye. La orden explícita para **implementar** el constructor sigue ausente (§9) y la autorización del Nivel 3 (`manage.py test` focalizado, §7) también.
- **Reconciliación de lectoría (append-only, sin reescribir lo previo).** La nota de persistencia del encabezado (`:25`), la fila del Plan Review Gate en `§9` (`:445`) y la viñeta «Gate» de la entrada `### p1` (`:475`) afirman, con la fecha de la persistencia `p1` (`2026-10-05`), que **no** existe sección `## Plan Review Gate`, que `review_gate` y `review_gate_revision` están ausentes del frontmatter y que hay `0` escrituras usadas. Esas tres afirmaciones eran **verdaderas el 2026-10-05 al cierre de la persistencia `p1`** y se conservan literales porque el ledger es append-only. Desde este checkpoint quedan **superadas**: el gate está en `REVIEWING`, la sección existe y las escrituras usadas son `1 de 4`. Prevalece esta subsección como estado vigente del gate; `§1`–`§10` (cuerpo `p1`) y la entrada `### p1` del historial no cambian.
- **Acciones técnicas de esta escritura:** ninguna. Sin comandos, tests, navegador, subagentes, base de datos ni verificación de comportamiento; sin lectura de fuentes de código citadas en el cuerpo.

#### Ronda `r1` cerrada — feedback `p1/r1` (`FEEDBACK_PERSISTED`, sin veredicto)

> 🕯️ **Alcance de esta escritura (2 de 4).** Feedback de la ronda única `r1` y fallo contractual terminal del segundo reporte, escrito por `Lore Master` como writer único y secuencial de este `PLAN_PATH`, por delegación explícita del orquestador con el contenido ya filtrado y arbitrado. Es la **segunda** de las cuatro escrituras que el gate autoriza sobre este archivo. No es cuerpo del plan: **no** incrementa `payload_revision` (replica `p1`), **no** se replica en `## Historial de revisiones`, **no** toca `§1`–`§10` ni la entrada `### p1`, **no** mueve `status: draft`, **no** abre ni modifica spec, `spec-meta.yaml`, índice, ADR, bug ni plan hermano, y **no** declara veredicto. El frontmatter conserva `payload_revision: p1`, `review_gate: REVIEWING` y `review_gate_revision: r1` —los tres valores sólo se alteran al materializar un cuerpo nuevo o al cerrar el ciclo—. `updated_at` sigue en `2026-10-06`, la fecha de esta escritura.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-final-frontend-development-context-plan` |
| `PLAN_PATH` | `docs/specs/development-context/implementation-plan.md` |
| `ledger_state` | `FEEDBACK_PERSISTED` |
| `payload_revision` | `p1` (cuerpo vigente; replicado, **no** incrementado) |
| `review_gate_revision` | `r1` |
| Estado del gate | `REVIEWING` (el ledger ya registra la ronda cerrada; el veredicto aún no existe) |
| Escrituras del gate usadas | **2 de 4** |
| **Ejes diferidos** | `none` (sin exclusión explícita del operador) |
| **Ejes sin verificar** | `calidad-correctitud` |
| Revisión inicial | `r1` |
| Revisión final | `r1` (en curso; el veredicto se persiste en la escritura 3/4) |
| Ronda de reviewers | **Cerrada.** Ronda única, sin retry, sin reemplazo, sin segunda invocación |
| Directivas válidas / deduplicadas / descartadas | `2` / `0` / `1` |
| Eje crítico cubierto | `seguridad` (prioridad `1`) completado estáticamente; ningún otro eje crítico activo |

> 🪶 **Reconciliación de lectoría (append-only, sin reescribir el checkpoint).** La tabla de identificación del checkpoint declara `Ejes sin verificar: none` y `Escrituras del gate usadas: 1 de 4`. Ambas afirmaciones eran verdaderas al cierre de la escritura 1 de 4 y se conservan literales. Desde esta escritura quedan **superadas**: el eje `calidad-correctitud` queda sin verificar y las escrituras usadas son `2 de 4`. Prevalece esta subsección como estado vigente de la ronda; el checkpoint no se modifica.

##### Selección congelada (vigente en `r1`, sin recalcular)

Se reproduce aquí por trazabilidad, con las mismas anclas del checkpoint. **No** se amplía, sustituye ni recalcula: un hallazgo posterior se anota como observación y nunca abre un despacho adicional.

| # | Reviewer | Eje de dominio | Evidencia citable que dispara el eje (del checkpoint) |
|---:|---|---|---|
| 1 | `Dhampir-Slayer` | Seguridad y secretos | `§5` Fase 1 `:157-169`; Fase 2 `:176-232`; Fase 3 `:250-258`; `§6` `:353-360` |
| 2 | `Hellknight-Inspector` | Calidad, correctitud y deuda técnica del plan | `§5` Fase 2 `:182-193` y `:197-232`; Fase 3 `:238-279`; `§7` `:378-398` |

##### Directivas válidas

Sin deduplicación (`0` fusiones) y sin observaciones promovidas. Las dos directivas son del eje `seguridad`, aceptadas por el orquestador como material válido y filtrado. **`Disposición` y `Arbitraje` quedan en `pendiente`**: esta escritura no los produce; los emite `Cunning Bard` por directiva en `BARD_CORRECTION_1` y el arbitraje del orquestador después.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-seguridad-1` | seguridad | `material` | Excepción deliberada de auditoría `Position` requiere justificación explícita de seguridad, no sólo write set. | `implementation-plan.md:252-260,413-415`; `apps/identity/apps.py:13-14`; `spec.md:150` (DC-X-06 excluye logs) | pendiente | pendiente |
| `D-seguridad-2` | seguridad | `material` | Claim de orden humana ausente contradice autorización humana anterior del mismo paso acotado. | `implementation-plan.md:336-339,438-440,577`; `spec.md:31-36,145,157`; `spec-meta.yaml:64-80`; pregunta/respuesta humanas | pendiente | pendiente |

**Cambio solicitado por cada directiva válida** (transcripción literal del `requested_change` del digest de origen; viaja al `Cunning Bard` y no se reescribe aquí):

- **`D-seguridad-1`** — objetivo `§5` Fase 3 (elección de `bulk_create`) y `§8` (`INSERT` sin señales). *Explicitar y justificar excepción limitada a `INSERT` nuevos de receta en DBdev acreditada, sin titulares ni cambios de existentes, sin desactivar `auditlog` globalmente. Registrar ausencia de eventos y compatibilidad con el requisito de auditoría/DC-X-06; si no puede sostenerse, detener para decisión de alcance y no añadir logs unilateralmente.*
- **`D-seguridad-2`** — objetivo `§9` (dependencia de orden humana) y nota de alcance del ledger `:577`. *Reconciliar dependencia y ledger append-only: A-1 autoriza el mismo paso de preparación tras requisitos/gates, no diseño solamente ni nueva confirmación. Spec/gate no crean autorización; tests/usuarios/MASTER/secretos/RBAC global/cambios existentes fuera scope.*

##### Directivas descartadas

| ID | Eje fallido | Motivo |
|---|---|---|
| `D-calidad-correctitud-1` | **Contrato de reporte**, previo al filtrado de dominio/scope/evidencia | `severity_received: MAYOR` fuera del conjunto cerrado `blocking \| material \| minor`; `required_revision_keys_missing: payload_revision_in, review_gate_revision_in` (el reporte envía `payload_revision` / `review_gate_revision` en su lugar) y `delivery_state_missing: yes`. El orquestador **rechaza** su contrato y **no** normaliza la severidad ni completa el contrato por inferencia. Se conserva como **dato rechazado**, no directiva válida ni digest. Referencia del reclamo: acreditación DBdev `§5` Fase 2; **no** se promueve a directiva. |

> 🕯️ **Alcance del descarte.** El descarte ocurre en el contrato de reporte, **antes** de los tres ejes de filtrado (dominio, scope, evidencia) del SSOT. No se afirma que el reclamo sea falso ni que su evidencia sea incorrecta: se afirma únicamente que no satisface el contrato y, por tanto, no entra como directiva. Ningún juicio de dominio se emite aquí: esa capacidad es del reviewer y del arbitraje del orquestador.

##### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | seguridad | `partial` | 2 |
| `Hellknight-Inspector` | calidad-correctitud | `none` (sin stance: reporte no conforme) | 0 |

- **Reporte `Dhampir-Slayer` (`ACCEPTED` a nivel de contrato).** Ecos `*_in` correctos (`payload_revision_in: p1`, `review_gate_revision_in: r1`) y material válido: el mapping de source coincide con `seed_positions`; la evaluación estática está completada y la fuente `Position` de `auditlog` está citada. Runtime no requerido en `review_mode: plan`. Las dos directivas de la tabla anterior salen de este reporte.
- **Reporte `Hellknight-Inspector` (`REJECTED` a nivel de contrato; `report_contract_valid: no`).** `disposition_of_report`: **terminal, sin reporte conforme; no re-invocar**. No se normaliza su severidad de dominio, no se completan sus campos por inferencia y su claim **no** se convierte en directiva. `stance: none` y `Directivas: 0` son ausencia de dato, no evaluación técnica: esta escritura no le asigna stance ni severidad al contenido.

##### Eje sin verificar: `calidad-correctitud`

`unverified_axes: [calidad-correctitud]`. El motivo es el **incumplimiento del contrato de reporte**, no la ausencia de runtime ni de disponibilidad del reviewer: el reporte llegó y fue rechazado en la capa de contrato (§ *Directivas descartadas* y § *Reviewers*). Conforme al SSOT *Fallo terminal de un reviewer*: **sin retry, sin reemplazo, sin segunda invocación**; el eje queda marcado `unverified_axes` y el reporte queda como dato rechazado. No se inventa ninguna directiva a partir de observaciones fuera de eje.

> 📜 **Lo que esta marca NO decide.** `calidad-correctitud` es la prioridad `7` del roster, **no** un eje crítico (`1`-`3`); el único eje crítico de la selección, `seguridad`, quedó cubierto estáticamente y ningún otro eje crítico está activo. La consecuencia de `unverified_axes` sobre el veredicto —y el propio veredicto— pertenecen al **orquestador**. Esta escritura no lo anticipa, no lo sugiere y no declara `VALIDATED`.

##### Observaciones fuera de eje no promovidas

`out_of_axis_observations` nunca se promueve a directiva dentro de este gate (SSOT *Filtrado, deduplicación y digest*). Se registran aquí sólo por trazabilidad:

- `Dhampir-Slayer` remite la concreción del mecanismo de acreditación de DBdev al eje del otro reviewer. No es directiva.
- `Hellknight-Inspector` reconoce la autorización A-1. No se convierte en directiva adicional ni en permiso.

##### Autorización humana de referencia (A-1)

Pregunta: «¿Autorizas un paso nuevo y acotado para crear el contexto de la receta sólo donde falte, sin reinicializar RBAC ni alterar usuarios o titulares existentes?» · Respuesta: «Dale con todo, no existe produccion ni datos reales».

A-1 **existe** y es un hecho anterior y separado de este gate (§9). Estos artefactos **no** la sustituyen ni la amplían; el ledger no la crea, no la extiende y no la convierte en permiso de implementación. El claim de ausencia de orden —`D-seguridad-2`— fue **rechazado por el orquestador** por contrariar esta evidencia; el rechazo se registra sin edición del cuerpo en esta escritura.

##### Limitaciones declaradas de esta ronda

- La completitud del source de `auditlog` instalado **no** fue evaluada por `Dhampir-Slayer`; el registro de `Position` queda anclado en `apps/identity/apps.py`.
- Runtime, DB efectiva y el constructor `prepare_development_context` (que el propio plan declara inexistente) **no** están verificados.
- El eje `calidad-correctitud` queda sin reporte conforme; el material de ese eje queda **reservado para el cierre**.
- **Ningún** gate de SDD (`tests`, `security_review`, `code_review`, `documentation`) se declara pasado. No existe veredicto de este gate.

##### Siguiente contrato

`PLAN_REVIEW_DIGEST` `p1/r1` con **sólo** las dos directivas de seguridad válidas de la tabla anterior, **sin identidad del reviewer** (`reviewer`, `stance`, `stance_rationale` quedan fuera del digest), sin directivas descartadas ni `out_of_axis_observations`. Disposición del `Cunning Bard` **por directiva** (`accept | partial | reject`), nunca disposición global del plan.

##### Acciones técnicas de esta escritura

Ninguna. Sin comandos, tests, navegador, subagentes, base de datos ni verificación de comportamiento; sin lectura de fuentes de código citadas en el cuerpo. Cero secretos: las referencias `archivo:línea` se conservan tal como las entregó el orquestador. Write set cerrado a este `PLAN_PATH`: [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md), los planes de [`../final-frontend/`](../final-frontend/) y [`../private-master-helper/`](../private-master-helper/), `docs/07_MANAGEMENT_COMMANDS.md` y el código fuente quedan intactos.

#### Ronda `r1` cerrada — cuerpo `p2` materializado y veredicto `r2` (`OPERATOR_REQUIRED`, ciclo terminal)

> 🕯️ **Alcance de esta escritura (3 de 4).** Escritura terminal del ciclo: materializa el **cuerpo revisado** (`p1` → `p2`), las **disposiciones por directiva**, el **arbitraje** y el **veredicto** en un único paso lógico. Escrita por `Lore Master` como writer único y secuencial de este `PLAN_PATH`, por delegación explícita del orquestador con el contenido ya arbitrado. Es la **tercera** de las cuatro escrituras que el gate autoriza; **no** es una cuarta escritura ni produce otro archivo. Al materializarse cuerpo nuevo, **sí** incrementa `payload_revision` (`p1` → `p2`), a diferencia de las escrituras 1/4 y 2/4. **No** reescribe el checkpoint `1/4` ni el feedback `2/4`, que se conservan completos y literales; **no** mueve `status: draft`; **no** abre ni modifica spec, `spec-meta.yaml`, índice, ADR, bug ni plan hermano. El cambio de cuerpo se registra en `## Historial de revisiones` bajo `### p2`; esta sección y aquella permanecen separadas.
>
> 🪶 **Corrección de transcripción dentro de esta misma escritura 3/4 (no constituye una escritura adicional).** Una revisión directa del cuerpo contra el `plan_payload_revised` detectó cuatro desviaciones de transcripción: dos paráfrasis en `§5` Fase 1 (introducción de la tabla de puestos y su cierre), un bloque de concurrencia de `p1` retenido en `§5` Fase 4 y un bloque de riesgos de `p1` duplicado en `§6`. Se repararon restituyendo `§1`–`§8` **exactamente** al payload recibido, sin residuos de `p1`, sin paráfrasis y sin separadores agregados. Se repararon además dos defectos de esta misma entrega: la afirmación de que los claims `p1:439`/`checkpoint:577` «eran verdaderas en sus fechas» —**falsa**: fueron erróneos desde su origen y el claim de orden ausente fue **rechazado** por contrariar A-1, que es anterior— y la garantía de recuperar el cuerpo íntegro de `p1` desde la cabecera, **retirada** por no existir localizador observado que lo contenga. Esta corrección **no** es una cuarta escritura, **no** es `BARD_CORRECTION_2`, **no** produce `p3`/`r3`, **no** reabre el ciclo ni despacha reviewers: `payload_revision: p2`, `review_gate_revision: r2`, `review_gate: OPERATOR_REQUIRED`, `implementation_authorized: no` y `status: draft` permanecen intactos.

| Campo | Valor |
|---|---|
| `gate_id` | `prg-final-frontend-development-context-plan` |
| `PLAN_PATH` | `docs/specs/development-context/implementation-plan.md` |
| `ledger_state` | `VERDICT_PERSISTED` (ciclo terminal) |
| `payload_revision` | `p2` (cuerpo vigente; **incrementado** por materialización de cuerpo revisado) |
| `review_gate_revision` | `r2` |
| Estado del gate | **`OPERATOR_REQUIRED`** — ciclo `r1` cerrado; **no** se reabre |
| Escrituras del gate usadas | **3 de 4** |
| **Ejes diferidos** | `none` (sin exclusión explícita del operador) |
| **Ejes sin verificar** | `calidad-correctitud` (sin cambio respecto de `2/4`) |
| Revisión inicial | `r1` |
| Revisión final | `r2` (cerrada) |
| Ronda de reviewers | **Cerrada.** Ronda única, sin retry, sin reemplazo, sin segunda invocación |
| Directivas válidas / deduplicadas / descartadas | `2` / `0` / `1` (sin cambio respecto de `2/4`) |
| Eje crítico cubierto | `seguridad` (prioridad `1`) completado estáticamente; ningún otro eje crítico activo |

##### Selección congelada (vigente, sin recalcular)

Se reproduce por trazabilidad, **idéntica** a la del checkpoint `1/4` y a la replicada en el feedback `2/4`. **No** se amplía, sustituye ni recalcula.

| # | Reviewer | Eje de dominio | Evidencia citable que dispara el eje (del checkpoint) |
|---:|---|---|---|
| 1 | `Dhampir-Slayer` | Seguridad y secretos | `§5` Fase 1 `:157-169`; Fase 2 `:176-232`; Fase 3 `:250-258`; `§6` `:353-360` |
| 2 | `Hellknight-Inspector` | Calidad, correctitud y deuda técnica del plan | `§5` Fase 2 `:182-193` y `:197-232`; Fase 3 `:238-279`; `§7` `:378-398` |

> 🕯️ **Resolución de anclas del cuerpo `p2` (append-only).** Las citas `:NNN` de la tabla anterior, y las referencias internas del cuerpo `p2` del tipo `p1:<línea>`, `checkpoint:577` o `:662`, apuntan al **snapshot `p1`/`r1`** y no a números de línea de este archivo tras la materialización de `p2`. La redacción es intencional y auditable: son **anclas del artefacto de origen**, no localizadores volables. El contenido citado sobrevive literal en: la tabla de *Directivas válidas* del feedback `2/4` (célula de evidencia, que cita `implementation-plan.md:336-339,438-440,577` y `:662`), la subsección *Nota de alcance del ledger* del checkpoint `1/4`, la subsección *Autorización humana de referencia (A-1)* del feedback `2/4`, y la entrada `### p1` de `## Historial de revisiones`. La aclaración de A-1 requerida por `D-seguridad-2` se materializó en `§9` y en esta subsección.

##### Directivas válidas

Sin deduplicación (`0` fusiones) y sin observaciones promovidas. Las **disposiciones** las emite `Cunning-Bard` por directiva y el **arbitraje** el orquestador; esta escritura transcribe ambos sin derivarlos, reinterpretarlos ni recalcularlos. No existe estado `deferred` para una directiva: cada directiva válida queda dispositionada.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-seguridad-1` | seguridad | `material` | Excepción deliberada de auditoría `Position` requiere justificación explícita de seguridad, no sólo write set. | `implementation-plan.md:252-260,413-415`; `apps/identity/apps.py:13-14`; `spec.md:150` (DC-X-06 excluye logs) | **accept** | Explicitar excepción propuesta y detener cuando la incompatibilidad normativa no puede justificarse. Evidencia y delta coherentes. Resultado **unresolved no corregible**: la norma local (`docs/11_SEGURIDAD.md:282-299`) incluye **cada** modificación de `Position` y no contempla excepción DBdev, mientras `spec.md:150` (DC-X-06) excluye los logs. El `Bard` no suplanta al operador ni añade logs. Es una decisión de riesgo/alcance humana real, **no** una `BARD_CORRECTION_2`. |
| `D-seguridad-2` | seguridad | `material` | Claim de orden humana ausente contradice autorización humana anterior del mismo paso acotado. | `implementation-plan.md:336-339,438-440,577`; `spec.md:31-36,145,157`; `spec-meta.yaml:64-80`; pregunta/respuesta A-1 | **accept** | **resolved.** A-1 ya autoriza el mismo paso acotado **y sus requisitos** de implementación y revisión; no es aprobación de diseño únicamente. El payload `§5`/`§8` reconoce la continuidad de A-1; se sincronizan `§9` y una aclaración append-only en el ledger. **No** pide confirmar otra vez el mismo setup. |

**Cambio materializado por cada directiva aceptada** (delta del autor, ya incorporado al cuerpo `p2`):

- **`D-seguridad-1`** — `§5` Fase 3 documenta la ausencia prevista de eventos y **condiciona** la escritura a decisión humana; `§6`–`§8` separan el riesgo real de trazabilidad de la prohibición de logs no autorizados. `DC-X-06` no se altera.
- **`D-seguridad-2`** — `§5` Fase 1 y `§5` Fase 5 y `§8` trasladan la continuidad de A-1; `§9` y el ledger quedan reconciliados de forma append-only.

##### Directivas descartadas

Sin cambios respecto de `2/4`; el descarte sigue siendo **terminal** y no se reabre.

| ID | Eje fallido | Motivo |
|---|---|---|
| `D-calidad-correctitud-1` | **Contrato de reporte**, previo al filtrado de dominio/scope/evidencia | `severity_received: MAYOR` fuera del conjunto cerrado `blocking \| material \| minor`; `required_revision_keys_missing: payload_revision_in, review_gate_revision_in` (el reporte envía `payload_revision` / `review_gate_revision` en su lugar) y `delivery_state_missing: yes`. El orquestador **rechaza** su contrato y **no** normaliza la severidad ni completa el contrato por inferencia. Se conserva como **dato rechazado**, no directiva válida ni digest. Referencia del reclamo: acreditación DBdev `§5` Fase 2; **no** se promueve a directiva. |

##### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | seguridad | `partial` | 2 |
| `Hellknight-Inspector` | calidad-correctitud | `none` (sin stance: reporte no conforme) | 0 |

`Stance` es la evaluación del reviewer, **no** una disposición ni un veredicto: el veredicto de este ciclo es el bloque `PLAN_REVIEW_VERDICT` de más abajo y lo emite el orquestador.

##### Eje sin verificar: `calidad-correctitud`

`unverified_axes: [calidad-correctitud]`. Motivo: **incumplimiento del contrato de reporte**, no ausencia de runtime ni de disponibilidad del reviewer. Conforme al SSOT *Fallo terminal de un reviewer*: **sin retry, sin reemplazo, sin segunda invocación**. No se inventa ninguna directiva a partir de observaciones fuera de eje. El reporte queda reservado como dato rechazado y el eje no se acredita en este ciclo.

##### Autorización humana de referencia (A-1) — aclaración append-only

Pregunta: «¿Autorizas un paso nuevo y acotado para crear el contexto de la receta sólo donde falte, sin reinicializar RBAC ni alterar usuarios o titulares existentes?» · Respuesta: «Dale con todo, no existe produccion ni datos reales».

- **A-1 existe** y es un hecho anterior y separado de este gate. Autoriza **el mismo paso de preparación**, incluida la **implementación del constructor acotado** como requisito, tras sus requisitos; **no** requiere otra confirmación del mismo setup.
- **El claim de orden de implementación ausente queda rechazado por contradictorio.** Las afirmaciones de `p1:439` (fila `§9` del cuerpo `p1`) y `checkpoint:577` (*Lo que este checkpoint NO autoriza*) **no eran verdaderas en sus fechas**: el claim de orden ausente fue **rechazado** por el arbitraje por contrariar A-1, que es **anterior** y ya cubría el mismo paso. Eran, por tanto, claims erróneos desde su origen, no afirmaciones legitimamente superadas por una autorización posterior. Lo que esta escritura registra es **su corrección**, no una autorización nueva. Ambas frases se conservan **literales** en sus lugares de origen por ser el ledger append-only, y se conservan también en el checkpoint `1/4` y el feedback `2/4`, que esta escritura **no** reescribe. Prevalece la aclaración de A-1 de `§9` y esta.
- **Precisión sobre `:662`.** La frase del feedback `2/4` —«A-1 **existe** […] el ledger no la crea, no la extiende y no la convierte en permiso de implementación»— significa que **el ledger no crea permiso**; **no** significa que falte A-1 ni que ésta se haya perdido. Esa lectura contradice el arbitraje y queda corregida por esta aclaración, sin editar la frase original.
- **Lo que A-1 no autoriza.** No cubre (a) la ejecución de los tests nuevos, que requiere autorización expresa; (b) la decisión de riesgo de `D-seguridad-1`; (c) ejecutar `INSERT` mientras `D-seguridad-1` siga `unresolved`; (d) `MASTER`, credenciales, titulares, RBAC global ni cambios sobre filas existentes.

##### Veredicto

```text
PLAN_REVIEW_VERDICT
gate_id: prg-final-frontend-development-context-plan
plan_path: docs/specs/development-context/implementation-plan.md
payload_revision_final: p2
review_gate_revision_final: r2
verdict: OPERATOR_REQUIRED
reviewers: Dhampir-Slayer:seguridad:partial; Hellknight-Inspector:calidad-correctitud:none (reporte contractual rechazado)
directives_total: 2
accepted: 2
partial: 0
rejected_with_evidence: 0
unresolved: 1
discarded: 1
deferred_axes: none
unverified_axes: [calidad-correctitud]
operator_decision_required: ¿Se mantiene auditlog para las nuevas Position, autorizando reformular el límite que excluye logs, o se admite una excepción expresamente limitada a INSERT de Position oficiales faltantes de la receta en DBdev acreditada, sin titulares ni cambios existentes y sin desactivar auditlog global? La identidad DBdev y el eje de correctitud siguen sin verificar; la decisión no valida por sí sola el plan ni permite ejecutar INSERT.
implementation_authorized: no
```

> 📜 **Lectura obligatoria del veredicto.** `implementation_authorized: no` es literal e inalterable. Este ciclo **no** autoriza implementación, ejecución de tests, ni `INSERT` alguno. `OPERATOR_REQUIRED` **no** es `VALIDATED`: el plan queda materializado y durable en `p2`, pero **pendiente de una decisión humana de riesgo**. `deferred_axes: none` significa que no hay eje diferido por exclusión del operador; el único elemento diferido materialmente es la **decisión de riesgo** sobre `D-seguridad-1`, que no se cuenta como eje diferido.
>
> 🪶 **Reservas del `assessment` del orquestador** (`ACCEPTED_WITH_RESERVATIONS`), registradas sin alterar el veredicto: (a) **auditlog** — la decisión queda abierta y bloquea el camino de escritura; (b) eje `calidad-correctitud` **sin reporte contractual conforme**, por lo que no hay validación en correctitud; (c) **DBdev efectiva no acreditada** — la identidad de la base de desarrollo sigue sin verificar, conforme a `§5` Fase 2 del cuerpo `p2`; (d) **runtime no evaluado** — no se ejecutó nada ni se observó comportamiento.
>
> 🪶 **Cierre del ciclo y no-reapertura.** Este `gate_id` **no se reabre** tras la decisión del operador. Un plan materialmente nuevo requiere `workstream` y `gate_id` **nuevos** conforme al SSOT, y en ningún caso se implementa por inferencia de esta decisión. Escrituras restantes del gate: **1 de 4**; el presupuesto se conserva sin reabrir el ciclo.

##### Limitaciones declaradas de este cierre

- La **identidad efectiva de DBdev** no está acreditada; el propio cuerpo `p2` lo declara y detiene sin prueba efectiva.
- El eje `calidad-correctitud` queda **sin verificar** por fallo contractual del reporte; no se le asigna stance ni severidad por inferencia.
- **Runtime no evaluado:** sin ejecución, sin consultas, sin tests y sin observación de eventos `auditlog`.
- La **excepción de auditoría** propuesta no está acreditada como compatible con `docs/11_SEGURIDAD.md:284,294`.
- **Ningún** gate de SDD (`tests`, `security_review`, `code_review`, `documentation`) se declara pasado por este veredicto.

##### Acciones técnicas de esta escritura

Ninguna. Sin comandos, git, web, base de datos, navegador, tests, código, subagentes ni verificación de comportamiento; sin lectura de las fuentes de código citadas en el cuerpo. Cero secretos: las referencias `archivo:línea` se conservan tal como las entregó el orquestador. Sin hashes, fingerprints, sidecars ni archivos de estado: la trazabilidad reside en esta sección, en `## Historial de revisiones` y en el audit trail del orquestador. Write set cerrado a este `PLAN_PATH`: [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md), [`./index.md`](./index.md), los planes de [`../final-frontend/`](../final-frontend/) y [`../private-master-helper/`](../private-master-helper/), `docs/07_MANAGEMENT_COMMANDS.md` y el código fuente quedan intactos.

##### Nota de alcance al cerrar el ciclo (append-only, escritura de persistencia `p3`)

- **Esta sección pertenece al ciclo `prg-final-frontend-development-context-plan`, que está TERMINAL.** No se modifica, no se reabre, no se re-despacha y no se reescribe ninguna de sus tres subsecciones. Su `PLAN_REVIEW_VERDICT` —`OPERATOR_REQUIRED`, `payload_revision_final: p2`, `implementation_authorized: no`— describe y **sólo** describe el cuerpo `p2` de aquel ciclo. Su presupuesto de escrituras queda en **3 de 4** y **no** se consume: la cuarta escritura de aquel gate no se usa, porque aquel ciclo ya cerró terminalmente en `r2`.
- **El workstream `development-context-audited-create-only` no tiene gate en este archivo.** El frontmatter ya no declara `review_gate` ni `review_gate_revision` porque esas claves describían el ciclo anterior. Aquí **no** se abre un `gate_id` nuevo, **no** se registra checkpoint prelaunch, selección congelada, ronda ni veredicto, y **no** se escribe `NOT_REQUIRED`. El gate de este workstream será un **ciclo posterior y separado**, con su propio `gate_id` y su propio presupuesto de cuatro escrituras, y **no** comparte ni reinicia el de este ciclo cerrado.
- **Alcance de esta nota.** Es una aclaración de alcance mínima, **no** una cuarta escritura del gate anterior y **no** un checkpoint. El `## Historial de revisiones` de este archivo registra el cambio de cuerpo `p3` en su propia entrada `### p3`, separada de esta sección; las dos permanecen divididas y no se fusionan.
- **Nada de lo anterior autoriza implementación.** `implementation_authorized: no` es el único veredicto escrito en este archivo y se aplica al cuerpo `p2`. El cuerpo `p3` **no** tiene veredicto propio y, por tanto, **tampoco** está autorizado para implementarse: el gate que lo examine aún no ha comenzado.

### Ciclo `prg-development-context-audited-create-only` — 2026-10-06 — checkpoint prelaunch (`REVIEWING`, sin veredicto)

Escritura 1/4 de este ciclo. No incrementa `payload_revision` (replica `p3`), no toca `§1`–`§10`, ni la entrada `### p3` del historial, ni `status: draft`, ni el ciclo terminal `prg-final-frontend-development-context-plan`. Reviewers **no** despachados. Sin `Directivas válidas`, `Directivas descartadas`, `Reviewers` ni `Veredicto`: la ronda no ha corrido.

```text
PLAN_REVIEW_CHECKPOINT
gate_id: prg-development-context-audited-create-only
plan_path: docs/specs/development-context/implementation-plan.md
plan_id: development-context-audited-create-only
spec_id: spec-development-context-001
payload_revision: p3
review_gate_revision: r1
state: REVIEWING
updated_at: 2026-10-06
writes_used: 1/4
deferred_axes: none
unverified_axes: none
review_mode: plan
review_initial: r1
review_final: r1 (en curso)
frozen_reviewers:
- reviewer: Dhampir-Slayer
  axis: seguridad
  evidence: 'PLAN_PATH §5.1 destino DB efectivo :94-100; §5.3 nuevas Position y CREATE auditlog :115-119; Position.role/scope hard#3'
- reviewer: Hellknight-Inspector
  axis: calidad-correctitud
  evidence: 'PLAN_PATH §5.1 apertura mode=rw sin cambiar settings :95-98; §5.2 atomic preflight :104-111; §5.3 rollback/sin DML reuse :115-120'
human_source:
  decision_real: 'Con auditoría (Recomendado)' ante la decisión de conservar los eventos de las Position nuevas
  operator_order: 'Ok menos revisiones y mas implementacion porfavor, hay demasiada sobre ing y no se esta avanzando realmente'
  clarification: 'spec.md:41 reduce esa orden a mera dirección sin autorización de ejecución: claim incorrecto de writer que NO prevalece; el operador sí ordenó implementar. Dicha orden no autoriza saltar requisitos ni ejecutar tests nuevos. La cita de spec:37 es el alias «Conauditoria», no cita literal.'
  A-1: 'cubre la preparación tras los gates; la decisión A-5 de spec (A-2 de sesión en el plan) conserva auditlog. Sin nueva confirmación del mismo paso.'
logical_invocations:
- reviewer: Dhampir-Slayer
  packet: {gate_id: prg-development-context-audited-create-only, plan_path: docs/specs/development-context/implementation-plan.md, payload_revision: p3, review_gate_revision: r1, review_mode: plan, axis: seguridad, axis_evidence: '§5.1 destino y §5.3 auditlog/role/scope', read_scope: 'PLAN_PATH; spec.md; identity/apps.py; identity/models.py role/scope; source instalado auditlog y DB-router settings sólo funciones pertinentes, sin .env/datos', out_of_axis: 'calidad-correctitud del otro reviewer; no auth general, API, schema, tests, UX, performance', max_directives: 3, required_output: PLAN_REVIEW_REPORT, round_policy: 'única sin retry/reemplazo/segunda ronda'}
- reviewer: Hellknight-Inspector
  packet: {gate_id: prg-development-context-audited-create-only, plan_path: docs/specs/development-context/implementation-plan.md, payload_revision: p3, review_gate_revision: r1, review_mode: plan, axis: calidad-correctitud, axis_evidence: '§5.1 apertura efectiva y §5.2-3 atomicidad/reuse', read_scope: 'PLAN_PATH; spec.md; Django instalado SQLite connection/transaction y auditlog local sólo conexión transaccional; source seed blueprint si indispensable', out_of_axis: 'seguridad del otro reviewer; no API/schema/tests/UX/performance', max_directives: 3, required_output: PLAN_REVIEW_REPORT, round_policy: 'única sin retry/reemplazo/segunda ronda'}
audit_trail: 'Review plano de dos dominios, writers vacío, seleccionado sólo por deltas de conexión/auditoría que bloquean este command; no revisar frontend ni 99 flujos ni planes padre.'
```

#### Ronda `r1` cerrada — feedback `r1` y veredicto `VALIDATED` (`p3/r1` — escritura 2/4, ciclo terminal)

> 🕯️ **Alcance (2 de 4).** Feedback de la ronda única y veredicto en la **misma** escritura: `FEEDBACK_PERSISTED` con cero directivas válidas transiciona a `VALIDATED` (SSOT `~/.config/opencode/docs/plan-review-gate.md:210,234-236`). Escritura única sobre este `PLAN_PATH`: **no** es cuerpo del plan, **no** incrementa `payload_revision` (replica `p3`), **no** se replica en `## Historial de revisiones`, **no** toca `§1`–`§10` ni la entrada `### p3`, **no** mueve `status: draft` y **no** reescribe el ciclo anterior ya terminal. Frontmatter: sólo `review_gate: REVIEWING → VALIDATED`; `review_gate_revision: r1`, `payload_revision: p3`, `status: draft` y `updated_at: 2026-10-06` quedan intactos. Escrituras usadas **2 de 4**. Ronda única: sin retry, sin reemplazo, sin segunda ronda. **Selección congelada** (vigente, sin recalcular): `Dhampir-Slayer` (seguridad), `Hellknight-Inspector` (calidad-correctitud) · **Revisión inicial/final:** `r1`/`r1` · **Ejes diferidos:** `none` · **Ejes sin verificar:** `calidad-correctitud` · **Ejes críticos cubiertos:** `seguridad` (1) · **Directivas válidas:** `none` (0) · **Directivas descartadas:** `none` (0).
##### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` — `ses_eeeb647ceffeccrXWHNBB6W8iR` | seguridad | `accept` — contrato conforme; ecos `p3`/`r1`; acepta la cobertura estática del eje crítico (destino DB, write boundary auditado, mapping `role`/`scope`) con evidencia del plan y de la fuente | 0 |
| `Hellknight-Inspector` — `ses_eeeb64790ffe8HUegDvQNWuGm0` | calidad-correctitud | `none` — reporte **rechazado por contrato**: envió `payload_revision`/`review_gate_revision` en lugar de `payload_revision_in`/`review_gate_revision_in`; **terminal, sin retry ni reemplazo**; ningún claim suyo se convierte en directiva y no se le asigna stance (`none` es ausencia de dato, no evaluación técnica; eje de prioridad `7`, no crítico) | 0 |

##### Reservas de fuente (implementación y runtime)
- **No se leyó** el source del `auditlog` instalado ni la configuración efectiva de la base de datos: son reservas **de implementación y runtime**, **no** verificación del routing actual. **No** se afirma que el source esté ausente del entorno **ni** que exista incompatibilidad demostrada.
- **Localización observada por el orquestador** — localización, **no** evaluación técnica del routing: `.venv/lib/python3.14/site-packages/django/db/backends/sqlite3/` contiene `base.py` y `.venv/lib/python3.14/site-packages/auditlog/` existe. Localizadores para el futuro writer; **no** re-invocan a ningún reviewer.
- **Pendiente del implementador:** comprobar ese routing en la fuente instalada **antes de ejecutar cualquier comando**. Nada de esto autoriza aplicar cambios en la base de datos ni convierte la recomendación del agente en `VERIFIED` de producto. El `code-review`/`security_review` de la implementación y los tests propios de la spec siguen requeridos; no se pide ni se inicia otra ronda ni auditoría general de este plan.
##### Veredicto
```text
PLAN_REVIEW_VERDICT
gate_id: prg-development-context-audited-create-only
plan_path: docs/specs/development-context/implementation-plan.md
payload_revision_final: p3
review_gate_revision_final: r1
verdict: VALIDATED
reviewers: Dhampir-Slayer:seguridad:accept; Hellknight-Inspector:calidad-correctitud:none (reporte no conforme)
directives_total: 0
accepted: 0
partial: 0
rejected_with_evidence: 0
unresolved: 0
discarded: 0
deferred_axes: none
unverified_axes: [calidad-correctitud]
operator_decision_required: none
implementation_authorized: no
```