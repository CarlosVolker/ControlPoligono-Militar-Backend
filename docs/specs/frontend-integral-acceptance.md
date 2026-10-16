---
status: in-progress
risk: [auth, permissions, sensitive-data, filesystem]
updated: 2026-10-12
---

# Aceptación funcional integral — matriz por capacidad real con evidencia por celda

> 🕯️ **Persistencia mecánica (`Lore Master`, 2026-10-12, TIER FAST).** Cuerpo transcrito del
> `plan_payload` final de `Cunning-Bard` (ítem 4, workstream `frontend-completion-plans`).
> Única normalización aplicada: localizadores de documentación convertidos a rutas relativas
> a este archivo (§1, §2, §5.4, §5.5) y las fases F0…F6 de §5.5 tabuladas con AC, ejecutor y
> dependencia. Sin cambio de alcance, sin tareas, objetivos, decisiones ni gates añadidos.
> **No autoriza implementar ni ejecutar.** F1 y F2 son adelantables por lectura; las fases
> runtime (F4) exigen su bloque de autorización. Specs hermanas:
> [`frontend-permission-navigation.md`](./frontend-permission-navigation.md),
> [`frontend-account-self-service.md`](./frontend-account-self-service.md), plan UX:
> [`../plans/frontend-ux-corrections.md`](../plans/frontend-ux-corrections.md).

## Índice

