---
plan_id: final-frontend-private-master-helper-plan
workstream_id: final-frontend-private-master-helper-plan
spec_id: spec-private-master-helper-001
tier: PROTECTED
created_by: Cunning-Bard
persisted_by: Lore-Master
created_at: "2026-10-05"
updated_at: "2026-10-06"
payload_revision: p1
status: draft
spec_meta: ./spec-meta.yaml
---

# Plan — final-frontend-private-master-helper-plan: auxiliar privado para la cuenta raíz (`super_admin`)

> 🕯️ **Nota de persistencia (`Lore Master`, `p1`, 2026-10-05).** **Cuerpo del plan:** §1–§8 son la transcripción **literal** del `plan_payload` que `Cunning-Bard` entregó en su `HANDOFF` terminal (sesión `ses_ef152b5b1ffe53iRIL4JZkNJtl`): las 8 secciones canónicas en su orden original, con sus listas, subsecciones `### Fase N`, checkpoints y voz de autor tal como los escribió. Sin reempaquetado, sin reinterpretación, sin correcciones técnicas, sin renombrado de identificadores y sin cambio de aprobaciones. **§9 Dependencias** y **§10 Referencia a spec** son las **únicas** derivaciones, exigidas por `~/.config/opencode/docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`. El orden seguido (cuerpo literal primero, derivaciones después) es el ya establecido por los planes hermanos de esta spec; el mapeo de los elementos obligatorios de la SSOT queda explícito: `Dependencias` → §9, `Pasos` → §5, `Criterios de aceptación / verificación` → §7, `Riesgos / bloqueos` → §6, `Handoff` → §8, `Referencia a spec` → §10. **Sin tabla de contenidos**, por coherencia con los planes de [`../final-frontend/`](../final-frontend/) y porque el cuerpo es transcripción literal. **Identificadores:** `plan_id` y `workstream_id` declaran **el mismo valor por definición** (SSOT: `plan_id: <workstream-id>`); no son dos identificadores distintos. **Ruta declarada por el preflight:** este archivo dentro de la carpeta canónica de la spec (`docs/specs/private-master-helper/`), no `docs/plans/`, porque existe `spec_id` con `spec-meta.yaml` propio; es además la convención de carpeta ya usada por `spec-final-frontend-001` (`final-frontend/`, no `spec-final-frontend-001/`). **Gate no despachado:** el Plan Review Gate de este `plan_id` **no ha sido activado** — no existe sección `## Plan Review Gate` y el frontmatter **no** declara `review_gate` ni `review_gate_revision` (esas claves pertenecen a la SSOT del gate, `docs/plan-review-gate.md > Frontmatter`). Si el orquestador lo activa después, su primer ciclo será `r1` y este `PLAN_PATH` es su prerequisito duro. **Estado `DRAFT_PERSISTED`, no aprobación:** este archivo **no** autoriza implementación, instalación de dependencias, ejecución por agentes, navegador, shell, seeds, migraciones ni escritura en base de datos; la separación planificación-ejecución permanece dura y la orden explícita del operador sigue siendo necesaria (`./spec-meta.yaml:67-74`, `spec.md` §12, `PDA-X-01`). **`status: draft`:** primer cuerpo de este `plan_id`; el estado vive aquí como marca de este artefacto y **no** duplica ni mueve el estado de la spec, que sigue en `approved` con `verified_at: null` (`./spec-meta.yaml:7,14`). **Citas de código fuente:** las referencias `archivo:línea` a Django, `getpass` y `auditlog` que aparecen en §2, §4, §5 y §6 son **evidencia del autor sobre source leída por `Cunning-Bard`**, transcrita sin comprobarla; esta persistencia **no** releyó ni ejecutó esa fuente y **no** observó runtime. **Documentos no tocados:** [`./spec-meta.yaml`](./spec-meta.yaml), [`./spec.md`](./spec.md) y [`./index.md`](./index.md) de esta spec, los tres planes de [`../final-frontend/`](../final-frontend/) (`implementation-plan.md` `frontend-build-base` `p3`/`VALIDATED`/`r2`, `implementation-plan-access.md` y `implementation-plan-remaining.md`) y el puntero histórico [`../final-frontend/private-development-account-spec.md`](../final-frontend/private-development-account-spec.md). El drift detectado en los dos primeros queda **registrado, no corregido**, en §10 y en `## Historial de revisiones`, porque su corrección no pertenece a este `IN_SCOPE`. **Sin acción técnica:** esta escritura es persistencia documental `TIER: FAST`; no hay comandos, tests, navegador, subagentes, base de datos ni verificación de comportamiento.

