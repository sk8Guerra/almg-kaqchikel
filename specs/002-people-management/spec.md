# Feature Specification: Gestión de Personas desde el Panel

**Feature Branch**: `002-people-management`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Gestión de personas desde el panel de la aplicación: un administrador con permiso puede dar de alta a una persona escribiendo su correo, asignarle y retirarle roles, y desactivarla. Elimina la necesidad de ir al dashboard del proveedor de identidad y el orden incómodo actual de 'primero que entre, luego le doy rol'."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Dar de alta a una persona con su rol de una vez (Priority: P1)

Una administradora de la Academia necesita que alguien nuevo pueda trabajar en el sistema. Abre
la pantalla de personas, escribe el correo, elige el rol y confirma. La persona queda dada de
alta y con permisos desde ese momento: puede entrar por su cuenta cuando quiera y trabajar de
inmediato. El sistema no envía ningún correo; avisar a la persona es cosa de la administradora.

**Why this priority**: Es la razón de existir del feature. Hoy el alta obliga a salir a otro
sistema, y además el rol no se puede asignar hasta que la persona haya entrado al menos una vez,
lo que parte una tarea en dos momentos separados por horas o días.

**Independent Test**: Dar de alta un correo nuevo con un rol, verificar que aparece en la lista
como sin ingresar todavía, y que al entrar por su cuenta esa persona puede ejecutar de inmediato
una acción que su rol permite, sin intervención adicional ni ningún correo de por medio.

**Acceptance Scenarios**:

1. **Given** una administradora con permiso de gestión, **When** da de alta un correo con el rol
   de edición, **Then** la persona queda registrada con ese rol y marcada como "sin ingresar
   todavía".
2. **Given** esa alta, **When** la persona entra por primera vez, **Then** puede ejecutar de
   inmediato las acciones de su rol, sin que nadie tenga que asignarle nada después.
3. **Given** una administradora, **When** da de alta un correo que ya existe en el sistema,
   **Then** el sistema lo rechaza indicando que ya está registrado y no crea un duplicado.
4. **Given** una administradora, **When** escribe un correo con formato inválido, **Then** el
   sistema lo rechaza antes de intentar crear nada.

---

### User Story 2 - Ver quién tiene acceso y con qué permisos (Priority: P1)

Una administradora necesita responder "¿quién puede entrar a este sistema y qué puede hacer?"
sin consultar dos sistemas distintos ni pedir ayuda técnica.

**Why this priority**: Es el requisito de auditoría mínimo de cualquier sistema con control de
acceso, y es la pantalla sobre la que se apoyan todas las demás acciones del feature. Entregada
sola ya tiene valor: visibilidad donde hoy no hay ninguna.

**Independent Test**: Con varias personas dadas de alta, abrir la lista y comprobar que muestra
correo, estado y roles de cada una, y que permite encontrar a alguien concreto.

**Acceptance Scenarios**:

1. **Given** varias personas registradas, **When** la administradora abre la lista, **Then** ve
   para cada una su correo, su nombre si lo hay, su estado y sus roles.
2. **Given** una lista larga, **When** busca por correo o nombre, **Then** obtiene las
   coincidencias sin recorrer toda la lista.
3. **Given** alguien que aún no ha entrado nunca, **When** aparece en la lista, **Then** se
   distingue claramente de quien ya ha iniciado sesión alguna vez.

---

### User Story 3 - Cambiar los roles de alguien (Priority: P2)

Una persona cambia de función dentro de la Academia. La administradora le asigna un rol nuevo o
le retira el que tenía, y el cambio surte efecto sin que esa persona pierda su cuenta ni tenga
que volver a darse de alta.

**Why this priority**: Necesario para operar en el tiempo, pero el sistema es utilizable sin
ello mientras los roles iniciales sean correctos.

**Independent Test**: Asignar un rol a alguien, comprobar que gana la capacidad correspondiente;
retirárselo, comprobar que la pierde, y que en ningún momento perdió el acceso a entrar.

**Acceptance Scenarios**:

1. **Given** una persona con rol de consulta, **When** la administradora le asigna el rol de
   edición, **Then** esa persona puede ejecutar acciones de edición a partir de su siguiente
   sesión como máximo.
2. **Given** una persona con un rol, **When** se le retira, **Then** pierde esas capacidades pero
   conserva su cuenta y su capacidad de entrar.
3. **Given** una persona con varios roles, **When** se le retira uno, **Then** conserva los
   permisos que le otorgan los demás.

---

### User Story 4 - Desactivar el acceso de alguien (Priority: P2)

