---
status: done
risk: [auth, permissions]
updated: 2026-10-11
---

# Cuentas ficticias de desarrollo por rol

## 1. Problema y por qué

Quiero que el operador y el asistente puedan iniciar sesión normalmente y de forma autónoma con cuentas ficticias reales del backend local, sin solicitar sesiones o tokens manuales.

Hoy no existe un comando que provisione el conjunto completo de roles. Los comandos existentes no sirven como sustituto: `init_access_model` procesa usuarios existentes y `crear_master` actualiza contraseñas, puede cesar holders e imprime el secreto.

Tipo de trabajo: feature operativa backend PROTECTED, sin migración ni cambio de schema.

Riesgo técnico: hard triggers #2 (autenticación/sesiones) y #3 (roles/permisos). La provisión puede conceder acceso excesivo, ocupar puestos ajenos, apuntar a otro destino o exponer credenciales.

Revisor, distinto del ejecutor: `Dhampir Slayer` por `auth`/`permissions`; `Hellknight Inspector` para la revisión focalizada de implementación. `Code Transmuter` implementa; `Lore Master` escribe documentación.

---

## 2. Fuera de alcance

Producción, otros tenants/destinos, frontend, datos de tiro, instalaciones, dependencias, migraciones, schema, settings y modificaciones de auth/RBAC o catálogos.

No adoptar cuentas existentes, sustituir holders, reparar datos ajenos, rotar contraseñas, borrar/resetear registros ni ejecutar seeds indiscriminadamente.

No incluye auditoría general, correcciones de bugs preexistentes, red, navegador, servidores o cambios de infraestructura.

---

## 3. Criterios de aceptación (EARS)

- **AC-1**: Cuando se ejecuta `--check`, el comando valida destino, contexto, catálogo y colisiones, informa sólo metadatos seguros y no ejecuta DML ni crea o modifica archivos.
- **AC-2**: Cuando la provisión inicial termina en el destino autorizado, existen ocho `Usuario`, ocho `Person` y ocho `Account` ficticios distintos, activos, no temporales, con password utilizable y `must_change_password=False`.
- **AC-3**: Cuando se inspecciona cada cuenta provisionada, tiene exactamente un `Assignment` primario activo y una `UnitMembership` primaria activa, coherentes con tenant/unidad; sus únicos roles activos son el rol elegido y el tirador implícito, sin duplicarlo para la cuenta tirador.
- **AC-4**: Cuando se generan credenciales, cada contraseña se produce con aleatoriedad criptográfica, se valida y queda únicamente en memoria transitoria y en el archivo local protegido; la DB almacena su hash y ningún secreto aparece en código, chat, stdout, logs o documentación.
- **AC-5**: Cuando dos clientes independientes leen las credenciales locales e inician sesión por `/api/auth/login/`, ambos reciben sesión válida sin cambio obligatorio de contraseña y obtienen el contexto esperado; cerrar uno con CSRF vigente no invalida al otro.
- **AC-6**: Cuando se repite una provisión completada sin cambios externos, se reutilizan registros y contraseñas, se conservan hashes, PK, timestamps y bytes del archivo, y no se añaden filas ni auditlog.
- **AC-7**: Cuando existe una colisión ajena, un holder incompatible, un registro reservado divergente o credenciales ausentes/inconsistentes para cuentas existentes, el comando aborta sin sobrescribir passwords, holders o filas existentes y sin revelar datos ajenos.
- **AC-8**: Cuando el destino no es el SQLite local autorizado en desarrollo, falta el contexto aprobado o el catálogo activo relevante difiere de los ocho roles soportados, el comando rechaza la operación antes de escrituras.
- **AC-9**: Cuando falla la persistencia privada, no se crean cuentas; cuando falla la transacción DB/auditlog, todas sus filas nuevas revierten, el comando retorna error y conserva cualquier archivo completo previamente persistido para reintentar con los mismos secretos.
- **AC-10**: Cuando termina la provisión real, la comprobación del login y `/api/auth/context/` confirma las ocho identidades, tenant, roles, scopes, membresía y permisos efectivos; un resumen de creación por sí solo no satisface este criterio.

