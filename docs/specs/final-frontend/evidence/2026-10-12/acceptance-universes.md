---
actualizado: 2026-10-12
---

# F1 — Reconciliación documental de universos de aceptación (lectura, sin ejecución)

> 🕯️ **Alcance de esta página.** `Lore Master`, 2026-10-12, fase **F1** de
> [`../../../frontend-integral-acceptance.md`](../../../frontend-integral-acceptance.md)
> §5.5 (AC-1). Conteos **documentales**: leídos de las filas de los manifiestos actuales.
> No se ejecutó nada (ni backend, ni navegador, ni tests). No se calculated ningún
> porcentaje de progreso. No es una auditoría de backend ni de calidad: es un corte
> verificable de lo que el corpus documental declara.

## 1. Índice

1. [Método](#1-método) · 2. [Conteos observados](#2-conteos-observados) ·
3. [Relación entre universos](#3-relación-entre-universos) ·
4. [Discrepancias observadas](#4-discrepancias-observadas) ·
5. [`/cuenta` — trazabilidad resuelta](#5-cuenta--trazabilidad-resuelta-superficie-nueva-independiente) ·
6. [Regla adoptada](#6-regla-adoptada) · 7. [Pendiente para F2](#7-pendiente-para-f2)

---

## 2. Método

Cada total se cuenta por la **fila que define el ID**, no por menciones:

| Universo | Definición buscada | Fuente primaria |
|---|---|---|
| `OP-*` | fila de tabla que **inicia** con el ID | [`../../backend-inventory.md`](../../backend-inventory.md) §Manifest · [`../../coverage/operations.md`](../../coverage/operations.md) |
| `FL-*` | fila del índice canónico | [`../../experience/flows.md`](../../experience/flows.md) §Índice canónico |
| `SCREEN-*` | fila de §Pantallas canónicas | [`../../experience/screens.md`](../../experience/screens.md) |
| `AC-*` (esquema 1) | fila de §5 y §6 | [`../../verification.md`](../../verification.md) |
| `AC-*` (esquema 2) | literal `AC-*` único del corpus | [`../../acceptance/coverage.md`](../../acceptance/coverage.md) |
| `R-*` | ítem `- **R-…**` de definición | [`../../requirements/*.md`](../../requirements/) |

Menciones ajenas a la fila de definición (columnas de consumidor, referencias cruzadas,
equivalencias) se excluyen del conteo por diseño.

---

## 3. Conteos observados

| Universo | Conteo observado | Fuente y localizador |
|---|---:|---|
| `OP-*` — manifest backend | **162 filas, 162 IDs únicos** | [`backend-inventory.md:24-37`](../../backend-inventory.md) §Universo contado (161 de negocio + `OP-AUT-006` infra) |
| `OP-*` — cobertura | **162 filas, 162 IDs únicos** | [`coverage/operations.md:253-255`](../../coverage/operations.md) §Verificación de conteo |
| `OP-*` — intersección de ambos manifiestos | **162 / 162, diferencia vacía** | Comparación de conjuntos por ID |
| `FL-*` | **99 filas, 99 IDs únicos** | [`experience/flows.md:120-126`](../../experience/flows.md) índice canónico; volúmenes `flows/*.md` suman 99 (SES 6 · RCV+PWD 6 · ORG 12 · IDT 17 · AZ+AUD 14 · ARM+WPN+CAL 9 · SHT 19 · EXC+CMN+CAR 8 · APP 8) |
| `SCREEN-*` | **36 filas de catálogo** (37 coincidencias brutas) | [`experience/screens.md:30-71`](../../experience/screens.md) §Pantallas canónicas — véase §4.1 |
| `AC-*` — `verification.md` | **131 filas, 131 IDs únicos, 0 duplicados** | [`verification.md:120`](../../verification.md) §5 = 99 por flujo; [`:277`](../../verification.md) §6 = 32 transversales (INT/TRA/RES/DAT/DS/NAV/BCK) |
| `AC-*` — `acceptance/coverage.md` | **150 literales `AC-OP-*` únicos + 8 `AC-FL-*` + 5 `AC-CORE-*` → 163 literales observados** | [`acceptance/coverage.md:17-36`](../../acceptance/coverage.md) declara 162+8+5 = **175**; véase §4.2 |
| `R-*` | **140 definiciones** (92 DOM + 25 SES + 23 APAR) | `requirements/organization.md` 17 · `armory.md` 12 · `exercises-consumption.md` 14 · `identity-authorization.md` 29 · `shooting.md` 20 · `shared-session-data.md` 25 · `appearance.md` 23 |

**Diferencia entre universos, sin forzar igualdad:** `OP` 162 · `FL` 99 · `SCREEN` 36 ·
`R` 140 · `AC` 131 (esquema 1) / 163 observados (esquema 2, declarados 175).

---

## 4. Discrepancias observadas

### 4.1 `SCREEN` 36 declaradas vs 37 filas

Resuelto **por lectura de filas, sin forzar la igualdad**: `experience/screens.md`
contiene 36 filas de pantalla en §Pantallas canónicas. La 37ª coincidencia del patrón
`| SCREEN-` es la **fila de cabecera** `| SCREEN-ID` de esa misma tabla, no una pantalla.
No hay ninguna pantalla duplicada ni huérfana en el catálogo.

> Registro: §1 y §5.5 F1 de la spec de aceptación enuncian «36 declaradas vs 37 filas».
> La segunda cifra provenía del conteo bruto que incluía la cabecera.
>
> 🕯️ **No confundir con el 37 de §5.** `SCREEN-ACCOUNT-001` es una superficie **nueva** del
> registro del frontend (36 + 1), registrada fuera del catálogo histórico. Es un conteo
> distinto del «37» anterior y **no altera** las 36 filas de `experience/screens.md`.

### 4.2 `AC-OP` declarados 162 vs 150 literales observados

`acceptance/coverage.md:19` y `:448` declaran 162 `AC-OP-*` biunívocos con el manifiesto.
El conteo de literales `AC-OP-*` únicos en ese archivo da **150**. Los 12 IDs ausentes,
por familia:

| Familia OP | Ops | `AC-OP-*` observados | IDs sin literal en `acceptance/coverage.md` |
|---|---:|---:|---|
| `OP-RPR-*` (RolePermission) | 6 | 1 | `AC-OP-RPR-002…006` |
| `OP-PPR-*` (PositionPermission) | 6 | 1 | `AC-OP-PPR-002…006` |
| `OP-AUT-*` (auth/sesión) | 6 | 5 | `AC-OP-AUT-006` |
| `OP-RES-*` (resultados) | 6 | 5 | `AC-OP-RES-003` |

Las 20 familias restantes coinciden exactamente (OP = AC-OP) por biunívoco de ID.

> 🕯️ No se corrige ni se reescribe nada aquí. Es una diferencia **documental** entre lo
> que el corpus afirma y lo que el corpus contiene. Determinarla (literales ausentes vs.
> typos vs. renombrado) exige la decisión de integración de las dos arquitecturas de
> aceptación que ya está registrada como fase secuencial en
> [`../../acceptance/coverage.md:444-452`](../../acceptance/coverage.md) §Nota de integración.
> Reconciliarlo aquí sería tomar una decisión de integración que no pertenece a F1.

**Nota de conteo (corregida 2026-10-12).** El total de literales observados es **163**
(150 `AC-OP-*` + 8 `AC-FL-*` + 5 `AC-CORE-*`), frente a los **175 declarados** (162+8+5) por
el propio archivo. La diferencia es de **13** criterios declarados sin literal, no de 12: los
12 son `AC-OP-*`; la decimotercera es la diferencia de `AC-OP` declarados (162) frente a
observados (150), que **no** debe contarse dos veces. No se fuerza igualdad ni se sustituye un
denominador por otro.

### 4.3 `AC` 131 vs 175 — cortos distintos, no en conflicto

No son dos recuentos del mismo objeto ni un error previo: son **dos arquitecturas de
aceptación coexistiendo**, tal como documenta
[`../../acceptance/coverage.md:444-452`](../../acceptance/coverage.md):

- **Esquema 1** — `verification.md`: 131 criterios `AC-<familia>-<nnn>` en línea, anclados
  a los 99 FL, más 32 transversales. Unidad de corte: **el flujo de usuario**.
- **Esquema 2** — `acceptance/coverage.md`: 175 criterios anidados por operación
  (162 `AC-OP` + 8 `AC-FL` + 5 `AC-CORE`). Unidad de corte: **la operación del contrato**.

Un mismo comportamiento observable aparece en ambos con identificadores distintos. No hay
correspondencia 1:1 publicada entre `AC-SES-00n` y `AC-OP-AUT-00n`; existe correlación
textual por flujo y operación, pero **no una equivalencia canónica**. Ningún porcentaje
puede mezclar ambos esquemas.

---

## 5. `/cuenta` — trazabilidad resuelta (superficie nueva, independiente)

`/cuenta` corresponde a
[`../../../frontend-account-self-service.md`](../../../frontend-account-self-service.md).
Ya **no** es una entrada pendiente: tiene ID asignado y anclas de código observadas.

| Campo | Valor |
|---|---|
| Superficie | `/cuenta` (`AccountView`) |
| SCREEN | **`SCREEN-ACCOUNT-001`** — decisión del orquestador (2026-10-12) |
| Criterios | `frontend-account-self-service.md` AC-1…AC-9 (§3), **sin renumerar** los históricos |
| Anclas | `front/src/router/routes.ts:132-136` · `front/src/components/DashboardTopbar.vue:221-233` · `front/src/features/account/useOwnAccount.ts:80-344` · `front/src/views/account/AccountView.vue` |
| Fila de acceso | Principal autenticado → topbar «Mi cuenta» → `/cuenta` |
| Estado | `NOT_EXERCISED` — F7/AC-8 pendientes de observar el contrato |
| Detalle | [`account-ux-delivery.md`](./account-ux-delivery.md) |

**Relación con los denominadores de §3.** `SCREEN-ACCOUNT-001` es una **superficie nueva
del registro del frontend**, registrada fuera del catálogo histórico. Los conteos
documentales de §3 **no se modifican**: siguen siendo **36 pantallas** del catálogo de
`experience/screens.md` y **162 OP** del manifiesto de `backend-inventory.md` /
`coverage/operations.md`, medidos sobre esas mismas fuentes. `37` sigue siendo el resultado
de añadir la superficie nueva al catálogo histórico, y **no es una fila más de ese
catálogo**: son dos registros distintos (histórico documentado / entrega actual) y por eso no
se suman ni se sustituye el denominador único.

> 🕯️ Esta entrada **no** afirma funcionalidad runtime. La superficie está implementada y
> verificada por typecheck, tests y build; su comportamiento en runtime por actor **no se ha
> observado** (`NOT_EXERCISED`). No se modificó `experience/screens.md` ni
> `experience/navigation.md`.

---

## 6. Regla adoptada

1. **Un universo, un origen.** Cada cifra tiene una fila de definición y una fuente nombrada (§2). Las menciones no cuentan.
2. **Universos distintos no se igualan.** `OP` 162, `FL` 99, `SCREEN` 36, `R` 140 y `AC`
   131/175 son denominadores de cosas distintas; cada matriz elige **uno** y lo declara.
3. **Los denominadores de la matriz de aceptación son las OP efectivas**, no AC, no SCREEN,
   no FL. Razón: la fila de matriz es «operación × método × actor × estado»; AC y FL son
   cortes transversales del mismo corpus, no filas.
4. **Baseline ≠ conjunto efectivo.** 162 / 99 / 36 son los conteos **documentales** de hoy
   (§3). El conjunto efectivo vigente (backend y registro actuales) sigue **pendiente de
   contraste** por el trazado de F2: esta página no convierte documentación histórica en
   código vigente. Si el manifest cambió, el denominador de la matriz es el vigente
   verificado, no el congelado.
5. **Ningún porcentaje** de completitud se emite con estos conteos. Falta el estado por
   celda, que es evidencia de ejecución, no de lectura.
6. **Discrepancias se registran, no se reparan** (§4). Reparar el corpus histórico es
   integración secuencial, no F1.

---

## 7. Bloqueos y pendiente para F2

- **Conjunto efectivo de backend no verificado.** 162 OP es el conteo del manifiesto
  documental. No se contrastó contra `apipoligono/urls.py` ni contra una ejecución de
  rutas en esta fase (prohibido por alcance). **Pendiente: trazado de F2.**
- **Faltan 12 literales `AC-OP-*`** en `acceptance/coverage.md` (§4.2). No se corrigen.
  Afecta la completitud del corpus, no el conteo de OP.
- **No hay equivalencia canónica** entre los dos esquemas de AC (§4.3). La unificación
  sigue siendo decisión del orquestador.
- **Deuda backend registrada** (no replicada aquí, sólo señalada para el marcado
  `BLOCKED_BACKEND` de F2/F4):
  [`../../../../bugs/backend-debt.md`](../../../../bugs/backend-debt.md) §1 overrides no
  reflejados en el contexto de UI · §2 validación de destino en escrituras ·
  §3 recuperación: enumerabilidad y almacenamiento · §4 contraseña inicial compartida ·
  §5 login: CSRF sin validación explícita · §6 cambio de contraseña y continuidad de
  sesión · §Reservas ya registradas · §Separación de origen.
- **Sin matriz F2 escrita.** Este artefacto cierra sólo la parte documental de AC-1. La
  comprobación de que el conjunto efectivo verificado sea el denominador sigue abierta.