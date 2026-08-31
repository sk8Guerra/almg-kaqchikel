# Phase 1 — Modelo de datos

**Feature**: `005-enrollment-forms` · **Fecha**: 2026-08-27 · **Plan**: [plan.md](./plan.md)

Extiende el modelo de las features 001–003. **Nada de lo existente cambia**: `users`,
`user_permissions` y `admin_actions` se quedan como están. Todo lo de abajo es aditivo, en una
sola migración.

La correspondencia con `docs/db/entidad-relacion.md` es directa salvo en dos puntos, marcados
como divergencias y justificados en [research.md](./research.md) (D3, D7).

---

## Enums

```prisma
enum LanguageTrack { L1  L2                                   @@map("language_track") }
enum CourseLevel   { BEGINNER  INTERMEDIATE  ADVANCED         @@map("course_level") }
enum Modality      { VIRTUAL  IN_PERSON                       @@map("modality") }
enum Sex           { FEMALE  MALE                             @@map("sex") }
enum AgeRange      { FROM_14_TO_30  FROM_31_TO_60  OVER_60    @@map("age_range") }
enum EthnicGroup   { MAYA  GARIFUNA  XINKA  LADINO  OTHER     @@map("ethnic_group") }
enum DocumentType {
  IDENTITY_CARD              // copia del DPI
  COMMITMENT_LETTER          // carta de compromisos
  ENROLLMENT_SHEET           // ficha de inscripción
  BEGINNER_CERTIFICATE       // constancia de nivel principiante
  INTERMEDIATE_CERTIFICATE   // constancia de nivel intermedio
  @@map("document_type")
}
```

**Divergencia 1 (D3)**: el diagrama entidad-relación dibuja `LEVEL`, `LANGUAGE_TRACK` y
`MODALITY` como entidades. Aquí son enums: su contenido es cerrado, lo conoce el código —las seis
plantillas están quemadas— y nadie los administra desde la interfaz. Los catálogos que sí son
tablas son los geográficos, que tienen 340 filas y clave foránea desde tres entidades.

---

## Catálogo geográfico — sin tablas

Los 22 departamentos, los 340 municipios y las zonas viven en
`src/modules/geography/domain/guatemala.ts` como constante de TypeScript (research D11). La base
de datos **no** tiene `departments`, `municipalities` ni `zones`.

Quien necesita ubicar algo guarda el **código INE del municipio** en una columna de texto:
`students.municipality_code` y `form_offerings.municipality_code`. Los dos primeros dígitos son el
departamento, así que el código lo lleva implícito y no hay que guardarlo aparte.

**Lo que se pierde y cómo se cubre**: sin clave foránea, la base no impide un código inexistente.
Lo impiden el dominio (`isKnownMunicipality`) y la interfaz, que solo ofrece los del catálogo.

## `Student` — el padrón

```prisma
model Student {
  id             String       @id @default(cuid())
  documentId     String       @unique @map("document_id")   // DPI, 13 dígitos
  firstNames     String       @map("first_names")
  lastNames      String       @map("last_names")
  sex            Sex
  municipalityId String       @map("municipality_id")
  municipality   Municipality @relation(fields: [municipalityId], references: [id])
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")
  submissions    FormSubmission[]
  @@index([lastNames, firstNames])
  @@map("students")
}
```

| Decisión                      | Motivo                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `documentId` único            | El DPI identifica a la persona. Es lo que permite reutilizar el expediente entre convocatorias (FR-038) en vez de duplicarlo.         |
| Sin `birthDate`               | El formulario pregunta rango de edad, no fecha de nacimiento. Una columna que siempre sería nula miente sobre lo que el sistema sabe. |
| Nombres y apellidos separados | FR-024, preguntas 2 y 3. El nombre completo se compone al mostrar; separarlo permite ordenar el padrón por apellido.                  |
| `municipalityId` obligatorio  | Es el municipio de residencia, obligatorio en el formulario y dimensión de los reportes.                                              |

**Lo que el estudiante NO guarda**: teléfono, correo, dirección, profesión, lengua materna,
institución donde labora. Todo eso es respuesta de una inscripción concreta y puede cambiar entre
una y otra; el padrón guarda solo lo que identifica a la persona. Quien necesite el resto lo lee
de la inscripción correspondiente.

---

## `FormTemplate` — el espejo de las plantillas quemadas

