# Contrato — SDK de los módulos `students` y `geography`

**Feature**: `005-enrollment-forms` · **Fecha**: 2026-08-27

Dos módulos nuevos y pequeños. `students` es el padrón; `geography` es el catálogo territorial de
Guatemala. Ninguno conoce a `enrollment` (research D1: la escritura entra por un puerto, la
lectura la compone el adaptador).

---

## 1. `src/modules/students/index.ts`

```ts
export { registerStudent } from "./application/use-cases/register-student";
export { listStudents } from "./application/use-cases/list-students";
export { getStudent } from "./application/use-cases/get-student";

export type { Student, StudentSummary, StudentsFilter } from "./domain/student";
export type { StudentId, DocumentId, Sex } from "./domain/values";
export { documentId } from "./domain/values";

export { InvalidDocumentIdError, StudentNotFoundError } from "./domain/errors";
```

### Puerto

```ts
export type StudentsFilter = { readonly search?: string };

export type NewStudent = {
  readonly documentId: DocumentId;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly sex: Sex;
  readonly municipalityId: string;
  readonly now: Date;
};

export interface StudentRepository {
  findByDocumentId(documentId: DocumentId): Promise<Student | null>;
  create(input: NewStudent): Promise<Student>;
  findById(id: StudentId): Promise<Student | null>;
  list(filter: StudentsFilter): Promise<StudentSummary[]>;
}
```

### `registerStudent({ students, clock })`

```ts
(input: {
  documentId: string;
  firstNames: string;
  lastNames: string;
  sex: "female" | "male";
  municipalityId: string;
}) => Promise<Student>;
```

**Idempotente por DPI**: si el documento ya existe, devuelve el estudiante registrado **sin
sobrescribir** su nombre ni su municipio (caso de borde del spec: el mismo documento vuelve con
datos distintos; la discrepancia queda en las respuestas de la inscripción, que son el
testimonio). Si no existe, lo crea. `documentId()` normaliza —quita espacios y guiones— y exige
13 dígitos: cualquier otra cosa es `InvalidDocumentIdError`.

Este es el caso de uso que `src/composition/container.ts` inyecta como `StudentRegistry.ensure`
en `submitEnrollment`. `enrollment` nunca importa este módulo.

### `listStudents({ students })` · `getStudent({ students })`

```ts
listStudents: (filter: StudentsFilter) => Promise<StudentSummary[]>;
getStudent: (id: string) => Promise<Student>; // StudentNotFoundError si no existe
```

`StudentSummary` lleva nombre completo compuesto, documento, sexo, municipio de residencia y
`submissionCount` (FR-051). El expediente con las inscripciones lo arma la página llamando
además a `enrollment.listSubmissionsByStudent(id)`.

**Sin autorización dentro del caso de uso**: la página del panel llama antes a
`access.authorize("students:read")`.

---

## 2. `src/modules/geography/index.ts`

```ts
export { listDepartments } from "./application/use-cases/list-departments";
export { listMunicipalities } from "./application/use-cases/list-municipalities";
export { listZones } from "./application/use-cases/list-zones";
export { syncPlaces } from "./application/use-cases/sync-places";

export type { Department, Municipality, Zone } from "./domain/place";
```

### Puerto

```ts
export interface PlaceRepository {
  listDepartments(): Promise<Department[]>;
  listMunicipalities(departmentId?: string): Promise<Municipality[]>;
  listZones(municipalityId: string): Promise<Zone[]>;
  upsertDepartment(input: { code: string; name: string }): Promise<string>;
  upsertMunicipality(input: { code: string; name: string; departmentId: string }): Promise<string>;
  upsertZone(input: { name: string; municipalityId: string }): Promise<void>;
}
```

### Casos de uso

```ts
listDepartments: () => Promise<Department[]>; // 22, ordenados por nombre
listMunicipalities: (departmentId?: string) => Promise<Municipality[]>;
listZones: (municipalityId: string) => Promise<Zone[]>; // vacío = no zonificado
syncPlaces: (data: PlacesData) => Promise<{ departments: number; municipalities: number }>;
```

`Municipality` incluye `hasZones: boolean`, para que el formulario decida mostrar la pregunta de
zona sin una segunda consulta (FR-028). `syncPlaces` es idempotente por `code` y lo invoca
`prisma/seed.ts` con `prisma/data/guatemala.json`.

**Los tres listados son públicos**: el formulario los necesita sin sesión iniciada. No hay
`geography` en `MODULES` porque no tiene pantalla propia ni permisos (research D13).

---

## 3. Dobles en memoria

`tests/unit/students/doubles.ts` → `InMemoryStudentRepository`.
`tests/unit/geography/doubles.ts` → `InMemoryPlaceRepository` con dos departamentos, tres
municipios y un municipio zonificado. Suficiente para probar la cascada y el caso "sin zonas".
