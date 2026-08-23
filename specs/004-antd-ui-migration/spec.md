# Feature Specification: Barra lateral y unificación visual del panel

**Feature Branch**: `004-antd-ui-migration`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "I want to install and.design as ui library for this project y migrar los componentes actuales, comenzando por usar un sidebar"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Navegar el panel desde una barra lateral permanente (Priority: P1)

Una persona autorizada entra al panel y ve, a la izquierda de la pantalla, una barra lateral fija
con las áreas a las que tiene acceso. Puede saltar de un área a otra sin volver primero a una
pantalla intermedia, y en todo momento la barra indica en qué área está parada. La barra muestra
también quién ha iniciado sesión y desde dónde cerrar sesión.

**Why this priority**: Hoy la única forma de llegar a "Personas" es un enlace suelto dentro del
panel, y la única forma de regresar es un enlace "Volver". Eso ya cuesta clics con una sola área;
en cuanto la Academia agregue diccionario, lecciones o medios, se vuelve inmanejable. La barra
lateral es la pieza que convierte el panel en una aplicación navegable y es requisito de todo lo
demás.

**Independent Test**: Se prueba entrando al panel con una cuenta autorizada y navegando entre el
inicio del panel y cada área listada usando solo la barra lateral; entrega valor aunque ninguna
pantalla interior haya cambiado todavía.

**Acceptance Scenarios**:

1. **Given** una persona con rol de administración que inició sesión, **When** abre cualquier
   pantalla del panel, **Then** ve la barra lateral con todas las áreas del sistema y el elemento
   correspondiente a la pantalla actual resaltado.
2. **Given** una persona con rol de miembro y permiso de lectura sobre "Personas", **When** abre
   el panel, **Then** la barra lateral lista "Personas" y ninguna área sobre la que no tenga
   permiso.
3. **Given** una persona activa sin ningún permiso asignado, **When** abre el panel, **Then** la
   barra lateral no ofrece ninguna área y la pantalla explica que debe pedir permisos a
   administración.
4. **Given** una persona en la pantalla de detalle de una persona, **When** pulsa "Personas" en
   la barra lateral, **Then** llega al listado sin pasar por el inicio del panel.
5. **Given** una persona con sesión iniciada, **When** mira la barra lateral, **Then** encuentra
   ahí su identidad y la acción de cerrar sesión, sin depender de la cabecera de cada pantalla.

---

### User Story 2 - Consultar el listado de personas con una tabla y una búsqueda consistentes (Priority: P2)

Quien administra abre "Personas" y encuentra el listado presentado como una tabla legible: encabezados
claros, estados y roles distinguibles de un vistazo, y un buscador que se comporta igual que
cualquier otro campo del sistema. Los estados "Activa", "Sin ingresar todavía" y "Desactivada" se
distinguen sin tener que leer con atención.

**Why this priority**: Es la pantalla más usada del panel y la que hoy peor se lee: tabla sin
estilo, permisos como una lista de texto separada por comas y estados diferenciados solo por color.
Es la primera pantalla donde una gramática visual común se nota.

**Independent Test**: Se prueba abriendo `/panel/personas` con varias personas dadas de alta en
estados distintos y verificando que el listado, el filtro y los estados se leen correctamente; no
depende de que los formularios ya estén migrados.

**Acceptance Scenarios**:

1. **Given** varias personas registradas en distintos estados, **When** se abre el listado,
   **Then** cada fila muestra correo, nombre, estado, rol y permisos con la misma jerarquía visual
   que el resto del sistema.
2. **Given** un texto en el buscador, **When** se envía la búsqueda, **Then** el listado se reduce
   a las coincidencias y el texto buscado permanece visible en el campo.
3. **Given** una búsqueda sin coincidencias, **When** se muestra el resultado, **Then** aparece un
   mensaje de listado vacío en lugar de una tabla sin filas.
4. **Given** una persona con rol de administración, **When** ve el listado, **Then** cada correo
   lleva al detalle de esa persona; **Given** un miembro sin permiso de edición, **Then** los
   correos se muestran como texto plano.

---

### User Story 3 - Dar de alta y editar personas con formularios uniformes (Priority: P3)

Quien administra da de alta a alguien nuevo, le asigna rol y permisos, y más tarde edita esos
valores o desactiva la cuenta. Todos esos formularios —alta, cambio de rol, matriz de permisos,
desactivar/reactivar— se ven y se comportan igual: mismos campos, mismos botones, misma forma de
mostrar el resultado de la operación.

**Why this priority**: Es donde ocurre el trabajo real de administración, pero solo tiene sentido
migrarlo cuando el contenedor (US1) y el listado (US2) ya establecieron la gramática visual que
estos formularios deben seguir.