```prisma
model FormTemplate {
  id        String        @id @default(cuid())
  code      String        @unique              // "l2-avanzado"
  name      String
  track     LanguageTrack
  level     CourseLevel
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")
  offerings FormOffering[]
  @@map("form_templates")
}
```

La fila no guarda preguntas: las preguntas viven en `enrollment/domain/form-template.ts` (D2).
`code` es la costura entre las dos mitades y `syncFormTemplates` la mantiene tensa. Una
convocatoria que apunte a una fila cuyo `code` ya no existe en el código falla al resolverse con
`UnknownTemplateError` (FR-007) en vez de servir un formulario vacío.

---

## `FormOffering` — la convocatoria

```prisma
model FormOffering {
  id             String       @id @default(cuid())
  formTemplateId String       @map("form_template_id")
  formTemplate   FormTemplate @relation(fields: [formTemplateId], references: [id])
  year           Int
  municipalityId String       @map("municipality_id")
  municipality   Municipality @relation(fields: [municipalityId], references: [id])
  modality       Modality
  opensAt        DateTime     @map("opens_at")            // timestamptz
  closesAt       DateTime     @map("closes_at")
  classesStartOn DateTime?    @map("classes_start_on") @db.Date
  scheduleLabel  String?      @map("schedule_label")      // "Martes de 14:00 a 16:30 horas"
  isActive       Boolean      @default(true) @map("is_active")
  createdById    String       @map("created_by")
  createdBy      User         @relation(fields: [createdById], references: [id])
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")
  submissions    FormSubmission[]
  @@unique([formTemplateId, year, municipalityCode, modality])
  @@index([opensAt, closesAt])
  @@index([year])
  @@map("form_offerings")
}
```

**Sin columna `status`** (D4). El estado se deriva del reloj inyectado:

```text
!isActive                                     → cerrada
now <  opensAt                                → programada
opensAt <= now < closesAt                     → abierta
now >= closesAt                               → cerrada
```

**La clave única** `(plantilla, año, municipio, modalidad)` es la definición operativa de "un
grupo": el virtual y el presencial del mismo curso en el mismo municipio y año son dos
convocatorias distintas (FR-009), pero abrir dos veces exactamente el mismo grupo es un error de
dedo, no una intención.

**Reglas que el dominio impone y la base no puede** (van en `Offering`, con test unitario):

| Regla                                                                | Requisito          |
| -------------------------------------------------------------------- | ------------------ |
| `closesAt > opensAt`                                                 | FR-014             |
| `year` entre 2020 y el año actual + 2                                | cordura de captura |
| No cambiar plantilla, año ni municipio con inscripciones registradas | FR-015             |
| Modalidad y horario visibles antes de inscribirse                    | FR-010, FR-019     |

---

## `FormSubmission` — la inscripción

```prisma
model FormSubmission {
  id             String       @id @default(cuid())
  formOfferingId String       @map("form_offering_id")
  formOffering   FormOffering @relation(fields: [formOfferingId], references: [id])
  studentId      String       @map("student_id")
  student        Student      @relation(fields: [studentId], references: [id])
  answers        Json
  ageRange       AgeRange     @map("age_range")
  ethnicGroup    EthnicGroup  @map("ethnic_group")
  submittedAt    DateTime     @default(now()) @map("submitted_at")
  documents      SubmissionDocument[]
  @@unique([formOfferingId, studentId])
  @@index([formOfferingId, submittedAt])
  @@index([studentId])
  @@map("form_submissions")
}
```

**`@@unique([formOfferingId, studentId])` es la garantía anti-duplicado** (D6, FR-039). No es una
optimización: es el único punto donde dos envíos simultáneos con el mismo DPI se resuelven sin
depender de la suerte. El repositorio traduce `P2002` a `AlreadyEnrolledError`.

**`answers` es el testimonio**: guarda `Record<QuestionId, string | string[]>` con las 22
respuestas tal como se enviaron, incluido el compromiso de modalidad. Es inmutable (FR-044).

**`ageRange` y `ethnicGroup` duplican dos respuestas a propósito** (D10): son dimensiones del
resumen anual y agrupar por columna es un `groupBy` normal, mientras que agrupar por JSON exige
consulta cruda. Se escriben en la misma operación que el JSON y nadie las edita después, así que
no pueden divergir. El sexo y el municipio no se repiten aquí: ya viven en `students`.

