---
spec_meta: "./spec-meta.yaml"
spec_id: "spec-private-master-helper-001"
document_role: "supplemental"
parent_spec_id: "spec-final-frontend-001"
status: "approved"
approved_at: "2026-10-05"
verified_at: null
approval_basis: "Auxiliar privado — elección explícita del operador de la vía «Auxiliar privado» (§1.2, A-1..A-5)"
---

# Spec — Auxiliar privado para la cuenta de desarrollo (rol raíz)

> 🕯️ **Qué significa `status: approved`.** Es la aprobación del **alcance** de este documento, con la base de §1.2. **No** es autorización de implementación, instalación ni ejecución, **no** es veredicto de verificación y **no** es permiso de ejecución para agentes (§12, `PDA-X-01`). El registro canónico vive en [`spec-meta.yaml`](./spec-meta.yaml) de esta carpeta; la metadata de la spec padre es otra y vive en [`../final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) — no se confunden. El identificador sigue el formato canónico `spec-<slug>-<numero>` (`docs/sdd.md` > Numeración de IDs).

## Índice

1. [Objeto y base de aprobación](#1-objeto-y-base-de-aprobación) · 2. [Contexto de datos](#2-contexto-de-datos-estado-histórico-bloqueo-y-autorización-separada) · 3. [Anclas de fuente](#3-anclas-de-fuente) · 4. [Requisitos](#4-requisitos-del-auxiliar) · 5. [Preflight](#5-preflight-de-solo-lectura) · 6. [Confirmaciones](#6-confirmaciones-negativas-por-defecto) · 7. [Atomicidad, drift, reversión y elección de receta](#7-atomicidad-drift-reversión-y-elección-de-receta) · 8. [Criterios observables](#8-criterios-observables-de-aceptación) · 9. [Gates](#9-gates-aplicables) · 10. [Dependencias, trazabilidad y localizador](#10-dependencias-trazabilidad-y-localizador) · 11. [Riesgos](#11-riesgos) · 12. [Exclusiones](#12-exclusiones) · 13. [Límites de lo afirmado](#13-límites-de-lo-afirmado)

---

## 1. Objeto y base de aprobación

**1.1 Objeto.** Auxiliar **privado, local y de ejecución única** para que el operador **prepare** la cuenta de desarrollo con rol raíz de un tenant **ya existente** (`super_admin`, posición `MASTER`). Única diferencia aceptable frente al comando actual: el secreto se captura **exclusivamente en su terminal privada** y no viaja por la línea de comandos del proceso, la salida ni el chat.

- **Artefacto propuesto:** `tools/private_master_helper.py`. Ruta **propuesta**: `tools/` **no existe hoy** (verificado por listado el 2026-10-05). Nada de este documento crea ese archivo.
- **Alcance funcional:** preflight de solo lectura, confirmaciones negativas, y sólo entonces el write set de §7.
- **Lo que no es:** un bootstrap. No crea tenant, rol, unidad raíz ni catálogos; no reinstala, no resetea, no migra.
- **No hace:** no fija el algoritmo final (§7.2), no modifica planes, gates, autenticación ni RBAC, no ejecuta nada, no declara verificado comportamiento alguno (§13).

**1.2 Base de aprobación (circunscrita).**

| # | Hecho de aprobación | Naturaleza |
|---|---|---|
| A-1 | El operador eligió la vía **«Auxiliar privado»** frente a reutilizar el comando con contraseña en argumentos o editar el comando público | Elección explícita del operador |
| A-2 | **Captura exclusiva en su terminal privada** | Restricción del operador |
| A-3 | El secreto **no** aparece en argumentos, salida ni chat | Restricción del operador |
| A-4 | **Ningún acceso existente se altera sin confirmación explícita** | Restricción del operador |
| A-5 | Diseño de seguridad del auxiliar: handoff `ses_ef1ad5c5fffeDGSdOTXuYXXo6B` (`Dhampir-Slayer`), entregado y contrastado contra §3 | Evidencia técnica upstream; no es autorización |

> 📜 **Lo aprobado lo dice el verbo.** Está aprobado **preparar y revisar** el auxiliar y su invocación local. **No** está aprobado ejecutarlo desde agentes (§2.4), **no** está aprobado que el auxiliar cree contexto, **no** está aprobado el acceso al navegador autenticado ni simular sesiones. Si algo no figura en A-1..A-5, no está aprobado. **1.3 Lo que este documento no hace:** no fija el algoritmo final (§7.2), no crea el archivo auxiliar, no modifica planes, gates, autenticación ni RBAC, no ejecuta nada y **no declara verificado** comportamiento alguno (§13).

---

## 2. Contexto de datos: estado histórico, bloqueo y autorización separada

**2.1 Estado observado en una introspección previa — no reconsultado.** La introspección de `ses_ef1ad5c5fffeDGSdOTXuYXXo6B` registró el tenant **`ejercito-demo` ausente** y conteos de catálogos **`8/5/41`**. Esa base **no se reconsultó** al redactar este tomo y nada aquí afirma que el estado actual siga igual.

**2.2 La ausencia de contexto sigue siendo precondición operativa.** `crear_master` aborta con `CommandError` si falta cualquiera de los tres prerrequisitos (`apps/identity/management/commands/crear_master.py:44-67`): tenant existente y `is_active=True` (`:44-48`, indica crearlo antes con `init_access_model`); rol `super_admin` existente (`:50-54`, indica ejecutar `init_access_model`); unidad raíz del tenant activa con `parent__isnull=True` (`:59-67`, indica crear al menos una). El comando **no crea** contexto y el auxiliar **no hereda ni amplía esa limitación**: mientras falte, **aborta antes de escribir**, que es el comportamiento correcto (`PDA-V-09`).

**2.3 Efectos globales de `init_access_model` — rerun prohibido.** Efectos verificados por lectura en `apps/identity/management/commands/init_access_model.py`:

- `:263-268` — upsert de roles de `DEFAULT_ROLES` con `name`, `description`, `is_active=True`: efecto **global** sobre la tabla de roles.
- `:300-314` — rama `--reset`: borra roles y scopes fuera de `LIVE_ROLE_CODES` / `LIVE_SCOPE_CODES`: **destructivo** e irreversible.
- `:316-352` — migra usuarios legacy a `Person`+`Account` recorriendo `User.objects.all()`: efecto **global** sobre todas las cuentas, no sólo las que difieren.

⚠️ **Prohibición explícita:** ningún componente —auxiliar, plan o revisión— puede *rerunear* `init_access_model`, con o sin `--reset`, para "desbloquear" contexto. La autorización de §2.4 **no** incluye reset, RBAC, ni tocar usuarios o holders existentes.

**2.4 Creación del contexto faltante: autorizada, en workstream separado.** El operador autorizó, en respuesta a una pregunta concreta sobre esta materia, **preparar exclusivamente el contexto de receta que falte** —institución, árbol de unidades y puestos—, declarando que **no existe producción ni datos reales**. 🕯️ **Lo que cambia y lo que no:** la ausencia de contexto **deja de ser una falta de consentimiento**; preparar el contexto está autorizado. Sigue siendo (a) un estado **histórico no reconsultado** (§2.1) y (b) una **precondición operativa** del auxiliar: mientras falte, el auxiliar aborta sin escribir (§2.2, `PDA-V-09`). El consentimiento de los **efectos de `MASTER`** sigue siendo **exclusivo del operador en su terminal privada** (§1.2, §6). Ningún agente ejecuta el auxiliar.

| Aspecto | Contenido |
|---|---|
| Qué autoriza | Crear sólo lo que falte para que la receta tenga contexto |
| Dónde vive | En un **workstream separado**, con su propio encargo |
| Qué **no** autoriza | `reset`, cambios de RBAC o roles, tocar usuarios, cuentas o holders existentes, ni datos de producción |
| Qué **no** implica | Incorporar esa creación al auxiliar (`PDA-X-03`, `PDA-X-06`), ni ejecutar aquí seeds, migraciones o escrituras |

> 🕯️ **Lo que cambia y lo que no.** La ausencia de contexto **deja de ser una falta de consentimiento**: preparar el contexto está autorizado. Sigue siendo (a) un estado **histórico no reconsultado** (§2.1) y (b) una **precondición operativa** del auxiliar: mientras falte, el auxiliar aborta sin escribir (§2.2, `PDA-V-09`). El consentimiento de los **efectos de `MASTER`** sigue siendo **exclusivo del operador en su terminal privada** (§1.2, §6). Ningún agente ejecuta el auxiliar.

---

## 3. Anclas de fuente

Las 17 anclas siguientes fueron **leídas y contrastadas** el 2026-10-05 contra el disco del proyecto y su `.venv`; `ses_ef1ad5c5fffeDGSdOTXuYXXo6B` es su **fuente** y este tomo las confirma. 🕯️ **Lo que no prueban:** ninguna línea fue ejecutada, así que no hay afirmación sobre comportamiento observado, ni sobre el contenido actual de la base de datos, ni sobre la configuración efectiva de settings, ni sobre el resultado de ningún comando.

- **S-01** `crear_master.py:31-33` — `--rut`, `--password` y `--tenant-code` son `required=True`; la ayuda de `--password` dice «Contrasena en plano (se hashea)». · **S-02** `:144-146` — la salida final **imprime la contraseña en claro** (`f'  Contrasena: {password}'`) junto a RUT, tenant y posición. · **S-03** `:44-67` — tres `CommandError` de prerrequisito: tenant activo, rol `super_admin`, unidad raíz activa.
- **S-04** `crear_master.py:69-81` — `Position.objects.update_or_create(tenant, code='MASTER', …)` fija `organization_unit`, `role`, `scope_policy=None`, `is_active=True`, `is_unique_holder=True`; sobre posición existente **sobrescribe**. · **S-05** `:84-98` — `User.objects.update_or_create(rut=…)` fija `username`, nombres, correo, `is_active/staff/superuser=True`, `must_change_password=False` y `password=make_password(password)`; en la rama de actualización **sobrescribe la contraseña**. · **S-06** `:100-112` — `Person.objects.get_or_create(document_id=rut, …)` y `Account.objects.get_or_create(user=user, …)`. · **S-07** `:114-117` — cesa a los holders activos de `MASTER` distintos de la cuenta destino: `is_active=False`, `is_primary=False`, `ends_at=now()`. · **S-08** `:119-140` — `Assignment` y `UnitMembership` con `update_or_create(…, is_primary=True, is_active=True, starts_at=now(), ends_at=None)`. · **S-09** `:1-150` (completo) — **cero apariciones** de `atomic` o `transaction`: hoy su write set **no es atómico**. · **S-10** `:8-10` — el docstring muestra una invocación de ejemplo con contraseña literal: es documentación, y el auxiliar **no debe heredar ni copiar** ese ejemplo.
- **S-11** `apps/identity/apps.py:9-20` — `IdentityConfig.ready()` registra con `django-auditlog` exactamente `Position`, `Assignment` y `UnitMembership`, con exclusiones de timestamps. · **S-12** `.venv/lib/python3.14/site-packages/django/__init__.py:3` — `VERSION = (5, 2, 15, "final", 0)`.
- **S-13** `/usr/lib/python3.14/getpass.py:51-60` — `unix_getpass` intenta primero `os.open('/dev/tty', O_RDWR|O_NOCTTY)` y construye el `stream` sobre esa TTY; sólo ante `OSError` pasa al fallback. · **S-14** `getpass.py:135-143` — `fallback_getpass` emite `GetPassWarning` («Can not control echo on the terminal.»), advierte que la entrada puede quedar con eco y **de todos modos lee el secreto**.
- **S-15** `django/core/management/base.py:454-457` — `BaseCommand.execute` envuelve `options['stdout']` / `['stderr']` en `OutputWrapper`: punto de inyección de sumideros para `call_command`. · **S-16** `base.py:178-186` — `Command.write()` enruta todo mensaje por `self._out.write(style_func(msg))`.
- **S-17** `django/core/management/__init__.py:129,169,171,172,194` — `call_command` acumula los `**options` en una **lista local** `parse_args`, materializa cada valor como `str(value)` o `map(str, value)` (`:169`, `:171`) y lo entrega al parser interno (`:172`), terminando en `command.execute(*args, **defaults)` (`:194`). El único `sys.argv` del módulo está en `ManagementUtility.__init__` (`:203`), ruta ajena a esta vía. **Ver §7.3.**

---

## 4. Requisitos del auxiliar

Identificadores estables para que el plan y la revisión los referencien. Los *(diseño)* provienen del handoff consultivo y son **especificación a implementar**, no comportamiento existente.

### 4.1 Captura del secreto — `PDA-R-01..05`

- **`PDA-R-01`** — El auxiliar **no acepta el secreto por argumento, opción, flag, variable de entorno, archivo, config ni stdin**; la única vía de entrada es el prompt. Gobierna la **superficie de invocación del auxiliar** —la línea de comandos que el operador escribe— y **no** se confunde con copias en memoria dentro del proceso (§7.3). *Ancla:* `S-01`: hoy el secreto viaja en la línea de comandos, legible para otros procesos y en el historial del shell.
- **`PDA-R-02`** — El prompt se emite **exclusivamente sobre el canal privado controlado**: una TTY abierta por el propio proceso, con el prompt escrito en ese descriptor y no en los flujos heredados del padre. *Ancla:* `S-13`: `/dev/tty` es el mecanismo canónico; el prompt no debe viajar por el `stdout` que el padre captura.
- **`PDA-R-03`** — La lectura **debe ocurrir sin eco**. Si el mecanismo emite `GetPassWarning`, o si no se puede confirmar una TTY privada en lectura-escritura, el auxiliar **aborta** con código fijo. **No** existe fallback a lectura con eco. *Ancla:* `S-14`: el fallback **lee igual** y sólo advierte.
- **`PDA-R-04`** — El secreto se **solicita dos veces**; ambas entradas deben coincidir exactamente; la discrepancia aborta con código fijo y **no** reintenta. *(diseño)*: la confirmación manual corta la vía de tecleo erróneo con eco accidental.
- **`PDA-R-05`** — El valor capturado se mantiene en el **menor número de referencias vivas** posible, se **descarta explícitamente** al terminar el camino feliz y **nunca** se copia a estructuras que se impriman, registren o persistan. Esto **no** promete borrado físico del objeto en memoria: es imposible garantizarlo en un runtime gestionado. *(diseño)*; coherente con `S-02`: el defecto actual es que el secreto se copia a la salida.

### 4.2 Supresión de canales y sumideros — `PDA-R-06..07`

- **`PDA-R-06`** — Durante **todo** el proceso el auxiliar no escribe en los flujos de salida del padre: stdout y stderr se sustituyen por **wrappers descartadores no bufferizados**, y la sustitución cubre también la ruta de Django (`self.stdout`, `self.stderr`). *Anclas:* `S-15`, `S-16`: la sustitución existe como punto de inyección; `S-02` demuestra que sin ella el secreto escapa por `self.stdout.write`.
- **`PDA-R-07`** — La sustitución se aplica al **espacio global y a los descriptores** del proceso durante el mismo intervalo, y se restaura al finalizar. Ninguna biblioteca interna —ORM, runner de comandos, logging— escribe en los flujos del padre mientras el auxiliar está activo. *(diseño)*: sustituir sólo `sys.stdout` deja fuera `sys.__stdout__`, `sys.__stderr__`, `sys.__stdin__` y los descriptores `1`/`2` heredados.

### 4.3 Modelo de errores — `PDA-R-08`

- **`PDA-R-08`** — Todo fallo termina con un **identificador fijo**, estable y **no sensible**, más un mensaje de **plantilla constante**. El mensaje **no** incluye `str()` ni `repr()` de objetos, ni `traceback`, ni `locals()`, ni payloads de excepción, ni valores de fila, ni argumentos recibidos. Si el detalle es imprescindible, se trata como **pregunta anterior**, no como parte del mensaje.

**§4.3.1 Identificadores de fallo — literales internos del diseño técnico.** Lo que se exige es **fijez, estabilidad y no sensibilidad** del identificador, y que el operador pueda distinguir sin ambigüedad: invocación con argumentos no aceptados · TTY privada no disponible / eco no controlable (entre sí) · las dos capturas no coinciden · falta de contexto — tenant / rol / unidad raíz (cada uno de los otros, y de conflicto) · conflicto de preflight · falta de confirmación aplicable · serialización insuficiente / drift del snapshot (entre sí) · write set fallido a mitad / reversión fallida (entre sí) · defecto interno. 🕯️ El conjunto **literal** de nombres y sus clases de salida es decisión interna del diseño técnico, **no** un requisito de producto cerrado: puede ajustarse al implementar sin reabrir esta spec. Lo que **no** es ajustable es la exigencia de fijez y no sensibilidad de `PDA-R-08`, ni convertir un código en mensaje con valores dinámicos.

### 4.4 Superficies prohibidas para el secreto — `PDA-R-09`

El secreto **no** puede aparecer en, ni ser capturado por: `argv`, línea de comandos, historial de shell, página de manual, `ps` de otros procesos (`S-01`, `S-10`); variables de entorno del proceso o de sus hijos; temporales, archivos de trabajo, artefactos intermedios y cachés de serialización; registros de depuración y trazas de aplicación; trazas de SQL y `connection.queries`; telemetría, métricas y reportes que capturen valores de petición o de excepción; salida estándar y de error del proceso y la de los comandos de Django que el auxiliar reutilice (`S-02`); cualquier canal que salga del proceso —mensajes al grupo de la sesión, reportes de agente, transcripciones— (A-3); ni archivos de bitácora o auditoría, en cualquier forma (`PDA-R-10`). Cada prohibition es de diseño: **ninguna** está implementada porque el auxiliar **no existe**.

### 4.5 Auditoría legítima — `PDA-R-10`

- **`PDA-R-10`** — El write set **conserva** la auditoría legítima existente: no se desactiva ningún signal, no se salta ningún `save()` para esquivarla y no se desactiva `django-auditlog`. Lo prohibido es **añadir** el secreto —o un hash ajeno al almacenamiento de autenticación, o un hash de este mismo secreto calculado fuera de él— a cualquier registro. La auditoría describe **qué** cambió y **quién** lo ordenó, nunca **con qué secreto**. 📜 `S-11` muestra que el proyecto registra con `django-auditlog` exactamente `Position`, `Assignment` y `UnitMembership` del write set; esta spec **no afirma** nada sobre la cobertura de auditoría de las demás entidades ni sobre qué campos quedan registrados: no se inspeccionó.

## 5. Preflight de solo lectura

**5.1 Qué inspecciona — `PDA-R-11`.** Ocurre **antes de cualquier escritura** y **sin crear contexto**. Su salida al operador se limita a **banderas booleanas**, **conteos enteros** y los **códigos de receta públicos** (`MASTER`, `super_admin`, y el código de tenant que el propio operador indique); agrupa las diez verificaciones del write set: (1) tenant activo para el código, existencia del rol `super_admin` y unidad raíz activa — `S-03`; (2) posición `MASTER`: existencia, estado y con qué valores coincide o diverge — `S-04`, **nunca** valores de fila; (3) cuenta destino por RUT: existencia, actividad y **«la contraseña sería sobrescrita»**, más existencia y estado de `Person` y `Account` — `S-05`, `S-06`; (4) **cuántos** holders activos de `MASTER` cesarían, y estado del `Assignment` a `MASTER` y del `UnitMembership` a la raíz — `S-07`, `S-08`, con **conteo entero** sin identidades; (5) unicidad declarada en [`AGENTS.md`](../../../AGENTS.md) (un solo `is_primary=True` por cuenta): bandera y conteo de secundarios activos. ⚠️ **El preflight nunca lee el secreto ni lo compara, y nunca imprime columnas de credencial**, ni el valor ni el hash de contraseña de ninguna cuenta, propia o ajena.

**5.2 Bloqueos sin reparación implícita — `PDA-R-12`.** **Bloquear** con el identificador de conflicto de preflight ante: entidades inactivas donde el write set espera activas; inconsistencias temporales (`starts_at` / `ends_at` incoherentes); duplicados activos donde el modelo exige unicidad; más de un primario activo, o primario incompatible con la posición destino. Ante divergencia que el write set resolvería **sobrescribiendo** un valor existente: **no se repara sola** — se reporta como bandera y **exige** la confirmación negativa que corresponda (§6). 🕯️ **Prohibición de reparación implícita:** el auxiliar **no** corrige, **no** normaliza, **no** desactiva y **no** borra para dejar la base en un estado sobrescribible sin fricción; cada divergencia se muestra y se decide, o el auxiliar aborta.

## 6. Confirmaciones negativas por defecto

**6.1 Catálogo — `PDA-R-13`.** Cada confirmación es **separada** y su valor por defecto es **negativo**. No hay confirmación agrupada ni implícita.

- **`PDA-C-01` Creación privilegiada.** Confirmar que se autoriza crear una cuenta de rol raíz con bypass total, destinada al desarrollador y **no** a personal operativo. *Se exige cuando* el destino no existe: se crearía `Person`, `Account` y/o usuario (`S-05`, `S-06`). *Consiente:* crear filas nuevas de identidad y acceso.
- **`PDA-C-02` Actualización o reset.** Confirmar que se autoriza sobrescribir los campos de la cuenta existente —**incluida su contraseña**— y poner `is_staff=True`, `is_superuser=True`, `must_change_password=False`. *Se exige cuando* el RUT ya existe: el write set entra en la rama de actualización (`S-05`). *Consiente:* modificar una cuenta en uso, incluida su credencial vigente.
- **`PDA-C-03` Normalización de la posición.** Confirmar que se autoriza escribir `organization_unit`, `role`, `scope_policy=None`, `is_active=True`, `is_unique_holder=True` sobre la posición `MASTER`. *Se exige cuando* la posición `MASTER` existe y su write set sobrescribe esos campos (`S-04`). *Consiente:* alterar una posición que puede estar asignada.
- **`PDA-C-04` Cese de holders.** Confirmar que se autoriza cesar **exactamente el número** de holders activos mostrado por el preflight, dejándolos inactivos, no primarios y con `ends_at`. *Se exige cuando* el preflight cuenta holders activos a cesar (`S-07`). *Consiente:* revocar acceso activo de otras cuentas. 📜 **El número del cese es parte de la confirmación:** `PDA-C-04` consiente una **cantidad mostrada**, no «los que el auxiliar encuentre»; si el conteo cambia entre preflight y commit, es drift (§7.2), no una versión silenciosa de la misma confirmación.

**6.2 Regla de todo-o-nada — `PDA-R-14`.** **Si falta cualquier confirmación aplicable, no hay efecto alguno.** Cero escrituras: no se crea, no se actualiza, no se cesa, no se normaliza. El fallo es el identificador de consentimiento faltante y termina el proceso. Una confirmación parcial no habilita un subconjunto del write set.

---

## 7. Atomicidad, drift, reversión y elección de receta

**7.1 Hecho anclado — `PDA-R-15`.** `S-09` establece que el comando actual **no contiene** ninguna construcción de transacción en sus 150 líneas: su write set —posición, usuario, persona, cuenta, cese de holders, assignment y membership— **no es atómico**, y un fallo intermedio deja estado parcial. Esta spec **no hereda** ese defecto y **no afirma** que el auxiliar lo corrija: el auxiliar no existe.

**7.2 Atomicidad externa y revalidación — `PDA-R-16..18`.** 🕯️ **Sobre «el algoritmo exacto»:** la elección concreta —mecanismo de serialización, forma de la reversión, y si el auxiliar reutiliza la receta o la adapta (§7.3)— se decide en el plan y la implementación, contra el backend real; esta spec no la fija. Lo que fija es el contrato: **atomicidad externa comprobada**, **snapshot revalidado bajo serialización efectiva**, **reversión sin reintento automático**.

- **`PDA-R-16`** — El auxiliar garantiza atomicidad **por fuera**, con mecanismo propio y explícito de confirmación y reversión. **No** apoya su garantía en el nombre `transaction.atomic` ni presume que envolver las escrituras en un contexto de transacción sobre SQLite baste: la garantía se declara sólo después de comprobar, en runtime, que la serialización efectiva es la que el diseño exige.
- **`PDA-R-17`** — El snapshot del preflight se **revalida** inmediatamente antes del commit, **bajo la serialización efectiva**. Si la revalidación no puede hacerse bajo ella, aborta con el identificador de serialización insuficiente. Si el estado cambió, aborta con el de drift y **no** reconcilia.
- **`PDA-R-18`** — Ante fallo, la reversión se ejecuta **una vez**, explícita y sin reintento automático. Si no puede completarse, el proceso termina reportando estado **indeterminado**; no afirma que revirtió lo que no revirtió.

### 7.3 Reutilizar o adaptar la receta — decisión técnica, no permiso nuevo

**Hecho corregido (`S-17`).** `call_command` **no** pone el secreto en el `argv` del proceso: acumula los `**options` en una **lista local** `parse_args` (`django/core/management/__init__.py:129`), materializa cada valor como `str(value)` o `map(str, value)` (`:169`, `:171`), lo entrega al parser interno (`:172`) y termina en `command.execute(*args, **defaults)` (`:194`). El único `sys.argv` del módulo está en `ManagementUtility.__init__` (`:203`), que es otra ruta.

1. El contrato **permite** que el secreto viva en memoria del proceso, incluido como argumento de palabra clave en una llamada in-process.
2. Esa copia en memoria **no demuestra por sí sola exposición**: no es visible en `ps`, ni en el historial del shell, ni en `/proc/<pid>/cmdline`. La exposición que hoy se corrige (`S-01`) es la **línea de comandos del proceso**, y ésa es la que `PDA-R-01` y `PDA-V-01` prohíben.
3. Lo que sí se exige sin excepción: la invocación del auxiliar no lleva el secreto en su línea de comandos, y el valor **no** se copia a estructuras que se impriman, registren o persistan (`PDA-R-05`, `PDA-R-09`).
4. **Reutilizar o adaptar es una decisión técnica del especialista**, sustentada en evidencia sobre los sumideros (`S-02`, `S-15`, `S-16`) y sobre la atomicidad (`S-09`: la receta actual no aporta atomicidad, hay que añadirla por fuera igual). **No es un permiso nuevo**, no habilita editar el comando público y no exige autorización adicional del operador.
5. El riesgo de la rama «reutilizar» **se conserva**: la supresión de la línea que imprime el secreto (`S-02`) depende de que la inyección de sumideros sea completa (`S-15`, `PDA-R-06`, `PDA-R-07`). Sigue siendo `PDA-K-02`.
6. La elección, su justificación y su plan de pruebas de equivalencia pertenecen al plan y al diseño técnico (§10.1).

**7.4 Resumen posterior a un commit exitoso.** Salida **no sensible**: hechos, conteos, banderas de lo que cambió y los códigos de receta públicos. **No** contiene el secreto, ni su hash, ni el valor de ninguna columna de credencial, ni datos de terceros distintos de los conteos ya consentidos.

## 8. Criterios observables de aceptación

Estos criterios se evalúan sobre la **evidencia de ejecución del operador**; ningún agente puede reunirlos por sí mismo y, por lo tanto, ninguno puede declararlos cumplidos (§13).

**8.1 Privacidad del secreto en una ejecución privada autorizada.** `PDA-V-01` el secreto **no** aparece en los argumentos ni en la línea de comandos de la invocación; el proceso se ve en `argv` sin el secreto · `PDA-V-02` **no** aparece en la salida del proceso, ni en la de error, ni en los flujos del padre, durante ninguna fase · `PDA-V-03` el eco está desactivado durante la captura; si no pudo desactivarse, el proceso **abortó** y no leyó el secreto por una vía con eco · `PDA-V-04` el prompt se emitió por la TTY privada del operador, no por el flujo de salida capturado por el padre · `PDA-V-05` **no** aparece en artefactos: temporales, cachés, registros de depuración, trazas de SQL, telemetría, bitácoras de auditoría · `PDA-V-06` **no** aparece en el chat de ninguna sesión, ni en el resumen del proceso, ni en ninguna afirmación de agente.

**8.2 Cero escrituras ante rechazo, falla o preflight insuficiente.** `PDA-V-07` ante consentimiento faltante, preflight insuficiente, argumentos rechazados, TTY no disponible, eco no controlable, discrepancia de capturas, drift o serialización insuficiente: **cero escrituras** en la base de datos · `PDA-V-08` ante fallo durante el write set, no queda estado parcial: o se revirtió, o el proceso lo declara **indeterminado**; no hay estado intermedio silencioso · `PDA-V-09` ante ausencia de contexto —tenant, rol o unidad raíz— el proceso aborta con el identificador correspondiente y **no** crea contexto para suplirlo.

**8.3 Efectos consentidos y resumen.** `PDA-V-10` con todas las confirmaciones aplicables otorgadas, el write set produce **exactamente** los efectos consentidos y ninguno más: posición, identidad, cuenta, assignment, membership y cese de holders, sin escrituras colaterales fuera del conjunto enumerado · `PDA-V-11` el número de holders cesados **coincide** con el que el preflight mostró y con el que `PDA-C-04` consintió · `PDA-V-12` el resumen final es verificable por el operador y **no** contiene el secreto, ni su hash, ni valores de credencial · `PDA-V-13` la auditoría legítima del write set **sigue produciéndose**: el cambio queda registrado como antes, y sin el secreto en el registro.

---

## 9. Gates aplicables

| Gate | Valor en la spec padre | Lectura para este auxiliar |
|---|---|---|
| `security_review` | `required` (`docs/specs/final-frontend/spec-meta.yaml:21`, por `auth`, `permissions`, `sensitive-data`) | Aplicable; cubierta en diseño por `ses_ef1ad5c5fffeDGSdOTXuYXXo6B`. La revisión del **código** del auxiliar sigue pendiente de existir |
| `tests` · `code_review` · `documentation` | `required` (`docs/specs/final-frontend/spec-meta.yaml:20`, `:22`, `:23`) | Aplicables. Este documento es su parte de diseño; la documentación de uso queda para la implementación |
| `portal_warden` · `kobold_scholar` · `qa_goblin` | `required` (`docs/specs/final-frontend/spec-meta.yaml:26`, `:27`, `:30`) | Exigencia derivada del contrato de preferencias de apariencia, materia ajena a este auxiliar; no se reasignan ni se duplican |
| `haste_halfling` · `arcane_architect` · `hellknight_inspector` | `n/a` (`docs/specs/final-frontend/spec-meta.yaml:28`, `:29`, `:31`) | No aplica |

📖 Los gates **no** los inventamos aquí: se declaran los que la metadata de la spec padre exige, sin añadir ninguno y sin autorizar ningún comando. El estado vigente de los gates de **esta** spec es el de su propio [`spec-meta.yaml`](./spec-meta.yaml); el de la spec padre no se reasigna ni se duplica aquí. 🕯️ Este bloque **no** autoriza instalar dependencias, **no** invoca comandos de proyecto, **no** declara ningún gate como `passed`, **no** mueve el estado de la spec padre y **no** autoriza al writer de código: cuatro intentos de `Code Transmuter` fallaron por cuota, y esta persistencia documental **no** sustituye ese código ni lo reautoriza.

---

## 10. Dependencias, trazabilidad y localizador

### 10.1 Localizador y registro canónico

| Campo | Valor |
|---|---|
| **Artefacto** | `docs/specs/private-master-helper/spec.md` (este documento) |
| **Metadata de esta spec** | [`docs/specs/private-master-helper/spec-meta.yaml`](./spec-meta.yaml) |
| **Índice de esta spec** | [`docs/specs/private-master-helper/index.md`](./index.md) |
| **Identificador** | `spec-private-master-helper-001`, formato canónico `spec-<slug>-<numero>` (`docs/sdd.md` > Numeración de IDs), numeración `max(existentes con ese slug) + 1` |
| **Spec padre** | `spec-final-frontend-001`; su metadata es [`docs/specs/final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) y su índice [`docs/specs/final-frontend/index.md`](../final-frontend/index.md) — documentos **distintos** de los de esta spec |
| **Estado del documento** | `status: approved` (alcance, §1.2), `approved_at: 2026-10-05`, `verified_at: null` |
| **Registro canónico** | **Materializado** en la carpeta propia `docs/specs/private-master-helper/` con `spec-meta.yaml` e `index.md`. No queda ninguna marca `canonical_registration_pending` en este tomo |
| **Ruta histórica** | `docs/specs/final-frontend/private-development-account-spec.md` conserva un **puntero** a este artefacto, sin cuerpo duplicado |
| **Artefacto de implementación esperado** | `tools/private_master_helper.py` (ruta propuesta; `tools/` no existe hoy) |
| **Plan de implementación** | **No existe.** No hay `plan_payload` para este auxiliar; este documento es **prerrequisito** de un plan suplementario y **no** lo sustituye |
| **Handoff de seguridad de origen** | `ses_ef1ad5c5fffeDGSdOTxuYXXo6B` (`Dhampir-Slayer`) |
| **Versión previa corregida** | `ses_ef1a72326ffefY9EYq3WNAMdOI`: este tomo corrige su §7.3 (contrato `call_command`) y compacta el cuerpo |

