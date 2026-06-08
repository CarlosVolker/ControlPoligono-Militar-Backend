# Glosario

## Términos del dominio militar

| Término | Definición |
|---|---|
| **Polígono de tiro** | Instalación física donde se realizan prácticas y evaluaciones de tiro. Tiene carriles numerados y una distancia máxima. |
| **Lección de tiro** | Sesión de instrucción o evaluación de tiro. Tipo: *entrenamiento* o *evaluación*. |
| **Fracción** | Subgrupo de tiradores dentro de una lección. |
| **Tirador** | Persona que participa disparando en una sesión de tiro. |
| **Tiros de cereo** | Disparos de calibración o práctica antes de la lección formal. |
| **Carril** | Posición física numerada en el polígono donde se ubica un tirador. |
| **Grado** | Rango militar (Teniente, Capitán, Mayor, etc.). |
| **S-3 / Auxiliar S-3** | Oficial de Instrucción y Operaciones. Responsable de planificar las instrucciones de tiro. |
| **E-3** | Oficial Observador. Observa y evalúa sin editar. |
| **SICE** | Sistema de Instrucción y Control de Ejercicios. Administrador del sistema en una unidad/recinto. |
| **Encargado de almacén** | Responsable de gestionar el armamento en una armería. |
| **Orden de tiro** | Documento oficial que autoriza la ejecución de una lección. Tiene número y fecha. |
| **Plana Mayor** | Estado mayor de una unidad. Personal de asesoramiento del comandante. |

## Términos técnicos del sistema

| Término | Definición |
|---|---|
| **Tenant** | Institución militar que usa el sistema. Cada tenant tiene datos completamente aislados. |
| **Multi-tenant** | Arquitectura donde una instancia sirve a múltiples instituciones con datos aislados. |
| **Account** | Vincula un `Usuario` Django con una `Person` física y un `Tenant`. |
| **Person** | Persona física. Identificada por RUT (único global). Independiente de tenant. |
| **Position** | Puesto estable en la organización (ej: "Comandante Compañía A"). Combina Role + ScopePolicy + OrganizationUnit. |
| **Assignment** | Registro de una persona ocupando una Position. `position` es NOT NULL. |
| **UnitMembership** | Pertenencia orgánica de un usuario a una unidad. **Distinta** del puesto funcional. No otorga permisos por sí sola. |
| **Permission** | Permiso atómico del sistema (ej: `score_shooters`, `view_unit`). Catálogo de 34 permisos. |
| **Role** | Tipo funcional de un puesto. Define qué permisos tiene via `RolePermission`. |
| **RolePermission** | Liga un Role con un Permission. Reemplazó a `PermissionRule`. |
| **PositionPermission** | Permisos extra de un puesto específico, sobre los del rol. |
| **ScopePolicy** | Alcance de datos: `solo_propio`, `unidad_propia`, `unidad_y_descendientes`, `solo_agregado`. |
| **UserPermissionOverride** | Excepción individual ALLOW/DENY para una persona, sobreescribiendo su rol. |
| **MASTER / super_admin** | Bypass total del sistema. Solo para el administrador técnico. |
| **Tirador implícito** | Todo usuario tiene un Assignment con rol `tirador`. Persiste aunque tenga otro rol funcional. |
| **Tirador temporal** | Usuario `is_temporary=True` sin credenciales. Para registrar resultados antes de crear la cuenta formal. |
| **Scope organizacional** | Filtrado de datos basado en la jerarquía de unidades. |
| **SessionCsrfAuthentication** | Clase de autenticación que lee la sesión Django desde cookies HttpOnly. |
| **TenantScopedQuerysetMixin** | Mixin DRF que filtra automáticamente por tenant + scope. |
| **X-Tenant-Code** | Header HTTP obligatorio en todos los requests autenticados. |
| **CSRF** | Cross-Site Request Forgery. La cookie `csrftoken` (legible por JS) debe enviarse como header `X-CSRFToken`. |
| **HttpOnly** | Atributo de cookie que impide que JS la lea. La `sessionid` es HttpOnly; la `csrftoken` no. |
| **must_change_password** | Flag en el usuario. True = debe cambiar contraseña en el próximo login. |
| **Armory** | Almacén físico de armamento dentro de una unidad militar. |
| **permission_code** | Código del permiso atómico (ej: `score_shooters`). Se usa para controlar la UI. |
| **Recinto** | Espacio físico que agrupa unidades militares sin implicar jerarquía de mando. Ej: Campo Militar Valdivia. |
| `todo_recinto` | Scope que da acceso a todas las unidades de un recinto. Solo activo cuando la Position tiene `recinto` asignado. Diseñado para el SICE de Campo Militar. |

## Recursos y acciones de la API → permission_codes

| resource:action | permission_code | Descripción |
|---|---|---|
| `user:read` | `view_personnel_basic` | Ver personal |
| `user:create` | `create_users` | Crear usuarios |
| `user:read_own` | `view_self` | Ver propio perfil |
| `shooting_session:create` | `create_shooting_lessons` | Crear lección |
| `shooting_result:create` | `score_shooters` | Registrar resultado |
| `shooting_result:export` | `view_personnel_full` | Exportar resultados |
| `weapon:read` | `view_warehouse` | Ver armamento |
| `organization_unit:read` | `view_unit` | Ver unidades |
| `position:create` | `assign_positions` | Asignar puestos |

Ver mapa completo en `apps/authorization/permissions.py` → `RESOURCE_ACTION_TO_PERMISSION`.
