# Feature Specification: Formularios de inscripción a los cursos de Kaqchikel

**Feature Branch**: `005-enrollment-forms`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Trabajar los 6 formularios de inscripción (L1 y L2 × principiante, intermedio y
avanzado), tomando como ejemplo el formulario de Google 'RUTZ'IB'AXIK B'I'AJ 2026 — KAQCHIKEL TIJONÏK — ROX XAK
TIJONÏK L2'. Las plantillas van quemadas en el código con una key que las crea y las enlaza con su fila en la
tabla. Los administradores con permiso de edición configuran cuándo está disponible cada formulario: año,
municipio, fechas y horarios. Los formularios activos se muestran en grid en la raíz del sitio, donde cualquier
persona puede inscribirse. Hay que impedir un segundo envío del mismo formulario y dejar una marca en el
navegador que apunte a la persona, el formulario y las fechas que llenó, de modo que pueda volver a inscribirse
cuando el formulario se habilite en otras fechas. Las direcciones se eligen de una lista predeterminada de
departamentos, municipios y zonas de Guatemala. Apegarse al modelo entidad-relación del proyecto
(form_template, form_offering, form_submission, modality, student) y crear el estudiante en el mismo momento en
que se envía el formulario. En el panel debo poder ver las inscripciones generadas en una tabla similar a la de
usuarios, un menú de estudiantes con los perfiles creados al enviar un formulario, y otra pestaña de
convocatorias donde queden registradas también las pasadas y cerradas. El objetivo es poder generar reportes a
fin de año, por ejemplo para analizar edades de inscripción, sexo, etc."

**Fuentes**: capturas del formulario vigente de Google Forms (23 preguntas, 2 páginas) y notas de la entrevista
con Marta, Beatriz y Bilmer de la Comunidad Lingüística Kaqchikel.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Inscribirse en un curso desde la página pública (Priority: P1)

Una persona interesada en aprender Kaqchikel entra a la raíz del sitio y ve, en una cuadrícula, únicamente los
cursos cuya inscripción está abierta hoy. Cada tarjeta dice de qué curso se trata (vía L1 o L2, nivel
principiante/intermedio/avanzado), en qué modalidad y horario se imparte, dónde y hasta cuándo puede
inscribirse. Elige uno, llena el formulario, adjunta los documentos que se le piden, lo envía y recibe en
pantalla la confirmación de que su inscripción quedó registrada, con el aviso de que la Academia se comunicará
por correo electrónico.

**Why this priority**: Es la razón de ser de la funcionalidad. Hoy la Academia recibe las inscripciones en
Google Forms, con los datos dispersos en hojas de cálculo y sin relación con el resto del sistema. Sin esta
historia no hay producto; las demás la administran, la protegen o la explotan.

**Independent Test**: Se prueba con una convocatoria abierta cargada de antemano: se entra a la raíz sin sesión
iniciada, se llena el formulario completo con sus adjuntos y se verifica que la inscripción quedó registrada y
que la persona existe como estudiante. Entrega valor aunque el panel todavía no permita configurar nada.

**Acceptance Scenarios**:

1. **Given** dos convocatorias abiertas hoy y cuatro cerradas, **When** una persona abre la raíz del sitio,
   **Then** la cuadrícula muestra solo las dos abiertas, cada una con su curso, modalidad, horario, municipio y
   fecha de cierre.
2. **Given** ninguna convocatoria abierta, **When** una persona abre la raíz del sitio, **Then** la página
   explica que no hay inscripciones abiertas en este momento y no ofrece ningún formulario.
3. **Given** una convocatoria abierta, **When** la persona llena todas las preguntas obligatorias, adjunta los
   documentos exigidos y envía, **Then** el sistema registra la inscripción con la fecha y hora del envío y
   muestra una confirmación con el nombre del curso y los datos de inicio de clases.
4. **Given** una persona que dejó vacía una pregunta obligatoria o un documento exigido, **When** intenta
   enviar, **Then** el sistema señala exactamente qué falta, conserva todo lo ya escrito y no registra nada.
5. **Given** una persona llenando el formulario, **When** llega a las preguntas de residencia, **Then** elige
   departamento y municipio de una lista predeterminada de Guatemala, y el listado de municipios corresponde al
   departamento elegido.
6. **Given** una persona que responde "Manäq / No" al compromiso de recibir el curso en la modalidad de la
   convocatoria, **When** intenta enviar, **Then** el sistema explica que el compromiso es indispensable y no
   registra la inscripción.
7. **Given** una inscripción registrada, **When** se consulta el padrón, **Then** existe un estudiante con su
   nombre, documento de identificación, sexo y municipio de residencia, creado a partir de esa misma
   inscripción.

