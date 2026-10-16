---
spec_meta: "./spec-meta.yaml"
---

# Spec — Promoción completa de usuario temporal (recorrido íntegro en el cable)

> 🕯️ **Spec canónica con `id` y metadata propias.** Este documento es el registro
> completo y único del contrato de promoción completa. Su identidad vive en
> [`spec-meta.yaml`](./spec-meta.yaml) (`spec-complete-promotion-001`) y **no** en la
> metadata de la spec padre: el cuerpo fue reubicado desde
> `docs/specs/final-frontend/complete-promotion-spec.md`, que queda como **puntero
> breve** a esta ruta. Nada se duplica entre ambas rutas.
>
> Lo que aquí se afirma como *aprobado* se limita al alcance expresamente autorizado
> por el operador (§1.2); el resto queda excluido (§11). **Ningún gate está en `passed`,
> `verified_at` sigue en `null` y este documento no autoriza implementación**
> (§1.2, §10.1, §12).

## Índice

1. [Propósito, identificación y alcance aprobado](#1-propósito-identificación-y-alcance-aprobado)
2. [Comportamiento actual verificado](#2-comportamiento-actual-verificado)
3. [Anclas de fuente](#3-anclas-de-fuente)
4. [Contrato propuesto](#4-contrato-propuesto)
5. [Recorrido íntegro de promoción](#5-recorrido-íntegro-de-promoción)
6. [Alcance, tenant y preservación de `Person`/`Account`](#6-alcance-tenant-y-preservación-de-personaccount)
7. [Validación, transacción e invariantes](#7-validación-transacción-e-invariantes)
8. [Compatibilidad y casos abiertos de precisión](#8-compatibilidad-y-casos-abiertos-de-precisión)
9. [Criterios observables](#9-criterios-observables)
10. [Gates, riesgos y conjuntos de escritura propuestos](#10-gates-riesgos-y-conjuntos-de-escritura-propuestos)
11. [Exclusiones](#11-exclusiones)
12. [Límites de lo afirmado](#12-límites-de-lo-afirmado)

---

## 1. Propósito, identificación y alcance aprobado

### 1.1 Objeto

FL-IDT-003 describe hoy una **advertencia** y un `201` que promueve, pero no existe en el
cable ninguna forma de que un actor con `user:create` **detecte** la promoción antes de
enviarla ni de **confirmarla** después (`§2.2`). Esta spec cierra ese hueco de punta a
punta: un endpoint de **previsualización de solo lectura**, una **precondición opcional**
en la confirmación, y un **resultado explícito** en la respuesta de alta, sin recortar
ningún paso del recorrido existente.

| Campo | Valor |
|---|---|
| **Artefacto canónico** | `docs/specs/complete-promotion/spec.md` (este documento) |
| **Metadata canónica** | `docs/specs/complete-promotion/spec-meta.yaml` |
| **Identificador** | `spec-complete-promotion-001` (`spec-meta.yaml` > `spec.id`) |
| **Spec padre** | `spec-final-frontend-001` — *Frontend integral del producto final sobre el backend existente* — relación de trazabilidad (`spec-meta.yaml` > `traceability.related_specs`), **no** el `id` de este artefacto |
| **Estado de la spec padre** | `approved` (`../final-frontend/spec-meta.yaml:7`), `approved_at: 2026-10-02` (`../final-frontend/spec-meta.yaml:13`); `verified_at: null` (`../final-frontend/spec-meta.yaml:14`) |
| **Riesgos de la spec padre que este recorrido hereda** | `auth`, `permissions`, `sensitive-data`, `new-api` (`../final-frontend/spec-meta.yaml:36-42`) |
| **Alcance funcional** | Detectar y confirmar la promoción completa de `FL-IDT-003` / `T-FL-IDT-003` en backend y consumidores |

### 1.2 Base de aprobación (circunscrita)

| # | Hecho de aprobación | Naturaleza |
|---|---|---|
| A-1 | El operador respondió **«Dale con todo nada de datos minimos»** a la pregunta de ampliar backend y consumidores para **detectar y confirmar la promoción completa** | Elección explícita del operador, registrada por el preflight que delegó este encargo |
| A-2 | Condición del operador a esa ampliación: **sin datos mínimos** — el recorrido se especifica completo, sin recortarlo | Restricción del operador, no decisión del agente |
| A-3 | Diseño de API read-only de la sesión Portal `ses_ef1ad5c61ffe19NLvWzF4ICGT5`, entregado y recibido | Evidencia técnica upstream; **no** es autorización del operador ni veredicto de revisión |

> 📜 **Lo aprobado es acotado y lo dice el verbo.** Está aprobado **ampliar el diseño** para
> detectar y confirmar la promoción completa. **No** está aprobado ejecutar nada, **no** está
> aprobado inventar comportamiento ausente, **no** está aprobado tocar autenticación, RBAC,
> permisos globales, tenants ajenos, `Person` compartida ni secretos, y **no** está aprobado
> crear auditorías o esquemas nuevos por omisión (§6.4). Si algo no está listado en A-1..A-3,
> no está aprobado.

### 1.3 Lo que este documento no hace

No implementa, no aplica migración, no ejecuta runtime, no toca planes ni gates
existentes, no modifica ningún otro archivo del repositorio —en particular **no** modifica
`../final-frontend/spec-meta.yaml` ni `../final-frontend/index.md`— y **no** emite veredicto
de verificación (§12).

### 1.4 Identidad canónica, procedencia y destino del registro

> 📖 Esta sección existe porque el documento nació como tomo suplementario sin `id` ni
> metadata, y su registro quedó declarado como dependencia `D-2`. Ese registro se resolvió
> el **2026-10-05** y en esta ruta.

| # | Hecho de registro | Detalle |
|---|---|---|
| R-1 | **Identidad propia** | `id`, `status`, `approved_at`, `verified_at`, gates, riesgo y trazabilidad viven **sólo** en [`spec-meta.yaml`](./spec-meta.yaml) de esta carpeta |
| R-2 | **Estado** | `approved` con `approved_at: 2026-10-05`, sobre la base A-1/A-2; `verified_at: null`. La aprobación de alcance **no** equivale a veredicto de revisión de plan ni autoriza implementación |
| R-3 | **Procedencia** | Cuerpo reubicado desde `docs/specs/final-frontend/complete-promotion-spec.md`. Ese archivo queda como **puntero breve** a esta ruta, sin copia de contenido |
| R-4 | **Asimetría declarada de trazabilidad** | La relación con la spec padre vive en **esta** metadata. `../final-frontend/spec-meta.yaml` conserva `traceability.related_specs: []` porque ese archivo está **fuera del conjunto de escritura** de este encargo y no se modifica |
| R-5 | **Registración de numeración** | `docs/specs/` no contenía specs en `complete-promotion/`; corresponde `max(existentes) + 1` = `001` para esta carpeta (sdd.md > Numeración de IDs) |
| R-6 | **Identificadores de contenido** | Los identificadores `CP-*`, `CP-R-*`, `CP-P-*`, `CP-V-*`, `CP-K-*`, `CP-X-*`, `A-*`, `G-*`, `S-*`, `D-*` se conservan **sin renumerar** desde el cuerpo de origen: los planes y revisiones que ya los citan siguen apuntando al mismo significado |

---

## 2. Comportamiento actual verificado

### 2.1 Hechos anclados del backend

| # | Hecho verificado | Ancla |
|---|---|---|
| A-01 | `POST /api/usuarios/` resuelve la promoción dentro de `perform_create`, por **RUT sobre el mismo `Usuario`**: `Usuario.objects.filter(rut=rut, is_temporary=True).first()` | `apipoligono/views.py:232`, `:244` |
| A-02 | La promoción escribe `grado`, `nombre`, `apellido_paterno`, `apellido_materno`, `correo` sólo cuando el valor no es `None`; y fija `is_temporary=False`, `is_active=True`, `username=rut`, `password=make_password(DEFAULT_TEMP_PASSWORD)`, `must_change_password=True`; **no** crea una fila nueva | `views.py:245-256` |
| A-03 | Después, la misma petición resuelve contexto inicial leyendo `initial_unit_code`, `initial_role_code`, `initial_scope_code` **fuera del serializer** (`self.request.data`) | `views.py:269-271` |
| A-04 | `Person.objects.get_or_create(document_id=user.rut, defaults={full_name, email, is_active: True})`: si la `Person` ya existe, **`get_or_create` no la actualiza** | `views.py:298-305` |
| A-05 | `Account.objects.get_or_create(user=user, defaults={'person', 'tenant', 'is_active': True})`: si la `Account` ya existe —caso del temporal—, **no se reactiva** | `views.py:306-308` |
| A-06 | `crear-temporal` crea el temporal con `is_temporary=True`, `is_active=False`, `password=''`, y deja `Person` e `Account` con `is_active=False` | `views.py:540`, `:582`, `:589-597` |
| A-07 | `crear-temporal` **rechaza con `400`** cualquier RUT existente (temporal o formal) y **nunca** promueve | `views.py:556-561` |
| A-08 | El listado exige `user:read → view_personnel_basic` | `permissions.py:36-39` (`RESOURCE_ACTION_TO_PERMISSION`) |
| A-09 | `UsuarioSerializer` **no expone `is_temporary`**: sus campos son `id_usuario`, `rut`, `grado`, `nombre`, `apellido_paterno`, `apellido_materno`, `correo`, `habilitado`, `is_locked`, `must_change_password`, `password_changed_at`, `primary_assignment`, `assignments` | `apipoligono/serializers.py:101-115` |
| A-10 | `HasTenantAccess` exige `Account.objects.filter(user, tenant, is_active=True)`: una `Account` inactiva bloquea el acceso aunque `Usuario.is_active=True` y tenga contraseña | `apps/authorization/permissions.py:242-258` |
| A-11 | `ResultadoTiro.id_usuario` es FK a `Usuario`: al promoverse **la misma fila**, el historial histórico queda unido sin reasociar nada | `apipoligono/models.py:322-328` |
| A-12 | El `403` por `PermissionError` se traduce en el `create()` del viewset, no en la vista de detalle | `views.py:534-538` |
| A-13 | Las acciones `@action` se registran solas por el router: `crear-temporal` **no** aparece en `apipoligono/urls.py` | `apipoligono/urls.py:41`, `views.py:540` |

### 2.2 Huecos que esta spec cierra

| # | Hueco | Evidencia |
|---|---|---|
| G-01 | **No hay detección previa posible.** El único camino de lectura (`GET /api/usuarios/`) exige `user:read`, y `is_temporary` no se serializa: un actor con `user:create` no puede sostener la advertencia «antes del envío» que exigen `AC-OP-USR-002` y `T-FL-IDT-003` | A-08 + A-09 + S-13 + S-15 |
| G-02 | **La promoción deja la cuenta inactiva.** Por A-04 + A-05 + A-10, el usuario promovido queda con `Usuario.is_active=True` y contraseña temporal, pero con `Account.is_active=False` y `Person.is_active=False`: el alta responde `201` y la persona **no puede entrar** | A-04 + A-05 + A-06 + A-10 |
| G-03 | **El resultado de la promoción no es observable en la respuesta.** El `201` devuelve `UsuarioSerializer` sin distinguir `created` de `promoted`, y sin `id_usuario` que el cliente pueda contrastar con lo previsualizado | A-09 + A-02 + S-13 |
| G-04 | **No hay noción de estado obsoleto.** Un RUT que cambió entre la previsualización y el envío sólo encuentra `400` de duplicado formal, que no distingue «cambió» de «nunca fue promovible» | A-01 + A-07 |

---

## 3. Anclas de fuente

> 📖 Lecturas de fuente contrastadas el **2026-10-05** contra el disco del proyecto.
> Ninguna proviene de ejecución, de runtime, de navegador ni de base de datos. El diseño de
> §4 proviene del handoff Portal `ses_ef1ad5c61ffe19NLvWzF4ICGT5`; las columnas de
> comportamiento actual son lectura propia contrastada.

| # | Ancla | Qué sostiene |
|---|---|---|
| S-01 | `apipoligono/views.py:184-200` | `UsuarioViewSet`, mixin de scope, `action_permission_map` con `'crear_temporal': 'create'` (`:195`) — el mecanismo por el que una acción propuesta hereda `create_users` |
| S-02 | `apipoligono/views.py:232-328` | `perform_create` completo: promoción, contexto inicial, `Person`/`Account`, tirador implícito, `UnitMembership` |
| S-03 | `apipoligono/views.py:534-606` | `create()` con traducción de `PermissionError` → `403` y `crear-temporal` completo |
| S-04 | `apipoligono/serializers.py:101-115` | Campos y `read_only_fields` de `UsuarioSerializer`; ausencia de `is_temporary` |
| S-05 | `apps/authorization/permissions.py:36-39` | `('user','create') → create_users`, `('user','read') → view_personnel_basic` |
| S-06 | `apps/authorization/permissions.py:242-258` | `HasTenantAccess` exige `Account` activa del tenant |
| S-07 | `apipoligono/models.py:322-328` | `ResultadoTiro.id_usuario` FK a `Usuario`: el historial se conserva por identidad de fila |
| S-08 | `apps/identity/models.py:9-18` | `Person.document_id` es **único global** y el docstring declara que una persona puede tener cuentas en distintos tenants sin duplicarse |
| S-09 | `apps/identity/models.py:27-40` | `Account`: `user` OneToOne, `person` FK, `tenant` FK, `is_active`, `unique_together(person, tenant)` |
| S-10 | `../final-frontend/experience/flows/identity.md:79-97` | FL-IDT-003 tal como está escrita hoy: advertencia antes del envío, `perform_create` promueve, dirección inequívoca |
| S-11 | `../final-frontend/acceptance/identity.md:45`, `:48` | AC-OP-USR-002 y AC-OP-USR-012: la advertencia es un observable previo; `crear-temporal` con RUT existente es `400` y **no promueve** |
| S-12 | `apipoligono/models.py:171` | `Usuario.is_temporary` **ya existe**: la propuesta no requiere migración por defecto |
| S-13 | `front/src/features/identity/api.ts:77-92` | Lado cliente del mismo hueco que A-09: `IdentityUserDTO` documenta en su propio comentario *«Full current UsuarioSerializer response; it does not expose `is_temporary`»*, y sus campos son los de `UsuarioSerializer`, uno a uno |
| S-14 | `front/src/features/identity/api.ts:94-104`, `:868-869` | `CreateUserRequest` **no** incluye `expected_id_usuario` y `createUser(...)` no lo envía: la precondición de §4.2 no existe todavía en el cliente |
| S-15 | `front/src/features/identity/api.ts:423-460` | `validateUser(value: unknown): IdentityUserDTO` valida **forma desde `unknown`** campo a campo: es el patrón que §4.4 exige para los DTOs nuevos |
| S-16 | `front/src/views/identity/IdentityView.vue:2519` | El propio cliente lo declara en pantalla: *«El listado no expone `is_temporary`; esta pantalla no simula una detección local»* |
| S-17 | `front/src/features/identity/api.ts:83-84`, `:426`, `:434-435` | `apellido_paterno` y `apellido_materno` son claves **separadas y obligatorias** en el cliente; ancla exacta del caso abierto `CP-P-06` |

> 📜 **Localizador abreviado del handoff Portal, resuelto.** El handoff citaba
> `identity/api:77-104` y `identity/api:423-460` como localizador abreviado. La búsqueda del
> **path completo** resuelve a `front/src/features/identity/api.ts` (1273 líneas) y **ambos
> rangos caen sobre bloques DTO reales**: `:77-104` cubre `IdentityUserDTO` +
> `CreateUserRequest` y `:423-460` cubre `validateUser`. La referencia abreviada queda
> **resuelta** y este documento la usa como ancla (S-13, S-14, S-15) **con el contenido
> leído**, no heredado del handoff. La lectura se limitó a existencia y bloques DTO; **no**
> se reexploró la capa HTTP del cliente.

---

## 4. Contrato propuesto

> 📖 Todo §4 es **diseño a implementar**. Ninguna línea existe hoy en el backend
> (hechos en §2.1, S-13, S-14). Los identificadores `CP-*` son de este documento para que
> el plan y la revisión los refieran sin ambigüedad.

### 4.1 Previsualización — `POST /api/usuarios/previsualizar-promocion/`

| Aspecto | Propuesta | Ancla / nota |
|---|---|---|
| Ruta | `POST /api/usuarios/previsualizar-promocion/` | Acción `@action(detail=False)`; sin entrada en `urls.py` (A-13) |
| Cuerpo | `{rut}` | `rut` requerido, con la misma normalización del backend |
| Autorización | Sesión + CSRF + `user:create → create_users` vía `action_permission_map` | S-01 + S-05. **No** exige `user:read` ni `view_personnel_basic` |
| Respuesta `200` elegible | `{"status":"eligible","candidate":{…,"is_temporary":true}}` | `candidate` con `id_usuario`, `rut`, `grado`, `nombre`, apellidos, `correo`, `is_temporary` |
| Respuesta `200` no elegible | `{"status":"not_eligible","candidate":null}` | **No** diferencia fuera de scope / formal / inexistente: no enumera |
| Caché | `Cache-Control: no-store` | El `candidate` lleva PII de persona |
| Escrituras | **Ninguna, jamás** | Sólo lectura por construcción (S-02 no se toca) |
| Scope | Mismo scope que el listado: tenant de la petición + `get_allowed_unit_ids(account)` + asignación activa; la `Account` del candidato pertenece a ese tenant | §6.1 |

```json
{ "status": "eligible",
  "candidate": { "id_usuario": 412, "rut": "…", "grado": "…", "nombre": "…",
                 "apellidos": "…", "correo": "…", "is_temporary": true } }
```

> 📜 **Precisión heredada del handoff, no resuelta aquí.** `apellidos` es el nombre que
> entrega el diseño Portal, y **no** es un campo de `Usuario` ni de `UsuarioSerializer`
> (S-04: `apellido_paterno` y `apellido_materno` son campos distintos y separados), ni del
> DTO del cliente, que los exige por separado (S-17). El plan **debe** fijar las claves
> exactas del `candidate`; esta spec **no** las renombra ni las inventa por su cuenta.
> Queda registrado como caso abierto `CP-P-06`.

### 4.2 Confirmación — `POST /api/usuarios/` (misma ruta, sin duplicar)

| Aspecto | Propuesta | Nota |
|---|---|---|
| Respuesta `201` | Respuesta **directa** de `UsuarioSerializer` — sin envoltorio `success` inventado — **más** `is_temporary: false` y `creation_outcome: 'created' \| 'promoted'` | `CP-R-01`, `CP-R-02` |
| Precondición adicional | `expected_id_usuario: number \| null`, **opcional**, **siempre enviada por el cliente nuevo** | Cero impacto en clientes antiguos que la omitan |
| Fuente canónica de búsqueda | **RUT** | La precondición **no** sustituye al RUT ni habilita buscar por ID arbitrario |
| `400` | Validación de campos y **duplicado formal** | Igual que hoy (A-01) |
| `403` | Sin permiso de alta, unidad inexistente o fuera de rama | Traducción vigente (S-03, A-12) |
| `409` | `{"code":"PROMOTION_STATE_CHANGED","detail":"El registro cambió; vuelve a consultarlo."}` para precondición incumplida o estado obsoleto | **Sin mutación** y **sin datos del candidato** en el error |

### 4.3 Lectura — listado y detalle

`GET /api/usuarios/` y `GET /api/usuarios/{id}/` añaden `is_temporary` como campo **de
solo lectura** (`CP-R-03`). Es un añadido aditivo sobre S-04 y sobre el DTO del cliente
(S-13, que hoy lo declara ausente); no cambia permiso, ni scope, ni el resto de la forma.

### 4.4 DTOs del cliente

| DTO | Contenido | Regla |
|---|---|---|
| `PromotionCandidate` | `id_usuario`, `rut`, `grado`, `nombre`, apellidos, `correo`, `is_temporary` | Tipado desde `unknown` en el borde |
| `PromotionPreview` | `status: 'eligible' \| 'not_eligible'`, `candidate: PromotionCandidate \| null` | El `null` es parte del tipo, no un `any` |
| `CreateUserResponse` | Campos de `UsuarioSerializer` + `is_temporary` + `creation_outcome` | Sin envoltorio de éxito ficticio |

> 🪶 **Cero `any`, cero éxito falso.** Los tres DTOs se construyen desde `unknown` con
> validación de forma, siguiendo el patrón que el cliente ya usa en
> `validateUser` (S-15). Un `candidate` ausente se representa como `null`, nunca como
> objeto vacío ni como `any`. El cliente no infiere `promoted` por la ausencia de un
> campo.

---

## 5. Recorrido íntegro de promoción

Ningún paso del recorrido se recorta. La tabla es el contrato observable del flujo
completo, de la primera pulsación al refresco final.

| # | Paso | Operación | Respuesta real | Efecto en UI |
|---:|---|---|---|---|
| 1 | El operador escribe un RUT en el alta formal | `POST /api/usuarios/previsualizar-promocion/` `{rut}` | `200 {status, candidate}` | Sin escritura local. Sin petición de admin |
| 2 | Resultado `eligible` | — | — | Aviso **antes del envío**: la creación promueve y conserva historial (S-10, S-11), y el formulario se **rellena y sigue editable** con el `candidate` |
| 3 | Resultado `not_eligible` | — | — | Sin aviso de promoción; el alta continúa como alta normal |
| 4 | Selectores de contexto inicial | Roles por categoría (OP-AZC-002) y unidades elegibles (OP-UNT-010) | Valores reales del backend | Alimentan el **único** `POST` con `initial_*` (S-03: se consumen fuera del serializer) |
| 5 | Confirmación | **Un solo** `POST /api/usuarios/` con `rut`, campos editados, `initial_*` cuando apliquen y `expected_id_usuario` del paso 1 | `201` con `creation_outcome` | Actualización desde la respuesta; **sin fila optimista** antes del `201` |
| 6 | Cancelación del formulario | **Ningún `POST`** | — | Cierre local; el backend no se entera |
| 7 | Respuesta `409` | — | `{"code":"PROMOTION_STATE_CHANGED",…}` | **Sin replay automático.** Se re-consulta la previsualización y se muestra el `detail` literal |
| 8 | Respuesta `201` | — | `creation_outcome` + `id_usuario` | Si `promoted`, el `id_usuario` **coincide** con el del `candidate`: un único registro, `is_temporary` limpio, historial conservado (A-11) |
| 9 | Refresco | `GET /api/usuarios/` **sólo si** el actor tiene `user:read` | Listado real | Si **no** tiene `user:read`, el `201` es la autoridad: **no** se fuerza una lectura administrativa |

> 📜 **Dos ataduras de coherencia que este recorrido no puede romper.**
> **(a) Alta inicial = un solo `POST`:** los selectores OP-UNT-010 y OP-AZC-002 alimentan el
> mismo envío que confirma; no se introduce una segunda petición de contexto.
> **(b) OP-AZC-004 es de `Usuario` existente:** el selector
> `GET /api/authz/eligible-target-units/` exige `user_id` real
> (`../final-frontend/acceptance/authorization.md:94`) y pertenece a los editores de
> asignación, **no** a la promoción. La promoción jamás lo invoca.
> **(c) Dirección única:** la promoción ocurre del temporal al formal. `crear-temporal`
> con RUT existente sigue siendo `400` y **no** promueve (A-07, S-11).

---

## 6. Alcance, tenant y preservación de `Person`/`Account`

### 6.1 Scope del candidato

La previsualización resuelve **dentro** del mismo scope que el listado: tenant de la
petición, `get_allowed_unit_ids(account)` y asignación activa. La `Account` del candidato
**pertenece al tenant de la petición** (S-09). Un candidato de otro tenant **no se
enumera**: responde `not_eligible`. No hay ninguna ruta de este contrato que atraviese
tenant, RBAC global ni permisos globales.

### 6.2 Reactivación de la `Account` en la promoción

La promoción debe **reactivar la `Account` existente** (`is_active=True`) preservando su
**PK**, su **`tenant`** y su **`person`** (S-09), porque sin eso el alta responde `201` con
una cuenta que no puede entrar (G-02, A-10). El `Usuario` queda con los campos de la
edición, `is_temporary=False` e `is_active=True`; el flujo actual de contraseña temporal y
cambio forzado se **preserva** tal como está hoy (A-02).

> 🕯️ **Ningún secreto sale por este contrato.** Ni la contraseña, ni su hash, ni el valor
> de `DEFAULT_TEMP_PASSWORD` viajan en la previsualización, en el `201` ni en el `409`.

### 6.3 Límite estructural deliberado sobre `Person`

`Person.document_id` es **único global** y una persona puede tener cuentas en distintos
tenants (S-08). Por eso, **por defecto**, la promoción **no** sincroniza
`Person.full_name`, `Person.email` ni `Person.is_active` desde una promoción de un solo
tenant: eso tocaría una fila global con efectos ajenos al scope aprobado.

Esto **no** recorta campos: los campos editables de `Usuario` siguen siendo editables y la
reactivación de `Account` sigue siendo obligatoria (§6.2). Lo que se evita es el efecto
global no aprobado.

| Situación | Conducta exigida |
|---|---|
| La promoción no necesita tocar `Person` | **Preservar** la fila de `Person` (PK intacto) y `Account.person` intacto |
| El comportamiento existente **realmente** exige modificar `Person` global | **Declarar la dependencia exacta** y escalarla. Una ampliación compartida requiere **decisión explícita del operador**; no se infiere de «dale con todo» |

### 6.4 Sin auditoría ni marcador persistente por defecto

No se crea tabla, campo ni esquema de auditoría de promociones. `creation_outcome` prueba
el resultado **por la respuesta** y **no** pretende historial persistente. Si más adelante se
quiere trazar promociones, es una spec nueva con su propia decisión.

---

## 7. Validación, transacción e invariantes

| ID | Invariante exigida |
|---|---|
| `CP-R-01` | `rut`, `expected_id_usuario`, `initial_*` y el scope se **validan antes de mutar**. Ninguna escritura precede a la validación completa |
| `CP-R-02` | La precondición se **revalida dentro de la transacción**, bajo la serialización efectiva; si no puede revalidarse bajo ella, se aborta sin mutar en lugar de adivinar |
| `CP-R-03` | `is_temporary` es **de solo lectura** en el serializer: el cliente no puede fijar la bandera por `POST`/`PUT`/`PATCH` |
| `CP-R-04` | La unicidad de RUT se conserva: la promoción **no** relaja ni duplica la restricción, y el `id_usuario` del registro promovido es el mismo (A-01, A-11) |
| `CP-R-05` | Los helpers `_ensure_tirador_assignment` y `_ensure_unit_membership` se mantienen: la promoción no los reimplementa ni los omite |
| `CP-R-06` | `Assignment` y `UnitMembership` preexistentes **se conservan**: no se borran, no se reasocian, no se duplican |
| `CP-R-07` | El `409` se emite **sin mutación** y **sin datos del candidato**: sólo `code` y `detail` |
| `CP-R-08` | No se crea migración por defecto: `Usuario.is_temporary` ya existe (S-12) |

---

## 8. Compatibilidad y casos abiertos de precisión

> 🕯️ **Esta spec no define prioridades contradictorias.** Los casos siguientes son
> **decisiones del plan o del revisor**, no reglas escritas aquí. Ninguno está resuelto por
> inferencia, y ninguno se marca como implementado. **La aprobación del alcance no
> convierte ninguno de ellos en resuelto.**

| ID | Caso abierto | Por qué no se resuelve aquí |
|---|---|---|
| `CP-P-01` | Cliente antiguo que **omite** `expected_id_usuario` frente a cliente nuevo que la **envía siempre**: qué se acepta en cada caso | Compatibilidad con el body actual (S-03) y con la precondición nueva no admiten una regla única escrita sin la decisión del plan |
| `CP-P-02` | `expected_id_usuario: null` enviado por un cliente que nunca previsualizó: ¿significa «sin precondición» o «no debe existir»? | El valor `null` es ambiguo por diseño; la resolución afecta a clientes antiguos y nuevos por igual |
| `CP-P-03` | `expected_id_usuario` presente pero el RUT resuelve a un usuario **formal**: ¿`400` de duplicado o `409` de estado? | Los dos códigos son defendibles; la precedencia entre A-07 y `CP-R-07` la fija el plan |
| `CP-P-04` | Preview `eligible` y promoción concurrente de otro actor antes del envío: ¿`409` o `400`? | Es la frontera exacta entre «cambió» y «duplicado»; depende del orden de validación que el plan fije |
| `CP-P-05` | Orden entre `400` de validación de campos y `409` de precondición cuando ambas aplican (p. ej. `initial_*` inválido **más** precondición obsoleta) | Dos chequeos en el mismo camino; la precedencia no está hoy en el código (A-01 no tiene precondición) |
| `CP-P-06` | Claves exactas de `candidate` (`apellidos` del handoff vs `apellido_paterno`/`apellido_materno` del modelo y del cliente, S-04, S-17) | El diseño entregado y el modelo usan nombres distintos; esta spec no renombra por su cuenta. **La ancla existe; la decisión sigue abierta** |
| `CP-P-07` | Alcance del `candidate` devuelto a un actor con `user:create` pero sin `user:read`: PII de persona (`nombre`, `correo`) dentro del scope | Toca el flag `sensitive-data` de la spec padre (`../final-frontend/spec-meta.yaml:36-42`); la reducción del `candidate` es decisión de revisión |
| `CP-P-08` | Estado de UI para el `409`: qué `ST-*`/F-* consume y si `F-05` se reutiliza o se abre uno nuevo | Los estados canónicos viven fuera de este conjunto de escritura (`../final-frontend/experience/states.md`); no se editan aquí |
| `CP-P-09` | El `detail` del `409` es **literal fijo** en la propuesta; confirmar si el frontend debe mostrarlo literal o traducirlo | `../final-frontend/acceptance/identity.md` exige `detail` literal en otros fallos; la analogía no está escrita |

---

## 9. Criterios observables

> 🕯️ Estos criterios se evalúan sobre el **cable** y la **pantalla**. Tests, build, lint y
> typecheck **no** los acreditan, y ningún agente puede declararlos cumplidos (§12).

### 9.1 Detección y confirmación

| ID | Criterio observable |
|---|---|
| `CP-V-01` | Con un RUT de temporal visible en scope, la previsualización responde `200` con `status: 'eligible'`, `candidate` no nulo e `is_temporary: true` |
| `CP-V-02` | La previsualización responde `200` con `Cache-Control: no-store` y **cero** escrituras en base de datos, para todo RUT, elegible o no |
| `CP-V-03` | Un RUT de usuario formal, un RUT inexistente y un RUT fuera del scope responden **la misma** forma `not_eligible` con `candidate: null`: no se distinguen entre sí |
| `CP-V-04` | Un actor con `user:create` y **sin** `user:read` obtiene `200` de la previsualización; uno sin `user:create` obtiene `403` |
| `CP-V-05` | El aviso de promoción es visible **antes** del envío (S-10, S-11) y el formulario queda editable tras rellenarse desde el `candidate` |
| `CP-V-06` | El alta confirmada devuelve `201` con `creation_outcome` explícito, `is_temporary: false` y un `id_usuario` **igual** al del `candidate` cuando el resultado es `promoted` |

### 9.2 Promoción completa

| ID | Criterio observable |
|---|---|
| `CP-V-07` | Tras promover, el listado muestra **un único** registro con `is_temporary` limpio: no hay segunda fila ni duplicado |
| `CP-V-08` | Los resultados históricos siguen vinculados **al mismo** registro y su historial permanece consultable (A-11) |
| `CP-V-09` | La persona promovida **puede iniciar sesión**: la cuenta del tenant queda activa. Este criterio falla hoy (G-02) y es el que distingue promoción completa de promoción parcial |
| `CP-V-10` | El listado y el detalle exponen `is_temporary` de solo lectura; el cliente no puede fijarlo por `POST`/`PUT`/`PATCH` (`CP-R-03`) |
| `CP-V-11` | La alta temporal con RUT existente sigue en `400` y **no** promueve (A-07) |
| `CP-V-12` | `Assignment` y `UnitMembership` previos sobreviven a la promoción: siguen activos y no hay duplicados (`CP-R-05`, `CP-R-06`) |

### 9.3 Fallas y cancelación

| ID | Criterio observable |
|---|---|
| `CP-V-13` | Un `409` produce **cero** escrituras y el cliente **no** reintenta solo: re-consulta la previsualización y muestra el `detail` recibido |
| `CP-V-14` | El `409` no incluye datos del candidato ni ningún otro dato de la persona (`CP-R-07`) |
| `CP-V-15` | Cancelar el formulario **no** emite ningún `POST` de alta ni de previsualización adicional |
| `CP-V-16` | Ante `400` y `403` se conservan los valores del formulario y **no** hay fila optimista antes de la respuesta |

### 9.4 Lo que estos criterios no prueban

| Afirmación | Estado |
|---|---|
| El backend y el cliente de promoción existen y compilan | **Entrega de código**, no criterio de este bloque |
| Las pruebas de promoción pasan | **Evidencia de revisión**, no criterio de este bloque |
| La promoción completa funciona | **No se declara.** No se ejecutó nada; el veredicto lo emite el orquestador |
| Los casos `CP-P-01..09` están resueltos | **No.** §8 los deja abiertos a propósito, y la aprobación de alcance no los cierra |

---

## 10. Gates, riesgos y conjuntos de escritura propuestos

### 10.1 Gates aplicables (leídos, no inventados)

| Gate | Valor en la spec padre | Lectura para este recorrido |
|---|---|---|
| `security_review` | `required` (`../final-frontend/spec-meta.yaml:21`) | Aplicable: toca `Account`, permiso `create_users` y PII de persona (Hard #2/#3/#4) |
| `tests` | `required` (`../final-frontend/spec-meta.yaml:20`) | Aplicable: promoción, precondición, `409` y revalidación son lógica comprobable |
| `code_review` | `required` (`../final-frontend/spec-meta.yaml:22`) | Aplicable |
| `documentation` | `required` (`../final-frontend/spec-meta.yaml:23`) | Este documento es su parte de diseño; el uso queda para la implementación |
| `portal_warden` | `required` (`../final-frontend/spec-meta.yaml:26`) | Aplicable: el diseño de API es read-only y procede de un handoff Portal, que **no** es veredicto |
| `kobold_scholar` | `required` en la spec padre (`../final-frontend/spec-meta.yaml:27`) | **No reasignado**: su exigencia deriva del modelo de preferencias de apariencia, ajeno a este recorrido. En la metadata de esta spec queda `n/a` |
| `qa_goblin` | `required` (`../final-frontend/spec-meta.yaml:30`) | Aplicable a los criterios observables de §9 |
| `haste_halfling`, `arcane_architect`, `hellknight_inspector` | `n/a` en la spec padre (`../final-frontend/spec-meta.yaml:28`, `:29`, `:31`) | En la metadata de esta spec, `arcane_architect` queda `required` por la evidencia de §4.2/§6.2 (nuevo contrato de escritura y cambio de comportamiento de `Account`); `haste_halfling` y `hellknight_inspector` quedan `n/a` |

> 🕯️ **Ningún gate de esta spec está en `passed` y ninguno se autoriza a ejecutar.**
> `../final-frontend/spec-meta.yaml:91-93` establece la misma distinción para la spec padre, y
> [`spec-meta.yaml`](./spec-meta.yaml) la aplica a esta: `status: approved` con
> `verified_at: null` describe alcance, no trabajo verificado. La aprobación **no** autoriza
> al writer de código, ni build, tests, navegador, base de datos o shell.

### 10.2 Riesgos

| ID | Riesgo | Mitigación exigida |
|---|---|---|
| `CP-K-01` | Enumeración de personas por la previsualización (RUT existente, fuera de scope o no) | `CP-V-03`: respuesta indistinguible; §6.1: scope de listado |
| `CP-K-02` | Exposición de PII a un actor con `user:create` sin `user:read` | `CP-V-04` + caso abierto `CP-P-07`; revisión de seguridad |
| `CP-K-03` | Promoción que responde `201` y deja la cuenta inutilizable (estado actual, G-02) | `CP-V-09` + `§6.2` |
| `CP-K-04` | Doble fila o historial huérfano en la promoción | `CP-R-04` + `CP-V-07` + `CP-V-08` |
| `CP-K-05` | Precondición client-side falsificable que degrade la garantía | `CP-R-02`: la revalidación es **de servidor**, en transacción |
| `CP-K-06` | `400` y `409` ambiguos para el usuario final | §8: los casos se precisan antes de implementar, no después |
| `CP-K-07` | Efecto global no deseado al tocar `Person` | `§6.3`: por defecto no se sincroniza; ampliación sólo con decisión explícita |
| `CP-K-08` | Que el «con todo» del operador se lea como permiso para ejecutar, inventar o recortar | `§1.2`, `§11`: aprobado es **ampliar el diseño**, nada más |

### 10.3 Dependencias y localizador

| # | Dependencia | Estado |
|---|---|---|
| `D-1` | Autorización de ampliación completa del operador | **Recibida** (A-1, A-2) |
| `D-2` | Registro canónico del documento: `id`, metadata propia e índice | **RESUELTA (2026-10-05).** `spec-complete-promotion-001` en [`spec-meta.yaml`](./spec-meta.yaml), mapa en [`index.md`](./index.md), y el origen queda como puntero breve. El plan puede tratar este documento como canónico |
| `D-3` | Diseño API read-only de Portal `ses_ef1ad5c61ffe19NLvWzF4ICGT5` | **Recibido**; no es veredicto de revisión |
| `D-4` | Decisiones de `CP-P-01..09` | **Pendientes**; bloquean la implementación, no este documento |
| `D-5` | Planes existentes | **Intactos**: `../final-frontend/implementation-plan.md` (`p3`, `VALIDATED`, `r2`), `../final-frontend/implementation-plan-access.md` (`p2`, `VALIDATED`, `r2`), `../final-frontend/implementation-plan-remaining.md` (`p2`, `VALIDATED`, `r2`). No modificados por este encargo |
| `D-6` | Código de promoción | **No escrito.** No hay endpoint de previsualización, ni `expected_id_usuario`, ni `creation_outcome`, ni `is_temporary` serializado, ni en el backend ni en el cliente (S-13, S-14) |
| `D-7` | Migración | **No requerida por defecto** (S-12) |

### 10.4 Conjuntos de escritura propuestos (propuesta, no ejecutada)

| Superficie | Rutas propuestas | Naturaleza de la propuesta |
|---|---|---|
| Backend | `apipoligono/views.py` — acción de previsualización, precondición y `409` en `perform_create`, reactivación de `Account` (`§6.2`), revalidación en transacción | Propuesta; no editada |
| Backend | `apipoligono/serializers.py` — `is_temporary` de solo lectura (`CP-R-03`) | Propuesta; no editada |
| Backend | `apipoligono/urls.py` — **sin cambios**: la acción se registra sola por el router (A-13) | Hecho verificado |
| Esquema | **Sin migración** por defecto (S-12) | Hecho verificado |
| Cliente | `front/src/features/identity/api.ts` (DTOs y validadores) y componente de alta formal | **Hipótesis.** `tasks/identity.md` registra `components/identity/UserFormModal.vue` como archivo *probable*, no confirmado |

---

## 11. Exclusiones

| ID | Excluido | Base de la exclusión |
|---|---|---|
| `CP-X-01` | Cambiar autenticación, RBAC, permisos globales o el modelo de permisos | La aprobación es de alcance acotado (A-1); `sensitive-data` y `permissions` quedan a revisión |
| `CP-X-02` | Cualquier ruta que atraviese tenant o exponga candidatos de otro tenant | §6.1 |
| `CP-X-03` | Sincronizar `Person.full_name`, `Person.email` o `Person.is_active` desde una promoción de un tenant | `§6.3`: es alcance compartido y requiere decisión explícita |
| `CP-X-04` | Migración, modelo nuevo, campo nuevo, auditoría o marcador persistente de promociones | §6.4 + `CP-R-08` |
| `CP-X-05` | Cambiar `crear-temporal` para que promueva, o cualquier ruta alterna de promoción | A-07 + S-11: la dirección es única |
| `CP-X-06` | Secretos, contraseñas, hashes o `DEFAULT_TEMP_PASSWORD` en cualquier respuesta o documento | §6.2 |
| `CP-X-07` | Modificar los planes, los gates y la metadata o el índice de la **spec padre** (`../final-frontend/spec-meta.yaml`, `../final-frontend/index.md`, `../final-frontend/implementation-plan*.md`) | Fuera del conjunto de escritura: sólo esta carpeta de spec y el puntero de origen. La trazabilidad se registra del lado propio (R-4) |
| `CP-X-08` | Shell, git, tests, build, typecheck, navegador, MCP, servidores, dependencias, modelos o subagentes | No autorizados en este encargo |
| `CP-X-09` | Fijar por mi cuenta las prioridades de `CP-P-01..09` | §8 existe para que las fije el plan o el revisor |
| `CP-X-10` | Emitir `VERIFIED`, `fixed` o cualquier veredicto de cierre | El veredicto lo emite el orquestador (§12) |

---

## 12. Límites de lo afirmado

- **Nada de este documento afirma runtime observado.** No se levantó el servidor, no se
  abrió navegador, no se ejecutaron tests, build ni lint, no se leyó la base de datos y no se
  escribió en ella. Todas las anclas de §2 y §3 son **lecturas de fuente** del 2026-10-05.
- **Nada de §4 existe todavía.** El contrato propuesto es **diseño a implementar**. Ningún
  endpoint de previsualización, ninguna precondición, ningún `409` y ningún
  `creation_outcome` están en el backend ni en el cliente (S-13, S-14).
- **Ningún localizador no resuelto se usa como ancla.** El localizador abreviado
  `identity/api` del handoff Portal quedó **resuelto** contra
  `front/src/features/identity/api.ts` (S-13, S-15, S-17) y se cita con contenido leído;
  el alcance de esa lectura se limita a existencia y bloques DTO (§3).
- **Los casos `CP-P-01..09` siguen abiertos.** Este documento no los resuelve ni declara
  resueltos, y la aprobación de alcance no los cierra (§8).
- **Esta spec no autoriza implementación.** La aprobación de A-1..A-3 no equivale a
  autorización de escritura de código, instalación de dependencias ni ejecución. Es
  **prerrequisito** de un plan suplementario y no lo sustituye.
- **Esta spec tiene metadata e índice propios y canónicos** ([`spec-meta.yaml`](./spec-meta.yaml),
  [`index.md`](./index.md)); el archivo de origen es un puntero, no una segunda copia (§1.4).
- **La metadata y el índice de la spec padre no se modificaron** y siguen intactos, incluida
  su `traceability.related_specs` vacía: la asimetría es deliberada y está declarada (R-4).
- **Los planes existentes están intactos** y su estado no se afirma ni se altera (`D-5`).