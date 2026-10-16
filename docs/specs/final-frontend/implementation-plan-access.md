---
plan_id: frontend-access-session-f2
spec_id: spec-final-frontend-001
created_by: Cunning-Bard
persisted_by: Lore-Master
created_at: "2026-10-04"
updated_at: "2026-10-04"
payload_revision: p2
review_gate: VALIDATED
review_gate_revision: r2
spec_meta: ./spec-meta.yaml
---

# Plan — frontend-access-session-f2: acceso, sesión y contexto (F2)

> **Nota de persistencia (`Lore Master`, cuerpo vigente `p2`, 2026-10-04).** Este archivo acumula dos capas y se lee como cronología. **Cuerpo del plan:** las 8 secciones canónicas (§1–§8) son la transcripción **literal** del `plan_payload_revised` que `Cunning-Bard` entregó en `BARD_CORRECTION_1` (sesión `ses_efad814c7ffezkFkhqqELKPbC7`) y que el orquestador arbitró sobre contratos, scope, evidencia y coherencia (`payload_revision: p2`), incluidos los bloques `### Cambios r1` de cada sección. La procedencia del cuerpo `p1` y el anclaje de cada delta ejecutado están en `## Historial de revisiones`. **Ledger del gate:** la sección `## Plan Review Gate` registra los eventos del `gate_id: prg-frontend-access-session-f2` —checkpoint prelaunch, feedback `r1` y cierre `r2` con disposiciones, arbitraje y veredicto `VALIDATED` (`implementation_authorized: no`)— y es **append-only**: no forma parte del cuerpo del plan, no incrementa `payload_revision` por sí misma y sus bloques previos no se reescriben. `§9 Dependencias` y `§10 Referencia a spec` son las únicas derivaciones, exigidas por `docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`; en `p2` se actualizan para reflejar el estado real del gate. El texto de la nota de `p1` que declaraba el gate «no se ha despachado» y la ausencia de `review_gate` en el frontmatter quedan **superados** por esta materialización y se conservan solo como antecedente literal en `## Plan Review Gate > Nota de consistencia documental` y en la entrada `p1` del historial. El estado de la spec **no** se duplica aquí: vive en `./spec-meta.yaml`, referenciado por `spec_meta`. Ruta declarada por el preflight: `implementation-plan-access.md` en lugar del nombre por defecto `implementation-plan.md` de la SSOT, porque ese nombre ya está ocupado por el plan base `frontend-build-base` (`payload_revision: p3`, `review_gate: VALIDATED`) y no puede sobrescribirse. Son dos planes de dos workstreams distintos, no dos revisiones del mismo plan; este archivo no modifica ni referencia como revisión a `implementation-plan.md`. **Ningún veredicto de este gate autoriza implementación**: `PLAN_PATH` es el único puntero que debe circular hacia `Code Transmuter`, y la orden explícita del operador sigue siendo necesaria. Las fuentes citadas en el cuerpo (contratos, requirements, TD, código del cliente, backend) **no** fueron releídas ni validadas en esta persistencia.

---

## 1. 🎭 Objetivo

Ordeno F2 para ofrecer acceso, recuperación, contraseña forzada y contexto contra la API real, conservando dashboard, 404 y captura manual.
Mantengo intacto el destino integral de 36 pantallas/99 flujos: esta fase no redefine ni reduce ese alcance.
Referencias: S = docs/specs/final-frontend/; DS = ../../Inume Design System/; archivos de cliente relativos a la raíz del proyecto.
Parto de spec aprobada, no verificada (S/spec-meta.yaml:7,13-14), y de base TS existente (front/src/main.ts:1-12; front/package.json:7-21). El plan base excluye F2 (S/implementation-plan.md:35-41).
Sin cambios en r1.

## 2. Scope

Acoto la implementación a front/, sin cambiar manifiesto, lockfile ni toolchain: TS 5.9.3, Vue, Router, Pinia y CSS vanilla existentes.
Incluyo SCREEN-LOGIN /login, SCREEN-RECOVERY /recuperar, SCREEN-PASSWORD-FORCED /password-required, SCREEN-CONTEXT /contexto, SCREEN-DASHBOARD /, SCREEN-CONTEXT-LOST /contexto-perdido y SCREEN-NOT-FOUND catch-all.
`/contexto-perdido` es la propuesta ya documentada, no una pantalla imaginada (S/experience/screens/access-context.md:144-161; S/experience/navigation.md:37-43).
Implemento FL-SES-001…006, FL-RCV-001 y FL-PWD-001; delimito FL-PWD-002…005 en §3, sin declararlos completados.
Fijo el transporte común: origen /api, `credentials:'include'` en cada llamada; `sessionid` HttpOnly no se lee; `X-CSRFToken` desde `csrftoken` al emitir métodos no seguros (S/requirements/shared-session-data.md:38-65; apps/identity/authentication.py:4-17).
T significa X-Tenant-Code capturado manualmente; C significa CSRF desde la cookie actual. Los endpoints públicos/login/logout no reciben T. Ningún valor sensible entra en logs, URL, storage o handoffs.

| Operación | Método y ruta real bajo /api | Body → respuesta/status contratados | Tenant/CSRF y evidencia |
|---|---|---|---|
| OP-AUT-001 | POST /auth/login/ | {rut,password} → 200 {id_usuario,must_change_password}; 400 validación con payload conservado como unknown; 429 | Sin T; enviar C si existe. Login público no exige autenticación previa y emite csrftoken con ensure_csrf_cookie; no inventar bootstrap (apipoligono/views.py:1380-1401; S/contracts/auth-context.md:11). |
| OP-AUT-002 | GET /auth/context/ | Sin body → 200 AuthContext; 403 sesión/tenant | T; sin C. Shape validado existente, clave permissions (apipoligono/views.py:1412-1474; front/src/api/dashboard.ts:128-205,317-319). |
| OP-AUT-003 | POST /auth/select-unit/ | {organization_unit_code} → 200 {detail,organization_unit_code,tenant_code}; 400/403/429 | T+C; IA+TA. No cambio local anticipado (apipoligono/views.py:1477-1539; S/contracts/auth-context.md:27). |
| OP-AUT-005 | POST /logout/ | Sin body → 200 {detail}; 403 si sesión inválida | Sin T; C para sesión autenticada (apipoligono/views.py:1404-1409; S/tasks/session-context.md:138-142). |
| OP-AUT-006 | GET /protected/ | Sin body; salida citada en S/contracts/auth-context.md:28, no validada en runtime | Sin consumo F2. Código exige IA+TA, mientras TD§2 lo excluye de T; además existe conflicto sobre la sonda (§6). No crear DTO ni llamada automática. |
| OP-RCV-001 | POST /recuperar/ | {rut} → 200 {detail,correo_censurado?}; 429 | Sin T; transporte adjunta C si existe. Público AllowAny; no cambiar credentials (apipoligono/utils/recuperacion_utilidades.py:45-57). |
| OP-RCV-002 | POST /recuperar/crear/ | {rut,correo} → 200 {detail}; 429; mutación no idempotente | Igual; puede reemplazar códigos y enviar correo (apipoligono/utils/recuperacion_utilidades.py:62-77). |
| OP-RCV-003 | POST /recuperar/comprobar/ | {rut,codigo} → 200/400 {mensaje}; 429 | Igual; código vigente según servidor (apipoligono/utils/recuperacion_utilidades.py:81-100). |
| OP-RCV-004 | POST /recuperar/cambiar/ | {rut,codigo,nueva_contrasena} → 200 {mensaje}; 400 {mensaje,errores[]}; 429; mutación no idempotente | Igual; contraseña real y código de un uso (apipoligono/utils/recuperacion_utilidades.py:103-138). |
| OP-USR-013 propio forzado | POST /usuarios/{id_usuario}/cambiar-contrasena/ | {new_password} → 200 {detail}; 400 {error:string|string[]}; 403 denegación sesión/tenant, conservando error wire | T+C; IA+TA; id propio del login/contexto, sin old_password ni confirmación local en body (apipoligono/views.py:606-651; S/technical-design.md:169-173). |

Exijo C antes de las mutaciones autenticadas; si falta, detener esa acción y reportar. No fabricar cookies/tokens ni añadir un endpoint CSRF. La entrada pública inicial conserva las excepciones reales del handler, no un requisito imposible de token previo.
U = X-Org-Unit-Code explícitamente disponible en memoria: conservo el mecanismo existente; lo actualizo desde contexto/select-unit y no invento qué otras OP lo requieren. G-SES-2 sigue abierto.
G-SES-3 no incorpora paginación/filtros remotos en F2: opciones del contexto y arrays del dashboard conservan sus contratos existentes (S/requirements/shared-session-data.md:188-190).
### Cambios r1
- D-api-1: preciso 403 y conservación del error de OP-USR-013.
- D-api-2: no fijo un envelope de login no acreditado; conservo payload unknown.
- D-api-3: identifico RCV-002/004 como no idempotentes; la incertidumbre no autoriza replay.

## 3. Out of scope

Dejo fuera F3–F10, nuevas rutas operativas, CRUD, auditoría AUT-004, catálogos generales de unidades y cualquier capacidad no expuesta.
FL-PWD-002 queda referenciado como modo voluntario de USR-013 con old_password, pero su superficie no entra en las siete pantallas; FL-PWD-003…005 dependen de ficha de usuario y OP-USR-014…016, posteriores (S/coverage/flows.md:21-24).
No implemento personalizador/persistencia de ocho ejes, backend de apariencia, cola futura ni doy esas ramas por verificadas. Sólo preservo/resetéo el estado de apariencia ya existente.
No modifico backend, DB, autenticación servidor, RBAC, modelos, migraciones, configuración ni procesos. No reinicio ni levanto servidores.
No añado dependencias, JWT, storage, fixtures, datos sintéticos, scripts de tests/lint, arquitectura transversal ni importación del kit DS.
En esta entrega no ejecuto implementación, comandos de comprobación, herramientas de autenticación, git, navegador/MCP ni delegaciones; tampoco escribo documentación o plan en disco.
Sin cambios en r1.

## 4. 📜 Archivos probables

Dispongo tres write sets exclusivos; las rutas nuevas son propuestas, no archivos existentes afirmados.
| Writer | Rutas | Responsabilidad |
|---|---|---|
| CT-A | front/src/types/{auth,session,access-ui}.ts nuevos; types/{index,shell}.ts | Publicar wire types, API de sesión y props/emits mínimos; reutilizar contexto.ts, sin models inventados. |
| CT-A | front/src/api/{http,auth}.ts; stores/{session,dashboard}.ts; router/{routes,guards,index}.ts | Transporte, sesión fuente única, adaptador dashboard y guards. Reusar getAuthContext/validateAuthContext existentes; no duplicarlos. |
| CT-B | front/src/components/ds/{AuthCard,AuthField,FormFeedback}.vue; components/context/ContextSelector.vue; components/shell/UnitSwitcher.vue | Anatomía DS sin fetch; props abajo, eventos arriba. |
| CT-B | front/src/components/{DashboardTopbar.vue,shell/AppTopbar.vue,shell/AppShell.vue}; views/{DashboardView,NotFoundView,ContextLostView}.vue; views/context/ContextView.vue; styles/{auth,access-forms,dashboard}.css | Contexto, integración visual, logout/topbar y conservación de vistas existentes; CSS literal. |
| CT-C | front/src/views/auth/{LoginView,RecoveryView,PasswordRequiredView}.vue; components/auth/{LoginForm,RecoveryStepForm,PasswordRequiredForm}.vue; composables/auth/useRecovery.ts | Formularios y secuencia pública de recuperación; secretos sólo transitorios fuera del store. |
| CT-A, integración final | front/src/{App.vue,main.ts} | Único integrador después de entregas B/C; instalación Pinia→Router ya existente, selección de layout y cableado. |

Reutilizo ConnectionForm.vue: modelo tenantCode, prop busy y submit (front/src/components/ConnectionForm.vue:1-15), y el asset local Inumito.png; no recopio ni sustituyo recursos por aproximaciones.
AuthCard compone card/logo/título/slots; AuthField sólo control/label; FormFeedback sólo mensajes/carga; ContextSelector y UnitSwitcher sólo selección emitida. Vistas coordinan, stores mantienen sesión, API transporta.
Sin cambios en r1.

