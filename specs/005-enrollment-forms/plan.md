# Implementation Plan: Formularios de inscripción a los cursos de Kaqchikel

**Branch**: `005-enrollment-forms` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-enrollment-forms/spec.md`

## Summary

Sustituir los seis formularios de Google por una inscripción propia: una raíz pública que muestra
en cuadrícula las convocatorias abiertas, un formulario bilingüe de 22 preguntas con adjuntos en
PDF, y tres áreas de panel —convocatorias, inscripciones y estudiantes— con exportación y resumen
anual.

El enfoque técnico se sostiene en seis piezas:

1. **Tres módulos de negocio nuevos**: `enrollment` (plantillas, convocatorias, inscripciones,
   reportes), `students` (el padrón) y `geography` (departamentos, municipios y zonas). El ciclo
   entre los dos primeros se rompe con un puerto `StudentRegistry` para la escritura y con
   composición en el adaptador para la lectura del expediente (research D1).
2. **Las seis plantillas quemadas en el dominio**, espejadas en `form_templates` por una clave
   estable (`l2-avanzado`). `syncFormTemplates` las sincroniza desde `prisma/seed.ts`, un script
   de Node plano — la prueba de aceptación del Principio III (D2).
3. **El estado de la convocatoria se deriva del reloj inyectado**, no se almacena: una
   convocatoria no puede quedarse "abierta" porque un proceso no corrió (D4).
4. **El duplicado lo impide un índice único** `(form_offering_id, student_id)` traducido a
   `AlreadyEnrolledError`. La marca en `localStorage` es solo presentación y no manda nada (D6).
5. **Los adjuntos suben directo a Vercel Blob** con un token de cliente y se confirman en el
   servidor antes de registrar la inscripción: cinco PDF de 10 MB no caben en una server action
   (D7). La descarga, en cambio, la sirve el panel tras autorizar, porque una URL de blob es
   impredecible pero pública y FR-035 exige que los documentos no lo sean (D8).
6. **`MODULES` gana dos claves**, `enrollment` y `students`, y con eso la barra lateral, la matriz
   de permisos y `listAccessibleModules` incorporan las áreas nuevas sin código adicional. La
   clave no puede llamarse `forms`: ese literal está quemado en
   `tests/unit/access/future-modules.test.ts` como ejemplo de área inexistente (D13).

No cambia nada de `users`, `user_permissions`, `admin_actions` ni del flujo de Clerk.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), React 19.2.8, Node vía Next 16.3.1

**Primary Dependencies**: `next` 16.3.1, `@clerk/nextjs` 7.x, `antd` ^6.6.1, `@prisma/client` 7.x
con `@prisma/adapter-pg`. **Una dependencia nueva**: `@vercel/blob` (research D8), ya cubierta por
`INFRA_ONLY_PACKAGES` en `eslint.config.mjs`. Sin librería de zonas horarias (D5), sin librería de
hojas de cálculo (D9).

**Storage**: PostgreSQL vía Prisma 7. Ocho tablas nuevas y siete enums, en una migración aditiva
— ver [data-model.md](./data-model.md). Vercel Blob para los PDF, tras el puerto `FileStore`, con
`BLOB_READ_WRITE_TOKEN` validada en `src/composition/env.ts`.

**Testing**: Vitest 4 (`environment: "node"`, `tests/**/*.test.ts`). Dominio y casos de uso con
dobles en memoria —incluido un `InMemoryFileStore` y un `InMemorySubmissionRepository` que simula
el índice único—. La interfaz se verifica a mano con [quickstart.md](./quickstart.md).

**Target Platform**: navegadores modernos desde 360 px —el formulario se llena sobre todo desde
teléfono—; render en servidor con App Router.

**Project Type**: aplicación web (Next.js App Router) con módulos de negocio framework-agnósticos.

**Performance Goals**: la cuadrícula pública responde en una consulta indexada por ventana; el
listado del panel y la exportación soportan sin paginación el volumen real de una convocatoria
(cientos de inscripciones). Los PDF no atraviesan el servidor de la aplicación.

**Constraints**: formulario completo utilizable a 360 px; adjuntos PDF ≤ 10 MB; fechas siempre en
hora de Guatemala (UTC-6, sin DST); la URL del almacenamiento nunca llega al navegador — los
adjuntos se descargan por una ruta del panel que autoriza primero.

**Scale/Scope**: 6 plantillas, ~4-12 convocatorias por año, cientos de inscripciones anuales, 22
departamentos y ~340 municipios. 3 módulos nuevos, ~25 casos de uso, 7 rutas nuevas (3 públicas,
4 de panel) más 3 route handlers: subida, exportación y descarga de adjuntos.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Screaming Architecture**: un `ls src/modules/` pasa a devolver cuatro capacidades de
      negocio —`access`, `enrollment`, `geography`, `students`— y ninguna carpeta técnica. Los
      componentes de cada pantalla viven junto a su ruta, como en `/panel/personas`.
- [x] **II. Dependency Rule**: `enrollment/domain/` es TypeScript puro —por eso `validateAnswers`
      corre igual en el navegador y en el servidor (D12)—. Ningún módulo importa a otro:
      `enrollment` declara el puerto `StudentRegistry` y el contenedor lo satisface con
      `students.registerStudent`. El SDK del almacenamiento solo aparece en
      `enrollment/infrastructure/`.
- [x] **III. SDK-First**: cada capacidad se exporta desde `src/modules/<módulo>/index.ts` y recibe
      y devuelve datos planos. `prisma/seed.ts` ejecuta `syncFormTemplates` y `syncPlaces` sin
      React, sin Next y sin petición HTTP: la prueba de aceptación está en el quickstart §0.
- [x] **IV. Thin Adapters**: las páginas autorizan, llaman casos de uso y pasan props; las server
      actions traducen entrada y convierten errores de dominio en mensajes; el route handler de
      exportación solo serializa a CSV lo que el caso de uso ya devolvió como filas. El formulario
      recorre una definición del dominio en vez de decidir qué preguntas existen.
- [x] **V. Dependency Injection**: todos los casos de uso reciben puertos y el reloj. Ninguno llama
      a `new Date()`; el quickstart §6 lo verifica con un reloj fijo. Las concretas y `env()` se
      nombran solo en `src/composition/`.
- [x] **VI. Ports**: recursos externos de esta feature — Postgres (`OfferingRepository`,
      `TemplateRepository`, `SubmissionRepository`, `StudentRepository`, `PlaceRepository`) y
      Vercel Blob (`FileStore`). Todos con doble en memoria; los cuatro métodos de `FileStore`
      —`createUploadTicket`, `confirm`, `read`, `remove`— están en vocabulario de dominio y no
      nombran al proveedor.
- [x] **Testing**: dominio y aplicación son testeables sin infraestructura viva. La atomicidad y
      el índice único, que sí necesitan Postgres, se verifican con el guion de concurrencia del
      quickstart §3.
- [x] **Convenciones**: props `<ComponentName>Props`; sin comentarios; identificadores en inglés
      (el kaqchikel y el español viven en las etiquetas de las preguntas, que son texto de
      pantalla); estilos en `.module.scss` colocalizados, sin `style={{ }}`.
- [x] **Tooling**: `src/modules/enrollment`, `src/modules/students` y `src/modules/geography`
      encajan en los descriptores `src/modules/*/domain|application|infrastructure` que ya
      existen: no hace falta tocar `boundaries/elements`. `eslint.config.mjs` no cambia en absoluto:
      `@vercel/blob` ya está en `INFRA_ONLY_PACKAGES`, así que importarlo fuera de
      `infrastructure/` falla el lint desde el primer día.

**Re-check post-Fase 1**: sin cambios. El diseño no introdujo ningún directorio fuera del layout
mandado, ningún puerto sin doble en memoria y ninguna importación entre módulos. La única casilla
que estuvo en duda —Principio II, por el ciclo `enrollment` ↔ `students`— la cierra el puerto
`StudentRegistry` descrito en research D1 y en
[contracts/enrollment-sdk.md](./contracts/enrollment-sdk.md) §2.

## Project Structure

### Documentation (this feature)

```text
specs/005-enrollment-forms/
├── plan.md                  # Este archivo
├── research.md              # Fase 0: D1–D14
├── data-model.md            # Fase 1: esquema Prisma, tipos de dominio, índices
├── quickstart.md            # Fase 1: guía de verificación por historia
├── contracts/
│   ├── enrollment-sdk.md            # Casos de uso, puertos y errores de `enrollment`
│   ├── students-geography-sdk.md    # SDK de `students` y `geography`
│   └── routes-and-adapters.md       # Rutas, permisos, navegación y contenedor
├── checklists/requirements.md
└── tasks.md                 # Fase 2 — la crea /speckit-tasks, no este comando
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                              # Cuadrícula pública de convocatorias abiertas
│   ├── api/inscripcion/adjuntos/route.ts     # handleUpload de Vercel Blob → requestUploadTicket
│   ├── inscripcion/[offeringId]/
│   │   ├── page.tsx                          # getOpenOffering + catálogos
│   │   ├── actions.ts                        # cascadas geográficas y envío
│   │   ├── enrollment-form.tsx               # cliente: recorre template.questions
│   │   ├── document-upload.tsx               # cliente: ticket → subida directa → clave
│   │   ├── submitted-marks.ts                # cliente: marca en localStorage
│   │   └── gracias/page.tsx                  # confirmación (FR-045)
│   └── panel/
│       ├── inscripciones/
│       │   ├── layout.tsx                    # pestañas: Inscripciones · Convocatorias · Resumen
│       │   ├── page.tsx                      # tabla de inscripciones + búsqueda
│       │   ├── [id]/page.tsx                 # detalle con respuestas y adjuntos
│       │   ├── [id]/documento/[type]/route.ts # descarga autorizada del PDF
│       │   ├── convocatorias/{page.tsx,actions.ts,offering-form.tsx}
│       │   ├── resumen/page.tsx
│       │   └── exportar/route.ts             # CSV con BOM
│       └── estudiantes/
│           ├── page.tsx                      # padrón
│           └── [id]/page.tsx                 # expediente: students + enrollment
├── modules/
│   ├── access/                               # sin cambios salvo MODULES (2 claves nuevas)
│   ├── enrollment/
│   │   ├── domain/                           # form-template.ts, questions.ts, answers.ts,
│   │   │                                     # offering.ts, submission.ts, values.ts, errors.ts
│   │   ├── application/
│   │   │   ├── ports/                        # offering-repository, template-repository,
│   │   │   │                                 # submission-repository, student-registry, file-store
│   │   │   └── use-cases/                    # 14 casos de uso (contracts §3)
│   │   ├── infrastructure/                   # PrismaOfferingRepository, PrismaTemplateRepository,
│   │   │                                     # PrismaSubmissionRepository, VercelBlobFileStore
│   │   └── index.ts
│   ├── students/
│   │   ├── domain/                           # student.ts, values.ts (DocumentId), errors.ts
│   │   ├── application/{ports,use-cases}/    # StudentRepository; registerStudent, listStudents, getStudent
│   │   ├── infrastructure/                   # PrismaStudentRepository
│   │   └── index.ts
│   └── geography/
│       ├── domain/place.ts
│       ├── application/{ports,use-cases}/    # PlaceRepository; listDepartments/Municipalities/Zones, syncPlaces
│       ├── infrastructure/                   # PrismaPlaceRepository
│       └── index.ts
├── composition/
│   ├── container.ts                          # + enrollment, students, geography
│   └── env.ts                                # + BLOB_READ_WRITE_TOKEN
└── proxy.ts                                  # + "/inscripcion(.*)" como ruta pública

prisma/
├── schema.prisma                             # 8 tablas y 7 enums nuevos
├── data/guatemala.json                       # 22 departamentos, ~340 municipios, zonas
├── seed.ts                                   # + syncPlaces + syncFormTemplates
└── migrations/<fecha>_enrollment_forms/

tests/unit/
├── enrollment/                               # doubles.ts + dominio y casos de uso
├── students/                                 # doubles.ts + registerStudent idempotente
└── geography/                                # doubles.ts + cascada y municipios sin zonas
```

**Structure Decision**: la feature añade **tres módulos** al layout mandado y no crea ningún
directorio fuera de él.

- `enrollment` exporta desde su `index.ts`: `syncFormTemplates`, `createOffering`,
  `updateOffering`, `setOfferingActive`, `listOfferings`, `listOpenOfferings`, `getOpenOffering`,
  `requestUploadTicket`, `submitEnrollment`, `listSubmissions`, `getSubmission`,
  `listSubmissionsByStudent`, `exportSubmissions` y `summarizeEnrollments`, más `TEMPLATES` y
  `validateAnswers` del dominio. Puertos: `OfferingRepository`, `TemplateRepository`,
  `SubmissionRepository`, `StudentRegistry` y `FileStore`.
- `students` exporta `registerStudent`, `listStudents` y `getStudent` sobre `StudentRepository`.
- `geography` exporta `listDepartments`, `listMunicipalities`, `listZones` y `syncPlaces` sobre
  `PlaceRepository`.
- El cableado vive entero en `src/composition/container.ts`, incluida la línea que hace de puente
  entre los dos módulos: `students: { ensure: students.registerStudent }` dentro de
  `submitEnrollment`. Es el único punto de contacto y está donde la constitución manda que estén
  las concretas.

## Complexity Tracking

> Sin violaciones de la constitución que justificar. Las dos divergencias del diseño no son con la
> constitución sino con el diagrama entidad-relación, y quedan registradas en
> [data-model.md](./data-model.md):

| Divergencia                                                                      | Por qué                                                          | Alternativa descartada                                                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `LEVEL`, `LANGUAGE_TRACK` y `MODALITY` como enums y no como tablas               | Conjuntos cerrados que el código ya conoce; nadie los administra | Tablas de tres filas: un `join` más y una semilla que puede desincronizarse del tipo de TypeScript       |
| Adjuntos como `SubmissionDocument` con clave foránea, no como `FILE` polimórfico | En esta feature el único dueño posible es una inscripción        | `owner_type`/`owner_id`: renuncia a la integridad referencial por una flexibilidad que nadie usa todavía |

**Deuda anotada, fuera de alcance**: limpieza de adjuntos huérfanos de formularios abandonados
(D7) y limitador de peticiones para la ruta pública (D14). Ninguna de las dos afecta a un
requisito del spec; ambas se vuelven relevantes si el volumen crece o si aparece abuso real.
