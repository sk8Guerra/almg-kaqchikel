# Feature Specification: Autorización de Dos Roles

**Feature Branch**: `003-two-role-authorization`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Solo admin y member. Un admin puede hacer las cuatro operaciones en todos los módulos, presentes y futuros, sin que nadie tenga que enumerarlas. Un member no tiene ningún permiso por omisión: hay que especificar explícitamente a qué módulos tiene acceso y qué puede hacer en cada uno. Al crear a alguien se elige primero el rol; si es admin no se pregunta nada más."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Dar de alta un administrador en un solo paso (Priority: P1)

Una administradora da de alta a otra persona como administradora. Escribe el correo, elige
"Administración" y confirma. No se le pregunta nada más: esa persona puede hacer todo, en todas
las áreas del sistema, incluidas las que aún no existen.

**Why this priority**: Es la mitad del modelo y la que resuelve el problema de mantenimiento
actual. Hoy, añadir un área del sistema obliga a acordarse de concedérsela a cada administrador;
si alguien lo olvida, un administrador queda sin acceso a algo que debería poder hacer, y el
fallo es silencioso.

**Independent Test**: Dar de alta a alguien como administrador sin seleccionar ningún permiso,
comprobar que puede operar el área existente, y después introducir un área nueva en el sistema y
comprobar que puede operarla **sin haber modificado nada de esa persona**.

**Acceptance Scenarios**:

1. **Given** una administradora en la pantalla de alta, **When** elige el rol de administración,
   **Then** la selección de permisos desaparece o queda deshabilitada, porque no aplica.
2. **Given** una persona recién dada de alta como administradora, **When** intenta cualquiera de
   las cuatro operaciones en cualquier área, **Then** todas son permitidas.
3. **Given** un sistema con administradores ya existentes, **When** se incorpora un área nueva,
   **Then** todas las personas con rol de administración pueden operarla de inmediato, sin que
   nadie edite sus datos.

---

### User Story 2 - Dar de alta un miembro con permisos explícitos (Priority: P1)

Una administradora da de alta a alguien como miembro. Al elegir ese rol aparece la lista de áreas
del sistema, y para cada una las cuatro operaciones. Debe marcar explícitamente qué puede hacer y
dónde. Sin ninguna marca, no puede confirmar.

**Why this priority**: Es la otra mitad del modelo y la que sostiene el principio de mínimo
privilegio. Entregar solo la historia 1 dejaría un sistema donde la única forma de dar acceso es
conceder acceso total.

**Independent Test**: Dar de alta a alguien como miembro concediéndole únicamente lectura en un
área, y comprobar que puede leer ahí y que todo lo demás —otras operaciones en esa área, y
cualquier operación en las demás— le es negado.

**Acceptance Scenarios**:

1. **Given** una administradora en la pantalla de alta, **When** elige el rol de miembro,
   **Then** aparece la selección de áreas y operaciones.
2. **Given** el rol de miembro elegido, **When** intenta confirmar sin marcar ninguna operación,
   **Then** el sistema no lo permite y explica que debe indicar al menos una.
3. **Given** un miembro con lectura en un área concreta, **When** intenta escribir en esa área,
   **Then** es rechazado.
4. **Given** ese mismo miembro, **When** intenta cualquier operación en otra área, **Then** es
   rechazado.
5. **Given** un miembro con permisos en varias áreas, **When** opera, **Then** se le permite
   exactamente lo marcado y nada más.

---

### User Story 3 - Ajustar los permisos de un miembro (Priority: P2)

Una administradora abre a un miembro y cambia lo que puede hacer: le concede una operación nueva
en un área, o le retira una que ya tenía.

**Why this priority**: Necesario para operar en el tiempo, pero el sistema es utilizable mientras
los permisos iniciales sean correctos.

**Independent Test**: Conceder una operación a un miembro y comprobar que la gana; retirársela y
comprobar que la pierde, sin que en ningún momento pierda el acceso al sistema.

**Acceptance Scenarios**:

1. **Given** un miembro sin cierta operación, **When** se le concede, **Then** puede ejecutarla
   como máximo a partir de su siguiente sesión.
2. **Given** un miembro con cierta operación, **When** se le retira, **Then** deja de poder
   ejecutarla y conserva las demás.
3. **Given** un miembro, **When** se le retiran todos sus permisos, **Then** conserva su cuenta y
   puede entrar, pero no puede hacer nada.

---

### User Story 4 - Cambiar el rol de una persona (Priority: P3)

Una administradora convierte a un miembro en administrador, o degrada a un administrador a
miembro indicando qué permisos conserva.

**Why this priority**: Ocurre con poca frecuencia y se puede resolver mientras tanto dando de baja
y de alta. Se entrega cuando las anteriores estén estables.