## 5. 🎵 Pasos / fases

1. **Preparación focalizada.** Contrastar interfaces actuales y resultados del frente QA base independiente. Un defecto base sólo es prerequisito si está acreditado con localizador; no rehacer menú móvil, 404 o estados por claims sin evidencia. No confundir estado de contexto con estado de datos del dashboard.
2. **Publicación primero — CT-A.** Publicar LoginResponse, SelectUnitResponse, DetailResponse, RecoveryResponse y errores de operación; unknown en el borde, interfaces planas, const→type, sin any/casteos de JSON. El error HTTP conserva payload unknown además de status/detail/retryAfter; no presenta esos campos internos como envelope wire.
   Publicar useSessionStore con context/tenantCode/unitCode, identidad/bandera recibidas del login o contexto, estado de arranque, generation y acciones login, captureTenant, ensureContext, selectUnit, changeRequiredPassword, logout y purge. Credentials nunca son estado Pinia.
   Publicar busy por operación, logoutBusy, resultado local/servidor del cierre, resultado incierto de mutación y destino pendiente por intento; sólo estado cliente en memoria. Publicar firmas de recuperación y props/emits DS/shell: busy/messages tipados, submit/select/logout explícitos.
   Congelar interfaces; sólo A las cambia por coordinación del orquestador. La sesión mantiene una única consulta de contexto en vuelo por generación; dashboard y guards comparten su resultado.
   Fijo esta matriz de resolución; booting es transitorio, no un terminal que permita operar:
   | Entrada | Estado cliente | Superficie | Salida y límite |
   |---|---|---|---|
   | Arranque de ruta protegida, identidad desconocida y sin tenant | needs-tenant, después de resolver el arranque local | /contexto: captura manual | Envío manual de institución → booting; cero GET contexto antes de T; no expulsión a login por memoria vacía. |
   | T disponible y consulta de contexto vigente | booting | Carga DS de la superficie de acceso/contexto | Resolve/reject/timeout/abort controlado abandona la espera; no lectura operativa ni segunda consulta competidora. |
   | Login 200 con flag true e id propio/T capturado | ready para flujo de identidad, no para datos operativos | /password-required | No GET previo obligatorio; flag true bloquea operación. La identidad de login no sustituye AuthContext. |
   | Contexto 200 validado, identidad/tenant coherentes | ready | Flag true: /password-required; flag false sin unidad: /contexto; completo: destino seguro o / | Ready de sesión no afirma éxito de datos del dashboard; su error permanece independiente. |
   | Ausencia/pérdida de sesión acreditada, o cierre local | anonymous | /login | Purga y cero retry automático; sólo login explícito inicia otro intento. |
   | Red/429/timeout, payload inválido o identidad discrepante | failure | Error DS en /contexto o formulario auth que originó la operación | Sin datos operativos ni auto-fetch; lectura sólo por acción explícita. No atribuir expiración a red/429. |
   | Contexto ya resuelto carece del tenant requerido | context-lost | /contexto-perdido | Retirar datos/acceso; cero consulta automática; salidas login/logout. No confundir con captura inicial needs-tenant. |
   Públicos, contexto-perdido y 404 no consultan contexto por su mero montaje; las acciones explícitas conservan las OP que les corresponden.
3. **Fan-out 3, sin overlap.** A ejecuta transporte/sesión/router; B ejecuta DS/contexto/vistas conservadas; C ejecuta login/recuperación/forzado. B/C leen los contratos publicados y no editan types, stores, API, router, App ni main.
4. **Transporte y sesión — A.** Mantener request():Promise<Response> y compatibilidad status/detail/retryAfter. Reemplazar la extracción destructiva de sólo detail (front/src/api/http.ts:70-78,113-119) por una lectura única del JSON de error como unknown, conservada transitoriamente antes de mapear.
   Validar estructura y strings al obtener detail, mensaje, errores[] o error de contratos acreditados. JSON inválido conserva status/Retry-After y error controlado; no fabricar un mensaje del backend. No guardar ni registrar payloads.
   Login 400: las fuentes acreditan ValidationError general y feedback sin campo (apipoligono/serializers.py:441-453; S/experience/flows/session-context.md:49-51), no una clave de envelope. Obtener strings validadas del JSON recibido como mensajes generales, incluso dentro de arrays/objetos, sin asumir nombre de clave ni asignación a rut/password. No traducirlas, sugerir credenciales ni serializar objetos arbitrarios como feedback.
   Si se necesita estrechar ese cuerpo a un DTO wire, exigir primero fuente actual que acredite el envelope; pedir ese hecho puntual al orquestador si no existe evidencia local. Esta planificación no aporta un default DRF desde memoria.
   Public recovery 403 se muestra y no dispara logout. Select-unit 403 de pertenencia/asignación conserva sesión. OP-USR-013 declara 403 de acceso propio; conservar su error antes de clasificar. Red/429/CSRF por código solo no acreditan expiración.
   Para un 403 ambiguo de otra operación autenticada, con T disponible, permitir como máximo un GET aclaratorio OP-AUT-002. No reemitir la operación original. Si el fallo ya pertenece a OP-AUT-002, resolverlo directamente por su contrato/contexto: nunca consultarlo para aclararse a sí mismo.
   Contexto con denegación acreditada IA/TA → abortar/purgar/login y preservar destino seguro; fallo no clasificado → failure y reporte, sin recursión. Un GET aclaratorio con red/429 no prueba pérdida de sesión.
   Sesión es fuente única de contexto. Adaptar dashboard sin dos autoridades ni consultas competidoras; conservar lecturas, métricas, selectLesson/retry/purge y descartes existentes (stores/dashboard.ts:142-178,220-259,332-349,512-522).
   Toda respuesta y todo catch comprueba generación y operación vigentes antes de alterar datos, error o sesión. Cancelación no es éxito ni prueba de ausencia de efecto servidor. Ninguna mutación se reproduce automáticamente por red/timeout/abort.
5. **Guards — A.** Conservar createWebHistory, scrollBehavior y nombre actual del catch-all. Registrar sólo las siete rutas F2; returns/await, stores dentro del guard tras Pinia, sin next duplicado.
   Aplicar la matriz #2: arranque desconocido sin T → needs-tenant y /contexto; contexto ya resuelto sin tenant requerido → context-lost. No enviar OP-AUT-002 sin T ni construir /contexto↔/contexto-perdido.
   Con T, esperar el contexto salvo el camino login200/flag true, que dispone de id propio para entrar al forzado sin unidad. Tras reload, recuperar id/bandera mediante captura manual y contexto antes de cualquier POST propio.
   El guard es el escritor de query.redirect cuando intercepta un destino protegido seguro. Capturar el destino original, no las superficies intermedias. Una lectura centralizada al inicio del intento lo valida y conserva en el slot transitorio; login/forzado/contexto transportan ese mismo valor sin reemplazarlo ni consumirlo.
   Aceptar sólo string única, local con / inicial y sin //, esquema/origen externo, redirect anidado o datos sensibles; resolver contra rutas F2 realmente registradas, excluyendo catch-all y rutas de control /login, /recuperar, /password-required, /contexto y /contexto-perdido. Externos, no registrados y ciclos auth se descartan; rutas futuras siguen siendo 404.
   El único consumidor es la resolución final del guard cuando flag false y contexto/unidad requeridos estén consolidados. Marcar consumido y retirar slot/query de control antes de router.replace al destino; las vistas no hacen un segundo retorno. No volver a importar una query antigua dentro del mismo intento.
   Flag false con contexto completo → destino seguro o /; flag true → /password-required conservando destino; flag false sin unidad → /contexto conservando destino; contexto resuelto sin tenant → /contexto-perdido sin consumo. Una selección confirmada permite completar después el retorno.
   Público/404 se permite sin fetch; /contexto permite captura inicial y /password-required permite el camino propio acreditado. No redirigir a la misma superficie. Reentrada/back sin acción o resultado nuevo no inicia consultas ni repite transición; logout descarta el destino y expiración preserva sólo el destino seguro.
6. **Contexto y dashboard — B con A.** Mantener captura manual y ?tenant= como entrada manual del baseline, nunca como rehidratación. /contexto permite recaptura al faltar institución (S/experience/flows/session-context.md:68-80,87-110).
   Opciones: códigos deduplicados realmente devueltos en assignments.organization_unit/unit_membership.unit_code; no inferir pertenencias. Backend decide elegibilidad; conjunto insuficiente se reporta.
   | Resultado de select-unit | Decisión cliente |
   |---|---|
   | En vuelo + segunda activación | Busy en vista y acción: un solo POST; unidad previa confirmada, sin adopción optimista ni segunda mutación. |
   | 400 | Conservar unidad/contexto y mostrar detail validado; no retry automático. |
   | 403 de pertenencia/asignación | Conservar sesión/unidad; mostrar el literal exacto por modo: «La unidad no está en tus pertenencias activas.» o «La unidad no esta en sus asignaciones activas.»; no retry. Otro 403 usa #4, no una purga indiscriminada. |
   | 429 | Conservar unidad; espera/Retry-After, envío deshabilitado durante espera, sin retry automático. |
   | Red/timeout/abort con resultado incierto | Conservar la unidad previamente confirmada como dato histórico, no afirmar rollback servidor; suspender nuevas lecturas dependientes hasta reconciliar. No replay; ofrecer reconsulta explícita OP-AUT-002 con T y sin U anterior. |
   | 200 vigente y validado | Invalidar generaciones/abortar/purgar datos anteriores; adoptar código retornado coherente con T antes de refrescar contexto, sin U anterior; recargar dashboard sólo con contexto consolidado. |
   | Completion/error de generación anterior | Descartar sin cambiar unidad, busy de otra operación, errores ni datos. |
   Si la reconsulta explícita confirma otra unidad, purgar/incrementar generación antes de cargar sus datos; si falla, mantener incertidumbre visible, sin nueva mutación. Discrepancia tenant/identidad impide adoptar el resultado y se reporta.
   Conservar apariencia existente al cambiar unidad. Datos ausentes muestran —; ningún dato antiguo repinta después del 200 vigente.
