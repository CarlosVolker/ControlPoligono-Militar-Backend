---
spec_meta: "../specs/final-frontend/spec-meta.yaml"
---

# Deuda técnica backend — diagnóstico de estado del frontend

> 📜 Registro de deuda **backend**, sin Remedios ejecutados y sin explotación. El
> frontend es el alcance del diagnóstico; el backend es **intocable** en esta tarea
> (incluida la excepción histórica de preferencias de apariencia). Sólo el operador
> puede autorizar trabajo backend nuevo, y en otra tarea. Este fichero registra; no
> planifica, no corrige y no autoriza.

**Fecha de registro:** 2026-10-11 · **Workstream:** `frontend-current-state` ·
**Origen:** orden explícita del operador de revisar el estado del frontend para el
cliente integral dejando el backend intacto y con sus problemas registrados aquí.

**Método:** lectura dirigida de fuente estática y de documentos de la spec. No se
ejecutó ningún comando del proyecto, ni navegador, servidor, base de datos, `.env`,
tests, build, lint, red ni escritura en git. Las cuentas de dev existen de una tarea
anterior y **no se usaron** en este diagnóstico. Ninguna entrada describe una
explotación o un fallo reproducido: describen **lectura de código** y, cuando se
indica, hipótesis.

---

## 1. Contexto de permisos: overrides no reflejados en el contexto de UI

| | |
|---|---|
| **Evidencia** | `apps/authorization/permissions.py:207-235` (`get_effective_permission_codes`, que emite el array `permissions` al frontend, no consulta `UserPermissionOverride`) vs. `apps/authorization/permissions.py:266-289` (`HasResourcePermission`, que sí resuelve `_override_verdict_v2` en `:283`) |
| **Estado** | Observado en código. Runtime no verificado |
| **Efecto en frontend** | Un `DENY`/permiso individual puede no aparecer en el contexto de sesión, de modo que la visibilidad de UI puede divergir de la autorización real. Blocker de contrato para prometer «visibilidad exacta» |

## 2. Validación del destino en escrituras de membership / puesto / unidad

| | |
|---|---|
| **Evidencia** | `apps/identity/views.py:130-149`, `apps/identity/serializers.py:169-180`, `apps/authorization/scope.py:124-164`, `apipoligono/mixins.py:34-42`, `apps/tenants/middleware.py:11-19` |
| **Estado** | Reportado por `Dhampir-Slayer` como **riesgo por confirmar**. No es explotación demostrada; la validez de las constraints y el aislamiento efectivo **requieren confirmación** y no se comprobaron. No se exploró más allá de estos anclajes |
| **Efecto en frontend** | El riesgo observado se acota al **alcance de unidades** en escrituras de membership/puesto/unidad. **No** se declara un cruce efectivo entre tenants ni una escalada lograda. Sin copia de payloads ni diseño de remedio |
| **Seguimiento al 2026-10-13** | Hay un caso **distinto** y ya observado en runtime, de la misma familia de validación de destino pero sobre escrituras de `ResultadoTiro`: ver **§7.1**. **No confirma ni cierra este §2**, que sigue siendo riesgo por confirmar en su alcance original |

## 3. Recuperación de acceso: enumerabilidad, generación y almacenamiento del código

| | |
|---|---|
| **Evidencia** | `apipoligono/utils/recuperacion_utilidades.py:26-27` (`censurar_codigo` descompone el correo sin manejo de formato) y `:45-57` (la respuesta incluye `correo_censurado` sólo cuando el RUT existe); generación con `random` en `:21-22` y persistencia en claro en `:74`; expiración por ventana temporal sin contador específico en `:89-100`; `apipoligono/models.py:423-426` (`codigo` como `CharField(max_length=6)` en claro) |
| **Estado** | Hechos estáticos. Efectos en runtime no comprobados |
| **Efecto en frontend** | La vista de recuperación puede fallar ante correo malformado y la respuesta es distinguible por existencia de RUT. Sin códigos, correos ni valores sensibles aquí |

## 4. Contraseña inicial compartida como valor por defecto

| | |
|---|---|
| **Evidencia** | `control_poligono/settings.py:201` — una constante de contraseña temporal con valor por defecto embebido, leída de configuración; usada en `apipoligono/views.py:660-680` (`resetear-contrasena`, `:669`) |
| **Estado** | Mecanismo documentado; el **valor por defecto no se transcribe** y el nombre real de la variable sensible se omite. Configuración efectiva **no comprobada**: `.env` no se leyó |
| **Efecto en frontend** | **Condicional:** si la configuración efectiva usa el valor por defecto de settings (no comprobada — `.env` no se leyó), el reseteo administrativo reinyectaría una contraseña compartida. Mientras esa condición no se confirme, no se afirma que exista contraseña compartida efectiva. **No** se afirma que las cuentas de dev usen ese default: tienen contraseñas propias generadas |

## 5. Login: CSRF sin validación explícita

| | |
|---|---|
| **Evidencia** | `apipoligono/views.py:1382-1384` (`SessionLoginView` con `ensure_csrf_cookie`, `permission_classes`/`authentication_classes` vacíos) y cliente `front/src/api/auth.ts:244-254` |
| **Estado** | Deuda backend **preexistente**, identificada por `Dhampir-Slayer`. No es demostración HTTP en este encargo |
| **Efecto en frontend** | El cliente no puede asumir que el login esté protegido por validación CSRF del backend |

## 6. Cambio de contraseña y continuidad de sesión

| | |
|---|---|
| **Evidencia estática** | `apipoligono/views.py:618-657` (no se observa actualización del hash de sesión en las vistas de cambio) frente a `front/src/stores/session.ts:717-798` y `front/src/views/auth/PasswordRequiredView.vue:208,318` |
| **Estado** | **Observación runtime acotada del 2026-10-12** (antes: hipótesis pendiente de comprobación) |
| **Efecto en frontend** | El frontend puede adaptar su UX al contrato real del backend; ese cambio **no** está autorizado desde esta nota |

### 6.1 Observación runtime acotada (2026-10-12)

Escenario ejecutado por el orquestador con UI de producto, actor A8, reaplicando la **misma
credencial original** (sin credencial temporal):
`POST /api/usuarios/{id}/cambiar-contrasena/` → **200**; a continuación, navegación de producto
a la raíz con contexto vigente → `GET /api/auth/context/` → **403** con `detail` literal
«Las credenciales de autenticación no se proveyeron.» y aterrizaje en `/login`.

| Observado | No observado / no afirmado |
|---|---|
| El contrato actual **invalida la sesión** tras el cambio de contraseña | Que esto invalide **todos** los contratos, **todas** las cuentas, o los flujos de contraseña forzada y de recuperación |
| El valor original **se conservó**: su login fue `200` antes y fue confirmado varias veces | Que el hash **no** haya cambiado — **NO_MUTATION no se afirma**; el hash pudo cambiar |
| La UI, tras el `200` de la operación, **no** retiró el estado autenticado obsoleto | Causa raíz en backend; **no** se solicita ni se autoriza reparación de backend desde aquí |

> 🕯️ Esta observación **acota** una hipótesis estática previa; **no la confirma como bug de
> backend**. Es evidencia de sesión invalidada, nada más. La corrección del lado frontend
> (retirar estado obsoleto y volver a login con aviso) fue entregada y verificada por el
> orquestador en el caso A8 (2026-10-12); esta nota **no** amplía aquel veredicto acotado.
> Trazabilidad y límites:
> [`../specs/final-frontend/evidence/2026-10-12/runtime-observations.md`](../specs/final-frontend/evidence/2026-10-12/runtime-observations.md) §5.

---

## 7. Captura de resultados: no se puede crear el primer resultado (huevo-gallina de elegibilidad)

Observado por el orquestador el **2026-10-12**. **Registro sólo: no hay fix propuesto ni aplicado.**