### 10.2 Dependencias

| # | Dependencia | Estado |
|---|---|---|
| D-1 | Diseño de seguridad del auxiliar | **Recibido** (`ses_ef1ad5c5fffeDGSdOTXuYXXo6B`) y contrastado contra §3 |
| D-2 | Autorización del auxiliar privado | **Recibida y conservada** (§1.2) |
| D-3 | Contexto de datos (tenant activo, rol, unidad raíz) | **Ausente en la introspección histórica** (§2.1) y **preparación autorizada en workstream separado** (§2.4). No es prerrequisito de este documento; sí lo es de una ejecución |
| D-4 | **Registro canónico en `spec-meta.yaml`** | **Resuelto**: `docs/specs/private-master-helper/spec-meta.yaml` existe y es la única fuente de verdad de esta spec |
| D-5 | `docs/specs/final-frontend/implementation-plan-remaining.md` | **Intacto**: `payload_revision: p2`, `review_gate: VALIDATED`, `review_gate_revision: r2`, `updated_at: "2026-10-04"` (`:1-12`). No modificado por este encargo |
| D-6 | Plan base y plan de acceso | **Intactos.** No modificados por este encargo |
| D-7 | Escritura de código del auxiliar | **No realizada.** Cuatro writers `Code Transmuter` fallaron por cuota |