7. **Auth y recuperación — C; DS — B.** Login usa rut/password/institución; institución no viaja en body ni se valida contra una lista inventada. Busy impide doble envío; 400 conserva feedback general real, 429 espera/Retry-After sin reintento automático.
   Login guarda sólo id/bandera/T necesarios en memoria; contraseñas y datos de recuperación permanecen transitorios fuera de Pinia, logs y storage, y se retiran al finalizar/cancelar/salir. Un resultado antiguo no autentica ni navega.
   Recuperación mantiene pasos 1–4 sólo en memoria local. Cada request captura intento, etapa y controlador; respuesta/catch/finally sólo actúan si siguen vigentes y la vista continúa montada. Cambio de etapa, cancelación y desmontaje invalidan y abortan; cancelación descarta progreso sin otra petición. Reentrada a /recuperar inicia paso 1 sin request.
   | Etapa/resultado | Decisión cliente |
   |---|---|
   | Paso 1/2, 200 vigente | Avanzar una etapa y mostrar el mismo detail genérico «Si el RUT está registrado, recibirás instrucciones.»; ningún badge, copy o habilitación deduce existencia. Mostrar correo_censurado tal cual sólo si viene contratado, sin inferir existencia por presencia/ausencia. |
   | Paso 3, 200 / 400 | 200 avanza a 4; 400 permanece en 3 con mensaje literal. |
   | Paso 4, 400 | Permanecer en 4 con mensaje/errores[] reales de validación; no limpiar como si hubiera éxito. |
   | Cualquier paso, 429 / red | Permanecer, mostrar espera/error apropiado y no avanzar ni auto-reintentar. |
   | Paso 2, red/timeout/abort incierto | No afirmar que no se creó/envió código; no repetir POST ni avanzar sin 200. Reinicio explícito local → paso 1 sin request; un nuevo envío posterior es una nueva acción consciente, no replay, y puede reemplazar el código anterior. |
   | Paso 4, red/timeout/abort incierto | No afirmar que contraseña/código permanecen intactos; no replay. Si la vista sigue vigente, permanecer con incertidumbre y ofrecer login manual o reinicio local en paso 1; no auto-login ni reutilización automática del código. |
   | Completion después de cancelar/desmontar/cambiar etapa | Descartar: no avanza, no muestra feedback ni toca el nuevo intento. |
   | Paso 4, 200 vigente | Cerrar asistente, retirar RUT/correo/código/contraseñas y volver a /login con feedback transitorio de éxito; no autenticar automáticamente. |
   El consumo del código tras éxito es expectativa acreditada por servidor (apipoligono/utils/recuperacion_utilidades.py:133-138), no un segundo POST de comprobación ejecutado por el cliente.
   Forzado usa sólo new_password y confirmación local. Desde login, usar id_usuario del 200 vigente; tras reload, usar user.id_usuario del contexto validado después de captura manual. Nunca obtener el destinatario de query/params ni elegir otro usuario. Si login/contexto discrepan en id o T, retirar identidad/datos, pasar a failure, bloquear POST y reportar; no escoger una fuente silenciosamente.
   | Resultado forzado | Decisión cliente |
   |---|---|
   | POST 200 + contexto 200 flag false | Desbloquear sólo con contexto vigente coherente; completo → consumir destino o /; sin unidad → /contexto conservando destino; sin tenant requerido → context-lost. |
   | POST 200 + contexto 200 flag true | Mantener bloqueo y reportar bandera no liberada; no false optimista ni repetición del POST. |
   | POST 200 + contexto 403 | Clasificar ese GET directamente según #4, sin GET aclaratorio recursivo. IA/TA acreditada → purga/login y reporte del impedimento; otro fallo no acreditado → failure bloqueante. No auto-login ni replay del cambio. |
   | POST 200 + contexto red/429/timeout | No afirmar desbloqueo; mostrar fallo de confirmación, bloquear repetición del POST y permitir únicamente reconsulta explícita del contexto. |
   | POST 400 | Mantener flujo con error:string|string[] literal, sin old_password en el body ni cancelación lateral. |
   | POST red/timeout/abort incierto | No afirmar «no procesado»; mantener acceso bloqueado y feedback de incertidumbre, sin replay. Reconsulta explícita de contexto o login manual son salidas de reconciliación, no repetición del cambio. |
   Reproducir auth-signin.html:22-59/auth-password.html:22-51; auth.css:64-209,257-307,329-397: card padding 72px, control 39px/8px 24px, logo 44px, CTA min-height 46px; móvil padding 40px 24px/control min-height 48px. Tokens, radios, bordes, estados y motion literales.
   Formularios/select/validación: forms-basic.html y forms-validation.html:398-429, baseui-forms.css:159-190,339-419; alerts/spinners y contexto-perdido desde fuentes catalogadas. Trasladar scope/ancestría CSS sin perder reglas ni contaminar dashboard.
   Documentar correspondencia funcional: RUT/institución sustituyen campos de muestra; no copiar datos demo, signup, remember-me persistente, customizer ni scripts storage. No inventar diseño para esos huecos ni cambiar la fuente DS.
8. **Integración única — A después de B/C.** App/main mantienen composición fina: RouterView, shell autenticado y layout auth sin sidebar; gestionar/restaurar clases body requeridas por auth.css, sin main anidados ni efectos globales sobrantes.
   Conectar UnitSwitcher, /contexto y logout del dropdown DS (DS/index.html:194); conservar teclado/móvil y anatomía 404. Ajustar sólo CTA 404 por sesión conocida, sin consulta automática.
   Al activar logout, adquirir logoutBusy antes de cualquier await; una segunda activación comparte el cierre o retorna sin otro POST. Incrementar generaciones, abortar requests anteriores, cerrar acceso y purgar inmediatamente datos/contexto/permisos/tenant/unidad/destino/estado auth transitorio; resetear apariencia existente a defaults y presentar /login sin esperar al POST.
   Emitir como máximo un POST /logout/ sin T/body, leyendo C actual y usando controlador nuevo excluido del aborto de requests anteriores y de su propio cierre. Si falta C, no emitir: la purga local se mantiene y se reporta el impedimento.
   Mantener la exclusión de cierre fuera de lo que purge resetea; bloquear nuevos login/mutaciones mientras el cierre está en vuelo. Finally repite purge idempotente del cierre vigente antes de liberar busy; no puede purgar una generación posterior ni cancelar su propio request.
   200 validado acredita cierre servidor; 403/red/timeout/abort sólo acreditan cierre/purga local y el resultado recibido, nunca éxito servidor por inferencia. No retry automático. Back y completions antiguas no restauran datos ni inician bootstrap desde la sesión local anonymous.
   No crear personalizador ni cola futura: sólo resetear la apariencia que ya existe.

### Cambios r1
- D-security-1: #2/#8 cierra y purga antes de esperar logout, con controlador nuevo y finally idempotente.
- D-api-1/D-api-2: #2/#4/#7 conserva error unknown, precisa 403 y evita envelope/field mapping inventados.
- D-api-3: #4/#7 distingue mutación incierta de operación no procesada y excluye replay.
- D-critical-flows-1: #5 fija writer/consumer, destino seguro, consumo único y recorridos completos.
- D-critical-flows-2: #2/#5/#8 fija estados/superficies y busy; mantiene G-SES-1 separado de contexto resuelto incompleto.
- D-critical-flows-3: #5/#7 fija id propio, discrepancia y ramas posteriores al cambio sin recursión.
- D-critical-flows-4: #6 completa select-unit y reconciliación explícita con descartes por generación.
- D-critical-flows-5: #7 fija lifecycle/feedback/reentrada/cierre, conservando correo_censurado contratado.

## 6. Riesgos

Mantengo G-SES-1 abierto: no existe recuperación automática de tenant tras reload; G-SES-2 no permite afirmar qué OP exigen U; G-SES-3 no acredita paginación servidor (S/requirements/shared-session-data.md:188-190).
OP-AUT-006 tiene conflicto real: S/tasks/core-infra.md:105-127 propone sonda, S/acceptance/session-access.md:41 prohíbe llamadas del cliente; TD§2 excluye T pero apipoligono/views.py:1374 exige TA. Mantengo no consumo F2; resolver documentalmente antes de cualquier caller futuro, sin crearlo aquí.
Cambio forzado: apipoligono/views.py:641-651 cambia contraseña, pero no acredita continuidad de sesión posterior. No ejecuté esa rama: contexto posterior 403 se clasifica sin otra consulta recursiva y se reporta como impedimento; no parchear servidor, auto-login ni false local.
Recuperación depende de correo/código reales; el paso 2 puede reemplazar códigos y el 4 cambia credenciales/consume códigos. Red/timeout/abort dejan efecto servidor incierto: no replay, rollback supuesto ni afirmación de código intacto.
Datos o autorizaciones ausentes impiden comprobar esas ramas, no justifican código/cuentas sintéticos. La comparación de feedback genérico no autoriza enumerar RUT.
Logout debe retirar acceso antes de esperar; busy y ownership del cierre impiden dos POST o una purga tardía sobre otro intento. Un logout fallido sólo acredita purga local; no permite afirmar cierre servidor. Ausencia de C bloquea la mutación, no la purga ni habilita bypass.
Login ValidationError general está acreditado, pero su envelope HTTP no quedó fijado por las fuentes leídas. El borde unknown conserva el contenido; estrecharlo exige evidencia actual, no defaults DRF recordados.
Registro documental divergente: S/index.md:7 aún draft; S/spec-meta.yaml:7 approved. Dos capas AC conviven (S/spec-meta.yaml:198-213); no renombro IDs, cambio aprobaciones ni reproduzco documentación ya entregada.
Mirror-Shard pide navegador, pero este encargo/rol lo prohíbe: conservo fuentes locales, sin afirmar fidelidad visual observada. p1 reportó ausente references/anti-pattern-catalog.md y lectura de módulos 01/03/08; no convierto ese antecedente en una auditoría nueva.
Cualquier dependencia fuera de front/, nuevo paquete, defecto backend o modificación visual sin fuente detiene esa rama y vuelve al orquestador con evidencia.
### Cambios r1
- D-security-1/D-critical-flows-2: separo cierre inmediato, exclusión de activaciones y confirmación servidor.
- D-api-2/D-api-3/D-critical-flows-3/D-critical-flows-4/D-critical-flows-5: explicito envelope no acreditado, resultados inciertos y límites de reconciliación sin replay ni datos sintéticos.

## 7. Verificaciones

Ahora sólo inspección read-only. Para implementación aplico nivel 1; niveles 2/4/5 únicamente bajo autorización vigente acreditada por el orquestador (reglas globales docs/proportionalidad.md §Escalera).
Scripts existentes: pnpm typecheck y pnpm build (front/package.json:7-9); conservar checks autorizados, sin reejecutarlos aquí ni convertir resultados previos en evidencia F2. No hay script test/lint autorizado: no añadirlo ni correr suite completa.
Inspección por writer: write set, wire keys, exclusiones T/C, payload unknown antes del mapping, purga/generation/ownership, ausencia de secretos/logs/storage, RouterLink y control nativo, labels/errores vinculados y CSS confrontado a fuente.
Seguridad: revisión focal F2 por Dhampir Slayer; QA Goblin cubre sesión/guards/CSRF/carreras; code_review se acota al diff F2. El orquestador gestiona esas revisiones de implementación: no lanzo reviewers del Plan Review Gate ni declaro passed.
| Escenario observable futuro | Resultado exigido y referencias de ambas capas |
|---|---|
| Login real y error general | 400 conserva mensaje literal aunque no venga en detail, sin anclaje inventado; flag/id reales, sin token almacenado. AC-SES-001 ↔ AC-OP-AUT-001; S/verification.md:126; S/acceptance/session-access.md:36. |
| Retorno con flag false | Destino seguro interceptado → login → contexto completo → destino una vez; si falta unidad, pasa por /contexto y sólo consume después de selección/contexto consolidado. AC-SES-001/003 ↔ AC-OP-AUT-001/002/003; S/experience/flows/session-context.md:40,102. |
| Retorno con flag true | Destino → login → /password-required conservando redirect → POST propio → contexto false → destino o /contexto si falta unidad; ningún retorno temprano ni repetición al usar back. AC-PWD-001 ↔ AC-OP-USR-013; S/verification.md:138. |
| Redirect externo/no registrado/cíclico | Descartado; flujo resuelve a /contexto cuando falte unidad o / cuando esté completo; no invoca rutas futuras ni repite transición sin acción/resultado nuevo. SCREEN-NOT-FOUND; §5#5. |
| Arranque y seis estados de #2 | Sin T → needs-tenant/captura, cero GET; con T → booting y una consulta compartida; red/429/timeout → failure visible, sin bucle; 200 coherente → ready; pérdida acreditada → anonymous/login; contexto resuelto incompleto → context-lost sin fetch. AC-SES-002/006 ↔ AC-OP-AUT-002/AC-FL-SES-006; S/verification.md:127,131. |
| Select-unit busy/400/403/429 | Segunda activación no crea otro POST; unidad previa hasta 200; 400 y literales 403 visibles, sesión conservada para pertenencia; 429 espera sin retry automático. AC-SES-003/004 ↔ AC-OP-AUT-003; S/verification.md:128-129. |
| Select-unit red/timeout/abort y 200 | Incertidumbre no se presenta como rollback; unidad previa hasta reconciliación explícita. Tras 200/contexto vigente, nueva unidad y datos, completions antiguas sin efecto, apariencia conservada. AC-SES-004 ↔ AC-OP-AUT-003; S/experience/flows/session-context.md:123-131. |
| Logout en vuelo, fallo y doble activación | Antes de resolver POST, shell/datos/permisos ya inaccesibles y login con defaults; cero repintado por back/completions. Con C y envío habilitado: un POST por cierre, incluso con doble activación; sin C: cero POST y purga local. Red/403 no se presentan como cierre servidor confirmado. AC-SES-005 ↔ AC-OP-AUT-005; S/verification.md:130; S/acceptance/session-access.md:40. |
| Clasificación 403 | Recovery público/negocio/CSRF no provoca purga indiscriminada; contexto con IA/TA acreditada sí; clarificador máximo uno sólo para otra OP, cero aclaraciones recursivas de OP-AUT-002. Contexto-perdido/404 no hacen fetch por montaje. AC-SES-006 ↔ AC-FL-SES-006; S/verification.md:131. |
| Forzado: identidad y resultados | Camino login usa id del 200; reload captura T y usa id del contexto; discrepancia bloquea POST. POST200/context200-false desbloquea; context403 reporta/clasifica sin replay; contexttrue o red/429 no desbloquea; POST400 permanece literal; red del POST no afirma «no procesado». AC-PWD-001 ↔ AC-OP-USR-013; S/verification.md:138. |
| Recuperación: cuatro pasos y feedback | Cada 200 vigente avanza; pasos 1/2 conservan igual detail genérico para entradas autorizadas coincidentes/no coincidentes, sin deducción por correo_censurado; 400 permanece en 3/4 con mensaje/errores[] reales; 429/red no avanza. AC-RCV-001 ↔ AC-OP-RCV-001…004; S/verification.md:137; S/acceptance/session-access.md:47-50. |
| Recuperación: lifecycle | Cancelar, desmontar o cambiar etapa durante request impide feedback/avance tardío; reentrada y reinicio explícito muestran paso 1 sin request; no resucitan secretos/progreso. S/experience/screens/access-context.md:69; S/experience/flows/recovery-password.md:44-48. |
| Recuperación: incertidumbre y éxito final | RCV002/004 con red/timeout/abort no se reenvían automáticamente ni prueban ausencia de efecto; reinicio local no solicita nada. Paso4/200 cierra y vuelve a login, sin auto-login. Consumo/expiración del código son expectativas servidor; no ejecuto un segundo cambio para acreditarlas. AC-RCV-001 ↔ AC-OP-RCV-004; apipoligono/utils/recuperacion_utilidades.py:94,121,133-138. |
| CSRF y transporte reales | AUT-003/005/USR-013 y recuperación conservan cookies/header reales según §2, sin capturar valores. AC-CORE-HTTP-01; S/tasks/core-infra.md:81-97. |
| DS y conservación | Anatomía/logo, reposo/focus/error/carga, responsive y ausencia de regresión dashboard/404; RUT/login/formularios siguen la misma fuente, sin signup. S/design-system/visual-contract.md:30-56; fuentes exactas §5#7. |