---

## 4. Diseño

Un único comando: `provision_development_accounts`.

Destino propuesto: alias `default`; archivo regular existente `db.sqlite3` de la raíz del proyecto; tenant `desarrollo-poligono-local`, `military` y activo; unidad `CIA-A` activa; armería `ALM-CIA-A-DEV` activa y perteneciente a esa unidad/tenant.

CLI mínima: `--database default --tenant-code desarrollo-poligono-local`; `--check` añade preflight sin escrituras. Unidad, armería y archivo privado son constantes del contexto aprobado, no fallbacks seleccionados con `first()`.

Exigir `settings.DEBUG=True`, validación del destino antes de abrir conexión y rechazo de memoria, URI, motores alternativos, rutas distintas y enlaces inseguros. No hay opción `force` ni bypass de desarrollo.

Namespace interno: `development-role-accounts`. Usernames y códigos `Position` con prefijo exclusivo; nombres explícitamente ficticios y emails vacíos.

Ocho bases numéricas de prueba `99001001`–`99001008`, en el orden de la matriz, con dígito verificador calculado y RUT canónico sin puntos. Reserva interna de la feature, no reserva oficial ni prueba de inexistencia; cualquier colisión aborta.

| Rol principal | Scope principal | Armería |
|---|---|---|
| `super_admin` | null | ninguna |
| `tenant_admin` | null | ninguna |
| `admin_unidad` | `unidad_y_descendientes` | ninguna |
| `comandante_unidad` | `unidad_y_descendientes` | ninguna |
| `oficial_tiro` | `unidad_y_descendientes` | ninguna |
| `oficial_observador` | `unidad_y_descendientes` | ninguna |
| `encargado_almacen` | `unidad_propia` | `ALM-CIA-A-DEV` |
| `tirador` | `solo_propio` | ninguna |

Todas las `Position` y `UnitMembership` apuntan a `CIA-A`. Roles globales conservan su semántica existente, sin flags Django `staff`/`superuser` nuevos.

Ocho `Position` reservadas. `Position` tirador permite múltiples holders: primaria para su cuenta y secundaria para las otras siete. Las demás `Position` tienen holder propio. Total: quince `Assignment` y ocho `UnitMembership`.

No crear `PositionPermission`, `UserPermissionOverride`, `Role`, `ScopePolicy`, `Permission` ni `RolePermission`. Permisos exclusivamente del catálogo existente.

Catálogo relevante: unión de roles globales activos y roles activos del tenant seleccionado. Coincidencia exacta con ocho filas globales soportadas, sin custom, ambigüedades o sustituciones por código.

Archivo privado: `.cache/development-role-accounts/credentials.json`. Contiene versión, namespace, identificador de bundle, contexto y ocho entradas role/RUT/password. No contiene sesiones ni tokens.

Directorio `0700` y archivo `0600`, propietario local, archivo regular sin enlaces/permisos inseguros y exclusión comprobable de Git. Rechazar si no se acredita protección equivalente.

Aplicación serializada mediante exclusión local no bloqueante en el directorio privado. `--check` no crea directorios ni mecanismos persistentes de bloqueo.

Primera aplicación: validar colisiones, generar ocho contraseñas con `secrets` y validación Django, persistir archivo completo de forma exclusiva y durable antes del primer `INSERT`. Archivo existente válido nunca se reescribe.

Revalidar dentro de `transaction.atomic(durable=True)`, crear sólo filas faltantes y comprobar primarios, enlaces, roles, credenciales y contexto antes del commit.

Archivo previo evita cuentas confirmadas con passwords irrecuperables. DB y filesystem no son atómicos conjuntamente: fallo DB conserva archivo completo y reintento usa sus mismos secretos.