**10.3 Trazabilidad.** Captura `PDA-R-01..05` ← A-2/A-3 + diseño consultivo (`S-01`, `S-02`, `S-13`, `S-14`) · sumideros `PDA-R-06..07` ← diseño consultivo (`S-02`, `S-15`, `S-16`) · errores `PDA-R-08` + §4.3.1 ← diseño consultivo · superficies `PDA-R-09` ← A-3 + diseño consultivo · auditoría `PDA-R-10` ← diseño consultivo (`S-11`) · preflight `PDA-R-11..12` ← diseño consultivo (`S-03..S-08`) · consentimientos `PDA-C-01..04` y `PDA-R-13..14` ← A-4 (`S-04`, `S-05`, `S-07`) · atomicidad y reversión `PDA-R-15..18` ← diseño consultivo (`S-09`, `S-17` vía §7.3).

## 11. Riesgos

- **`PDA-K-01`** Fuga por argumentos, historial o tabla de procesos → `PDA-R-01`; `PDA-V-01`.
- **`PDA-K-02`** Fuga por la salida final de la receta (`S-02`), si se reutiliza → `PDA-R-06`, `PDA-R-07`; decisión explícita de §7.3; `PDA-V-02`.
- **`PDA-K-03`** Lectura con eco por el fallback de `getpass` (`S-14`) → `PDA-R-03`; `PDA-V-03`.
- **`PDA-K-04`** Captura por un flujo redirigido por el padre en vez de la TTY privada → `PDA-R-02`, `PDA-R-06`; `PDA-V-04`.
- **`PDA-K-05`** Residuo del secreto en temporales, logs, trazas SQL o telemetría → `PDA-R-05`, `PDA-R-09`; `PDA-V-05`.
- **`PDA-K-06`** Copias del secreto en memoria conservadas más de lo necesario → `PDA-R-05`: mínimo de referencias vivas y descarte explícito, **sin** prometer borrado físico.
- **`PDA-K-07`** Desactivación o elusión de la auditoría → `PDA-R-10`; `PDA-V-13`.
- **`PDA-K-08`** Sobrescritura silenciosa de credenciales, de una posición asignada o de acceso de terceros → `PDA-C-01..04`, `PDA-R-13`, `PDA-R-14`; `PDA-V-07`, `PDA-V-10`, `PDA-V-11`.
- **`PDA-K-09`** Confianza indebida en una atomicidad no comprobada → `PDA-R-16..18`; `PDA-V-08`.
- **`PDA-K-10`** Normalización o reparación implícita de datos que el write set sobrescribiría → `PDA-R-12`; §5.2.
- **`PDA-K-11`** Rerun de `init_access_model` para desbloquear contexto, con efectos globales o destructivos → prohibición explícita de §2.3, extendida a la autorización de §2.4.
- **`PDA-K-12`** Confundir la aprobación de alcance con autorización de ejecución → §1.2, §12: sólo **preparar y revisar**; el registro canónico no autoriza implementación, instalación ni ejecución.
- **`PDA-K-13`** Expectativa de irrefutabilidad, de detección de grabaciones o de borrado físico del secreto → §4.1 (`PDA-R-05`) y §13: verdad de diseño declarada, sin promesas.