---

## `SubmissionDocument` — los adjuntos

```prisma
model SubmissionDocument {
  id           String         @id @default(cuid())
  submissionId String         @map("submission_id")
  submission   FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  type         DocumentType
  storageKey   String         @map("storage_key")
  contentType  String         @map("content_type")
  sizeBytes    Int            @map("size_bytes")
  uploadedAt   DateTime       @default(now()) @map("uploaded_at")
  @@unique([submissionId, type])
  @@map("submission_documents")
}
```

**Divergencia 2 (D7)**: el diagrama dibuja un `FILE` polimórfico (`owner_type` / `owner_id`).
Aquí el adjunto es hijo de la inscripción con clave foránea real. En esta feature el único dueño
posible es una inscripción, y una relación polimórfica renuncia a la integridad referencial a
cambio de una flexibilidad que nadie está usando. Cuando aparezca un segundo dueño, se decide con
el caso en la mano.

**`storageKey` es opaca para el dominio.** Con Vercel Blob es la URL que devuelve la subida —el
proveedor añade un sufijo aleatorio, así que no se puede predecir al pedir el ticket (research
D8)—. Nunca llega al navegador: el panel sirve el archivo por una ruta propia que autoriza antes
de transmitirlo, porque una URL de blob es impredecible pero pública y FR-035 exige que no lo
sea.

---

## Tipos del dominio (no persistidos)

```ts
// enrollment/domain/form-template.ts
type QuestionId = string;

type Question = {
  readonly id: QuestionId;
  readonly labelKaqchikel: string;
  readonly labelSpanish: string;
  readonly kind:
    | "text"
    | "email"
    | "phone"
    | "document-id"
    | "choice"
    | "department"
    | "municipality"
    | "zone"
    | "language-choice";
  readonly required: boolean;
  readonly options?: readonly { value: string; labelKaqchikel: string; labelSpanish: string }[];
  readonly dependsOn?: QuestionId; // municipio depende de departamento; zona de municipio
};

type FormTemplateDefinition = {
  readonly code: TemplateCode; // "l1-principiante" | ... | "l2-avanzado"
  readonly nameKaqchikel: string;
  readonly nameSpanish: string;
  readonly track: LanguageTrack;
  readonly level: CourseLevel;
  readonly questions: readonly Question[];
  readonly documents: readonly DocumentType[];
};

// enrollment/domain/offering.ts
type OfferingStatus = "scheduled" | "open" | "closed";

// students/domain/values.ts
type DocumentId = Brand<string, "DocumentId">; // 13 dígitos, sin espacios ni guiones
```

Las seis definiciones comparten `questions` desde una constante `BASE_QUESTIONS` y solo difieren
en `code`, nombres, `track`, `level` y `documents` (FR-031). El tipo `TemplateCode` es una unión
literal, así que una clave inventada no compila.

---

## Semillas

`prisma/seed.ts` gana un paso idempotente (el catálogo geográfico no se siembra: vive en el código):

1. **Plantillas**: `enrollment.syncFormTemplates()` — el mismo caso de uso que expone el SDK,
   invocado desde un script de Node plano. Es la prueba de aceptación del Principio III.

No se siembran convocatorias: las crea quien administra desde el panel (FR-011). El script
acepta `--demo-offering` (tarea T049) para crear una abierta y poder validar la Historia 1 sin
depender de la Historia 2.

---

## Índices y su motivo

| Índice                                                           | Para qué                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `form_offerings (opens_at, closes_at)`                           | La cuadrícula pública filtra por ventana en cada visita a `/` |
| `form_offerings (year)`                                          | Historial y resumen anual                                     |
| `form_offerings unique (template, year, municipality, modality)` | Impide duplicar un grupo                                      |
| `form_submissions unique (offering, student)`                    | Garantía anti-duplicado (FR-039)                              |
| `form_submissions (offering, submitted_at)`                      | Listado del panel, ordenado por envío                         |
| `form_submissions (student)`                                     | Expediente del estudiante                                     |
| `students (document_id) unique`                                  | Alta idempotente por DPI                                      |
| `students (last_names, first_names)`                             | Orden y búsqueda del padrón                                   |
| `municipalities (department_id)`                                 | Cascada departamento → municipio del formulario               |