> 📜 **Corrección de metadata, no semántica — `tier` del workstream (2026-10-06).** El frontmatter declaraba `tier: FAST`; el contrato original de este workstream es **`tier: PROTECTED`**, y queda restituido. **Evidencia original:** la delegación a `Cunning-Bard` (sesión `ses_ef152b5b1ffe53iRIL4JZkNJtl`, `HANDOFF` terminal) fue `TIER: PROTECTED`, por tratarse de un auxiliar privado que captura credenciales de la cuenta raíz y aplica consentimientos sobre `MASTER`. Las restricciones duras que sustentan ese carril —captura de RUT y contraseña sin eco en §5 Fase 3–4, consentimientos `PDA-C-01..04` sobre `MASTER` en §5 Fase 4, sinks y ausencia de secreto en §5 Fase 1–2 y §7— son **preexistentes en el cuerpo p1**: esta corrección no las crea, no las reescribe y no escala el alcance. **Causa del error:** `FAST` era el tier de la **fase de persistencia** —la escritura mecánica de este archivo—, no el del workstream; un coste de fase no sustituye al carril de origen. **Alcance:** dos claves de frontmatter, `tier` y `updated_at`. **No toca** `payload_revision: p1`, `status: draft`, `plan_id`, `workstream_id`, `spec_id`, `spec_meta`, `created_at`, ni el cuerpo §1–§10 o `## Historial de revisiones`: no es revisión del cuerpo ni incremento de `p1`, y **no** autoriza implementación, instalación, ejecución ni aprobación del auxiliar. **Gate intacto:** no se abre `review_gate` ni `review_gate_revision`, no se crea sección `## Plan Review Gate`, no hay checkpoint ni veredicto; si el orquestador lo activa después, su primer ciclo sigue siendo `r1` y este `PLAN_PATH` su prerequisito duro. **Frases conservadas por exactas:** «esta escritura es persistencia documental `TIER: FAST`» (nota de persistencia anterior) y «(persistencia mecánica `TIER: FAST`, `Lore Master`)» (encabezado `### p1` de `## Historial de revisiones`) describen la fase de escritura, no el carril del workstream, y se dejan literales.

---

## 1. 🎭 Objetivo

Yo preparo la implementación y revisión de un auxiliar privado que permita al operador aplicar exclusivamente los efectos consentidos de `crear_master`, sin exponer identificadores ni contraseña durante la captura y sin dejar escrituras parciales.

Mi entrega es un plan, no una autorización de implementación o ejecución: la metadata declara alcance aprobado y `verified_at: null` (`spec-meta.yaml:4-14,67-74`).

---

## 2. 📜 Scope

Yo limito el código principal futuro a `tools/private_master_helper.py`: entrada privada, bootstrap protegido, preflight no mutante, consentimientos separados, serialización efectiva de SQLite, receta acotada, auditoría y cierre seguro.

Incluyo como frentes posteriores un único módulo de tests Django focales y documentación de uso a cargo de `Lore Master`. No añado dependencias, framework de tests ni configuración persistente.

Fijo estas decisiones técnicas:

- **Adaptación limitada de la receta dentro del auxiliar.** No ejecutaré `crear_master` en producción desde el auxiliar ni modificaré su archivo. `call_command(..., password=...)` sería admisible como llamada in-process: su `parse_args` es memoria local, no `argv` del proceso (`django/core/management/__init__.py:120-194`; spec §7.3). Elijo adaptar porque el comando imprime el secreto, usa selecciones `.first()` y cesa holders con un `QuerySet.update()` que no recorre los `save()` auditados (`crear_master.py:44-62,114-117,142-150`; `auditlog/registry.py:49-54`). Evito esos riesgos sin ampliar los efectos funcionales.
- **Un único proceso y una única conexión Django de escritura.** Captura, consentimientos, transacción y sinks permanecen juntos; no hay subprocess, worker, fan-out ni transmisión de credenciales.
- **Reserva SQLite antes del preflight y mantenida hasta el cierre transaccional.** El auxiliar adquirirá `BEGIN IMMEDIATE`, comprobará su exclusión efectiva mediante una segunda conexión de comprobación sin DML y conservará la reserva durante preflight, consentimientos y captura. Así no necesita leer la contraseña vigente ni su hash para detectar un reset concurrente. El coste deliberado es mantener una reserva de escritura mientras responde el operador.
- **Atomicidad externa mediante un bloque Django exterior y resultado de commit/rollback observado.** No atribuyo bloqueo a `select_for_update`: SQLite hereda `has_select_for_update=False` (`django/db/backends/base/features.py:49-52`). Django permite `IMMEDIATE` y emite el `BEGIN` correspondiente (`django/db/backends/sqlite3/base.py:144,182-195,322-332`).
- **Errores constantes y salida privada.** Solo los prompts, banderas, conteos y códigos públicos permitidos llegan a la TTY controlada. Ningún error incorpora objetos, argumentos, filas o excepciones.