Para unicidad de POST/GET y ausencia de loop de peticiones exijo inspección runtime específicamente autorizada de metadatos: OP, método, ruta parametrizada, status y conteo por intento; nunca bodies, query sensible, cookies, headers, credenciales ni ids reales. Busy o apariencia no demuestran el conteo de red. Sin esa inspección, esa parte queda NOT_VERIFIED.
Credenciales las introduce el operador sin enviarlas al agente/artefacto. Herramientas runtime, inspección de peticiones, correo, cambio de unidad/contraseña, logout y producción de fallos requieren autorización específica; no reiterar la orden global de construir.
No provocar bloqueo, throttle, expiración ni alterar cuentas sólo para probar. Comparar feedback únicamente con entradas que el operador suministre y autorice; no generar RUT/cuentas/códigos. Sin dato real, herramienta o permiso, el orquestador registra NOT_VERIFIED por escenario; no fakes ni aprobación por build.
Detener comprobación ante C ausente, mismatch tenant/unidad/identidad, fallo de contrato, exposición sensible o impedimento backend; conservar sólo IDs de operación y resultado redactado, no payloads/cookies/capturas privadas.
### Cambios r1
- D-security-1/D-critical-flows-2: añado observación antes de resolver logout y conteo autorizado, separado del resultado servidor.
- D-api-1/D-api-2/D-critical-flows-1/D-critical-flows-3: añado error general, 403, retorno completo e identidad/ramas del forzado.
- D-api-3/D-critical-flows-4/D-critical-flows-5: añado incertidumbre, busy/rechazos de selección y matriz lifecycle/feedback/cierre de recuperación.

## 8. 🪕 Handoff para Code Transmuter

Entrego el orden: preparar→publicar interfaces A→fan-out A/B/C→integración exclusiva A→inspección y comprobaciones autorizadas→revisiones focales del diff F2. No lanzo writers ni una nueva ronda del Plan Review Gate.
A carga typescript/vue/vue-best-practices/vue-router-best-practices/pinia; B/C cargan typescript/vue/vue-best-practices/inume-css-html-anti-patterns/Mirror-Shard y Router/Pinia donde consuman sus APIs. Las siete skills requeridas se cargaron en esta correction. Antes de implementar, aplicar referencias core Vue y límites de navegador, sin copiar storage, logs o ejemplos de autorización permisiva de las skills.
Implementar sólo los write sets §4, sin nuevos archivos fuera de ellos; mantener dashboard, captura manual, 404, siete rutas, 36 pantallas/99 flujos como destino integral y ocho ejes en su fase futura. No editar App/main durante fan-out; no frontend alternativo, backend ni dependencias.
A publica primero los contratos de error unknown, estados/busy/generation y retorno único. Después implementa clasificación no recursiva, guards, selección y cierre inmediato; C implementa recuperación/forzado contra esos contratos; B reproduce DS y estados sin fetch propio. A integra al final.
No negociar las invariantes: purga antes de esperar logout; una mutación en vuelo; ninguna reproducción automática tras incertidumbre; id propio acreditado; false sólo desde contexto; redirect consumido una vez; lifecycle invalida completions; contexto desconocido sin tenant no equivale a contexto resuelto perdido.
Lore Master materializa este payload p2 secuencialmente en el plan existente; yo no escribo. Conservo el presupuesto documental de p1 y las correspondencias propuestas, sin spec nueva, ADR, informes duplicados ni renombrar IDs. AUT-006 sigue sin consumo F2; su conflicto requiere resolución antes de cualquier caller futuro, no una implementación de sonda aquí.
Correspondencia propuesta, no reconciliación aprobada: SES001→AUT001; SES002→AUT002; SES003/004→AUT002+003; SES005→AUT005; SES006→AC-FL-SES006; RCV001→RCV001…004; PWD001→USR013+AUT002.
PWD002…005, AUT004 y apariencia futura permanecen pendientes en su fase: cerrar F2 no cierra el producto integral ni sus gates.
Verificación mínima: inspección focal de §7 y matrices §5; scripts existentes sólo con permiso vigente. Comprobaciones observables y conteos sin autorización/evidencia se declaran individualmente pendientes. Cada writer cierra DELIVERED|BLOCKED|FAILED con rutas/evidencia, nunca verified/fixed.
### Cambios r1
- D-security-1/D-api-1/D-api-2/D-api-3/D-critical-flows-1/D-critical-flows-2/D-critical-flows-3/D-critical-flows-4/D-critical-flows-5: incorporo sus deltas como contratos previos al fan-out, invariantes de integración y verificación mínima; no amplío scope ni permisos.

## 9. Dependencias (derivación de la persistencia)

Derivadas de §5 Pasos / fases y de las notas del preflight (workstream `frontend-access-session-f2`, spec `spec-final-frontend-001`). Una línea por dependencia; no son afirmaciones verificadas por esta persistencia.

- Paso 3 (fan-out A/B/C) ← hito del paso 2: interfaces, types y props/emits publicados y congelados por CT-A; B y C leen, no editan.
- Paso 4 (transporte y sesión, A) ← contratos publicados en el paso 2; conserva `request():Promise<Response>` y compatibilidad `status`/`detail`/`retryAfter` actuales (`http.ts:70-78,113-119`) y los descartes por `generation` del dashboard (`stores/dashboard.ts:142-178,220-259,332-349,512-522`).
- Paso 5 (guards, A) ← paso 4: la sesión y sus terminales resueltos son la precondición de los guards; conserva `createWebHistory` y `scrollBehavior` existentes.
- Paso 6 (contexto y dashboard, B con A) ← paso 4 (sesión como fuente única de contexto) y paso 5 (rutas `/contexto` y `/contexto-perdido` registradas).
- Paso 7 (auth, recuperación y DS: C y B) ← paso 2 (firmas de recuperación y props/emits publicados) + fuentes visuales del kit externo; sin fetch en componentes DS.
- Paso 8 (integración única, A) ← `DELIVERED` de B y C; CT-A es el único integrador de `front/src/App.vue` y `front/src/main.ts`.
- Spec `spec-final-frontend-001` aprobada (2026-10-02 según §1 del payload; el estado lo gobierna [`./spec-meta.yaml`](./spec-meta.yaml), leído read-only en esta persistencia: `status: approved`, `approved_at: "2026-10-02"`).
- Orden vigente del operador (frontend integral, F2) + regla dura de separación planificación-ejecución: este `PLAN_PATH` no autoriza implementar.
- Plan base `frontend-build-base` `p3` en [`./implementation-plan.md`](./implementation-plan.md): excluye F2 de forma explícita (`:35-41`) y su base TS es el punto de partida. Este plan no lo modifica, no lo revisita y no comparte `payload_revision` con él.
- Base TS existente en `front/`: `front/src/main.ts:1-12`, `front/package.json:7-21`; stack TS 5.9.3, Vue, Router, Pinia y CSS vanilla, sin cambios de manifiesto, lockfile ni toolchain.
- Componentes a reutilizar sin reimplementar: `front/src/components/ConnectionForm.vue:1-15` (modelo `tenantCode`, prop `busy`, submit) y el asset local `Inumito.png`; helpers `getAuthContext`/`validateAuthContext` ya existentes en el cliente.
- Kit externo `../../Inume Design System/` (lectura sin escritura, valor literal 1:1): `index.html:194`, `auth-signin.html:22-59`, `auth-password.html:22-51`, `auth.css:64-209,257-307,329-397`, `forms-basic.html`, `forms-validation.html:398-429`, `baseui-forms.css:159-190,339-419`; la carpeta interna homónima no es fuente.
- Backend reportado en marcha en `127.0.0.1:8000` (estado reportado, **no verificado** en esta persistencia): se reutiliza; no arrancar, reiniciar ni detener.
- Comprobaciones autorizadas existentes: `pnpm typecheck` y `pnpm build` (`front/package.json:7-9`). No hay script `test`/`lint` autorizado: no añadirlo. Niveles 2/4/5 requieren autorización vigente acreditada por el orquestador (`docs/proportionalidad.md` §Escalera, reglas globales).
- Reviews previstas por el payload y a cargo del orquestador: `Dhampir-Slayer` (seguridad, diff F2), `QA-Goblin` (sesión/guards/CSRF/carreras) y `code_review` acotado al diff F2.
- Huecos abiertos que bloquean ramas concretas, no el plan: **G-SES-1** (sin recuperación automática de tenant tras reload), **G-SES-2** (no se puede afirmar qué OP exigen `X-Org-Unit-Code`), **G-SES-3** (paginación/filtros remotos no acreditados) y el **conflicto documental de OP-AUT-006** (`S/tasks/core-infra.md:105-127` propone sonda; `S/acceptance/session-access.md:41` prohíbe llamadas del cliente; TD§2 excluye T y `views.py:1374` exige TA), que requiere arbitraje documental antes de cualquier caller.
- Handoff de `Cunning-Bard` en modo disposition del gate (`BARD_CORRECTION_1`, ya ocurrido): `plan_payload_revised` con `plan_delta` y eco `payload_revision_out: p2`, entregado en la sesión `ses_efad814c7ffezkFkhqqELKPbC7` con las nueve directivas dispositionadas (7 `accept`, 2 `partial`) y `unresolved: none`. El cuerpo resultante está materializado en §1–§8; el evento del gate, con el arbitraje por directiva, está en `## Plan Review Gate`.
- Referencias de la spec y del código citadas por el cuerpo y **no** releídas en esta persistencia: `S/contracts/auth-context.md`, `S/requirements/shared-session-data.md`, `S/tasks/session-context.md`, `S/tasks/core-infra.md`, `S/tasks/recovery-password.md`, `S/experience/**`, `S/design-system/visual-contract.md`, `S/coverage/flows.md`, `S/acceptance/session-access.md`, `S/verification.md`, `S/index.md`, `S/spec-meta.yaml:198-213`, TD§2, `apipoligono/views.py`, `apps/identity/authentication.py`, `recuperacion_utilidades.py` (citado en el payload sin declarar carpeta) y `front/src/**`.
- Procedencia del cuerpo `p1`: `HANDOFF` DELIVERED de `Cunning-Bard` en la sesión `ses_efb135c21ffeXfz4FwZNhOfBoH` (referencia de sesión, no fuente durable).
- Procedencia del cuerpo `p2` (vigente): `plan_payload_revised` de la `PLAN_REVIEW_DISPOSITION` de `Cunning-Bard` en la sesión `ses_efad814c7ffezkFkhqqELKPbC7`, con `payload_revision_in: p1` / `payload_revision_out: p2`, arbitrada por el orquestador sobre contratos, scope, evidencia y coherencia. El anclaje de cada `plan_delta` en el cuerpo vive en `## Historial de revisiones > p2` y en el bloque de arbitraje de `## Plan Review Gate`.
- El cuerpo `p1` **no** se conserva como copia completa en este archivo: el gate no archiva cuerpos históricos y su presupuesto es de cuatro escrituras de ledger. La trazabilidad del delta es la entrada `p2` del historial más el ledger del gate.

