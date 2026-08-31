# Contrato — SDK del módulo `enrollment`

**Feature**: `005-enrollment-forms` · **Fecha**: 2026-08-27

Módulo nuevo. Sigue valiendo la prueba de aceptación de la 001: **todo caso de uso debe poder
ejecutarse desde un script de Node plano**, sin React, sin Next y sin contexto de petición.
`prisma/seed.ts` lo demuestra ejecutando `syncFormTemplates`.

---

## 1. `src/modules/enrollment/index.ts`

```ts
// Catálogo (quemado en el código)
export { syncFormTemplates } from "./application/use-cases/sync-form-templates";
export { TEMPLATES, templateByCode, BASE_QUESTIONS } from "./domain/form-template";
export { validateAnswers } from "./domain/answers";

// Convocatorias
export { createOffering } from "./application/use-cases/create-offering";
export { updateOffering } from "./application/use-cases/update-offering";
export { setOfferingActive } from "./application/use-cases/set-offering-active";
export { listOfferings } from "./application/use-cases/list-offerings";
export { listOpenOfferings } from "./application/use-cases/list-open-offerings";
export { getOpenOffering } from "./application/use-cases/get-open-offering";

// Inscripción
export { requestUploadTicket } from "./application/use-cases/request-upload-ticket";
export { submitEnrollment } from "./application/use-cases/submit-enrollment";

// Consulta y reportes
export { listSubmissions } from "./application/use-cases/list-submissions";
export { getSubmission } from "./application/use-cases/get-submission";
export { readSubmissionDocument } from "./application/use-cases/read-submission-document";
export { listSubmissionsByStudent } from "./application/use-cases/list-submissions-by-student";
export { exportSubmissions } from "./application/use-cases/export-submissions";
export { summarizeEnrollments } from "./application/use-cases/summarize-enrollments";

export type {
  TemplateCode,
  FormTemplateDefinition,
  Question,
  QuestionId,
  LanguageTrack,
  CourseLevel,
  Modality,
  DocumentType,
} from "./domain/form-template";
export type { Offering, OfferingStatus, OfferingView } from "./domain/offering";
export type { Answers, AnswerProblem } from "./domain/answers";
export type {
  SubmissionSummary,
  SubmissionDetail,
} from "./application/ports/submission-repository";
export type { OfferingFilter, SubmissionFilter } from "./application/ports/offering-repository";
export type { EnrollmentSummary } from "./application/use-cases/summarize-enrollments";
export type { UploadTicket, FileContent } from "./application/ports/file-store";

export {
  UnknownTemplateError,
  InvalidOfferingWindowError,
  OfferingHasSubmissionsError,
  DuplicateOfferingError,
  OfferingNotOpenError,
  OfferingNotFoundError,
  InvalidAnswersError,
  ModalityCommitmentRefusedError,
  MissingDocumentError,
  InvalidDocumentError,
  AlreadyEnrolledError,
} from "./domain/errors";
```

Nada más es importable desde fuera: `boundaries/entry-point` lo hace fallar en `pnpm lint`.

---

## 2. Puertos

```ts
// application/ports/offering-repository.ts
export type OfferingFilter = {
  readonly year?: number;
  readonly templateCode?: TemplateCode;
  readonly status?: OfferingStatus;
};

export interface OfferingRepository {
  create(input: NewOffering): Promise<Offering>;
  update(id: OfferingId, patch: OfferingPatch): Promise<Offering>;
  setActive(id: OfferingId, isActive: boolean): Promise<void>;
  findById(id: OfferingId): Promise<Offering | null>;
  list(filter: OfferingFilter): Promise<OfferingView[]>;
  listOpen(now: Date): Promise<OfferingView[]>;
  countSubmissions(id: OfferingId): Promise<number>;
}

// application/ports/template-repository.ts
export interface TemplateRepository {
  upsertByCode(definition: FormTemplateDefinition): Promise<void>;
  idByCode(code: TemplateCode): Promise<string | null>;
}

// application/ports/submission-repository.ts
export interface SubmissionRepository {
  record(input: NewSubmission): Promise<SubmissionSummary>; // lanza AlreadyEnrolledError
  findById(id: SubmissionId): Promise<SubmissionDetail | null>;
  list(filter: SubmissionFilter): Promise<SubmissionSummary[]>;
  listByStudent(studentId: string): Promise<SubmissionSummary[]>;
  summarize(filter: SubmissionFilter): Promise<EnrollmentSummary>;
}

// application/ports/student-registry.ts  — satisfecho por el SDK de `students` (research D1)
export type StudentIdentity = {
  readonly documentId: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly sex: "female" | "male";
  readonly municipalityId: string;
};

export interface StudentRegistry {
  ensure(identity: StudentIdentity): Promise<{ readonly id: string }>;
}

// application/ports/file-store.ts
export type UploadTicket = {
  readonly keyPrefix: string;
  readonly credential: string; // token opaco que el cliente entrega al SDK del almacenamiento
  readonly maxBytes: number;
  readonly expiresAt: Date;
};

export type StoredFile = {
  readonly key: string;
  readonly contentType: string;
  readonly sizeBytes: number;
};

export type FileContent = {
  readonly body: ReadableStream<Uint8Array>;
  readonly contentType: string;
  readonly sizeBytes: number;
};

export interface FileStore {
  createUploadTicket(input: {
    keyPrefix: string;
    contentType: string;
    maxBytes: number;
  }): Promise<UploadTicket>;
  confirm(key: string): Promise<StoredFile | null>;
  read(key: string): Promise<FileContent>;
  remove(key: string): Promise<void>;
}
```