---

### User Story 2 - Crear, abrir y cerrar convocatorias desde el panel (Priority: P2)

Quien administra entra a la pestaña de convocatorias del panel, elige uno de los seis formularios del catálogo y
crea una convocatoria para un año, un municipio y una ventana de fechas y horas determinadas, indicando la
modalidad, la fecha de inicio de clases y el horario del curso. Puede cerrarla antes de tiempo, volver a abrirla
en otras fechas y repetir la operación cada año. La pestaña conserva también las convocatorias pasadas y
cerradas, de modo que existe el registro histórico de todo lo que se ha convocado.

**Why this priority**: Es lo que convierte los seis formularios en algo reutilizable año con año y sin
intervención técnica. La Historia 1 ya entrega valor con una convocatoria precargada, pero sin esta historia la
Academia no es autónoma.

**Independent Test**: Se prueba desde el panel con una cuenta con permiso de edición: se crea una convocatoria
con fechas futuras, se verifica que no aparece en la raíz, se adelanta su fecha de apertura y se verifica que
aparece; luego se cierra y se verifica que desaparece de la raíz pero sigue listada en el historial.

**Acceptance Scenarios**:

1. **Given** una persona con permiso de edición sobre inscripciones, **When** abre la pestaña de convocatorias,
   **Then** ve todas las convocatorias con su formulario, año, municipio, modalidad, ventana y estado
   (programada, abierta, cerrada), y puede filtrarlas por año, formulario y estado.
2. **Given** esa misma persona, **When** crea una convocatoria eligiendo formulario, año, municipio, ventana,
   modalidad, fecha de inicio y horario, **Then** la convocatoria queda registrada y visible en el historial
   aunque su ventana todavía no haya empezado.
3. **Given** una persona con permiso solo de lectura, **When** abre la misma pestaña, **Then** puede consultar
   las convocatorias y su historial pero no crear, editar, abrir ni cerrar ninguna.
4. **Given** una persona sin sesión iniciada, **When** intenta entrar a la sección de inscripciones del panel,
   **Then** el sistema la envía a iniciar sesión y no revela ninguna configuración.
5. **Given** una convocatoria con ventana del 1 al 15 de febrero, **When** el día es 20 de febrero, **Then** la
   convocatoria no aparece en la raíz y ningún envío suyo es aceptado, aunque alguien conserve el enlace.
6. **Given** una convocatoria abierta, **When** quien administra la cierra manualmente, **Then** deja de
   aparecer en la raíz de inmediato y los formularios a medio llenar ya no pueden enviarse.
7. **Given** el mismo formulario ya convocado para 2026 en Tecpán en modalidad virtual, **When** quien
   administra lo convoca para 2026 en Chimaltenango en modalidad presencial, **Then** ambas convocatorias
   coexisten y cada una recibe sus propias inscripciones.
8. **Given** una convocatoria con inscripciones ya recibidas, **When** quien administra intenta cambiar su
   formulario, su año o su municipio, **Then** el sistema lo impide y explica que esa convocatoria ya tiene
   inscripciones.
9. **Given** una convocatoria cerrada hace dos años, **When** quien administra consulta el historial, **Then**
   la encuentra con sus fechas, su configuración y el número de inscripciones que recibió.

---

### User Story 3 - Impedir que la misma persona se inscriba dos veces (Priority: P3)

Una persona que ya se inscribió y vuelve a la página encuentra el curso marcado como "ya te inscribiste" en
lugar del formulario en blanco. Si intenta enviar de nuevo —desde el mismo navegador, desde otro, o borrando los
datos del navegador— el sistema rechaza el segundo envío. Cuando la Academia vuelve a abrir ese mismo curso en
otras fechas, la persona puede inscribirse otra vez sin obstáculos.

**Why this priority**: Los envíos duplicados son el problema operativo que la Academia reporta hoy: ensucian el
conteo de cupos, distorsionan los reportes y obligan a depurar a mano. Es una salvaguarda sobre la Historia 1.

**Independent Test**: Se prueba enviando dos veces la misma inscripción, la segunda desde otro navegador, y
verificando que solo queda registrada una; luego se abre una convocatoria nueva del mismo curso y se verifica
que el mismo documento sí puede inscribirse.

**Acceptance Scenarios**:

1. **Given** una persona que ya envió su inscripción a una convocatoria, **When** vuelve a la raíz en el mismo
   navegador, **Then** la tarjeta de ese curso indica que ya se inscribió y en qué fecha, en lugar de invitar a
   llenarlo.
