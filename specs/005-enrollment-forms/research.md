# Phase 0 — Investigación y decisiones

**Feature**: `005-enrollment-forms` · **Fecha**: 2026-08-27 · **Spec**: [spec.md](./spec.md)

Cada decisión resuelve una incógnita del Technical Context o fija un patrón que la Fase 1 da por
sentado. El formato es el mismo de las features anteriores: decisión, motivo, alternativas
descartadas.

---

## D1 — Tres módulos: `enrollment`, `students` y `geography`

**Decisión**: la capacidad se reparte en tres módulos de negocio.

| Módulo       | Posee                                                                      | No posee      |
| ------------ | -------------------------------------------------------------------------- | ------------- |
| `enrollment` | plantillas de formulario, convocatorias, inscripciones, adjuntos, reportes | el padrón     |
| `students`   | el estudiante: identidad por DPI, alta idempotente, padrón                 | inscripciones |
| `geography`  | departamentos, municipios y zonas de Guatemala                             | todo lo demás |

**Motivo**: el estudiante sobrevive a la inscripción que lo creó — mañana lo usarán cursos,
secciones y `class_enrollment` del modelo entidad-relación. Meterlo dentro de `enrollment` haría
que `courses` tuviera que entrar a la capacidad "inscripciones" para leer a una persona. El
catálogo geográfico es reference data que ya usan estudiantes y convocatorias y usarán las
secciones; duplicarlo es exactamente lo que FR-058 prohíbe.

**El riesgo real era el ciclo**: el expediente de un estudiante necesita sus inscripciones y la
inscripción necesita crear al estudiante. Un ciclo entre módulos está prohibido por la
constitución (§Scaling). Se rompe así:

- **Escritura** (`enrollment` → `students`): `submitEnrollment` recibe un puerto
  `StudentRegistry` declarado en `enrollment/application/ports/`. `src/composition/container.ts`
  lo satisface con `students.registerStudent`. `enrollment` nunca importa a `students`.
- **Lectura** (expediente): la compone el adaptador. La página del expediente llama a
  `students.getStudent(id)` y a `enrollment.listSubmissionsByStudent(id)`, igual que
  `/panel/personas` hoy llama a `authorize` y a `listPeople`. Ningún módulo aprende del otro.

**Alternativas descartadas**:

- _Un solo módulo con todo dentro_: elimina el puerto, pero deja el padrón encerrado en la
  capacidad equivocada y obliga a extraerlo cuando lleguen cursos y secciones.
- _`students` importando el SDK de `enrollment` para el expediente_: legal para `application/`,
  pero crea el ciclo en cuanto `enrollment` necesita al estudiante. La constitución lo prohíbe y
  con razón.

---

## D2 — Las seis plantillas viven en el código; la tabla las espeja por `code`

**Decisión**: `enrollment/domain/form-template.ts` define las seis plantillas como constantes
(`l1-principiante`, `l1-intermedio`, `l1-avanzado`, `l2-principiante`, `l2-intermedio`,
`l2-avanzado`), cada una con su título bilingüe, su vía, su nivel, su lista de preguntas y sus
documentos exigidos. Un caso de uso `syncFormTemplates` inserta o actualiza una fila por clave en
`form_templates`; es idempotente y se ejecuta desde `prisma/seed.ts`.

**Motivo**: es lo que pidió el solicitante y coincide con lo que la entrevista dejó sin resolver
("¿cada cuánto cambian las preguntas?"). Mientras nadie sepa la respuesta, un editor de
formularios es complejidad sin cliente. La fila existe únicamente para que `form_offerings` tenga
una clave foránea real y para que un reporte pueda unir por SQL sin conocer el código.

**Efecto secundario valioso**: `syncFormTemplates` se ejecuta desde `prisma/seed.ts`, que es un
script de Node plano, sin React, sin Next y sin contexto de petición. Es la prueba de aceptación
del Principio III de esta feature.

**Alternativas descartadas**:

- _Solo código, sin tabla_: `form_offerings.form_template_id` se quedaría sin destino y el
  reporte tendría que resolver nombres en memoria.
- _Solo tabla, con preguntas en la base_: es el editor de formularios que nadie pidió; multiplica
  las validaciones posibles y obliga a versionar preguntas para no romper inscripciones pasadas.

---

## D3 — Vía, nivel y modalidad son enums de Prisma, no tablas

**Decisión**: `LanguageTrack { L1, L2 }`, `CourseLevel { BEGINNER, INTERMEDIATE, ADVANCED }` y
`Modality { VIRTUAL, IN_PERSON }` se modelan como enums. `MUNICIPALITY`, `DEPARTMENT` y `ZONE`
sí son tablas.

**Motivo**: son conjuntos cerrados que el código ya conoce —las seis plantillas están quemadas,
así que su vía y su nivel son constantes— y nadie va a administrarlos desde la interfaz. Una
tabla de tres filas solo agrega un `join` y una semilla más que puede desincronizarse del `type`
de TypeScript. Los municipios, en cambio, son 340 filas que otras entidades referencian por
clave foránea.

**Divergencia consciente** respecto de `docs/db/entidad-relacion.md`, que los dibuja como
entidades: en el diagrama conceptual son catálogos; físicamente son enums. Queda anotado ahí y en
[data-model.md](./data-model.md).

---

## D4 — El estado de la convocatoria se deriva del reloj; no se almacena

**Decisión**: la tabla guarda `opensAt`, `closesAt` y un interruptor `isActive`. El estado
—programada, abierta, cerrada— lo calcula el dominio con la hora inyectada:

```text
isActive && now >= opensAt && now < closesAt  →  abierta
isActive && now <  opensAt                    →  programada
en cualquier otro caso                        →  cerrada
```

**Motivo**: un estado almacenado necesita un proceso que lo actualice al minuto exacto en que
vence la ventana. Sin ese proceso, la convocatoria "abierta" de la base miente. Derivarlo hace
imposible la mentira y hace testeable la regla con un reloj falso, sin esperar a que pase el
tiempo real. `isActive` existe aparte porque FR-012 pide cerrar antes de tiempo: es la decisión
humana, no el calendario.

**Alternativa descartada**: columna `status` actualizada por un cron. Más piezas, más fallos
silenciosos, y el bug clásico de la convocatoria que sigue abierta porque el cron no corrió.

---

## D5 — Hora de Guatemala con offset fijo, sin librería de zonas horarias

**Decisión**: todos los instantes se guardan en UTC (`timestamptz`) y la traducción a hora local
usa el offset fijo `-06:00`. La conversión vive en el borde: el formulario del panel manda fecha
y hora locales, el adaptador las compone con el offset y el dominio solo ve `Date`.

**Motivo**: Guatemala no observa horario de verano desde 2006 y no tiene planes de volver a
hacerlo. Un offset constante es correcto hoy y lo seguirá siendo; traer `date-fns-tz` o
`luxon` por una resta de seis horas es peso muerto en el bundle y una dependencia más que
mantener.

**Alternativa descartada**: `Intl.DateTimeFormat` con `timeZone: "America/Guatemala"` para
formatear. Se usa igual para _mostrar_ fechas en el panel (viene con la plataforma, cuesta cero);
lo que no se hace es depender de una librería para _calcular_.

---

## D6 — El duplicado lo impide la base de datos, no la aplicación

**Decisión**: índice único `(form_offering_id, student_id)` sobre `form_submissions`. El
repositorio traduce la violación de unicidad de Postgres (`P2002`) en `AlreadyEnrolledError` del
dominio. La marca del navegador es solo presentación.