Reutilización exige coincidencia de namespace/bundle, identidades, enlaces, puestos, assignments y password con `check_password`. No adoptar por prefijo ni reajustar divergencias.

Auditlog normal, sin desactivar señales; comprobar ausencia de contraseñas, cookies y tokens en eventos.

Login RUT/password y cookies ordinarias; `X-Tenant-Code` en contexto/operaciones. Cookie jars independientes y `csrftoken` vigente después de login. No inventar endpoint CSRF ni pedir tokens manuales.

---

## 5. Tareas

Secuenciales; aprobar esta spec no es ordenar implementarla.

| Tarea | Ejecutor | Dependencia | AC | Acción |
|---|---|---|---|---|
| T1 | Code Transmuter | Aprobación y orden explícita | AC-1, 7, 8 | Crear CLI/`--check`; validar DEBUG, archivo exacto, tenant, unidad, armería, roles y namespace; rechazar colisiones sin DML ni cambios filesystem. |
| T2 | Code Transmuter | T1 | AC-4, 7, 9 | Crear protección y exclusión local; generar/validar passwords; persistir archivo completo antes de INSERT; reutilizar sin modificación. |
| T3 | Code Transmuter | T2 | AC-2, 3, 6, 7, 9, 10 | Revalidar preflight en transacción durable; crear sólo filas faltantes; comprobar primarios, tirador implícito, enlaces, hashes y contexto; conservar auditlog normal. |
| T4 | Code Transmuter | T3 | AC-1–10 | Implementar tests dirigidos y ejecutar sólo ese módulo y Ruff sobre archivos Python nuevos. |
| T5 | Code Transmuter | T4 | AC-1–10 | Preflight real, provisión autorizada, repetición y comprobación de ocho cuentas con login/contexto en proceso, sin servidor ni navegador. |
| T6 | Hellknight Inspector y Dhampir Slayer | T5 | AC-1–10 | Revisar postimplementación sin ampliar scope; el orquestador conserva aceptación y comprobación. |
| T7 | Lore Master | T6 y resultado observado | AC-4, 5, 6, 8, 9 | Documentar uso y evidencia redactada; no publicar credenciales ni duplicar plan en otro archivo. |

Código nuevo: `apps/identity/management/commands/provision_development_accounts.py` y `apipoligono/tests/test_provision_development_accounts.py`.

Documento de uso: `docs/07_MANAGEMENT_COMMANDS.md`, exclusivamente por `Lore Master` tras implementación.

No modificar factories, modelos, settings, comandos existentes ni auth. Reusar factories para fixtures y guardas SQLite compatibles, sin ejecutar `prepare_development_context` ni seeds. Resolver sólo códigos de puestos reservados, no helpers de vistas que eligen puestos preexistentes.

---

## 6. Verificación

Inspección/comprobación directa, tests dirigidos y lint focalizado. Sin build, suite global, navegador o servidor.