2. **Given** un documento de identificación ya inscrito en una convocatoria, **When** llega un segundo envío con
   ese mismo documento a la misma convocatoria desde otro navegador, **Then** el sistema lo rechaza, explica que
   ya existe una inscripción y no crea un segundo registro.
3. **Given** una persona que borró los datos de su navegador, **When** vuelve a la raíz, **Then** la tarjeta
   vuelve a ofrecer el formulario, pero el envío sigue siendo rechazado por duplicado.
4. **Given** una persona inscrita en la convocatoria 2026 de un curso, **When** la Academia abre la convocatoria
   2027 del mismo curso, **Then** puede inscribirse y quedan registradas dos inscripciones distintas asociadas
   al mismo estudiante.
5. **Given** una persona ya inscrita en "L2 principiante", **When** se inscribe en "L1 intermedio" en la misma
   temporada, **Then** el sistema lo permite: la restricción es por convocatoria, no por persona.

---

### User Story 4 - Consultar y exportar las inscripciones recibidas (Priority: P4)

Quien administra abre la pestaña de inscripciones y encuentra un listado en tabla —con la misma forma de leerse
que el listado de personas del panel: búsqueda, columnas claras y estados distinguibles de un vistazo— con todas
las inscripciones recibidas. Puede filtrarlas por convocatoria, formulario, año y municipio, abrir el detalle de
cualquiera para ver todas sus respuestas y descargar los documentos que la acompañan, y bajar el listado
filtrado como hoja de cálculo.

**Why this priority**: Es lo que hace utilizable el dato recogido y lo que sustituye de verdad a la hoja de
cálculo de Google Forms. Depende de que existan inscripciones, por eso va después de las historias anteriores.

**Independent Test**: Se prueba con varias inscripciones registradas en dos convocatorias: se abre la pestaña,
se filtra por una convocatoria, se verifica el conteo y el detalle de una inscripción, y se descarga el listado.

**Acceptance Scenarios**:

1. **Given** inscripciones recibidas en varias convocatorias, **When** quien administra abre la pestaña de
   inscripciones, **Then** ve la tabla con nombre, documento, municipio de residencia, curso, convocatoria y
   fecha de envío, y el total de registros que cumple el filtro activo.
2. **Given** esa tabla, **When** quien administra busca por nombre o documento, **Then** el listado se reduce a
   las coincidencias sin perder el filtro de convocatoria.
3. **Given** una inscripción del listado, **When** quien administra la abre, **Then** ve todas las respuestas
   tal como fueron enviadas y puede descargar cada documento adjunto.
4. **Given** un listado filtrado, **When** quien administra lo exporta, **Then** obtiene una hoja de cálculo con
   una fila por inscripción y una columna por pregunta del formulario, con los mismos registros que veía.
5. **Given** una persona con permiso solo de lectura sobre inscripciones, **When** abre la pestaña, **Then**
   puede consultar y exportar, pero no modificar ni eliminar ninguna inscripción.

---

### User Story 5 - Consultar el padrón de estudiantes (Priority: P5)

El panel gana un área de estudiantes: el padrón de todas las personas creadas al enviarse un formulario. Quien
administra lo abre, busca a una persona por nombre o documento y ve su expediente: sus datos personales y todas
las inscripciones que ha hecho a lo largo de los años, con su curso y su fecha.

**Why this priority**: Es la vista que da continuidad entre años y la que permite saber que una misma persona
pasó de principiante a intermedio. No es indispensable para recibir inscripciones, pero sí para que el dato
sirva de algo más que un listado anual.

**Independent Test**: Se prueba con una persona inscrita en dos convocatorias de años distintos: se busca en
estudiantes y se verifica que aparece una sola vez y que su expediente lista las dos inscripciones.

**Acceptance Scenarios**:

1. **Given** inscripciones registradas, **When** quien administra abre el área de estudiantes, **Then** ve el
   padrón en tabla con nombre, documento, sexo, municipio de residencia y número de inscripciones.
2. **Given** una persona que se inscribió dos veces con el mismo documento, **When** se consulta el padrón,
   **Then** aparece una sola vez y su expediente lista las dos inscripciones con su curso y su fecha.
3. **Given** el padrón, **When** quien administra busca por nombre o documento, **Then** encuentra a la persona
   sin recorrer el listado completo.
4. **Given** una persona con permiso solo de lectura, **When** abre el área de estudiantes, **Then** consulta el
   padrón sin poder modificarlo.

---

### User Story 6 - Obtener el resumen anual de las inscripciones (Priority: P6)

Al cerrar el año, quien administra abre el resumen de un año o de una convocatoria y ve cuántas personas se
inscribieron y cómo se distribuyen por sexo, rango de edad, pueblo de pertenencia, municipio de residencia,
modalidad y curso. Puede descargar ese resumen para incorporarlo al informe de la Academia.

