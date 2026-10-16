---
spec_meta: "../../spec-meta.yaml"
---

# Tabla global de requisitos — 140 filas (R-DOM · R-SES · R-APAR)

> 📖 Yo conservo aquí el cruce de los 140 requisitos anidados de [requirements/](../requirements/) con tareas y criterios: 92 `R-DOM-*`, 25 `R-SES-*` y 23 `R-APAR-*`. Cada fila lleva su tarea/AC por la convención acordada (§Convenciones en [coverage.md](../coverage.md)) o su **exclusión justificada**. Derivación: los `R-DOM-*` se mapean a tareas de los flujos que los operacionalizan (coincidencia vía OP citadas en el requisito y en el FL desarrollado); los `R-SES-*` globales mapean además a `T-CORE-*`; la personalización de 8 ejes (`R-APAR-*` de la ruta propuesta) queda **separada** del legacy `OP-PRF-001/002` y no se mezcla con él. Los requisitos transversales de la raíz (`R-AUTH-*`, `R-RES-*`, etc.) no forman parte de estos 140 y no se reenumeran. Los IDs `T-*`/`AC-*` son punteros por convención, no artefactos entregados.

## R-DOM-ORG — Organización (17)

Volumen: [requirements/organization.md](../requirements/organization.md).

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-DOM-ORG-001 | T-FL-ORG-001 | AC-OP-UNT-001, AC-OP-UNT-003 | Listado/detalle de unidades = OP principales de FL-ORG-001 |
| R-DOM-ORG-002 | T-FL-ORG-001 | AC-OP-UNT-001, AC-OP-UNT-003 | Rotulado de raíz/`parent_code` sobre las mismas lecturas |
| R-DOM-ORG-003 | T-FL-ORG-002, T-FL-ORG-005, T-FL-ORG-007 | AC-OP-UNT-010 | Selector de unidades elegibles (alta, destino de migración, asignación) |
| R-DOM-ORG-004 | T-FL-ORG-002 | AC-OP-UNT-002 | Alta de unidad |
| R-DOM-ORG-005 | T-FL-ORG-002, T-FL-ORG-003 | AC-OP-UNT-002, AC-OP-UNT-004, AC-OP-UNT-005 | Alta/edición con exclusiones de envío y `400` conservado |
| R-DOM-ORG-006 | T-FL-ORG-002, T-FL-ORG-003, T-FL-ORG-005, T-FL-ORG-009, T-FL-ORG-010, T-FL-ORG-011, T-FL-ORG-012 | AC-OP-UNT-002…006, AC-OP-UNT-008, AC-OP-RCT-002, AC-OP-RCT-004…008 | Regla de familia (denegación explícita) sobre las mutaciones del dominio; la elipsis expande a los IDs individuales de [coverage/operations.md](operations.md) |
| R-DOM-ORG-007 | T-FL-ORG-006 | AC-OP-UNT-009 | Lookup: vacío / sin coincidencias / denegado son estados distintos |
| R-DOM-ORG-008 | T-FL-ORG-004 | AC-OP-UNT-007 | Previsualización con ocho contadores |
| R-DOM-ORG-009 | T-FL-ORG-005 | AC-OP-UNT-008 | `assignments` informado, no reasignado |
| R-DOM-ORG-010 | T-FL-ORG-005 | AC-OP-UNT-008, AC-OP-UNT-010 | Destino de migración: elegibles o padre; raíz exige destino explícito |
| R-DOM-ORG-011 | T-FL-ORG-005 | AC-OP-UNT-008 | Éxito/fallo de `eliminar-con-migracion`; fallo mantiene ST-10 abierta |
| R-DOM-ORG-012 | T-FL-ORG-008 | AC-OP-RCT-001, AC-OP-RCT-003 | Listado/detalle de recintos |
| R-DOM-ORG-013 | T-FL-ORG-009 | AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005 | Alta/edición con campos RO omitidos |
| R-DOM-ORG-014 | T-FL-ORG-009 | AC-OP-RCT-002, AC-OP-RCT-004, AC-OP-RCT-005 | Refresco post-éxito; cancelar descarta sólo lo no enviado |
| R-DOM-ORG-015 | T-FL-ORG-011 | AC-OP-RCT-007 | Agregar unidad a recinto |
| R-DOM-ORG-016 | T-FL-ORG-012 | AC-OP-RCT-008 | Quitar unidad con confirmación |
| R-DOM-ORG-017 | T-FL-ORG-010 | AC-OP-RCT-006 | Eliminación de recinto sin promesa de migración |