## 10. Referencia a spec (derivación de la persistencia)

- **Spec asociada:** `spec-final-frontend-001` — *Frontend integral del producto final sobre el backend existente* (type: `full`).
- **Metadata (fuente única de verdad del estado):** [`./spec-meta.yaml`](./spec-meta.yaml), referenciada por `spec_meta` en el frontmatter. Lectura read-only para esta persistencia: `status: approved` (`:7`), `approved_at: "2026-10-02"` (`:13`), `verified_at: null` (`:14`). El estado **no** se replica aquí y este archivo **no** modifica esa metadata.
- **Volúmenes de la spec (modelo híbrido):** [`./index.md`](./index.md) como entrada; volúmenes en `docs/specs/final-frontend/` (`requirements.md`, `technical-design.md`, `verification.md`, `tasks.md`, `coverage.md`, `backend-inventory.md`, `backend-contracts.md`, y carpetas `contracts/`, `acceptance/`, `coverage/`, `design-system/`, `experience/`, `requirements/`, `tasks/`).
- **Divergencia de ruta respecto del nombre por defecto de la SSOT:** `docs/plan-persistence.md` resuelve `docs/specs/<spec-id>/implementation-plan.md` cuando existe spec. Aquí el preflight declaró `implementation-plan-access.md` porque `implementation-plan.md` ya está ocupado por el plan base. Son dos `plan_id` distintos (`frontend-build-base` vs `frontend-access-session-f2`), dos workstreams y dos contadores `payload_revision` independientes; **no** es una revisión del plan base y no habilita la cláusula de «actualizar el mismo archivo» de la SSOT. Por eso no existe bloque de diff: `p1` es el primer cuerpo de este `plan_id`.
- **Plan base (referencia, no dependencia de revisión):** [`./implementation-plan.md`](./implementation-plan.md) — `payload_revision: p3`, `review_gate: VALIDATED`, `review_gate_revision: r2`. Su `## Plan Review Gate` y su `## Historial de revisiones` le pertenecen y no se replican aquí.
- **Estado de revisión de este plan:** gate `prg-frontend-access-session-f2`, **cerrado en `VALIDATED`**. Frontmatter vigente: `review_gate: VALIDATED`, `review_gate_revision: r2`, `payload_revision: p2`. Las tres claves y la sección `## Plan Review Gate` existen y se escribieron en orden cronológico —checkpoint prelaunch (`REVIEWING`, `r1`), feedback `r1` (`FEEDBACK_PERSISTED`) y cierre `r2` con el cuerpo `p2`— con `Lore Master` como writer único y secuencial sobre este mismo archivo y presupuesto propio de cuatro escrituras; queda **1 de 4** sin uso. `VALIDATED` **no** autoriza implementación: `implementation_authorized: no` es literal e inmutable, y ningún veredicto del gate delega a un agente ejecutor.
- **Regla de lifecycle:** este archivo no autoriza implementación, ni por existir, ni por superar ningún gate. `VALIDATED` significa únicamente que el plan revisado quedó cerrado documentalmente como `VALIDATED`; no confiere permisos de runtime, no aprueba mutaciones ni datos, y no declara `quality_gates` de implementación superados ni producto final entregado. `PLAN_PATH` es el único puntero que debe circular hacia `Code Transmuter`; la orden explícita del operador sigue siendo necesaria para delegar implementación. La separación planificación-ejecución permanece dura.
- **Aprobaciones y registros vigentes, transcritos sin verificar:** el payload declara la spec aprobada y **no verificada** (S/spec-meta.yaml:7,13-14), afirma que el plan base excluye F2 (S/implementation-plan.md:35-41) y registra la divergencia documental S/index.md:7 (draft) frente a S/spec-meta.yaml:7 (approved). Esta persistencia transcribe esas afirmaciones; no las resuelve, no renombra IDs, no cambia aprobaciones y no completa la reconciliación de las dos capas AC.

## Historial de revisiones

### p1 — 2026-10-04 — cuerpo inicial `frontend-access-session-f2` (persistencia mecánica `TIER: FAST`, `Lore Master`)

- Procedencia: `plan_payload` del `HANDOFF` DELIVERED de `Cunning-Bard` (sesión `ses_efb135c21ffeXfz4FwZNhOfBoH`), 8 secciones canónicas transcritas literal y en orden original.
- Cambio material respecto del payload: ninguno en el cuerpo. Lo único añadido son `§9 Dependencias` y `§10 Referencia a spec`, derivaciones exigidas por `docs/plan-persistence.md > Estructura obligatoria del archivo Markdown`.
- `payload_revision: p1`; `review_gate` y `review_gate_revision`: no existen todavía (gate no despachado; fase posterior e independiente). El estado de la spec no se declara aquí: vive en `./spec-meta.yaml`.
- Sin diff de cuerpo: `p1` es la primera versión de este `plan_id`; no hay revisión previa que conservar.
- Cerrado como `DELIVERED` (persistencia), no como `VERIFIED` ni como producto completo. F2 sigue sin implementar y el producto integral sigue sin cerrar.

### p2 — 2026-10-04 — cuerpo revisado tras `BARD_CORRECTION_1` (materialización de `plan_payload_revised`, `Lore Master`)

- Procedencia: `plan_payload_revised` de la `PLAN_REVIEW_DISPOSITION` de `Cunning-Bard` (sesión `ses_efad814c7ffezkFkhqqELKPbC7`; `payload_revision_in: p1`, `review_gate_revision_in: r1`, `payload_revision_out: p2`), con las nueve directivas válidas dispositionadas —7 `accept`, 2 `partial`, 0 `reject`, 0 `unresolved`— y arbitraje del orquestador sobre contratos, scope, evidencia y coherencia.
- Las 8 secciones canónicas (§1–§8) se transcriben **literal** de ese payload, en orden original, incluidos los bloques `### Cambios r1` de cada sección. Sin reempaquetado, sin reinterpretación, sin correcciones técnicas y sin cambio de aprobaciones: las afirmaciones sobre spec aprobada o vigencia de fuentes siguen siendo transcripción del autor.
- `plan_delta` ejecutado, con anclas en el cuerpo `p2`: `§2` (OP-USR-013 con 403 explícito y error wire conservado; OP-RCV-002/004 marcadas no idempotentes); `§5` #2 (matriz de resolución con `booting` como estado transitorio, `needs-tenant` distinto de `context-lost` para el arranque sin tenant, y `logoutBusy`/resultado de cierre/resultado incierto publicados), #4 (payload de error completo como `unknown` antes de mapear, sin envelope DRF supuesto, clarificador único y nunca recursivo sobre `OP-AUT-002`), #5 (guard como writer de `query.redirect`, consumidor único al final del intento, validación del destino y conservación del valor, consumo antes de `router.replace`), #6 (matriz de `select-unit` con busy/400/403/429/red-abort/200/completions y reconciliación explícita sin replay ni `U` anterior), #7 (id propio acreditado en login y tras reload con discrepancia bloqueante, matriz de resultados del forzado sin `false` optimista ni auto-replay, y matriz de lifecycle/feedback de recuperación conservando `correo_censurado` como campo opcional contratado), #8 (cierre y purga inmediatos antes de esperar el `POST`, controlador nuevo excluido de su propio aborto, `finally` idempotente y máximo un `POST` por cierre); `§6` y `§7` ampliados con los límites de incertidumbre, recuento de red autorizado y resultados exigidos.
- Derivaciones actualizadas en `p2` sin reinterpretar la especificación: la nota de persistencia de la cabecera (ya no afirma «gate no despachado»), `§9` (procedencia del cuerpo `p2`, handoff de disposition realizado, ausencia de copia completa de `p1`) y `§10` (estado de revisión: gate cerrado en `VALIDATED`, `r2`, con `implementation_authorized: no`).
- `payload_revision: p1 → p2` (incrementado: hubo `plan_payload_revised` con delta); `review_gate_revision: r1 → r2`; `review_gate: VALIDATED`. `status` de la spec no se toca. El evento del gate —disposiciones, arbitraje y veredicto— está en `## Plan Review Gate`, sección separada y append-only.
- `p1` **no** se replica como copia completa en este archivo: el gate no archiva cuerpos históricos. La trazabilidad del cambio es esta entrada más el bloque de arbitraje del ledger.
- Cerrado como `DELIVERED` (persistencia documental), no como `VERIFIED`. F2 sigue sin implementar; el producto integral sigue sin cerrar; ningún veredicto de este gate autoriza implementación.

---

## Plan Review Gate

> **Ledger del gate `plan-review`.** Sección **append-only**, propiedad del `Plan Review Gate` y escrita por `Lore Master` como writer único y secuencial sobre este mismo archivo. Es un ledger de eventos del gate: **no** es cuerpo del plan, **no** incrementa `payload_revision` y **no** se replica en `## Historial de revisiones`. En este gate el trabajo del ledger se divide en dos secciones durables separadas: esta (`## Plan Review Gate`) y la del historial del cuerpo (`## Historial de revisiones`), que registra los cambios de `pN → pN+1` y no los eventos de gate. La política que gobierna esta sección es [`~/.config/opencode/docs/plan-review-gate.md`](../../../../../.config/opencode/docs/plan-review-gate.md) (SSOT, lectura read-only en esta escritura). **Ningún veredicto de este gate autoriza implementación**; el gate es un contrato documental y la separación planificación-ejecución permanece dura.

### Ciclo `prg-frontend-access-session-f2` — 2026-10-04 — veredicto `PENDING` (checkpoint prelaunch)

**Escritura 1 de 4 del presupuesto de este gate.** Checkpoint durable de entrada a `REVIEWING`, escrito **antes** del primer despacho de reviewers. No hay `PLAN_REVIEW_REPORT`, ni directivas, ni dispositions, ni veredicto en esta escritura: el cierre ocurre en las escrituras siguientes, dentro del mismo techo de cuatro.

#### Checkpoint

| Campo | Valor |
|---|---|
| `gate_id` | `prg-frontend-access-session-f2` |
| `PLAN_PATH` | `docs/specs/final-frontend/implementation-plan-access.md` |
| `payload_revision` | `p1` (cuerpo vigente; **replicado, no incrementado** — el checkpoint no es cuerpo) |
| `review_gate_revision` | `r1` (único valor posible al entrar) |
| Estado del gate | `REVIEWING` |
| Fecha del checkpoint | `2026-10-04` |
| Ejes diferidos | `none` |
| Ejes sin verificar | `none` |
| implementation_authorized | `no` |

**Revisión inicial:** `r1` · **Revisión final:** `r1` (no existe aún; se fija al cierre del ciclo)

#### Selección congelada

Calculada **una sola vez** en `DRAFT_PERSISTED`, antes del primer despacho, y **no** ampliable, sustituible ni recalculable durante el resto del gate. Tres ejes con evidencia citable (`1 ≤ |A| ≤ 4`), dentro del cap local del gate de hasta cuatro reviewers: **3 reviewers**, ninguno sobre el eje `7` de selección mínima porque `|A| ≠ 0`.

