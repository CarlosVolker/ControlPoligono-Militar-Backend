# TD — `POST /api/consumos-municion/` responde 500: la FK `calibre` se asigna después del INSERT

## Ficha

| Campo | Valor |
| :--- | :--- |
| Tipo | TD backend (defecto abierto, confirmado) |
| Estado | **Abierto** — backend fuera de scope en esta pasada, no reparado |
| Fecha | 2026-10-06 |
| Workstream | `final-frontend-autonomous-runtime-evidence` |
| Endpoint | `POST /api/consumos-municion/` → **500** |
| Excepción | `django.db.utils.IntegrityError: NOT NULL constraint failed: apipoligono_consumomunicion.calibre_id` |
| Alcance bloqueado | FL-CMN-002, FL-CMN-003, FL-CAR-001, FL-CAR-002 |

---

## Hechos observados

- Artefacto de runtime: `exercises-consumption-report.json` y su ejecución puntual (`cmn500`),
  que reproducen el **500** con el texto de excepción anterior.
- Anclas de código contrastadas por lectura directa:
  - `apipoligono/serializers.py:498-504` — `ConsumoMunicionSerializer.create()` hace
    `validated_data.pop('calibre_code_write', None)` y **actualmente llama
    `super().create(validated_data)` antes de resolver y asignar `calibre`**.
  - `apipoligono/models.py:394` — `calibre = models.ForeignKey(Calibre, …)` sin `null=True`:
    la restricción `NOT NULL` aplica en el INSERT.

---

## Causa

El `calibre` nunca viaja dentro de `validated_data` (sólo el campo write-only
`calibre_code_write`). El `INSERT` se emite sin esa FK y viola `NOT NULL` **antes** de que
llegue el `instance.calibre = …; save()` posterior. La asignación tardía es inalcanzable
cuando la fila ya falló.

---

## Alcance bloqueado

- **No se creó ningún consumo de munición.** El endpoint rechaza el alta.
- FL-CMN-002 (alta) queda bloqueado en el paso observado.
- FL-CMN-003, FL-CAR-001 y FL-CAR-002 quedan bloqueados **por falta de prerrequisito**
  (no existe registro sobre el cual operar): detalle, edición, relación y baja.
- `OP-CMN-003` (GET de detalle) **no se ejecutó** — la lista estaba vacía. No se infiere su resultado.
- Bajas de clones de munición/armamento **no se ejecutaron** (no había registros que borrar):
  no son rechazos, son operaciones **no alcanzadas**.

---

## Qué falta (backend, fuera de scope)

Ordenar el `create()` para resolver y validar `calibre` **antes** del INSERT (o incluirlo en
`validated_data`), de modo que la restricción se evalúe antes de escribir. La fuente backend
**no fue modificada** en esta pasada.

## Auditoría

No se guardaron contraseñas, tokens ni datos de identidad en este documento; sólo endpoint,
status y excepción.