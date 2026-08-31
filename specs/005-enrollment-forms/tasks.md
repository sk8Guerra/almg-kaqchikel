---
description: "Task list for 005-enrollment-forms"
---

# Tasks: Formularios de inscripción a los cursos de Kaqchikel

**Input**: Design documents from `/specs/005-enrollment-forms/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: se incluyen pruebas automatizadas de **dominio y casos de uso** con dobles en memoria,
que es lo que la constitución exige y lo que `vitest.config.mts` sabe correr hoy (`environment:
"node"`). La interfaz y todo lo que necesita Postgres o almacenamiento vivo se valida a mano con
[quickstart.md](./quickstart.md); montar un arnés de componentes es una feature aparte.

**Organization**: agrupadas por historia de usuario para poder implementar y validar cada una por
separado.

**Cambio posterior (2026-08-31)**: a petición del solicitante, el catálogo geográfico dejó de ser
tabla y pasó a ser una lista estática en `src/modules/geography/domain/guatemala.ts`. Eso deja sin
efecto las partes de T003, T010 y T012 que hablaban de sembrar y consultar tablas, y añade el
puerto `PlaceCatalog` en `enrollment` y `students`. Requiere una migración nueva que elimine
`departments`, `municipalities` y `zones`, y convierta las claves foráneas en `municipality_code`.

**Estado**: 91 de 93 completadas y verificadas con `pnpm verify` (formato, lint, typecheck y 126
pruebas en verde). Quedan dos que exigen la base de datos y el entorno reales, y las corre Jorge:
**T006** (aplicar la migración con `pnpm db:migrate`) y **T090** (recorrer el quickstart en el
navegador). El cliente de Prisma ya está generado, así que el código compila sin haber migrado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencias pendientes)
- **[Story]**: US1 … US6
- Rutas de archivo exactas en cada descripción

## Path Conventions

- **Dominio**: `src/modules/<capacidad>/domain/`
- **Casos de uso y puertos**: `src/modules/<capacidad>/application/{use-cases,ports}/`
- **Implementaciones**: `src/modules/<capacidad>/infrastructure/`
- **SDK público**: `src/modules/<capacidad>/index.ts`
- **Cableado DI**: `src/composition/container.ts`
- **Adaptadores**: `src/app/`
- **Pruebas**: `tests/unit/<capacidad>/`

Ningún archivo bajo `src/app/` puede contener acceso a datos ni reglas de negocio.

---

## Phase 1: Setup

**Purpose**: dependencias y configuración que todo lo demás da por hecha

- [x] T001 Añadir `@vercel/blob` a las dependencias en `package.json` e instalar con `pnpm install`
- [x] T002 [P] Añadir `blobReadWriteToken` leyendo `BLOB_READ_WRITE_TOKEN` en `src/composition/env.ts` y documentar la variable en `.env.example`
- [x] T003 [P] Crear `prisma/data/guatemala.json` con los 22 departamentos, sus municipios (código INE) y las zonas de los municipios zonificados

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema, catálogo de formularios, geografía y navegación. Ninguna historia puede
empezar sin esto.

**⚠️ CRITICAL**: bloquea todas las historias

### Esquema y migración

- [x] T004 Añadir a `prisma/schema.prisma` los enums `LanguageTrack`, `CourseLevel`, `Modality`, `Sex`, `AgeRange`, `EthnicGroup` y `DocumentType` según data-model.md
- [x] T005 Añadir a `prisma/schema.prisma` los modelos `Department`, `Municipality`, `Zone`, `Student`, `FormTemplate`, `FormOffering`, `FormSubmission` y `SubmissionDocument` con sus índices, incluido `@@unique([formOfferingId, studentId])`
- [ ] T006 Generar y aplicar la migración con `pnpm db:migrate`, dejando `prisma/migrations/<fecha>_enrollment_forms/` en el repositorio, y confirmar que el índice único de `form_submissions` existe en la base

### Módulo `geography`

- [x] T007 [P] Crear los tipos `Department`, `Municipality` (con `hasZones`) y `Zone` en `src/modules/geography/domain/place.ts`
- [x] T008 [P] Definir el puerto `PlaceRepository` en `src/modules/geography/application/ports/place-repository.ts`
- [x] T009 Implementar `listDepartments`, `listMunicipalities`, `listZones` y `syncPlaces` en `src/modules/geography/application/use-cases/`
- [x] T010 Implementar `PrismaPlaceRepository` en `src/modules/geography/infrastructure/prisma-place-repository.ts`, resolviendo `hasZones` sin consulta extra
- [x] T011 Exportar la superficie pública en `src/modules/geography/index.ts`
- [x] T012 [P] Crear `InMemoryPlaceRepository` en `tests/unit/geography/doubles.ts` con dos departamentos, tres municipios y uno zonificado
- [x] T013 [P] Probar la cascada departamento → municipio y el caso "municipio sin zonas" en `tests/unit/geography/places.test.ts`

### Dominio de `enrollment`

- [x] T014 [P] Crear los tipos marcados y los errores del módulo en `src/modules/enrollment/domain/values.ts` y `src/modules/enrollment/domain/errors.ts` (los 11 errores del contrato)
- [x] T015 [P] Definir `Question`, `QuestionId` y la constante `BASE_QUESTIONS` con las 22 preguntas bilingües en `src/modules/enrollment/domain/questions.ts`, en el orden de FR-024 y con la residencia agrupada (FR-022)
- [x] T016 Definir `TemplateCode`, `FormTemplateDefinition`, las seis plantillas `TEMPLATES` y `templateByCode` en `src/modules/enrollment/domain/form-template.ts`, con los documentos exigidos por nivel (FR-031)
- [x] T017 Implementar `validateAnswers(template, answers)` puro en `src/modules/enrollment/domain/answers.ts`, devolviendo **todos** los problemas de una vez (FR-024)
- [x] T018 Implementar `Offering` y la derivación de `OfferingStatus` a partir del reloj en `src/modules/enrollment/domain/offering.ts` (research D4)
- [x] T019 [P] Probar en `tests/unit/enrollment/form-template.test.ts` que hay seis plantillas, que sus claves son únicas y que los documentos exigidos son 3, 4 y 5 según el nivel
- [x] T020 [P] Probar `validateAnswers` en `tests/unit/enrollment/answers.test.ts`: obligatoria vacía, DPI mal formado, "Otro" con idiomas separados por comas y respuesta válida completa
- [x] T021 [P] Probar la derivación de estado con reloj fijo en `tests/unit/enrollment/offering-status.test.ts`: programada, abierta, cerrada por fecha y cerrada por `isActive`

### Catálogo de plantillas en la base

- [x] T022 Definir el puerto `TemplateRepository` en `src/modules/enrollment/application/ports/template-repository.ts` y el puerto `OfferingRepository` en `.../ports/offering-repository.ts`
- [x] T023 Implementar `syncFormTemplates` en `src/modules/enrollment/application/use-cases/sync-form-templates.ts`, idempotente y sin borrar claves retiradas
- [x] T024 Implementar `PrismaTemplateRepository` en `src/modules/enrollment/infrastructure/prisma-template-repository.ts`
- [x] T025 Extender `prisma/seed.ts` para invocar `geography.syncPlaces` y `enrollment.syncFormTemplates` desde el contenedor (`../src/composition/container`), y verificar con `pnpm db:seed` ejecutado dos veces que quedan 6 plantillas, 22 departamentos y ~340 municipios

### Navegación, permisos y frontera pública

- [x] T026 Añadir las claves `enrollment` ("Inscripciones") y `students` ("Estudiantes") a `MODULES` en `src/modules/access/domain/modules.ts` — **nunca** `forms` (research D13)
- [x] T027 Añadir los segmentos `inscripciones` y `estudiantes` a `NAV_SEGMENTS` en `src/app/panel/nav-routes.ts` y confirmar con `pnpm typecheck` que el `Record` exhaustivo obliga a ello
- [x] T028 [P] Añadir `"/inscripcion(.*)"` a `isPublic` en `src/proxy.ts` (research D14)
- [x] T029 Crear `tests/unit/enrollment/doubles.ts` con `InMemoryOfferingRepository`, `InMemoryTemplateRepository`, `InMemorySubmissionRepository` (con índice único simulado), `InMemoryFileStore`, `StubStudentRegistry` y `fixedClock(iso)`

**Checkpoint**: el catálogo existe en la base, la navegación conoce las áreas nuevas y el dominio
está probado. Las historias pueden empezar.

---

## Phase 3: User Story 1 — Inscribirse desde la página pública (Priority: P1) 🎯 MVP

**Goal**: cualquier persona ve los cursos abiertos en la raíz, llena el formulario con sus
adjuntos y su inscripción queda registrada junto con su expediente de estudiante.

**Independent Test**: con una convocatoria sembrada (T045), entrar a `/` sin sesión, llenar y
enviar el formulario completo, y comprobar que existen la inscripción, el estudiante y los
documentos.

### Módulo `students`

- [x] T030 [P] [US1] Crear `DocumentId` (13 dígitos, normalizando espacios y guiones), `StudentId` y `Sex` en `src/modules/students/domain/values.ts`, con `InvalidDocumentIdError` y `StudentNotFoundError` en `src/modules/students/domain/errors.ts`
- [x] T031 [P] [US1] Crear la entidad `Student` y los tipos `StudentSummary` y `StudentsFilter` en `src/modules/students/domain/student.ts`
- [x] T032 [US1] Definir el puerto `StudentRepository` en `src/modules/students/application/ports/student-repository.ts`
- [x] T033 [US1] Implementar `registerStudent` idempotente por DPI en `src/modules/students/application/use-cases/register-student.ts`: reutiliza sin sobrescribir nombre ni municipio (FR-038)
- [x] T034 [P] [US1] Crear `InMemoryStudentRepository` en `tests/unit/students/doubles.ts`
- [x] T035 [P] [US1] Probar `registerStudent` en `tests/unit/students/register-student.test.ts`: alta nueva, reutilización por DPI, no sobrescritura y DPI inválido
- [x] T036 [US1] Implementar `PrismaStudentRepository` en `src/modules/students/infrastructure/prisma-student-repository.ts`
- [x] T037 [US1] Exportar `registerStudent`, tipos y errores en `src/modules/students/index.ts`

### Casos de uso de inscripción

- [x] T038 [P] [US1] Definir los puertos `SubmissionRepository`, `StudentRegistry` y `FileStore` en `src/modules/enrollment/application/ports/` según contracts/enrollment-sdk.md §2
- [x] T039 [US1] Implementar `listOpenOfferings` y `getOpenOffering` en `src/modules/enrollment/application/use-cases/`, derivando el estado con el reloj inyectado
- [x] T040 [US1] Implementar `requestUploadTicket` en `src/modules/enrollment/application/use-cases/request-upload-ticket.ts`: convocatoria abierta, documento exigido, `application/pdf`, prefijo `drafts/<draftId>/<type>`
- [x] T041 [US1] Implementar `submitEnrollment` en `src/modules/enrollment/application/use-cases/submit-enrollment.ts` con las siete comprobaciones en orden del contrato
- [x] T042 [P] [US1] Probar `submitEnrollment` en `tests/unit/enrollment/submit-enrollment.test.ts`: convocatoria cerrada, compromiso "No", respuestas inválidas (todas de una vez), documento faltante, adjunto que no es PDF, clave fuera del prefijo del borrador, alta y reutilización del estudiante, y camino feliz
- [x] T043 [P] [US1] Probar `getOpenOffering` en `tests/unit/enrollment/get-open-offering.test.ts`: convocatoria inexistente, programada y cerrada

### Infraestructura y cableado

- [x] T044 [US1] Implementar `PrismaOfferingRepository` en `src/modules/enrollment/infrastructure/prisma-offering-repository.ts` con `listOpen`, `findById` y `countSubmissions`
- [x] T045 [US1] Implementar `PrismaSubmissionRepository.record` en `src/modules/enrollment/infrastructure/prisma-submission-repository.ts`, escribiendo inscripción y adjuntos en **una** transacción y derivando `ageRange` y `ethnicGroup` del JSON (research D10)
- [x] T046 [US1] Implementar `VercelBlobFileStore` en `src/modules/enrollment/infrastructure/vercel-blob-file-store.ts` con `createUploadTicket`, `confirm` (`head`), `read` y `remove` (`del`)
- [x] T047 [US1] Exportar en `src/modules/enrollment/index.ts` los casos de uso públicos, `TEMPLATES`, `validateAnswers` y los errores del contrato
- [x] T048 [US1] Cablear `geography`, `students` y `enrollment` en `src/composition/container.ts`, incluida la línea puente `students: { ensure: students.registerStudent }` de `submitEnrollment`
- [x] T049 [US1] Añadir a `prisma/seed.ts` una bandera `--demo-offering` que cree una convocatoria abierta, para poder validar esta historia sin depender de la Historia 2

### Adaptadores

- [x] T050 [US1] Reescribir `src/app/page.tsx` como cuadrícula pública que llama a `enrollment.listOpenOfferings()`, con el estado vacío de FR-022 y el acceso al panel conservado
- [x] T051 [P] [US1] Crear `src/app/page.module.scss` y `src/app/inscripcion/[offeringId]/inscripcion.module.scss` con los estilos de la cuadrícula y del formulario, usables desde 360 px
- [x] T052 [US1] Crear `src/app/inscripcion/[offeringId]/page.tsx` que llama a `getOpenOffering` y a `geography.listDepartments()` y pasa la definición de plantilla al formulario
- [x] T053 [US1] Crear `src/app/inscripcion/[offeringId]/enrollment-form.tsx` (cliente) que recorre `template.questions`, encadena departamento → municipio → zona y ejecuta `validateAnswers` antes de enviar
- [x] T054 [US1] Crear `src/app/api/inscripcion/adjuntos/route.ts` con `handleUpload` de `@vercel/blob` delegando en `enrollment.requestUploadTicket` desde `onBeforeGenerateToken`
- [x] T055 [US1] Crear `src/app/inscripcion/[offeringId]/document-upload.tsx` (cliente) que sube con `upload()` de `@vercel/blob/client` y guarda la URL devuelta
- [x] T056 [US1] Crear `src/app/inscripcion/[offeringId]/actions.ts` con `loadMunicipalitiesAction`, `loadZonesAction` y `submitEnrollmentAction`, traduciendo cada error de dominio al mensaje de contracts/routes-and-adapters.md §1
- [x] T057 [US1] Crear `src/app/inscripcion/[offeringId]/gracias/page.tsx` con la confirmación que nombra el curso y repite inicio y horario (FR-045)

**Checkpoint**: la Historia 1 funciona de punta a punta. Es el MVP entregable.

---

## Phase 4: User Story 2 — Crear, abrir y cerrar convocatorias (Priority: P2)

**Goal**: la Academia abre y cierra la inscripción de cada curso por año, municipio, modalidad y
ventana, y conserva el historial de lo convocado.

**Independent Test**: crear una convocatoria con ventana futura, comprobar que no aparece en `/`,
adelantar su apertura, verla aparecer, cerrarla y encontrarla en el historial.

- [x] T058 [US2] Implementar `createOffering`, `updateOffering`, `setOfferingActive` y `listOfferings` en `src/modules/enrollment/application/use-cases/`
- [x] T059 [P] [US2] Probar en `tests/unit/enrollment/offerings.test.ts`: clave de plantilla desconocida, cierre anterior a apertura, duplicado de (plantilla, año, municipio, modalidad), cambio de año con inscripciones y cierre manual reflejado en `listOpenOfferings`
- [x] T060 [US2] Extender `src/modules/enrollment/infrastructure/prisma-offering-repository.ts` con `create`, `update`, `setActive` y `list` con filtros de año, plantilla y estado
- [x] T061 [US2] Exportar los cuatro casos de uso en `src/modules/enrollment/index.ts` y cablearlos en `src/composition/container.ts`
- [x] T062 [P] [US2] Crear `src/app/panel/inscripciones/layout.tsx` con las pestañas Inscripciones · Convocatorias · Resumen como enlaces, más `inscripciones.module.scss`
- [x] T063 [US2] Crear `src/app/panel/inscripciones/convocatorias/page.tsx` con `access.authorize("enrollment:read")`, el listado con estado y el conteo de inscripciones por convocatoria
- [x] T064 [US2] Crear `src/app/panel/inscripciones/convocatorias/offering-form.tsx` (cliente, en modal como el alta de personas) para crear y editar convocatorias
- [x] T065 [US2] Crear `src/app/panel/inscripciones/convocatorias/actions.ts` que autoriza `enrollment:create` / `enrollment:update`, compone las fechas locales con el offset fijo de Guatemala (research D5) y traduce los errores de dominio

**Checkpoint**: Historias 1 y 2 funcionan por separado. La Academia ya es autónoma.

---

## Phase 5: User Story 3 — Impedir la inscripción duplicada (Priority: P3)

**Goal**: un segundo envío del mismo DPI a la misma convocatoria se rechaza siempre, y quien ya
se inscribió lo ve en la cuadrícula.

**Independent Test**: enviar dos veces la misma inscripción desde navegadores distintos y
comprobar que solo queda una; después inscribirse en otra convocatoria con el mismo DPI y que sí
se acepte.

- [x] T066 [US3] Traducir la violación `P2002` del índice único a `AlreadyEnrolledError` en `src/modules/enrollment/infrastructure/prisma-submission-repository.ts` (research D6)
- [x] T067 [P] [US3] Probar en `tests/unit/enrollment/duplicate-submission.test.ts` que el doble en memoria rechaza el segundo envío a la misma convocatoria y acepta el mismo DPI en otra
- [x] T068 [P] [US3] Crear `src/app/inscripcion/[offeringId]/submitted-marks.ts` (cliente) que lee y escribe `almg.enrollment.submitted` en `localStorage` como `[{ offeringId, submittedAt }]`
- [x] T069 [US3] Marcar en la cuadrícula de `src/app/page.tsx` las convocatorias ya enviadas usando esa marca, sin que su ausencia bloquee ni habilite nada del lado del servidor (FR-042)
- [x] T070 [US3] Añadir el mensaje de `AlreadyEnrolledError` en `src/app/inscripcion/[offeringId]/actions.ts` y escribir la marca del navegador desde `src/app/inscripcion/[offeringId]/enrollment-form.tsx` tras un envío aceptado

**Checkpoint**: el duplicado es imposible y la cuadrícula lo refleja.

---

## Phase 6: User Story 4 — Consultar y exportar las inscripciones (Priority: P4)

**Goal**: quien administra ve las inscripciones en tabla, abre su detalle con los adjuntos y
descarga el listado filtrado.

**Independent Test**: con inscripciones en dos convocatorias, filtrar por una, verificar el
conteo, abrir un detalle, descargar un adjunto y exportar el listado.

- [x] T071 [US4] Implementar `listSubmissions`, `getSubmission`, `readSubmissionDocument` y `exportSubmissions` en `src/modules/enrollment/application/use-cases/`
- [x] T072 [US4] Extender `src/modules/enrollment/infrastructure/prisma-submission-repository.ts` con `list` (filtros y búsqueda por nombre o documento) y `findById` con sus adjuntos
- [x] T073 [P] [US4] Probar en `tests/unit/enrollment/export-submissions.test.ts` que el encabezado sale del orden de `questions` y que cada fila alinea sus respuestas con él
- [x] T074 [US4] Exportar los cuatro casos de uso en `src/modules/enrollment/index.ts` y cablearlos en `src/composition/container.ts`
- [x] T075 [US4] Crear `src/app/panel/inscripciones/page.tsx` con `access.authorize("enrollment:read")`, tabla, búsqueda y filtros, con la misma gramática visual que `/panel/personas`
- [x] T076 [US4] Crear `src/app/panel/inscripciones/[id]/page.tsx` con las 22 respuestas tal como se enviaron y la lista de adjuntos, **sin** exponer ninguna URL de almacenamiento
- [x] T077 [US4] Crear `src/app/panel/inscripciones/[id]/documento/[type]/route.ts` que autoriza y transmite el PDF con `readSubmissionDocument` (FR-035)
- [x] T078 [US4] Crear `src/app/panel/inscripciones/exportar/route.ts` que serializa a CSV con BOM UTF-8 y `Content-Disposition: attachment` (research D9)

**Checkpoint**: el dato recogido ya es utilizable y sustituye a la hoja de Google Forms.

---

## Phase 7: User Story 5 — Padrón de estudiantes (Priority: P5)

**Goal**: el panel muestra las personas creadas por las inscripciones y su expediente completo.

**Independent Test**: una persona inscrita dos veces aparece una sola vez en el padrón y su
expediente lista las dos inscripciones.

- [x] T079 [P] [US5] Implementar `listStudents` y `getStudent` en `src/modules/students/application/use-cases/` y exportarlos en `src/modules/students/index.ts`
- [x] T080 [US5] Extender `src/modules/students/infrastructure/prisma-student-repository.ts` con `list` (búsqueda por nombre o documento, orden por apellido) y `findById`, incluyendo `submissionCount`
- [x] T081 [US5] Implementar `listSubmissionsByStudent` en `src/modules/enrollment/application/use-cases/list-submissions-by-student.ts`, exportarlo y cablearlo
- [x] T082 [P] [US5] Probar en `tests/unit/students/list-students.test.ts` que un mismo DPI aparece una sola vez con su conteo de inscripciones
- [x] T083 [US5] Crear `src/app/panel/estudiantes/page.tsx` con `access.authorize("students:read")`, tabla y búsqueda
- [x] T084 [US5] Crear `src/app/panel/estudiantes/[id]/page.tsx` componiendo `students.getStudent` y `enrollment.listSubmissionsByStudent` — el único adaptador que llama a dos SDK, y el que evita el ciclo entre módulos (research D1)

**Checkpoint**: hay continuidad entre años: se ve quién pasó de principiante a intermedio.

---

## Phase 8: User Story 6 — Resumen anual (Priority: P6)

**Goal**: el informe de fin de año sale del sistema, no de cruzar hojas de cálculo.

**Independent Test**: con inscripciones de sexos, edades y municipios distintos, cada desglose
suma el total y acotar a una convocatoria baja los conteos coherentemente.

- [x] T085 [US6] Implementar `summarizeEnrollments` en `src/modules/enrollment/application/use-cases/summarize-enrollments.ts` y exportarlo
- [x] T086 [US6] Implementar `summarize` en `src/modules/enrollment/infrastructure/prisma-submission-repository.ts` con `groupBy` sobre `ageRange`, `ethnicGroup`, modalidad, plantilla, sexo y municipio
- [x] T087 [P] [US6] Probar en `tests/unit/enrollment/summarize-enrollments.test.ts` que cada desglose suma el total y que el filtro por convocatoria lo reduce
- [x] T088 [US6] Crear `src/app/panel/inscripciones/resumen/page.tsx` con el resumen por año y por convocatoria, y el enlace de descarga reutilizando el route handler de exportación

**Checkpoint**: las seis historias están completas.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T089 Ejecutar `pnpm verify` (format:check, lint, typecheck, test) y dejarlo en verde
- [ ] T090 Recorrer [quickstart.md](./quickstart.md) §1–§5 completo, incluida la prueba de concurrencia de envíos simultáneos
- [x] T091 Ejecutar las seis violaciones deliberadas de [quickstart.md](./quickstart.md) §6, confirmar que **cada una falla** y revertirlas
- [x] T092 [P] Actualizar `README.md` con las tres capacidades nuevas en el árbol de `src/modules/`
- [x] T093 [P] Verificar que `docs/db/entidad-relacion.md` sigue describiendo el esquema realmente migrado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende del Setup — **bloquea todas las historias**
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de Foundational; comparte `PrismaOfferingRepository` con US1 (T060 extiende T044)
- **US3 (Phase 5)**: depende de US1 (T066 y T070 tocan piezas creadas en T045 y T056)
- **US4 (Phase 6)**: depende de US1 (necesita inscripciones registradas y `SubmissionRepository`)
- **US5 (Phase 7)**: depende de US1 (el padrón lo llena `registerStudent`); T084 además necesita T081
- **US6 (Phase 8)**: depende de US1 y se apoya en el route handler de T078
- **Polish (Phase 9)**: depende de todo lo que se decida entregar

### Historias verdaderamente independientes

US1 y US2 pueden desarrollarse en paralelo por dos personas si la primera se queda con
`listOpen`/`findById` y la segunda con `create`/`update`/`setActive` del mismo repositorio.
US3–US6 son incrementos sobre US1 y no dependen entre sí: pueden repartirse en cualquier orden
una vez US1 esté cerrada.

### Dentro de cada historia

Dominio → puertos → casos de uso (con dobles) → infraestructura → `index.ts` → contenedor →
adaptadores. Ninguna tarea de `src/app/` empieza antes de que su caso de uso esté exportado.

## Parallel Execution Examples

- **Fase 2**: T007, T008, T012, T013 (geography) en paralelo con T014, T015, T019, T020, T021
  (dominio de enrollment) — archivos distintos, sin dependencias cruzadas.
- **Fase 3**: T030, T031, T034, T035 (students) en paralelo con T038 y T043 (puertos y pruebas de
  enrollment). T051 (estilos) en paralelo con cualquier tarea de casos de uso.
- **Fase 6**: T073 (prueba de exportación) en paralelo con T075 y T076 (pantallas).

## Implementation Strategy

**MVP**: Fases 1–3. Con la convocatoria de demostración de T049 la inscripción pública funciona
completa: cuadrícula, formulario, adjuntos, estudiante e inscripción registrada. Es lo mínimo que
ya sustituye a un formulario de Google.

**Segundo incremento**: Fase 4 (US2). A partir de aquí la Academia abre y cierra convocatorias
sola y se puede retirar la bandera `--demo-offering`.

**Tercero**: Fases 5 y 6 (US3 y US4) — integridad del dato y explotación. Es lo que convierte el
sistema en el reemplazo real de la hoja de cálculo.

**Cuarto**: Fases 7 y 8 (US5 y US6), que son las que dan valor a fin de año.

**Total**: 93 tareas — 3 de setup, 26 fundacionales, 28 en US1, 8 en US2, 5 en US3, 8 en US4,
6 en US5, 4 en US6 y 5 de cierre.
