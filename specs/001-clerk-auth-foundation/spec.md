# Feature Specification: Acceso por Invitación con Código de un Solo Uso

**Feature Branch**: `001-clerk-auth-foundation`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Clerk es el proveedor de identidad y sesión. Nuestra base de datos NUNCA guarda contraseñas ni tokens de sesión — solo un perfil de negocio (User) sincronizado desde Clerk, con roles/permisos propios (Role, Permission). Configurar Prisma y Clerk como primer feature. SOLO usuarios que ya existan en el proveedor pueden iniciar sesión en ALMG, con su correo, con código de un solo uso."

**Enmendado 2026-08-19**: el método de acceso pasó de enlace mágico a código de un solo
uso enviado por correo. Motivo en Assumptions.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Iniciar sesión con código de un solo uso (Priority: P1)

Una persona autorizada de la ALMG abre la aplicación, escribe su correo institucional y solicita
acceso. Recibe un correo con un código de un solo uso; al escribirlo queda dentro de la aplicación
sin haber escrito ninguna contraseña.

**Why this priority**: Sin esto no hay producto. Es la única puerta de entrada al sistema y todo
lo demás (contenido, administración, contribuciones) queda detrás de ella. Entregado por sí solo
ya tiene valor demostrable: el equipo puede entrar a un área privada.

**Independent Test**: Con una cuenta previamente dada de alta, pedir acceso desde la pantalla de
ingreso, escribir el código recibido por correo y comprobar que la aplicación reconoce a la persona
y muestra su identidad. No requiere que existan roles ni contenido.

**Acceptance Scenarios**:

1. **Given** una persona con cuenta ya registrada por un administrador, **When** escribe su correo
   y solicita acceso, **Then** recibe un código de acceso en ese correo en menos de 1 minuto.
2. **Given** que recibió el código, **When** lo escribe por primera vez, **Then** entra a la
   aplicación y ve su nombre o correo como sesión activa.
3. **Given** que ya usó el código una vez, **When** intenta reutilizarlo, **Then** el sistema
   lo rechaza y le ofrece solicitar uno nuevo.
4. **Given** que solicitó el código hace más de la ventana de validez, **When** lo escribe,
   **Then** el sistema informa que expiró y le ofrece solicitar uno nuevo.

---

### User Story 2 - Rechazar a quien no está autorizado (Priority: P1)

Una persona que no ha sido dada de alta escribe su correo en la pantalla de ingreso. El sistema no
le crea una cuenta ni le permite entrar.

**Why this priority**: Es la otra mitad de la misma regla de negocio y tiene el mismo peso: el
acceso es por invitación. Un sistema que deja entrar a cualquiera con correo válido sería un
defecto de seguridad, no una funcionalidad incompleta.

**Independent Test**: Escribir un correo que no existe en el directorio de identidad y comprobar
que no se crea cuenta, no llega código de acceso utilizable, y no se obtiene sesión.

**Acceptance Scenarios**:

1. **Given** un correo que no corresponde a ninguna cuenta registrada, **When** la persona
   solicita acceso, **Then** no se crea ninguna cuenta nueva y no obtiene sesión.
2. **Given** ese mismo intento, **When** el sistema responde, **Then** el mensaje mostrado no
   revela si el correo existe o no en el sistema.
3. **Given** la aplicación en producción, **When** alguien busca una opción de "crear cuenta" o
   "registrarse", **Then** no existe tal opción en ninguna pantalla.

---

### User Story 3 - Perfil de negocio sincronizado (Priority: P2)

Cuando alguien entra por primera vez, la aplicación reconoce su identidad y crea o actualiza su
perfil interno (nombre, correo, estado) para poder asociarle trabajo, autoría y permisos. Si su
nombre o correo cambian en el directorio de identidad, el perfil interno refleja el cambio.

**Why this priority**: Necesario para que el resto del sistema pueda referirse a personas
(autoría de entradas, historial de cambios), pero el ingreso ya funciona sin él, así que va
después.