| | |
|---|---|
| **Síntoma** | La pantalla de captura de resultados **no puede crear el primer resultado** de una fracción: el botón «Capturar resultado» queda deshabilitado con los avisos «El backend no devolvió tiradores» / «El backend no devolvió armas elegibles» |
| **Causa localizada** | `GET /api/fracciones/{id}/tiradores/` (**OP-FRC-007**, [`apipoligono/views.py:1186-1199`](../../apipoligono/views.py)) construye los usuarios y las armas **elegibles** a partir de `ResultadoTiro` **existentes** de esa fracción. Con cero resultados devuelve conjuntos vacíos con **200**, y la pantalla interpreta el vacío como «no hay elegibles» |
| **Endpoint disponible no consumido** | Los miembros elegibles **sí** existen en `/api/lecciones/{id}/tiradores-elegibles/` ([`apipoligono/views.py:1143-1171`](../../apipoligono/views.py)), pero la captura **no lo consume** para armar sus opciones |
| **Endpoint inexistente** | **No hay** endpoint de elegibilidad de armas equivalente |
| **Naturaleza** | Dependencia circular: para elegir tirador/arma se exige que ya exista un resultado; sin resultado no hay nada elegible |
| **Consecuencia registrada** | La siembra dev de resultados hubo de hacerse por `POST /api/resultados/` (API pública, sesión real del producto), **no** por la UI. Evidencia durable: [`../specs/final-frontend/evidence/2026-10-12/shooting-seed-results.json`](../specs/final-frontend/evidence/2026-10-12/shooting-seed-results.json) |
| **Impacto en frontend** | **Creación** en `SCREEN-CAPTURE` queda **inusable con dataset vacío**. Ver botones no acreditaba mutaciones: al 2026-10-13, el **borrado con A1** sí quedó observado; **PUT/PATCH del resultado 1** quedaron bloqueados por desalineación de unidades del dataset concreto. Ver **§7.1** |
| **No bloqueado por permiso** | No es `BLOCKED_BACKEND` por decisión del operador: es una carencia funcional del backend. No se certifica creación por UI mientras siga vigente |

> 🕯️ Esta sección **consigna** el hecho y sus límites. No propone reparación, no la autoriza y no
> modifica backend, contratos ni corpus histórico.

### 7.1 Edición de resultados: rechazo por desalineación de unidad (2026-10-13)

Observado por el orquestador el **2026-10-13** con UI de producto y backend reales, actor **A1**
(`super_admin`). **Registro sólo: no hay fix propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Síntoma** | `PUT /api/resultados/1/` y `PATCH /api/resultados/1/` emitidos **por la UI** → **400** con `non_field_errors` «La fraccion no pertenece a la unidad organizacional del recurso.» El `GET` posterior (**200**) confirmó el registro **sin cambios** |
| **Causa localizada** | `ResultadoTiroSerializer.validate` compara `fraccion.organization_unit_id` contra el `organization_unit` del recurso ([`apipoligono/serializers.py:389-403`](../../apipoligono/serializers.py); mensaje en `:400-401`) |
| **Por qué el dato llegó desalineado** | `tenant` y `organization_unit` son `read_only` ([`apipoligono/serializers.py:375`](../../apipoligono/serializers.py)) y `perform_create` los inyecta al guardar ([`apipoligono/mixins.py:34-48`](../../apipoligono/mixins.py), `serializer.save(**extra)` en `:48`), es decir **después** de la validación: en el alta la validación no ve la unidad, de modo que un `POST` puede persistir la desalineación que las actualizaciones posteriores rechazan |
| **Datos del caso** | Resultados 1 y 2 en `organization_unit` **5**; fracción 1 en `organization_unit` **1**; armas 1, 2 y 3 en `organization_unit` **12** (lecturas **200**) |
| **Relación con §7** | El mismo hueco de elegibilidad dejó al actor **sin combinaciones libres** para el alta por UI (**400** de unicidad). El único descartable de la corrida se preparó por API pública (**201**, `id_resultado` 3) y se borró por UI (**204**) |
| **Naturaleza** | **No** es un defecto de frontend: la UI emitió la escritura con los valores del formulario y el backend la rechazó con un mensaje específico. **No** se afirma cuál de las dos partes —dato almacenado o regla de validación— debería cambiar: es decisión del operador y aquí no se diagnostica |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-13/shooting-edit-delete.md`](../specs/final-frontend/evidence/2026-10-13/shooting-edit-delete.md) · [`shooting-edit-delete-results.json`](../specs/final-frontend/evidence/2026-10-13/shooting-edit-delete-results.json) |

| Observado | No observado / no afirmado |
|---|---|
| `PUT` y `PATCH` por UI rechazados con **400** sobre el resultado 1 | Que **toda** edición esté rota: es un **dataset de desarrollo concreto**; la preparación de fracciones, armas y unidades es ajena a esta observación |
| Los datos originales 1 y 2 **intactos** (8/10 en carril 1, 7/10 en carril 2) | Que el rechazo sea un comportamiento **correcto**: describe una comparación que el serializer hace, no un juicio sobre el dato |
| `DELETE` por UI **204**, fila eliminada, `GET` posterior **404** | Que el borrado esté acreditado fuera de **A1**, ni el aislamiento entre actores, ni otros registros de la familia |
| El `POST` por API creó el `id_resultado` 3 con `organization_unit` **5** mientras la fracción 1 es de la unidad **1** | Que la creación por API sea una vía legítima de captura ni que deba mantenerse |

> 🕯️ Esta subsección **consigna** el bloqueo y su lectura de código. No propone reparación, no la
> autoriza y no modifica backend, contratos ni corpus histórico. El **400** se mostró en la UI **de
> forma genérica**, sin el `non_field_errors`: es una observación **frontend** abierta, **no**
> corregida en este recorrido.

---

## 8. Consumo de munición: `POST /api/consumos-municion/` responde 500 (2026-10-13)

Observado por el orquestador el **2026-10-13** con UI de producto y backend reales, actor **A1**
(`super_admin`). **Registro sólo: no hay fix propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Síntoma** | `POST /api/consumos-municion/` emitido **por clic de UI** → **500** en **dos** intentos consecutivos del mismo recorrido |
| **Alcance observado** | Familia de consumo de munición: **no se creó ningún registro con los marcadores de la corrida**. El `GET` posterior (**200**) devolvió **cero** coincidencias exactas de cada marcador. La fuente **no** afirma la inexistencia absoluta de registros de la colección |
| **Los dos payloads** | El primero con el formulario completo (`modelo_arma`, `calibre_code_write`, `cantidad_armas` 1, `cantidad_tiros` 1, `es_aproximado` `false`); el segundo **con** `modelo_arma`, `calibre_code_write` y `cantidad_armas` **omitidos**. **Los dos devolvieron 500** |
| **Referencia del ejercicio** | Ambos intentos apuntaron al ejercicio **5**, que **existía** en el momento de las escrituras y se borró después en su propia familia: la referencia no era un identificador inexistente |
| **Reconciliación por UI** | El botón «Consultar estado real» leyó el estado del servidor en los dos casos **sin repetir ninguna escritura**; la escritura incierta quedó despejada. Los **dos** `POST` son emisiones **distintas**, con marcadores y payloads distintos |
| **Causa** | **No establecida.** La respuesta **500** **no retuvo cuerpo** ni traza. **No** se le atribuye ningún serializer, campo, excepción ni constraint |
| **Naturaleza** | **Fallo de servidor observado** en una escritura emitida desde la UI. **Sin** causa establecida. **No** se evalúa el payload como válido o inválido, **no** se califica el comportamiento del frontend y **no** se atribuye el fallo a ninguna de las dos partes |
| **Separación de origen** | El registro histórico [`td-ammo-consumption-calibre-create.md`](./td-ammo-consumption-calibre-create.md) (**2026-10-06**) documenta un `500` en este mismo endpoint con una causa localizada y fechada. **Son dos observaciones distintas**: aquí **no** se hereda esa causa ni su `IntegrityError`, y no se leen como un mismo defecto |
| **Efecto en frontend** | El alta de la familia queda **ejercitada y rechazada**, nunca exitosa: la celda de alta queda en `PARTIAL` y las filas de detalle, `PUT`, `PATCH` y `DELETE` quedan `NOT_EXERCISED` por no existir registro con los marcadores de la corrida contra el cual operar |
| **Dependencia relacionada, no idéntica** | El alta de **consumo de arma** quedó bloqueada por un prerrequisito ausente: el selector del consumo de munición requerido **no recibió ninguna opción** en el formulario de alta. Es una consecuencia aguas arriba, **no** el mismo defecto, y en esa familia **no** hubo ninguna escritura |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-13/crud-ui-families-summary.md`](../specs/final-frontend/evidence/2026-10-13/crud-ui-families-summary.md) §5 · fuentes primarias inalteradas: [`munition-create-attempt-1.json`](../specs/final-frontend/evidence/2026-10-13/munition-create-attempt-1.json), [`munition-create-attempt-2.json`](../specs/final-frontend/evidence/2026-10-13/munition-create-attempt-2.json), [`munition-reconciliation-ui.json`](../specs/final-frontend/evidence/2026-10-13/munition-reconciliation-ui.json), [`munition-reconciliation-ui-2.json`](../specs/final-frontend/evidence/2026-10-13/munition-reconciliation-ui-2.json), [`weapon-consumption-prerequisite.json`](../specs/final-frontend/evidence/2026-10-13/weapon-consumption-prerequisite.json) · celdas: [`acceptance-matrix.json`](../specs/final-frontend/evidence/2026-10-12/acceptance-matrix.json) (bloque `observations.crud_ui_families_2026_10_13`) |