**Why this priority**: Es el objetivo de fondo del cambio —poder analizar quién se inscribe— pero se sostiene
sobre datos que las historias anteriores ya recogen y exportan; llega al final porque hasta ese momento el
resumen se puede obtener a mano desde la exportación.

**Independent Test**: Se prueba con inscripciones de distintos sexos, edades y municipios en un mismo año: se
abre el resumen y se verifica que los conteos coinciden con los registros y que suman el total.

**Acceptance Scenarios**:

1. **Given** inscripciones registradas en un año, **When** quien administra abre el resumen de ese año,
   **Then** ve el total de inscripciones y su distribución por sexo, rango de edad, pueblo de pertenencia,
   municipio de residencia, modalidad y curso.
2. **Given** ese resumen, **When** quien administra lo acota a una convocatoria, **Then** los conteos
   corresponden solo a esa convocatoria y siguen sumando su total.
3. **Given** un resumen en pantalla, **When** quien administra lo descarga, **Then** obtiene los mismos conteos
   en una hoja de cálculo.

---

### Edge Cases

- **La ventana se cierra mientras alguien llena el formulario**: el envío se rechaza con una explicación clara y
  se conserva lo escrito; no se registra una inscripción fuera de ventana.
- **Dos envíos simultáneos con el mismo documento a la misma convocatoria**: solo uno queda registrado; el otro
  recibe el mensaje de duplicado.
- **El mismo documento vuelve con nombre o municipio distintos**: se reutiliza el estudiante existente y se
  registra la discrepancia en la inscripción, sin sobrescribir en silencio el expediente.
- **Documento de identificación mal formado** (menos o más de 13 dígitos, con letras): se rechaza en el momento
  de escribirlo, no al enviar.
- **Un adjunto que no es PDF, excede el tamaño o falla a medio subir**: se explica el motivo y se conserva el
  resto del formulario; no queda una inscripción a medias con documentos faltantes.
- **La persona vive fuera de los municipios listados o en el extranjero**: la lista de departamentos y
  municipios cubre todo el país; para la institución donde labora se admite además que no aplique.
- **Zona**: solo los municipios que están divididos en zonas la ofrecen; en los demás la pregunta no aparece.
- **Preguntas condicionadas al nivel**: la constancia del nivel anterior se pide en intermedio y avanzado, nunca
  en principiante; el formulario de avanzado pide las dos constancias.
- **"Otro" en lengua materna o segunda lengua**: se admite texto libre con varios idiomas separados por comas.
- **Convocatoria del mismo formulario abierta en dos municipios o dos modalidades a la vez**: la raíz muestra
  ambas tarjetas diferenciadas y cada envío queda asociado a la convocatoria correcta.
- **Cambio de año**: al abrir la convocatoria de un año nuevo, las inscripciones del año anterior no se
  arrastran ni se borran, y el historial de convocatorias las conserva.
- **Exportación de un listado grande**: la descarga se completa sin que quien administra tenga que dividirla por
  partes.
- **Horario de Guatemala**: apertura y cierre se interpretan siempre en la hora local de Guatemala (UTC-6), sin
  importar desde dónde se conecte la persona.
- **Marca del navegador ausente, corrupta o de otra persona**: nunca es la fuente de verdad; el sistema decide
  con lo que tiene registrado y la marca solo mejora lo que se muestra.

## Requirements _(mandatory)_

### Catálogo de formularios

- **FR-001**: El sistema MUST reconocer exactamente seis formularios de inscripción, uno por cada combinación de
  vía (L1, L2) y nivel (principiante, intermedio, avanzado).
- **FR-002**: Cada formulario MUST tener una clave estable y legible (por ejemplo `l2-avanzado`) que lo
  identifica de forma única y no cambia entre entornos ni entre años.
- **FR-003**: El contenido de los seis formularios —preguntas, orden, opciones, obligatoriedad y documentos
  exigidos— MUST estar definido en el propio producto y no ser editable desde la interfaz en esta entrega.
- **FR-004**: El sistema MUST poder registrar el catálogo de formularios en sus datos a partir de esa
  definición, de modo que cada formulario registrado quede enlazado a su definición por la clave, la operación
  se pueda repetir sin duplicar registros y una convocatoria siempre sepa a qué formulario pertenece.
- **FR-005**: Cada formulario MUST declarar la vía (L1 o L2) y el nivel a los que corresponde, y MUST exponer un
  nombre legible en Kaqchikel y en español para mostrarlo a las personas.
- **FR-006**: Un formulario MUST NOT fijar la modalidad: el mismo formulario sirve para el grupo virtual y para
  el presencial, y es la convocatoria la que declara en cuál se impartirá ese grupo.
