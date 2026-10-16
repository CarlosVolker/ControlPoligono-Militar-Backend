---
spec_meta: "./spec-meta.yaml"
---

# private-master-helper — Mapa documental de la spec

> 📖 Índice de `spec-private-master-helper-001` (estado **`approved`**, `spec-meta.yaml`:7). Este índice dice **dónde vive cada materia** y **qué no autoriza**; no duplica requisitos, contratos ni criterios, que tienen un único cuerpo en [`spec.md`](./spec.md), ni los de la spec padre, que viven en [`../final-frontend/`](../final-frontend/).

## Índice

1. [Qué define esta spec](#qué-define-esta-spec) · 2. [Orden de lectura](#orden-de-lectura) · 3. [Ruta histórica](#ruta-histórica) · 4. [Límites de este índice](#límites-de-este-índice)

---

## Qué define esta spec

Un auxiliar **privado, local y de ejecución única** con el que el operador **prepara** la cuenta de desarrollo de rol raíz (`super_admin`, posición `MASTER`) en un tenant **ya existente**. La única diferencia aceptable frente al comando actual es que el secreto se captura **exclusivamente en la terminal privada del operador** y no viaja por la línea de comandos, la salida ni el chat.

> 🕯️ Lo aprobado es **preparar y revisar**, no ejecutar: el verbum es el que manda (`spec.md` §1.2, A-1..A-5). El registro canónico de la aprobación es su propio `spec-meta.yaml`; **no** autoriza implementación, instalación de dependencias, ejecución por agentes, navegador, shell ni escritura en base de datos (`spec.md` §12, `PDA-X-01`).

## Orden de lectura

| # | Tomo | Qué aporta |
|---:|---|---|
| 1 | [`spec.md`](./spec.md) | Cuerpo único de la spec: objeto y base de aprobación, contexto de datos, anclas de fuente, requisitos `PDA-R-*`, preflight, confirmaciones `PDA-C-*`, atomicidad y reversión, criterios observables `PDA-V-*`, gates aplicables, trazabilidad, riesgos `PDA-K-*`, exclusiones `PDA-X-*` y límites de lo afirmado |
| 2 | [`spec-meta.yaml`](./spec-meta.yaml) | Metadata canónica: `id`, `status`, fechas, gates, riesgo y trazabilidad |

Materias que **no** viven aquí y se citan por ruta:

| Materia | Dónde vive |
|---|---|
| Metadata e índice de la spec padre | [`../final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) · [`../final-frontend/index.md`](../final-frontend/index.md) |
| Reglas de unicidad de acceso por cuenta | [`../../../AGENTS.md`](../../../AGENTS.md) |

## Ruta histórica

`docs/specs/final-frontend/private-development-account-spec.md` alojó este mismo documento antes de que tuviera carpeta propia. Esa ruta conserva un **puntero** al artefacto canónico y no conserva cuerpo duplicado: el cuerpo vive una sola vez, aquí.

## Límites de este índice

- No afirma runtime observado, ni estado de base de datos, ni gate superado; `verified_at` sigue en `null` (`spec.md` §13).
- No reasigna ni duplica los gates ni el estado de `spec-final-frontend-001`; su metadata no fue modificada.
- No existe plan de implementación para este auxiliar, y la aprobación de alcance no lo sustituye.