## R-DOM-ID — Identidad (19)

Volumen: [requirements/identity-authorization.md](../requirements/identity-authorization.md).

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-DOM-ID-001 | T-FL-IDT-001 | AC-OP-USR-001, AC-OP-USR-003 | Lectura de usuarios: identidad vs asignaciones |
| R-DOM-ID-002 | T-FL-IDT-002, T-FL-IDT-005 | AC-OP-USR-002, AC-OP-USR-004, AC-OP-USR-005 | Alta formal y edición |
| R-DOM-ID-003 | T-FL-IDT-003 | AC-OP-USR-002 | Promoción de temporal por alta formal |
| R-DOM-ID-004 | T-FL-IDT-004 | AC-OP-USR-012 | Alta temporal; RUT existente → error sin duplicado |
| R-DOM-ID-005 | T-FL-IDT-007 | AC-OP-USR-007, AC-OP-USR-008 | Asignación principal: respuesta efectiva manda |
| R-DOM-ID-006 | T-FL-IDT-008 | AC-OP-USR-009 | Desactivación de principal; tirador implícito |
| R-DOM-ID-007 | T-FL-IDT-009 | AC-OP-USR-010 | Alta secundaria: `201` y `200` idempotente |
| R-DOM-ID-008 | T-FL-IDT-010 | AC-OP-USR-011 | Baja de asignación |
| R-DOM-ID-009 | T-FL-PWD-001, T-FL-PWD-002 | AC-OP-USR-013 | Cambio propio/forzado: distinción `old_password` |
| R-DOM-ID-010 | T-FL-PWD-003 | AC-OP-USR-014 | Reseteo a otro con confirmación |
| R-DOM-ID-011 | T-FL-PWD-004, T-FL-PWD-005 | AC-OP-USR-015, AC-OP-USR-016 | Estado de bloqueo y desbloqueo |
| R-DOM-ID-012 | T-FL-IDT-006 | AC-OP-USR-006 | Efecto real `disable_users` |
| R-DOM-ID-013 | T-FL-IDT-011 | AC-OP-POS-001, AC-OP-POS-003 | Puesto vs assignment vs membership |
| R-DOM-ID-014 | T-FL-IDT-012 | AC-OP-POS-002, AC-OP-POS-004, AC-OP-POS-005 | Alta/edición de puesto |
| R-DOM-ID-015 | T-FL-IDT-012 | AC-OP-POS-002, AC-OP-POS-004, AC-OP-POS-005 | `recinto` sólo con scope `todo_recinto` |
| R-DOM-ID-016 | T-FL-IDT-014 | AC-OP-POS-007 | Asignación de holder |
| R-DOM-ID-017 | T-FL-IDT-015, T-FL-IDT-011 | AC-OP-POS-008, AC-OP-POS-009 | Baja de holder e histórico devuelto |
| R-DOM-ID-018 | T-FL-IDT-016 | AC-OP-MEM-001…005 | Administración de membership (lecturas incluidas: «administrar») |
| R-DOM-ID-019 | T-FL-IDT-016, T-FL-IDT-017 | AC-OP-MEM-004, AC-OP-MEM-005, AC-OP-MEM-006 | Primaria/baja: contexto refrescado antes de unidad efectiva |

## R-DOM-AZ — Autorización (10)