**Independent Test**: Se prueba dando de alta una persona, cambiándole el rol, marcando permisos en
la matriz y desactivándola, comprobando que cada operación confirma su resultado en pantalla.

**Acceptance Scenarios**:

1. **Given** el formulario de alta, **When** se elige el rol "Miembro", **Then** aparece la matriz
   de permisos; **When** se elige "Administración", **Then** la matriz se sustituye por la
   explicación de que ese rol tiene todos los permisos.
2. **Given** un alta enviada con un correo válido, **When** la operación termina, **Then** el
   resultado se comunica en pantalla mediante el mismo mecanismo de aviso que usan las demás
   operaciones del panel.
3. **Given** un alta enviada con un correo inválido o ya registrado, **When** la operación falla,
   **Then** el error se muestra asociado al formulario y ninguna persona se crea.
4. **Given** la pantalla de detalle de una persona, **When** se cambian rol y permisos y se
   guarda, **Then** los cambios quedan reflejados al volver al listado.
5. **Given** una persona activa, **When** se desactiva, **Then** la acción se confirma y su estado
   cambia a "Desactivada" en el listado.
6. **Given** la matriz de permisos, **When** se navega con teclado, **Then** cada casilla es
   alcanzable y su etiqueta identifica área y acción.

---

### Edge Cases

- Una persona con permiso de lectura sobre un área pero no de escritura ve el área en la barra
  lateral y entra a ella, pero no encuentra ahí acciones que no puede ejecutar.
- Una persona desactivada que conserva una sesión abierta no debe poder navegar a ninguna área
  desde la barra lateral.
- En pantallas angostas (teléfono) la barra lateral no puede robar el ancho del contenido: debe
  poder colapsarse o abrirse bajo demanda, y el contenido seguir siendo usable.
- Con el sistema operativo en modo oscuro o con el zoom del navegador al 200 %, el panel sigue
  siendo legible y ningún control queda fuera de la pantalla.
- Si una operación falla por indisponibilidad del servicio de identidad o de la base de datos, el
  panel muestra el aviso de error existente sin perder la barra lateral ni dejar la pantalla en
  blanco.
- Cuando el catálogo de áreas crezca, la barra lateral debe listar la nueva área sin que haya que
  editar cada pantalla del panel.
- Al recargar una pantalla profunda (detalle de persona) la barra lateral aparece con el área
  correcta resaltada desde el primer render, sin parpadeo de selección.

## Requirements _(mandatory)_

### Functional Requirements

#### Barra lateral y contenedor del panel

- **FR-001**: Todas las pantallas bajo `/panel` MUST compartir un contenedor común compuesto por
  barra lateral de navegación y área de contenido; ninguna pantalla del panel puede dibujar su
  propia cabecera de navegación.
- **FR-002**: La barra lateral MUST derivar sus elementos del catálogo de áreas del sistema y de
  los permisos de quien mira, mostrando únicamente las áreas sobre las que esa persona tiene al
  menos permiso de lectura.
- **FR-003**: La barra lateral MUST indicar visualmente el área correspondiente a la pantalla
  actual.
- **FR-004**: La barra lateral MUST exponer la identidad de la sesión activa y la acción de cerrar
  sesión.
- **FR-005**: Cuando quien mira no tiene ninguna área accesible, el panel MUST mostrar el aviso de
  "sin permisos asignados" y no presentar elementos de navegación.
- **FR-006**: La barra lateral MUST poder colapsarse y expandirse, y MUST arrancar colapsada u
  oculta en anchos de pantalla de teléfono.
- **FR-007**: Agregar un área nueva al catálogo del sistema MUST bastar para que aparezca en la
  barra lateral, sin modificar las pantallas existentes.
- **FR-008**: Los enlaces "Volver al panel" y "Volver a personas" MUST desaparecer de las
  pantallas, sustituidos por la navegación de la barra lateral.

#### Pantallas migradas

- **FR-009**: El listado de personas MUST presentarse como tabla con encabezados de columna,
  estado de listado vacío y celdas legibles para estado, rol y permisos.
- **FR-010**: El buscador del listado MUST conservar el término consultado tras enviar la búsqueda
  y MUST seguir funcionando sin JavaScript en el cliente.
- **FR-011**: El formulario de alta de persona, los controles de rol/permisos y las acciones de
  desactivar y reactivar MUST usar los mismos controles de formulario, botones y avisos que el
  resto del panel.
- **FR-012**: La matriz de permisos MUST seguir generándose a partir del catálogo de áreas y
  acciones, con cada casilla etiquetada por área y acción para lectores de pantalla.
- **FR-013**: El resultado de toda operación (alta, cambio de rol, cambio de permisos,
  desactivación, reactivación) MUST comunicarse mediante un mecanismo de aviso único y consistente,
  anunciado a tecnologías de asistencia.
