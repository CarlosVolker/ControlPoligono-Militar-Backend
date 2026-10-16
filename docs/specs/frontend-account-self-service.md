---
status: in-progress
risk: [auth, sensitive-data]
updated: 2026-10-12
---

# Mi cuenta — superficie self-service del principal autenticado

> 🕯️ **Persistencia mecánica (`Lore Master`, 2026-10-12, TIER FAST).** Cuerpo transcrito del
> `plan_payload` final de `Cunning-Bard` (ítem 2, workstream `frontend-completion-plans`).
> Única normalización aplicada: localizadores de documentación convertidos a rutas relativas
> a este archivo (§1, §2, §5.4, §5.5) y las fases F1…F7 de §5.5 tabuladas con AC, ejecutor y
> dependencia. Sin cambio de alcance, sin tareas, objetivos, decisiones ni gates añadidos.
> **No autoriza implementar.** Escriba sobre `routes.ts` después del ítem 1 y sobre
> `DashboardTopbar.vue` antes del ítem 3 (write sets compartidos, orden 1→2→3). Specs hermanas:
> [`frontend-permission-navigation.md`](./frontend-permission-navigation.md),
> plan UX: [`../plans/frontend-ux-corrections.md`](../plans/frontend-ux-corrections.md),
> aceptación: [`frontend-integral-acceptance.md`](./frontend-integral-acceptance.md).

## Índice