Estas son decisiones de implementación local, no un rediseño de autenticación, RBAC o arquitectura.

---

## 3. 📜 Out of scope

Yo excluyo expresamente:

- Ejecutar el auxiliar desde cualquier agente; pedir credenciales por chat o tools.
- Leer `.env`, credenciales, contenido de usuarios de la DB o estado actual de esa DB durante este encargo.
- Crear tenant, árbol, puestos de contexto, roles o catálogos desde el auxiliar.
- Reejecutar `init_access_model`, con o sin `--reset`.
- Cambiar el comando público, modelos, migraciones, permissions, sesiones, endpoints, settings, dependencias o stack.
- Reparar conflictos, reactivar entidades, promover usuarios temporales, desactivar primarios incompatibles o reconciliar drift.
- Crear backups, snapshots en disco, temporales o artefactos con identificadores, secreto o hash de autenticación.
- Shell, git, comandos, tests o verificaciones ejecutables en esta planificación; navegador, MCP, servidores o subagentes.
- Reabrir planes o gates padre, modificar su metadata o declarar cuentas/contexto preparados.

Anclas: spec §2.3-2.4, §12; límites explícitos del workstream.

---

## 4. 📜 Archivos probables

Yo propongo únicamente estos destinos posteriores, relativos al proyecto:

- `tools/private_master_helper.py` — único código operativo principal; creación del directorio si sigue ausente.
- `apipoligono/tests/test_private_master_helper.py` — tests nuevos y aislados, sin modificar fixtures compartidas ni tests existentes.
- Documentación de uso dentro del conjunto documental propio de esta spec — `Lore Master` resolverá su materialización; yo no fijo una ruta de persistencia adicional.

Conservo como fuentes, sin modificarlas:

- `apps/identity/management/commands/crear_master.py:23-140` — constantes, defaults y write set de referencia.
- `apps/identity/models.py:9-216` — relaciones, campos y unicidades declaradas.
- `apipoligono/models.py:124-171` — RUT único, campos de usuario, flags y temporalidad.
- `apps/tenants/models.py:17-25`, `apps/organizations/models.py:20-36`, `apps/authorization/models.py:81-122` — contexto y selección inequívoca de catálogo.
- `apps/identity/apps.py:9-20` y source instalado de `auditlog` — auditoría invocada.
- Source instalado de Django management, logging, SQLite y transacciones; `/usr/lib/python3.14/getpass.py`.
- `apipoligono/tests/_factories.py` y `test_master.py` — convenciones y baseline de tests. No heredo sus valores literales ni su captura de salida para el auxiliar.

---

## 5. 🎵 Pasos / fases

### Fase 1 — Construir la entrada protegida en el único auxiliar

Yo hago que importar el módulo no configure Django, abra la DB, lea entradas ni ejecute efectos. El entrypoint operativo queda separado de funciones pequeñas comprobables con dependencias sintéticas.

Antes de importar Django, settings o módulos del proyecto:

1. Guardar referencias y descriptores necesarios para restauración.
2. Redirigir los FD `1` y `2` a un sumidero del sistema sin almacenamiento; aislar también el FD `0` para impedir lectura heredada.
3. Sustituir `sys.stdout`, `sys.stderr`, `sys.__stdout__` y `sys.__stderr__` por wrappers descartadores no bufferizados, con soporte coherente de `write`, `flush`, `buffer`, `fileno` e `isatty`.
4. Sustituir `sys.stdin` y `sys.__stdin__` por entrada denegada. No utilizar `StringIO`, listas de mensajes ni capturadores en código operativo.
5. Deshabilitar emisión de logging antes del bootstrap y conservar el estado necesario para restaurarlo al final.
6. Rechazar cualquier argumento adicional sin formatearlo ni mostrar ayuda que lo reproduzca.
7. Abrir `/dev/tty` directamente en lectura-escritura y comprobar TTY y control de terminal. Este diseño es POSIX/Linux; una plataforma incompatible termina con código fijo, no activa otro mecanismo.

El único canal visible será ese descriptor privado. Si no existe, el proceso devuelve solamente un exit code documentado: nunca "explica" el fallo por stderr heredado.

**Criterio de fase:** inspección demuestra que ninguna entrada, importación de proyecto o excepción precede al boundary de salida. Ante montaje incompleto del boundary, detenerse sin bootstrap.

### Fase 2 — Bootstrap con privacidad efectiva, no nominal

Yo fijo el módulo de settings esperado dentro del proceso, sin aceptar selección por argumentos. No imprimo ni serializo settings o entorno.

Antes de `django.setup()`:

- Aplicar exclusivamente en memoria `DEBUG=False` y `LOGGING_CONFIG=None`; impedir configuración de handlers de consola, archivos, correo o telemetría.
- Mantener la deshabilitación global de logging durante todo el intervalo protegido.
- Derivar la raíz desde el archivo, no desde una ruta personal o el directorio de invocación.
- Mantener desactivada la generación de cachés de bytecode para los imports posteriores.
- No importar WSGI/ASGI, ejecutar management checks, seeds ni comandos de inicialización.

Después del bootstrap y antes de consultar datos:

- Comprobar que no aparecieron mecanismos de instrumentación o callbacks incompatibles con el boundary revisado.
- Garantizar `force_debug_cursor=False`, `queries_logged=False` y ausencia de wrappers SQL de instrumentación; no basta con deshabilitar el logger.
- Mantener `django-auditlog` y sus signals habilitados. Confirmar el registro de `Position`, `Assignment` y `UnitMembership`; abortar ante auditoría inesperada de campos de credencial, sin desregistrar modelos para continuar.
- No adjuntar el secreto a actores, correlation IDs, `additional_data`, objetos auditados o contexto de logging.

Anclas: `django/__init__.py:8-24`; `django/utils/log.py:67-76`; `django/db/backends/base/base.py:169-171,283-292`; `apps/identity/apps.py:9-20`.

**Criterio de fase:** la privacidad queda establecida antes de abrir la conexión o capturar contraseña. Configuración efectiva desconocida o incompatible implica stop, no modificación de settings en disco.

### Fase 3 — Capturar identificadores, adquirir serialización y realizar preflight

Yo capturo RUT y código de tenant mediante `getpass` sobre la TTY controlada, sin eco ni confirmación visual de sus valores. Valido campos y límites existentes sin inventar una nueva política de identidad.

Para todas las lecturas privadas:

- Convertir `GetPassWarning` en excepción antes de llamar a `getpass`.
- Usar `echo_char=None`; comprobar que puede desactivarse el eco y restaurar atributos de terminal en todos los caminos.
- No permitir fallback a stdin. El source emite la advertencia antes de efectuar la lectura fallback (`getpass.py:135-143`).
- EOF, interrupción o fallo de terminal terminan el intento; no hay recaptura automática.

Antes de abrir la DB, comprobar que el alias operativo es SQLite local, apunta a un archivo de desarrollo existente dentro del proyecto y no selecciona otra base, memoria o una ubicación ajena. La apertura debe impedir crear una DB vacía implícitamente. Rechazar opciones de inicialización SQL no revisadas.

Después:

1. Exigir conexión sin transacción previa y sin callbacks de commit pendientes.
2. Usar temporalmente `transaction_mode="IMMEDIATE"` en esa conexión ya inicializada; restaurar su estado al cerrar. Timeout de contención inmediato, sin retry.
3. Entrar en un único bloque exterior `atomic(durable=True, savepoint=False)`.
4. Comprobar la exclusión efectiva: una segunda conexión independiente al mismo archivo existente intenta una sola vez `BEGIN IMMEDIATE`, sin DML. Solo la contención SQLite esperada, identificada por código del driver y no por texto de excepción, confirma el mecanismo. Éxito inesperado u otro fallo implican rollback y serialización insuficiente. Cerrar siempre la conexión de comprobación.
5. Mantener la reserva hasta commit o rollback. Ningún prompt se realiza después de liberar esa protección.

Dentro de ella, construir un snapshot determinista en memoria, con listas de campos no credenciales explícitas y orden por PK. No cargar `password` mediante consultas completas, lazy loading o `repr`. El snapshot contiene todas las filas, estados y relaciones que determinan los efectos:

- Tenant por código: activo y `context="military"`.
- Rol `super_admin`: selección global inequívoca y activa; no elegir silenciosamente un homónimo de otro tenant.
- Raíz activa única del tenant: cero significa contexto ausente; varias significan conflicto.
- `MASTER`: existencia, actividad, campos que sobrescribe la receta y relaciones preservadas.
- Usuario por RUT y colisiones de username; actividad y `is_temporary`.
- `Person` por documento, `Account` por usuario y posibles colisiones de `(person, tenant)`; coherencia entre usuario, persona y tenant.
- Todas las coincidencias del Assignment destino y membership a la raíz, incluidos históricos que volverían ambiguo un upsert.
- Primarios, secundarios y relaciones relevantes de la cuenta destino.
- Holders activos de `MASTER` distintos del destino: PK y estado completos en memoria, pero solamente conteos en la TTY.
- Estados necesarios de sus relaciones para detectar entidades incompatibles.
- Constraints efectivas necesarias y `ContentType` existentes para las tres entidades auditadas. No crear metadatos faltantes: `get_for_model` podría hacerlo (`django/contrib/contenttypes/models.py:35-61`).

Yo detengo el proceso ante:

- Entidad destino inactiva o temporal; vínculo a otra persona/tenant; username ocupado por otra identidad.
- Coincidencias duplicadas, más de un primario activo o primario incompatible, también en memberships.
- Fechas incoherentes: fin anterior al inicio, inicio futuro en entidad activa o fin no nulo incompatible con actividad. La nulabilidad permitida por el modelo no se convierte por sí sola en defecto.
- Duplicación de holders incompatible con `is_unique_holder=True`.
- Relaciones de Position incompatibles que la receta no corrige expresamente.
- Constraints o auditoría insuficientes. No ejecutar migraciones ni reparar filas.

El preflight visible contiene solo banderas, conteos y constantes públicas `MASTER`/`super_admin`; no nombres, RUT, correos, PK o columnas de credencial.

**Criterio de fase:** ningún DML precede al consentimiento. Una reserva transaccional no equivale a crear o modificar filas.

### Fase 4 — Consentimientos separados y contraseña repetida

Yo derivaré las confirmaciones del snapshot, no de decisiones retrospectivas:

- `PDA-C-01`: creación de cualquier fila de identidad/acceso faltante.
- `PDA-C-02`: usuario existente; sobrescritura de los campos de receta, contraseña y flags globales `is_staff`, `is_superuser`, `must_change_password`. Explicar su alcance global sin mostrar valores.
- `PDA-C-03`: Position `MASTER` existente; sobrescritura de campos de la receta, incluidos `name` y `description`, además de unidad, rol, scope y flags.
- `PDA-C-04`: cese del conteo exacto mostrado. Vincular la aceptación al snapshot y a ese número, nunca a una consulta posterior abierta.

Cada pregunta es independiente, sin eco y negativa por defecto. Solo una respuesta afirmativa explícita habilita ese consentimiento; cualquier respuesta restante termina el intento. Si aplican C-01 y C-02 simultáneamente, exigir ambas.

Solo después de obtener todas las confirmaciones solicito la contraseña dos veces. Comparo exactamente, sin recortar ni normalizar. Discrepancia, vacío no utilizable o error de captura abortan sin retry y antes de escribir. Descarto inmediatamente la segunda referencia y reduzco la vida de la primera.

**Criterio de fase:** consentimiento parcial, captura fallida o cancelación producen cero escrituras, incluida auditoría.

### Fase 5 — Revalidar, aplicar la receta acotada y cerrar una sola vez

Yo releo y comparo íntegramente el snapshot bajo la reserva todavía vigente, inmediatamente antes del primer DML. Drift implica rollback, sin reconciliación.

Recupero los defaults no sensibles y constantes del comando fuente —puede usarse su parser sin introducir ni parsear credenciales, con `Command` y `OutputWrapper` conectados a descartadores— y aplico únicamente esta secuencia:

1. **Position:** crear o actualizar `MASTER` con los defaults de `crear_master.py:69-81`. Preservar campos no enumerados; no "limpiar" armory, recinto ni permisos.
2. **Usuario:** crear o actualizar solo los campos de `:84-98`, incluida `username=rut` y el hash generado mediante `make_password` para almacenamiento de autenticación. Preservar los demás campos. No añadir `set_password` o hooks con efectos distintos a la receta.
3. **Person:** crear solo si falta, con defaults de `:100-107`; una existente compatible se conserva.
4. **Account:** crear solo si falta, con defaults de `:109-112`; una existente compatible se conserva.
5. **Holders consentidos:** actualizar exactamente los PK del snapshot: `is_active=False`, `is_primary=False`, `ends_at=now`. Usar `save(update_fields=...)` por fila para conservar auditoría. No alterar sus usuarios, cuentas, otros Assignments o memberships.
6. **Assignment destino:** crear o actualizar la coincidencia única admitida con los defaults de `:119-128`.
7. **UnitMembership destino:** crear o actualizar la coincidencia única admitida con los defaults de `:130-140`. El comando no limpia `ends_at` existente; el preflight ya habrá excluido una fila incompatible.

El cese afecta esas asignaciones, no equivale a desactivar globalmente las cuentas anteriores ni a retirar otros privilegios. No añado un Assignment de tirador: este comando no lo crea.

Todas las escrituras y entradas legítimas de auditoría deben usar el mismo alias y transacción. Conservar los signals; no inventar un actor autenticado atribuyendo la orden al usuario destino. Las entradas de auditoría de cese son la adaptación necesaria frente al bulk update del original.

Antes del commit:

- Verificar conteo exacto de ceses, primarios, relaciones y estado resultante esperado.
- Confirmar preservación de filas/campos fuera del write set y ausencia de callbacks poscommit inesperados.
- Confirmar auditoría esperada de los cambios efectivos, sin secreto ni hash en sus payloads.
- Preparar el resumen no sensible antes de cruzar el punto de commit.