1. [Problema y por qué](#1-problema-y-por-qué) · 2. [Fuera de alcance](#2-fuera-de-alcance) ·
3. [Criterios de aceptación](#3-criterios-de-aceptación-ears) · 4. [Diseño](#4-diseño) ·
5. [Tareas — plan operativo](#5-tareas--plan-operativo-8-secciones) ·
6. [Verificación](#6-verificación) · 7. [Notas/decisiones](#7-notasdecisiones)

---

## 1. Problema y por qué

El único resultado runtime aceptado es 33/36 pantallas renderizadas
([`final-frontend/runtime-verification-2026-10-06.md:26-28`](./final-frontend/runtime-verification-2026-10-06.md));
el conteo de completitud fue rechazado y la verificación integral sigue `NOT_VERIFIED`
(`:8-10`), con flujos/DS/aislamiento no observados (`:64-77`). Los denominadores históricos son
**universos distintos, no intercambiables**: 131 AC en
[`final-frontend/verification.md`](./final-frontend/verification.md) (99 de flujo + 32
transversales) frente a 175 criterios en
[`final-frontend/acceptance/coverage.md`](./final-frontend/acceptance/coverage.md) (162 AC-OP +
8 AC-FL + 5 AC-CORE); [`final-frontend/experience/screens.md`](./final-frontend/experience/screens.md)
declara 36 pantallas y el conteo de filas `SCREEN-` da 37. 162 OP / 99 FL / 36 SCREEN son
**baseline histórico**: el conjunto efectivo vigente se verifica contra el registro y el código
actuales antes de usarse como denominador (si el manifest cambió, el total efectivo es el
vigente, no 162 congelado). Sin reconciliación ni matriz por operación, todo porcentaje es
contabilidad vieja. Por qué ahora: las specs hermanas llevan el frontend a un estado
implementable entregado; la aceptación integral responde «¿100 % funcional?» con evidencia por
celda. **Riesgo técnico:** hard triggers #2 (autenticación/sesiones), #3 (roles/permisos/
autorización) y #4 (datos sensibles: credenciales/RUT/sesiones); flag `filesystem` (tests y
artefactos de evidencia nuevos — flag, no hard trigger). **Revisor:** `Dhampir Slayer` (por
flags de seguridad; ≠ ejecutor). **Tipo de trabajo:** verificación/aceptación integral (tests
dirigidos + artefactos de evidencia).

## 2. Fuera de alcance

Arreglos de frontend o backend (la matriz observa; los fixes viven en sus specs); migrar/
reemplazar/editar por iniciativa la spec multi-archivo existente (se referencia por IDs
canónicos); crear usuarios/roles/tenants/fixtures backend o modificar los roles de las cuentas
dev; operaciones fuera del bloque de autorización vigente (destructivas, correo/recuperación,
cambios de contraseña, reseteos, bajas); `force_login`/cookies manuales/mocks como vía de
certificación; inferir `PUT` desde `PATCH`; contar `BLOCKED_BACKEND` o ningún blocker como
PASS; porcentajes con denominadores viejos o igualdades forzadas entre universos distintos
(37=36); navegador o reutilización de servicios sin orden y destinos confirmados; incluir
valores de credenciales, nombres de variables sensibles, RUT reales o sesiones en plan o
artefactos; instalar/configurar Playwright como dependencia sin decisión del operador
(dependency-change); **esperar un certificado 100 % de las specs hermanas para avanzar** (la
dependencia real es su implementación entregada + evidencia de sus AC ejecutables; ver §5.5).

## 3. Criterios de aceptación (EARS)

- **AC-1** — WHEN la reconciliación cierra, THEN existe tabla de universos distintos (OP/FL/
  SCREEN/AC/R) con su relación explícita y la regla adoptada, sin forzar igualdad entre ellos
  ni usar denominadores de etapas viejas; el conjunto efectivo vigente verificado —no
  162/99/36 congelados— es el denominador de la matriz.
- **AC-2** — WHEN la matriz se construye, THEN cubre las OP efectivas verificadas con fila por
  método (PUT no inferida de PATCH), actor/rol por alias, ancla UI `archivo:línea` (o
  ANCHOR-PENDING con actualización localizada mientras el front de las hermanas se entrega),
  punteros canónicos (AC-OP/FL/SCREEN/R), estado esperado (ST + status contractual) y
  prerrequisito de datos legítimo; la ruta `/cuenta` (spec hermana 2) suma su propia
  SCREEN/AC con trazabilidad, sin migrar la spec antigua.
- **AC-3** — WHEN una celda carece de actor o dataset aprobado, THEN queda `NOT_EXERCISED`/
  `NOT_VERIFIED` y no se crean cuentas, roles, tenants ni fixtures para llenarla, ni se
  modifican los roles de las cuentas dev.
- **AC-4** — WHEN una operación falla por deuda backend registrada, THEN la celda queda
  `BLOCKED_BACKEND` con ancla a [`../bugs/backend-debt.md`](../bugs/backend-debt.md) y no cuenta
  como PASS; los AC bloqueados de las specs hermanas no detienen la matriz ni el diagnóstico:
  entran marcados.
- **AC-5** — WHEN se ejecuta una fase runtime, THEN media un bloque de autorización operativa
  previo (destinos confirmados, dataset, actores y acciones —puede cubrir cambios de
  contraseña/destructivas/correo dentro del bloque—), con login real por UI y cookies/sesiones
  aisladas por actor; dentro del bloque no se re-pregunta cada paso; fuera del bloque, nueva
  autorización. Sin force_login, cookies manuales ni mocks para certificación.
- **AC-6** — WHEN una lectura devuelve 200 con conjunto vacío por prerrequisito legítimo
  ausente, THEN se registra el prerrequisito, no se fabrican datos y no se marca bug
  automático.
- **AC-7** — WHEN la evidencia se produce, THEN el ejecutor (`Code Transmuter`) reporta
  resultados por celda con anclas y salidas reales, `Lore Master` persiste, y el
  **orquestador** decide `VERIFIED/REJECTED/NOT_VERIFIED` y la conclusión de producto; el
  ejecutor no emite veredictos.
- **AC-8** — WHEN se evalúa el cierre global, THEN «100 % funcional» sólo procede si ninguna
  operación/AC obligatorio está pendiente o bloqueado y scopes, aislamiento (unidad/tenant/
  preferencias A→B) y DS están observados con los gates superados; si la deuda backend impide,
  el objetivo global se declara `NO_CUMPLIDO`/`NOT_VERIFIED` aunque el frontend implementable
  esté terminado, y «100 % frontend implementable» se reporta como métrica distinta, nunca
  sustituta.
- **AC-9** — WHEN se persisten artefactos, THEN no contienen valores de credenciales, nombres
  de variables sensibles, RUT reales ni sesiones (`<REDACTED>` donde corresponda).

## 4. Diseño

Matriz antes que ejecución: cada celda nace con ancla (código + criterio) y prerrequisito, y
sólo cambia de estado por evidencia real de la fase autorizada. `ANCHOR-PENDING` permite
adelantar la matriz base por lectura mientras las hermanas se entregan, con actualización
localizada de anclas tras sus cambios de front (no se replantea todo por cada cambio). La
dependencia de las hermanas es «implementación entregada y evidencia de sus AC **ejecutables**
disponible» —no su cierre ni un certificado 100 %—: celdas con AC bloqueados por backend o
decisiones pendientes entran a la matriz marcadas y el diagnóstico continúa (sin deadlock).
Fases con **bloque** de autorización, no confirmación por clic: un bloque define destinos/
dataset/actores/acciones y no se re-pregunta dentro de él. Vocabulario cerrado por celda
(`OBSERVED_OK/PARTIAL/BLOCKED_BACKEND/NOT_EXERCISED/NOT_VERIFIED`); ningún blocker cuenta como
PASS. Roles sin confusión: ejecutor ejecuta y reporta evidencia; `Lore Master` persiste;
orquestador verifica y concluye. Reconciliación de universos distintos con relación explícita
(131 vs 175 AC son cortes diferentes del mismo registro; 36 vs 37 filas se resuelve por lectura
de filas), sin forzar igualdad. Trade-off: matriz adelantada con anclas pendientes (elegida: no
bloquea el diagnóstico) frente a matriz sólo tras cierre de hermanas (la habría dejado esperando
un certificado que puede no llegar por deuda backend). Sin código en esta sección.

## 5. Tareas — plan operativo (8 secciones)

**5.1 Objetivo** — Responder «¿está el producto 100 % funcional?» con una matriz de evidencia
por capacidad real, cierre honesto y métricas separadas (producto funcional vs frontend
implementable).

**5.2 Scope** — Reconciliación de universos (documental); matriz estática por OP efectiva con
anclas/actores/estados/prerrequisitos; tests dirigidos y checks estáticos autorizados;
certificación runtime por UI + requests reales dentro de bloques de autorización; reporte por
celda (ejecutor), persistencia (Lore Master), veredicto y conclusión (orquestador); evidencia
fechada sin secretos.

**5.3 Fuera de scope** — §2 de esta spec (fuente única).

**5.4 Archivos probables** — Nuevos: artefacto de matriz + reconciliación (los persiste `Lore
Master`; ubicación según `docs/plan-flow.md` y la estructura existente; no se declara ruta
aquí); `front/tests/focused/*.test.ts` (tests dirigidos); evidencia fechada en el patrón
existente (`docs/specs/final-frontend/evidence/<fecha>/`). Lectura sin edición:
[`final-frontend/backend-inventory.md`](./final-frontend/backend-inventory.md),
[`final-frontend/coverage/operations.md`](./final-frontend/coverage/operations.md),
`final-frontend/experience/{flows,screens,states,navigation}.md`,
[`final-frontend/verification.md`](./final-frontend/verification.md),
`final-frontend/acceptance/*`, `final-frontend/requirements/*`, `final-frontend/tasks*`,
[`final-frontend/runtime-verification-2026-10-06.md`](./final-frontend/runtime-verification-2026-10-06.md),
[`../bugs/backend-debt.md`](../bugs/backend-debt.md) y el front vigente.

**5.5 Pasos / fases** —

| Fase | Contenido | Depende | Ejecutor | AC que ampara |
|---|---|---|---|---|
| F0 | **Bloques de autorización.** Un bloque operativo por fase runtime define: destinos confirmados en el momento (backend reportado en `127.0.0.1:8000` —estado reportado, no verificado—; frontend `pnpm dev` en puerto confirmado; reutilizar servicios sin reiniciar sólo con orden), dataset real de desarrollo aprobado, actores (las 8 cuentas dev existentes, por alias de rol/unidad; credenciales en el archivo privado local no-Git `.cache/development-role-accounts/credentials.json` —nunca se transcriben valores, nombres de variables, RUT ni sesiones) y acciones sensibles incluidas (cambios de contraseña/destructivas/correo). Dentro del bloque no se re-pregunta cada paso; fuera, nueva autorización. Sin actor/caso para una celda → `NOT_EXERCISED` (no se crean cuentas/roles/tenants/fixtures ni se modifican roles de las cuentas dev). | — | decisión del orquestador/operador | AC-5, AC-3 |
| F1 | **Reconciliación (adelantable; no espera a las hermanas).** Conteo verificado por lectura de filas contra el registro vigente: OP efectivas (baseline histórico 162 en [`final-frontend/backend-inventory.md`](./final-frontend/backend-inventory.md) §Universo contado y [`final-frontend/coverage/operations.md:255`](./final-frontend/coverage/operations.md); si el manifest cambió, el denominador es el vigente verificado), 99 FL (`final-frontend/experience/flows.md`), SCREEN (36 declaradas vs 37 filas: se resuelve por lectura de filas, sin forzar 37=36), AC 131 (`final-frontend/verification.md` §5-6) vs 175 (`final-frontend/acceptance/coverage.md`) como cortes distintos con relación explícita, 140 R; la nueva `/cuenta` suma su propia SCREEN/AC con trazabilidad, sin migrar la spec antigua. Producto: tabla de universos reconciliados + regla adoptada. Ningún porcentaje antes de F1. | — | `Lore Master` | AC-1 |
| F2 | **Matriz base (adelantable por lectura** con `ANCHOR-PENDING` mientras las hermanas se entregan**).** Fila por OP efectiva × método × actor/rol (alias) × estado esperado (ST + status) × prerrequisito de datos × punteros canónicos; actualización localizada de anclas tras los cambios de front de las hermanas (no se replantea todo). Reglas de construcción: PUT ≠ inferido de PATCH; ruta rendered ≠ FL completo; `DELETE /poligonos/{id}/` = fila de contrato restringido ([`final-frontend/coverage/operations.md:50`](./final-frontend/coverage/operations.md), R-DOM-SHT-003 en [`final-frontend/requirements/shooting.md:17`](./final-frontend/requirements/shooting.md)) con esperado «no ofrecida como disponible»; capacidades sin endpoint (D-02) = filas de ausencia reportada, no simulada; reservas históricas (B-01; TD captura tiradores vacíos; TD calibre `IntegrityError`; TD overrides serializer — `runtime-verification-2026-10-06.md:52-54,65`) = filas sin estado supuesto (ni reprobadas ni resueltas por inferencia). Dependencia de hermanas: implementación entregada + evidencia de AC ejecutables; sus AC bloqueados/pendientes se marcan y no detienen. | F1 | `Code Transmuter` (anclas), persistencia `Lore Master` | AC-2, AC-4, AC-6 |
| F3 | **Tests/checks (ejecución autorizada).** Ampliación de `front/tests/focused/` donde las hermanas dejen AC ejecutables sin cobertura; `pnpm test:focused`, `pnpm typecheck`, `pnpm build` con salida real. **Prerrequisito de skills de testing: satisfecho** por orden del operador (2026-10-12), que añadió `vitest` y `vue-testing-best-practices` a la allowlist de `Code Transmuter` conservando `deny '*'` (`~/.config/opencode/agents/Code-Transmuter.md:47-82`); las tareas de tests dejan de estar **BLOCKED (prerrequisito)** y conservan el resto de las condiciones de F3 (ejecución autorizada, bloque F0 donde aplique, salida real en los comandos). Playwright: el ejecutor sí puede cargar la skill (está en su allowlist) para **diseño** de harness (Page Objects, selectores por rol/label, estructura `tests/`); instalar `@playwright/test` es dependency-change = decisión del operador; abrir navegador sólo dentro del bloque F4. | F2 | `Code Transmuter` | — (checks de apoyo; sin AC propia) |
| F4 | **Certificación runtime.** Producto por UI real + requests reales: login real por actor vía UI del producto; cookies/sesiones aisladas por actor (contextos de navegador separados; misma cuenta usada por actores distintos sólo con contexto de unidad/tenant legítimo y sesiones aisladas); celdas específicas de aislamiento (unidad/tenant/preferencias A→B, pendiente histórico en `runtime-verification-2026-10-06.md:76-77`); 200 vacío = prerrequisito legítimo registrado (no se fabrican datos); 403/500 por deuda registrada → `BLOCKED_BACKEND` con ancla; operaciones sensibles/destructivas/correo/contraseña sólo dentro del bloque que las incluya (instalar el harness no autoriza configurar/invocar). | F3 + bloque F0 | `Code Transmuter`, sólo dentro del bloque autorizado | AC-5, AC-6, AC-3 |
| F5 | **Reporte por celda y evidencia.** Reportes fechados con anclas y salidas reales; vocabulario por celda (`OBSERVED_OK/PARTIAL/BLOCKED_BACKEND/NOT_EXERCISED/NOT_VERIFIED`); sin secretos/RUT/sesiones/credenciales (AC-9). El ejecutor **no** emite veredictos de aceptación ni conclusiones de producto. | F4 | ejecuta `Code Transmuter`, persiste `Lore Master` | AC-7, AC-9 |
| F6 | **Veredicto y cierre.** `VERIFIED/REJECTED/NOT_VERIFIED` por fase y conclusión global según AC-8, con las dos métricas separadas («100 % frontend implementable» nunca sustituye a «100 % funcional»); si la deuda impide celdas obligatorias → global `NO_CUMPLIDO`/`NOT_VERIFIED` con la confirmación mínima que falta. | F5 | **orquestador** (apoyo documental: `Lore Master`) | AC-8 |

**5.6 Riesgos** — Denominadores en conflicto (131 vs 175; 36 vs 37): sin F1 todo porcentaje es
falso → prerrequisito duro. Movimiento del front de las hermanas invalida anclas →
`ANCHOR-PENDING` + actualización localizada. Dataset sensible: cualquier exceso (crear cuentas,
tocar roles, destructivos fuera de bloque, filtrar credenciales) viola política no negociable →
bloques explícitos, alias y artefactos sin secretos. Reservas históricas con estado supuesto →
prohibido: filas sin estado inicial supuesto. Destinos runtime reportados no verificados →
confirmación en el momento del bloque. Contaminación cruzada de sesiones/preferencias →
cookies aisladas por actor + celdas A→B. Flag `filesystem` (artefactos nuevos) → rutas
controladas, ninguna escritura destructiva. Prerrequisito de skills de testing → resuelto por
orden del operador (2026-10-12); F3 conserva su autorización de ejecución y no habilita por sí
mismo otro writer. Deadlock por esperar cierre de hermanas → eliminado: la dependencia es evidencia de AC
ejecutables, no certificado.

**5.7 Verificaciones** — Esta spec **es** el marco de verificación: cada fase produce evidencia
con salida real (conteos reconciliados, matriz con anclas, salida de comandos, reportes
fechados). Gates por evidencia: `tests` (F3); `security_review` (`Dhampir Slayer`
post-implementación: credenciales/RUT, celdas auth/permisos, bloques runtime); `code_review`
(`Hellknight Inspector` base + `Codex-Of-Botched-Runes` complementario para la salida de IA del
ejecutor, más `inume-css-html-anti-patterns` si se revisa markup; nunca Codex aislado);
`documentation` (`Lore Master`). Veredictos y conclusión de producto corresponden sólo al
orquestador; sin autorización de navegador/servicios, las celdas runtime permanecen
`NOT_VERIFIED` con la confirmación mínima que falta. Ningún revisor se invoca en este plan.

**5.8 Handoff para Code Transmuter / Lore Master (orquestados)** — Ejecutores: `Code
Transmuter` (anclas de F2, F3, ejecución F4, reporte F5) y `Lore Master` (F1, persistencia de
F2/F5, apoyo documental de F6) — mediación del orquestador, sin delegación entre subagentes.
Skills allowed para Code (allowlist vigente): `vue`, `vue-best-practices`,
`vue-router-best-practices`, `typescript`, `pinia`, `inume-css-html-anti-patterns`,
`playwright` (diseño de harness; navegador sólo dentro del bloque F4), `vitest`,
`vue-testing-best-practices` (habilitados por orden del operador del 2026-10-12; habilitar más
config por iniciativa ni sustituir writer sigue vedado), `pnpm` (comandos). Orden F0→F6;
cada fase runtime cita su bloque en la delegación. Límites duros: no crear cuentas/roles/
tenants/fixtures ni modificar roles de las cuentas dev; nada destructivo/correo/contraseña fuera
de bloque; sin force_login/cookies manuales/mocks para certificación; PUT ≠ PATCH; no
transcribir credenciales (archivo privado; alias por rol/unidad); 200 vacío = prerrequisito
registrado; `BLOCKED_BACKEND ≠ PASS`; no editar la spec existente ni
[`../bugs/backend-debt.md`](../bugs/backend-debt.md); el ejecutor entrega
`DELIVERED|BLOCKED|FAILED` + evidencia, nunca veredictos.

## 6. Verificación

§5.7 (fuente única). Ningún cambio de estado de celda sin evidencia; el cierre por fase y el
global los emite el orquestador según AC-7/AC-8. Esta spec no garantiza 100 %: define cómo se
prueba y cómo se declara honestamente cuando la deuda backend lo impide.

> 🕯️ **F1 ejecutada — sólo la parte documental (2026-10-12).** Conteo por lectura de filas,
> sin ejecutar nada y sin emitir porcentajes:
> [`final-frontend/evidence/2026-10-12/acceptance-universes.md`](./final-frontend/evidence/2026-10-12/acceptance-universes.md).
> Observado: **162 OP** (filas y IDs únicos, y diferencia vacía entre
> [`final-frontend/backend-inventory.md`](./final-frontend/backend-inventory.md) y
> [`final-frontend/coverage/operations.md`](./final-frontend/coverage/operations.md)) ·
> **99 FL** · **36 SCREEN** · **140 R** · **131 AC** en
> [`final-frontend/verification.md`](./final-frontend/verification.md) §5-6 (99 + 32).
>
> **Dos discrepancias registradas, no reparadas** (son de integración secuencial, no de F1):
> (a) el «37» de SCREEN era la fila de cabecera `| SCREEN-ID` del catálogo, no una pantalla
> más → **36**; (b) [`final-frontend/acceptance/coverage.md`](./final-frontend/acceptance/coverage.md)
> declara 175 criterios (162 `AC-OP` + 8 `AC-FL` + 5 `AC-CORE`) pero sólo contiene **150**
> literales `AC-OP-*`; faltan `AC-OP-RPR-002…006`, `AC-OP-PPR-002…006`, `AC-OP-AUT-006` y
> `AC-OP-RES-003`. 131 y 175 no se igualan: son dos arquitecturas de aceptación coexistentes
> con unidades de corte distintas, sin equivalencia canónica publicada.
>
> **Lo que F1 deja abierto.** El **conjunto efectivo vigente** (backend y registro actuales)
> sigue **pendiente de contraste**: 162 es el conteo documental, no una verificación del
> código. Por tanto el requisito de AC-1 «conjunto efectivo vigente verificado» **no está
> saldado**. El trazado de F2 no lo cerró: el contraste contra `apipoligono/urls.py` fue
> *matching* del último segmento estático del path, sin lectura de handlers ni de método/acción
> por ViewSet, y **162 sigue sin llamarse «conjunto efectivo verificado»** en la matriz.
> `/cuenta`, que figuraba como `ANCHOR-PENDING`, tiene ya ID: `SCREEN-ACCOUNT-001` (§5 del
> artefacto F1 y §3 de `account-ux-delivery.md`).
>
> **Estado de la aceptación integral: `in-progress`, no cerrada.** F1 (reconciliación) y F2/F5
> (matriz y registro documental) están **persistidos**; F4 y F7 quedan **incompletas**.
> Artefactos: [`final-frontend/evidence/2026-10-12/acceptance-matrix.json`](./final-frontend/evidence/2026-10-12/acceptance-matrix.json)
> y [`final-frontend/evidence/2026-10-12/runtime-observations.md`](./final-frontend/evidence/2026-10-12/runtime-observations.md).
>
> **Conteo vigente:** los números de este bloque son el corte del 2026-10-12 y **no** se reescriben.
> Los conteos que rigen están en
> [`final-frontend/estado-integral-2026-10-12.md`](./final-frontend/estado-integral-2026-10-12.md)
> §6 (primera tanda del 2026-10-13) y §7 (segunda tanda), y en el bloque
> `observations.session_2026_10_13` de
> [`final-frontend/evidence/2026-10-12/acceptance-matrix.json`](./final-frontend/evidence/2026-10-12/acceptance-matrix.json).
> El estado global sigue `NOT_VERIFIED` / `NO_CUMPLIDO` y esta spec sigue **`in-progress`**.
>
> **Resultado observado (2026-10-12): `NOT_VERIFIED` / `NO_CUMPLIDO`.** 1296 celdas
> (162 OP × 8 actores): **1277 `NOT_EXERCISED`** · **19 `PARTIAL`** · **0 `OBSERVED_OK`
> certificadas**. Ningún CRUD de escritura observado; sin aislamiento tenant/unidad/preferencias
> A→B; overrides, recuperación y contraseña forzada sin ejercitar; comparación total del DS no
> hecha. El denominador de 162 sigue siendo **documental**, no conjunto efectivo verificado.
> Gates `security_review` y `code_review` **REVOCADOS** por el operador: sin dictamen, no
> pasados; los comandos en verde no son gate.
>
> **Rama F4:** sólo lecturas observadas (`GET`) y autenticación. **Rama F7: cerrada en su rama.**
> Actor A8, POST-fix: login original 200 → «Mi cuenta» → `POST` de cambio de contraseña 200 con la
> credencial original reaplicada → **`/login` inmediato** con aviso de éxito y `detail` literal
> visibles, formulario de cuenta y menú protegido retirados, inputs vacíos, 1 request de cambio y
> 1 de login antes del reintento manual (sin autologin), y re-login manual de la original 200 con
> acceso a la raíz. **Veredicto del orquestador: `VERIFIED` para F7/AC-8, rama de sesión
> invalidada, en este caso A8.** La corrección está **terminada**; no queda en ejecución.
> `NO_MUTATION` no se afirma y el roundtrip con contraseña temporal queda `NOT_EXERCISED`.
>
> **Superficie inicial de recuperación observada:** `/recuperar` con `rut` requerido, **0** requests
> de escritura al enviar vacío y 390 × 844 sin desbordamiento. Es **sólo esa superficie**: sin
> código, verificación ni reseteo, y sin servicio de correo invocado.
>
> **Origen de la evidencia, corregido:** la lectura de ficha propia (`OP-USR-003`) y las sondas de
> unidades (`OP-UNT-001`) proceden del **reporte del worker**, no de observación directa; así
> quedan registrados, sin alterar su estado `PARTIAL`.
>
> **Ejecución al cierre:** `Code` (corrección F7) y el worker de runtime están **inactivos**. Los
> gates `security_review` y `code_review` fueron **revocados por el operador**: no se hicieron y
> no están en `PASSED`; **no son requisito** para completar esta ejecución. Lo que impide completarla
> es la ejecución runtime por actor (escrituras, aislamiento, overrides, contraseña forzada,
> comparación del DS), el contraste pendiente del conjunto efectivo de backend y la deuda
> registrada.
>
> **Cierre anterior, sustituido (2026-10-12):** la matriz F2 **existe** y está persistida, hay
> observaciones runtime reales y la trazabilidad de `/cuenta` está **resuelta** como
> `SCREEN-ACCOUNT-001` (ver §5 del artefacto F1). No hay dictamen de `Dhampir Slayer` —la
> revisión prevista fue **revocada explícitamente por el operador**—: no existe
> `security_review passed` ni por silencio ni por tests, y no se emite ninguna métrica de
> completitud.

## 7. Notas/decisiones

- Las reservas históricas (B-01; TD captura/calibre/overrides) entran sin estado supuesto
  ([`../bugs/backend-debt.md`](../bugs/backend-debt.md) §Separación de origen).
- `DELETE /poligonos/{id}/` es contrato restringido: no ofrecida; no es bug frontend.
- Las 8 cuentas dev existen de tarea anterior; la matriz usa alias por rol/unidad, nunca
  valores.
- La adopción de Playwright como dependencia sigue siendo decisión del operador
  (dependency-change), no permiso de este plan; la habilitación de skills de testing del
  ejecutor (`vitest`, `vue-testing-best-practices`) ya fue ordenada (2026-10-12) y consta en la
  allowlist vigente de `Code Transmuter`.
- Decisiones técnicas propuestas (la aprobación del plan las ratifica; no se piden
  confirmaciones adicionales): regla de reconciliación de universos, vocabulario por celda,
  regla de cierre con métricas separadas, mecanismo `ANCHOR-PENDING`.
- La aprobación antigua (spec `final-frontend-001`, 2026-10-02) no aprobó esta spec; aprobada y
  con ejecución ordenada por el operador el 2026-10-12; de ahí `in-progress` (2026-10-12) al
  ejecutarse F1. Aprobar no equivale a ejecutar: cada fase requiere su bloque/autorización,
  y aquí la orden de ejecución llegó por separado.