`record()` escribe la inscripción y sus adjuntos en una sola transacción: la atomicidad es un
detalle del adaptador de Postgres, no una operación del puerto — mismo criterio que
`createWithRole` en la feature 002.

---

## 3. Casos de uso: firma y reglas

### `syncFormTemplates({ templates })`

```ts
() => Promise<{ readonly synced: number }>;
```

Idempotente: inserta o actualiza una fila por cada clave de `TEMPLATES`. No borra filas de claves
retiradas — una convocatoria vieja debe seguir resolviendo su nombre.

### `createOffering({ offerings, templates, clock })`

```ts
(input: {
  templateCode: TemplateCode;
  year: number;
  municipalityId: string;
  modality: Modality;
  opensAt: Date;
  closesAt: Date;
  classesStartOn?: Date;
  scheduleLabel?: string;
  createdById: string;
}) => Promise<Offering>;
```

| Condición                                        | Error                        |
| ------------------------------------------------ | ---------------------------- |
| `templateCode` no está en `TEMPLATES`            | `UnknownTemplateError`       |
| `closesAt <= opensAt`                            | `InvalidOfferingWindowError` |
| Ya existe (plantilla, año, municipio, modalidad) | `DuplicateOfferingError`     |

### `updateOffering({ offerings })` · `setOfferingActive({ offerings })`

Cambiar plantilla, año o municipio con inscripciones registradas lanza
`OfferingHasSubmissionsError` (FR-015). Ventana, horario y fecha de inicio sí se pueden corregir
siempre. `setOfferingActive(id, false)` es el cierre manual de FR-012 y surte efecto inmediato
porque la cuadrícula deriva el estado en cada consulta.

### `listOpenOfferings({ offerings, clock })`

```ts
() => Promise<OfferingView[]>;
```

Sin autorización: alimenta la raíz pública. Devuelve solo `status === "open"`, con nombre del
curso, vía, nivel, modalidad, horario, municipio y `closesAt`.

### `getOpenOffering({ offerings, clock })`

```ts
(offeringId: string) => Promise<{ offering: OfferingView; template: FormTemplateDefinition }>;
```

Lanza `OfferingNotFoundError` u `OfferingNotOpenError`. Es lo que impide servir el formulario de
una convocatoria cerrada a quien conserve el enlace (FR-043).

### `requestUploadTicket({ offerings, files, clock })`

```ts
(input: { offeringId: string; draftId: string; type: DocumentType; contentType: string }) =>
  Promise<UploadTicket>;
```

Comprueba que la convocatoria está abierta, que la plantilla exige ese documento y que
`contentType === "application/pdf"` antes de emitir credencial alguna (`InvalidDocumentError`).
El prefijo de clave es `drafts/<draftId>/<type>` y `maxBytes` viaja dentro del ticket, para que el
límite de 10 MB lo aplique el almacenamiento y no solo el navegador.

Lo invoca el route handler `POST /api/inscripcion/adjuntos` desde el callback
`onBeforeGenerateToken` de `@vercel/blob` (research D8). El caso de uso no conoce ese detalle:
recibe datos planos y devuelve un ticket.

### `submitEnrollment({ offerings, submissions, students, files, clock })`

```ts
(input: {
  offeringId: string;
  answers: Answers;
  documents: readonly { type: DocumentType; key: string }[];
}) => Promise<{ readonly submissionId: string; readonly studentId: string }>;
```