- **FR-007**: El sistema MUST rechazar una convocatoria que apunte a una clave de formulario desconocida.

### Convocatorias (disponibilidad del formulario)

- **FR-008**: El sistema MUST permitir abrir un formulario para un año determinado, un municipio determinado y
  una ventana con fecha y hora de apertura y de cierre.
- **FR-009**: Un mismo formulario MUST poder estar convocado varias veces —distintos años, municipios,
  modalidades o ventanas— y cada convocatoria MUST recibir sus inscripciones por separado.
- **FR-010**: Cada convocatoria MUST declarar la modalidad en que se impartirá el curso, la fecha de inicio de
  clases y el horario, y esos datos MUST mostrarse tanto en la tarjeta como en el encabezado del formulario.
- **FR-011**: Solo las personas con permiso de edición sobre inscripciones MUST poder crear, modificar, abrir o
  cerrar una convocatoria; el resto de personas autorizadas MUST poder consultarlas sin modificarlas.
- **FR-012**: Quien administra MUST poder cerrar una convocatoria antes de su fecha de cierre y volver a
  abrirla, y el cambio MUST surtir efecto de inmediato para el público.
- **FR-013**: El sistema MUST conservar las convocatorias pasadas y cerradas como registro histórico, con su
  configuración, sus fechas y el número de inscripciones que recibieron.
- **FR-014**: El sistema MUST rechazar una convocatoria cuya fecha de cierre no sea posterior a la de apertura.
- **FR-015**: El sistema MUST impedir cambiar el formulario, el año o el municipio de una convocatoria que ya
  tenga inscripciones.
- **FR-016**: El sistema MUST dejar constancia de quién configuró cada convocatoria.
- **FR-017**: Toda fecha y hora de apertura y cierre MUST interpretarse en la hora local de Guatemala.

### Página pública

- **FR-018**: La raíz del sitio MUST mostrar en cuadrícula todas las convocatorias abiertas en ese momento y
  ninguna otra.
- **FR-019**: Cada tarjeta MUST indicar el curso, la vía y el nivel, la modalidad, el horario, el municipio y la
  fecha de cierre de la inscripción.
- **FR-020**: Cualquier persona MUST poder llenar y enviar un formulario abierto sin iniciar sesión ni crear una
  cuenta.
- **FR-021**: La raíz MUST seguir ofreciendo el acceso al panel para quienes administran, sin mezclarlo con la
  inscripción.
- **FR-022**: Cuando no haya ninguna convocatoria abierta, la raíz MUST explicarlo en lugar de mostrar una
  cuadrícula vacía.

### Contenido del formulario

- **FR-023**: Todo formulario MUST abrir con el compromiso de recibir el curso en la modalidad de la
  convocatoria, planteado en Kaqchikel y español como "Ja' / Sí" o "Manäq / No"; responder "No" MUST impedir el
  envío con una explicación.
- **FR-024**: Todo formulario MUST recoger las siguientes respuestas, con las obligatorias marcadas como tales y
  enunciadas en Kaqchikel y en español:

  | #   | Pregunta (Kaqchikel / Español)                                              | Tipo de respuesta                        | Obligatoria       |
  | --- | --------------------------------------------------------------------------- | ---------------------------------------- | ----------------- |
  | 1   | Taqoya'l / Correo electrónico                                               | Correo                                   | Sí                |
  | 2   | Ab'i' / Nombres                                                             | Texto                                    | Sí                |
  | 3   | Ab'i' / Apellidos                                                           | Texto                                    | Sí                |
  | 4   | Rajilab'al awujil / Número de Documento Personal de Identificación          | 13 dígitos                               | Sí                |
  | 5   | Akuchi' yasamäj / Nombre de la institución donde labora actualmente         | Texto                                    | No                |
  | 6   | Dirección de la institución donde labora                                    | Texto                                    | No                |
  | 7   | Departamento donde se ubica la institución                                  | Lista de departamentos                   | No                |
  | 8   | Municipio donde se ubica la institución                                     | Lista de municipios del departamento     | No                |
  | 9   | Rub'i' ri atinamital / Departamento donde vive actualmente                  | Lista de departamentos                   | Sí                |
  | 10  | Rub'i' ri atinamit akuchi' at k'äs / Municipio donde vive actualmente       | Lista de municipios del departamento     | Sí                |
  | 11  | Zona                                                                        | Lista de zonas del municipio             | Solo donde aplica |
  | 12  | Awochochib'al / Dirección de domicilio                                      | Texto                                    | Sí                |
  | 13  | Rajilab'al awoyonib'al / Número de teléfono                                 | Teléfono                                 | Sí                |
  | 14  | Rukojolil winäq / Sexo                                                      | Ixöq/Femenino, Achi/Masculino            | Sí                |
  | 15  | Ab'anob'al / Pueblo al que pertenece                                        | Maya, Garífuna, Xinka, Ladino, Otro      | Sí                |
  | 16  | Tacha' qa jun amaq'el / Nacionalidad                                        | Lista de países                          | Sí                |
  | 17  | Ajuna' / Rango de edad                                                      | 14–30, 31–60, más de 60                  | Sí                |
  | 18  | ¿La k'o jun k'ayewal pan ach'akul? / ¿Tiene alguna discapacidad física?     | Ja'/Sí, Manäq/No                         | Sí                |
  | 19  | Asamaj / Profesión u oficio                                                 | Texto                                    | Sí                |
  | 20  | Nab'ey ach'ab'äl / Lengua materna                                           | Kaqchikel, Castellano, Otro              | Sí                |
  | 21  | Ruka'n ach'ab'äl / Segunda lengua                                           | Kaqchikel, Castellano, Otro              | Sí                |
  | 22  | Awetamab'al pa ruwi' ri Kaqchikel ch'ab'äl / Nivel de dominio del Kaqchikel | Habla; Habla y lee; Habla, lee y escribe | Sí                |