**Independent Test**: Promover a un miembro y comprobar que gana acceso total sin seleccionar
nada; degradar a un administrador y comprobar que el sistema exige indicar sus permisos.

**Acceptance Scenarios**:

1. **Given** un miembro con permisos concretos, **When** se le promueve a administrador,
   **Then** pasa a poder hacer todo, y sus permisos anteriores dejan de ser relevantes.
2. **Given** un administrador, **When** se le degrada a miembro, **Then** el sistema exige indicar
   explícitamente qué permisos conserva, igual que en un alta.
3. **Given** el único administrador activo, **When** se intenta degradarlo, **Then** el sistema lo
   impide.

---

### Edge Cases

- **Último administrador**: degradarlo, desactivarlo o quitarle el rol dejaría el sistema sin
  nadie capaz de conceder permisos.
- **Autodegradación**: un administrador se convierte a sí mismo en miembro.
- **Miembro con permisos sobre el área de personas**: podría ver, y potencialmente modificar, a
  quienes administran el sistema.
- **Miembro sin ningún permiso**: entra y no ve nada; debe entender por qué en lugar de encontrar
  pantallas vacías o errores.
- **Área retirada del sistema**: quedan permisos concedidos que ya no corresponden a nada.
- **Permiso concedido dos veces** sobre la misma área y operación.
- **Personas con los roles anteriores** (edición, consulta) en el momento del cambio de modelo.
- **Cambio de rol de alguien con sesión abierta**: debe surtir efecto sin esperar a que salga.

## Requirements _(mandatory)_

### Functional Requirements

**Modelo de roles**

- **FR-001**: El sistema MUST ofrecer exactamente dos roles: administración y miembro.
- **FR-002**: El sistema MUST NOT permitir crear, editar ni eliminar roles desde la aplicación.
- **FR-003**: El sistema MUST asignar exactamente un rol a cada persona.
- **FR-004**: El sistema MUST sustituir los roles anteriores (edición, consulta) por este modelo,
  sin dejar roles huérfanos que nada compruebe.

**Autoridad del administrador**

- **FR-005**: El sistema MUST permitir a toda persona con rol de administración las cuatro
  operaciones —crear, leer, actualizar y eliminar— en todas las áreas del sistema.
- **FR-006**: El sistema MUST otorgar esa autoridad **sin enumerar permisos**: no MUST existir
  ningún registro por administrador y por área que haya que mantener.
- **FR-007**: El sistema MUST extender automáticamente la autoridad de los administradores a las
  áreas que se incorporen en el futuro, sin modificar ningún dato de esas personas.

**Permisos del miembro**

- **FR-008**: El sistema MUST negar por omisión: una persona con rol de miembro no tiene ninguna
  capacidad mientras no se le conceda explícitamente.
- **FR-009**: El sistema MUST permitir conceder a un miembro cualquier combinación de área y
  operación **de las que el área declare concedibles**. Un área no MUST ofrecer una operación
  que ningún permiso puede habilitar.
- **FR-009a**: El área de personas MUST declarar concedible únicamente la lectura, porque crear,
  actualizar y desactivar personas es la autoridad que FR-018 reserva a la administración.
  Ofrecerlas en la matriz sería conceder permisos que se guardan y no habilitan nada.
- **FR-010**: El sistema MUST exigir al menos una operación concedida para dar de alta a un
  miembro.
- **FR-011**: El sistema MUST permitir conceder y retirar permisos a un miembro después del alta.
- **FR-012**: El sistema MUST tratar la concesión repetida del mismo permiso como una sola, sin
  duplicados.
- **FR-013**: El sistema MUST conservar la cuenta de un miembro al que se le retiran todos sus
  permisos; deja de poder actuar, no de existir.

**Alta y cambio de rol**

- **FR-014**: El sistema MUST pedir el rol antes que cualquier otra decisión de autorización al
  dar de alta a una persona.
- **FR-015**: El sistema MUST NOT solicitar selección de permisos cuando el rol elegido es
  administración.
- **FR-016**: El sistema MUST exigir selección explícita de permisos cuando el rol elegido es
  miembro, tanto al dar de alta como al degradar a un administrador.
- **FR-017**: El sistema MUST permitir cambiar el rol de una persona sin recrear su cuenta.

**Prevención de escalada de privilegios**

- **FR-018**: El sistema MUST reservar la asignación de roles y la concesión o retirada de
  permisos exclusivamente a personas con rol de administración.
- **FR-019**: El sistema MUST NOT permitir que un miembro obtenga esa capacidad mediante ningún
  permiso concedible.
- **FR-020**: El sistema MUST impedir que el sistema quede sin ninguna persona activa con rol de
  administración, ya sea por degradación, desactivación o cambio de rol.