| Observado | No observado / no afirmado |
|---|---|
| Dos `POST` por UI rechazados con **500** sobre el mismo endpoint | Que **toda** escritura a este endpoint devuelva **500**: son **dos** intentos de una corrida y un dataset concreto |
| Reducir el payload —omitiendo modelo, calibre y cantidad de armas— **no** cambió el resultado | Que eso indique cuál es el campo que el servidor rechaza: **no hay** cuerpo de respuesta ni traza que lo diga |
| `GET` posterior **200** con **cero** coincidencias de los marcadores de la corrida | Que la colección **no** contenga ningún registro: sólo que no hay ninguno con esos marcadores |
| Reconciliación por UI **sin repetir ninguna escritura** | Que los dos `POST` sean un reintento de la misma escritura: son emisiones **distintas**; el resto de la familia no se ejercitó |
| El ejercicio referenciado **existía** en el momento de ambos intentos | Que el `500` dependa de ese ejercicio: no se comprobó ni se descarta |
| La separación de origen respecto del registro de **2026-10-06** | Que esta observación herede la causa ni el `IntegrityError` de aquel: son registros distintos y fechados aparte |

> 🕯️ Esta sección **consigna** el hecho y sus límites, sin causa atribuida. No propone reparación, no
> la autoriza y no modifica backend, contratos ni corpus histórico. **No** se emite diagnóstico del
> endpoint ni se anticipa el resultado de una corrección.

### 8.1 Traza capturada y localización (2026-10-16)

📜 **Observación runtime acotada — traza capturada.** El **2026-10-16**, al sembrar contenido de
desarrollo por orden del operador, el alta de consumo de munición se intentó por **API real** (sesión
acreditada de **A1**, `super_admin`): `POST /api/consumos-municion/` → **500**. Esta vez la respuesta
**retuvo la traza**, que **localiza** la causa que §8 no había establecido. **Registro sólo: no hay fix
propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Traza** | `sqlite3.IntegrityError: NOT NULL constraint failed: apipoligono_consumomunicion.calibre_id` |
| **Localización** | `apipoligono/serializers.py:500` — dentro de `ConsumoMunicionSerializer.create()` |
| **Mecanismo** | El `create()` hace `pop('calibre_code_write', None)` (**línea 499**) y luego `super().create(validated_data)` (**línea 500**): el **INSERT se emite sin calibre**; el FK `calibre_id` es `NOT NULL`, así que el INSERT inicial **siempre** falla. El calibre se asigna **después** con `update_fields=['calibre']` (líneas 502–503), cuando ya es tarde |
| **Alcance** | El alta por API es **imposible con cualquier payload**: el INSERT precede a la resolución del calibre. Consistente con que §8 observara el mismo 500 con payload completo y con payload reducido |
| **Separación de origen** | **Sigue** siendo observación **distinta** de [`td-ammo-consumption-calibre-create.md`](./td-ammo-consumption-calibre-create.md) (**2026-10-06**): aquí la traza **localiza** el mecanismo en `serializers.py:500`, pero **no** se hereda ni se fusiona con aquel registro |
| **Consecuencia en la siembra** | El consumo de munición sembrado (**id 1**) se creó por **ORM de desarrollo** (única vía posible); el consumo de arma (**id 1**) dependió de él. **No** se arregló el endpoint |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-16/seed-dev-content-orm.json`](../specs/final-frontend/evidence/2026-10-16/seed-dev-content-orm.json) · [`../specs/final-frontend/evidence/2026-10-16/seed-dev-content-and-post-seed-sweep.md`](../specs/final-frontend/evidence/2026-10-16/seed-dev-content-and-post-seed-sweep.md) §5.2 |

> 🕯️ Esta nota **consigna** la traza y su localización; **no** propone ni aplica reparación, **no**
> modifica backend ni contratos y **no** altera el registro previo de §8, que se conserva intacto.

---

## 9. Ficha de lección › pestaña Resultados: `GET /api/lecciones/{id}/resultados/` responde 500 (2026-10-14)

Observado por el orquestador el **2026-10-14** con UI de producto y backend reales, actor de rol
`super_admin` (alias `NOT_VERIFIED`). **Registro sólo: no hay fix propuesto ni aplicado y no se tocó
código.**

| | |
|---|---|
| **Síntoma** | `GET /api/lecciones/1/resultados/` emitido **por la UI** al abrir la pestaña «Resultados» de la ficha de la lección existente (id **1**) → **500**. Un solo caso observado |
| **Presentación en la UI** | La pestaña muestra una alerta de error **genérica** y ofrece «Reintentar pestaña»; **no** muestra el cuerpo ni el detalle del error |
| **Causa** | **No establecida.** La respuesta **no** retuvo cuerpo ni traza. **No** se le atribuye ningún serializer, campo, excepción ni constraint |
| **Naturaleza** | **Fallo de servidor observado** en una lectura emitida desde la UI. **No** es denegación: **no** hubo `403` en este endpoint ni en el recorrido. **No** se califica el comportamiento del frontend |
| **Alcance del recorrido** | Fue el **único** `GET` no-`200` de la corrida: **29** `GET` **200** y **1** `GET` **500** (`get_403` **0**, `get_404` **0**) |
| **Rama no ejercitada** | La rama de la captura «sin tiradores/armas elegibles» **NO** se ejercitó: el conjunto de datos tenía elegibles reales (2/2) y el control «Capturar resultado» quedó **HABILITADO**. **No** se inventa la ausencia ni se afirma ese estado |
| **No confundir con** | **§7** (huevo-gallina de elegibilidad en captura), **§7.1** (rechazo de edición de resultados por desalineación de unidad) y **§8** (`500` de `POST /api/consumos-municion/`): son observaciones **distintas**, sobre endpoints, métodos y familias distintos |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-14/shooting-surfaces-readonly.json`](../specs/final-frontend/evidence/2026-10-14/shooting-surfaces-readonly.json) · lectura en [`../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md`](../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md) §5 ter.4 |