**Independent Test**: Entrar con una cuenta nueva y verificar que quedó registrada como persona
del sistema; cambiar el nombre en el directorio de identidad, volver a entrar y verificar que el
perfil interno se actualizó.

**Acceptance Scenarios**:

1. **Given** una persona que entra por primera vez, **When** la sesión se establece, **Then**
   queda creado su perfil interno asociado de forma estable a su identidad.
2. **Given** una persona que ya entró antes, **When** vuelve a entrar, **Then** se reutiliza su
   perfil existente y no se duplica.
3. **Given** que su nombre cambió en el directorio de identidad, **When** vuelve a entrar,
   **Then** el perfil interno muestra el nombre nuevo.
4. **Given** cualquier perfil interno, **When** se inspecciona lo que el sistema guarda de esa
   persona, **Then** no contiene contraseñas, hashes de contraseña ni tokens de sesión.

---

### User Story 4 - Autorización por roles y permisos (Priority: P3)

Un administrador asigna roles a las personas. Cada rol agrupa permisos, y la aplicación permite o
niega acciones según los permisos de la persona que hizo la solicitud.

**Why this priority**: Da valor cuando ya hay más de un tipo de usuario y acciones que proteger.
Al inicio todas las personas autorizadas pueden hacer lo mismo, así que puede esperar.

**Independent Test**: Crear dos roles con permisos distintos, asignarlos a dos personas, y
comprobar que una puede ejecutar una acción protegida y la otra recibe una negación.

**Acceptance Scenarios**:

1. **Given** una persona sin el permiso requerido, **When** intenta una acción protegida,
   **Then** la acción es rechazada y no produce ningún cambio.
2. **Given** una persona con el permiso requerido mediante alguno de sus roles, **When** ejecuta
   la acción, **Then** la acción se completa.
3. **Given** que se retira un rol a una persona, **When** vuelve a intentar la acción,
   **Then** es rechazada sin necesidad de recrear su cuenta.
4. **Given** una persona recién dada de alta a la que nadie asignó rol, **When** intenta una
   acción protegida, **Then** es rechazada (sin permisos por omisión).

---

### Edge Cases

- **Cuenta desactivada**: alguien dado de baja en el directorio de identidad conserva un código
  válido en su correo. El sistema debe negarle la entrada aunque el código no haya expirado.
- **Sesión abierta y baja posterior**: alguien con sesión activa es desactivado. El sistema debe
  dejar de permitirle acciones protegidas dentro de un plazo acotado, sin esperar a que cierre
  sesión.
- **Correo con mayúsculas o alias**: `Nombre@Dominio.gt` y `nombre@dominio.gt` deben resolver a la
  misma persona y no generar dos perfiles.
- **Solicitudes repetidas**: pedir el código varias veces seguidas no debe permitir usar el
  sistema como amplificador de correo hacia un tercero.
- **Código usado en otro dispositivo o navegador** distinto al que lo solicitó.
- **Correo que nunca llega** (buzón lleno, filtro de spam): la persona necesita una salida clara,
  no una pantalla en espera indefinida.
- **Primera persona del sistema**: no puede haber un estado donde nadie pueda entrar porque nadie
  fue dado de alta todavía.
- **Directorio de identidad no disponible**: la aplicación debe informar la indisponibilidad en
  lugar de dejar entrar o mostrar un error técnico.

## Requirements _(mandatory)_

### Functional Requirements

**Ingreso e identidad**

- **FR-001**: El sistema MUST permitir solicitar acceso indicando únicamente una dirección de
  correo electrónico.
- **FR-002**: El sistema MUST enviar un código de acceso de un solo uso al correo indicado,
  siempre que ese correo corresponda a una cuenta ya existente en el directorio de identidad.
- **FR-003**: El sistema MUST establecer la sesión al recibir un código válido, sin solicitar
  contraseña en ningún momento del flujo.