| Reviewer | Eje | Evidencia citable que dispara el eje | Eje fallido de otros por solapamiento |
|---|---|---|---|
| `Dhampir-Slayer` | 1 · Seguridad y secretos | `PLAN_PATH` `§2` (cookies `HttpOnly`, cabeceras `T`/CSRF, mutaciones), `§5` #4-8 (sesión, purga, credenciales), `§6` (CSRF ausente) y `§7` (sin secretos); hard #2 y #4 | — |
| `Portal-Warden` | 3 · Contrato de API | `PLAN_PATH` `§2` (tabla de 11 OP: método, body, status, headers), `§5` #4 (`error carrier unknown`, caso `403`), `§6` (`AUT006` en conflicto) | Dueño del eje seguridad en la superficie/authz: reporta el resto en `out_of_axis_observations`, nunca como directiva |
| `QA-Goblin` | 4 · Tests de flujos críticos | `PLAN_PATH` `§5` #5-8 (login → contraseña forzada → contexto/dashboard, recovery de 4 pasos, logout, cambio de unidad) y `§7` (matriz de observables); auth core hard #2 | — |

**Ejes no activados, y por qué.** Ningún eje se activa por tema, tamaño ni tono: solo por evidencia citable en el plan.

| Eje | Estado | Motivo |
|---|---|---|
| 2 · Datos y migraciones | **no activado** | El perfil del plan es frontend; el schema DB no se toca en el cuerpo. Por lo tanto **no** se registra eje crítico sin verificar. |
| 5 · Performance medible | no activado | El plan no introduce pasos con bundle, query pesada, render de listas, tiempo real ni concurrencia. |
| 6 · Arquitectura y decisión ausente | no activado | `Cunning-Bard` ya decidió sobre el patrón existente (stores, API client, views); no presupone decisión arquitectónica nueva ni introduce framework, capa, pagos ni backend nuevos. |
| 7 · Calidad y deuda del plan | no activado | No es la selección mínima: `|A| = 3 > 0`. |
| 8 · UX y accesibilidad | no activado | Eje **opt-in**; el operador no lo pidió. Sin performance de magnitud ni auditoría UX en este gate. |

#### Invocaciones lógicas previstas

Ronda única, tres revisiones en paralelo, **cero retry, cero reemplazo, cero segunda invocación**. Lectura mínima: cada reviewer abre el plan desde `plan_path`; el packet **no** retransmite el plan. Ningún reviewer escribe, delega ni abre navegador, MCP, web, shell, DB ni servidor; `review_mode: plan` es read-only.

##### 1 · `Dhampir-Slayer` — eje 1, seguridad

```text
PLAN_REVIEW_PACKET
gate_id: prg-frontend-access-session-f2
plan_path: docs/specs/final-frontend/implementation-plan-access.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
reviewer: Dhampir-Slayer
axis: 1 seguridad
axis_evidence: PLAN_PATH §2 cookies/headers/creds/CSRF y §5 #4-8 auth/purga; hard #2/#4
read_scope: PLAN_PATH §1-8; contracts/auth-context.md; requirements/shared-session-data.md RSES001-025; technical-design.md §2/§13; source API/http/dashboard/store y handlers backend citados solo como contratos de seguridad F2. Sin secretos, cuerpos reales ejecutados ni proyecto entero.
evidence_focus: transporte CSRF/tenant/literal 403; public login bootstrap real; purga/sesión/logout/forzado creds lifecycle; generation cancelaciones y redirect local.
out_of_axis: DB/performance/UX global/calidad general
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda unica, sin retry, sin segunda invocacion
```

##### 2 · `Portal-Warden` — eje 3, contrato de API

```text
PLAN_REVIEW_PACKET
gate_id: prg-frontend-access-session-f2
plan_path: docs/specs/final-frontend/implementation-plan-access.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
reviewer: Portal-Warden
axis: 3 API
axis_evidence: PLAN_PATH §2 tabla 11 OP y §5 #4 unknown/error bodies/headers/exclusiones, §6 AUT006
read_scope: PLAN_PATH §2/3/4/5/6/7; contracts/auth-context.md; technical-design.md §2; routes/handlers/serializers backend citados en la tabla lookup F2; client HTTP shape validation actual. Lectura mínima de operation contract, no API server audit general.
evidence_focus: método/path/body/status literal/auth/T/C errores wire; API client boundary unknown; select unit/post required password/recovery idempotencia 429/error no retry; AUT006 no caller.
out_of_axis: arquitectura ausente/SQL/perf no evidenciada/UX/testing
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda unica, sin retry, sin segunda invocacion
```

##### 3 · `QA-Goblin` — eje 4, flujos críticos

```text
PLAN_REVIEW_PACKET
gate_id: prg-frontend-access-session-f2
plan_path: docs/specs/final-frontend/implementation-plan-access.md
payload_revision: p1
review_gate_revision: r1
review_mode: plan
reviewer: QA-Goblin
axis: 4 flujos críticos
axis_evidence: PLAN_PATH §5 #5-8 y §7 matriz login/recovery/forced/context/logout/cancelaciones; core hard #2
read_scope: PLAN_PATH §2-8; experience/screens/access-context.md; experience/flows/session-context.md y flows/recovery-password.md; acceptance/session-access.md; verification.md:126-142; requirements auth/session guard citados, client router/store/types fragmentos solo para base invariante.
evidence_focus: terminales guards sin loops/públicos no fetch; reload tenant manual; login forced password/session continuity; 1 mutation/no old completions; recovery 4 stages/permisos observable/no fakes.
out_of_axis: auditoría seguridad/SQL/performance/DS global/calidad general
max_directives: 5
required_output: PLAN_REVIEW_REPORT
round_policy: ronda unica, sin retry, sin segunda invocacion
```

#### Registro de la ronda

- **Lote local del gate:** 3 reviewers (cap ≤ 4), dentro del rango universal `2-6` de la matriz canónica de `docs/delegation-rules.md`.
- **Despacho:** pendiente del orquestador tras esta escritura. Este checkpoint es la prerrequisito duro del primer despacho; sin él, cero reviewers.
- **Eco de contadores:** `payload_revision: p1` y `review_gate_revision: r1` son eco del frontmatter de este archivo. Cada reviewer los verifica al abrir el packet y reporta en `unverified` si no coinciden.
- **Restricciones de la ronda:** sin secretos, sin cuerpos reales ejecutados, sin navegador, MCP, web, shell, DB, servidor ni delegation; lectura acotada al `read_scope` de cada packet.
- **Presupuesto restante:** 3 de 4 escrituras (feedback `r1`; cuerpo `p2+r2` o cierre `r2`; cuerpo `p3+r3` o cierre `r3` si hubiera `BARD_CORRECTION_2`).

#### Nota de consistencia documental

Dos afirmaciones del cuerpo `p1` quedaron desactualizadas **por esta fase**, no por una corrección técnica: la nota de persistencia de la cabecera (`§ preamble`, línea 14) y `§10` (`Estado de revisión de este plan`, línea 217) declaran que el gate «no se ha despachado» y que no existen `review_gate` ni `review_gate_revision`. Con el checkpoint de hoy esa frase es **histórica**: describe el estado antes de la entrada a `REVIEWING`. Se conservan **literales** —el checkpoint no reescribe el cuerpo ni el historial, y el archivo debe leerse como una cronología, no como una foto—; esta nota es el puente explícito entre las dos capas. La reconciliación de esa redacción corresponde a una materialización posterior del cuerpo (`p2`), nunca a una escritura de ledger.

---

#### Feedback `r1` — escritura 2 de 4

**Estado:** `REVIEWING → FEEDBACK_PERSISTED`. Ronda única cerrada con **3 `PLAN_REVIEW_REPORT` terminales** (uno por eje seleccionado). Esta escritura **no** contiene `PLAN_REVIEW_VERDICT`, **no** contiene dispositions y **no** modifica el cuerpo del plan.

| Contador | Valor | Efecto de esta escritura |
|---|---|---|
| `payload_revision` | `p1` | **replicado, no incrementado**: es una escritura solo de ledger, sin `plan_payload_revised` |
| `review_gate_revision` | `r1` | sin cambio: la ronda única cierra dentro de `r1` |
| Estado del gate | `FEEDBACK_PERSISTED` | escrito en el frontmatter de este archivo |
| `implementation_authorized` | `no` | esta escritura no autoriza implementación |

> **Lectura del encabezado del ciclo.** Se conserva literal `veredicto PENDING (checkpoint prelaunch)` porque pertenece a la escritura 1. El estado vigente no se deduce de ahí: se lee en el frontmatter (`review_gate: FEEDBACK_PERSISTED`) y en el bloque siguiente. Este archivo se lee como cronología, no como foto.

##### Registro de la ronda cerrada

| Reviewer | Eje | Resultado | Stance | Eco de contadores |
|---|---|---|---|---|
| `Dhampir-Slayer` | 1 · Seguridad y secretos | `PLAN_REVIEW_REPORT` terminal | `partial` | `payload_revision_in: p1` / `review_gate_revision_in: r1` |
| `Portal-Warden` | 3 · Contrato de API | `PLAN_REVIEW_REPORT` terminal | `partial` | `payload_revision_in: p1` / `review_gate_revision_in: r1` (metadatos normalizados; ver nota de normalización) |
| `QA-Goblin` | 4 · Tests de flujos críticos | `PLAN_REVIEW_REPORT` terminal | `partial` | `payload_revision_in: p1` / `review_gate_revision_in: r1` |

- **Sin re-invocación:** cero retry, cero reemplazo, cero segunda invocación, cero despacho adicional. La ronda de `REVIEWING` queda cerrada; ningún reviewer vuelve a abrirse.
- **Sin fallo de eje:** los ejes 1, 3 y 4 entregaron `PLAN_REVIEW_REPORT`; ningún eje queda en `unverified_axes` por fallo de reviewer.
- **Ejes no activados en el checkpoint (2, 5, 6, 7, 8):** siguen sin activar y sin abrir despacho, según la selección congelada.
- **Out of axis:** las `out_of_axis_observations` de los tres reportes **no** son directivas, **no** se persisten como tales y **no** llegan al `Cunning Bard`; quedan aquí solo como trazabilidad de la ronda.

##### Directivas válidas