- `TransactionTestCase`, SQLite de test y directorios temporales; reusar `_factories.py`. No usar SQLite operativa como fixture ni introducir bypass público para tests.
- Destino: rechazar `DEBUG=False`, alias/motor/ruta incorrectos, DB inexistente, URI/memoria, contexto inválido y catálogo custom/ampliado; ausencia de efectos.
- Preflight: capturar SQL y filesystem; `--check` sin DML ni creación/modificación de archivos.
- Cobertura: ocho identidades/puestos, quince assignments, ocho membresías; matriz/primarios exactos, sin privilegios extra.
- Colisiones: identidad ajena, `Person` incompatible, puesto divergente, holder ajeno; preservar filas y hashes.
- Idempotencia: segunda ejecución sin DML, auditlog nuevo ni cambios en bytes, PK, timestamps o passwords.
- Credenciales: permisos/propietario/enlaces, archivo corrupto/incompleto, password divergente, archivo ausente con cuentas; rechazo seguro sin rotación.
- Fallos: persistencia privada, DB/auditlog y concurrencia; rollback DB y reintento con archivo completo igual.
- Login: `APIClient(enforce_csrf_checks=True)`, credenciales del archivo y endpoints reales; sin `force_login`/`force_authenticate`.
- Contexto: tenant, assignments, scopes, membresía y permisos contrastados con concesiones de fixture, no sólo otra llamada al mismo helper.
- Sesiones: dos clientes por cuenta, cookie jars independientes, CSRF vigente, logout independiente y rechazo de operación protegida sin CSRF/tenant correcto.
- Scope: ambos modos existentes con overrides sólo de tests; no cambiar settings del proyecto.
- Filtración: passwords ausentes en stdout/stderr, errores, logs y auditlog.
- Resultado real: ocho cuentas con clientes Django en proceso, sólo sus credenciales/registros ficticios; sin imprimir passwords/cookies/tokens/respuestas sensibles.

Comandos:

```bash
python manage.py test apipoligono.tests.test_provision_development_accounts
ruff check apps/identity/management/commands/provision_development_accounts.py apipoligono/tests/test_provision_development_accounts.py
python manage.py provision_development_accounts --database default --tenant-code desarrollo-poligono-local --check
```

Provisión autorizada posterior: aplicar sin `--check`, repetir y comprobar contexto.

Gates ejecutados: `tests` **PASS** — `apipoligono.tests.test_provision_development_accounts` 13 tests exit0 y `ruff check` sobre los dos archivos nuevos exit0 (primera corrida: 12 tests); `security_review` **PASS focalizado** por `Dhampir-Slayer` (inspección estática, 0 hallazgos materiales introducidos, sin auditoría global del repo); `code_review` **aceptado por el orquestador** — dictamen corregido de `Hellknight-Inspector`: 0 BLOCKER y 0 MAYOR, con reserva de portabilidad (protección y bloqueo POSIX, no comprobados en Windows) y un gap menor de test de contención; el orquestador aceptó el gate tras leer el test de contención añadido y sus resultados, sin segundo dictamen por no haber cambio material de implementación; `documentation` cerrado con esta entrega (T7).

Resultado ejecutado y comprobado: preflight real exit0 sin crear directorio; provisión exit0 con ocho cuentas y puestos nuevos; repetición exit0 con 0 nuevas y sin DML, cambios de PK/hashes/timestamps/relaciones/auditlog ni cambios de bytes del archivo de credenciales. Objetivo local **VERIFIED** por comprobación directa del orquestador con `APIClient(enforce_csrf_checks=True)` en proceso (host local, sin browser ni servidor): 8/8 roles con dos logins HTTP200 y sesiones distintas, contexto HTTP200 con tenant/unidad/membresía/primario/scope/roles/permisos correctos, logout de un cliente HTTP200 y el segundo conserva contexto y cierra con logout HTTP200. Sin `force_login`/`force_authenticate`, sin sesiones manuales, sin red.

Defecto ajeno: reportar sin corregir ni debilitar test. El orquestador emite el veredicto.

---

## 7. Notas/decisiones

Inspección inicial read-only con stdlib Python y SQLite `mode=ro`, sólo `SELECT` de metadatos; sin cargar Django ni leer `.env`.

Observado por `Cunning Bard`: tenant único `desarrollo-poligono-local`, `military` activo; doce unidades, cuatro armerías y treinta y cuatro puestos. `CIA-A` y `ALM-CIA-A-DEV` activas/coherentes. Ocho roles globales activos, ninguno custom. No se afirma para futuros catálogos.

`DEBUG` y la configuración Django efectiva no se verificaron durante la planificación. Esa coincidencia de destino y `DEBUG` quedó comprobada después: por las guardas en la provisión y por el `--check` del orquestador (exit0). Guardas runtime confirman destino antes de escribir.