- **FR-025**: Las preguntas de residencia —departamento, municipio, zona y dirección de domicilio— MUST
  presentarse juntas y en ese orden, por ser una sola idea para quien responde.
- **FR-026**: El nombre de la institución donde labora MUST estar separado de su dirección y de su ubicación
  administrativa, en preguntas distintas.
- **FR-027**: Al elegir "Otro" en lengua materna o en segunda lengua, la persona MUST poder escribir uno o
  varios idiomas separados por comas.
- **FR-028**: Los municipios ofrecidos MUST corresponder al departamento elegido, y las zonas MUST ofrecerse
  únicamente en los municipios que están divididos en zonas.
- **FR-029**: El formulario MUST cerrar con la información de la convocatoria —modalidad, fecha de inicio,
  horario— y con el aviso de que el correo electrónico es el único medio por el que la Academia informará.
- **FR-030**: El formulario MUST poder recorrerse y enviarse desde un teléfono, que es como llega la mayoría de
  las personas.

### Documentos adjuntos

- **FR-031**: Cada formulario MUST declarar qué documentos exige: copia del documento de identificación, carta
  de compromisos y ficha de inscripción en los seis; constancia del nivel principiante aprobado en intermedio y
  avanzado; constancia del nivel intermedio aprobado solo en avanzado.
- **FR-032**: Para los documentos que la persona debe llenar antes de subir —carta de compromisos y ficha de
  inscripción— el formulario MUST ofrecer la descarga de la plantilla correspondiente desde el mismo formulario.
- **FR-033**: El sistema MUST aceptar únicamente archivos PDF de hasta 10 MB por documento, rechazando el resto
  con una explicación.
- **FR-034**: Los documentos recibidos MUST quedar asociados a la inscripción que los acompañó y al tipo de
  documento que satisfacen, y MUST poder descargarse desde el detalle de la inscripción.
- **FR-035**: Los documentos MUST NOT ser accesibles públicamente: solo las personas autorizadas del panel
  pueden descargarlos.

### Envío, estudiante y duplicados

- **FR-036**: Al enviarse una inscripción, el sistema MUST registrar todas las respuestas junto con la
  convocatoria a la que pertenecen y el momento del envío.
- **FR-037**: En el mismo momento del envío, el sistema MUST crear el estudiante con los datos de identidad de
  la inscripción —nombres y apellidos, documento de identificación, sexo y municipio de residencia— y asociarlo
  a ella.
- **FR-038**: Si el documento de identificación ya corresponde a un estudiante registrado, el sistema MUST
  reutilizar ese estudiante en lugar de crear uno nuevo.
- **FR-039**: El sistema MUST rechazar un segundo envío del mismo documento de identificación a la misma
  convocatoria, con independencia del navegador o dispositivo usado.
- **FR-040**: El mismo documento de identificación MUST poder inscribirse en convocatorias distintas, sean de
  otro año, otro municipio, otra modalidad u otro curso.
- **FR-041**: El navegador MUST recordar qué convocatorias llenó esa persona y en qué fecha, y la cuadrícula
  MUST usar esa marca para señalar los cursos ya enviados.
- **FR-042**: Esa marca del navegador MUST ser solo una ayuda visual: perderla o alterarla no MUST permitir un
  envío duplicado ni bloquear uno legítimo.