Nueve directivas superaron los tres ejes de filtrado (dominio, scope y evidencia). `Disposición` y `Arbitraje` quedan **`pendiente`**: esta escritura es el feedback `r1` y **no** dispositiona ni arbitra; ambas columnas las fija el orquestador en la escritura 3 o 4.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-security-1` | 1 · Seguridad y secretos | material | **`PLAN_PATH` `§5` #8 (logout) / `§7` (observable de purga)** — la purga en `finally` mantiene datos y contexto accesibles durante el `POST` de logout. | `PLAN_PATH:124`; `front/src/api/http.ts:99-107`; `requirements/shared-session-data.md:143-147` | pendiente | pendiente |
| `D-api-1` | 3 · Contrato de API | material | **`PLAN_PATH` `§2` `OP-USR-013`** — «fallos de acceso» no es un status HTTP explícito. | `apipoligono/views.py:606-614`; `technical-design.md:169-173`; `contracts/auth-context.md:22` | pendiente | pendiente |
| `D-api-2` | 3 · Contrato de API | material | **`PLAN_PATH` `§5` #4 (frontera de error HTTP del cliente)** — «validación» no especifica conservar el `ValidationError` de login, con `field`, frente a un `detail` de HTTP extraído aparte. | `apipoligono/serializers.py:441-453`; `front/src/api/http.ts:70-78`; `PLAN_PATH` `§5` #4 | pendiente | pendiente |
| `D-api-3` | 3 · Contrato de API | material | **`PLAN_PATH` `§2` `OP-RCV-002`/`OP-RCV-004` + `§5` #7** — los POST no idempotentes ante red, timeout o abort inciertos no tienen conducta explícita. | `recuperacion_utilidades.py:70-77` (elimina códigos anteriores) y `:133-138` (consume tras password); `PLAN_PATH` `§5` #7 | pendiente | pendiente |
| `D-critical-flows-1` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #5 (`redirect`) + `§7`** — `query.redirect` recorre hasta 3 saltos sin writer, sin consumidor de un solo uso y sin destinos decidibles. | `PLAN_PATH` `§5` #5; `experience/flows/session-context.md` `FLSES001:40` / `FLSES003:102`; `experience/screens/access-context.md:43`; `flows/recovery-password.md` `FLPWD001:64`; `verification.md:126` | pendiente | pendiente |
| `D-critical-flows-2` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #2 / #5 / #8 + `§7`** — los seis terminales (`booting`, `needs-tenant`, `ready`, `anonymous`, `failure`, `context-lost`) carecen de entradas, salidas y superficies; el logout no controla la doble activación. | `PLAN_PATH` `§5` #2 / #4 / #5 / #8; `experience/flows/session-context.md` `FLSES005:150-153`; `acceptance/session-access.md` `ACOPAUT005:40` | pendiente | pendiente |
| `D-critical-flows-3` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #5 / #6 / #7 (forzado) + `§7`** — los tres resultados del forzado (tras el POST HTTP, y la correctitud por camino) no están fijados. | `PLAN_PATH` `§5` #5 / #7 / `§6`; `experience/flows/recovery-password.md` `FLPWD001:63`; `verification.md:138`; `experience/screens/access-context.md:79` | pendiente | pendiente |
| `D-critical-flows-4` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #6 (select unit) + `§7`** — la matriz cubre solo 200, sin `busy`, sin rechazos y sin red incierta. | `PLAN_PATH` `§5` #6; `experience/flows/session-context.md` `FLSES004:129-131`; `verification.md` `ACSES004:129` | pendiente | pendiente |
| `D-critical-flows-5` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #7 (recuperación) + `§7`** — cancelación, unmount, reentrada y feedback genérico de etapas 1-2 no generan matriz observable. | `PLAN_PATH` `§5` #7; `experience/screens/access-context.md:67` / `:69`; `experience/flows/recovery-password.md` `FLRCV001:44-48`, `R-REC-02` | pendiente | pendiente |

**Conteo:** `directives_valid: 9` · por eje → seguridad 1, contrato de API 3, flujos críticos 5 · severidad → `material: 9`, `blocking: 0`, `minor: 0`.

##### Directivas descartadas

`none` — cero directivas descartadas en esta ronda. Las nueve candidatas superaron los tres ejes de filtrado (dominio, scope y evidencia) antes de entrar al ledger.

**Deduplicación:** cero fusiones. Los dos reclamos sobre logout no se unificaron porque no son el mismo: `D-security-1` (eje 1) trata la **ventana de purga** — datos y contexto accesibles durante el `POST` — y `D-critical-flows-2` (eje 4) trata la **entrada y el estado observable** — matriz de terminales y control de doble activación. Efectos distintos, directivas distintas.

##### Reviewers

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | 1 · Seguridad y secretos | partial | 1 |
| `Portal-Warden` | 3 · Contrato de API | partial | 3 |
| `QA-Goblin` | 4 · Tests de flujos críticos | partial | 5 |

Los tres stances son `partial`: ninguno de los tres ejes resolvió `accept` y ninguno es `reject`. `stance` es la evaluación del reviewer sobre el plan completo dentro de su eje; **no** es una disposición ni un veredicto, y no prejuzga el arbitraje.

##### Normalización nominal de metadatos de los reportes (autorizada por el operador)

El operador autorizó explícitamente normalizar los metadatos crudos de los reportes de API para registrarlos con la nomenclatura del contrato `PLAN_REVIEW_REPORT` (`docs/plan-review-gate.md > Contratos del gate`, contrato 2):

- **Registrado tal cual venía (crudo):** `payload_revision: p1`, `review_gate_revision: r1`.
- **Registrado en el ledger:** `payload_revision_in: p1`, `review_gate_revision_in: r1`.

Reglas que gobiernan esta anotación, sin excepciones:

1. La correspondencia es **nominal y solo de metadatos** de reporte de API: cambia el nombre del campo, **no** el valor, **no** la fuente y **no** los hallazgos.
2. **No** declara que este agente haya modificado ningún otro campo: la normalización quedó registrada por el orquestador como acto autorizado del operador, y aquí solo se deja constancia.
3. Los valores `p1` / `r1` son **congruentes** entre el eco crudo y el campo normalizado; `*_in` se conserva por freshness y para distinguir el eco de entrada de la salida del ciclo.
4. **Cero** promoción de atributos extra a prosa del ledger: solo el par de campos anterior, más `stance` y conteos ya exigidos por el ledger.
5. **Sin** segunda invocación de `Portal-Warden` (ni de ningún reviewer) y **sin** cambio en el cuerpo `p1` ni en el análisis de API: el reporte se conserva tal cual llegó.

##### Limitaciones declaradas por los reviewers (`unverified`)

Se registran como trazabilidad de la ronda. **No** son directivas, **no** se dispositionan y **no** van al `Cunning Bard`.

| Reviewer | Limitaciones declaradas |
|---|---|
| `Dhampir-Slayer` | Cookies y continuidad de sesión en runtime no comprobadas; el plan no contiene código, solo diseño. |
| `Portal-Warden` | Envelope final del `ValidationError` de login no verificado; `Retry-After` en 429 es opcional; wire de `OP-AUT-006` excluido de F2 salvo caller. |
| `QA-Goblin` | Runtime no implementado; referencias de backend fuera de eje no leídas; primarios RSES/TD no reconsultados; sin runner propuesto; **no** hay ausencia de tests ni defecto observado. |

> **Ninguna de estas limitaciones es un fallo de eje.** En particular, la del envelope de `ValidationError` de login es exactamente lo que `D-api-2` pide definir en el cuerpo, y su resolución corresponde al `Cunning Bard` en la corrección 1, no a esta escritura de ledger. Ninguna se convierte aquí en `unverified_axes` ni en veredicto.

##### Notas de integridad del ledger

- **Presupuesto:** esta es la **escritura 2 de 4**. Quedan 2 para el cierre `r2` (cuerpo `p2` si el Bard entrega `plan_payload_revised`, o solo disposiciones + arbitraje + veredicto si no hay delta) y para el eventual `r3` tras `BARD_CORRECTION_2`.
- **Sin cuerpo revisado todavía:** no existe `plan_delta` ni `plan_payload_revised` en esta fase. `payload_revision` sigue en `p1` y `## Historial de revisiones` **no** se toca: no hay cambio de cuerpo que registrar.
- **Lo que esta escritura NO hace:** no dispositiona, no arbitra, no emite veredicto, no recalcula la selección congelada, no amplía ejes, no reconstruye ni modifica el checkpoint, y **no autoriza implementación** bajo ninguna forma.
- **Cero secretos:** ninguna evidencia registrada contiene valores sensibles; todas son referencias `archivo:línea` o `PLAN_PATH:sección`.

---

#### Cuerpo `p2` + arbitraje y veredicto `r2` — escritura 3 de 4

**Estado:** `FEEDBACK_PERSISTED → VALIDATED` (terminal). El orquestador recibió la `PLAN_REVIEW_DISPOSITION` de `Cunning-Bard` (sesión `ses_efad814c7ffezkFkhqqELKPbC7`; `payload_revision_in: p1`, `review_gate_revision_in: r1`, `payload_revision_out: p2`) con las nueve directivas válidas dispositionadas y un `plan_payload_revised` con `plan_delta`. `Lore Master` materializa ese cuerpo como `payload_revision: p2` y el ciclo cierra en `r2`.

| Contador | Valor | Efecto de esta escritura |
|---|---|---|
| `payload_revision` | `p1` → `p2` | **incrementado**: el Bard entregó `plan_payload_revised` con delta y el cuerpo fue materializado en §1–§8 |
| `review_gate_revision` | `r1` → `r2` | cierre del ciclo tras `BARD_CORRECTION_1` |
| Estado del gate | `VALIDATED` | escrito en el frontmatter de este archivo |
| `implementation_authorized` | `no` | `VALIDATED` **no** autoriza implementación |

**Revisión inicial:** `r1` · **Revisión final:** `r2`

> El checkpoint de la escritura 1 dejó `Revisión final: r1` como valor provisional («no existe aún; se fija al cierre del ciclo»). Aquí se fija `r2` **sin reescribir el checkpoint**: los bloques previos de este ciclo permanecen literales y el encabezado del ciclo conserva su `veredicto PENDING` de la escritura 1. El estado vigente se lee en el frontmatter (`review_gate: VALIDATED`) y en el bloque de veredicto de esta escritura.

**Selección congelada:** sin cambios — los tres reviewers del checkpoint (`Dhampir-Slayer` eje 1, `Portal-Warden` eje 3, `QA-Goblin` eje 4), con la evidencia citable registrada en `#### Checkpoint > #### Selección congelada`. No se amplía, no se recalcula y no abre despacho adicional.
**Ejes diferidos:** `none` · **Ejes sin verificar:** `none`

##### Disposiciones y arbitraje (9 de 9 · `unresolved: 0`)

`Disposición` reproduce la del `Cunning-Bard`; `Arbitraje` es el resultado del arbitraje del orquestador sobre los cuatro ejes permitidos (contratos, scope, evidencia, coherencia). Ninguna disposition queda `pendiente` y ninguna se convierte en `deferred`.

| ID | Eje | Severidad | Reclamo | Evidencia | Disposición | Arbitraje |
|---|---|---|---|---|---|---|
| `D-security-1` | 1 · Seguridad y secretos | material | **`PLAN_PATH` `§5` #8 (logout) / `§7` (observable de purga)** — la purga en `finally` mantiene datos y contexto accesibles durante el `POST` de logout. | `PLAN_PATH:124`; `front/src/api/http.ts:99-107`; `requirements/shared-session-data.md:143-147` | accept | resolved |
| `D-api-1` | 3 · Contrato de API | material | **`PLAN_PATH` `§2` `OP-USR-013`** — «fallos de acceso» no es un status HTTP explícito. | `apipoligono/views.py:606-614`; `technical-design.md:169-173`; `contracts/auth-context.md:22` | accept | resolved |
| `D-api-2` | 3 · Contrato de API | material | **`PLAN_PATH` `§5` #4 (frontera de error HTTP del cliente)** — «validación» no especifica conservar el `ValidationError` de login, con `field`, frente a un `detail` de HTTP extraído aparte. | `apipoligono/serializers.py:441-453`; `front/src/api/http.ts:70-78`; `PLAN_PATH` `§5` #4 | accept | resolved |
| `D-api-3` | 3 · Contrato de API | material | **`PLAN_PATH` `§2` `OP-RCV-002`/`OP-RCV-004` + `§5` #7** — los POST no idempotentes ante red, timeout o abort inciertos no tienen conducta explícita. | `recuperacion_utilidades.py:70-77` (elimina códigos anteriores) y `:133-138` (consume tras password); `PLAN_PATH` `§5` #7 | accept | resolved |
| `D-critical-flows-1` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #5 (`redirect`) + `§7`** — `query.redirect` recorre hasta 3 saltos sin writer, sin consumidor de un solo uso y sin destinos decidibles. | `PLAN_PATH` `§5` #5; `experience/flows/session-context.md` `FLSES001:40` / `FLSES003:102`; `experience/screens/access-context.md:43`; `flows/recovery-password.md` `FLPWD001:64`; `verification.md:126` | accept | resolved |
| `D-critical-flows-2` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #2 / #5 / #8 + `§7`** — los seis terminales (`booting`, `needs-tenant`, `ready`, `anonymous`, `failure`, `context-lost`) carecen de entradas, salidas y superficies; el logout no controla la doble activación. | `PLAN_PATH` `§5` #2 / #4 / #5 / #8; `experience/flows/session-context.md` `FLSES005:150-153`; `acceptance/session-access.md` `ACOPAUT005:40` | partial | resolved |
| `D-critical-flows-3` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #5 / #6 / #7 (forzado) + `§7`** — los tres resultados del forzado (tras el POST HTTP, y la correctitud por camino) no están fijados. | `PLAN_PATH` `§5` #5 / #7 / `§6`; `experience/flows/recovery-password.md` `FLPWD001:63`; `verification.md:138`; `experience/screens/access-context.md:79` | accept | resolved |
| `D-critical-flows-4` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #6 (select unit) + `§7`** — la matriz cubre solo 200, sin `busy`, sin rechazos y sin red incierta. | `PLAN_PATH` `§5` #6; `experience/flows/session-context.md` `FLSES004:129-131`; `verification.md` `ACSES004:129` | accept | resolved |
| `D-critical-flows-5` | 4 · Tests de flujos críticos | material | **`PLAN_PATH` `§5` #7 (recuperación) + `§7`** — cancelación, unmount, reentrada y feedback genérico de etapas 1-2 no generan matriz observable. | `PLAN_PATH` `§5` #7; `experience/screens/access-context.md:67` / `:69`; `experience/flows/recovery-password.md` `FLRCV001:44-48`, `R-REC-02` | partial | resolved |