| Observado | No observado / no afirmado |
|---|---|
| Un `GET` por UI a `/api/lecciones/1/resultados/` con **500** | Que **toda** lectura de este endpoint devuelva **500**: es un caso y un dataset concretos |
| La pestaña muestra alerta genérica con «Reintentar pestaña» | Que el `500` dependa de la lección **1**, del actor o del dataset |
| **No** hubo `403`: el caso **no** es denegación | Que exista o no una causa en un serializer, campo o excepción: **no** se le atribuye ninguna |
| El resto de los `GET` del recorrido respondió **200** con contenido | Que el endpoint esté sano fuera de este caso ni que la UI lo consuma correctamente en otro estado |
| La rama «sin elegibles» **no** se ejercitó | Que ese estado esté roto o que exista: simplemente no se observó |

> 🕯️ Esta sección **consigna** el hecho y sus límites, sin causa atribuida. No propone reparación, no
> la autoriza y no modifica backend, contratos ni corpus histórico. **No** se emite diagnóstico del
> endpoint ni se anticipa el resultado de una corrección.

### 9.1 Traza capturada y localización (2026-10-16)

📜 **Observación runtime acotada — traza capturada.** El **2026-10-16**, en el re-barrido de lecturas
post-siembra, `GET /api/lecciones/{id}/resultados/` respondió **500** para **A1**, **A2** y **A8**. Esta
vez la respuesta **retuvo la traza**, que **localiza** la causa que §9 no había establecido. **Registro
sólo: no hay fix propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Traza** | `NameError: name 'primary_unit' is not defined` |
| **Localización** | `apipoligono/views.py:882` — se invoca `primary_unit(usuario)[1]`; el nombre disponible es `get_primary_unit`, no `primary_unit` |
| **Condición de disparo** | Crashea **solo cuando hay resultados que renderizar**: el `NameError` ocurre dentro del bucle `for resultado in resultados:`. La lección **sin** resultados → **200** (observado con la lección sembrada, id **2**, en A3–A7); las lecciones **con** resultados → **500** (A1/A2/A8). Coherente con que §9 solo viera un 500 sobre la lección **1** (con resultados) |
| **Naturaleza** | **Fallo de servidor** en una lectura; **no** es denegación |
| **Efecto en la matriz** | `OP-LES-009` A1/A2/A8: **3** celdas siguen `NOT_EXERCISED` por este 500; A3–A7 **sí** certifican (leen la lección sin resultados) |
| **No confundir con** | **§8** (`500` de `POST /api/consumos-municion/`): distinto endpoint, método y familia |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-16/seed-dev-content-and-post-seed-sweep.md`](../specs/final-frontend/evidence/2026-10-16/seed-dev-content-and-post-seed-sweep.md) §5.1 · [`../specs/final-frontend/evidence/2026-10-16/read-sweep-2026-10-16.post-seed.json`](../specs/final-frontend/evidence/2026-10-16/read-sweep-2026-10-16.post-seed.json) |

> 🕯️ Esta nota **consigna** la traza y su localización; **no** propone ni aplica reparación, **no**
> modifica backend ni contratos y **no** altera el registro previo de §9, que se conserva intacto.

---

## 10. Baja de cuenta y residuo de `identity.Person` (2026-10-14)

📜 **Lectura de código estática e inferencia — NO verificada en runtime.** Lo consignado aquí **no**
fue observado por el cliente: no es visible desde la interfaz y no se consultó la base de datos.
**Registro sólo: no hay fix propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Observación de código** | El alta formal de cuenta ejecuta `Person.objects.get_or_create(document_id=user.rut, …)` en [`apipoligono/views.py:298-305`](../../apipoligono/views.py); la cuenta se enlaza a esa persona con `Account.person`, que es `ForeignKey(Person, on_delete=models.PROTECT)` en [`apps/identity/models.py:33`](../../apps/identity/models.py) |
| **Consecuencia inferida** | La baja de la **cuenta** (`DELETE /api/usuarios/{id}/`) **no** alcanza a la `Person`: `PROTECT` impide el borrado en cascada y **no** se observa ningún `post_delete` que la retire. Puede quedar una fila `identity.Person` **residual** |
| **Accesibilidad desde el cliente** | Esa fila residual quedaría **inaccesible** desde el cliente: no se expone en las superficies de identidad ejercitadas en la corrida |
| **Naturaleza** | **Lectura de código estática** más **inferencia** del efecto. **No** es un fallo reproducido ni una respuesta HTTP observada. **No** se verifica en runtime aquí |
| **Qué NO se afirma** | No se afirma que **toda** baja deje residuo, ni el número de filas, ni el estado de la base. **No** se atribuye mala práctica ni se emite diagnóstico de diseño |
| **Alcance del registro** | Observación acotada al flujo de **alta formal**; no se extiende a otras vías de creación de `Person` (comandos de gestión o `provision_development_accounts`) |

| Observado (código) | No observado / no afirmado |
|---|---|
| El alta formal crea o reutiliza una `Person` por `document_id` | Que esa `Person` quede huérfana en **todas** las bajas: es inferencia sobre estática, no observación |
| `Account.person` es `PROTECT` y no hay `post_delete` que borre la persona | Que exista o no un proceso externo que la retire: **no** se comprobó |
| La interfaz no expone esa fila residual | Que la fila residual no exista: se infiere que **puede** quedar, no que quede en un caso concreto |

**Evidencia de la interfaz (ejercicio que motivó la lectura):**
[`../specs/final-frontend/evidence/2026-10-14/persons-formal-create-ui.json`](../specs/final-frontend/evidence/2026-10-14/persons-formal-create-ui.json),
sección `residue.inferred_residue`, que declara `runtime_verified: false`. Lectura en
[`../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md`](../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md) §5 quater.

> 🕯️ Esta sección **consigna** una inferencia de lectura de código y sus límites. No propone reparación,
> no la autoriza, no modifica backend, contratos ni corpus histórico y **no** atribuye mala práctica.

---

## 11. Baja de puesto (`DELETE /api/posiciones/{id}/`): `500` por `ProtectedError` y puesto indeleble (2026-10-14)

📜 **Respuesta de servidor observada por UI — un caso —, más inferencia de fuente.** El `500` fue
**observado** en la interfaz real; la causa se **infiere** de la fuente. **Registro sólo: no hay fix
propuesto ni aplicado y no se tocó código ni base de datos.**

| | |
|---|---|
| **Observado (UI, 2026-10-14)** | `DELETE /api/posiciones/{id}/` -> **500** desde «Dar de baja → Confirmar baja» sobre un puesto descartable propio. **Un caso**, con el alias **A2** (`tenant_admin`) acreditado por correspondencia privada |
| **Cuerpo del `500` (observado)** | `Cannot delete some instances of model 'Position' because they are referenced through protected foreign keys: 'Assignment.position'` |
| **Causa (inferida de fuente)** | La FK `Assignment.position` es `on_delete=PROTECT`; **cualquier** `Assignment` —aun con `is_active=false`— impide borrar el puesto |
| **Ruta de retiro ausente** | No hay ruta de API para retirar la `Assignment` inactiva: `quitar-holder` sobre un holder inactivo devuelve **404** y no se observó una operación `quitar-asignacion`. La UI no ofrece «Quitar» para un holder inactivo |
| **Consecuencia declarada** | Los **puestos descartables quedan indelebles por UI y por API**: la baja responde `500` y no hay camino alterno desde el cliente |
| **Naturaleza** | El `500` es **respuesta de servidor observada** (1 caso); la causa `PROTECT` y la ausencia de ruta se **infieren** de la fuente. **No** se afirma que toda baja de puesto falle en todos los casos ni el estado de la base |
| **Qué NO se afirma** | No se propone arreglo ni se diagnostica diseño; no se atribuye mala práctica; no se afirma borrado físico alguno |

**Residuo reportado de la corrida.** Tres puestos descartables propios con marcador de turno prefijo
`A2CF` —identificadores **48, 54 y 55**— quedaron **sin poder darse de baja**: la rama quedó
**detenida y reportada**, y **no** se reparó por base de datos. El artefacto declara
`physical_deletion_not_claimed: true`: el `500` **no** acredita ni niega borrado físico, porque no
hubo borrado.

| Observado | Inferido de fuente / no afirmado |
|---|---|
| `DELETE /api/posiciones/{id}/` -> `500` en la UI, **1 caso** (puesto descartable propio) | Que **todo** `DELETE` de puesto dé `500`: se observó un caso; no se generaliza |
| El cuerpo del `500` cita `Assignment.position` como FK protegida | Que la `Assignment` referenciada esté inactiva **siempre**: la corrida la creó y quedó inactiva, pero no se afirma el estado de otras filas |
| La UI no ofrece «Quitar» para el holder inactivo y `quitar-holder` sobre inactivo da `404` | Que no exista **ninguna** vía de backend ajena a la API: no se comprobó fuera del cliente |

**Evidencia de la interfaz (ejercicio que motivó el registro):**
[`../specs/final-frontend/evidence/2026-10-14/a2-core-families-ui.json`](../specs/final-frontend/evidence/2026-10-14/a2-core-families-ui.json),
bloques `operations` (`DELETE /api/posiciones/{id}/` -> `500`), `cleanup.residue` (ids 48, 54 y 55,
prefijo `A2CF`) y `findings` (`ProtectedError`). Lectura en
[`../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md`](../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md) §5 sexies.

> 🕯️ Esta sección **consigna** un rechazo de servidor observado y una inferencia de fuente, con sus
> límites. No propone reparación, no la autoriza, no modifica backend, contratos ni corpus histórico
> y **no** atribuye mala práctica.

### 11.1 El retiro del holder no restaura la borrabilidad: el `500` de baja persiste (2026-10-15)

📜 **Respuesta de servidor observada por UI — un caso, actor A1 —, que acota el alcance de §11.** El `500`
de baja se **reprodujo** en un caso nuevo; esta subsección **no** cierra §11 ni le atribuye una causa nueva.
**Registro sólo: no hay fix propuesto ni aplicado y no se tocó código ni base de datos.**

| | |
|---|---|
| **Observado (UI, 2026-10-15)** | Con el alias **A1** (`super_admin`) acreditado por correspondencia privada, sobre un puesto descartable propio (id **65**, marcador de turno `T11A1HLD…`): `POST /api/posiciones/{id}/asignar-holder/` -> **201**; `POST /api/posiciones/{id}/quitar-holder/{assignment_id}/` -> **200**; `DELETE /api/posiciones/{id}/` -> **500** |
| **Contraste con §11 (2026-10-14)** | En aquel caso la UI **no** ofrecía «Quitar» para el holder inactivo y `quitar-holder` sobre inactivo devolvía **404**. Aquí el holder era **activo** al retirarlo: la fila **sí** ofrecía «Quitar», con confirmación «Quitar holder» |
| **Hecho nuevo** | **El retiro del holder no restaura la borrabilidad**: tras el `200` de `quitar-holder`, el `Assignment` queda **inactivo** y persiste; la FK `PROTECT` sigue bloqueando y la baja del puesto vuelve a responder **500** |
| **Naturaleza** | **Respuesta de servidor observada** (1 caso) más la lectura ya consignada en §11. **No** se afirma que toda baja de puesto falle ni el estado de la base |
| **Residuo propio** | El puesto descartable id **65** (marcador `T11A1HLD…`) queda como residuo propio pendiente; **reportado, no reparado por base** |
| **Evidencia durable** | [`evidence/2026-10-15/v1f-holders-a1.json`](../specs/final-frontend/evidence/2026-10-15/v1f-holders-a1.json) (copia idéntica, `stage: residue`, `credentials_printed_or_persisted: false`) |

| Observado | No observado / no afirmado |
|---|---|
| `201` (asignar), `200` (quitar) y `500` (baja) en una misma corrida de A1 | Que **todo** `DELETE` de puesto dé `500`: se observó **un caso**; no se generaliza |
| La fila del holder **activo** sí ofrece «Quitar» con confirmación | Que la fila del holder **inactivo** también lo ofrezca: en §11 (2026-10-14) no lo ofrecía |
| El `500` de baja reaparece **después** del retiro exitoso del holder | Que la causa sea distinta de la `ProtectedError` ya consignada: **no** se atribuye causa nueva |

> 🕯️ Esta subsección **consigna** un caso nuevo y sus límites, con la lectura de §11. No propone reparación,
> no la autoriza, no modifica backend, contratos ni corpus histórico y **no** atribuye mala práctica.

### 11.2 Cinco puestos nuevos y el contraste que acota §11: el `500` depende de que sobreviva alguna fila `Assignment` (2026-10-16)

📜 **Respuestas de servidor observadas — cinco casos nuevos, actores A4–A8 —, que acotan el alcance de §11.** El `500`
de baja se **reprodujo** en **cinco** puestos descartables nuevos; el contraste con un caso del mismo día **acota la
condición** del bloqueo. Esta subsección **no** cierra §11 ni le atribuye una causa nueva al `500`. **Registro sólo:
no hay fix propuesto ni aplicado y no se tocó código ni base de datos.**

| | |
|---|---|
| **Observado (limpieza del barrido de denegaciones, 2026-10-16)** | Cinco puestos descartables (ids **69–73**, marcadores de turno `T11A4POSD-02`…`T11A8POSD-02`), con una fila `Assignment` de holder aún presente: `DELETE /api/posiciones/{id}/` → **500** con `Cannot delete some instances of model 'Position' because they are referenced through protected foreign keys: 'Assignment.position'` |
| **Contraste con §11.1 (mismo día)** | El puesto descartable **`id` 68** del lote 2b se dio de baja **`204` → `GET` `404`**: sus filas `Assignment` ya habían desaparecido (sus holders se eliminaron en **cascada**). Frente a los **69–73**, que respondieron **500** con las filas presentes |
| **Condición del bloqueo (refinada)** | Basta **una** fila `Assignment` —aun con `is_active=false`— para que la FK `PROTECT` impida la baja; si la cuenta/usuario asociado se elimina en cascada, la fila desaparece y **la baja procede** |
| **Resolución de los cinco** | Tras la baja de los usuarios holder (**204**, cascada), los puestos quedaron libres y se dieron de baja por **ORM de desarrollo** (`manage.py shell`), **única vía directa**: **5 filas borradas, 0 restantes** |
| **Residuo conservado** | El residuo **preexistente** `id` **65** (marcador `T11A1HLDMVABD354P`) se **conservó a propósito** como artefacto de reproducción de §11; su `Assignment` **62** (inactivo, account 20) **sigue vivo** y bloquea su baja |
| **Naturaleza** | **Respuesta de servidor observada** (5 casos) más la lectura de §11/§11.1. **No** se afirma que toda baja de puesto falle en todos los casos ni el estado de la base |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-16/denials-sweep1-cleanup.json`](../specs/final-frontend/evidence/2026-10-16/denials-sweep1-cleanup.json) (limpieza ORM: ids 69–73, residuo 65) · [`denials-sweep1-2026-10-16.json`](../specs/final-frontend/evidence/2026-10-16/denials-sweep1-2026-10-16.json) (`cleanup.POS_A4…POS_A8` → `delete_status` **500**) · [`denials-sweeps.md`](../specs/final-frontend/evidence/2026-10-16/denials-sweeps.md) §6 |