- **FR-014**: La pantalla de detalle de persona MUST seguir mostrando rol y estado, y MUST seguir
  ocultando los controles de edición a quien no tenga rol de administración.

#### Adopción de la librería

- **FR-015**: La librería de interfaz MUST configurarse una sola vez en la raíz de la aplicación,
  de modo que color, tipografía, espaciado y radio se definan en un único lugar.
- **FR-016**: La configuración MUST incluir el idioma español para los textos que la propia
  librería aporta (paginación, tablas vacías, selectores de fecha).
- **FR-017**: La librería MUST convivir con el proveedor de identidad existente sin alterar el
  flujo de inicio de sesión.
- **FR-018**: Ninguna pantalla del panel puede quedar a medio migrar: al cerrar la feature, todas
  las pantallas bajo `/panel` usan la librería y no queda estilo propio compitiendo con ella salvo
  el ajuste de composición del contenedor.
- **FR-019**: Las reglas de arquitectura vigentes MUST seguir cumpliéndose: la interfaz sigue
  obteniendo datos y permisos únicamente a través del SDK del módulo correspondiente, y la barra
  lateral no consulta datos por su cuenta.
- **FR-020**: La constitución del proyecto MUST enmendarse para registrar la excepción acotada que
  esta adopción introduce en la regla "sin estilos inline / estilos en módulos SCSS", dejando claro
  qué sigue prohibido en código propio.

### Key Entities

- **Área de navegación**: una capacidad del sistema que puede aparecer en la barra lateral. Tiene
  una etiqueta visible, una ruta de destino y el permiso de lectura que la habilita. Se deriva del
  catálogo de áreas ya existente; esta feature no crea ni persiste datos nuevos.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Desde cualquier pantalla del panel, llegar a cualquier otra área accesible toma
  exactamente una interacción, frente a las dos o tres que exige hoy el recorrido por el inicio del
  panel.
- **SC-002**: El 100 % de las pantallas bajo `/panel` presentan la misma barra lateral y la misma
  familia de controles al terminar la feature.
- **SC-003**: Una persona que no ha visto antes el panel identifica correctamente en qué área está
  y a qué otras áreas puede ir, en menos de 10 segundos.
- **SC-004**: Ninguna persona ve en la barra lateral un área para la que carece de permiso de
  lectura, verificado para los dos roles y para una cuenta sin permisos.
- **SC-005**: El panel es utilizable en pantallas desde 360 px de ancho: ningún control queda
  cortado ni fuera de alcance, y la navegación sigue disponible.
- **SC-006**: Todas las pantallas del panel se recorren completas con teclado y todos los
  controles interactivos tienen nombre accesible.
- **SC-007**: Los cuatro controles de calidad del proyecto (formato, reglas de arquitectura, tipos
  y pruebas) pasan en verde al cerrar la feature.
- **SC-008**: Agregar un área nueva al catálogo la hace aparecer en la barra lateral sin tocar
  ninguna pantalla existente, comprobado con un área de prueba.

## Assumptions

- La librería solicitada es **Ant Design** (`ant.design` / paquete `antd`); "and.design" en la
  petición original se interpreta como esa librería, confirmado con la persona solicitante.
- El alcance de esta feature son las pantallas bajo `/panel` (inicio del panel, listado de
  personas y detalle de persona) más el contenedor raíz necesario para configurar el tema.
- **Fuera de alcance**: la página pública de inicio (`/`), la pantalla de ingreso (`/ingresar`,
  que renderiza componentes del proveedor de identidad) y la pantalla de error de la raíz. La
  configuración de tema aplicará a toda la aplicación, pero esas pantallas conservan su
  presentación actual y se migrarán en una feature posterior.
- No se introducen áreas nuevas: el catálogo actual contiene una sola área ("Personas"), de modo
  que la barra lateral se valida con un único elemento más el inicio del panel. El requisito de
  extensibilidad (FR-007, SC-008) se comprueba con un área de prueba temporal.
- No cambian el modelo de datos, las reglas de autorización ni los casos de uso del módulo de
  acceso; esta feature toca únicamente la capa de adaptadores y presentación.
- El comportamiento del buscador se mantiene igual que hoy: envío de formulario con recarga de
  servidor, sin filtrado en el cliente.
- La aplicación permanece en español para todo texto visible; el idioma de la interfaz no se
  vuelve configurable en esta feature.
- La adopción de una librería con estilos propios entra en conflicto con la regla constitucional
  de "estilos en módulos SCSS colocados"; se resuelve con una excepción acotada a la librería
  (FR-020), no derogando la regla para el código propio.
- El proveedor de identidad actual sigue aportando el control de sesión; la barra lateral lo
  aloja, no lo sustituye.
