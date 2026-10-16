---
spec_meta: "./spec-meta.yaml"
---

# development-context — Mapa documental de la spec

> 📖 Índice de `spec-development-context-001` (estado **`approved`**). Este índice dice **dónde vive cada materia** y **qué no autoriza**; no duplica requisitos, contratos ni criterios, que tienen un único cuerpo en [`spec.md`](./spec.md).

## Índice

1. [Qué define esta spec](#qué-define-esta-spec) · 2. [Orden de lectura](#orden-de-lectura) · 3. [Límites de este índice](#límites-de-este-índice)

---

## Qué define esta spec

Un **constructor acotado** que crea **exclusivamente** las filas de contexto de receta que falten en la base de desarrollo —institución, árbol de unidades y puestos— **preservando toda fila existente y todos los accesos**. El artefacto propuesto es `apps/organizations/management/commands/prepare_development_context.py`, que **no existe**; este documento no lo crea.

> 🕯️ El operador **ya autorizó** crear en DBdev **sólo las filas de contexto de la receta que falten**, con base en su respuesta literal «Dale con todo, no existe produccion ni datos reales» a la pregunta acotada del checkpoint (`spec.md` §1.2, A-1). No es mera aprobación de diseño ni exige nueva confirmación para ese paso. En cambio, esta spec **por sí sola no habilita la ejecución**: el constructor acotado debe planificarse, implementarse y revisarse antes (`spec.md` §8, `DC-X-01`), y `init_access_model`, `--reset`, RBAC global, usuarios y titulares siguen fuera (`DC-X-02..07`).

## Orden de lectura

| # | Tomo | Qué aporta |
|---:|---|---|
| 1 | [`spec.md`](./spec.md) | Cuerpo único de la spec: objeto y base de aprobación, anclas de fuente, contrato de faltantes, preflight y preservación, atomicidad e idempotencia `DC-R-01..07`, criterios observables `DC-V-01..05`, gates, exclusiones `DC-X-*` y límites de lo afirmado |
| 2 | [`spec-meta.yaml`](./spec-meta.yaml) | Metadata canónica: `id`, `status`, fechas, gates, riesgo y trazabilidad |

Materias que **no** viven aquí y se citan por ruta:

| Materia | Dónde vive |
|---|---|
| Auxiliar privado de la cuenta de desarrollo (spec aprobada aparte) | [`../private-master-helper/`](../private-master-helper/) |
| Metadata e índice de la spec padre | [`../final-frontend/spec-meta.yaml`](../final-frontend/spec-meta.yaml) · [`../final-frontend/index.md`](../final-frontend/index.md) |
| Comandos oficiales de receta | `apps/organizations/management/commands/seed_org_tree.py` · `apps/identity/management/commands/seed_positions.py` |

## Límites de este índice

- No afirma runtime observado, estado de base de datos, gate superado ni código escrito; `verified_at` sigue en `null` (`spec.md` §9).
- No reasigna ni duplica los gates ni el estado de otras specs; su metadata no fue modificada.
- No existe plan de implementación para este constructor; la aprobación de alcance no lo sustituye.