| Observado | No observado / no afirmado |
|---|---|
| `DELETE /api/posiciones/{id}/` → **500** de `ProtectedError` en **cinco** puestos nuevos (ids 69–73), con las filas `Assignment` presentes | Que **todo** `DELETE` de puesto dé `500`: se observaron casos concretos; no se generaliza |
| El puesto **`id` 68** se dio de baja **204** tras desaparecer sus filas por **cascada** | Que la causa del `204` sea distinta de la `ProtectedError` ya consignada: **no** se atribuye causa nueva |
| La baja procede **cuando no sobrevive ninguna** fila `Assignment` (una sola basta para bloquear, aun inactiva) | Que exista o no otra FK protegida que bloquee la baja: **no** se comprobó |
| El residuo `id` 65 sobrevive por su `Assignment` 62, que se **conservó a propósito** | Que se deba dar de baja: se conserva como artefacto de reproducción; **no** fue un descartable de la corrida |

> 🕯️ Esta subsección **consigna** cinco casos nuevos y el contraste que acota la condición de §11, con sus límites.
> No propone reparación, no la autoriza, no modifica backend, contratos ni corpus histórico y **no** atribuye mala
> práctica. Los registros previos de §11 y §11.1 se conservan intactos.

---

## 12. Desajuste entre visibilidad de la UI y autorización del backend (`403` observado por UI) (2026-10-14)