1. [Problema y por qué](#1-problema-y-por-qué) · 2. [Fuera de alcance](#2-fuera-de-alcance) ·
3. [Criterios de aceptación](#3-criterios-de-aceptación-ears) · 4. [Diseño](#4-diseño) ·
5. [Tareas — plan operativo](#5-tareas--plan-operativo-8-secciones) ·
6. [Verificación](#6-verificación) · 7. [Notas/decisiones](#7-notasdecisiones)

---

## 1. Problema y por qué

No existe ruta de cuenta propia (`front/src/router/routes.ts:17-54,58-268`: sin `/cuenta` ni
`/perfil`). El cambio voluntario de contraseña propia es real
(`front/src/features/identity/api.ts:1212-1223` → `POST /usuarios/{id}/cambiar-contrasena/`,
control propio IA+TA en [`final-frontend/backend-inventory.md:175`](./final-frontend/backend-inventory.md))
pero sólo es alcanzable por UI dentro de la ficha administrativa `/personas/{id}`, cuya lectura
exige `view_personnel_basic`
([`final-frontend/backend-inventory.md:46-48`](./final-frontend/backend-inventory.md);
`IdentityView.vue:424-426,2110-2111,2309,2640-2646`): una cuenta sin ese permiso no alcanza su
propia contraseña. El menú de usuario ofrece «Mi ficha» administrativa y personalizador
(`DashboardTopbar.vue:220-239`). Además, la continuidad de sesión tras el cambio de contraseña
es hipótesis de integración abierta
([`../bugs/backend-debt.md`](../bugs/backend-debt.md) §6): la UX de éxito debe quedar alineada
al contrato real **comprobado**, sin afirmar que hoy esté rota. **Riesgo técnico:** hard
triggers #2 (autenticación/sesiones) y #4 (datos sensibles: contraseña, RUT). **Flags:**
`auth`, `sensitive-data`. **Revisor:** `Dhampir Slayer` (≠ ejecutor). **Tipo de trabajo:**
feature frontend (superficie self-service nueva sobre contrato vigente + UX condicional de
continuidad).

## 2. Fuera de alcance

Backend (preservación de sesión vía backend, bypass, endpoints nuevos); montaje de flujo
administrativo sobre permisos propios (resetear/desbloquear/contraseña de otro,
`PUT/PATCH /usuarios/{id}/` sobre la cuenta propia); edición de correo/nombre propios (no
existe endpoint: `/me/` sólo cubre OP-PRF-001/002 y OP-UNT-010,
[`final-frontend/backend-inventory.md:211-213`](./final-frontend/backend-inventory.md)); asumir
`GET/PATCH /me/profile`; persistencia local, mocks o fixtures; retirar «Mi ficha» o el modal
propio de `IdentityView` (deduplicación = decisión del operador fuera de este write set);
cambiar el **comportamiento** de recuperación/forzado/continuidad sin comprobación previa del
contrato real (la tarea condicional F7 cubre sólo la UX alineada a la respuesta observada);
visibilidad por permisos (spec hermana); microcopy/DS general (spec hermana, salvo el lenguaje
de la propia superficie de cuenta); matriz de aceptación (spec hermana); dependencias nuevas;
ejecución runtime de cambio de contraseña fuera de una autorización específica (bloque F7).

## 3. Criterios de aceptación (EARS)

- **AC-1** — WHEN un principal autenticado navega a `/cuenta`, THEN el sistema renderiza la
  superficie de cuenta con los datos propios del snapshot de contexto (id, RUT, estado de
  credencial, institución, membresía, unidad activa, asignaciones), sin exigir permisos
  administrativos.
- **AC-2** — WHEN no hay contexto consolidado, THEN el sistema muestra estado explícito con
  enlace a `/contexto`, sin fabricar datos ni emitir GET de prueba.
- **AC-3** — WHEN `must_change_password` es false y hay tenant activo, THEN el sistema ofrece el
  cambio voluntario (`old_password`+`new_password`+confirmación) con estados ST-05/06/07 y sin
  auto-reintento ante resultado incierto (reconciliación sin replay).
- **AC-4** — WHEN `must_change_password` es true, THEN el guard redirige a `/password-required`
  y `/cuenta` no bypasea el flujo forzado.
- **AC-5** — WHEN el snapshot no acredita `view_personnel_basic`, THEN nombre/correo se muestran
  como limitación registrada visible, sin botones falsos ni mocks; WHEN lo acredita, THEN puede
  presentarse lectura read-only de la ficha propia (OP-USR-003) y un 403 pinta ST-07 literal
  sin logout.
- **AC-6** — WHEN se abre el menú de usuario, THEN «Mi cuenta» es visible para todo principal y
  navega a `/cuenta`; «Mi ficha» conserva su destino y visibilidad actuales.
- **AC-7** — WHEN la superficie referencia la recuperación, THEN la presenta como flujo de
  acceso perdido no autenticado (`useRecovery.ts` vigente), sin ofrecer envío de código desde
  sesión autenticada.
- **AC-8** (condicional, tarea F7) — WHEN se comprueba el contrato real de sesión tras el cambio
  de contraseña propio con autorización específica, THEN la UX frontend queda alineada a la
  respuesta observada: sesión invalidada → retorno a login con aviso de éxito y secretos
  limpiados (sin auto-login ni conservación de la contraseña nueva); o sesión vigente →
  continuidad según lo observado; resultado incierto → reconciliación sin replay. No se afirma
  que hoy esté roto ni se cambia sin esa comprobación.
- **AC-9** — WHEN se evalúa escritura de perfil propio (correo/nombre), THEN queda registrada
  como capacidad ausente con AC bloqueado, no simulada.

## 4. Diseño

Ruta principal-only que reutiliza la clasificación existente (`requiresTenant:false`,
precedente `/personalizador` en `routes.ts:89-94`; rama del guard `guards.ts:143-158`): no
amplía bases, conserva deeplinks/return, no crea bucles; el forzado sigue gobernado por el
guard. Fuente de datos: exclusivamente el snapshot `AuthContext`
(`front/src/types/contexto.ts:56-64`) y endpoints ya consumidos por el cliente; el cambio
voluntario reutiliza `changeOwnPassword` exportado y los patrones de draft sensible/anti-carrera
del código vigente (`IdentityView.vue:1515`). Capacidad ausente o denegada = limitación visible +
AC bloqueado, nunca simulación (no se esconde la omisión para declarar completitud). La
continuidad condicional (F7/AC-8) se acota a código frontend mínimo
(`front/src/stores/session.ts`, `front/src/views/auth/*`, composables existentes) y se decide
por la **respuesta observada**, no por hipótesis: dos ramas (sesión invalidada / sesión
vigente) más reconciliación sin replay; sin preservación de sesión vía backend ni bypass.
Trade-off: `/cuenta` principal-only con degradación elegante sin contexto (elegida: sin
bucles, precedente del personalizador) frente a `requiresTenant:true` (datos siempre completos
pero exige unidad activa y castiga al principal recién autenticado). Sin código en esta
sección.

## 5. Tareas — plan operativo (8 secciones)

**5.1 Objetivo** — Superficie de cuenta autocentrada con datos reales y contraseña voluntaria
para todo principal, más UX de continuidad condicionada al contrato comprobado.

**5.2 Scope** — Ruta `/cuenta` + `AccountView` (secciones de snapshot, cambio voluntario,
limitaciones registradas, punteros coherentes); menuitem «Mi cuenta» en topbar; tests focales
(sujetos a autorización de ejecución); tarea condicional F7 (continuidad según AC-8); documentación de la
nueva SCREEN/fila de menú vía `Lore Master` con trazabilidad, sin migrar la spec antigua.

**5.3 Fuera de scope** — §2 de esta spec (fuente única).

**5.4 Archivos probables** — `front/src/router/routes.ts` (+1 registro); nueva
`front/src/views/account/AccountView.vue` (carpeta la confirma el writer contra la fuente
existente); nuevo composable `front/src/features/account/` (reutiliza la API exportada y el
session store; no duplica cliente HTTP); `front/src/components/DashboardTopbar.vue` (menuitem);
`front/src/types/` (`ROUTE_NAMES`); `front/tests/focused/account-*.test.ts`; F7 (sólo tras
comprobación autorizada): mínimos en `front/src/stores/session.ts`,
`front/src/views/auth/*` y `front/src/composables/auth/*` según la evidencia observada.

**5.5 Pasos / fases** —

| Fase | Contenido | Depende | Ejecutor | AC que ampara |
|---|---|---|---|---|
| F1 | Lectura de contrato: mapa dato-propio→fuente real — `api/auth.ts` (contexto/logout), `features/identity/api.ts:1196-1247` (sólo el cambio propio entra en scope), `stores/session.ts` (identity/context/tenant/flags), `guards.ts:143-158`, `DashboardTopbar.vue:177-263`, `useRecovery.ts`. Producto: fuentes reales y lista de capacidades ausentes. Lectura de contratos, **no** auditoría de calidad. | — | `Code Transmuter` | AC-1, AC-9 |
| F2 | Ruta + guard: `/cuenta` con `requiresTenant:false`; comprobar por lectura que la rama principal existente basta (identidad, forzado, return); ajuste mínimo sin ampliar bases; sin bucles. | F1 | `Code Transmuter` | AC-1, AC-4 |
| F3 | AccountView: secciones de identidad (id/RUT/estado de credencial, `—` ante falta real); institución/membresía/unidad/asignaciones desde el contexto, con estado explícito + enlace `/contexto` si no hay contexto; cambio voluntario (disponibilidad por `identity && flag false && tenantCode`; ST-05/06/07; incierto sin replay; saneamiento de drafts sensibles); enlace al personalizador; limitación `view_personnel_basic` visible (con lectura read-only de la ficha propia sólo si el snapshot lo acredita; 403 → ST-07 literal); punteros coherentes (recuperación = flujo no autenticado; logout = acción existente; forzado = guard). RUT en pantalla, nunca en logs/tests/artefactos. | F2 | `Code Transmuter` | AC-1, AC-2, AC-3, AC-5, AC-7, AC-9 |
| F4 | Menú: «Mi cuenta» para todo principal; «Mi ficha» intacta. | F2 | `Code Transmuter` | AC-6 |
| F5 | Tests/checks: vitest focal (disponibilidad del cambio voluntario, incierto sin replay, 403 sin logout, limitación sin permiso) + `pnpm typecheck`. **Prerrequisito de skills de testing: satisfecho** por orden del operador (2026-10-12), que añadió `vitest` y `vue-testing-best-practices` a la allowlist de `Code Transmuter` conservando `deny '*'` (`~/.config/opencode/agents/Code-Transmuter.md:47-82`); F5 deja de estar **BLOCKED (prerrequisito)** y F2-F4 nunca dependieron de él. La configuración no es evidencia: la suite focal y `pnpm typecheck` siguen exigiendo la autorización de ejecución del operador. El ejecutor no cambia configuración global por iniciativa ni se sustituye writer. | F3, F4 | `Code Transmuter` | AC-3, AC-5 |
| F6 | Documentación: alta de la nueva SCREEN + fila de menú con trazabilidad propia y limitaciones registradas; sin migrar ni reemplazar la spec multi-archivo existente. | F3 | `Lore Master` | — (trazabilidad documental) |
| F7 | **CONDICIONAL** — Continuidad tras cambio de contraseña: comprobar la respuesta observada del cambio propio (¿invalida sesión?, ¿la conserva?) y sólo entonces alinear la UX según AC-8: sesión invalidada → retorno a login con aviso de éxito y secretos limpiados, sin auto-login y sin conservar la contraseña nueva; sesión vigente → continuidad según lo observado; incierto → reconciliar sin replay. Acotado a código frontend mínimo requerido por la evidencia; sin preservación de sesión vía backend ni bypass. **Sin autorización: F7 permanece `NOT_EXERCISED`**, la deuda §6 ([`../bugs/backend-debt.md`](../bugs/backend-debt.md)) sigue abierta y el comportamiento actual no se toca (no se afirma roto). | autorización específica futura para comprobar el contrato real sobre dataset objetivo | `Code Transmuter`, sólo dentro del bloque autorizado | AC-8 |

**5.6 Riesgos** — Datos sensibles en pantalla (RUT/estado de credencial): mostrar, no registrar
ni persistir; cero valores en artefactos. Deuda §6 (hipótesis no comprobada): F7 alinea sólo
con contrato comprobado, nunca por anticipado. Deuda §1 (overrides): divergencia posible en la
sección AC-5 → ST-07 literal / limitación registrada; exactitud BLOCKED_BACKEND. Ausencia de
nombre/correo leída como incompletitud → limitación visible + AC-9, sin esconder. Scope creep
administrativo → write set excluye resetear/desbloquear/otro-usuario; `Dhampir Slayer` lo
verifica. Write set compartido → secuencial: `routes.ts` tras ítem 1; `DashboardTopbar.vue`
antes que ítem 3. Prerrequisito de skills de testing → resuelto por orden del operador
(2026-10-12); queda la autorización de ejecución de la suite de F5, declarada honestamente.

**5.7 Verificaciones** — F1 → lectura (mapa dato→fuente). F2-F4 → diff + `pnpm typecheck`. F5 →
suite focal con salida real si está autorizada (una autorización, no confirmación por paso). F7 →
sólo dentro del bloque de autorización (destino/dataset definidos); evidencia = respuesta
observada del contrato, no inferencia; sin autorización, AC-8 queda `NOT_VERIFIED` con la
confirmación mínima que falta (no cuenta como PASS ni como fallo). No se ejecuta cambio de
contraseña en runtime fuera del bloque (operación sensible). Gates por evidencia: `tests`;
`security_review` (`Dhampir Slayer` post-implementación); `code_review` (`Hellknight Inspector`
base + `Codex-Of-Botched-Runes` complementario para salida de IA, y
`inume-css-html-anti-patterns` si se revisa markup; nunca Codex aislado); `documentation`
(`Lore Master`). Entrega ≠ verificación; veredicto del orquestador. Revisores indicados, no
invocados en este plan.

**5.8 Handoff para Code Transmuter** — Implementar F1→F5 en orden; F6 vía `Lore Master`; F7 sólo
con la autorización específica citada en la delegación. Skills allowed (allowlist vigente):
`vue`, `vue-best-practices`, `vue-router-best-practices`, `typescript`, `pinia`,
`inume-css-html-anti-patterns` (siempre en templates/CSS), `vitest`,
`vue-testing-best-practices` (suite focal de F5), `pnpm` (comandos). Límites
duros: sólo endpoints del contrato vigente (contexto, cambio propio, lectura propia OP-USR-003
si acreditada); no añadir campos/métodos a las requests; no exigir permisos administrativos al
usuario propio; cero mocks/persistencia local; secretos fuera de logs/tests/artefactos
(`<REDACTED>`); `—` ante falta real; capacidad ausente = limitación visible, nunca botón falso;
no alterar comportamiento de Recovery/PasswordRequired (sólo enlaces; lo condicional es F7 con
autorización). Cerrar `DELIVERED|BLOCKED|FAILED` con rutas y salida real.

## 6. Verificación

§5.7 (fuente única). Cierre de F7: respuesta observada del contrato en el dataset objetivo
dentro del bloque autorizado; sin ella, AC-8 `NOT_VERIFIED` con motivo.

> 🕯️ **Estado de ejecución (2026-10-12).** Estado `in-progress`. Esta spec pasó de `approved`
> a `in-progress` al iniciarse su implementación: el operador ordenó ejecutar los cuatro
> planes persistidos y el escritor `Code Transmuter` la trabajó **secuencialmente** en la
> misma sesión que entregó la spec hermana de visibilidad/permisos
> (`ses_code-transmuter-1791804695`). **F6 documental cerrada en esta fecha**: la superficie
> tiene identificadores y anclas registrados abajo. **La spec no está cerrada.**

**Entrega observada (2026-10-12, lectura por el orquestador):**

| Superficie | Ancla | Observado |
|---|---|---|
| Ruta + guard | `front/src/router/routes.ts:132-136` | `/cuenta` con `requiresTenant:false`; reutiliza la rama existente de identidad, contraseña forzada y retorno, sin bases nuevas |
| Entrada de menú | `front/src/components/DashboardTopbar.vue:221-233` | «Mi cuenta» como primer ítem del desplegable de perfil; «Mi ficha» conserva destino y visibilidad |
| Composable | `front/src/features/account/useOwnAccount.ts:80-344` | Estado efímero, control anti-carrera, lecturas propias condicionadas por permiso, cambio de contraseña contra el contrato |
| Vista | `front/src/views/account/AccountView.vue` | Datos de contexto reales, ficha acreditada, limitaciones declaradas, cambio de contraseña y limpieza de credenciales |
| Tests | `front/tests/focused/account-navigation.test.ts`, `account-surface.test.ts` | Incluidos en el conjunto focal |

**Trazabilidad F6 (decisión del orquestador, 2026-10-12).** `SCREEN-ACCOUNT-001` identifica
esta superficie nueva, con los AC-1…AC-9 de §3 de esta spec —sin renumerar ni migrar los
criterios históricos del corpus `final-frontend/`. Registro completo, con fila de acceso y
enlaces a `final-frontend/evidence/2026-10-12/account-ux-delivery.md`.

**Comprobaciones (2026-10-12).** Ejecutadas por el orquestador desde `front/`: `pnpm
typecheck` exit 0; `pnpm test:focused` exit 0, **12 archivos / 211 pruebas** (conjunto
transversal vigente, **no** se suma a las 187 del plan 1); `pnpm build` exit 0 con build
generado. Servicios activos y ya autorizados: frontend `localhost:5175` responde `200`;
backend `403` en `auth/context` sin sesión. **Esto no demuestra el flujo de API por actor.**

**F7 / AC-8 — cerrado en su rama, veredicto del orquestador (2026-10-12).**
Escenario A8 por UI de producto, con la **misma credencial original** reaplicada (nunca una
temporal): login **200** → «Mi cuenta» → `POST /api/usuarios/{id}/cambiar-contrasena/` **200**
→ ruta inmediatamente posterior **`/login`**, con **aviso de éxito** y `detail` literal del
backend visibles, formulario de cuenta y menú protegido **retirados**, inputs de login vacíos,
**1** request de cambio de contraseña y **1** request de login antes del reintento manual (sin
autologin), y **re-login manual con la credencial original 200** con acceso a la raíz confirmado.
Checks tras el fix: `typecheck` exit 0 · `test:focused` **12 archivos / 211 pruebas** · `build`
exit 0; fix en `front/src/features/account/useOwnAccount.ts:195-233` y
`front/src/views/auth/LoginView.vue:23-25`.

**`VERIFIED` del orquestador para F7/AC-8, rama de sesión invalidada, en este caso A8
observado.** No es certificación integral: el global sigue `NOT_VERIFIED` / `NO_CUMPLIDO` y esta
spec sigue `in-progress` porque los AC obligatorios restantes siguen abiertos. La corrección ya
está **terminada**: no queda trabajo de este fix en ejecución. **NO_MUTATION no se afirma** —el
hash pudo cambiar— y el **roundtrip con contraseña temporal queda `NOT_EXERCISED`**: no se
afirma en ningún documento.

**Evidencia de cierre y límites.** [`final-frontend/evidence/2026-10-12/runtime-observations.md`](./final-frontend/evidence/2026-10-12/runtime-observations.md)
§5 y bloque `observations` de
[`acceptance-matrix.json`](./final-frontend/evidence/2026-10-12/acceptance-matrix.json)
(`.f7_after_fix`, `.recovery_initial_surface`), que guarda copia durable de la evidencia.
La **superficie inicial** de `/recuperar` quedó observada (`rut` requerido, **0** requests de
escritura al enviar vacío, 390 × 844 sin desbordamiento): es **sólo esa superficie**, sin
código, verificación ni reseteo, y sin servicio de correo invocado.

**AC-9 y gates.** La escritura de perfil propio sigue ausente en backend y queda declarada
como limitación visible, sin ocultarla ni simularla; el perfil propio editable **no se
inventó**. **Ningún gate de revisor pasó** (el operador revocó nuevas auditorías); los
comandos en verde no son gate superado. Sin secretos, RUT real ni valores de credenciales en
los artefactos.

## 7. Notas/decisiones

- Capacidades ausentes (escritura de perfil propio) permanecen bloqueadas/registradas con
  honestidad: no se esconden omisiones para declarar completitud.
- Convivencia «Mi cuenta»+«Mi ficha» y deduplicación del modal en `IdentityView`: decisiones
  del operador fuera de este write set; el plan las conserva a ambas.
- Decisiones técnicas propuestas (la aprobación las ratifica): ruta principal-only con
  degradación; lenguaje de la superficie de cuenta en español neutro (la fidelidad estructural
  1:1 y las traducciones reportadas rigen por la spec UX hermana).
- Cero secretos: valores de credenciales, nombres de variables sensibles, RUT reales y sesiones
  no aparecen en spec, plan, tests ni reportes.
- La aprobación antigua de alcance (2026-10-02) no aprobó esta spec; aprobada y con ejecución
  ordenada por el operador el 2026-10-12, y con ejecución efectivamente iniciada ese mismo
  día (de ahí `in-progress`); en general aprobar no equivale a ejecutar, y aquí la orden de
  ejecución llegó por separado.
- 🕯️ Identificadores de trazabilidad asignados el 2026-10-12 (`SCREEN-ACCOUNT-001` + AC-1…9
  de §3). Persisten los límites: sin cierre de F7/AC-8, sin gate de revisor, sin estado
  `done`.