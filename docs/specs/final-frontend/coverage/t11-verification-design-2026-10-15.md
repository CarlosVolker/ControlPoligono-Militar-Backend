---
spec_meta: "../../spec-meta.yaml"
---

# 💀 T11 — Diseño de pruebas dirigidas para las filas `VERIFICACIÓN FALTANTE` del mapa T1

> 📜 Yo conservo aquí el diseño de pruebas dirigidas de **T11** que produjo `QA-Goblin` el
> **2026-10-15** sobre las **39 filas `VERIFICACIÓN FALTANTE`** del mapa focalizado T1. Es
> transcripción de su informe de diseño, persistida **sin añadir, quitar ni reinterpretar
> afirmaciones**.

> 🕯️ **Esto es diseño, no ejecución.** `QA-Goblin` no levantó runtime, no tocó ninguna
> superficie y no escribió archivos: describió dónde hay que pisar, no que se haya pisado.
> Nadie ha corrido estas pruebas todavía y este documento no se presenta como si se hubiera
> ejecutado nada.

> 📖 **Relación con el mapa.** Las 39 filas `VF` son las de la tabla §1 de
> [`t1-gap-map-2026-10-15.md`](./t1-gap-map-2026-10-15.md). El **estado de ejecución** de este
> diseño no vive aquí arriba: vive en la sección final **«Actualización de ejecución
> (2026-10-15)»**, con el reconteo del mapa y el estado del arnés y de la corrida V0.

**Estado:** `DELIVERED` — diseño de pruebas dirigidas para las filas `VERIFICACIÓN FALTANTE` del mapa T1 (`docs/specs/final-frontend/coverage/t1-gap-map-2026-10-15.md`, §1). Sin runtime, sin archivos, sin auditoría, sin remedios. Esto es diseño, no ejecución: nadie lo ha corrido todavía y no se presenta como si se hubiera tocado una sola superficie.

Antes de nada, tres cosas que el diseño encontró y que no se callan:

1. ⚗️ El mapa decía **32** filas `VF` en §4.1. Recorriendo la tabla §1 con las etiquetas del propio mapa se cuentan **39**: 9 de §1.1, 6 de §1.2, 8 de §1.3, 4 de §1.4, 6 de §1.5 y 6 de §1.6. La etiqueta `VF` aparece en filas que llevan **tres** etiquetas (14, 15, 37), contra la nota «ninguna fila lleva tres» del §4.1. **Se diseñan las 39** y se declara la discrepancia; no se rellena el hueco rebajando filas para cuadrar con un 32. *(Resuelto el 2026-10-15: ver «Actualización de ejecución».)*
2. ⚗️ El arnés de runtime (`runtime-family-sweep.cjs`) que citan todas las evidencias **no está versionado en el repositorio**. Se trata como **prerrequisito P-0**, no como algo dado por hecho. *(Localizado el 2026-10-15: ver «Actualización de ejecución».)*
3. 💣 Las reglas de §Verificación del plan son tajantes: `test:focused` (Vitest 5.0.3) es **sólo para pruebas de código**, y las pruebas de aceptación **hablan con la API real, sin dobles**. Por lo tanto: **estas pruebas no son tests de Vitest**. Son recorridos de UI real con recolección de red, exactamente el patrón de §5 quinquies en adelante. Cualquier Vitest aquí sería un doble y se estaría certificando aire.

---

## ⚗️ Contrato de ejecución (igual para todas las filas)

| Elemento | Definición |
|---|---|
| Runner | Arnés privado de runtime (`runtime-family-sweep.cjs`), **P-0**: debe existir y exponer login-por-UI, navegación, recolección de red y collectors de sólo observación. **Sin cookies fabricadas.** |
| Unidad de prueba | `(fila del mapa, OP, actor, método, ruta de UI, marcador de turno)` |
| Login | `POST /api/auth/login/` **200** por UI + `GET /api/auth/context/` **200** con rol activo → **acreditación del alias por correspondencia privada**. Nunca por `role` en el nombre del test. |
| Actor disponible | A1 `super_admin` (bypass, `get_allowed_unit_ids()→None`), A2 `tenant_admin`, A3 `admin_unidad`, A4 `comandante_unidad`, A5 `oficial_tiro`, A6 `oficial_observador`, A7 `encargado_almacen`, A8 `tirador`. **Se usan como sesiones disponibles; el fundamento de la expectativa es permiso + scope, jamás el alias.** |
| `PUT` y `PATCH` | Filas y celdas **separadas**, sin inferencia mutua (`acceptance-matrix.json`). |
| Marcador | `T11<ALIAS><FAM>` en todo texto libre, p. ej. `T11A2USR-01`, `T11A1UNI-03`. Prefijo **distinto** de `A5CF`/`A6CF`/`A7CF`/`A8CF` de las tandas previas, para no atribuirse residuo ajeno. |
| Barrido | Al cierre de cada tanda: prefijo en **8 familias** (unidades, recintos, puestos, membresías, usuarios, armas, armerías, ejercicios) → **0 coincidencias propias**. |
| Verificación dirigida | `node <arnés> --actor A2 --family users --marker T11A2USR` — **los nombres de flag son propuesta**; P-0 incluye confirmarlos contra el arnés real antes de la primera tanda. No se presentan como existentes. |
| Regla de estado | Toda celda que devuelva algo ≠ esperado se registra `PARTIAL`, nunca `OBSERVED_OK`. `expected_by_actor` sigue `NOT_VERIFIED`: **ninguna** de estas pruebas lo promueve por sí sola. |