Orden de comprobaciones — cada una corta antes de escribir nada:

1. Convocatoria abierta con el reloj inyectado → `OfferingNotOpenError` (FR-043).
2. Compromiso de modalidad respondido "sí" → `ModalityCommitmentRefusedError` (FR-023).
3. `validateAnswers(template, answers)` sin problemas → `InvalidAnswersError` con la lista
   completa de preguntas faltantes o inválidas (FR-024, un solo viaje).
4. Todos los documentos exigidos presentes → `MissingDocumentError` (FR-031).
5. Cada clave declarada apunta a `drafts/<draftId>/…` y `files.confirm(key)` responde: existe, es
   PDF y pesa ≤ 10 MB → `InvalidDocumentError` (FR-033). Es lo que impide registrar una
   inscripción declarando archivos que nunca se subieron.
6. `students.ensure(identity)` → id del estudiante, creado o reutilizado (FR-037, FR-038).
7. `submissions.record(...)` → `AlreadyEnrolledError` si el índice único salta (FR-039).

El estudiante se crea antes que la inscripción, así que un fallo en el paso 7 puede dejar un
estudiante sin inscripciones. El invariante que el spec exige es el contrario —toda inscripción
tiene estudiante (SC-006)— y ese se cumple siempre.

### `listSubmissions` · `getSubmission` · `listSubmissionsByStudent`

```ts
listSubmissions: (filter: SubmissionFilter) => Promise<SubmissionSummary[]>;
getSubmission: (id: string) => Promise<SubmissionDetail>; // adjuntos: tipo y tamaño, sin URL
listSubmissionsByStudent: (studentId: string) => Promise<SubmissionSummary[]>;
readSubmissionDocument: (input: { submissionId: string; type: DocumentType }) =>
  Promise<FileContent>;
```

`SubmissionFilter`: `{ offeringId?, templateCode?, year?, municipalityId?, search? }`. `search`
busca por nombre o documento (FR-048).

`getSubmission` **no devuelve URL de almacenamiento**: solo tipo, tamaño y nombre de cada adjunto.
La descarga pasa por `readSubmissionDocument`, que el panel sirve después de autorizar (FR-035,
research D8). Una URL de Vercel Blob es impredecible pero pública; publicarla en el HTML del
detalle sería exactamente la filtración que ese requisito prohíbe.

### `exportSubmissions({ submissions })`

```ts
(filter: SubmissionFilter) => Promise<{ headers: string[]; rows: string[][] }>;
```

Datos planos, sin CSV: la serialización es transporte y vive en el route handler (D9). Las
columnas salen del orden de `questions` de la plantilla, así que el encabezado y las respuestas
no pueden desalinearse.

### `summarizeEnrollments({ submissions })`

```ts
(filter: { year?: number; offeringId?: string }) => Promise<EnrollmentSummary>;

type EnrollmentSummary = {
  readonly total: number;
  readonly bySex: Record<"female" | "male", number>;
  readonly byAgeRange: Record<AgeRange, number>;
  readonly byEthnicGroup: Record<EthnicGroup, number>;
  readonly byMunicipality: readonly { id: string; name: string; count: number }[];
  readonly byModality: Record<Modality, number>;
  readonly byTemplate: readonly { code: TemplateCode; name: string; count: number }[];
};
```

Cada desglose suma `total` — es lo que verifica el escenario 1 de la Historia 6.

---

## 4. Autorización

Ningún caso de uso comprueba permisos: el módulo `access` sigue siendo el dueño de esa decisión y
los adaptadores del panel llaman a `access.authorize("enrollment:read" | "enrollment:create" |
"enrollment:update")` antes de invocar, igual que hace hoy `/panel/personas`. Los cuatro casos de
uso públicos —`listOpenOfferings`, `getOpenOffering`, `requestUploadTicket` y
`submitEnrollment`— no llevan autorización porque el formulario es público (FR-020); su control
es la ventana de la convocatoria. `readSubmissionDocument` es lo contrario: solo se alcanza desde
una ruta del panel que ya autorizó `enrollment:read`.

---

## 5. Dobles en memoria (tests)

`tests/unit/enrollment/doubles.ts` provee `InMemoryOfferingRepository`,
`InMemoryTemplateRepository`, `InMemorySubmissionRepository` (con el índice único simulado),
`InMemoryFileStore` y `StubStudentRegistry`, más `fixedClock(iso)`. Ningún test de dominio o
aplicación toca Postgres ni almacenamiento real.