📜 **Observación de desajuste UI/backend — tres actores, tres corridas.** Acciones que la UI **ofrece** a un
actor responden **403** en el backend —y, en el tercer caso, una capacidad de baja **ausente** tanto en la UI
como en el backend—. Se **consigna** lo observado; **no** hay fix propuesto ni aplicado, **no** se decide cuál
de las dos partes debe cambiar y **no** se diagnostica.

**Primer caso observado — `admin_unidad`.** Tres acciones que la UI **ofrece** a `admin_unidad` responden
**403** en el backend.

| | |
|---|---|
| **Observado (UI, 2026-10-14)** | Con el alias **A3** (`admin_unidad`) acreditado por correspondencia privada, la UI ofrece «Crear unidad», «Eliminar» en armas y «Eliminar» en ejercicios; el backend responde **403** en los tres casos |
| **Casos concretos** | `POST /api/organization-units/` -> **403** (desde «Crear unidad»); `DELETE /api/armas/{id}/` -> **403** (desde «Eliminar → Confirmar baja»); `DELETE /api/ejercicios/{id}/` -> **403** (desde «Eliminar → Confirmar baja») |
| **Lecturas que sí permitió el mismo actor** | Detalle de rol, scope y permiso **200**; en cambio `GET /api/authz/role-permissions/` y `GET /api/authz/position-permissions/` -> **403** |
| **Naturaleza** | **Observación de desajuste UI/backend**: la UI muestra la acción y el backend la deniega. **Un actor** (`admin_unidad`) y **una corrida**; **no** se generaliza a otros actores ni a otras superficies |

**Segundo caso observado — `comandante_unidad`.** Una acción que la UI **ofrece** a `comandante_unidad`
responde **403** en el backend.

| | |
|---|---|
| **Observado (UI, 2026-10-14)** | Con el alias **A4** (`comandante_unidad`) acreditado por correspondencia privada, la UI ofrece «Registrar arma» (botón habilitado y formulario abierto); el backend responde **403** |
| **Caso concreto** | `POST /api/armas/` -> **403** (desde «Registrar arma») |
| **Lecturas que sí permitió el mismo actor** | Detalle de rol, scope y permiso **200**; en cambio `GET /api/authz/role-permissions/` y `GET /api/authz/position-permissions/` -> **403** |
| **Naturaleza** | **Observación de desajuste UI/backend**: la UI muestra la acción y el backend la deniega. **Un actor** (`comandante_unidad`) y **una corrida**; **no** se generaliza a otros actores ni a otras superficies |

**Tercer caso observado — `encargado_almacen` (asimetría de permisos del rol).** Aquí la asimetría **no** es
de gating de UI: la UI **no** ofrece la baja y la API responde **403**. La asimetría es de **permisos del
rol**, que permite crear y editar ejercicios pero no borrarlos.

| | |
|---|---|
| **Observado (UI, 2026-10-14)** | Con el alias **A7** (`encargado_almacen`) acreditado por correspondencia privada, A7 **crea** un ejercicio (`POST /api/ejercicios/` -> **201**) pero **no** puede darlo de baja: la UI **no** ofrece «Eliminar» y la API responde **403** |
| **Caso concreto** | `DELETE /api/ejercicios/{id}/` -> **403**; el contexto observado de A7 **no** incluye `delete_exercises` (sí `create_exercises` y `update_exercises`) |
| **Diferencia con los dos casos previos** | En los dos primeros la UI **ofrecía** la acción y el backend la denegaba (desajuste de gating); aquí la UI **no** ofrece la baja y el backend **también** la deniega. La asimetría es de **permisos del rol** (`create`/`update` sin `delete`), **no** de gating de UI |
| **Naturaleza** | **Observación de asimetría de permisos del rol**: la capacidad de baja no existe ni en la UI ni en el backend para A7. **Un actor** (`encargado_almacen`) y **una corrida**; **no** se generaliza a otros actores ni a otras superficies |

| | |
|---|---|
| **Lecturas posibles (no diagnosticadas)** | Puede ser **gating de UI incompleto** (la interfaz no oculta ni deshabilita una acción no autorizada) o **enforcement esperado** del backend (la denegación `403` es el comportamiento previsto y la UI debería reflejarlo). **No** se diagnostica cuál |
| **Qué NO se afirma** | No se propone arreglo; no se decide qué parte debe cambiar; no se atribuye mala práctica; no se afirma que la denegación sea incorrecta ni que la UI esté equivocada |
| **Efecto en la matriz de aceptación** | Las celdas afectadas quedan **`PARTIAL`**, no `OBSERVED_OK`: es un rechazo observado, no el resultado esperado. `expected_by_actor` sigue `NOT_VERIFIED`, de modo que **no** se certifica que la denegación sea el resultado esperado |

**Evidencia de la interfaz (ejercicios que motivaron el registro):**

- Primer caso (`admin_unidad`):
  [`../specs/final-frontend/evidence/2026-10-14/a3-core-families-ui.json`](../specs/final-frontend/evidence/2026-10-14/a3-core-families-ui.json),
  bloques `operations` (`POST /api/organization-units/` -> 403, `DELETE /api/armas/{id}/` -> 403,
  `DELETE /api/ejercicios/{id}/` -> 403, `GET /api/authz/role-permissions/` -> 403,
  `GET /api/authz/position-permissions/` -> 403), `findings` y `limits`. Lectura en
  [`../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md`](../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md) §5 septies.
- Segundo caso (`comandante_unidad`):
  [`../specs/final-frontend/evidence/2026-10-14/a4-core-families-ui.json`](../specs/final-frontend/evidence/2026-10-14/a4-core-families-ui.json),
  bloques `operations` (`POST /api/armas/` -> 403, `GET /api/authz/role-permissions/` -> 403,
  `GET /api/authz/position-permissions/` -> 403), `denials`, `findings` y `limits`. Lectura en
  [`../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md`](../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md) §5 octies.
- Tercer caso (`encargado_almacen`, asimetría de permisos del rol):
  [`../specs/final-frontend/evidence/2026-10-14/a7-core-families-ui.json`](../specs/final-frontend/evidence/2026-10-14/a7-core-families-ui.json),
  bloques `operations` (`POST /api/ejercicios/` -> 201, `DELETE /api/ejercicios/{id}/` -> 403,
  `GET /api/authz/role-permissions/` -> 403, `GET /api/authz/position-permissions/` -> 403),
  `denied_by_backend`, `findings` y `limits`. Lectura en
  [`../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md`](../specs/final-frontend/evidence/2026-10-14/exec-plan-summary.md) §5 terdecies.

> 🕯️ Esta sección **consigna** una observación de desajuste UI/backend, con sus límites. No propone
> reparación, no la autoriza, no decide qué parte debe cambiar, no modifica backend, contratos ni corpus
> histórico y **no** atribuye mala práctica.

---

## 13. Alta de overrides por API: `POST /api/authz/overrides/` responde 500 por doble campo del serializer (2026-10-16)

📜 **Respuesta de servidor observada por API — un caso, actor A1 —, con la traza que localiza la causa.** El
**2026-10-16**, al sembrar las filas RBAC de desarrollo por orden del operador («siembra todo»), el alta de
`UserPermissionOverride` se intentó por **API real** (sesión acreditada de **A1**, `super_admin`):
`POST /api/authz/overrides/` → **500**. El payload inválido había dado **400** previo, de modo que el defecto
**no** depende del payload: **dispara en todo** payload **válido**. **Registro sólo: no hay fix propuesto ni
aplicado y no se tocó código.**