Volumen: [requirements/identity-authorization.md](../requirements/identity-authorization.md) §RBAC.

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-DOM-AZ-001 | T-FL-AZ-001, T-FL-AZ-002, T-FL-AZ-003 | AC-OP-ROL-001…006 | Administración de roles |
| R-DOM-AZ-002 | T-FL-AZ-004 | AC-OP-SCP-001, AC-OP-SCP-002, AC-OP-PRM-001, AC-OP-PRM-002 | Catálogos sólo lectura |
| R-DOM-AZ-003 | T-FL-AZ-005 | AC-OP-RPR-001…006 | Matriz rol→permiso; rol de sistema sólo `super_admin` |
| R-DOM-AZ-004 | T-FL-AZ-006 | AC-OP-PPR-001…006 | Matriz puesto→permiso |
| R-DOM-AZ-005 | T-FL-AZ-007, T-FL-AZ-008, T-FL-AZ-009 | AC-OP-OVR-001…006 | Overrides: alta/edición, eliminación y consulta |
| R-DOM-AZ-006 | T-FL-AZ-010 | AC-OP-AZC-001 | Catálogo operativo como ayuda de selección |
| R-DOM-AZ-007 | T-FL-AZ-011 | AC-OP-AZC-002 | Categorías de roles |
| R-DOM-AZ-008 | T-FL-AZ-012 | AC-OP-AZC-003 | Personas por unidad |
| R-DOM-AZ-009 | T-FL-AZ-013 | AC-OP-AZC-004 | Unidades elegibles por persona |
| R-DOM-AZ-010 | T-FL-AUD-001 | AC-OP-AUT-004 | Bitácora de auditoría |

## R-DOM-SHT — Tiro (20)

Volumen: [requirements/shooting.md](../requirements/shooting.md).

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-DOM-SHT-001 | T-FL-SHT-001 | AC-OP-RNG-001, AC-OP-RNG-003 | Listado/detalle de polígonos |
| R-DOM-SHT-002 | T-FL-SHT-002 | AC-OP-RNG-002, AC-OP-RNG-004, AC-OP-RNG-005 | Alta/edición de polígono |
| R-DOM-SHT-003 | T-FL-SHT-003 | AC-OP-RNG-006 | Eliminación restringida: sin mapa `range:delete` |
| R-DOM-SHT-004 | T-FL-SHT-004 | AC-OP-RNG-007 | Lecciones del polígono |
| R-DOM-SHT-005 | T-FL-SHT-004, T-FL-SHT-008 | AC-OP-LES-001, AC-OP-LES-003 | Lecturas de lección: las OP no tienen FL propio (reportado en [coverage.md](../coverage.md) §Observaciones); la presentación queda anclada a sus AC y a los flujos que las muestran |
| R-DOM-SHT-006 | T-FL-SHT-005, T-FL-SHT-006 | AC-OP-LES-002, AC-OP-LES-004, AC-OP-LES-005 | Alta/edición de lección |
| R-DOM-SHT-007 | T-FL-SHT-005 | AC-OP-LES-002 | Alta sin participantes: unidad efectiva devuelta |
| R-DOM-SHT-008 | T-FL-SHT-007 | AC-OP-LES-006 | Eliminación con refresco sólo tras éxito |
| R-DOM-SHT-009 | T-FL-SHT-008 | AC-OP-LES-007, AC-OP-LES-008 | Pestañas fracciones/tiradores sin mezclar datos |
| R-DOM-SHT-010 | T-FL-SHT-009 | AC-OP-LES-009 | Detalle de resultados; reserva B-01 asociada |
| R-DOM-SHT-011 | T-FL-SHT-010 | AC-OP-LES-010 | Resumen rotulado por lección/fecha |
| R-DOM-SHT-012 | T-FL-SHT-011 | AC-OP-LES-011 | Reporte con `aggregate_only` |
| R-DOM-SHT-013 | T-FL-SHT-012 | AC-OP-LES-012 | Tiradores elegibles: sólo retornados |
| R-DOM-SHT-014 | T-FL-SHT-013 | AC-OP-FRC-002, AC-OP-FRC-004, AC-OP-FRC-005 | Alta/edición de fracción |
| R-DOM-SHT-015 | T-FL-SHT-014 | AC-OP-FRC-006 | Eliminación de fracción |
| R-DOM-SHT-016 | T-FL-SHT-015 | AC-OP-FRC-007 | Preparación de captura con selectores reales |
| R-DOM-SHT-017 | T-FL-SHT-016, T-FL-SHT-017 | AC-OP-RES-002, AC-OP-RES-004, AC-OP-RES-005 | Alta/edición de resultado |
| R-DOM-SHT-018 | T-FL-SHT-016, T-FL-SHT-017 | AC-OP-RES-002, AC-OP-RES-004, AC-OP-RES-005 | Unicidades ancladas al selector/carril |
| R-DOM-SHT-019 | T-FL-SHT-019 | AC-OP-FRC-008 | Detalle de fracción; `403` separa captura y detalle |
| R-DOM-SHT-020 | T-FL-SHT-018 | AC-OP-RES-006 | Eliminación sin recálculo local |