Para distinguir rollback real de cierre aparente, observar temporalmente las llamadas de commit/rollback de la conexión con indicadores y contadores, sin conservar excepciones o parámetros. El controlador exterior realiza la única reversión; no añadir otra después. Esto importa porque `Atomic.__exit__` puede cerrar la conexión y ocultar un error de rollback (`django/db/transaction.py:261-299`).

- Fallo precommit o de escritura: rollback una vez.
- Rollback confirmado: código fijo de fallo revertido.
- Rollback fallido o resultado no comprobable: código fijo de estado indeterminado; nunca afirmar cero efectos.
- Commit confirmado: resumen privado de banderas y conteos.
- Fallo de comunicación/restauración después de commit confirmado: informar mediante estado fijo que el commit ocurrió; no afirmar rollback ni ejecutar compensaciones.

Yo no prometo revertir un commit ya confirmado. Mantengo sinks hasta haber cerrado conexiones y descartado secreto, objetos portadores y referencias de error; luego restauro terminal y recursos. No hay retry automático en ningún caso.

### Fase 6 — Tests, revisión y documentación, sin ejecutar aquí

Yo encadeno después del código:

1. Autoría del único módulo de tests nuevo, con datos sintéticos exclusivamente test-only.
2. Revisión focal de seguridad y código sobre entrada, sinks, logging efectivo, selección de filas, transacción, auditoría y equivalencia.
3. Documentación de `Lore Master`: invocación sin argumentos sensibles, prerrequisitos, consentimientos, códigos y significado de rollback/indeterminado.
4. Solo posteriormente, ejecución privada del operador, nunca del agente.

Los tests y la documentación pueden ser frentes separados después del plan; no divido la ejecución operativa del auxiliar.

---

## 6. Riesgos

Yo mantengo visibles estos puntos:

- **Fuga por rutas omitidas:** sustituir únicamente `sys.stdout` no cubre FD, streams originales ni handlers de archivo. La revisión debe abarcar el proceso completo, incluido bootstrap y cierre (spec `PDA-R-06..09`).
- **Eco fallback:** `getpass` puede leer tras advertir; convertir la advertencia en error y negar stdin es obligatorio (`getpass.py:59-99,135-143`).
- **Bloqueo prolongado de SQLite:** mantener `IMMEDIATE` durante interacción impide otros escritores. Lo acepto solo para este auxiliar local de uso único; contención implica abortar, no detener servidores.
- **Unicidad incompleta:** `Assignment` y `UnitMembership` no declaran unicidad de pares/primarios en sus `Meta` (`identity/models.py:149-150,208-213`). La exclusión de escritura y los checks del auxiliar cubren sus decisiones sin añadir constraints.
- **Sobrescritura global del usuario:** los flags y la contraseña pertenecen al usuario, no a un acceso aislado del tenant; C-02 debe decirlo claramente.
- **Auditoría colateral:** `auditlog` solicita `ContentType` y representa objetos (`auditlog/models.py:56-79`). Preflight debe impedir creación implícita de metadatos; no alterar la auditoría legítima para ocultar identidad.
- **Drift de receta:** adaptar obliga a comparar defaults y efectos con el comando fuente, pero no a reproducir sus errores, salida sensible o falta de auditoría del bulk update.
- **Límites inevitables:** no garantizo borrado físico de strings, detección de grabaciones de terminal ni recuperación observable ante terminación no interceptable. Son limitaciones expresas de la spec §13.
- **Autorización:** `approved` no autoriza por sí solo implementación o ejecución. El orquestador debe respetar el encargo posterior correspondiente (`spec-meta.yaml:67-74`).

La ausencia histórica de contexto no bloquea este plan. Sí impedirá una ejecución hasta que el workstream separado lo prepare y el auxiliar constate sus prerrequisitos.

---

## 7. Verificaciones

Yo aplico la escalera proporcional de `docs/proportionalidad.md:214-233`:

- **Nivel 1, por fase:** inspección del archivo/diff y trazabilidad contra `PDA-R-*`, `PDA-C-*`. Confirmar que solo aparecen los destinos autorizados y que no existen ejemplos de credenciales, capturadores operativos o writes de contexto.
- **Nivel 3, propuesto y sujeto a autorización:** tests dirigidos del módulo nuevo, no suite completa. No ejecutar el entrypoint del auxiliar ni usar la DB de desarrollo.

Cobertura mínima propuesta:

1. Argumentos rechazados; TTY ausente; fallo de eco; `GetPassWarning`; EOF; contraseña discrepante: ninguna lectura fallback ni escritura.
2. Sinks de streams globales, `buffer`, FD y `OutputWrapper`; mensajes y excepciones con marcadores sintéticos descartados, sin payload en errores.
3. Bootstrap: privacidad activa antes de setup, queries no registradas, logging sin payload y auditoría habilitada.
4. Preflight: contexto ausente, raíz ambigua, rol incompatible, usuario temporal/inactivo, persona/tenant divergentes, duplicados, fechas y primarios incompatibles.
5. Matriz C-01..04: negar cada consentimiento aplicable produce cero writes; C-04 queda ligado a cantidad y snapshot.
6. Snapshot alterado antes de aplicar la receta: drift y cero writes.
7. SQLite de archivo test-only y conexiones independientes: exclusión efectiva, contención y ausencia de retry. Usar `TransactionTestCase` para esta cobertura, no una transacción exterior implícita de `TestCase`.
8. Fallo inyectado tras cada etapa del write set y durante auditoría: restauración de filas y logs; rollback fallido informa indeterminado y se intenta una sola vez.
9. Efectos consentidos: campos exactos, preservación de secundarios y relaciones ajenas, cese exacto, auditoría sin credencial/hash.
10. Equivalencia con `crear_master` en estados sintéticos válidos e inequívocos, usando descartadores también para el comando baseline; excluir de la equivalencia sus canales sensibles y el déficit de auditoría del cese.

La DB de tests debe ser aislada antes de comenzar el runner. Si el runner disponible no asegura SQLite de archivo test-only para concurrencia, detener esa ejecución y solicitar únicamente autorización para preparar/ejecutar ese entorno de test; no cambiar settings del proyecto ni improvisar contra la DB local.

No propongo build o typecheck: no aportan una comprobación útil al único script Python. Tampoco elevo automáticamente a lint o suite completa.

**Resultado observable reservado al operador:** en su terminal privada deberá constatar ausencia de eco y secreto en argv/salidas/logs/artefactos; cero efectos ante rechazo o fallo; efectos exactos consentidos y auditoría conservada. Su evidencia no debe contener credenciales. Tests o revisiones no sustituyen esa observación ni permiten inferir `PDA-V-01..13`.

---

## 8. 🪕 Handoff para `Code Transmuter`

Yo entrego este orden obligatorio: **boundary → bootstrap protegido → conexión y serialización comprobada → snapshot/preflight → consentimientos y captura → revalidación → receta y auditoría → cierre observado → tests focales**.

Implementar únicamente `tools/private_master_helper.py`; añadir el módulo de tests solo en el encargo posterior autorizado. Mantener el comando público y todos los modelos/configs intactos. No ejecutar el auxiliar, pedir contraseña, consultar usuarios reales, crear contexto o reintentar operaciones.

Mis stop conditions son inequívocas: privacidad no establecida, backend/DB incompatible, serialización no comprobada, contexto insuficiente, conflicto, consentimiento incompleto, captura fallida, drift, efecto inesperado o auditoría insuficiente. Antes del commit, revertir una vez; si la reversión no se demuestra, declarar indeterminado.

Fijar un catálogo interno de errores y exit codes que distinga, como mínimo: argumentos inválidos; TTY ausente; eco no controlable; capturas discrepantes; tenant/rol/raíz ausentes; conflicto; consentimiento faltante; serialización insuficiente; drift; fallo revertido; reversión indeterminada; defecto interno. Mensajes constantes, sin `str`, `repr`, traceback, locals o valores recibidos.

No hay skills requeridas en este encargo. La revisión de seguridad del código sigue pendiente y no se sustituye por este plan. `Lore Master` recibe la documentación de uso y la persistencia del payload; no se incorporan docs al trabajo del writer de código.

Verificación mínima de cierre: inspección focal del diff y del boundary, más los tests dirigidos únicamente si cuentan con autorización expresa y aislamiento comprobado. Entregar evidencia y limitaciones, no un veredicto de funcionamiento.

---

## 9. Dependencias (derivación de la persistencia)

Derivadas de §5 (`Pasos / fases`) y de las notas del preflight. Una línea por dependencia; ninguna es satisfied por este artefacto.

| Dependencia | Naturaleza | Estado |
|---|---|---|
| Alcance aprobado de `spec-private-master-helper-001` (`./spec-meta.yaml:7`, `approved`) | Habilita planificación y revisión; **no** habilita implementación ni ejecución (`./spec-meta.yaml:67-74`) | vigente |
| Orden explícita del operador para implementar y para ejecutar | Requisito duro de la separación planificación-ejecución | **ausente** |
| Autorización expresa para el Nivel 3 (tests dirigidos) y aislamiento previo de una DB de test SQLite en archivo | Requisito de §7; sin ella, §7 queda en Nivel 1 | **ausente** |
| Workstream separado que prepare el contexto (tenant, raíz activa, roles, catálogos) | §6 declara que su ausencia no bloquea el plan pero sí impide la ejecución | pendiente, fuera de este `plan_id` |
| `tools/` (creación del directorio si sigue ausente) y convención de tests en `apipoligono/tests/` | Destinos declarados en §4; este plan no los crea | sin crear |
| Source instalado de Django (management, `transaction`, backends, contenttypes), `django-auditlog` y `/usr/lib/python3.14/getpass.py` | Fuentes de la evidencia citada en §2, §4, §5 y §6, leídas por el autor y **no** verificadas en esta persistencia | sin relectura |
| Archivo de desarrollo SQLite existente dentro del proyecto, como precondición de runtime | Precondición declarada en §5 Fase 3; su estado actual no se consultó | **no verificada** |
| Plan Review Gate de este `plan_id` | Si el orquestador lo activa, este `PLAN_PATH` es su prerequisito duro y su primer ciclo será `r1` | no despachado |