## 12. Exclusiones

- **`PDA-X-01`** **Ejecutar el auxiliar desde agentes** — A-1 autoriza «preparar y revisar»; la ejecución es del operador, en su terminal privada.
- **`PDA-X-02`** Acceso al navegador autenticado, o simular sesiones — fuera de A-1..A-5.
- **`PDA-X-03`** Que el auxiliar cree tenant, rol, unidad raíz o catálogos — el comando no crea contexto (§2.2) y el auxiliar no amplía esa limitación.
- **`PDA-X-04`** Rerun de `init_access_model`, con o sin `--reset` — §2.3.
- **`PDA-X-05`** Cambios en autenticación, sesiones, RBAC, permisos o modelo de datos — autorización de alcance acotado.
- **`PDA-X-06`** **Incorporar al auxiliar** la creación del contexto autorizado — §2.4: la creación vive en un workstream separado; también quedan fuera el `reset`, el RBAC y tocar usuarios o holders existentes.
- **`PDA-X-07`** Cualquier otro archivo del repositorio: planes, gates, front, backend, scripts, config, DB, y la metadata y el índice de la spec padre (`../final-frontend/`) — fuera del conjunto documental de esta spec, que se limita a su propia carpeta (`spec.md`, `spec-meta.yaml`, `index.md`) y al puntero de la ruta histórica (§10.1).
- **`PDA-X-08`** Shell, git, comandos de proyecto, seeds, migraciones, tests, build, typecheck — no autorizados; y ningún resultado de ellos prueba `PDA-V-*` (§13).
- **`PDA-X-09`** Navegador, MCP, servidores, dependencias, modelos y permisos de agentes o subagentes — fuera de alcance.
- **`PDA-X-10`** `README`, documentación global y documentos de gobernanza — fuera de alcance.
- **`PDA-X-11`** Prueba de cualquier credencial o cuenta utilizable — no se observó ninguna; nada aquí la afirma ni la da por existente.
- **`PDA-X-12`** Emisión de `VERIFIED` o de cualquier veredicto de cierre — el veredicto lo emite el orquestador (§13).