## R-DOM-ARM — Armería (12)

Volumen: [requirements/armory.md](../requirements/armory.md).

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-DOM-ARM-001 | T-FL-ARM-001 | AC-OP-ARM-001, AC-OP-ARM-003 | Lectura de armerías |
| R-DOM-ARM-002 | T-FL-ARM-002 | AC-OP-ARM-002 | Alta con unidad inyectada visible |
| R-DOM-ARM-003 | T-FL-ARM-002 | AC-OP-ARM-004, AC-OP-ARM-005 | Edición con `400` al campo |
| R-DOM-ARM-004 | T-FL-ARM-002, T-FL-ARM-003 | AC-OP-ARM-002, AC-OP-ARM-004…006 | Refresco post-éxito y confirmación destructiva |
| R-DOM-ARM-005 | T-FL-WPN-001 | AC-OP-WPN-001, AC-OP-WPN-003 | Lectura de armas |
| R-DOM-ARM-006 | T-FL-WPN-002 | AC-OP-WPN-002 | Alta con selectores reales (armería, calibre) |
| R-DOM-ARM-007 | T-FL-WPN-003 | AC-OP-WPN-004, AC-OP-WPN-005 | Edición por `*_code_write` |
| R-DOM-ARM-008 | T-FL-WPN-002, T-FL-WPN-003 | AC-OP-WPN-002, AC-OP-WPN-004, AC-OP-WPN-005 | Unicidad modelo+serie sin deduplicar |
| R-DOM-ARM-009 | T-FL-WPN-004 | AC-OP-WPN-006 | Eliminación sin transferencia simulada (D-02) |
| R-DOM-ARM-010 | T-FL-CAL-001 | AC-OP-CAL-001, AC-OP-CAL-003 | Catálogo global como selector |
| R-DOM-ARM-011 | T-FL-CAL-002 | AC-OP-CAL-002, AC-OP-CAL-004…006 | Mutación sólo `super_admin`; sin falsificar capacidad |
| R-DOM-ARM-012 | T-FL-CAL-002 | AC-OP-CAL-002, AC-OP-CAL-004…006 | Refresco de selectores dependientes |

## R-DOM-EXC — Ejercicios y consumos (14)