Ruta privada ignorada por `.gitignore:45`; directorio reservado no existía. Perder archivo no autoriza rotación/adopción.

Evidencias relativas al repositorio:

- `apps/identity/management/commands/init_access_model.py:15-64` — roles canónicos.
- `apps/authorization/models.py:81-120` — roles globales/custom.
- `apps/identity/models.py:9-39, 63-116, 128-162, 168-213` — identidades/puestos/assignments/membresía.
- `apps/identity/management/commands/seed_positions.py:23-28, 80-93` — scopes/armería.
- `apps/organizations/management/commands/prepare_development_context.py:614-673, 676-786` — guardas/preflight/transacción.
- `apipoligono/views.py:103-178, 1382-1476` — tirador/membresía/login/contexto.
- `apps/authorization/permissions.py:207-258` y `scope.py:124-181` — acceso/alcance.
- `apps/identity/apps.py:9-20` — auditlog normal.
- `apipoligono/tests/_factories.py:79-134` y `test_design_system_preferences.py:76-101` — fixtures/login CSRF.
- `init_access_model.py:316-352` y `crear_master.py:84-145` — no usar como provisión.
- `db.sqlite3`: `SELECT` sobre `tenants_tenant`, `authorization_role`, `organizations_organizationunit`, `armory_armory` e `identity_position` — metadatos/contexto; sin usuarios/personas/credenciales.
- `.gitignore:45` y `git check-ignore` — exclusión del archivo privado.

Antes de implementar: aprobar SQLite/tenant, unidad/armería, cuentas/puestos reservados y archivo privado; después dar orden explícita de implementación/provisión.

Aprobación y orden explícita del operador (2026-10-11): la spec quedó aprobada y se ordenó implementar y crear las cuentas mediante la opción **Implementar y crear**. Alcance autorizado: destino SQLite/tenant aprobados, las ocho cuentas ficticias, el archivo local de credenciales y las pruebas focalizadas. La transición a `in-progress` deja constancia de esa autorización; no altera AC, Diseño ni Tareas, y no anticipa el resultado de los gates, que se registra en las secciones 6 y 7.

Sin decisión arquitectónica pendiente. Si cambia contexto o falla guarda, detenerse sin inventar destino alternativo.

---

**Cierre (2026-10-11).** Participaron `Cunning-Bard` (plan), `Lore-Master` (spec, registro y cierre), `Code-Transmuter` (comando, provisión y tests, más una corrección), `Hellknight-Inspector` (revisión de código y corrección de una evidencia) y `Dhampir-Slayer` (mapeo focalizado y revisión postimplementación). Artefactos: dos archivos de código, el documento de uso en `docs/07_MANAGEMENT_COMMANDS.md`, esta spec archivada y el archivo privado de credenciales. La base de datos se modificó sólo con las cuentas y datos autorizados y sus efectos normales de sesión y auditoría. Sin navegador, MCP, red, servidor, instalaciones, escrituras de índice ni comandos destructivos. Uso durable consolidado en `docs/07_MANAGEMENT_COMMANDS.md` § «Cuentas ficticias de desarrollo local»; esta spec pasa a `done` y se archiva.

**Fuera de scope, no tocado.** Hallazgos preexistentes de auth/login-CSRF y de salida de credenciales del comando `crear_master`: reportados, sin autocorrección y sin autorización para salir de scope; quedan como deuda para otra tarea.

**No verificado.** Windows y otras plataformas (protección y bloqueo son POSIX, comprobados sólo en Linux), otros destinos, producción e interfaz en navegador — los cuatro fuera del alcance autorizado. Ninguna dependencia bloqueante pendiente para el objetivo local.

**Artefacto privado.** `.cache/development-role-accounts/credentials.json` conserva las credenciales en claro; su contenido no se leyó con herramientas de texto ni se expone en chat. Perderlo no habilita rotación automática ni adopción de cuentas existentes: exigiría una decisión nueva.