Alguien deja la Academia. La administradora lo desactiva y esa persona deja de poder entrar,
pero su rastro en el sistema —lo que creó o editó— se conserva.

**Why this priority**: Es el cierre del ciclo de vida y una necesidad real de seguridad, pero no
bloquea la operación diaria mientras el equipo sea estable.

**Independent Test**: Desactivar a alguien con sesión abierta y comprobar que deja de poder
ejecutar acciones protegidas, y que sus datos anteriores siguen existiendo.

**Acceptance Scenarios**:

1. **Given** una persona activa, **When** la administradora la desactiva, **Then** deja de poder
   iniciar sesión.
2. **Given** una persona con sesión abierta, **When** se la desactiva, **Then** deja de poder
   ejecutar acciones protegidas dentro de un plazo acotado, sin esperar a que cierre sesión.
3. **Given** una persona desactivada, **When** se consulta el trabajo que había hecho, **Then**
   ese trabajo y su autoría siguen intactos.
4. **Given** una persona desactivada, **When** la administradora la reactiva, **Then** recupera
   el acceso con los roles que tenía.

---

### Edge Cases

- **Autodesactivación**: una administradora intenta desactivarse a sí misma.
- **Última administradora**: se intenta retirar el rol de administración a la única persona que
  lo tiene, dejando el sistema sin nadie que pueda gestionar personas.
- **Alta de alguien que ya existe en el proveedor de identidad pero no en el sistema** — por
  ejemplo, alguien dado de alta antes de este feature.
- **El proveedor de identidad rechaza el alta** (correo en lista de bloqueo, cuota agotada): no
  debe quedar un perfil local huérfano sin identidad correspondiente.
- **El proveedor acepta el alta pero falla el guardado local**: no debe quedar una identidad sin
  perfil que nadie pueda ver ni administrar desde la aplicación.
- **Alta simultánea del mismo correo** por dos administradoras a la vez.
- **Correo con distinta capitalización** que otro ya existente.
- **Persona desactivada que vuelve a ser dada de alta** con el mismo correo.

## Requirements _(mandatory)_

### Functional Requirements

**Alta de personas**

- **FR-001**: El sistema MUST permitir dar de alta a una persona indicando su correo electrónico.
- **FR-002**: El sistema MUST permitir asignar uno o más roles en el mismo acto del alta.
- **FR-003**: El sistema MUST crear tanto la identidad en el directorio externo como el perfil de
  negocio local en un solo acto, sin requerir que la persona haya iniciado sesión antes.
- **FR-004**: El sistema MUST rechazar el alta de un correo que ya corresponda a una persona
  registrada, sin crear duplicados.
- **FR-005**: El sistema MUST validar el formato del correo antes de intentar cualquier alta.
- **FR-006**: El sistema MUST tratar los correos sin distinguir mayúsculas de minúsculas al
  detectar duplicados.
- **FR-007**: El sistema MUST dejar el sistema en un estado consistente si el alta falla a mitad:
  no MUST quedar un perfil local sin identidad, ni una identidad sin perfil visible.
- **FR-008**: El sistema MUST NOT enviar correos de invitación ni de notificación al dar de alta.
  La persona ingresa por su cuenta desde la pantalla de acceso habitual; avisarle es una tarea
  humana, fuera del sistema.

**Consulta**

- **FR-009**: El sistema MUST mostrar la lista de personas registradas con su correo, nombre para
  mostrar, estado y roles.
- **FR-010**: El sistema MUST distinguir visiblemente a quien nunca ha iniciado sesión de quien
  ya lo ha hecho, para que se note si un alta quedó a medias.
- **FR-011**: El sistema MUST permitir buscar personas por correo o por nombre.

**Roles**

- **FR-012**: El sistema MUST permitir asignar y retirar roles a una persona ya registrada.
- **FR-013**: El sistema MUST aplicar los cambios de roles como máximo a partir de la siguiente
  sesión de esa persona, sin que pierda su cuenta.
- **FR-014**: El sistema MUST impedir que quede el sistema sin ninguna persona activa con
  capacidad de gestionar personas.

**Ciclo de vida**

- **FR-015**: El sistema MUST permitir desactivar y reactivar a una persona.
- **FR-016**: El sistema MUST impedir el ingreso de una persona desactivada.
- **FR-017**: El sistema MUST conservar el trabajo y la autoría de una persona desactivada.
- **FR-018**: El sistema MUST devolver a una persona reactivada los roles que tenía.
- **FR-019**: El sistema MUST impedir que alguien se desactive a sí mismo.

