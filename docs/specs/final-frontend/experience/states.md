---
spec_meta: "../spec-meta.yaml"
---

# Estados de experiencia — SSOT

> 📖 Yo registro aquí la fuente única de estados del cliente: los once `ST-*`, sus
> transiciones, los perfiles `P-*` por clase de operación y el mapa que asigna cada una
> de las 162 OP del [inventario](../backend-inventory.md) a su perfil con sus deltas.
> Los flujos de [flows.md](flows.md) y los requisitos citan estos IDs; ningún otro tomo
> redefine estados ni inventa mensajes o APIs para ellos. Las referencias visuales son
> páginas del Design System externo catalogadas en
> [reference-pages.md](../design-system/reference-pages.md); una referencia DS demuestra
> un patrón disponible, no una pantalla implementada.

## Índice

1. [Catálogo de estados (ST-*)](#catálogo-de-estados-st-)
2. [Correspondencia con stores](#correspondencia-con-stores)
3. [Transiciones permitidas](#transiciones-permitidas)
4. [Perfiles de operación (P-*)](#perfiles-de-operación-p-)
5. [Mapa OP → perfil](#mapa-op--perfil)
6. [Prohibiciones de estado](#prohibiciones-de-estado)

---

## Catálogo de estados (ST-*)

| ID | Estado | Significado observable | Disparador de entrada | Referencia visual DS | Prohibición asociada |
|---|---|---|---|---|---|
| ST-00 | `idle` | El recurso aún no se ha solicitado en esta sesión de vista | Montaje sin fetch previo | — | No mostrar datos de sesiones anteriores |
| ST-01 | `loading` | Petición en vuelo; el usuario ve carga explícita | Cualquier fetch emitido | `ui-spinners.html`, `ui-placeholders.html` | No pintar datos parciales ni esqueletos con cifras inventadas |
| ST-02 | `ready` | Respuesta `200` con datos; la vista los representa | Éxito de lectura | familia correspondiente (`tables-*.html`, `ui-card.html`) | No mezclar datos de otra unidad activa (F-08) |
| ST-03 | `empty` | Respuesta `200` con conjunto vacío | Éxito de lectura sin elementos | `ui-placeholders.html` | No confundir con ST-04 ni ST-07; no fabricar registros (R-DAT-01) |
| ST-04 | `error` | Fallo explícito: red, timeout, `400` no asociable a campo, `404`, `5xx` | F-01 global, F-04, F-06 | `ui-alerts.html` | No reintentar en bucle automático; no registrar PII (R-DAT-06) |
| ST-05 | `saving` | Mutación en vuelo; envío deshabilitado contra reenvío concurrente | `POST`/`PUT`/`PATCH`/`DELETE` emitido | `ui-spinners.html`, `ui-progress.html` | Ninguna actualización optimista antes de respuesta |
| ST-06 | `success` | Respuesta de éxito confirmada (`200`/`201`/`204`); visible antes del refresco | Éxito de mutación | `ui-toasts.html`, `ui-badge.html` | No presentar como éxito un fallo de red (F-06) |
| ST-07 | `denied` | `403` de negocio con `detail`; se muestra el literal | F-02 | `ui-alerts.html` | Nunca convertir en «sin datos», en cero ni en cierre de sesión; la excepción de sesión perdida es F-12 |
| ST-08 | `stale` | Respuesta de generación anterior descartada; **no se pinta** | F-07/F-08 (`generation` distinto) | — (estado interno) | Una respuesta tardía no puede marcar ST-06 ni sobrescribir ST-02 vigente |
| ST-09 | `unsaved` | Cambios locales no enviados visibles mientras el formulario está abierto | Edición en curso; autosave de apariencia pendiente | `forms-validation.html`, `ui-badge.html` | Cancelar descarta sólo lo no enviado (F-09); ningún envío silencioso al navegar |
| ST-10 | `destructive-confirm` | Confirmación abierta antes de toda acción destructiva | Eliminaciones y acciones que afectan acceso o credenciales | `ui-modal.html` | No ejecutar sin confirmación (R-RES-24); mostrar el mensaje exacto del backend tras ella |

> 🕯️ `ST-08` es deliberadamente invisible: su única manifestación observable es que
> **nada cambia** en la UI. Es el estado que hace verificable el anti-carrera de
> `technical-design.md` §2.

---

## Correspondencia con stores

Los stores Pinia exponen `status ∈ {idle, loading, ready, empty, denied, error}`
(`technical-design.md` §9). El mapeo es uno a uno donde existe, y los ST adicionales
viven fuera del `status` del store:

| Store `status` | ST | Nota |
|---|---|---|
| `idle` | ST-00 | — |
| `loading` | ST-01 | — |
| `ready` | ST-02 | — |
| `empty` | ST-03 | `empty ≠ error ≠ denied` (§9) |
| `denied` | ST-07 | Proviene de `403` con `detail` |
| `error` | ST-04 | — |

| Estado fuera de `status` | Dónde vive | ST |
|---|---|---|
| Mutación en vuelo | flag de envío del formulario/vista | ST-05 |
| Éxito confirmado | feedback transitorio + refresco | ST-06 |
| Respuesta descartada | `generation` del store (anti-carrera) | ST-08 |
| Formulario dirty | estado local del formulario | ST-09 |
| Confirmación destructiva | estado local del modal | ST-10 |
| Apariencia | `saveState ∈ {idle, dirty, saving, saved, error}` del store `appearance` (§9): `idle`→ST-00, `dirty`→ST-09, `saving`→ST-05, `saved`→ST-06, `error`→ST-04 | ST-09/05/06/04 |

---

## Transiciones permitidas

```text
Lectura:   ST-00 → ST-01 → { ST-02 | ST-03 | ST-04 | ST-07 }
           ST-02/03/04/07 → ST-01 (reintento explícito F-10 o recarga al volver)
Escritura: ST-09 (edición) → ST-05 (envío) → { ST-06 → refresco ST-01→ST-02
                                              | ST-04 (F-01/F-05 por campo, conserva ST-09)
                                              | ST-07 (F-02) }
           ST-09 → ST-00/ST-02 previo (cancelar, F-09: sin petición)
Destructiva: ST-02 → ST-10 → ST-05 → { ST-06 → refresco | ST-04 | ST-07 }
           ST-10 → ST-02 (cancelar; ST-10 permanece abierta si el fallo llega tras confirmar, R-DOM-ORG-011)
Cualquiera: → ST-08 (descarte interno, nunca pintado) → estado vigente anterior
Sesión:    cualquiera → purga → ST-00 (F-07/F-12)
```

Reglas de transición:

1. **Ninguna mutación entra en ST-06 sin respuesta del backend**: el éxito visual es
   posterior a la confirmación, nunca anterior (R-DOM-ARM-004 y equivalentes de familia).
2. **ST-04 por validación (F-01/F-05) no destruye ST-09**: los valores introducidos se
   conservan para corrección.
3. **ST-07 no degrada a ST-03**: una denegación sigue siendo denegación aunque la vista
   quede sin filas que mostrar.
4. **El refresco tras ST-06 re-consulta al backend** (F-10): no se resuelve desde caché
   (`technical-design.md` §13).
5. **ST-08 interrumpe cualquier transición en vuelo**: la respuesta descartada no mueve
   el estado visible.

---

## Perfiles de operación (P-*)

Cada OP del inventario se asigna a exactamente un perfil. El perfil define el conjunto
de estados alcanzables; los deltas por OP se listan en el mapa.

| Perfil | Clases de OP | Estados alcanzables | Reglas |
|---|---|---|---|
| P-READ-LIST | `GET` de listado | ST-00→01→{02, 03, 04, 07} | Sin paginación inventada (R-RES-22): búsqueda/orden/selección en cliente; vacío ≠ error ≠ denegación |
| P-READ-DETAIL | `GET` de detalle y lecturas de acción | ST-00→01→{02, 04, 07}; `404`→ST-04 | Ausencia de campo → `—` (R-RES-23) |
| P-WRITE | `POST`/`PUT`/`PATCH` de recurso | ST-09→05→{06→refresco, 04 por campo, 07} | F-01/F-05 conservan ST-09; F-09 cancelar sin petición; sin optimismo |
| P-DELETE | `DELETE` de recurso | ST-10→05→{06→refresco, 04, 07} | ST-10 obligatorio (R-RES-24); mensaje exacto del backend tras confirmar |
| P-ACTION-WRITE | `@action` de mutación (no `DELETE` de router) | ST-09?→05→{06, 04, 07}; ST-10 cuando la familia la exige | El `?` indica si la acción lleva entradas de formulario; las acciones sin body entran directo en ST-05 tras su ST-10 si aplica |
| P-AUTH | login, select-unit, recuperación, contraseña | ST-01→{06, 04, 07}; ST-05 en envíos | Añade F-03 (`429` con `Retry-After` si viene); F-12 distingue fin de sesión; sin ST-10 salvo reseteo/desbloqueo (credenciales) |
| P-CATALOG-RO | `GET` de catálogos sólo lectura | como P-READ-LIST | Prohibido renderizar escritura (R-DOM-AZ-002) |
| P-INFRA | infraestructura sin pantalla | ninguno | `OP-AUT-006`: sin estado de UI, no es operación de negocio |
| P-APPAR | ruta **propuesta** de apariencia (§5.3) — no es OP | `saveState` mapeado a ST-00/09/05/06/04 | Preview inmediata independiente del backend; ver [flows/appearance.md](flows/appearance.md) |

---

## Mapa OP → perfil

Todas las 162 OP del inventario quedan asignadas. Los deltas citan su fuente; sin delta,
el perfil aplica completo.

### Router estándar (118 OP: 114 CRUD + 4 de sólo lectura)

| Rango OP | Perfil por método | Deltas |
|---|---|---|
| OP-USR-001/003 | P-READ-LIST / P-READ-DETAIL | 003 alimenta el panel de bloqueo vía OP-USR-015 |
| OP-USR-002 | P-WRITE | RUT coincidente con temporal → promoción (F-05 no aplica; ver FL-IDT-003); RUT duplicado formal → F-05 sobre `rut` |
| OP-USR-004/005 | P-WRITE | — |
| OP-USR-006 | P-DELETE | Efecto real (`disable_users`): no asumir borrado físico (R-DOM-ID-012) |
| OP-WPN-001/003 | P-READ-LIST / P-READ-DETAIL | — |
| OP-WPN-002/004/005 | P-WRITE | Unicidad modelo+serie → F-05; update con armory vacío → `400` literal `El arma debe pertenecer a una armoria.` (R-RUL-04) |
| OP-WPN-006 | P-DELETE | Sin simulación de transferencia de stock (R-DOM-ARM-009) |
| OP-RNG-001/003 | P-READ-LIST / P-READ-DETAIL | — |
| OP-RNG-002/004/005 | P-WRITE | — |
| OP-RNG-006 | P-DELETE | **Delta crítico:** sin mapa `range:delete`; la acción no se ofrece disponible por defecto (R-DOM-SHT-003); si se emite y deniega → ST-07 sin ocultar el registro |
| OP-LES-001/003 | P-READ-LIST / P-READ-DETAIL | Tirador puro: rotular alcance restringido (R-RUL-13) |
| OP-LES-002/004/005 | P-WRITE | Alta sin participantes → mostrar unidad efectiva devuelta (R-RUL-05) |
| OP-LES-006 | P-DELETE | Refresco de relaciones sólo tras éxito (R-DOM-SHT-008) |
| OP-FRC-001/003 | P-READ-LIST / P-READ-DETAIL | — |
| OP-FRC-002/004/005 | P-WRITE | Unicidad lección+número → F-05 en `numero_fraccion` |
| OP-FRC-006 | P-DELETE | Sin borrado local de resultados antes del éxito |
| OP-RES-001/003 | P-READ-LIST / P-READ-DETAIL | — |
| OP-RES-002/004/005 | P-WRITE | Tres unicidades (fracción+usuario, fracción+arma, carril no nulo) → F-05 por selector/carril (R-RUL-03) |
| OP-RES-006 | P-DELETE | Sin recálculo local de métricas (R-DOM-SHT-020) |
| OP-ROL-001/003 | P-READ-LIST / P-READ-DETAIL | Lectura IA+TA abierta |
| OP-ROL-002/004/005 | P-WRITE | Sólo TAdmin: sin él, ST-07 (F-02) |
| OP-ROL-006 | P-DELETE | TAdmin; `is_system` visible como advertencia informativa (restricción `super_admin` documentada sólo para RolePermission) |
| OP-SCP-001/002 | P-CATALOG-RO | Sin escritura renderizada |
| OP-OVR-001/003 | P-READ-LIST / P-READ-DETAIL | TAdmin; tenant del account |
| OP-OVR-002/004/005 | P-WRITE | `created_by` fijado por servidor: RO en UI (R-DOM-AZ-005) |
| OP-OVR-006 | P-DELETE | — |
| OP-UNT-001/003 | P-READ-LIST / P-READ-DETAIL | Árbol client-side vía `parent_code`; raíz rotulada (R-DOM-ORG-002) |
| OP-UNT-002/004/005 | P-WRITE | Excluir `id`/`tenant`/`parent_code` del envío (R-DOM-ORG-005) |
| OP-UNT-006 | P-DELETE | Delta: el flujo destructivo canónico pasa por OP-UNT-007/008 (FL-ORG-004/005) |
| OP-RCT-001/003 | P-READ-LIST / P-READ-DETAIL | — |
| OP-RCT-002/004/005 | P-WRITE | `unit_codes`/`unit_count` RO; refresco muestra los retornados (R-DOM-ORG-014) |
| OP-RCT-006 | P-DELETE | Sin promesa de migración de unidades (R-DOM-ORG-017) |
| OP-ARM-001/003 | P-READ-LIST / P-READ-DETAIL | `armas_count` visible (R-RES-12) |
| OP-ARM-002/004/005 | P-WRITE | Update con `organization_unit_code_write` vacío/`null` → `400` al campo (R-DOM-ARM-003) |
| OP-ARM-006 | P-DELETE | Sin promesa de reasignación de armas |
| OP-POS-001/003 | P-READ-LIST / P-READ-DETAIL | Distinguir puesto/assignment/membership (R-DOM-ID-013) |
| OP-POS-002/004/005 | P-WRITE | `recinto` sólo actúa con scope `todo_recinto`: explicación visible (R-DOM-ID-015) |
| OP-POS-006 | P-DELETE | — |
| OP-MEM-001/003 | P-READ-LIST / P-READ-DETAIL | Permiso derivado de `(position, action)` (T-06) |
| OP-MEM-002/004/005 | P-WRITE | Alta exige `assign_positions`; cambio de primaria refresca contexto antes de mostrar unidad efectiva (R-DOM-ID-019) |
| OP-MEM-006 | P-DELETE | Baja exige `revoke_positions` (R-RES-14); no asumir efecto sobre asignación funcional |
| OP-CAL-001/003 | P-CATALOG-RO | Catálogo global; alimenta selectores de armas y consumos |
| OP-CAL-002/004/005 | P-WRITE | Sólo `manage_calibre` + `super_admin`; sin él, lectura sin mutación falsificada (R-DOM-ARM-011) |
| OP-CAL-006 | P-DELETE | Ídem; refresco de selectores dependientes (R-DOM-ARM-012) |
| OP-EJR-001/003 | P-READ-LIST / P-READ-DETAIL | — |
| OP-EJR-002/004/005 | P-WRITE | Alta sin participantes → unidad efectiva retornada; sin sintéticos (R-DOM-EXC-003) |
| OP-EJR-006 | P-DELETE | Sin promesa de cascada (R-DOM-EXC-005) |
| OP-CMN-001/003 | P-READ-LIST / P-READ-DETAIL | Sólo tenant: sin unidad propia ni inyectada (R-DOM-EXC-006) |
| OP-CMN-002/004/005 | P-WRITE | Calibre write resuelve activo; no deducir calibre de tipo/modelo (R-DOM-EXC-008) |
| OP-CMN-006 | P-DELETE | Sin conversión de fallo en ceros (R-DOM-EXC-009) |
| OP-CAR-001/003 | P-READ-LIST / P-READ-DETAIL | Enlaces a detalle sólo con ids/relaciones presentes (R-DOM-EXC-010) |
| OP-CAR-002/004/005 | P-WRITE | Unicidad consumo+arma → F-05 en la relación de arma (R-DOM-EXC-012) |
| OP-CAR-006 | P-DELETE | Sin stock restante supuesto (R-DOM-EXC-013) |
| OP-PRM-001/002 | P-CATALOG-RO | Sólo permisos activos |
| OP-RPR-001/003 | P-READ-LIST / P-READ-DETAIL | TAdmin |
| OP-RPR-002/004/005 | P-WRITE | Rol de sistema sólo `super_admin` (R-RES-20); celda revierte al valor confirmado ante fallo |
| OP-RPR-006 | P-DELETE | Ídem restricción de sistema |
| OP-PPR-001/003 | P-READ-LIST / P-READ-DETAIL | TAdmin; sólo posiciones del tenant |
| OP-PPR-002/004/005 | P-WRITE | Puesto fuera de tenant → `400` sin fila local (R-DOM-AZ-004) |
| OP-PPR-006 | P-DELETE | — |

### Acciones `@action` (27 OP)

| OP | Perfil | Delta |
|---|---|---|
| OP-USR-007/008 | P-ACTION-WRITE | Entradas `{unit_code, role_code, scope_code?}`; la respuesta efectiva manda sobre el formulario (R-DOM-ID-005) |
| OP-USR-009 | P-ACTION-WRITE + ST-10 | Advertir preservación/recreación del tirador implícito (R-RUL-12); mostrar `desactivadas` |
| OP-USR-010 | P-ACTION-WRITE | `201` y `200` idempotente son ambos éxito; mostrar `assignment_id` (R-DOM-ID-007) |
| OP-USR-011 | P-ACTION-WRITE + ST-10 | Advertir restauración de tirador si era la última (R-RUL-12) |
| OP-USR-012 | P-ACTION-WRITE | RUT existente → `400` → F-05 sin duplicado en tabla; rotular «no inicia sesión» (R-DOM-ID-004) |
| OP-USR-013 | P-AUTH | Sin `old_password` cuando `must_change_password` (R-RUL-07); `400 {error}` literal; ST-10 no aplica (no destruye datos) |
| OP-USR-014 | P-AUTH + ST-10 | Reset propio → `400` conservado; confirma antes de enviar (R-DOM-ID-010) |
| OP-USR-015 | P-READ-DETAIL | `last_attempt?` ausente → `—` (R-DOM-ID-011) |
| OP-USR-016 | P-ACTION-WRITE + ST-10 | Refresca estado re-consultando OP-USR-015 |
| OP-RNG-007 | P-READ-DETAIL | Sólo lecciones del mismo tenant del polígono |
| OP-LES-007 | P-READ-DETAIL | Sin mezclar resultados (R-DOM-SHT-009) |
| OP-LES-008 | P-READ-DETAIL | Vacío ≠ error por pestaña |
| OP-LES-009 | P-READ-DETAIL | **Delta crítico:** `403 {detail}` → ST-07 «sin permiso de detalle», ofrecer agregados disponibles sin sustituir detalle por resumen (R-RUL-11, R-DOM-SHT-010); riesgo B-01 → fallo como ST-04 explícito (`requirements.md` §9) |
| OP-LES-010 | P-READ-DETAIL | Cifras rotuladas con lección y fecha; % derivado sólo si `total > 0`, si no `—` (R-DAT-04, `technical-design.md` §10) |
| OP-LES-011 | P-READ-DETAIL | `aggregate_only: true` → no solicitar ni representar los tres desgloses personales/arma (R-DAT-03) |
| OP-LES-012 | P-READ-DETAIL | Sólo usuarios retornados; no convertirse en alta de usuario (R-DOM-SHT-013) |
| OP-FRC-007 | P-READ-DETAIL | Arrays `usuarios`/`armas` como selectores reales; vacío → ST-03 por selector (R-DOM-SHT-016) |
| OP-FRC-008 | P-READ-DETAIL | `403` → captura y detalle separados (R-DOM-SHT-019) |
| OP-UNT-007 | P-READ-DETAIL | Ocho contadores visibles; confirmación final bloqueada hasta correspondencia de unidad (R-DOM-ORG-008) |
| OP-UNT-008 | P-ACTION-WRITE + ST-10 | `assignments` informado, **no** reasignado: advertencia literal (R-DOM-ORG-009, R-RUL-10); raíz sin padre exige destino explícito, mensaje literal `La unidad no tiene padre. Indica target_unit_code para migrar.` (R-RUL-09); fallo mantiene ST-10 abierta (R-DOM-ORG-011) |
| OP-UNT-009 | P-READ-DETAIL | Sólo `results`; búsqueda vacía / sin coincidencias / denegada son estados distintos (R-DOM-ORG-007) |
| OP-RCT-007 | P-ACTION-WRITE | `404` sin relación local (R-DOM-ORG-015); mostrar `unit_count` devuelto |
| OP-RCT-008 | P-ACTION-WRITE + ST-10 | Relación ausente → error explícito, no éxito idempotente (R-DOM-ORG-016) |
| OP-POS-007 | P-ACTION-WRITE | `201` y `200` idempotente ambos éxito; puesto único → consecuencia visible antes (R-DOM-ID-016) |
| OP-POS-008 | P-ACTION-WRITE + ST-10 | Refresca contador, holders e histórico |
| OP-POS-009 | P-READ-DETAIL | Activos e históricos devueltos; sin cronología inferida (R-DOM-ID-017) |

### Rutas explícitas (16 OP de negocio + 1 de infraestructura)

| OP | Perfil | Delta |
|---|---|---|
| OP-AUT-001 | P-AUTH | `400` → mensaje literal del serializer; `429` `auth: 20/min` → F-03 con botón deshabilitado (T-03); institución no validada aquí (FL-SES-001) |
| OP-AUT-002 | P-READ-DETAIL | Estado `booting` de arranque: los guards esperan su resolución (R-ROUTER-06); `403` de tenant → F-12 |
| OP-AUT-003 | P-AUTH | `400` código ausente → F-01; `403` con literales por modo (R-UNIT-02), sin reintento; `429` `unit_selection: 30/min` → F-03; éxito → F-08 completo |
| OP-AUT-004 | P-READ-LIST | `limit` default 100, tope 500; sólo `tenant_admin`/`super_admin`/`auditor`, resto ST-07; vacío sin eventos fabricados (R-DOM-AZ-010); PII no registrada (R-DAT-06) |
| OP-AUT-005 | P-AUTH | Aborto en vuelo (F-07) + purga (R-AUTH-08) incluso si la petición falla |
| OP-AUT-006 | P-INFRA | Sin pantalla ni estado; no es operación de negocio |
| OP-RCV-001…004 | P-AUTH | Pasos 1–2 con respuesta genérica: prohibido inferir existencia de RUT (R-REC-02); `400` en pasos 3–4 permanece en el paso con `mensaje`/`errores[]` literales; código expira a los 5 minutos; `429` → F-03 |
| OP-PRF-001 | P-READ-DETAIL | Legacy `{theme, palette, density}`: no gobierna apariencia visible (`requirements.md` §6) |
| OP-PRF-002 | P-WRITE | Parcial; literales `Theme inválido` / `Palette inválida` / `Density inválido` (R-PREF-02) |
| OP-UNT-010 | P-READ-DETAIL | `admin_unidad` sin permitido muestra todo el tenant pero create valida después: el listado no acredita autorización (R-DOM-ORG-003) |
| OP-AZC-001 | P-READ-DETAIL | Fill de matrices; no sustituye `context.permissions`; acción catalogada ≠ endpoint (R-DOM-AZ-006) |
| OP-AZC-002 | P-READ-DETAIL | Vacío no significa roles fuera de alcance (R-DOM-AZ-007) |
| OP-AZC-003 | P-READ-DETAIL | `400`/`404`/`403` distinguidos (R-DOM-AZ-008); excluye tirador implícito (`technical-design.md` §8) |
| OP-AZC-004 | P-READ-DETAIL | `reason: sin_account \| sin_unidad_personal` como restricción operativa, no lista vacía (R-DOM-AZ-009) |

### Ruta propuesta (no OP)

| Ruta | Perfil | Delta |
|---|---|---|
| `GET\|PUT\|DELETE /me/preferences/appearance/design-system/` | P-APPAR | **Propuesta** de `technical-design.md` §5.3; no registrada en `apipoligono/urls.py` (`backend-inventory.md` §Límites). Ejecutable sólo tras spec aprobada y gate; ver [flows/appearance.md](flows/appearance.md) |

**Cobertura contada:** 118 (router: 114 CRUD + 4 de sólo lectura) + 27 (acciones) + 16
(rutas explícitas de negocio) + 1 (`OP-AUT-006`, infraestructura) = **162 OP** del
inventario asignadas (`backend-inventory.md` §Universo contado), más la ruta propuesta de
apariencia registrada aparte por no ser OP.

---

## Prohibiciones de estado

1. **Ningún estado inventa mensajes ni APIs**: los literales provienen de los contratos;
   lo demás es «mensaje del backend».
2. **ST-03 nunca se usa para ST-07 ni ST-04**: vacío, error y denegación son tres
   estados distintos (`technical-design.md` §9).
3. **Ningún `0` inventado ni dato sintético** para salir de ST-03 (R-RES-23, R-DAT-01).
4. **ST-06 exige respuesta**: ningún flujo entra en éxito por timeout, por optimismo o
   por descarte (F-06, ST-08).
5. **ST-10 es obligatoria antes de toda acción destructiva** y de las acciones que
   afectan credenciales o acceso (R-RES-24; OP-USR-014/016, OP-UNT-008, OP-RCT-008,
   OP-POS-008, OP-USR-009/011).
6. **ST-08 no es reparable por UI**: sólo existe para descartar; si una respuesta tardía
   llega tras purga, se ignora (F-07/F-08).
7. **Ningún estado sobrevive a la purga de sesión**: tras F-12 todo vuelve a ST-00.

> 🕯️ No he ejecutado navegador, servidor ni tests: este registro es especificación
> estática sobre contratos durables. La verificación observable de cada estado queda
> pendiente de autorización y pertenece a `verification.md`, fuera de este write set.
