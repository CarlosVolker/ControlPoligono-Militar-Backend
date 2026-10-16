# TD — La primera captura de una fracción nunca puede arrancar: `tiradores` sólo proyecta resultados previos

## Ficha

| Campo | Valor |
| :--- | :--- |
| Tipo | TD backend / contrato (defecto abierto) |
| Estado | **Abierto** — sin reparación, sin fallback frontend decidido |
| Fecha | 2026-10-06 |
| Workstream | `final-frontend-autonomous-runtime-evidence` |
| Endpoint | `GET /api/fracciones/{id}/tiradores/` → **200** con arrays vacíos |
| Alcance bloqueado | FL-SHT-015 → FL-SHT-016; edición y baja de resultados no alcanzables |

---

## Hechos observados

- `apipoligono/views.py:1185-1199` — `FractionViewSet.tiradores` construye `usuarios` y `armas`
  filtrando sobre `ResultadoTiro.objects.filter(id_fraccion=fraccion, tenant=request.tenant)`.
  Es decir: la fuente de las opciones es **el historial de resultados de esa misma fracción**.
- En una fracción recién creada no existe historial ⇒ ambos arrays llegan vacíos.
- Evidencia de runtime (`shots-number-fix-pass3.json`, ruta `/tiro/fracciones/1/resultados`):
  `options_status: 200`, `options_body: {"usuarios": [], "armas": []}`,
  `button_disabled: true`, estado en pantalla *"El backend no devolvió tiradores elegibles…"* /
  *"El backend no devolvió armas elegibles…"*.
- Contrato `docs/specs/final-frontend/requirements/shooting.md:36` (**R-DOM-SHT-016**):
  la captura debe cargar esa fuente y, si un array viene vacío, mostrar el estado vacío y
  **no inventar opciones**. En esa parte el frontend **cumple** el contrato;
  el problema es que el backend no ofrece una fuente de elegibilidad.
- Revisión de seguridad (`Dhampir-Slayer`) sobre la fuente autoritativa: los catálogos
  `GET /api/usuarios/` y `GET /api/armas/` son de **Scope** (visibilidad), no de **elegibilidad**.
  Sustituirlos en el cliente expondría opciones que la regla de negocio no autoriza.

---

## Causa

Defecto de diseño del endpoint: la única fuente de elegibilidad de la captura es un derivado del
resultado, por lo que la captura no tiene punto de entrada. Sin cambio en backend o sin contrato
explícito que nombre otra fuente autoritativa, el flujo es inalcanzable.

**No reparado. No se propone fallback como decisión tomada.**

---

## Lo que queda pendiente (backend / contrato)

1. Decidir, en backend o por contrato, cuál es la **fuente autoritativa** de elegibilidad de la
   captura. Ese es el punto pendiente; no se propone aquí ninguna fuente concreta.
2. Mantener **R-DOM-SHT-016**: array vacío sigue siendo estado vacío legítimo, nunca opciones inventadas.
3. Sólo después de esa decisión se reintenta FL-SHT-015/016.

---

## Hallazgo estático adyacente (no mezclado, no verificado en runtime)

El especialista reportó estáticamente una posible deficiencia de validación
tenant/unidad en el alta de resultados (`apipoligono/serializers.py:371-416`,
`apipoligono/models.py:322-355`). **No fue explotado ni verificado en ejecución** y
**no se adjudica como causa del vacío observado**. Se registra aparte para no contaminar este TD.