**Autorización y trazabilidad**

- **FR-020**: El sistema MUST exigir un permiso específico de gestión de personas para cada una
  de estas acciones, verificado del lado del servidor.
- **FR-021**: El sistema MUST negar estas acciones a cualquier persona sin ese permiso, aunque
  llegue a la pantalla o invoque la operación directamente.
- **FR-022**: El sistema MUST registrar quién realizó cada alta, cambio de rol y desactivación, y
  cuándo.
- **FR-023**: El sistema MUST NOT almacenar contraseñas ni tokens de sesión como resultado de
  ninguna de estas operaciones.

### Key Entities

- **Persona (User)**: la ya existente. Este feature añade la posibilidad de crearla y
  modificarla desde la aplicación, y de distinguir si ya ingresó alguna vez.
- **Rol (Role)** y **Permiso (Permission)**: los ya existentes. Se añade el permiso de gestión de
  personas.
- **Registro de actividad administrativa**: quién hizo qué acción sobre qué persona y cuándo.
  Solo lectura, no editable.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Una administradora da de alta a una persona con su rol en menos de 1 minuto, sin
  salir de la aplicación.
- **SC-002**: El alta requiere visitar **cero** sistemas externos, frente a los dos pasos y dos
  sistemas que exige hoy.
- **SC-003**: El 100% de las personas dadas de alta pueden ejecutar las acciones de su rol en su
  primer ingreso, sin ninguna intervención administrativa posterior.
- **SC-004**: Una administradora responde "quién tiene acceso y con qué permisos" consultando una
  sola pantalla.
- **SC-005**: El 100% de los intentos de estas acciones por parte de personas sin el permiso
  correspondiente son rechazados, verificado también al invocar la operación directamente.
- **SC-006**: Ningún fallo parcial del alta deja registros inconsistentes: tras un fallo simulado,
  el sistema no muestra personas sin identidad ni identidades sin persona.
- **SC-007**: Una persona desactivada deja de poder ejecutar acciones protegidas en menos de
  5 minutos.
- **SC-008**: Es imposible dejar el sistema sin ninguna persona activa capaz de gestionar
  personas.

## Assumptions

- **El directorio de identidad sigue siendo la fuente de verdad** de las credenciales y de quién
  puede autenticarse. Este feature no cambia eso: le pide al directorio que cree la identidad, en
  lugar de que un administrador la cree a mano en el panel del proveedor.
- **El registro público sigue deshabilitado.** Este feature es la única vía de alta desde la
  aplicación, y exige permiso administrativo. No reabre el auto-registro.
- **El método de ingreso no cambia**: código de un solo uso por correo, según la feature 001
  enmendada. Una persona recién dada de alta entra igual que cualquier otra, pidiendo su código
  en la pantalla de acceso.
- **Sin correos del sistema**: dar de alta no dispara ninguna notificación. Se asume que la
  administradora avisa a la persona por los medios habituales de la Academia. Esto evita
  depender de la entrega de correo para que el alta funcione, que fue justamente el problema que
  obligó a cambiar el enlace mágico por el código en la feature 001.
- **Los roles siguen siendo del sistema**, no del proveedor de identidad. Este feature administra
  su asignación, no traslada su definición.
- **Escala**: decenas de personas, no miles. La búsqueda simple basta; no se asume paginación
  compleja ni importación masiva.
- **Sin jerarquía entre administradores**: cualquier persona con el permiso de gestión puede
  actuar sobre cualquier otra, salvo sobre sí misma al desactivar (FR-019).
- **El catálogo de roles es fijo** en esta entrega: se asignan los roles existentes, no se crean
  ni editan roles nuevos desde la interfaz.

## Dependencies

- La feature 001 (`001-clerk-auth-foundation`) debe estar operativa: identidad, perfiles, roles y
  permisos ya existen y son la base sobre la que este feature construye.
- El directorio de identidad externo debe permitir crear y desactivar identidades por vía
  programática, no solo desde su panel.
- Debe existir al menos una persona con el permiso de gestión antes de usar este feature; la
  feature 001 lo resuelve con su procedimiento de primer administrador.

## Out of Scope

- Crear, editar o eliminar roles y permisos desde la interfaz.
- Importación masiva de personas desde archivo.
- Organizaciones, equipos o jerarquías de administración.
- Edición del perfil de otra persona (nombre, foto) desde la aplicación.
- Que una persona edite su propio perfil.
- Eliminación permanente de personas; este feature solo desactiva.
- Informes o exportación del registro de actividad administrativa.
