# TD — `prepare_development_context`: reversión de transacción en constructor de contexto

## Ficha

| Campo | Valor |
| :--- | :--- |
| Tipo | TD backend (defecto abierto) |
| Estado | **Abierto** — sin causa raíz confirmada, sin reparación abierta |
| Fecha | 2026-10-06 |
| Workstream | `td-development-context-transaction-failure` |
| Evidencia de origen | Handoff `ses_eededacc5ffethv3JVe5zdu90B` |

---

## Hechos observados

- Comando ejercitado:

  ```bash
  prepare_development_context --tenant-code ejercito-demo --database default
  ```

- `--check` terminó con **exit 0**; la ejecución terminó con **exit 1**.
- Error reportado: `CommandError` — *"Transacción revertida por un error de base de datos o de auditlog"*.
- La transacción **revirtió**: ningún dato quedó embebido por el intento.
- Settings reportan SQLite local; base `db.sqlite3` confirmada. Antes del intento existían 1 tenant, 5 unidades y 21 puestos.
- El tenant real local `desarrollo-poligono-local` **ya existe**, mientras el constructor fija `ejercito-demo`. Diferencia observada; **no** adjudicada como causa de la excepción.
- El constructor queda fuera del camino crítico; la estructura existente alcanza para la cuenta de desarrollo.

---

## Causa

**DESCONOCIDA.** El error Visible es un wrapper transaccional: no distingue entre fallo de base de datos y fallo de `auditlog`.

> Claim de handoff, no verificado por esta sesión: el `source` de `_prepare_context` ocultaría la excepción original con `raise ... from None`. La ruta exacta de ese `source` no fue inspeccionada al redactar este TD; el locator del comando en el handler se reporta sin confirmar.

**No se asegura** que una migración o un fix de `source` sean necesarios: ninguna de las dos hipótesis está confirmada.

---

## Alcance

- No se modificó backend, `source`, datos, API ni schema.
- Sin secretos, contraseñas, variables de entorno ni PII en este registro.