Volumen: [requirements/exercises-consumption.md](../requirements/exercises-consumption.md).

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-DOM-EXC-001 | T-FL-EXC-001 | AC-OP-EJR-001, AC-OP-EJR-003 | Lectura de ejercicios |
| R-DOM-EXC-002 | T-FL-EXC-002 | AC-OP-EJR-002, AC-OP-EJR-004, AC-OP-EJR-005 | Alta/edición |
| R-DOM-EXC-003 | T-FL-EXC-002 | AC-OP-EJR-002 | Unidad efectiva devuelta; sin sintéticos |
| R-DOM-EXC-004 | T-FL-EXC-002 | AC-OP-EJR-002, AC-OP-EJR-004, AC-OP-EJR-005 | Refresco/cancelación |
| R-DOM-EXC-005 | T-FL-EXC-003 | AC-OP-EJR-006 | Eliminación sin cascada prometida |
| R-DOM-EXC-006 | T-FL-CMN-001 | AC-OP-CMN-001, AC-OP-CMN-003 | Lectura sin unidad inyectada |
| R-DOM-EXC-007 | T-FL-CMN-002 | AC-OP-CMN-002, AC-OP-CMN-004, AC-OP-CMN-005 | Alta/edición de consumo |
| R-DOM-EXC-008 | T-FL-CMN-002 | AC-OP-CMN-002, AC-OP-CMN-004, AC-OP-CMN-005, AC-OP-CAL-001 | Calibre de catálogo activo; no deducido |
| R-DOM-EXC-009 | T-FL-CMN-002, T-FL-CMN-003 | AC-OP-CMN-002…006 | Guardado/eliminación sin ceros falsos |
| R-DOM-EXC-010 | T-FL-CAR-001, T-FL-CAR-002 | AC-OP-CAR-001…003 | Lectura de consumos de arma: las OP de lectura no tienen FL propio (reportado); se anclan a sus AC y a los flujos del nivel 2 |
| R-DOM-EXC-011 | T-FL-CAR-001 | AC-OP-CAR-002, AC-OP-CAR-004, AC-OP-CAR-005 | Alta/edición con selectores reales |
| R-DOM-EXC-012 | T-FL-CAR-001 | AC-OP-CAR-002, AC-OP-CAR-004, AC-OP-CAR-005 | Duplicidad consumo+arma al campo |
| R-DOM-EXC-013 | T-FL-CAR-002 | AC-OP-CAR-006 | Eliminación sin stock supuesto |
| R-DOM-EXC-014 | T-FL-WPN-004, T-FL-SHT-016, T-FL-APP-001 | AC-CORE-UI, AC-FL-APP-001 | Regla transversal anti-simulación (D-02): se verifica donde la simulación sería posible — eliminación de arma (transferencia), captura (validación) y apariencia (8 ejes); sin menú/botón hueco (navigation.md §Menú) |

## R-SES — Datos compartidos de sesión (25)

