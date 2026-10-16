---
spec_meta: "../spec-meta.yaml"
---

# Contrato: tiro, resultados y calibres

## Armas y calibres

| Recurso | Lectura (RO) | Escritura | Reglas / fuente |
|---|---|---|---|
| Arma | `id_arma`, tenant, unidad, armory y códigos/nombre, `calibre_code` | `tipo_arma`*, `modelo_arma`*, `numero_serie`*, `armory_code_write?`, `calibre_code_write?` | choices: `fusil`, `subfusil`, `pistola`, `francotirador`, `ametralladora`, `apoyo`; único modelo+serie. Update con armory vacío falla. `apipoligono/serializers.py:96-186`; `models.py:53-93` |
| Calibre | `id_calibre`, `code`, `nombre`, `is_active` | `code`*, `nombre`*, `is_active?` | Global; mutación sólo `super_admin`. `serializers.py:90-94`; `views.py:1280-1320` |

## Polígonos y lecciones

| Recurso / OP | Campos y shape | Errores o alcance declarado | Fuente |
|---|---|---|---|
| Polígono | RO `id_poligono`, tenant, unidad; W* `nombre`, `ciudad`, `carriles_maximos`, `distancia_maxima` | La eliminación no tiene mapa `range:delete`. | `serializers.py:188-192`; `permissions.py:54-57` |
| OP-RNG-007 | `LeccionTiroSerializer[]` | mismo tenant del polígono. | `views.py:745-750` |
| Lección | RO `id_leccion`, tenant, unidad, `unidades_participantes_codes`; W* `id_poligono`, `fecha_tiro`, `cant_tiros_cereo`, `cant_tiros_leccion`, `distancia`; W? orden, fecha, `tipo_tiro` (`evaluacion|entrenamiento`), `unidades_participantes_codes_write` | Polígono debe ser del tenant. Sin lista escrita agrega la unidad del recurso. Visibilidad añade participantes; tirador puro sólo invitación o resultado propio. | `serializers.py:194-266`; `views.py:766-805` |

## Fracciones y resultados

| Recurso | Lectura (RO) | Escritura | Validación |
|---|---|---|---|
| Fracción | `id_fraccion`, tenant, unidad | `id_leccion`*, `tiradores_totales`*, `numero_fraccion`* | lección mismo tenant/unidad; único lección+número. `serializers.py:268-285`; `models.py:151-155` |
| Resultado | `id_resultado`, tenant, unidad | `id_fraccion`*, `id_usuario`*, `id_arma`*, `tiros_acertados`*, `total_tiros`*, `numero_carril?` | fracción/arma mismo tenant y unidad; únicos fracción+usuario, fracción+arma y carril no nulo. `serializers.py:287-332`; `models.py:172-194` |

## Lecturas de lección

| OP | Shape de respuesta | Restricción |
|---|---|---|
| OP-LES-007 | `FraccionTiroSerializer[]` | tenant. |
| OP-LES-008 | `UsuarioSerializer[]` | usuarios con resultado. |
| OP-LES-009 | filas con identidad, unidad, arma, carril y tiros | `can_read_detail`; `403 {detail}` si no. Hipótesis estática: invoca `primary_unit()` fuera de su ámbito. |
| OP-LES-010 | `{id_leccion,fracciones,tiradores_unicos,tiros_acertados_total,tiros_total}` | `read_summary→view_unit`. |
| OP-LES-011 | `{leccion,resumen,por_fraccion,por_tirador,por_unidad,por_arma,por_arma_unidad,aggregate_only}` | aggregate-only vacía tres desgloses personales/arma. |
| OP-LES-012 | `{results: UsuarioSerializer[]}` | unidades participantes y descendientes. |
| OP-FRC-007 | `{usuarios: UsuarioSerializer[],armas: ArmaSerializer[]}` | — |
| OP-FRC-008 | `[{resultado: ResultadoTiroSerializer,usuario: UsuarioSerializer,arma: ArmaSerializer}]` | `can_read_detail`; `403 {detail}` si no. |

Fuentes: `apipoligono/views.py:807-1169,1183-1242`; `apps/authorization/scope.py` vía `can_read_detail`. La hipótesis no equivale a fallo runtime.