---

## 10. Referencia a spec (derivación de la persistencia)

| Artefacto | Ruta | Estado leído |
|---|---|---|
| Metadata canónica | [`./spec-meta.yaml`](./spec-meta.yaml) | `status: approved` (`:7`), `created_at`/`approved_at` `2026-10-05` (`:11-13`), `verified_at: null` (`:14`), `risk.level: high` con flags `auth`, `permissions`, `sensitive-data` (`:33-38`), gates `tests`/`security_review`/`code_review`/`documentation` = `required` (`:19-23`), `specialist_reviews` en `n/a` (`:25-31`) |
| Cuerpo de la spec | [`./spec.md`](./spec.md) | No re-leído en esta escritura; citado por el autor como `§1.2`, `§2.3-2.4`, `§7.3`, `§12`, `§13` |
| Índice de la spec | [`./index.md`](./index.md) | Orden de lectura declara dos tomos (§"Orden de lectura"), ninguno de ellos este plan |
| Spec padre | [`../final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) · [`../final-frontend/index.md`](../final-frontend/index.md) | `related_specs` (`:40-45`); **no** modificada ni reasignada en esta escritura |

> 📜 **Drift registrado, no corregido (fuera del `IN_SCOPE` de esta persistencia).** La creación de este archivo deja desactualizadas dos afirmaciones de la spec que declaraban su ausencia:
>
> - [`./spec-meta.yaml:101-103`](./spec-meta.yaml) — «Sin plan: no existe `plan_payload` ni artefacto de plan para este auxiliar».
> - [`./index.md:43`](./index.md) — «No existe plan de implementación para este auxiliar».
>
> Ninguna se edita aquí: la corrección de metadata e índice de la spec pertenece a otro `plan_id`. Se registran como riesgo documental abierto, no como hecho consumado, y su corrección requiere workstream propio con su propio `IN_SCOPE`.

> 🕯️ **Límite de lo afirmado por esta persistencia.** Este archivo **no** afirma que el auxiliar exista, que sus criterios `PDA-V-01..13` hayan sido observados, que ningún gate esté superado ni que el comportamiento privado sea correcto: el archivo `tools/private_master_helper.py` **no existe** en el alcance de este plan y su código **no** ha sido leído, ejecutado ni auditado aquí. Las citas `archivo:línea` son transcripción de la evidencia del autor sobre source leída.

---

## Historial de revisiones

### p1 — 2026-10-05 — cuerpo inicial `final-frontend-private-master-helper-plan` (persistencia mecánica `TIER: FAST`, `Lore Master`)

- **Motivo:** persistencia inicial del `plan_payload` de `Cunning-Bard` (sesión `ses_ef152b5b1ffe53iRIL4JZkNJtl`, `HANDOFF` terminal) para `spec-private-master-helper-001` ya aprobada (`./spec-meta.yaml:7`). Es el primer cuerpo de este `plan_id`, y también el primer artefacto de plan de esta spec.
- **Delta breve:** primera versión del archivo. §1–§8 = transcripción literal de las 8 secciones canónicas del payload, con sus subsecciones `### Fase 1`–`### Fase 6`, listas, checkpoints y anclas `archivo:línea`. §9 y §10 son las dos derivaciones obligadas de la SSOT de persistencia. Frontmatter creado con `payload_revision: p1` y `status: draft`. No hay bloque de diff: no existe revisión previa que comparar.
- **Gate:** **no despachado** al cierre de esta escritura. Sin sección `## Plan Review Gate`, sin claves `review_gate`/`review_gate_revision`, sin checkpoint prelaunch y sin veredicto. Estado `DRAFT_PERSISTED`; `payload_revision` queda en `p1`.
- **No tocado en esta escritura:** `./spec-meta.yaml`, `./spec.md`, `./index.md`, los tres planes de [`../final-frontend/`](../final-frontend/) y el puntero histórico `../final-frontend/private-development-account-spec.md`. El drift de `spec-meta.yaml:101-103` e `index.md:43` queda registrado en §10, no corregido.
- **Acciones técnicas:** ninguna. Sin comandos, tests, navegador, subagentes, base de datos ni verificación de comportamiento.