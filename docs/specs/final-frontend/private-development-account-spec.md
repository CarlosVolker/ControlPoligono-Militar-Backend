---
spec_meta: "../private-master-helper/spec-meta.yaml"
relocated_to: "../private-master-helper/spec.md"
document_role: "pointer"
---

# Puntero — el documento se trasladó de ruta

📖 Este archivo **ya no contiene el cuerpo de la spec**. No es la ruta canónica
y no se mantiene como segunda copia: los requisitos, contratos, criterios,
riesgos y exclusiones tienen un **único cuerpo**, en
[`docs/specs/private-master-helper/spec.md`](../private-master-helper/spec.md),
con su metadata en
[`docs/specs/private-master-helper/spec-meta.yaml`](../private-master-helper/spec-meta.yaml)
y su índice en
[`docs/specs/private-master-helper/index.md`](../private-master-helper/index.md).

| Campo | Valor |
|---|---|
| **Spec** | `spec-private-master-helper-001` — *Auxiliar privado para la cuenta de desarrollo (rol raíz)* |
| **Artefacto canónico** | [`docs/specs/private-master-helper/spec.md`](../private-master-helper/spec.md) |
| **Metadata canónica** | [`docs/specs/private-master-helper/spec-meta.yaml`](../private-master-helper/spec-meta.yaml) |
| **Estado** | `approved` (alcance), `approved_at: 2026-10-05`, `verified_at: null` |
| **Motivo de la reubicación** | `docs/sdd.md` exige que `id` y `status` vivan en el `spec-meta.yaml` de una **carpeta propia** bajo `docs/specs/`; esta ruta era un documento suplementario dentro de la carpeta de otra spec |
| **Spec padre** | `spec-final-frontend-001` — metadata en [`../final-frontend/spec-meta.yaml`](./spec-meta.yaml), índice en [`../final-frontend/index.md`](./index.md). Ninguno de los dos se modificó |

> 🕯️ Esta reubicación es un paso **documental**: mueve el cuerpo de sitio y
> materializa el registro canónico que estaba pendiente. **No** añade
> requisitos, **no** cambia el alcance aprobado y **no** autoriza
> implementación, instalación ni ejecución por agentes
> (`PDA-X-01`, `PDA-X-12` en el cuerpo canónico).

Toda referencia histórica a `docs/specs/final-frontend/private-development-account-spec.md`
sigue siendo válida como **ruta** y resuelve al cuerpo canónico.