- **FR-004**: El sistema MUST invalidar cada código de acceso después de su primer uso.
- **FR-005**: El sistema MUST invalidar los códigos de acceso transcurrido un plazo máximo de
  15 minutos desde su emisión.
- **FR-006**: El sistema MUST NOT crear cuentas nuevas como resultado de una solicitud de acceso.
- **FR-007**: El sistema MUST NOT exponer ninguna función de auto-registro público en ninguna
  pantalla.
- **FR-008**: El sistema MUST responder de forma indistinguible ante correos existentes e
  inexistentes, de modo que no se pueda deducir quién tiene cuenta.
- **FR-009**: El sistema MUST negar el acceso a cuentas marcadas como desactivadas en el
  directorio de identidad, incluso si presentan un código no expirado.
- **FR-010**: El sistema MUST permitir cerrar sesión, y tras hacerlo MUST exigir un nuevo código
  para volver a entrar.
- **FR-011**: El sistema MUST limitar la cantidad de solicitudes de acceso por correo y por origen
  en una ventana de tiempo, para impedir el uso abusivo del envío de correos.

**Perfil de negocio**

- **FR-012**: El sistema MUST mantener un perfil interno por persona, vinculado de forma estable y
  única a su identidad en el directorio externo.
- **FR-013**: El sistema MUST crear el perfil interno la primera vez que la persona entra, y
  reutilizarlo en ingresos posteriores sin duplicar.
- **FR-014**: El sistema MUST actualizar los datos del perfil interno (nombre, correo, estado)
  cuando cambien en el directorio de identidad.
- **FR-015**: El sistema MUST NOT almacenar contraseñas, hashes de contraseña, factores de
  segundo paso, ni tokens de sesión en su propio almacenamiento.
- **FR-016**: El sistema MUST tratar las direcciones de correo sin distinguir mayúsculas de
  minúsculas al identificar a una persona.

**Autorización**

- **FR-017**: El sistema MUST permitir definir roles, cada uno agrupando un conjunto de permisos.
- **FR-018**: El sistema MUST permitir asignar y retirar uno o más roles a cada persona.
- **FR-019**: El sistema MUST decidir si permite una acción protegida en función de los permisos
  derivados de los roles de quien la solicita.
- **FR-020**: El sistema MUST negar por omisión: una persona sin roles no puede ejecutar acciones
  protegidas.
- **FR-021**: El sistema MUST aplicar los cambios de roles sin requerir que la persona vuelva a
  crear su cuenta, y como máximo a partir de su siguiente sesión.
- **FR-022**: El sistema MUST evaluar la autorización del lado del servidor, de modo que ocultar
  un control en la interfaz no sea el único mecanismo de protección.

**Continuidad y aislamiento del proveedor**

- **FR-023**: El sistema MUST poder sustituir el proveedor de identidad sin reescribir las reglas
  de negocio ni el modelo de roles y permisos.
- **FR-024**: El sistema MUST informar de forma comprensible cuando el directorio de identidad no
  esté disponible, en lugar de conceder acceso o mostrar un error técnico.
- **FR-025**: El sistema MUST contar con un mecanismo documentado para dar de alta a la primera
  persona administradora, de modo que nunca exista un estado sin acceso posible.

### Key Entities

- **Persona (User)**: perfil de negocio de alguien autorizado a usar el sistema. Atributos:
  referencia estable a su identidad externa, correo, nombre para mostrar, estado (activa o
  inactiva), fecha de alta y de última actualización. No contiene credenciales.
- **Rol (Role)**: agrupación nombrada de permisos que describe una función dentro de la ALMG
  (por ejemplo, quien administra, quien edita contenido, quien solo consulta). Relación de muchos
  a muchos con Persona.
- **Permiso (Permission)**: capacidad concreta y verificable que el sistema puede exigir antes de
  ejecutar una acción. Relación de muchos a muchos con Rol.
- **Identidad externa**: la cuenta que vive en el proveedor de identidad. No es almacenada por el
  sistema; solo se guarda la referencia que la vincula con la Persona.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Una persona autorizada completa su ingreso, desde que escribe su correo hasta que
  ve la aplicación, en menos de 2 minutos.
