---
spec_meta: "../spec-meta.yaml"
---

# Contrato: ejercicios, consumos y apariencia legacy

## Ejercicios y consumos

| Recurso | Lectura (RO) | Escritura | Reglas |
|---|---|---|---|
| EjercicioMilitar | `id_ejercicio`, tenant, unidad, participantes codes, `created_at` | `nombre`*, `fecha`*, `zona?`, `tipo_ejercicio?`, orden/fecha?, `observaciones?`, `unidades_participantes_codes_write?` | tipo: `asalto|defensa|movimiento|mixto|otro`; sin lista usa unidad del recurso. |
| ConsumoMunicion | `id_consumo`, `calibre_code` | `ejercicio`*, `tipo_arma`*, `modelo_arma?`, `calibre_code_write?`, `cantidad_armas?`, `cantidad_tiros`*, `es_aproximado?`, `observaciones?` | sólo tenant, sin unidad propia; calibre write resuelve activo. |
| ConsumoArma | `id_consumo_arma` | `consumo`*, `arma`*, `cantidad_tiros`*, `observaciones?` | único consumo+arma; sólo tenant. |

`tipo_arma` usa el catálogo de seis valores del dominio. Fuentes: `apipoligono/serializers.py:334-435`; `models.py:197-254`; `views.py:1323-1370`.

## Preferencias de apariencia legacy

| OP | Request / choices | Response |
|---|---|---|
| OP-PRF-001 | GET autenticado | `{theme,palette,density}` |
| OP-PRF-002 | PUT parcial: `theme`=`nexus-light|nexus-dark`; `palette`=`corporate-blue|military-teal|neutral-slate`; `density`=`comfortable|compact` | mismo objeto; elección inválida: `400 {error}` |

Los campos tienen defaults en modelo: `nexus-light`, `corporate-blue`, `comfortable` (`apipoligono/models.py:19-36`; `views.py:1901-1940`). El endpoint de los ocho ejes del Design System **existe** (`GET|PUT|DELETE /api/me/preferences/appearance/design-system/`; migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15), y su contrato campo a campo queda pendiente de documentar aquí (T1 C-1 en [`../coverage/t1-gap-map-2026-10-15.md`](../coverage/t1-gap-map-2026-10-15.md)). El requisito de ocho ejes y reset dejó de ser hueco abierto (`front/AGENTS.md` §Personalizador).
