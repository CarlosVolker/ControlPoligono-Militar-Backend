---
spec_meta: "./spec-meta.yaml"
spec_id: "spec-development-context-001"
document_role: "canonical"
parent_spec_id: null
related_spec_id: "spec-private-master-helper-001"
status: "approved"
approved_at: "2026-10-05"
verified_at: null
approval_basis: "Dale con todo, no existe produccion ni datos reales"
---

# Spec — Contexto de desarrollo: institución, árbol y puestos faltantes

> 🕯️ **Qué significa `status: approved`.** El operador **ya autorizó** el paso concreto de preparar y crear en DBdev **sólo las filas de contexto que falten** (§1.2, A-1). Esta spec documenta ese paso; **no** crea permisos nuevos y **no** exige una segunda confirmación para el mismo paso. Por separado: esta spec y sus gates, **por sí solos, no autorizan** nada — el constructor acotado debe planificarse, implementarse y revisarse antes de ejecutar esa preparación, y sus límites siguen vigentes (`DC-X-02..07`). Tampoco es veredicto de verificación. El registro canónico vive en [`spec-meta.yaml`](./spec-meta.yaml) de esta carpeta.

## Índice

1. [Objeto y base de aprobación](#1-objeto-y-base-de-aprobación) · 2. [Anclas de fuente](#2-anclas-de-fuente) · 3. [Contrato](#3-contrato-único-constructor-de-faltantes) · 4. [Preflight y preservación](#4-preflight-y-preservación-de-filas-existentes) · 5. [Atomicidad e idempotencia](#5-atomicidad-e-idempotencia) · 6. [Criterios observables](#6-criterios-observables) · 7. [Gates](#7-gates) · 8. [Exclusiones](#8-exclusiones) · 9. [Límites de lo afirmado](#9-límites-de-lo-afirmado)

---

## 1. Objeto y base de aprobación

**1.1 Objeto.** Un **constructor acotado** que crea **exclusivamente** las filas de contexto de receta que falten en la base de desarrollo: institución (`Tenant`), árbol de unidades (`OrganizationUnit`) y puestos (`Position`). Preserva **toda fila existente** y **todos los accesos** ya creados.

**1.1.1 Write boundary, incluida la auditoría.** El conjunto de escritura de este constructor comprende los `INSERT` de `Tenant`, `OrganizationUnit` y `Position` **ausentes**, **más los eventos `auditlog` `CREATE` correspondientes exclusivamente a esas `Position` nuevas**, generados por la propia creación de esas filas y escritos **en la misma transacción**. No es una ampliación a otros efectos: esos eventos son parte inseparable del `INSERT` de cada `Position` nueva y se revierten con él (`DC-R-02`). Todo lo demás sigue fuera: ningún `UPDATE`, `DELETE` ni `upsert`, ninguna escritura sobre filas existentes, ninguna otra escritura de auditoría, y ningún evento de auditoría de `Tenant`, `OrganizationUnit` ni de cualquier otro modelo. La base de esta excepción es la decisión humana `A-5` de §1.2; el límite de `DC-X-06` de §8 queda acotado exactamente en ella y sólo en ella.

**1.2 Base de aprobación (circunscrita).**

| # | Hecho de aprobación | Naturaleza |
|---|---|---|
| A-1 | **Paso ya autorizado por el operador:** pregunta *«¿Autorizas un paso nuevo y acotado para crear el contexto de la receta sólo donde falte, sin reinicializar RBAC ni alterar usuarios o titulares existentes?»* → respuesta literal **«Dale con todo, no existe produccion ni datos reales»**. Autoriza crear **en DBdev sólo las filas de contexto faltantes**, después de los requisitos y gates aplicables de §3 y §7 | Orden humana previa; no requiere nueva confirmación para el mismo paso |
| A-2 | Crear sólo lo faltante de la receta oficial; `reset`, RBAC, usuarios, titulares, asignaciones y membresías quedan fuera | Restricción del operador |
| A-3 | Mapa de constructores oficiales entregado por el especialista de mapa, sesión `ses_ef17a434effeaEbIxoJVC91iHN` | Evidencia técnica upstream; **no** es veredicto de seguridad ni autorización |
| A-4 | Este trabajo es un workstream separado de la spec del auxiliar privado; no altera su alcance | Separación de workstreams |
| A-5 | **Decisión del operador sobre la auditoría de las `Position` nuevas, en su sesión del 2026-10-06.** A la pregunta planteada por el Plan Review Gate del constructor sobre la decisión de riesgo de `D-seguridad-1` —si se mantenía `auditlog` para las `Position` nuevas o se admitía una excepción expresa que limitaba los `INSERT` y excluía los eventos— el operador respondió, en texto literal, **«Conauditoria»**, y ordenó en la misma sesión **menos revisiones y más implementación**. La decisión se interpreta en su sentido fiel: **se conserva `auditlog` para las `Position` nuevas**, no se admite la excepción que suprimía los eventos | Orden humana de sesión; sustituye a la decisión de riesgo que el gate dejó abierta, y **no** es una orden nueva de implementación |

> 🕯️ **Qué autoriza `A-5`, exactamente.** Autoriza **una sola cosa**: que al crear las `Position` **nuevas** de esta preparación se conserven las señales y el registro `auditlog` existentes, de modo que por cada `Position` nueva se produzca su evento `auditlog` `CREATE` dentro de la misma transacción (§1.1.1, §5 `DC-R-02`). En consecuencia, `DC-X-06` de §8 se acota para permitir **esos** eventos y **sólo** ellos.
>
> 🕯️ **Qué NO autoriza `A-5`.** No autoriza ampliar la auditoría a `Tenant`, `OrganizationUnit` ni a ningún otro modelo; ni eventos sobre filas existentes; ni `UPDATE`, `DELETE` ni `upsert`; ni desactivar, reconfigurar, silenciar ni degradar el registro `auditlog` global; ni fabricar eventos manualmente; ni asignar un actor personal a una alta; ni tocar datos personales, usuarios, `MASTER`, titulares, `RBAC` global o credenciales; ni aplicar la excepción en otras bases o entornos. La orden de «más implementación» es una dirección de trabajo, **no** una autorización de ejecución: la separación planificación-ejecución de `DC-X-01` permanece dura.
>
> 📜 **Sobre la numeración de esta fila.** `A-5` es el identificador que esta spec asigna a la decisión; el cuerpo del plan `development-context-audited-create-only` la menciona como «la nueva decisión A-2», que es una **etiqueta de sesión del plan**. **No** es la fila `A-2` de esta tabla, que es la **restricción** original del operador y que se conserva íntegra y sin modificar. Se usó `A-5` y no `A-3` porque `A-3` ya identifica el mapa técnico del especialista de mapa y está citado en §9: registrar aquí una segunda fila `A-3` duplicaría un identificador ya citado por este mismo documento.

> 📜 **El verbo manda.** El verbo de A-1 es *crear*, no *diseñar*: el operador autorizó **crear en DBdev sólo lo que falte** de la receta oficial. Lo que este documento hace es **registrar** ese alcance con sus límites; no lo reduce a diseño ni lo amplía. Sigue **sin** autorizarse: `init_access_model`, `init_permissions`, `--reset`, RBAC global, usuarios, titulares, `Assignment`, `UnitMembership`, datos de negocio simulados, la ejecución del auxiliar privado por agentes y el manejo de credenciales. Y el constructor acotado **aún debe planificarse, implementarse y revisarse** antes de ejecutar esa preparación: la autorización del paso es previa y real, la ejecución del artefacto es posterior (`DC-X-02..07`).

**1.3 Artefacto propuesto, no existente.** Ruta deliberada: `apps/organizations/management/commands/prepare_development_context.py`. Ese archivo **no existe hoy** y nada de este documento lo crea. El algoritmo exacto para completar, la atomicidad y el tratamiento de concurrencia **no se fijan aquí**: los decide el plan posterior y los especialistas.

---

## 2. Anclas de fuente

Todas leídas en el código. Ningún valor se inventa: los nombres, tipos y padres del blueprint se leen del propio código en tiempo de ejecución.

| Ancla | Qué aporta |
|---|---|
| `apps/organizations/management/commands/seed_org_tree.py:9-44` | `DEFAULT_MILITARY_TREE`: `CMD-1` → `DIV-1` → `REG-1` → `BAT-1` → `CIA-A`, con sus `name` y `unit_type` |
| `apps/organizations/management/commands/seed_org_tree.py:58-61` | El comando oficial aborta si el tenant no existe |
| `apps/organizations/management/commands/seed_org_tree.py:74-93` | `upsert_node` usa `update_or_create` y **sobrescribe** `name`, `unit_type`, `parent` e `is_active` en filas existentes |
| `apps/identity/management/commands/seed_positions.py:23-28` | `UNIT_POSITIONS`: `CMTE`/`comandante_unidad`, `S-3`/`oficial_tiro`, `E-3`/`oficial_observador`, `SICE`/`admin_unidad`, todas con scope `unidad_y_descendientes` |
| `apps/identity/management/commands/seed_positions.py:54-69` | `update_or_create` por `(tenant, code)` con `organization_unit`, `role`, `scope_policy` e `is_unique_holder` — el par **rol/scope** que exige revisión de seguridad |
| `apps/identity/management/commands/seed_positions.py:77-94` | Puestos `ENC-{armory.code}` por armería activa, scope `unidad_propia`, `is_unique_holder=True` |
| `apps/tenants/models.py:4-32` | `Tenant`: `code` único, `context='military'`, `is_active` |
| `apps/organizations/models.py:21-36` | `OrganizationUnit`: `parent` `SET_NULL`, `unique_together ('tenant','code')`, `is_active` |
| `apps/identity/models.py:46-122` | `Position`: FKs `PROTECT` a unidad, rol y scope, `unique_together ('tenant','code')`, `is_unique_holder` |
| `apps/identity/management/commands/init_access_model.py:254-261` | El único punto actual que crea `Tenant` es `get_or_create` dentro de `init_access_model`, con efectos globales de RBAC |
| `apps/identity/management/commands/crear_master.py:44-67` | Precondiciones de `Tenant` activo, rol `super_admin` y unidad raíz activa |

> ⚠️ **El mapa del especialista no garantiza preservación.** Que `--from-json` se describe como «sólo faltantes» **no** implica que los padres existentes sobrevivan: `seed_org_tree.py:74-93` sobrescribe. **No invocar ese comando directamente** para cumplir este contrato.

---

## 3. Contrato único: constructor de faltantes

**3.1 Tenant de desarrollo.** Objetivo único: `ejercito-demo`, `context='military'`, `is_active=True`. Se crea sólo si falta. **No** se invoca `init_access_model` ni `init_permissions`, porque sus efectos son globales sobre roles, scopes, permisos y cuentas (§2).

**3.2 Árbol de unidades.** Cinco unidades del blueprint §2, creadas por presencia de ausencia dentro del tenant, con `parent` resuelto de padre a hijo. No se crean unidades fuera del blueprint.

**3.3 Puestos por unidad.** Por cada unidad existente del tenant, los cuatro de `UNIT_POSITIONS` (§2) con su `role`, `scope_policy` e `is_unique_holder` de la receta oficial.

**3.4 Puestos de armería.** `ENC-{armory.code}` **sólo** si esa armería ya existe. Este contrato **no crea armerías**. La producción de filas de armería está en §8.

**3.5 Lo que no se crea.** Nada de `armory`, `negocio`, `lección` ni `datos de resultado`: no se fabrican filas para simular funcionalidad.

**3.6 Prerrequisitos que se comprueban, no se crean.** `Role`, `ScopePolicy` y permisos deben existir y se verifican por **código real**. El conteo histórico `8/5/41` **no prueba el estado actual**: no se reconsultó la base y nada aquí lo afirma.

---

## 4. Preflight y preservación de filas existentes

**4.1 Sin `update_or_create`.** Para cada fila objetivo el constructor distingue tres casos:

| Caso | Condición | Acción |
|---|---|---|
| Ausente | No existe fila para la clave natural | Crear con los valores de la receta oficial |
| Coincide | Existe y es coherente con la receta | **Reutilizar sin escribir**; contabilizar como reutilizada |
| Contradice | Existe pero difiere en estado activo, tipo, `parent`, rol, scope, `unique_holder` o tenant | **Abortar antes de cualquier escritura**, sin normalizar |

**4.2 Preflight completo.** El preflight recorre **todo** el write set y **todas** las restricciones antes de la primera escritura. Si cualquier fila cae en el caso «contradice», el constructor aborta con el total de conflictos, sin tocar la base.

**4.3 Claves naturales.** `Tenant` por `code`; `OrganizationUnit` y `Position` por `(tenant, code)`. En `Position`, `organization_unit` es FK, no unicidad.

---

## 5. Atomicidad e idempotencia

| # | Requisito |
|---|---|
| `DC-R-01` | Orden padre antes de hijo en toda resolución de `parent` |
| `DC-R-02` | Transacción real: o se escribe todo el write set, o nada. El write set incluye los eventos `auditlog` `CREATE` de las `Position` nuevas (§1.1.1, `A-5`): esos eventos se confirman **o revierten** junto con las filas que los originan, sin excepción parcial |
| `DC-R-03` | Conflicto concurrente detectado → reversión completa, sin salida parcial ni código de éxito engañoso |
| `DC-R-04` | Reejecución idempotente: segunda pasada con **cero** inserciones y **cero** actualizaciones |
| `DC-R-05` | Salida en **números y códigos públicos** (creadas, reutilizadas, omitidas). Nunca identidades personales, credenciales ni secretos |
| `DC-R-06` | Ejecución contra base de desarrollo **verificada** en alcance; no expone configuración con secretos ni toca producción |
| `DC-R-07` | No lee datos personales ni conjuntos de usuarios |

---

## 6. Criterios observables

Ninguno se declara cumplido en este documento: son **futuros** y los verifica el orquestador tras una ejecución autorizada.

| # | Criterio observable |
|---|---|
| `DC-V-01` | Las filas faltantes del blueprint existen y son **exactas** en la base de desarrollo |
| `DC-V-02` | Las filas preexistentes conservan su PK y sus campos, sin variación |
| `DC-V-03` | Ante conflicto, rechazo o fallo: **cero** escrituras |
| `DC-V-04` | La reejecución reporta cero nuevas y cero actualizaciones |
| `DC-V-05` | El árbol, los tipos de puesto, los roles y los scopes existen con los valores reales de la receta |

> 📜 **Lo que estos criterios no prueban.** No producen ninguna sesión utilizable ni acceso autenticado. Autenticación, cuentas y titulares viven en otra spec y quedan fuera (§8).

---

## 7. Gates

| Gate | Estado | Motivo |
|---|---|---|
| `security_review` | `required` | `Position` fija `role` y `scope_policy` (`seed_positions.py:54-69`); un rol o scope equivocado cambia el alcance de datos de quien ocupe el puesto |
| `code_review` | `required` | Constructor nuevo con decisiones de escritura y reversión |
| `tests` | `required` | Hay criterios observables que un test automatizado no sustituye. Tests aislados de Django **pueden planificarse**; ningún comando nuevo queda autorizado de forma artificial |
| `documentation` | `required` | Este documento |
| architecture | **no requerido** | Comando pequeño, sin decisión estructural transversal |
| schema / migration | **no requerido** | Sólo se pueblan modelos existentes; no hay `schema` ni migración |

Ningún gate figura en `passed`. Ninguna autorización de este documento se cede a otro gate.

---

## 8. Exclusiones

| # | Excluido |
|---|---|
| `DC-X-01` | Cualquier acción **distinta** del paso ya autorizado en A-1. Este registro **no** habilita por sí mismo la ejecución del constructor de §1.3: ese artefacto debe planificarse, implementarse y revisarse primero. Tampoco autoriza ejecutar el auxiliar privado por agentes ni manejar credenciales |
| `DC-X-02` | Crear o actualizar catálogos RBAC globales; `init_access_model`, `init_permissions`, `--reset` |
| `DC-X-03` | Cuentas, contraseñas, titulares, `Assignment`, `UnitMembership`, `Person` |
| `DC-X-04` | `armory`, dominio de negocio, lecciones, datos de resultado |
| `DC-X-05` | Modelos, migraciones, esquema, permisos nuevos |
| `DC-X-06` | Credenciales, configuración, `.env`, logs. **Única excepción acotada** (`A-5`, §1.1.1): los eventos `auditlog` `CREATE` generados al crear las `Position` **nuevas** de esta preparación, dentro de la misma transacción y revertidos con ella. La excepción **no** alcanza `Tenant`, `OrganizationUnit` ni otros modelos, ni filas existentes, ni ninguna otra escritura de auditoría, ni la desactivación o reconfiguración del `auditlog` global |
| `DC-X-07` | Registros globales, planes padre, metadata e índice de otras specs |

---

## 9. Límites de lo afirmado

- La autorización de A-1 es **real y previa**; este registro **no la reduce a diseño**. `A-5` es una decisión humana **posterior y de alcance**, limitada a la auditoría de las `Position` nuevas; **no** es una orden de implementación ni habilita por sí sola ejecutar el constructor. En cambio, este documento **no implementa** el constructor de §1.3 y **no ejecuta** nada: ninguna escritura en base de datos se afirma efectuada.
- La decisión `A-5` **acota** `DC-X-06`, no lo deroga. El límite sigue excluyendo logs en general; lo único que entra son los eventos `auditlog` `CREATE` de las `Position` nuevas de esta preparación, y su reversión es conjunta (`DC-R-02`). Ningún otro modelo, fila, efecto o entorno queda cubierto.
- El write boundary declarado en §1.1.1 es una **declaración de alcance** acordada, no una verificación: este documento **no** afirma que esos eventos se produzcan, ni cuántas filas se crearán, ni que la base esté preparada.
- El estado de la base de datos es **histórico y no reconsultado**: el conteo `8/5/41` y la ausencia de contexto son referencias previas, no verificaciones actuales.
- El mapa `ses_ef17a434effeaEbIxoJVC91iHN` es **factual**: no es veredicto de seguridad ni autorización (A-3).
- El algoritmo de §1.3, la atomicidad y la concurrencia **no** están decididos aquí: los decide el plan y los especialistas.
- `verified_at` sigue en `null`; el cierre lo emite el orquestador.