- **FR-021**: El sistema MUST impedir que una persona se degrade a sí misma.

**Aplicación y verificación**

- **FR-022**: El sistema MUST evaluar la autorización del lado del servidor en cada operación
  protegida, de modo que ocultar un control en la interfaz no sea el único mecanismo.
- **FR-023**: El sistema MUST aplicar los cambios de rol y de permisos como máximo a partir de la
  siguiente sesión de la persona afectada.
- **FR-024**: El sistema MUST explicar a un miembro sin permisos por qué no ve contenido, en lugar
  de mostrarle pantallas vacías o errores.
- **FR-025**: El sistema MUST registrar quién cambió el rol o los permisos de quién, y cuándo.

### Key Entities

- **Persona (User)**: la ya existente. Pasa a llevar exactamente un rol.
- **Rol**: valor fijo del sistema, administración o miembro. No es un registro que se administre;
  es una propiedad de la persona.
- **Área del sistema**: una parte del producto sobre la que se concede acceso (personas,
  formularios, inscripciones, clases). El catálogo crece cuando el producto crece.
- **Operación**: crear, leer, actualizar o eliminar.
- **Permiso concedido**: la combinación de área y operación otorgada **a una persona concreta**.
  Existe únicamente para miembros; los administradores no tienen permisos concedidos porque su
  autoridad no se enumera.

> **Cambio de modelo respecto de lo anterior**: hasta ahora los permisos se agrupaban en roles y
> las personas recibían roles. Con solo dos roles y permisos definidos persona a persona, ese
> agrupamiento deja de agrupar nada: dos miembros pueden tener permisos completamente distintos.
> Los permisos pasan a concederse directamente a la persona.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Dar de alta a un administrador requiere **cero** decisiones de permisos.
- **SC-002**: Incorporar un área nueva al sistema requiere **cero** modificaciones sobre los datos
  de los administradores existentes, y estos pueden operarla de inmediato.
- **SC-003**: Un miembro puede ejecutar exactamente las operaciones que se le concedieron, y
  ninguna más, verificado también invocando las operaciones directamente y no solo desde la
  interfaz.
- **SC-004**: El 100% de los intentos de un miembro por asignar roles o conceder permisos son
  rechazados.
- **SC-005**: Es imposible dejar el sistema sin ninguna persona activa con rol de administración,
  por cualquier vía.
- **SC-006**: Una administradora completa el alta de un miembro con sus permisos en menos de
  2 minutos.
- **SC-007**: Un cambio de rol o de permisos es efectivo en menos de 5 minutos, sin recrear
  cuentas.
- **SC-008**: Los permisos concedidos sobre áreas que ya no existen son **detectables e inertes**:
  una revisión los reporta, y quien los tenga no gana ninguna capacidad por ellos.

## Assumptions

- **Áreas del sistema hoy**: solo existe el área de personas. Formularios, inscripciones y clases
  se nombran como ejemplos de crecimiento previsto, no como alcance de esta entrega. La selección
  de permisos mostrará las áreas que existan en cada momento.
- **Al menos un permiso para un miembro**: se exige para evitar altas vacías por descuido. Si más
  adelante conviene registrar a alguien sin acceso todavía, es una relajación de FR-010 que no
  cambia el modelo.
- **Sin jerarquía entre administradores**: todos los administradores son equivalentes; cualquiera
  puede actuar sobre cualquier otro, salvo sobre sí mismo al degradarse (FR-021).
- **Promover no conserva permisos**: al pasar a administrador, los permisos concedidos dejan de
  consultarse. Si después se degrada, se piden de nuevo; no se restauran los antiguos, para que la
  autoridad resultante sea siempre una decisión consciente.
- **Sin migración de datos**: los roles anteriores existían solo en datos de arranque y no hay
  personas en producción que trasladar.
- **La granularidad es área × operación**. No se contemplan permisos sobre registros concretos
  ("puede editar este formulario pero no aquel"); si hiciera falta, es un modelo distinto.

## Dependencies

- Las features 001 y 002 deben estar operativas: identidad, perfiles, autorización del lado del
  servidor y la pantalla de gestión de personas son la base que este feature redefine.
- El registro de actividad administrativa existente se reutiliza para FR-025.

## Out of Scope

- Crear, editar o eliminar roles desde la interfaz.
- Permisos sobre registros individuales en lugar de sobre áreas completas.
- Plantillas o perfiles de permisos reutilizables entre miembros.
- Jerarquías de administración o delegación parcial de la capacidad de conceder permisos.
- Los módulos de formularios, inscripciones y clases en sí mismos; aquí solo se prevé que el
  catálogo de áreas pueda crecer.
- Consultar o exportar el registro de actividad administrativa desde la interfaz.