---

## 13. Límites de lo afirmado

- **Nada de este documento afirma runtime observado.** No se ejecutó el comando, el auxiliar, el servidor, el navegador, los tests ni el build, y no se escribió en base de datos. Las anclas de §3 son **lecturas de fuente** contrastadas el 2026-10-05.
- **Nada afirma el estado vigente de la base de datos.** §2.1 registra una introspección previa **no reconsultada**; sus cifras describen ese momento, no el actual.
- **Entrega, código, revisión y tests no son `VERIFIED`.** Los criterios `PDA-V-01..13` sólo puede observarlos el operador, en una ejecución privada autorizada (§8). Ningún agente convierte evidencia de proceso en veredicto.
- **Verdades de diseño, no garantías absolutas.** El auxiliar **no** puede detectar que su terminal está siendo grabada, capturada por pantalla o redirigida por un multiplexor externo: la TTY privada es el máximo control disponible. **No** se promete irrefutabilidad del secreto frente a observación física, ni borrado físico de su valor en memoria (`PDA-R-05`). La privacidad de la sesión del operador —pantalla, teclado, historial de su shell, clipboard— es responsabilidad suya y **no** es verificable por el auxiliar.
- **La lista de entidades auditadas no se extrapola** más allá de `S-11`.
- **La aprobación de §1.2 no autoriza implementación**, instalación de dependencias ni ejecución; la misma distinción que establece `docs/specs/final-frontend/spec-meta.yaml:66-71` para la spec padre se aplica aquí igual.
- **Registro canónico ≠ integración en la spec padre.** Este tomo está registrado en su **propia** metadata ([`./spec-meta.yaml`](./spec-meta.yaml)) y **no** figura en la metadata de `spec-final-frontend-001`, que no fue modificada. Se deja constancia de una discrepancia preexistente ajina a este encargo y que **no** se resuelve aquí: `docs/specs/final-frontend/index.md:7-8` describe el estado de la spec padre como `draft`, mientras `docs/specs/final-frontend/spec-meta.yaml:7` lo declara `approved` con nota de aprobación en `docs/specs/final-frontend/spec-meta.yaml:63-64`.