| | |
|---|---|
| **Síntoma** | `POST /api/authz/overrides/` → **500** (payload válido); el payload inválido daba **400** |
| **Traza** | `AssertionError: Unable to create UniqueTogetherValidator for UserPermissionOverride.permission as UserPermissionOverrideSerializer has multiple fields (permission, permission_code) that map to this model field` |
| **Causa localizada** | `UserPermissionOverrideSerializer` en [`apps/authorization/serializers.py:55-75`](../../apps/authorization/serializers.py): `permission_code` declara `source='permission'` (**línea 61**) y `Meta.fields` expone **ambos** campos —`permission` y `permission_code`— (**líneas 67-72**), que mapean al **mismo** campo del modelo |
| **Localización del disparo** | DRF `serializers.py:1601`, durante `is_valid()` → `run_validators()` → `get_unique_together_validators()` |
| **Naturaleza** | **Defecto estructural del serializer**: la construcción de los validadores `UniqueTogether` falla por el **doble campo** con el mismo `source`. **No** es una validación del payload ni una denegación de autorización |
| **Consecuencia** | El alta de override por **API** es **imposible con cualquier payload válido**. Antes de hoy no había observación previa del alta (0 filas en la base); la fila de desarrollo se creó por **ORM de desarrollo**, única vía posible |
| **Separación de origen** | **Distinta** de **§1** (los overrides **no** reflejados en el contexto de UI: otro aspecto, otra ruta) y de la reserva **«TD overrides: alta de override bloqueada por serializer»** de [`runtime-verification-2026-10-06.md:54`](../specs/final-frontend/runtime-verification-2026-10-06.md) —aquélla **no** afirmaba que las requests se ejecutaran ni devolvieran 500—. Aquí el **500** está **observado** y la causa **localizada** en el serializer |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-16/seed-rbac-orm-2026-10-16.json`](../specs/final-frontend/evidence/2026-10-16/seed-rbac-orm-2026-10-16.json) · [`../specs/final-frontend/evidence/2026-10-16/seed-rbac-2026-10-16.json`](../specs/final-frontend/evidence/2026-10-16/seed-rbac-2026-10-16.json) · [`../specs/final-frontend/evidence/2026-10-16/rbac-dev-rows-and-post-rbac-sweep.md`](../specs/final-frontend/evidence/2026-10-16/rbac-dev-rows-and-post-rbac-sweep.md) §3 |

| Observado | No observado / no afirmado |
|---|---|
| `POST /api/authz/overrides/` → **500** con payload válido (1 caso, A1) | Que **toda** alta de esta familia falle en todos los actores: se observó un actor y una corrida |
| El payload **inválido** daba **400** previo | Que el **400** y el **500** compartan causa: son respuestas de validación distintas |
| La traza cita `UserPermissionOverrideSerializer` y el **doble campo** (`permission`, `permission_code`) | Que la corrección deba tocar el cliente o el contrato: **no** se decide qué parte debe cambiar ni se propone arreglo |
| La causa está **localizada** en `serializers.py:55-75` | El resultado de una corrección: **no** se anticipa |

> 🕯️ Esta sección **consigna** una respuesta de servidor observada y su traza localizada, con sus límites.
> No propone reparación, no la autoriza, no modifica backend, contratos ni corpus histórico, y **no** altera
> el registro previo de §1 ni la reserva de `runtime-verification-2026-10-06.md`, que se conservan intactos.

---

## 14. Asignación principal: el helper tirador revienta con `MultipleObjectsReturned` al repetir la operación (2026-10-16)

📜 **Respuesta de servidor observada por API — dos celdas, actor A1 —, con la traza que localiza la causa.** El
**2026-10-16**, en la corrida 1 del lote de fichas de escritura USR, dos celdas de **A1** (`super_admin`) del
mismo descartable fallaron con **500**: `PATCH /api/usuarios/{id}/asignacion-principal/` (`OP-USR-008`) y
`POST /api/usuarios/{id}/quitar-asignacion/{assignment_id}/` (`OP-USR-011`). **Consigna con traza; no hay fix
propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Síntoma** | `PATCH /api/usuarios/{id}/asignacion-principal/` (`OP-USR-008` A1) y `POST /api/usuarios/{id}/quitar-asignacion/{assignment_id}/` (`OP-USR-011` A1) → **500** |
| **Traza** | `MultipleObjectsReturned` al ejecutar `_ensure_tirador_assignment` |
| **Causa localizada** | `Assignment.objects.get_or_create(account=account, position=position, defaults={…})` en [`apipoligono/views.py:118`](../../apipoligono/views.py): el `get` **no puede resolver una única fila** cuando hay **más de una** coincidente para la misma cuenta y posición |
| **Call sites** | [`apipoligono/views.py:391`](../../apipoligono/views.py) (`asignacion-principal`, tras el `PUT`) y [`apipoligono/views.py:530`](../../apipoligono/views.py) (`quitar-asignacion`) |
| **Disparador** | La **segunda creación** de fila tirador para la **misma cuenta + posición** **acumula** filas y `get_or_create(account, position)` revienta. Se **reproduce** con `PUT` → `PATCH` de la asignación principal: el `PUT` crea la fila tirador y el `PATCH` vuelve a pasar por el helper sobre la posición ya poblada |
| **Naturaleza** | **Defecto de idempotencia del helper** (el comentario del propio helper lo declara idempotente): `get_or_create` no tolera duplicados preexistentes. **No** es una denegación de autorización ni una validación del payload |
| **Consecuencia** | La celda objetivo queda en **500** en la corrida que repite la operación; en un descartable **fresco**, donde la operación es la **primera de su tipo**, no acumula y responde **2xx** (así se recuperó en el reintento) |
| **Separación de origen** | **Distinta** de **§2** (validación del destino en escrituras de membership/puesto/unidad) y de **§11** (baja de puesto con `ProtectedError`): aquí el permiso concede la escritura y el helper de rol implícito acumula filas |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-16/usr-writes-batch.md`](../specs/final-frontend/evidence/2026-10-16/usr-writes-batch.md) §5.1 · [`../specs/final-frontend/evidence/2026-10-16/usr-writes-2026-10-16.json`](../specs/final-frontend/evidence/2026-10-16/usr-writes-2026-10-16.json) (`OP-USR-008`/`OP-USR-011` A1 **500**) · `observations.writes_batch_usr_2026_10_16` |

| Observado | No observado / no afirmado |
|---|---|
| `OP-USR-008` (`PATCH`) y `OP-USR-011` (`POST`) de **A1** → **500** con traza `MultipleObjectsReturned` (1 actor, 1 corrida) | Que **toda** operación de esta familia falle en todos los actores: se observó un actor y una corrida; el reintento en descartable fresco respondió **2xx** |
| La causa está **localizada** en `views.py:118` con call sites en `views.py:391`/`:530` | El resultado de una corrección: **no** se anticipa ni se propone |
| El disparador se **reproduce** con `PUT` → `PATCH` de la asignación principal | Que existan **otras** rutas hacia el mismo estado de filas duplicadas: **no** se barrieron |

> 🕯️ Esta sección **consigna** una respuesta de servidor observada y su traza localizada, con sus límites.
> No propone reparación, no la autoriza, no modifica backend, contratos ni corpus histórico.

---

## 15. Desbloqueo de cuenta: `POST /api/usuarios/{id}/desbloquear/` responde 500 por `NameError: AccessAttempt` (2026-10-16)

📜 **Respuesta de servidor observada por API — dos celdas, actores A1 y A2 —, con la traza que localiza la causa.** El
**2026-10-16**, en la corrida 1 del lote de fichas de escritura USR, la celda `OP-USR-016`
(`POST /api/usuarios/{id}/desbloquear/`) respondió **500** para **A1** (`super_admin`) y **A2**
(`tenant_admin`). El defecto **no** es de autorización: el `500` llega con el permiso `update_users` ya
concedido. **Consigna con traza; no hay fix propuesto ni aplicado y no se tocó código.**

