# Diagramas de proceso

UML no tiene un diagrama llamado «de proceso». Lo que se pide con ese nombre casi siempre es
uno de estos tres, y los tres salen de este repo porque los procesos están escritos como código
explícito —casos de uso puros en `src/modules/*/application/use-cases/`— y no repartidos entre
componentes:

| Diagrama UML                | Qué contesta                              | Mermaid            | Fidelidad |
| --------------------------- | ----------------------------------------- | ------------------ | --------- |
| Actividad                   | ¿Qué pasos y decisiones sigue el flujo?   | `flowchart`        | Aproximada: no hay notación nativa de _fork/join_ ni calles verticales |
| Secuencia                   | ¿Quién le habla a quién y en qué orden?   | `sequenceDiagram`  | Fiel      |
| Máquina de estados          | ¿En qué estados vive una entidad?         | `stateDiagram-v2`  | Fiel      |

Se renderizan solos en GitHub, en la vista previa de Markdown de VS Code y en IntelliJ.
El modelo de datos vive aparte, en [`docs/db/entidad-relacion.md`](../db/entidad-relacion.md).

---

## 1. Inscripción pública — secuencia

El proceso central: un aspirante llena el formulario de una convocatoria abierta y adjunta sus
PDF. Lo notable es que **el archivo nunca pasa por el servidor de la aplicación**: el caso de uso
firma un ticket temporal y el navegador sube directo al blob.

```mermaid
sequenceDiagram
  autonumber
  actor Aspirante
  participant Page as Página pública de inscripción
  participant Form as EnrollmentForm en el cliente
  participant Actions as Server actions
  participant Enrollment as SDK enrollment
  participant Students as SDK students
  participant Blob as Vercel Blob
  participant DB as PostgreSQL

  Aspirante->>Page: GET /inscripcion/{offeringId}
  Page->>Enrollment: getOpenOffering
  Enrollment->>DB: offerings.findById
  alt no existe o está fuera de ventana
    Enrollment-->>Page: OfferingNotFoundError u OfferingNotOpenError
    Page-->>Aspirante: 404
  else abierta
    Page-->>Aspirante: formulario, plantilla y catálogo geográfico
  end

  loop por cada documento requerido por la plantilla
    Aspirante->>Form: adjunta un PDF
    Form->>Actions: requestUploadTicketAction
    Actions->>Enrollment: requestUploadTicket
    Enrollment->>Enrollment: valida ventana, tipo de documento, content-type y draftId
    Enrollment->>Blob: issueSignedToken y presignUrl, válidos 15 minutos
    Blob-->>Enrollment: presignedUrl
    Enrollment-->>Form: UploadTicket con url y método PUT
    Form->>Blob: PUT del archivo, directo desde el navegador
    Blob-->>Form: storageKey
  end

  Aspirante->>Form: Enviar inscripción
  Form->>Actions: submitEnrollmentAction con respuestas y claves de documentos
  Actions->>Enrollment: submitEnrollment
  Enrollment->>DB: offerings.findById
  Enrollment->>Enrollment: isOfferingOpen, commitmentAccepted, validateAnswers
  loop por cada documento de la plantilla
    Enrollment->>Blob: head de la clave, para confirmar tamaño y tipo
    Blob-->>Enrollment: contentType y sizeBytes
  end
  Enrollment->>Students: ensure con DPI, nombres, sexo y municipio
  Students->>DB: findByDocumentId y, si no existe, create
  Students-->>Enrollment: studentId
  Enrollment->>DB: inserta form_submissions y submission_documents
  alt choca la unicidad convocatoria más estudiante
    DB-->>Enrollment: violación de índice único
    Enrollment-->>Actions: AlreadyEnrolledError
    Actions-->>Form: Ya hay una inscripción registrada con ese DPI
  else registrada
    Enrollment-->>Actions: submissionId y studentId
    Actions-->>Form: redirectTo hacia /gracias
    Form->>Form: rememberSubmission en localStorage
    Form-->>Aspirante: página de agradecimiento
  end
```

---

## 2. Reglas de `submitEnrollment` — actividad

El mismo proceso visto como cadena de guardas. Cada rombo es un `if` real del caso de uso
`src/modules/enrollment/application/use-cases/submit-enrollment.ts`; cada caja roja, un error de
dominio que la server action traduce a un mensaje en español.

```mermaid
flowchart TD
  A(["submitEnrollment"]) --> B["offerings.findById"]
  B --> C{"¿Existe la convocatoria?"}
  C -- No --> X1["OfferingNotFoundError"]
  C -- Sí --> D{"¿Activa y dentro de la ventana?"}
  D -- No --> X2["OfferingNotOpenError"]
  D -- Sí --> E{"¿Aceptó el compromiso de modalidad?"}
  E -- No --> X3["ModalityCommitmentRefusedError"]
  E -- Sí --> F{"¿validateAnswers sin problemas?"}
  F -- No --> X4["InvalidAnswersError con la lista de campos"]
  F -- Sí --> G["Siguiente documento de la plantilla"]
  G --> H{"¿Lo declaró el cliente?"}
  H -- No --> X5["MissingDocumentError"]
  H -- Sí --> I{"¿La clave pertenece a este draft y el blob existe?"}
  I -- No --> X6["InvalidDocumentError"]
  I -- Sí --> J{"¿Es PDF y pesa menos de 10 MB?"}
  J -- No --> X6
  J -- Sí --> K{"¿Faltan documentos?"}
  K -- Sí --> G
  K -- No --> L["students.ensure — alta nueva o reutilización por DPI"]
  L --> M["submissions.record con sus documentos"]
  M --> N{"¿Respeta la unicidad convocatoria + estudiante?"}
  N -- No --> X7["AlreadyEnrolledError"]
  N -- Sí --> O(["submissionId y studentId"])

  classDef error fill:#fff1f0,stroke:#cf1322,color:#a8071a
  class X1,X2,X3,X4,X5,X6,X7 error
```

