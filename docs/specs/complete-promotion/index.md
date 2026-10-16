---
spec_meta: "./spec-meta.yaml"
---

# complete-promotion — Mapa documental de la spec

> 📖 Índice canónico de la spec `spec-complete-promotion-001` (estado **`approved`**,
> [`spec-meta.yaml`](./spec-meta.yaml) > `spec.status`; `approved_at: 2026-10-05`,
> `verified_at: null`). Este mapa dice **dónde vive cada materia**; no duplica el contrato y
> no autoriza nada: la aprobación de alcance **no** autoriza implementación, instalación de
> dependencias, servidor, navegador, tests ni escritura en base de datos
> ([`spec.md`](./spec.md) §1.2, §12).

## Índice

1. [Qué define esta spec](#qué-define-esta-spec)
2. [Orden de lectura](#orden-de-lectura)
3. [Materias por sección](#materias-por-sección)
4. [Identidad canónica y procedencia](#identidad-canónica-y-procedencia)
5. [Límites de lo afirmado](#límites-de-lo-afirmado)

---

## Qué define esta spec

La **promoción completa de usuario temporal** en el recorrido de alta formal de
identidad (`FL-IDT-003` / `T-FL-IDT-003`): un endpoint de **previsualización de solo
lectura** que permite a un actor con `user:create` **detectar** la promoción antes de
enviarla, una **precondición opcional** en la confirmación y un **resultado explícito**
(`creation_outcome`) en la respuesta de alta, más la **reactivación de la `Account`** que
hoy deja a la persona promovida sin poder entrar. Ningún paso del recorrido se recorta.

| Campo | Valor | Localizador |
|---|---|---|
| Identificador | `spec-complete-promotion-001` | [`spec-meta.yaml`](./spec-meta.yaml) > `spec.id` |
| Estado | `approved`, `verified_at: null`, ningún gate en `passed` | [`spec-meta.yaml`](./spec-meta.yaml) |
| Spec padre (relación) | `spec-final-frontend-001` | `traceability.related_specs` |
| Base de aprobación | «Dale con todo nada de datos minimos» | [`spec.md`](./spec.md) §1.2 (A-1/A-2) |

---

## Orden de lectura

| # | Tomo | Qué aporta |
|---:|---|---|
| 1 | [`spec.md`](./spec.md) | Contrato completo: comportamiento actual verificado, diseño propuesto, recorrido íntegro, invariantes, casos abiertos, criterios observables, riesgos y exclusiones |
| 2 | [`spec-meta.yaml`](./spec-meta.yaml) | **Única** fuente de verdad de estado, fechas, gates, riesgo y trazabilidad de esta spec |

---

## Materias por sección

> Regla de la spec: un único tomo canónico por materia. Las referencias al material de la
> spec padre se resuelven con rutas relativas `../final-frontend/…`.

| Materia | Dónde vive |
|---|---|
| Propósito, identificación y alcance aprobado | [`spec.md`](./spec.md) §1 |
| Comportamiento actual verificado y huecos que cierra | [`spec.md`](./spec.md) §2 |
| Anclas de fuente (backend, cliente, docs de la spec padre) | [`spec.md`](./spec.md) §3 |
| Contrato propuesto: previsualización, confirmación, lectura, DTOs | [`spec.md`](./spec.md) §4 |
| Recorrido íntegro de promoción, paso a paso | [`spec.md`](./spec.md) §5 |
| Alcance, tenant, reactivación de `Account`, `Person` global, sin auditoría | [`spec.md`](./spec.md) §6 |
| Validación, transacción e invariantes (`CP-R-01..08`) | [`spec.md`](./spec.md) §7 |
| Casos abiertos de precisión (`CP-P-01..09`) | [`spec.md`](./spec.md) §8 |
| Criterios observables (`CP-V-01..16`) | [`spec.md`](./spec.md) §9 |
| Gates, riesgos (`CP-K-01..08`) y dependencias `D-1..D-7` | [`spec.md`](./spec.md) §10 |
| Exclusiones (`CP-X-01..10`) | [`spec.md`](./spec.md) §11 |
| Límites de lo afirmado | [`spec.md`](./spec.md) §12 |
| Estado, fechas, gates, riesgo, trazabilidad | [`spec-meta.yaml`](./spec-meta.yaml) |

---

## Identidad canónica y procedencia

| # | Hecho | Detalle |
|---|---|---|
| R-1 | Este archivo es el mapa de una spec con `id` y metadata **propias** | `spec_meta: "./spec-meta.yaml"`; la metadata de la spec padre **no** se usa como metadata de este artefacto |
| R-2 | El cuerpo se **reubicó** desde el destino anterior | `docs/specs/final-frontend/complete-promotion-spec.md` queda como **puntero breve** a `docs/specs/complete-promotion/spec.md`: una sola copia del contrato, sin duplicación |
| R-3 | Numeración de identificadores conservada | `CP-*`, `CP-R-*`, `CP-P-*`, `CP-V-*`, `CP-K-*`, `CP-X-*`, `A-*`, `G-*`, `S-*`, `D-*` no se renumeran; las citas de planes y revisiones siguen apuntando al mismo significado |
| R-4 | Localizador abreviado del handoff Portal, resuelto | `identity/api` resuelve a `front/src/features/identity/api.ts`; ambos rangos citados caen sobre bloques DTO reales ([`spec.md`](./spec.md) §3, S-13/S-14/S-15/S-17) |
| R-5 | Asimetría de trazabilidad declarada | La relación con `spec-final-frontend-001` vive **aquí**. `../final-frontend/spec-meta.yaml` conserva `related_specs: []` porque está fuera del conjunto de escritura y no se modifica ([`spec.md`](./spec.md) §1.4, R-4) |

---

## Límites de lo afirmado

- **Nada de este mapa afirma trabajo verificado.** No se ejecutó servidor, navegador,
  tests, build, lint, shell ni base de datos, y no se escribió código de promoción.
- **El contrato de §4 del spec es diseño a implementar.** No existe endpoint de
  previsualización, ni precondición, ni `409`, ni `creation_outcome` en backend ni en
  cliente ([`spec.md`](./spec.md) §3, S-13/S-14).
- **Los casos `CP-P-01..09` siguen abiertos.** La aprobación de alcance no los resuelve
  ([`spec.md`](./spec.md) §8).
- **Ninguna ruta de este mapa autoriza implementación.** El veredicto de cierre lo emite
  el orquestador ([`spec.md`](./spec.md) §1.3, §12).