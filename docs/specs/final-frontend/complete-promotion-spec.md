---
spec_meta: "../complete-promotion/spec-meta.yaml"
---

# Puntero — Promoción completa de usuario temporal

> 🕯️ **Este archivo ya no es el tomo canónico.** Su contenido fue **reubicado** (no
> duplicado) a [`docs/specs/complete-promotion/spec.md`](../complete-promotion/spec.md) el
> **2026-10-05**, cuando la dependencia `D-2` —registro canónico del documento— quedó
> resuelta. Nació como tomo suplementario sin `id` ni metadata propios.

| # | Dato | Valor |
|---|---|---|
| Spec canónica | [`spec.md`](../complete-promotion/spec.md) | `spec-complete-promotion-001` |
| Metadata canónica | [`spec-meta.yaml`](../complete-promotion/spec-meta.yaml) | `approved`, `approved_at: 2026-10-05`, `verified_at: null`, ningún gate en `passed` |
| Mapa documental | [`index.md`](../complete-promotion/index.md) | Índice de la spec |
| Spec padre (relación, no `id` de este artefacto) | `spec-final-frontend-001` | `traceability.related_specs` en la metadata canónica |
| Base de aprobación | «Dale con todo nada de datos minimos» — aprueba ampliar el **diseño**, no ejecutar | Canónica §1.2 |

## Qué debe hacer quien llegue por esta ruta

1. Leer [`docs/specs/complete-promotion/spec.md`](../complete-promotion/spec.md): ahí vive
   **una sola** copia del contrato (comportamiento actual, contrato propuesto, recorrido,
   invariantes, casos abiertos, criterios observables, riesgos y exclusiones).
2. No copiar el contrato de vuelta a esta ruta: eso recrearía la duplicación que la
   reubicación eliminó.
3. La numeración de identificadores (`CP-*`, `CP-R-*`, `CP-P-*`, `CP-V-*`, `CP-K-*`,
   `CP-X-*`, `A-*`, `G-*`, `S-*`, `D-*`) se conserva **sin renumerar** en el tomo canónico:
   las citas de planes y revisiones que usaban esta ruta siguen apuntando al mismo
   significado.

## Límites de este puntero

- No es una spec: no tiene `id`, estado, fechas ni gates propios; toda esa materia vive en
  la metadata canónica.
- No modifica la spec padre ni sus planes, gates, `spec-meta.yaml` o `index.md`.
- No autoriza implementación, instalación de dependencias, servidor, navegador, tests ni
  escritura en base de datos.
- El veredicto de cierre lo emite el orquestador, no este archivo.