---

## 3. Ciclo de vida de una convocatoria — máquina de estados

`OfferingStatus` **no se almacena**: `offeringStatus()` lo deriva en cada lectura a partir de
`opensAt`, `closesAt` y del único campo persistido, `isActive`. Por eso hay transiciones que
ocurren solas, con el paso del tiempo, y otras que alguien dispara desde el panel.

```mermaid
stateDiagram-v2
  direction LR
  [*] --> Programada: createOffering, isActive verdadero
  Programada --> Abierta: llega opensAt
  Abierta --> Cerrada: llega closesAt
  Programada --> Cerrada: setOfferingActive en falso
  Abierta --> Cerrada: setOfferingActive en falso
  Cerrada --> Programada: setOfferingActive en verdadero, aún antes de opensAt
  Cerrada --> Abierta: setOfferingActive en verdadero, dentro de la ventana

  note right of Abierta
    Único estado que acepta
    requestUploadTicket y submitEnrollment
  end note
  note left of Cerrada
    updateOffering ya no puede cambiar
    curso, año, municipio ni modalidad
    si existe al menos una inscripción
  end note
```

---

## 4. Alta de una persona en el panel — secuencia

Interesa porque cruza dos sistemas —Clerk y la base propia— y tiene **compensación**: si la
escritura en PostgreSQL falla después de haber creado la identidad, esa identidad se borra.

```mermaid
sequenceDiagram
  autonumber
  actor Admin
  participant UI as Panel de personas
  participant Action as createPersonAction
  participant Access as SDK access
  participant Clerk
  participant DB as PostgreSQL

  Admin->>UI: correo, rol y permisos
  UI->>Action: createPersonAction con el FormData
  Action->>Access: authorize del permiso access:create
  Access->>Clerk: getCurrentIdentity
  Access->>DB: findByIdentityId y listPermissions
  alt sin permiso, sin perfil o inactivo
    Access-->>Action: PermissionDeniedError, UserNotProvisionedError o UserInactiveError
    Action-->>UI: No tienes permiso para gestionar personas
  else autorizado
    Action->>Access: createPerson
    Access->>Access: requireAdmin, valida el correo y calcula permisos según el rol
    Access->>DB: findByEmail
    alt el correo ya existe
      Access-->>Action: EmailAlreadyRegisteredError
      Action-->>UI: Ese correo ya está registrado
    else disponible
      Access->>Clerk: createIdentity
      Clerk-->>Access: identityId
      Access->>DB: createWithRole con rol y permisos
      alt falla la escritura
        Access->>Clerk: deleteIdentity, compensación
        Access-->>Action: propaga el error
      else creada
        Access->>DB: AdminAction USER_CREATED, en modo best effort
        Access-->>Action: persona
        Action->>Action: revalidatePath de /panel/personas
        Action-->>UI: quedó registrada, avísale que ya puede entrar
      end
    end
  end
```

---

## 5. Entrada al panel y autorización — actividad

Tres controles encadenados: la frontera de red (`src/proxy.ts`), la sincronización de perfil del
layout y el permiso puntual que pide cada página o server action.

```mermaid
flowchart TD
  A(["Petición HTTP"]) --> B{"proxy.ts — ¿ruta pública?"}
  B -- "Sí: /, /ingresar, /inscripcion" --> Z(["Se sirve sin sesión"])
  B -- No --> C["auth.protect de Clerk"]
  C --> D{"¿Sesión válida?"}
  D -- No --> E(["Redirige a /ingresar"])
  D -- Sí --> F["PanelLayout — syncSignedInUser"]
  F --> G{"¿Identidad activa en Clerk?"}
  G -- No --> H["UserInactiveError"]
  G -- Sí --> I["upsertFromIdentity y sella firstSignInAt la primera vez"]
  I --> J["listAccessibleModules — arma la navegación visible"]
  J --> K["La página llama a authorize con su permiso"]
  K --> L{"¿grants? admin, o miembro con el permiso concedido"}
  L -- No --> M["PermissionDeniedError"]
  L -- Sí --> N(["Render de la página"])

  classDef error fill:#fff1f0,stroke:#cf1322,color:#a8071a
  class H,M error
```

Los permisos concretos que exige cada ruta están en las llamadas a `access.authorize` de
`src/app/panel/`: `students:read`, `access:read`, `access:create`, `access:update`,
`access:delete`, `enrollment:read`, `enrollment:create` y `enrollment:update`.