Volumen: [requirements/shared-session-data.md](../requirements/shared-session-data.md). Globales: mapean a `T-CORE-*` y, donde el texto cita flujo, también a su `T-FL-*`.

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-SES-001 | T-CORE-HTTP | AC-CORE-HTTP | Único cliente `fetch` origen `/api` |
| R-SES-002 | T-CORE-HTTP | AC-CORE-HTTP | `credentials: 'include'` |
| R-SES-003 | T-CORE-HTTP | AC-CORE-HTTP | `X-CSRFToken` en métodos no seguros |
| R-SES-004 | T-CORE-HTTP | AC-CORE-HTTP, AC-OP-AUT-001, AC-OP-AUT-005, AC-OP-AUT-006, AC-OP-PRF-001, AC-OP-PRF-002, AC-OP-RCV-001…004 | `X-Tenant-Code` con las exclusiones declaradas (login, logout, `protected/`, preferencias ×2, recuperación ×4) |
| R-SES-005 | T-CORE-SESSION, T-FL-SES-001 | AC-CORE-SESSION, AC-OP-AUT-001 | Tenant sólo de institución real capturada; sin lista ni hardcode |
| R-SES-006 | T-CORE-SESSION | AC-CORE-SESSION | Unidad activa en memoria; reserva G-SES-2 (endpoints con `X-Org-Unit-Code` no declarados) |
| R-SES-007 | T-CORE-SESSION, T-CORE-TYPES | AC-CORE-SESSION, AC-CORE-TYPES, AC-OP-AUT-002 | Forma exacta del contexto; clave `permissions` |
| R-SES-008 | T-CORE-UI, T-CORE-SESSION | AC-CORE-UI | `permissions` como única fuente de visibilidad |
| R-SES-009 | T-CORE-UI | AC-CORE-UI, AC-OP-UNT-009, AC-OP-UNT-010, AC-OP-AZC-001…004, AC-OP-SCP-001, AC-OP-CAL-001, AC-OP-ARM-001 | Catálogos de selección poblados desde OP reales |
| R-SES-010 | T-CORE-HTTP | AC-CORE-HTTP | La API no emite `401`; `403` por contexto |
| R-SES-011 | T-CORE-HTTP, T-CORE-SESSION | AC-CORE-HTTP, AC-FL-SES-006 | F-12 (purga) vs F-02 (denegación con sesión) |
| R-SES-012 | T-CORE-HTTP | AC-CORE-HTTP, AC-FL-APP-004 | `403` en preferencias no cierra sesión automáticamente |
| R-SES-013 | T-CORE-HTTP | AC-CORE-HTTP, AC-OP-AUT-001, AC-OP-AUT-003, AC-OP-RCV-001…004 | `429` con `Retry-After`, sin reintento automático |
| R-SES-014 | T-CORE-HTTP | AC-CORE-HTTP | `404` como error explícito (F-04) |
| R-SES-015 | T-CORE-SESSION | AC-CORE-SESSION | `generation` anti-carrera (ST-08) |
| R-SES-016 | T-CORE-SESSION | AC-CORE-SESSION | Todo en memoria; sin persistencia de navegador ni caché |
| R-SES-017 | T-CORE-SESSION, T-FL-SES-004 | AC-OP-AUT-003 | Recarga dependiente tras cambio de unidad; apariencia se conserva |
| R-SES-018 | T-CORE-HTTP | AC-CORE-HTTP | PII visible en pantalla, no registrada |
| R-SES-019 | T-FL-SES-005, T-CORE-SESSION | AC-OP-AUT-005 | Logout: abortos, purga y defaults incluso si falla |
| R-SES-020 | T-FL-SES-006, T-CORE-SESSION | AC-FL-SES-006 | Expiración: misma purga, destino preservado |
| R-SES-021 | T-FL-PWD-001, T-CORE-ROUTER | AC-OP-USR-013, AC-CORE-ROUTER | `must_change_password`: bloqueo de rutas y distinción `old_password` |
| R-SES-022 | T-CORE-ROUTER | AC-CORE-ROUTER, AC-OP-AUT-002 | Guards esperan al estado `booting` |
| R-SES-023 | T-CORE-ROUTER | AC-CORE-ROUTER | Login con `query.redirect`; deep links tras autenticar |
| R-SES-024 | T-CORE-ROUTER | AC-CORE-ROUTER | Contexto perdido sin bucle; 404 del DS |
| R-SES-025 | T-CORE-ROUTER | AC-CORE-ROUTER | `createWebHistory`; IDs por param, no por query |

## R-APAR — Apariencia, 8 ejes (23)

Volumen: [requirements/appearance.md](../requirements/appearance.md). La ruta de 8 ejes **no es OP** (hecho histórico conservado) y hoy **existe y está consumida** (ocho campos `ds_*` en `apipoligono/models.py:152-159`, migración `0021_design_system_preferences` y rutas `apipoligono/urls.py:85-86`; verificado 2026-10-15): las filas que la consumen dejaron de estar en reserva de propuesta al ejecutarse la excepción acotada (`front/AGENTS.md` §Límites). El legacy `OP-PRF-001/002` queda separado y no se mezcla.