**Motivo**: dos envíos simultáneos pasan los dos por cualquier comprobación previa hecha en
código. La única forma de que el caso de borde del spec ("dos envíos simultáneos con el mismo
documento") no dependa de la suerte es que la restricción viva donde la concurrencia se resuelve
de verdad. La comprobación previa se mantiene igualmente, pero solo para dar un mensaje amable;
la garantía es el índice.

**Sobre `localStorage`**: guarda `{ offeringId, submittedAt }` por envío. Como la clave es el
identificador de la convocatoria, una convocatoria nueva del mismo curso no coincide con ninguna
marca vieja y la persona puede volver a inscribirse sin que haya que interpretar fechas
(FR-041). Borrarla o falsificarla no cambia nada del lado del servidor (FR-042).

---

## D7 — Los adjuntos suben directo al almacenamiento con un ticket firmado

**Decisión**: el puerto `FileStore` expone cuatro operaciones en vocabulario de dominio:

```ts
createUploadTicket({ key, contentType, maxBytes }): Promise<UploadTicket>
confirm(key): Promise<StoredFile>       // existe, tamaño y tipo reales
read(key): Promise<FileContent>         // para servir la descarga autorizada del panel
remove(key): Promise<void>
```

El navegador pide un ticket por archivo mediante una server action, sube el archivo **directo al
almacenamiento** y al enviar el formulario manda solo las claves. `submitEnrollment` llama a
`confirm(key)` de cada documento exigido antes de registrar nada: si el archivo no existe, pesa
más de 10 MB o no es PDF, la inscripción no se registra.

**Motivo**: cinco archivos de hasta 10 MB no pueden atravesar una server action. El límite por
defecto de Next para server actions es 1 MB, y en despliegues serverless el cuerpo de la petición
está capado muy por debajo de 10 MB (4.5 MB en Vercel). Subir directo esquiva las dos barreras y
—esto es lo que lo hace aceptable— `confirm` impide que un cliente mentiroso registre una
inscripción declarando claves que no subió.

**Descarga**: nunca se entrega la URL del almacenamiento; el panel la sirve por una ruta
propia previa autorización (D8).

**Coste asumido**: un formulario abandonado deja archivos huérfanos en el almacenamiento. Se
suben bajo un prefijo `drafts/<draftId>/` y `submitEnrollment` los referencia tal cual. La
limpieza periódica de huérfanos queda fuera de alcance y anotada como deuda; el volumen esperado
—decenas de inscripciones por convocatoria— la hace irrelevante durante el primer año.

**Alternativas descartadas**:

- _Archivos por server action con `bodySizeLimit` subido_: más simple de escribir, pero rompe en
  cuanto el despliegue sea serverless, y obliga a que el servidor cargue 50 MB en memoria.
- _Guardar los PDF en la base como `bytea`_: infla el backup, el dump y cada consulta que toque
  la tabla, para un dato que nunca se filtra ni se indexa.

---

## D8 — El almacenamiento es Vercel Blob

**Decisión** (tomada por el solicitante): `VercelBlobFileStore` en `enrollment/infrastructure/`
implementa `FileStore` con `@vercel/blob`, que ya figura en `INFRA_ONLY_PACKAGES` de
`eslint.config.mjs`. La credencial es `BLOB_READ_WRITE_TOKEN`, validada al arrancar en
`src/composition/env.ts` y documentada en `.env.example`.

**Cómo se traduce el puerto a este proveedor**:

| Operación del puerto | `@vercel/blob`                                                            |
| -------------------- | ------------------------------------------------------------------------- |
| `createUploadTicket` | `handleUpload` en un route handler: valida y devuelve un token de cliente |
| `confirm(key)`       | `head(url)` → tamaño y `contentType` reales                               |
| `read(key)`          | descarga del blob para servirla el propio panel                           |
| `remove(key)`        | `del(url)`                                                                |

**Tres consecuencias que el diseño tuvo que absorber**:

1. **La subida usa URL prefirmada, no el SDK de cliente.** `upload()` de `@vercel/blob/client`
   habría obligado a importar el SDK dentro de un componente, y `boundaries/external` prohíbe
   `@vercel/blob` fuera de `infrastructure/`. Con `presignUrl` el SDK se queda donde debe: la
   infraestructura devuelve `{ url, method, headers }` y el navegador sube con un `fetch` PUT
   normal. La validación de negocio vive en `requestUploadTicket`, como estaba previsto.
   **Los blobs se crean con `access: "private"`** — confirmado disponible en `@vercel/blob` 2.8.0,
   así que una URL filtrada tampoco sirve por sí sola.
2. **El nombre final del blob no es el pedido.** Vercel añade un sufijo aleatorio, así que el
   cliente devuelve la URL resultante y `submitEnrollment` comprueba que su ruta empieza por
   `drafts/<draftId>/` antes de aceptarla. `storageKey` guarda esa URL y el puerto la trata como
   opaca.
3. **Las URL de blob son públicas aunque sean impredecibles.** Eso choca con FR-035, así que la
   descarga **no** entrega nunca la URL del almacenamiento: el panel sirve el documento por una
   ruta propia que primero llama a `access.authorize("enrollment:read")` y luego transmite el
   contenido con `files.read(key)`. Por eso el puerto expone `read` y no `downloadUrl`: firmar una
   URL que el proveedor no sabe restringir sería seguridad de mentira.

**Coste asumido**: el documento atraviesa el servidor al descargarse. Son descargas del panel,
puntuales y de personal de la Academia; el camino caro —la subida de 10 MB de quien se inscribe—
sigue yendo directo al almacenamiento, que es lo que importa.

**Caveat de desarrollo**: el callback `onUploadCompleted` de Vercel Blob no llega a `localhost`
sin un túnel. El diseño no depende de él: la verdad se establece con `confirm(key)` en el momento
del envío, no con el aviso del proveedor.

---

## D9 — La exportación es CSV con BOM, servida por un route handler

**Decisión**: `exportSubmissions(filter)` devuelve `{ headers: string[], rows: string[][] }` —
datos planos, sin formato. El route handler `/panel/inscripciones/exportar` los serializa como
CSV con BOM UTF-8 y los entrega con `Content-Disposition: attachment`.

**Motivo**: Excel y Google Sheets abren un CSV con BOM sin preguntar nada y sin mutilar las
tildes ni los apóstrofos del kaqchikel. Un `.xlsx` real exige una librería (`exceljs` pesa
varios megabytes) para ganar formato que un listado de inscripciones no necesita. Si algún día
piden colores o varias hojas, el caso de uso no cambia: cambia el serializador del adaptador.

**Por qué un route handler y no una server action**: una descarga es una respuesta HTTP con
cabeceras propias. Eso es traducción de transporte, exactamente el trabajo de un adaptador
(Principio IV); una server action tendría que devolver el archivo como cadena y hacer que el
navegador lo reconstruya.

---

## D10 — Dos columnas denormalizadas para que los reportes no consulten JSON

**Decisión**: además de `answers` (JSON, testimonio íntegro de lo enviado), `form_submissions`
guarda `ageRange` y `ethnicGroup` como columnas. El sexo y el municipio de residencia ya viven en
`students`.

**Motivo**: el resumen anual agrupa por sexo, rango de edad, pueblo, municipio, modalidad y
curso (FR-053). Agrupar por `answers->>'age_range'` obliga a consultas crudas y a un índice
funcional para que no degrade; dos columnas lo vuelven un `groupBy` normal de Prisma. La
duplicación es controlada y unidireccional: el JSON manda, las columnas se derivan de él en la
misma escritura y nadie las edita después (FR-044 hace inmutable la inscripción, así que no
pueden divergir).

**Alternativa descartada**: una tabla de hechos aparte para reportes. Es la respuesta correcta
con millones de filas; con cientos por año es una tabla que mantener sin ninguna ganancia.

---

## D11 — El catálogo geográfico vive en el código, sin tabla

**Decisión** (tomada por el solicitante, 2026-08-31): los 22 departamentos, sus 340 municipios y
las zonas son una constante de TypeScript en `src/modules/geography/domain/guatemala.ts`. **No hay
tablas** `departments`, `municipalities` ni `zones`. Donde otra entidad ubica algo guarda el
**código INE del municipio** (`"0406"` = Tecpán Guatemala) como columna de texto, no una clave
foránea.

**Motivo**: es dato de referencia que no cambia y que nadie administra desde la interfaz —
exactamente el mismo criterio que ya aplicamos a las seis plantillas de formulario (D2). Una tabla
obligaba a sembrarla en cada entorno, a mantenerla sincronizada y a un `join` en cada consulta,
a cambio de ninguna capacidad nueva.

**Consecuencia de diseño**: los nombres para mostrar ya no salen de un `join`. Como la
infraestructura de `enrollment` y `students` no puede importar el dominio de `geography`
(Principio II), cada uno declara un puerto `PlaceCatalog` con un único método `find(code)`, que el
contenedor satisface con `findPlace` del SDK de `geography`. El repositorio devuelve el código; el
**caso de uso** arma la vista con el nombre. Es el mismo patrón que `StudentRegistry` (D1).

**Coste asumido**: un código de municipio guardado en `students` o `form_offerings` no tiene
integridad referencial que lo respalde; si alguien escribe `"9999"` la base lo acepta. Lo cubren
el dominio (`isKnownMunicipality`) y la interfaz, que solo ofrece códigos del catálogo. Con 340
valores fijos y ningún proceso de importación masiva, el riesgo real es despreciable.

## D12 — La validación de respuestas es una función pura reutilizada por cliente y servidor

**Decisión**: `validateAnswers(template, answers)` vive en `enrollment/domain/` y devuelve la
lista de preguntas faltantes o inválidas. El componente del formulario la importa del SDK y la
ejecuta en el navegador; `submitEnrollment` la ejecuta otra vez en el servidor y es la que manda.

**Motivo**: el dominio no importa React, Next ni ningún SDK, así que ya es código que corre en
los dos lados. Es el beneficio concreto del Principio II en esta feature: una sola definición de
"qué es una respuesta válida", sin el clásico desfase entre lo que el formulario permite escribir
y lo que el servidor acepta.

**Lo que no se hace**: confiar en la validación del cliente. Es una cortesía para no obligar a
un viaje al servidor; la autoridad está siempre en el caso de uso.

---

## D13 — La clave del módulo es `enrollment`, nunca `forms`

**Decisión**: `MODULES` gana `enrollment` ("Inscripciones") y `students` ("Estudiantes").

**Motivo**: `tests/unit/access/future-modules.test.ts` usa literalmente `"forms:create"` como
ejemplo de "área que todavía no existe" para probar que un administrador manda sobre áreas no
catalogadas. Registrar un módulo llamado `forms` convertiría ese test en una tautología que pasa
sin probar nada. La palabra está quemada en el test a propósito y hay que respetarla.

`geography` **no** entra en `MODULES`: no tiene pantalla ni permisos, y el formulario público lee
sus catálogos sin sesión.

---

## D14 — Las rutas públicas se declaran en `proxy.ts`

**Decisión**: `isPublic` pasa de `["/", "/ingresar(.*)"]` a
`["/", "/ingresar(.*)", "/inscripcion(.*)"]`.

**Motivo**: el formulario lo llena gente sin cuenta (FR-020). Todo lo que no esté en esa lista
sigue exigiendo sesión, incluidas las tres áreas nuevas del panel, que además comprueban permiso
concreto con `access.authorize(...)` en cada página.

**Riesgo asumido**: una ruta pública que escribe en la base y acepta archivos es superficie de
abuso. Las mitigaciones que sí entran son las que el dominio ya impone —ventana abierta,
documento único por convocatoria, `confirm` de cada adjunto con tipo y tamaño reales—. Un
limitador de peticiones por IP queda anotado como deuda: es infraestructura de despliegue, no
diseño de la capacidad, y la Academia abre inscripciones unas semanas al año.
