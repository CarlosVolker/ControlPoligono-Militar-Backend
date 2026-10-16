---
spec_meta: "./spec-meta.yaml"
---

# Backend Contracts — Frontend integral

> 📜 Yo conservo este índice como entrada canónica. El detalle previo se reubicó, sin eliminar su evidencia útil, en contratos por dominio; la antigua propuesta de endpoint de apariencia de ocho ejes no se conserva como API existente porque `apipoligono/urls.py:64-95` no la registra.

## Índice canónico

| Dominio | Archivo | Operaciones cubiertas |
|---|---|---|
| Manifest y clasificación | [backend-inventory.md](backend-inventory.md) | 162 OP: 161 de negocio y `OP-AUT-006` de infraestructura; capacidades sin endpoint |
| Sesión, contexto, recuperación y auditoría | [contracts/auth-context.md](contracts/auth-context.md) | `OP-AUT-*`, `OP-RCV-*`, credenciales de usuario |
| Tiro, resultados, armas y calibres | [contracts/domain-shooting.md](contracts/domain-shooting.md) | `OP-WPN-*` a `OP-RES-*` |
| Organización, usuarios, puestos y memberships | [contracts/organization-identity.md](contracts/organization-identity.md) | `OP-UNT-*`, `OP-RCT-*`, `OP-ARM-*`, `OP-POS-*`, `OP-MEM-*`, `OP-USR-*` |
| RBAC, matrices y catálogos | [contracts/authorization.md](contracts/authorization.md) | `OP-ROL-*`, `OP-SCP-*`, `OP-OVR-*`, `OP-PRM-*`, `OP-RPR-*`, `OP-PPR-*`, `OP-AZC-*` |
| Ejercicios, consumos y apariencia legacy | [contracts/exercises-preferences.md](contracts/exercises-preferences.md) | `OP-EJR-*`, `OP-CMN-*`, `OP-CAR-*`, `OP-PRF-*` |

## Reubicación del registro anterior

| Contenido que estaba aquí | Destino preservado |
|---|---|
| Auth, contexto, recuperación, auditoría y bloqueo | [auth-context.md](contracts/auth-context.md) |
| Tablas de recursos, campos de tiro y acciones de lección/fracción | [domain-shooting.md](contracts/domain-shooting.md) |
| Unidades, recintos, armerías, posiciones, holders, memberships y usuarios | [organization-identity.md](contracts/organization-identity.md) |
| Roles, scopes, permissions, role/position permissions y overrides | [authorization.md](contracts/authorization.md) |
| Ejercicios, consumos y los tres campos de apariencia existentes | [exercises-preferences.md](contracts/exercises-preferences.md) |

> 🕯️ Los contratos describen fuente estática. Filtros, paginación y ordenamiento globales no se afirman cuando no aparecen declarados en el handler. La spec está **`approved`** desde el 2026-10-02 (`spec-meta.yaml`:7); la aprobación no supera gates por sí sola (`verified_at: null`, ningún gate en `passed`) y la ejecución vigente se rige por el plan de cierre (verificado 2026-10-15).
