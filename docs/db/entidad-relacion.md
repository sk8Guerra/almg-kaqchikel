# Diagrama entidad-relación

Modelo de datos propuesto para la gestión de usuarios, formularios de inscripción y asignación de secciones.

Refleja las decisiones tomadas en [`specs/005-enrollment-forms/spec.md`](../../specs/005-enrollment-forms/spec.md);
los cambios respecto del borrador inicial están anotados al final.

```mermaid
erDiagram
  USER ||--o{ USER_ROLE : has
  ROLE ||--o{ USER_ROLE : has
  ROLE ||--o{ ROLE_PERMISSION : has
  PERMISSION ||--o{ ROLE_PERMISSION : has
  USER ||--o{ FORM_OFFERING : configures
  USER ||--o{ FILE : uploads
  LEVEL ||--o{ FORM_TEMPLATE : targets
  LEVEL ||--o{ COURSE : classifies
  LANGUAGE_TRACK ||--o{ FORM_TEMPLATE : targets
  LANGUAGE_TRACK ||--o{ COURSE : classifies
  MODALITY ||--o{ FORM_OFFERING : delivered_as
  MODALITY ||--o{ SECTION : uses
  FORM_TEMPLATE ||--o{ FORM_OFFERING : instantiates
  FORM_OFFERING ||--o{ FORM_SUBMISSION : receives
  STUDENT ||--o{ FORM_SUBMISSION : submits
  STUDENT ||--o{ CLASS_ENROLLMENT : enrolls
  FORM_SUBMISSION ||--o{ FILE : attaches
  COURSE ||--o{ SECTION : groups
  SECTION ||--o{ SCHEDULE_SLOT : has
  SECTION ||--o{ CLASS_ENROLLMENT : receives
  FORM_SUBMISSION ||--o| CLASS_ENROLLMENT : originates

  USER {
    uuid id PK
    string full_name
    string email
    string status
  }
  ROLE {
    uuid id PK
    string name
  }
  PERMISSION {
    uuid id PK
    string code
  }
  STUDENT {
    uuid id PK
    string first_names
    string last_names
    string document_id UK
    string sex
    string municipality_code
  }
  LEVEL {
    uuid id PK
    string name
  }
  LANGUAGE_TRACK {
    uuid id PK
    string name
  }
  MODALITY {
    uuid id PK
    string name
  }
  FORM_TEMPLATE {
    uuid id PK
    string code UK
    string name
    uuid level_id FK
    uuid track_id FK
  }
  FORM_OFFERING {
    uuid id PK
    uuid form_template_id FK
    int year
    string municipality_code
    uuid modality_id FK
    datetime opens_at
    datetime closes_at
    date classes_start_on
    string schedule_label
    boolean is_active
    uuid created_by FK
  }
  FORM_SUBMISSION {
    uuid id PK
    uuid form_offering_id FK
    uuid student_id FK
    json answers
    datetime submitted_at
  }
  COURSE {
    uuid id PK
    string name
    uuid level_id FK
    uuid track_id FK
  }
  SECTION {
    uuid id PK
    uuid course_id FK
    uuid modality_id FK
    string municipality_code
    int year
    int capacity
  }
  SCHEDULE_SLOT {
    uuid id PK
    uuid section_id FK
    string day_of_week
    time start_time
    time end_time
  }
  CLASS_ENROLLMENT {
    uuid id PK
    uuid student_id FK
    uuid section_id FK
    uuid form_submission_id FK
    datetime enrolled_at
    string status
  }
  FILE {
    uuid id PK
    string owner_type
    uuid owner_id
    string document_type
    string url
    uuid uploaded_by FK
  }
```

## Decisiones reflejadas

- **La modalidad pertenece a la convocatoria, no a la plantilla.** `FORM_TEMPLATE.modality_id` se eliminó y
  `FORM_OFFERING.modality_id` ocupa su lugar. Así se mantienen seis plantillas (L1/L2 × principiante, intermedio,
  avanzado) y el grupo virtual y el presencial de un mismo curso son dos convocatorias de la misma plantilla.
- **`FORM_TEMPLATE.code` es la clave estable** que enlaza cada fila con la definición quemada en el código
  (`l2-avanzado`, `l1-principiante`, …). Es única y no cambia entre entornos ni entre años.
- **La convocatoria carga la información del curso** que se muestra a quien se inscribe: `classes_start_on` y
  `schedule_label`, además de la ventana `opens_at`/`closes_at`, interpretada en hora de Guatemala.
- **`STUDENT` pierde `birth_date`.** El formulario pregunta rango de edad, no fecha de nacimiento; el rango vive
  en `FORM_SUBMISSION.answers` y es lo que alimenta los reportes de edad.
- **`STUDENT.document_id` es único**: el DPI identifica a la persona y es lo que permite reutilizar el
  expediente entre convocatorias en lugar de duplicarlo.
- **`FORM_SUBMISSION` es única por `(form_offering_id, student_id)`**: esa restricción es la que impide el
  segundo envío del mismo documento a la misma convocatoria.
- **`FILE` gana `document_type`** (copia del DPI, carta de compromisos, ficha de inscripción, constancia de nivel
  principiante, constancia de nivel intermedio) y se relaciona con `FORM_SUBMISSION` por el par polimórfico
  `owner_type`/`owner_id`. `uploaded_by` queda vacío cuando el archivo llega desde el formulario público.
- **El catálogo geográfico no es una tabla.** Departamentos, municipios y zonas viven como
  constante en `src/modules/geography/domain/guatemala.ts`. Quien ubica algo guarda el código INE
  del municipio (`municipality_code`, cuatro dígitos: los dos primeros son el departamento).

## Correspondencia física

El diagrama es conceptual. Dos entidades no se traducen a tablas una por una — decidido en
[`specs/005-enrollment-forms/research.md`](../../specs/005-enrollment-forms/research.md) (D3, D7):

- **`LEVEL`, `LANGUAGE_TRACK` y `MODALITY` son enums de Prisma**, no tablas; el catálogo
  geográfico no llega siquiera a existir en la base. Su contenido es
  cerrado, lo conoce el código —las seis plantillas están quemadas— y nadie los administra desde
  la interfaz. Los catálogos que sí son tablas son los geográficos.
- **`FILE` se implementa como `submission_documents`**, hijo de la inscripción con clave foránea
  real y un `document_type` cerrado, en vez de una relación polimórfica. Hoy el único dueño
  posible de un archivo es una inscripción; cuando aparezca un segundo se decide con el caso en
  la mano.