- **SC-002**: El código de acceso llega al buzón de la persona en menos de 1 minuto en el 95% de
  las solicitudes.
- **SC-003**: El 100% de los intentos de ingreso con correos no registrados terminan sin sesión y
  sin cuenta creada.
- **SC-004**: Una revisión del contenido almacenado por el sistema encuentra cero contraseñas,
  cero hashes de contraseña y cero tokens de sesión.
- **SC-005**: El 100% de las acciones protegidas quedan bloqueadas para personas sin el permiso
  correspondiente, verificado también al invocar la acción directamente y no solo desde la
  interfaz.
- **SC-006**: Un administrador cambia los roles de una persona y el efecto es observable en menos
  de 5 minutos, sin recrear cuentas.
- **SC-007**: El 90% de las personas autorizadas logran entrar en su primer intento, sin ayuda.
- **SC-008**: Sustituir el proveedor de identidad no obliga a modificar las reglas de negocio ni
  el modelo de roles y permisos; el cambio queda contenido en la capa de integración.

## Assumptions

- **Acceso por invitación**: el alta de personas ocurre fuera de este feature, mediante el panel
  del proveedor de identidad o una invitación enviada por un administrador. Este feature cubre el
  ingreso, no la administración de altas.
- **Código de un solo uso como único método** en esta entrega. El proveedor puede ofrecer
  contraseña o segundo factor, pero la aplicación expone solo el código por correo. Habilitar
  más métodos es configuración del proveedor y no requiere cambios en las reglas de negocio.
- **Por qué código y no enlace mágico** (decisión del 2026-08-19, tras probar con enlace): los
  servidores de correo institucionales —el dominio de la Academia entre ellos— suelen
  pre-abrir los enlaces entrantes para escanearlos. Como el enlace es de un solo uso (FR-004),
  el escáner lo consume antes de que la persona haga clic y el acceso falla sin explicación
  visible. Un código escrito a mano es inmune a eso, y también al requisito de "mismo
  dispositivo y navegador" que rompía el flujo al abrir el correo desde otro navegador.
- **Vigencia del código**: 15 minutos y un solo uso, valores estándar de la industria, ajustables
  sin cambiar el alcance.
- **El proveedor de identidad es la fuente de verdad** para credenciales, verificación de correo y
  estado de la cuenta. El sistema es fuente de verdad para roles y permisos.
- **Roles iniciales**: el catálogo concreto de roles y permisos de la ALMG se define durante la
  planificación; este feature exige que el mecanismo exista y niegue por omisión.
- **Sin migración de usuarios**: no hay una base de personas previa que trasladar.
- **Idioma de la interfaz**: español, coherente con el público de la ALMG.
- **Alcance de datos**: este feature establece la persistencia necesaria para Persona, Rol y
  Permiso. El resto del modelo de datos del producto queda fuera.

## Dependencies

- Un proveedor de identidad externo que soporte código de un solo uso por correo, entrega de correo
  transaccional, y consulta del estado de las cuentas. La decisión de arquitectura ya tomada lo
  fija en Clerk, y la aplicación lo consume a través de un puerto, conforme al Principio VI de
  `.specify/memory/constitution.md`.
- Una base de datos gestionada, ya aprovisionada, para el perfil de negocio y el modelo de
  autorización.
- Credenciales de ambos servicios, disponibles para el entorno de desarrollo.

## Out of Scope

- Alta, baja y edición de personas desde la propia aplicación (se hace en el panel del proveedor).
- Pantallas de administración para crear y asignar roles mediante interfaz gráfica.
- Registro público, recuperación de contraseña y verificación de correo (los cubre el proveedor).
- Inicio de sesión con proveedores sociales, SSO institucional o segundo factor.
- Organizaciones, equipos o multi-inquilino.
- Auditoría detallada de accesos y sesiones.