---

## FAMILIA 1 — Identidad y acceso (mapa §1.1, filas 1–9) · 9 filas VF

| # | OP | Qué ejercitar por UI real | Resultado observable esperado | Fundamento por actor | Bloqueo |
|---|---|---|---|---|---|
| 1 | `OP-USR-001/002` | Listado `/personas` (lectura) + **alta formal** por formulario propio, con destino de puesto elegido del selector | `GET` **200** con filas **sólo** de `get_allowed_unit_ids()` del actor; `POST` **201**; la respuesta crea `Position`+`Assignment` y el `GET /api/auth/context/` de la cuenta creada muestra rol no privilegiado | lectura `user:read`→`view_personnel_basic`; alta `user:create`→`create_users`; destino acotado por `eligible_target_units()` (unidad personal + 2 ancestros) | — |
| 2 | `OP-USR-004/005/006` | Editor de cuenta: **`PUT` y `PATCH` por separado** sobre campos distintos; baja y `GET` posterior | `PUT` **200**, `PATCH` **200**, cada uno con `GET` de lectura confirmando **sólo** el campo tocado; `DELETE` **204** → `GET` **404**; **el recurso queda desactivado, no borrado** | `user:update`→`update_users`; baja `user:delete`→`disable_users` (efecto = desactivación, `operations.md:18`) | — |
| 3 | `OP-USR-007/008` | Modal de asignación principal: **alta** y **desactivación de primaria previa**, y por separado la variante de **actualización** (`PUT`/`PATCH` de principal) | `POST` **201**; previa **200** y queda `is_active=false`; la cuenta queda con exactamente **una** `is_primary=true`; tras la escritura el contexto primario se reconcilia | escritura vía `position` create/update → `assign_positions` | — (T4 la tenía declarada pendiente; esta prueba la cierra) |
| 4 | `OP-USR-009/010/011` | Panel de asignaciones: **agregar** secundaria, **desactivar** secundaria, **quitar** asignación (la que §5 quater **no** ejercitó) | alta **201**; desactivar **200**; retiro: la UI no ofrece «Quitar» para inactiva ⇒ registrar **ausencia de ruta de retiro por UI**, `404` si se emite, y **no** declararlo éxito | alta `assign_positions`; retiro `revoke_positions`. `OP-USR-011` es ST-10 obligatoria | — (el `404` de retiro en *holders* es fila 7; aquí es asignación) |
| 5 | `OP-USR-013/014/015/016` | Panel de credenciales: cambio y **reinicio** de contraseña, desbloqueo; ST-10 en 014 y 016 | actor sobre **sí mismo** con `user:read_own`→`view_self` **debe** ver la acción; sobre **otro** sólo con `user:update`→`update_users`; `POST` **200** + `GET` posterior del estado de la cuenta | `auth-context.md:35`; propia vs ajena como par de contraste | 🕯️ **espera provisión**: `not_exercised_reasons` dice «Sin recuperación por correo ni actores con `must_change_password=true`». Se diseña igual; corre en cuanto exista un actor con esa bandera mediante alta formal legítima |
| 6 | `OP-POS-001…006` | Puestos: lectura, alta (**A2 no lo ofreció**, el hueco real), `PUT` y `PATCH` por separado, ficha e histórico; baja | lectura `GET` **200** acotada a `Position.organization_unit ⊂ get_allowed_unit_ids()`; alta **201**; `PUT` **200** y `PATCH` **200** con confirmación de lectura; `recinto` **sólo** opera con scope `todo_recinto` — con otro scope, el campo se ignora | `position:read`→`view_unit`; create/update `assign_positions`; delete `revoke_positions` | 💣 **espera arreglo** en la parte `DELETE`: `backend-debt.md:241-280` §11 — `DELETE /api/posiciones/{id}/` → **500 `ProtectedError`**. La prueba queda diseñada y su resultado esperado **es el registro del 500**, no un borrado. **No** se declara fallo del cliente ni del backend |
| 7 | `OP-POS-007/008` | Panel de holders: asignar y cesar, por **la UI** (no por fallback de API como hizo A2) | asignar → **201** con `Assignment.position` presente; cesar holder **activo** → **204**/**200** y desaparece del panel | `assign_positions` / `revoke_positions`; ST-10 en 008 | 💀 **espera arreglo**: §11 — `quitar-holder` sobre holder **inactivo** devuelve **404** y la UI **no** ofrece «Quitar» para inactivos. El caso inactivo queda diseñado como **404 esperado y observado**, sin llamarlo éxito ni llamarlo rotura |
| 8 | `OP-POS-003/009` | Ficha de puesto + histórico, con **A5–A8** entrando (A5, A6, A7, A8 ya tienen celdas parciales) | `GET` **200** para quien tenga `view_unit` y la unidad dentro de su alcance; **404/403 fuera de `get_allowed_unit_ids()`**; el histórico **no** muestra unidades ajenas | `position:read`→`view_unit`; sin cronología inferida (`operations.md:183`) | — |
| 9 | `OP-MEM-001…006` | Membresías: alta (**003 está 8×NE**) por su **formulario propio**, listado, detalle (003), edición y baja | alta **201** con `UnitMembership` visible en su detalle; permisos **derivados de `(position, action)`** — la misma persona puede ver el listado y no poder escribir; baja con `revoke_positions` **no** asume efecto sobre la asignación funcional | permiso derivado de `(position, action)` (`operations.md:189`); «el listado no acredita autorización» es regla de la fila 24, no de esta | — |

**Precondiciones F1.** Dos unidades de prueba en el mismo tenant, con relación ancestro/hijo, y al menos una **fuera** del alcance de un actor no global — para que el contraste permitido/denegado tenga un sujeto real, no inventado. Puestos existentes en ambas. Una sesión por actor, turno a turno: A2 (escritura de puestos y personas), A3 (negativa sobre unidades ajenas), A5/A8 (sólo lectura + negativa). Marcadores `T11A2POS`, `T11A2USR`, `T11A3MEM`, `T11A5POS`, `T11A8USR`.

---

## FAMILIA 2 — Autorización (mapa §1.2, filas 10, 12, 14, 15, 16, 19) · 6 filas VF

| # | OP | Qué ejercitar | Resultado observable esperado | Fundamento por actor | Bloqueo |
|---|---|---|---|---|---|
| 10 | `OP-ROL-001/003` | Catálogo de roles: listado y detalle por los 8 actores | `GET` **200** para quien reúna el permiso de lectura; la matriz ya tiene 8 OK / 7 OK, lo que falta es el **corte por actor** y su fundamento | `IsTenantAdmin` (IA+TA); nunca «es que es admin» | — |
| 12 | `OP-SCP-001/002` | Scopes: listado y detalle, **por separado**; inspeccionar que **no** exista acción de escritura renderizada | `GET` **200** en ambos; **cero** superficies de escritura en la pantalla | sólo lectura, IA+TA; prohibido renderizar escritura (`operations.md:104-105`) | — |
| 14 | `OP-RPR-001…006` | Matriz rol→permiso: **lectura** por los 8 actores, marcando los `403` reales como `PARTIAL` y **no** como esperado; **escrituras** sólo si el operador las autoriza | `GET` **200** para IA+TA; `403` para el resto, con `{detail}` de denegación semántica. Escritura sobre rol de sistema fuera del universo: sólo `super_admin` | IA+TA+`IsTenantAdmin`; `is_system` es advertencia informativa | 🕯️ **espera autorización** para 002–006 (escrituras RBAC excluidas por decisión del operador, §5 septendecies: **cero** en toda la campaña). Se diseña; no se ejecuta sin orden nueva |
| 15 | `OP-PPR-001…006` | Matriz puesto→permiso: lectura por actor; y el caso **puesto fuera de tenant** → `400` sin fila local | `GET` **200** para IA+TA; `403` para el resto; `400` + **cero filas** locales cuando el puesto es ajeno al tenant | mismo fundamento que 14; `operations.md:131` | 🕯️ **espera autorización** en las escrituras 002–006 |
| 16 | `OP-AZC-003` | Pestaña **personas por unidad**: entrar a la pestaña y **comprobar que la consulta se envía** (§5 ter.3 la vio sin consulta), `unit_code` requerido, `include_descendants` en off y en on | `GET` **200** con el subconjunto de la unidad pedida; con descendientes, sólo las unidades del árbol; **el tirador implícito queda excluido** del resultado | `operations.md:248`; `authorization.md:33` | — (esta es la fila que T5 observó como «sin consulta enviada») |
| 19 | `OP-AUT-004` | Auditoría: lectura por actor y **la diferencia entre `403` de backend y contenedor neutral de UI** | `403` salvo `tenant_admin`/`super_admin`/`auditor`; para el resto, distinguir explícitamente «sin request por gating» de «403 del servidor» — **nunca** contar un contenedor neutral como denegación acreditada | `auth-context.md:34`; `operations.md:232`; PII no registrada (R-SES-018) | — |

**Precondiciones F2.** Un rol no global con `unit_code` de una unidad **ajena** y otro de la **propia**; una unidad con descendientes reales. Sesiones A1 y A2 (lectura completa) + al menos una de A3 y A8 (negativa esperada). Marcadores `T11A2AUT`, `T11A8AUT`, `T11A3AUT`.

---

## FAMILIA 3 — Organización (mapa §1.3, filas 20–27) · 8 filas VF

| # | OP | Qué ejercitar | Resultado observable esperado | Fundamento por actor | Bloqueo |
|---|---|---|---|---|---|
| 20 | `OP-UNT-001/002` | Listado de unidades y **alta por UI** — A4 no ofreció el botón, ese es el hueco | `GET` **200** acotado a `get_allowed_unit_ids()`; alta `POST` **201** por quien tenga `create_unit`; en la **raíz** del árbol, `403` para quien no sea admin | `organization_unit:read`→`view_unit`; create→`create_unit`; raíz exige admin | ⚗️ **desajuste conocido**: §12 primer caso — la UI ofrece «Crear unidad» a un actor sin `create_unit` y el backend responde **403**. La prueba registra el desajuste; **no** declara cuál de las dos partes debe cambiar |
| 21 | `OP-UNT-003…006` | Ficha, **`PUT` y `PATCH` por separado**, baja; **preservar el CRUD ya acreditado** en T3 sin re-declararlo | `PUT` **200**, `PATCH` **200**, `GET` confirmando cada uno; `DELETE` **204** → `GET` **404**; unidad fuera de `get_allowed_unit_ids()` → `403`/`404` | `update_unit` / `delete_unit` | — |
| 22 | `OP-UNT-007/008` | Eliminar con migración: previsualización de los **8 contadores**, elección de destino, confirmar; y **el refresco** | `GET …/previsualizar-eliminacion/` **200** con **8/8** contadores; «Confirmar eliminación» **deshabilitado** sin destino y habilitado tras elegir uno válido; `POST …/eliminar-con-migracion/` **200**; el `GET` de ficha posterior da **404**; **cero refrescos antes del `POST`** | `delete_unit`; ST-10; `assignments` se informa pero **no** se reasigna | — (A1 ya lo acreditó entero; lo que falta es el corte por los otros 7 actores) |
| 23 | `OP-UNT-009` | El `lookup` en sus **tres** vistas reales: unidades, armas, ejercicios — la fila que el mapa previo marcó «sin consumidor» | `GET` **200** devolviendo **todas** las unidades activas del tenant, **sin filtro de rama** | `view_unit`; el contrato declara ausencia de filtro (`organization-identity.md`) | — |
| 24 | `OP-UNT-010` | Unidades asignables: abrir los tres formularios consumidores y probar que el selector **se puebla** (hoy 8×NE y sin prueba de que se llene) | `GET` **200**; las opciones corresponden al tenant del actor; **recordatorio explícito**: el listado **no** acredita autorización — quien no tenga el permiso de creación ve las unidades igual, y el `create` valida después | `operations.md:150`; `admin_unidad` sin permiso ve todo el tenant | — |
| 25 | `OP-AZC-004` | Selector de **unidad elegible** en alta de persona y en detalle: con `user_id` requerido, y los dos casos `reason: sin_account` y `reason: sin_unidad_personal` | `GET` **200**; `reason` es una **restricción explícita**, no una lista vacía: se registra el motivo devuelto como tal | `operations.md:249` | — (necesita una cuenta **sin** `UnitMembership`; debe existir de forma legítima, no fabricarse) |
| 26 | `OP-RCT-001…006` | Recintos: lectura; y **la distinción** entre gating de cliente y `403` de backend | `GET` **200** para quien tenga `view_recinto`; **sin** ese permiso el cliente resuelve **fail-closed sin emitir request** — y eso se registra como **restricción de cliente**, explícitamente **no** como `403` | `recinto:read`→`view_recinto`; escritura `manage_recinto` | — (CRUD ya acreditado por A1/A2/A3; no repetir) |
| 27 | `OP-RCT-007/008` | Relaciones del recinto: **agregar unidad** y quitar, en la ficha; y la **relación ausente** | alta de relación → **2xx** y la relación listada; quitar → **204**; **relación ausente → error explícito, NO éxito idempotente** | `manage_recinto`; `404` declarado en `organization-identity.md` | — (16 NE: ninguna tanda escribió relaciones) |

**Precondiciones F3.** Árbol de unidades con profundidad ≥ 2 real (padre + hijo) y una unidad **fuera** del alcance de A3. Un recinto existente con al menos una relación y otro sin ninguna. Marcadores `T11A1RCT`, `T11A2UNI`, `T11A3UNI`, `T11A8UNI`.

---

## FAMILIA 4 — Armería y ejercicios (mapa §1.4, filas 28–31) · 4 filas VF

| # | OP | Qué ejercitar | Resultado observable esperado | Fundamento por actor | Bloqueo |
|---|---|---|---|---|---|
| 28 | `OP-WPN-001…006` | Armas: alta, detalle, **`PUT` y `PATCH` separados**, baja | alta **201** con quien tenga `create_warehouse_records`; `PUT` **200** y `PATCH` **200** con lectura confirmatoria de cada uno; baja **204** → `GET` **404**; la baja **no** promete transferencia de stock (D-02) | `weapon:read`→`view_warehouse`; create/update/delete → `create/update/delete_warehouse_records` | ⚗️ §12: la UI ofrece «Eliminar» a un actor que recibe **403**, y ofrece «Registrar arma» a otro que recibe **403**. Se registra el desajuste, no un veredicto |
| 29 | `OP-ARM-001…006` | Armerías: alta y baja con **otros actores** además del ya acreditado, `PUT` con valores **distintos** a los de la creación, y edición de campos no tocados en el alta | `POST` **201**, `PUT` **200**, `DELETE` **204**; el alta de cada actor **dentro** de `get_allowed_unit_ids()` | `armory:read`→`view_warehouse`; escritura `create/update/delete_warehouse_records`; `OP-ARM-003` sin ruta de detalle propia (integración justificada) | — (`not_exercised_reasons` acota altas/bajas de armerías a A7: el hueco es **otros actores**) |
| 30 | `OP-CAL-001…006` | Calibres: lectura por los 8 actores; y mutación **sólo** por quien reúna `calibre:manage` **y** `super_admin` | `GET` **200** para quien tenga `calibre:read`; la escritura sólo existe en el universo de bypass — el resto **no la ofrece** | `calibre:read`→`view_exercises`; mutación `calibre:manage`→`manage_calibre` **más** `super_admin` (`operations.md:196-200`) | — (el universo de actores queda reducido por contrato: **eso es el resultado**, no una carencia) |
| 31 | `OP-EJR-001…006` | Ejercicios: alta (`POST` **201**), **`PUT` y `PATCH` separados**, y baja — la baja es el nudo | alta **201**, `PUT` **200**, `PATCH` **200** con lectura confirmatoria; baja: la UI **no** ofrece «Eliminar» al actor sin `delete_exercises` y la API responde **403** ⇒ registrar `PARTIAL` | `ejercicio_militar:read`→`view_exercises`; create/update/delete → `create/update/delete_exercises` | ⚗️ §12 tercer caso: asimetría **del rol**, corroborada por la semilla (`init_access_model.py:218-227`: `read`/`create`/`update` sin `delete`). El par crear→no-borrar se ejercita a propósito y su contraste es el resultado |

**Precondiciones F4.** Un par arma↔armería real; un ejercicio existente **dentro** de la unidad del actor; un calibre del catálogo real (nunca uno inventado). Sesiones A7 (escritura de almacén), A2 (escritura amplia), A3 y A4 (contraste denegado ya observado), A8 (sin escritura alguna). Marcadores `T11A7WPN`, `T11A2ARM`, `T11A2EJR`, `T11A3EJR`, `T11A1CAL`.

---

## FAMILIA 5 — Tiro (mapa §1.5, filas 34–38, 40) · 6 filas VF

| # | OP | Qué ejercitar | Resultado observable esperado | Fundamento por actor | Bloqueo |
|---|---|---|---|---|---|
| 34 | `OP-RNG-001/002` | Polígonos: listado y **alta** (002 está 8×NE) | `GET` **200**; alta `POST` **201** para quien tenga `create_shooting_lessons`; el polígono creado aparece con su unidad | `range:read`→`view_unit`; create→`create_shooting_lessons` | — |
| 35 | `OP-RNG-003…007` | Ficha de polígono: detalle, **edición (`PUT` y `PATCH` separados)**, pestañas, lecciones, baja | `GET` **200**; `PUT` **200** y `PATCH` **200** confirmadas por lectura; `OP-RNG-006` **no tiene acción disponible por defecto** (sin mapa `range:delete`) — su ausencia se registra como **restricción de contrato**; `OP-RNG-007` devuelve lecciones **del mismo tenant** | `view_unit` | 💀 la baja de polígono es **restringida por contrato**: no hay prueba «positiva» que exigir, sólo la constatación de que la UI no ofrece la acción |
| 36 | `OP-LES-001/002` | Lecciones: listado y **alta** | `GET` **200** con el alcance restringido de tirador puro **rotulado** como tal; alta **201** con polígono del mismo tenant; «sin lista escrita» agrega la unidad del recurso | `shooting_session:read`→`view_unit`; create→`create_shooting_lessons` | — |
| 37 | `OP-LES-003…012` | Ficha de lección y **las 5 pestañas**: detalle, resumen, participantes (**con descendientes**), fracciones, resultados; `PUT`/`PATCH` de la lección por separado | las 5 pestañas presentes; pestaña de detalle `GET` **200**; `read_summary` `GET` **200**; participantes incluyen descendientes; **`OP-LES-011` (`aggregate_only`) vacía los tres desgloses** personales/arma y eso se comprueba literalmente; `PUT` **200** y `PATCH` **200** | `view_unit` para read y `read_summary`; `403 {detail}` declarado | 💀 **espera arreglo**, parcial: `GET /api/lecciones/{id}/resultados/` → **500** (§9, causa **no** establecida; la UI muestra alerta genérica con «Reintentar pestaña»). Diseño: registrar el `500` como observado y **no** promover la celda de lectura de resultados. **No** se declara rotura de ninguna de las dos partes |
| 38 | `OP-FRC-001…006` | Fracciones: alta, detalle, **`PUT` y `PATCH` separados**, baja, y el **gating de detalle** | alta **201**, `PUT` **200**, `PATCH` **200**, baja **204**; el detalle de resultados (fila 40) sólo para quien tenga scope de detalle | `shooting_fraction:read`→`view_unit`; create/update/delete→`create/update/delete_shooting_lessons` | 💣 48 celdas NE. Su **lectura y escritura de fracciones** son ejercitables; lo que **no** lo es es la rama de **captura** (fila 39, `DB`), que es prerrequisito, no parte de esta fila |
| 40 | `OP-FRC-008` | Detalle de resultados por fracción, **con el gate `can_read_detail`**: un actor con scope de detalle y otro sin él | con `DETAIL_SCOPE_CODES` → `GET` **200**; sin él → **`403 {detail}`**, y la **captura y el detalle permanecen separados** (`operations.md:81`) | `can_read_detail()` sólo con `DETAIL_SCOPE_CODES` (`scope.py:26-31`) | 💣 la lectura de resultados hereda el **500** de la fila 37: el par permitido-vs-denegado del **gate** es ejercitable; el **contenido** del `200` no lo es hasta que se arregle. Se separa: gate sí, payload no |

**Precondiciones F5.** Un polígono, una lección y una fracción reales, con dos unidades en relación para probar `participantes` con descendientes. Un actor con scope `todo_recinto`/detalle y otro con `solo_propio`. Marcadores `T11A1RNG`, `T11A1LES`, `T11A1FRC`, `T11A5FRC`, `T11A8LES`.

---

## FAMILIA 6 — Sesión, recuperación, apariencia, cuenta (mapa §1.6, filas 42–46, 48) · 6 filas VF

| # | OP | Qué ejercitar | Resultado observable esperado | Fundamento por actor | Bloqueo |
|---|---|---|---|---|---|
| 42 | `OP-AUT-001` | Login por UI: **éxito legítimo** y **contraste denegado** (credencial inválida), y `must_change_password` visible | `POST` **200** con `{id_usuario, must_change_password}` y **ningún token**; con credencial incorrecta, denegación **sin** revelar existencia de cuenta | sesión propia, sin `permission_code`; **excluida** de `X-Tenant-Code` (R-SES-004) | — |
| 43 | `OP-AUT-002` | Arranque + guards + `ContextView` + `DashboardView`: recargar en profundidad con sesión viva | el guard deja pasar a las rutas permitidas y devuelve a `/login` a las no permitidas; la recarga profunda **exige recaptura de tenant** en `/contexto` (G-SES-1) | sin permiso propio: es la **fuente** de `permissions[]` y `assignments[]` | — |
| 44 | `OP-AUT-003` | Selección de unidad activa en `SCREEN-CONTEXT`: modo por pertenencia y modo por asignación, y los dos errores | éxito ⇒ el **anti-carrera F-08 completo** (nada de datos privados de otra unidad en el estado); `400` si falta `organization_unit_code`; `403` si no es membresía ni asignación activa | unidad base = `get_primary_unit()` por `UnitMembership` primaria en modo v2 (`scope.py:209-232`) | — (8×NE: nunca se ejercitó; el anti-carrera es lo observable, no el status) |
| 45 | `OP-AUT-005` | Acción de topbar/menú: abrir/cerrar y navegar | la acción aparece y su destino carga `GET` **200**; **excluida** de `X-Tenant-Code` | sesión propia | — |
| 46 | `OP-RCV-001…004` | Recuperación, **los 4 pasos**: correo, código, confirmación; y los errores | respuesta **genérica anti-enumeración** (mismo cuerpo con correo existente y no existente); `400` **permanece en el paso** con `mensaje`/`errores[]` literales; código expira a 5 min | sin permiso propio (`operations.md:235`) | 🕯️ **espera provisión**: **correo** es prerrequisito de entorno declarado (§5 septendecies). 32 celdas NE. Diseño completo; no se ejecuta sin listener SMTP |
| 48 | `OP-PRF-003/004/005` | Apariencia: los **8 ejes**, `GET` inicial, un `PUT` por eje, `GET` confirmatorio, y **reset** `DELETE`; más **aislamiento A→B** y **persistencia tras login** | 8 `PUT` **200** (uno por eje), `GET` con las 8 claves `ds_*` reflejadas en `data-*` de `<html>`, `DELETE` **204**; tras logout/login los valores **persisten**; la cuenta B **no** ve los de A; **cero** escritura en `localStorage`/`sessionStorage` | sin permiso propio; excluido de `X-Tenant-Code` | — (persistir y aislamiento ya acreditados: **no se repiten**; lo que falta es el corte por actor restante y el contraste *valor enviado ≠ valor previo*) |

**Precondiciones F6.** Dos cuentas legítimas de desarrollo (A1 y A8, p. ej.) para el aislamiento A→B; un actor con `must_change_password=true` y un listener SMTP **real** para 46. Marcadores `T11A1PRF`, `T11A8PRF`, `T11A1AUT`.

---

## 💣 Filas que HOY no pueden pasar — diseñadas igual, marcadas

| Fila / OP | Causa | Marca | Qué **no** se declara |
|---|---|---|---|
| 7 · `OP-POS-008` (retiro de holder inactivo) | `backend-debt.md:241-280` §11: `404` y sin ruta de UI | **espera arreglo** | No es defecto del cliente ni del backend; es ausencia de ruta, registrada |
| 37 · `OP-LES-009` (resultados de lección) | §9: `GET` → **500**, causa no establecida | **espera arreglo** | No se atribuye serializer ni excepción; el `500` no se cuenta como `OBSERVED_OK` |
| 40 · contenido del detalle de resultados | Hereda el `500` de 37 | **espera arreglo** (parcial: el **gate** sí se verifica) | El `403 {detail}` del gate es independiente y **sí** se ejercita |
| 5 · `OP-USR-013…016` | sin actores con `must_change_password=true` | **espera provisión** | No se fabrica esa bandera a mano |
| 14/15 · escrituras `002–006` | exclusión del operador (§5 septendecies) | **espera autorización** | No se toca RBAC sin orden nueva |
| 46 · `OP-RCV-001…004` | sin listener SMTP | **espera provisión** | No se inventan códigos de un solo uso |
| Prerrequisitos de familia: 32 (`OP-CMN-002`), 33 (`OP-CAR-001`), 39 (`OP-FRC-007`), 41 (`OP-RES-004/005`) | §7, §7.1, §8 | **espera arreglo** | No son filas VF, pero **bloquean** el tramo de captura: la fila 38 no captura y la fila 40 no promete contenido. Se dice para que nadie lea la familia como «tiro cerrado» |

---

## 💣 Orden de ejecución propuesto

| V | Contenido | Filas | Por qué en ese orden |
|---|---|---|---|
| **V0** | Lectura pura, cero escritura, cero residuo: sesión, contexto, tablas de autorización, selectores, permisos | 10, 12, 14(lectura), 15(lectura), 16, 19, 23, 24, 25, 42, 43, 44, 45 | Si el corte por actor está mal desde la lectura, todo lo demás se interpreta sobre arena. Y no deja nada que limpiar |
| **V1** | Lectura con escritura mínima y residual propio: identidad, organización, armería, ejercicios | 1, 3, 4, 8, 9, 20, 21, 22, 26, 27, 28, 29, 30, 31 | El grueso de las celdas. Cada tanda cierra con su barrido |
| **V2** | Escrituras finas sobre recursos ya creados en V1, con `PUT`/`PATCH` separados y baja | 2, 6(sin la baja), 34, 35, 36, 37(sin resultados), 38 | Depende de V1: no se crea para luego editar |
| **V3** | Apariencia y paridad de opciones; contraste denegado de pares | 48, y los `403` de 26/30/40 | Barato y de alto valor de contrato |
| **V4** | Condicionadas: se ejecutan **sólo** cuando el prerrequisito exista | 5, 46, 7, 40(contenido), 14/15 (escrituras) | Al final, y se marcan, no se esconden |

**Reglas de limpieza y barrido.**
- Un marcador por turno: `T11<ALIAS><FAM>-<NN>` en todo texto libre que el backend acepte (nombres, códigos, referencias).
- Al final de **cada** turno: barrido del prefijo en las **8** familias → **0 coincidencias propias**. Si quedan, el turno se declara **detenido y reportado**, y se limpian en un turno aparte con el actor que pueda —igual que se hizo con el ejercicio 17 de A7.
- 🕯️ Ningún `204`/`404` se convierte en «borrado físico en base». Esa frase no se escribe en ninguna evidencia.
- Nunca re-declarar como nuevo lo que una tanda anterior ya acreditó (CRUD de recintos de A1/A2/A3, `OP-USR-009` de §5 quater, los 8 ejes de A1): se reutiliza como precondición.

**Lo que NO se inventa.** Cero cuentas nuevas de las que no exija el alta formal legítima. Cero registros sembrados por API para «desbloquear» una pantalla — ni siquiera el `POST /api/resultados/` que §7.1 ya usó una vez como herramienta y que la propia deuda marca como «no es una vía legítima de captura». Cero cookies fabricadas. Cero segundo tenant inventado: el aislamiento entre tenants se ejercita **si** existe, y si no, se declara el límite. Cero RBAC tocado sin orden. Cero endpoint forzado: si el backend no expone `delete_range`, `validate_results` o `export`, la prueba **constata la restricción** y no la simula. Cero dato sintético de producto.

---

## 📊 Conteo

| Métrica | Valor |
|---|---:|
| Filas del mapa **diseñadas** | **39** (todas las que llevan la etiqueta `VF`, incluidas las condicionadas) |
| — de ellas, filas de §1.1 identidad | 9 |
| — §1.2 autorización | 6 |
| — §1.3 organización | 8 |
| — §1.4 armería y ejercicios | 4 |
| — §1.5 tiro | 6 |
| — §1.6 sesión/recuperación/apariencia | 6 |
| Operaciones (OP) distintas cubiertas | 39 filas cubren **60 OP** (`OP-USR`, `OP-POS`, `OP-MEM`, `OP-ROL`, `OP-SCP`, `OP-RPR`, `OP-PPR`, `OP-AZC`, `OP-UNT`, `OP-RCT`, `OP-WPN`, `OP-ARM`, `OP-CAL`, `OP-EJR`, `OP-RNG`, `OP-LES`, `OP-FRC`, `OP-AUT`, `OP-RCV`, `OP-PRF`) |
| Ejercitables hoy, sin prerrequisito externo | **31** |
| Marcadas **espera arreglo** | 4 filas (7, 37, 40 parcial, 6 parcial-baja) |
| Marcadas **espera provisión** | 2 filas (5, 46) |
| Marcadas **espera autorización** | 2 filas (14, 15 — sólo su mitad de escrituras) |
| Prerrequisitos externos de familia, **fuera** de las 39 | 4 (32, 33, 39, 41) — declarados, no diseñados |

Nota: `OP-OVR-001…006` es `DB + PA` **sin** `VF`: se documenta como dependencia citada, no como fila propia. Sus escrituras están excluidas y su lectura fail-closed.

---

## Riesgos que quedan sobre la mesa (sin arreglar nada)

- 💀 **La aritmética del mapa**: §4.1 decía 32 filas `VF`; el recorrido contó 39, y hay filas con tres etiquetas contra la nota que decía que ninguna. Persistir «32» como si estuviera verificado sería copiar un número que la propia tabla desmiente. *(Resuelto el 2026-10-15: el mapa fue recontado y corregido.)*
- ⚗️ **`runtime-family-sweep.cjs` no está versionado.** Si no reaparece, **ninguna** de estas 39 filas es ejecutable y el diseño es papel. Es el riesgo nº 1 de este encargo. *(Localizado el 2026-10-15 en caché local: ver «Actualización de ejecución».)*
- 💣 **Varias filas tienen la expectativa partida en dos** (gate vs. contenido, en 40; forma vs. payload, en 28/29). Certificar «todo verde» en esas filas sin notar el corte sería exactamente el tipo de `OBSERVED_OK` inflado que este plan vino a impedir.
- ⚗️ **Las filas 6 y 7 comparten la misma deuda de backend** (§11, `PROTECT`) pero desde superficies distintas; si alguien arregla una y no la otra, el conteo de «espera arreglo» queda desfasado. Se reevalúa fila por fila, no en bloque.
- 🕯️ `expected_by_actor` sigue `NOT_VERIFIED` en las **1320** después de todo esto. Ninguna prueba de este diseño lo cambia. Se dice para que nadie lo prometa al revés.

No se ejecutó nada, no se escribió nada, no se arregló nada. Esto es el mapa de dónde hay que pisar con cuidado.

---

## Actualización de ejecución (2026-10-15)

- **Reconteo del mapa resuelto:** la viñeta §4.1 del mapa T1 fue recontada y corregida (39 `VF` · 23 `RC` · 7 `DB` · 6 `PA` · 4 `DD`; tres filas con tres etiquetas —14, 15 y 37—), con nota fechada en el propio mapa. La constancia del hallazgo se conserva arriba.
- **P-0 localizado:** `runtime-family-sweep.cjs` existe en la caché local (`/.cache/frontend-acceptance/2026-10-13/`), no versionado. El ejecutor de módulos se reconstruyó en `.cache/frontend-acceptance/2026-10-15/run-module.cjs` (con reserva de binario Chromium: los builds instalados 1234/1243 frente al 1247 que espera el paquete de la caché de npx).
- **Humo de cadena completo OK:** login por UI de A1 → `POST /api/auth/login/` **200**, `GET /api/auth/context/` **200**, lecturas de dashboard en **200**, cero errores de página.
- **Corrida V0 en curso** el 2026-10-15 (barrido de lectura multi-actor; evidencia en `.cache/frontend-acceptance/2026-10-15/`).
