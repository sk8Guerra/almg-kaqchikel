# Contrato — Rutas, adaptadores y navegación

**Feature**: `005-enrollment-forms` · **Fecha**: 2026-08-27

Qué ruta existe, qué caso de uso llama y qué permiso exige. Todo adaptador de esta lista traduce
entrada → llama casos de uso → traduce salida; ninguno contiene reglas de negocio (Principio IV).

---

## 1. Rutas públicas

| Ruta                                | Tipo             | Llama a                                                         | Requisito              |
| ----------------------------------- | ---------------- | --------------------------------------------------------------- | ---------------------- |
| `/`                                 | Server Component | `enrollment.listOpenOfferings()`                                | FR-018, FR-019, FR-022 |
| `/inscripcion/[offeringId]`         | Server Component | `enrollment.getOpenOffering(id)`, `geography.listDepartments()` | FR-020, FR-043         |
| `/inscripcion/[offeringId]/gracias` | Server Component | `enrollment.getOpenOffering(id)`                                | FR-045                 |

`src/proxy.ts` pasa de `["/", "/ingresar(.*)"]` a `["/", "/ingresar(.*)", "/inscripcion(.*)"]`
(research D14). Todo lo demás sigue exigiendo sesión.

### Server actions públicas — `src/app/inscripcion/[offeringId]/actions.ts`

```ts
requestUploadTicketAction(input): Promise<ActionResult<UploadTicket>>
loadMunicipalitiesAction(departmentId): Promise<ActionResult<Municipality[]>>
loadZonesAction(municipalityId): Promise<ActionResult<Zone[]>>
submitEnrollmentAction(input): Promise<ActionResult<{ redirectTo: string }>>
```

### Ticket de subida — `requestUploadTicketAction`

Es una **server action**, no un route handler. El contrato original preveía el flujo
`handleUpload` de `@vercel/blob`, que exige un endpoint HTTP y el SDK en el navegador; eso habría
metido `@vercel/blob` en la capa de adapters, donde `boundaries/external` lo prohíbe. Con URLs
prefirmadas (`issueSignedToken` + `presignUrl`, research D8) el SDK se queda en
`infrastructure/`: la acción devuelve `{ url, method, headers }` y el navegador sube con un
`fetch` PUT normal. La validación de negocio no cambia de sitio — sigue en
`enrollment.requestUploadTicket`.

Mismo patrón `ActionResult` que `/panel/personas` para las acciones: la acción atrapa los errores
de dominio y los convierte en mensaje en español. Correspondencia obligatoria:

| Error de dominio                                | Mensaje                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `OfferingNotOpenError`                          | "La inscripción de este curso ya cerró."                                     |
| `ModalityCommitmentRefusedError`                | "Para inscribirte debes comprometerte a recibir el curso en esta modalidad." |
| `InvalidAnswersError`                           | Lista de preguntas faltantes, resaltadas en el formulario                    |
| `MissingDocumentError` / `InvalidDocumentError` | "Falta un documento" / "El archivo debe ser PDF y pesar menos de 10 MB."     |
| `AlreadyEnrolledError`                          | "Ya hay una inscripción registrada con ese DPI para este curso."             |

**Redirección tras éxito**: `/inscripcion/[offeringId]/gracias`. Una página aparte, no un estado
del componente, para que recargar no reintente el envío.

### Componentes cliente de la ruta pública

| Archivo               | Responsabilidad                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `offering-grid.tsx`   | Dibuja las tarjetas; marca las ya enviadas leyendo la marca del navegador                    |
| `submitted-marks.ts`  | Lee y escribe `almg.enrollment.submitted` en `localStorage`: `[{ offeringId, submittedAt }]` |
| `enrollment-form.tsx` | Recorre `template.questions` y dibuja cada pregunta según su `kind`                          |
| `document-upload.tsx` | Pide el ticket, sube el PDF con `fetch` PUT a la URL prefirmada y guarda la URL devuelta     |

`enrollment-form.tsx` **no decide** qué preguntas existen ni cuáles son obligatorias: recorre la
definición que le llega y ejecuta `validateAnswers` del dominio antes de enviar (research D12).
La condición de la zona viaja en el dato (`municipality.hasZones`), no en el componente.

---

## 2. Rutas del panel