**Conteo de cierre:** `directives_total: 9` · `accept: 7` · `partial: 2` · `reject: 0` · `unresolved: 0` · por eje → seguridad 1 (1 accept), contrato de API 3 (3 accept), flujos críticos 5 (3 accept, 2 partial) · severidad → `material: 9`, `blocking: 0`, `minor: 0`. Ninguna directiva de severidad `blocking` quedó abierta, y los tres ejes activados (incluidos los críticos `1` y `3`) entregaron reporte.

##### Trazabilidad de los deltas ejecutados en el cuerpo `p2`

Bloque complementario de la tabla anterior: fija **dónde** se materializó cada `plan_delta` en el cuerpo `p2` y qué parte de cada `partial` quedó fuera. La auditoría de dominio sigue siendo del especialista; el arbitraje se limitó a contratos, scope, evidencia y coherencia.

| ID | Disposición | Anclas del `plan_delta` en el cuerpo `p2` | Límite de la `partial` o nota de arbitraje |
|---|---|---|---|
| `D-security-1` | accept | `§5` #2 (`logoutBusy`, resultado local/servidor del cierre) · `§5` #8 (purga y cierre del acceso **antes** de esperar el `POST`, máximo un `POST` por cierre, controlador nuevo excluido del aborto de requests anteriores y de su propio cierre, `finally` con purge idempotente) · `§6` y `§7` (purga local acreditada ≠ cierre servidor; conteo de red metadatos y autorizado, separado del resultado) | Sin límite. `200`/`403`/red no se presentan nunca como cierre servidor confirmado. |
| `D-api-1` | accept | `§2` `OP-USR-013` (403 explícito de denegación sesión/tenant conservando el error wire) · `§5` #4 (OP-USR-013 declara 403 de acceso propio; conservar su error antes de clasificar) · `§5` #7 y `§7` (ninguna denegación se decide por status solo) | Sin límite. |
| `D-api-2` | accept | `§2` y `§5` #2/#4 (el payload de error completo se conserva como `unknown`; los mensajes son strings validados tomados del JSON recibido, incluso en arrays/objetos, sin asumir clave ni asignarlos a `rut`/`password`) · `§6` y `§7` (estrechar a un DTO wire exige fuente actual que acredite el envelope; no se aporta default DRF desde memoria) | Sin límite. La fuente anterior al DTO es condición explícita, no supuesto. |
| `D-api-3` | accept | `§2` (`OP-RCV-002`/`OP-RCV-004` como mutaciones no idempotentes) · `§5` #7 (red/timeout/abort incierto: no afirmar ausencia de efecto, no repetir el `POST`, reinicio explícito local al paso 1 sin request, login manual como salida) · `§6` y `§7` (límite de reconciliación observable) | Sin límite. El consumo/expiración del código queda como expectativa de servidor, sin segundo cambio para acreditarla. |
| `D-critical-flows-1` | accept | `§5` #5 (el guard es el writer de `query.redirect`; captura el destino original, no superficies intermedias; validación y conservación en slot transitorio; **único** consumidor en la resolución final, marcado consumido antes de `router.replace`) · `§7` (redirect externo, no registrado o cíclico se descarta; los tres saltos resuelven sin ciclos) | Sin límite. Las vistas no hacen un segundo retorno. |
| `D-critical-flows-2` | partial | `§5` #2 (matriz de resolución con entrada, estado, superficie, salida y límite; `booting` transitorio y no terminal) · `§5` #5 (arranque desconocido sin `T` → `needs-tenant` + `/contexto`; contexto ya resuelto sin tenant requerido → `context-lost`, sin construir el ciclo `/contexto↔/contexto-perdido`) · `§5` #8 (`logoutBusy` y control de doble activación) · `§7` (conteo autorizado por metadatos, sin appearance inferido) | **Parcial:** el `G-SES-1` de arranque sin tenant permanece abierto y separado de la condición «contexto resuelto incompleto» (evidencia: `requirements/shared-session-data.md:162-173,188`). Lo que sí se fijó fue la matriz de estados/superficies, la distinción `needs-tenant` ≠ `context-lost` y el control de `busy` en logout. |
| `D-critical-flows-3` | accept | `§5` #5/#7 (id propio: `id_usuario` del `200` vigente de login; `user.id_usuario` del contexto validado tras captura manual; nunca desde query/params; discrepancia de id o `T` → failure, `POST` bloqueado y reporte) · `§5` #7 (matriz de resultados del forzado: `POST 200` + contexto `200 flag false` desbloquea; `flag true` mantiene bloqueo; contexto `403` se clasifica por #4 **sin** GET aclaratorio recursivo; contexto red/429 no desbloquea; `POST 400` literal; `POST` incierto sin replay) · `§6` y `§7` | Sin límite. Sin `false` optimista, sin auto-`Replay`, sin clarificación de `OP-AUT-002` sobre sí misma. |
| `D-critical-flows-4` | accept | `§5` #6 (matriz de `select-unit`: en vuelo + segunda activación, `400`, `403` de pertenencia/asignación con literal exacto, `429`, red/timeout/abort incierto, `200` vigente, completion de generación anterior) · `§5` #6 (unidad previa conservada como dato histórico, sin afirmar rollback; reconsulta explícita `OP-AUT-002` con `T` y sin `U` anterior; adoptar el código retornado antes de refrescar) · `§7` (matriz de observables del `busy` y los rechazos) | Sin límite. Cero inferencia de rollback y cero `POST` automático. |
| `D-critical-flows-5` | partial | `§5` #7 (completion tardío descartado; cambio de etapa, cancelación y desmontaje invalidan y abortan; reentrada a `/recuperar` y reinicio explícito muestran paso 1 **sin** request; mismo detail genérico en pasos 1 y 2; `correo_censurado` se muestra tal cual **sólo si viene contratado**, sin inferir existencia por presencia/ausencia) · `§7` (matriz de lifecycle y feedback, y paso 4 con consumo esperado del servidor y sin replay) | **Parcial:** la parte genérica de la directiva —matriz de lifecycle, feedback uniforme en pasos 1/2 y reentrada sin request— **queda cumplida**. Lo que no se adopta es la sugerencia de **ocultar** ese campo: excede el contrato acreditado de la ficha F2 (evidencia: `experience/screens/access-context.md:63-69`; `flows/recovery-password.md:37-48`; `acceptance/session-access.md:47-50`; `recuperacion_utilidades.py:17,48-57,133-138`). El cuerpo no afirma anti-enumeración en servidor: sólo no deduce existencia por el campo. |

##### Directivas descartadas

`none` — cero directivas descartadas en el ciclo completo. Las nueve candidatas superaron los tres ejes de filtrado (dominio, scope y evidencia) antes de entrar al ledger y las nueve fueron dispositionadas.

##### Reviewers

Tabla **congelada**: reproduce el registro de la ronda única de la escritura 2 (`#### Reviewers`), sin recalcular stances ni conteos. Los stances son evaluación del reviewer sobre el plan completo dentro de su eje; no son disposiciones ni veredicto.

| Reviewer | Eje | Stance | Directivas |
|---|---|---|---:|
| `Dhampir-Slayer` | 1 · Seguridad y secretos | partial | 1 |
| `Portal-Warden` | 3 · Contrato de API | partial | 3 |
| `QA-Goblin` | 4 · Tests de flujos críticos | partial | 5 |

Los tres stances siguen en `partial` porque la ronda de `REVIEWING` está cerrada: la materialización del cuerpo `p2` no reevalúa a los reviewers y no habilita una segunda ronda. La normalización nominal de metadatos de `Portal-Warden` registrada en la escritura 2 (`payload_revision_in: p1`, `review_gate_revision_in: r1`) se conserva tal cual y no se reescribe.

##### Veredicto

Transcripción **literal** del `PLAN_REVIEW_VERDICT` entregado por el orquestador. No se deriva, no se corrige, no se reinterpreta; `implementation_authorized: no` es inmutable.

```text
PLAN_REVIEW_VERDICT
gate_id: prg-frontend-access-session-f2
plan_path: docs/specs/final-frontend/implementation-plan-access.md
payload_revision_final: p2
review_gate_revision_final: r2
verdict: VALIDATED
reviewers: Dhampir-Slayer:1seguridad:partial|Portal-Warden:3API:partial|QA-Goblin:4flujoscriticos:partial
directives_total: 9
accepted: 7
partial: 2
rejected_with_evidence: 0
unresolved: 0
discarded: 0
deferred_axes: none
unverified_axes: none
operator_decision_required: none
implementation_authorized: no
```

**Nota final del orquestador, transcrita literal:**

> VALIDATED únicamente el plan revisado, no permisos runtime/mutaciones/datos, no quality gates de implementación passed ni producto final. Ejecución original del frontend ordenada por el operador vive fuera de este ledger, no cambia `implementation_authorized` inmutable. No 4 escrituras consumidas: queda sin uso la escritura 4, sin uso automático.

**Alcance de `VALIDATED` en este archivo.** Cero `unresolved`, cero `blocking` abierto y ejes críticos `1`-`3` cubiertos cumplen el disparo de `VALIDATED` de [`~/.config/opencode/docs/plan-review-gate.md`](../../../../../.config/opencode/docs/plan-review-gate.md). Eso **no** significa: F2 implementado, scripts ejecutados, `quality_gates` de SDD superados, spec movida de `status`, producto integral cerrado ni observables de `§7` verificados. El gate es un contrato documental y no delega a `Code Transmuter`; la orden explícita del operador sigue siendo la única vía hacia la implementación.

##### Notas de integridad del ledger (escritura 3)

- **Presupuesto:** esta es la **escritura 3 de 4**. Queda **1** sin uso (escritura 4), que sólo correspondería a un `BARD_CORRECTION_2` con `payload_revision: p3` y `r3`. No se consume por inerte ni se usa de forma automática.
- **Cuerpo y ledger separados:** el cambio de cuerpo vive en `## Historial de revisiones > p2`; aquí sólo queda el evento del gate. Las dos secciones no se fusionan ni se anidan.
- **Append-only:** el checkpoint (escritura 1) y el feedback `r1` (escritura 2) se conservan literales, incluidas las columnas `pendiente` de la tabla de directivas de `r1` y el encabezado del ciclo con `veredicto PENDING`. La tabla de esta escritura es la que fija las disposiciones y el arbitraje.
- **Sin segunda ronda:** cero re-despacho de reviewers, cero eje nuevo, cero directivas nuevas. Las dos `partial` quedaron `resolved` con el límite acotado y su evidencia; no generan `unresolved` ni `operator_decision_required`.
- **Sin auditoría de dominio:** el arbitraje se limitó a contratos, scope, evidencia y coherencia. `stance` y `disposition` pertenecen a sus emisores.
- **Derivaciones de `p2`:** la nota de la cabecera, `§9` y `§10` se actualizaron al estado real del gate. No se reescribieron bloques previos del archivo: el texto de `p1` que decía «gate no despachado» permanece como antecedente literal en su entrada de historial y en la nota de consistencia documental del checkpoint.
- **Cero secretos:** toda la evidencia registrada es referencia `archivo:línea`, `PLAN_PATH:sección` o contrato del gate. Ningún valor sensible, id real ni cuerpo de request aparece en este archivo.