| | |
|---|---|
| **Síntoma** | `POST /api/usuarios/{id}/desbloquear/` (`OP-USR-016` A1 y A2) → **500** |
| **Traza** | `NameError: name 'AccessAttempt' is not defined` |
| **Causa localizada** | El método `desbloquear` usa `AccessAttempt` en [`apipoligono/views.py:715`](../../apipoligono/views.py) **sin** el import: `from axes.models import AccessAttempt` **existe** en [`apipoligono/views.py:684`](../../apipoligono/views.py) (método `estado_bloqueo`), pero es un import **local a ese método** y **falta** en `desbloquear` |
| **Naturaleza** | **Nombre no definido** en tiempo de ejecución: la vista alcanza la línea y falla antes de responder. **No** es una denegación de autorización ni una validación del payload |
| **Consecuencia** | `desbloquear` **no puede** ejecutarse sobre una cuenta con intentos fallidos registrados; la celda `OP-USR-016` queda bloqueada en A1/A2 (y A3 sin reintento, por el mismo defecto declarado en el `excluded` del reintento) |
| **Sesgo de camino** | El import está **dentro** de `estado_bloqueo` (método hermano); `desbloquear` lo **omite** — el defecto es del camino, no del import inexistente en el módulo |
| **Separación de origen** | **Distinta** de **§14** (acumulación de filas tirador): aquí el helper no interviene; falla el propio cuerpo de `desbloquear` |
| **Evidencia durable** | [`../specs/final-frontend/evidence/2026-10-16/usr-writes-batch.md`](../specs/final-frontend/evidence/2026-10-16/usr-writes-batch.md) §5.2 · [`../specs/final-frontend/evidence/2026-10-16/usr-writes-2026-10-16.json`](../specs/final-frontend/evidence/2026-10-16/usr-writes-2026-10-16.json) (`OP-USR-016` A1/A2 **500**) · `observations.writes_batch_usr_2026_10_16` |

| Observado | No observado / no afirmado |
|---|---|
| `OP-USR-016` de **A1** y **A2** → **500** con traza `NameError: AccessAttempt` (2 actores, 1 corrida) | Que la celda falle **siempre**: se observó con intentos fallidos registrados; no se probó el camino sin filas `AccessAttempt` (que sale por el `200` temprano) |
| La causa está **localizada** en `views.py:715` (import ausente en `desbloquear`, presente en `estado_bloqueo`, `views.py:684`) | El resultado de una corrección: **no** se anticipa ni se propone |
| `OP-USR-016` A3 quedó **404** en la corrida 1 y **no** se reintentó (declarado en el `excluded` del reintento 1) | La causa precisa del **404** de A3 en esa corrida: **no** se afirma (naturaleza de alcance del descartable, sin causa precisa establecida) |

> 🕯️ Esta sección **consigna** una respuesta de servidor observada y su traza localizada, con sus límites.
> No propone reparación, no la autoriza, no modifica backend, contratos ni corpus histórico.

---

## Reservas ya registradas en documentación existente (citadas, no duplicadas)

| Reserva | Ancla | Nota |
|---|---|---|
| `DELETE /poligonos/{id}/` **restringido**, sin mapa `range:delete` | [operations.md:50](../specs/final-frontend/coverage/operations.md) · [shooting.md:17](../specs/final-frontend/requirements/shooting.md) (R-DOM-SHT-003) | No es bug frontend: el cliente no ofrece la acción. **No** actualizar esas specs en este encargo |
| **B-01** detalle de resultados | [operations.md:65](../specs/final-frontend/coverage/operations.md); hipótesis en [spec-meta.yaml:130-133](../specs/final-frontend/spec-meta.yaml) | `NameError` sospechado, **no** comprobado en runtime. Reservado documentalmente, **no** revalidado hoy como capacidad actual |
| **D-02** transferencias de stock / validación de resultados / edición del catálogo de permisos | [operations.md:39, 88, 117](../specs/final-frontend/coverage/operations.md); decisión abierta en [spec-meta.yaml:101-104](../specs/final-frontend/spec-meta.yaml) | Capacidades sin endpoint: se reportan, no se simulan. **Documentadas**, no revalidadas hoy como capacidad actual |
| **G-SES-1** recarga profunda con sesión viva | [operations.md:230](../specs/final-frontend/coverage/operations.md) | Exige recaptura de tenant en `/contexto` |
| TD overrides: alta de override bloqueada por serializer | [runtime-verification-2026-10-06.md:54](../specs/final-frontend/runtime-verification-2026-10-06.md) | Destino reportado `apps/authorization/serializers.py`; **no** se afirma que las requests se ejecutaran ni devolvieran 500 |
| TD captura (tiradores vacíos) y TD calibre (`IntegrityError`) | [runtime-verification-2026-10-06.md:52-53](../specs/final-frontend/runtime-verification-2026-10-06.md) | Ver la sección de separación de abajo. Ya abiertos en [td-first-result-capture-history.md](./td-first-result-capture-history.md) y [td-ammo-consumption-calibre-create.md](./td-ammo-consumption-calibre-create.md) |
| Contrato de apariencia 8 ejes | Contrato actual **sí consumido** por el cliente: el endpoint `design-system` existe y **no** hay hueco | La nota de [backend-contracts.md:7](../specs/final-frontend/backend-contracts.md) que lo daba por no registrado en `apipoligono/urls.py:64-95` queda **desactualizada**; no se corrige aquí (fuera del write set) |

---

## Separación de origen: observaciones estáticas (2026-10-11) vs. bloqueos runtime históricos (2026-10-06)

Estas dos clases **no** se mezclan y **no** se revalidaron hoy.

| | Observaciones estáticas de hoy (2026-10-11) | Bloqueos runtime históricos (2026-10-06) |
|---|---|---|
| Origen | Lectura dirigida de código en este diagnóstico | Ejecución autónoma registrada en [runtime-verification-2026-10-06.md](../specs/final-frontend/runtime-verification-2026-10-06.md) |
| Naturaleza | Hechos de lectura: código estático | Respuestas HTTP observadas en esa fecha |
| Entradas | §1 a §6 de este fichero | Tiradores vacíos (`:52`) e `IntegrityError` de calibre (`:53`) |
| Estado hoy | Vigentes como observación de código | **No re-probados el 2026-10-11.** No se declaran resueltos ni vigentes por inferencia |

Sobre los bloqueos históricos: la captura con `GET .../tiradores/` en 200 y ambos
arreglos vacíos, y el `IntegrityError` de calibre en consumo, son **observaciones de
runtime del 2026-10-06**; su estado actual **no** se comprueba aquí y no se infiere.
Sobre overrides, la nota original **no** afirma que las requests se ejecutaran y
devolvieran 500: esa reserva se conserva tal cual, sin vagarla hacia una afirmación de
fallo comprobado. Ninguno de esos bloqueos se re-probó el 2026-10-11: no se declaran
resueltos ni vigentes por inferencia, y su estado sigue abierto a comprobación
autorizada.

Las reservas **D-02** y **B-01** están documentadas en la spec y se citan como tales: no
se revalidan hoy como capacidad actual del backend. El contrato actual de apariencia de
8 ejes sí está consumido por el cliente: **no** es un hueco.

---

## Claims descartados deliberadamente

No se registran: umbrales de expiración idle/absoluta «militares»; prescripciones OWASP o
datos externos no investigaados; el envío de código por correo como vulnerabilidad de
«contraseña SMTP»; comportamiento remoto de Iconify o requisito de intranet. No se crea
auditoría de seguridad global, ni `SECURITY.md`, ni se invoca a otros agentes.

## Nota de estado

Este fichero **no** afirma completitud ni funcionamiento del frontend: sólo consigna
deuda backend y reservas vigentes. La fuente funcional definitiva del frontend es el
código, no la documentación histórica.