| Ruta                                         | Permiso           | Llama a                                                               |
| -------------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `/panel/inscripciones`                       | `enrollment:read` | `listSubmissions(filter)`                                             |
| `/panel/inscripciones/[id]`                  | `enrollment:read` | `getSubmission(id)`                                                   |
| `/panel/inscripciones/[id]/documento/[type]` | `enrollment:read` | `readSubmissionDocument(...)` → transmite el PDF                      |
| `/panel/inscripciones/convocatorias`         | `enrollment:read` | `listOfferings(filter)`                                               |
| `/panel/inscripciones/resumen`               | `enrollment:read` | `summarizeEnrollments(filter)`                                        |
| `/panel/inscripciones/exportar`              | `enrollment:read` | `exportSubmissions(filter)` → CSV                                     |
| `/panel/estudiantes`                         | `students:read`   | `students.listStudents(filter)`                                       |
| `/panel/estudiantes/[id]`                    | `students:read`   | `students.getStudent(id)` + `enrollment.listSubmissionsByStudent(id)` |

Cada página empieza con `await access.authorize("<permiso>")`, igual que `/panel/personas`. Las
acciones de escritura de convocatorias exigen `enrollment:create` o `enrollment:update` y
devuelven "No tienes permiso para gestionar convocatorias." ante `PermissionDeniedError`.

**Las tres pestañas** viven en `src/app/panel/inscripciones/layout.tsx` como enlaces —
Inscripciones · Convocatorias · Resumen— y no se remontan al cambiar de pestaña, mismo criterio
que el layout del panel de la feature 004.

**La exportación es un route handler** (`GET` con los filtros en la query) que responde con
`text/csv; charset=utf-8`, BOM inicial y `Content-Disposition: attachment` (research D9).

**La descarga de adjuntos también es un route handler**, por la misma razón: es una respuesta HTTP
con cabeceras propias. Autoriza, llama a `readSubmissionDocument` y transmite el contenido. La URL
del blob nunca sale al HTML — es pública para quien la tenga (research D8).

**El expediente del estudiante es el único adaptador que compone dos SDK**, y es deliberado: es
lo que evita la dependencia cíclica entre `students` y `enrollment`.

---

## 3. Cambios en piezas existentes

### `src/modules/access/domain/modules.ts`

```ts
export const MODULES = {
  access: { label: "Personas", actions: ACTIONS },
  enrollment: { label: "Inscripciones", actions: ACTIONS },
  students: { label: "Estudiantes", actions: ACTIONS },
} as const;
```

Consecuencias automáticas, sin código nuevo: `ALL_PERMISSION_KEYS` crece a 12 claves, la matriz
de permisos de `/panel/personas` las ofrece, la barra lateral muestra las dos áreas nuevas a
quien tenga permiso, y `listAccessibleModules` las filtra. **La clave no puede llamarse `forms`**
(research D13).

### `src/app/panel/nav-routes.ts`

```ts
export const NAV_SEGMENTS: Record<ModuleKey, string> = {
  access: "personas",
  enrollment: "inscripciones",
  students: "estudiantes",
};
```

Al ser un `Record` exhaustivo, olvidar un segmento rompe `pnpm typecheck`. Es el mecanismo que la
feature 004 dejó puesto para exactamente este momento.

### `src/composition/container.ts`

```ts
const places = new PrismaPlaceRepository(prisma);
const studentsRepo = new PrismaStudentRepository(prisma);
const offerings = new PrismaOfferingRepository(prisma);
const templatesRepo = new PrismaTemplateRepository(prisma);
const submissions = new PrismaSubmissionRepository(prisma);
const fileStore = new VercelBlobFileStore(env().blobReadWriteToken);

export const students = {
  registerStudent: registerStudent({ students: studentsRepo, clock }),
  listStudents: listStudents({ students: studentsRepo }),
  getStudent: getStudent({ students: studentsRepo }),
};

export const enrollment = {
  // ...
  submitEnrollment: submitEnrollment({
    offerings,
    submissions,
    students: { ensure: students.registerStudent }, // el puerto StudentRegistry
    files: fileStore,
    clock,
  }),
};
```

La línea `students: { ensure: students.registerStudent }` es el único punto donde los dos módulos
se tocan, y es el contenedor —el lugar que la constitución reserva para nombrar concretas—.

### `src/composition/env.ts`

Gana `BLOB_READ_WRITE_TOKEN` (Vercel Blob, research D8), validada al arrancar como las demás y
expuesta como `blobReadWriteToken`. `.env.example` la documenta junto a las de Clerk y la base.

---

## 4. Lo que NO cambia

- `users`, `user_permissions`, `admin_actions`: ni el esquema ni sus casos de uso.
- El flujo de Clerk y `syncSignedInUser`.
- `/panel/personas` completo, salvo las dos filas nuevas que la matriz de permisos muestra sola.
- La barra lateral: consume `MODULES`, no una lista propia.