| Requisito | Tarea(s) | Criterio(s) | Derivación / exclusión |
|---|---|---|---|
| R-APAR-001 | T-FL-APP-001, T-FL-APP-002, T-FL-APP-003, T-FL-APP-004 | AC-FL-APP-001…004 | Tratar la ruta como propuesta; hueco reportado, sin parche local. Reserva: propuesta |
| R-APAR-002 | T-FL-APP-008 | AC-OP-PRF-001, AC-OP-PRF-002 | Legacy operativa y separada; sin traducción ni migración |
| R-APAR-003 | T-FL-APP-008 | AC-OP-PRF-002 | Literales `Theme inválido`/`Palette inválida`/`Density inválido` |
| R-APAR-004 | **Exclusión justificada** | — | Restricción sobre la implementación **futura del backend** (campos `ds_*`, migración, endpoints §5.3): no genera tarea de cliente hoy; su cumplimiento se verifica en la spec aprobada y el gate de la excepción acotada, fuera de esta matriz |
| R-APAR-005 | T-FL-APP-002, T-FL-APP-001 | AC-FL-APP-002, AC-FL-APP-001 | 8 ejes con catálogo/defaults de [customizer-catalog.md](../design-system/customizer-catalog.md) (SSOT); sin `orbit` |
| R-APAR-006 | T-FL-APP-002 | AC-FL-APP-002 | Ocho campos exactos en el `PUT`. Reserva: propuesta |
| R-APAR-007 | T-FL-APP-002, T-FL-APP-005, T-CORE-SESSION | AC-FL-APP-002, AC-FL-APP-005, AC-CORE-SESSION | Sin persistencia de navegador para apariencia |
| R-APAR-008 | T-FL-APP-002 | AC-FL-APP-002 | Preview inmediata vía `data-*`; escritura diferida |
| R-APAR-009 | T-FL-APP-002, T-FL-APP-003 | AC-FL-APP-002, AC-FL-APP-003 | Semántica exacta de `apply()` (defaults que eliminan atributo) |
| R-APAR-010 | T-FL-APP-002, T-CORE-UI | AC-FL-APP-002 | Sin densidad inventada ni tokens alterados |
| R-APAR-011 | T-FL-APP-001 | AC-FL-APP-001 | Restauración antes de `ready`. Reserva: propuesta |
| R-APAR-012 | T-FL-APP-002 | AC-FL-APP-002 | Autosave con debounce y una petición en vuelo. Reserva: propuesta |
| R-APAR-013 | T-FL-APP-003 | AC-FL-APP-003 | Reset por `DELETE` idempotente. Reserva: propuesta |
| R-APAR-014 | T-FL-APP-004 | AC-FL-APP-004 | `400`/`403` de la ruta propuesta. Reserva: propuesta |
| R-APAR-015 | T-FL-APP-004 | AC-FL-APP-004 | Fallo de red ≠ «guardar defaults» |
| R-APAR-016 | T-FL-APP-002, T-CORE-UI | AC-FL-APP-002 | `saveState` visible mapeado a ST-* |
| R-APAR-017 | T-FL-APP-005 | AC-FL-APP-005 | Logout/cambio de principal: purga y defaults; nada cruza entre usuarios |
| R-APAR-018 | T-FL-APP-006 | AC-FL-APP-006 | Cambio de unidad conserva preferencias |
| R-APAR-019 | T-FL-APP-007 | AC-FL-APP-007 | Modo público: defaults sin persistencia |
| R-APAR-020 | T-FL-APP-002, T-CORE-UI | AC-FL-APP-002, AC-CORE-UI | Affordances del panel original (teclado, aria, reset, Escape) |
| R-APAR-021 | T-FL-APP-002, T-CORE-UI | AC-FL-APP-002, AC-CORE-UI | Remapeo idempotente de iconos (44 conceptos DS + colección propia) |
| R-APAR-022 | T-FL-APP-002 | AC-FL-APP-002 | Tipografía bajo demanda; atribución `fa7-solid` intacta |
| R-APAR-023 | T-FL-APP-002 | AC-FL-APP-002 | Anuncio de cambio de tema (`darkone:themechange`) |

---

## Verificación de conteo

🕯️ Filas: ORG 17 + ID 19 + AZ 10 + SHT 20 + ARM 12 + EXC 14 = **92 R-DOM** · **25 R-SES** · **23 R-APAR** = **140 requisitos**, todos con tarea/AC o exclusión justificada (única exclusión: R-APAR-004, restricción de backend futuro). Las elipsis de AC expanden a IDs individuales listados en [coverage/operations.md](operations.md). Los `T-*`/`AC-*` son punteros por convención acordada, no artefactos entregados ([coverage.md](../coverage.md) §Estado de los punteros).