- **FR-043**: El sistema MUST rechazar cualquier envío recibido fuera de la ventana de la convocatoria o
  dirigido a una convocatoria cerrada.
- **FR-044**: Una inscripción registrada MUST NOT poder modificarse ni eliminarse desde el panel en esta
  entrega: es el testimonio de lo que la persona envió.
- **FR-045**: Tras un envío aceptado, la persona MUST ver una confirmación que nombre el curso y repita cuándo y
  cómo iniciarán las clases.

### Panel: inscripciones, estudiantes y reportes

- **FR-046**: El panel MUST ganar tres áreas gobernadas por el esquema de permisos existente: convocatorias,
  inscripciones y estudiantes; cada una MUST aparecer en la navegación solo para quien tenga permiso sobre ella.
- **FR-047**: El listado de inscripciones MUST presentarse como tabla con búsqueda, con la misma forma de leerse
  que el listado de personas del panel, y MUST mostrar nombre, documento, municipio de residencia, curso,
  convocatoria y fecha de envío.
- **FR-048**: El listado de inscripciones MUST poder filtrarse por convocatoria, formulario, año y municipio, y
  MUST indicar cuántos registros cumplen el filtro activo.
- **FR-049**: El detalle de una inscripción MUST mostrar todas las respuestas tal como fueron enviadas, junto
  con sus documentos descargables.
- **FR-050**: Quien administra MUST poder exportar el listado de inscripciones filtrado como hoja de cálculo,
  con una fila por inscripción y una columna por pregunta del formulario.
- **FR-051**: El área de estudiantes MUST mostrar en tabla con búsqueda el padrón de personas creadas por las
  inscripciones, con nombre, documento, sexo, municipio de residencia y número de inscripciones.
- **FR-052**: El expediente de un estudiante MUST listar todas sus inscripciones, con su curso, su convocatoria
  y su fecha, y MUST permitir abrir cada una.
- **FR-053**: El sistema MUST ofrecer un resumen por año y por convocatoria con el total de inscripciones y su
  distribución por sexo, rango de edad, pueblo de pertenencia, municipio de residencia, modalidad y curso.
- **FR-054**: Ese resumen MUST poder descargarse como hoja de cálculo.
- **FR-055**: Los datos personales de las inscripciones MUST NOT ser visibles para quien no tenga permiso de
  lectura sobre inscripciones o estudiantes.

### Catálogos geográficos

- **FR-056**: El sistema MUST ofrecer los 22 departamentos de Guatemala y sus municipios como listas
  predeterminadas, usadas tanto en la residencia como en la ubicación de la institución.
- **FR-057**: El sistema MUST ofrecer las zonas de los municipios que están divididos en zonas.
- **FR-058**: Los municipios de esos catálogos MUST ser los mismos que usa el resto del sistema para ubicar a
  estudiantes y convocatorias, sin listas paralelas. El catálogo es una lista fija del producto, no
  información administrable: nadie lo edita desde la interfaz.

### Key Entities

- **Formulario (plantilla)**: uno de los seis cuestionarios de inscripción. Identificado por una clave estable;
  declara vía (L1/L2), nivel, nombre legible, preguntas y documentos exigidos. No fija modalidad ni cambia entre
  convocatorias.
- **Convocatoria**: la apertura de un formulario para un año, un municipio y una ventana de fechas y horas.
  Declara además la modalidad, la fecha de inicio de clases, el horario del curso y quién la configuró. Es lo
  que se abre, se cierra y queda en el historial.
- **Inscripción**: el envío de una persona a una convocatoria, con todas sus respuestas, sus documentos y el
  momento del envío. Es única por documento de identificación dentro de una convocatoria e inmutable una vez
  registrada.
- **Estudiante**: la persona inscrita, identificada por su documento de identificación, con nombre, sexo y
  municipio de residencia. Se crea con la primera inscripción, se reutiliza en las siguientes y agrupa el
  historial de participación.
- **Modalidad**: la forma en que se imparte el curso (virtual o presencial). La declara la convocatoria,
  distingue los grupos de un mismo curso y determina el compromiso que se pide al inicio del formulario.
- **Vía y Nivel**: L1 y L2 por un lado; principiante, intermedio y avanzado por el otro. Su combinación define
  los seis formularios y clasifica los cursos.
- **Departamento, Municipio y Zona**: catálogo geográfico fijo de Guatemala —22 departamentos, 340
  municipios y las zonas de los municipios zonificados— usado en todas las direcciones. Es una
  lista del producto, no un dato que la Academia administre.
- **Documento adjunto**: archivo PDF que la persona sube como parte de su inscripción, asociado a ella y al tipo
  de documento que satisface.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Una persona puede completar y enviar su inscripción, adjuntos incluidos, en menos de 15 minutos
  desde un teléfono, sin crear cuenta ni recibir ayuda.
- **SC-002**: Quien administra abre la inscripción de un curso para un año, un municipio y una modalidad en
  menos de 3 minutos y sin intervención técnica de por medio.
- **SC-003**: Ninguna convocatoria recibe dos inscripciones con el mismo documento de identificación: el
  duplicado es cero en un ejercicio donde se intente enviar la misma inscripción cinco veces desde navegadores y
  dispositivos distintos.
- **SC-004**: Ninguna inscripción queda registrada fuera de la ventana configurada, verificado intentando enviar
  antes de la apertura y después del cierre.
- **SC-005**: El 100 % de los departamentos y municipios de Guatemala está disponible en las listas de
  dirección, y ninguna dirección de residencia queda escrita a mano libre en su parte administrativa.
- **SC-006**: Toda inscripción registrada tiene un estudiante asociado, sin excepción, y ese estudiante existe
  desde el instante del envío.
- **SC-007**: Toda inscripción registrada conserva sus documentos exigidos y los cinco se pueden descargar desde
  su detalle.
- **SC-008**: El mismo curso se vuelve a abrir en el año siguiente sin cambios de código y sin arrastrar ni
  perder las inscripciones del año anterior, que siguen consultables en el historial de convocatorias.
- **SC-009**: Quien administra obtiene el listado completo de inscripciones de un año como hoja de cálculo en
  menos de 1 minuto y sin pedir apoyo técnico.
- **SC-010**: El informe de fin de año —inscripciones por sexo, rango de edad, pueblo, municipio, modalidad y
  curso— se arma sin depurar duplicados a mano ni cruzar hojas de cálculo de distintos formularios.
- **SC-011**: Al menos 9 de cada 10 personas que empiezan el formulario lo terminan, medido sobre la primera
  convocatoria real.

## Assumptions

- **Los seis formularios comparten el mismo cuestionario base**; lo que cambia entre ellos son el título, la vía,
  el nivel y las constancias de nivel anterior exigidas.
- **La modalidad vive en la convocatoria, no en el formulario.** Decidido con el solicitante: se mantienen seis
  claves y el grupo virtual y el presencial de un mismo curso son dos convocatorias del mismo formulario. El
  campo `modality_id` que el modelo entidad-relación dibuja sobre `form_template` queda sin uso.
- **No se exige una cuenta de Gmail.** El formulario de Google la pedía por su propio mecanismo de carga de
  archivos; en este sistema se acepta cualquier correo electrónico válido.
- **Nombres y apellidos se recogen en dos preguntas separadas**, según lo pedido en la entrevista, y se componen
  para mostrar el nombre completo del estudiante. La nota de la entrevista es ambigua en este punto; se optó por
  separar porque es reversible sin perder datos y lo contrario no.
- **La fecha de nacimiento no se recoge**: el formulario pregunta rango de edad, así que el estudiante se
  registra sin fecha de nacimiento y el rango queda como respuesta de la inscripción. Los reportes de edad se
  hacen sobre ese rango.
- **El documento de identificación (DPI) es el identificador de una persona** y se valida como 13 dígitos.
- **Una convocatoria corresponde a un solo municipio**; abrir el mismo formulario en varios municipios significa
  crear varias convocatorias, una por municipio.
- **Las personas que se inscriben no tienen cuenta en el sistema** y no la tendrán en esta entrega; las cuentas
  siguen siendo solo del personal de la Academia.
- **El permiso que gobierna estas áreas se apoya en el esquema de módulos y permisos ya existente** (lectura y
  edición por módulo), sin inventar un mecanismo aparte.
- **El resumen anual se limita a conteos y distribuciones** por los atributos ya recogidos. Comparativas entre
  años, gráficas y reportes armados a medida quedan fuera de alcance; la exportación cubre ese hueco mientras
  tanto.
- **La asignación de grupos, secciones, horarios de clase y cupos queda fuera de alcance.** Esta entrega llega
  hasta la inscripción registrada y consultada; el modelo entidad-relación prevé esas piezas para más adelante.
- **No se envían correos de confirmación en esta entrega.** La confirmación es la pantalla posterior al envío;
  el aviso reproduce que la Academia se comunicará por correo.
- **Los textos de las preguntas se muestran en Kaqchikel y español**, tal como en el formulario vigente.
- **La cuadrícula pública sustituye la raíz actual**, que hoy solo ofrece el acceso al panel; ese acceso se
  conserva.
- **El catálogo de zonas cubre los municipios que efectivamente están zonificados** (la capital y unas pocas
  cabeceras), no todos.
