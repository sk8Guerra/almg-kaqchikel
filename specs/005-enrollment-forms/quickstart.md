# Quickstart — Verificación de la feature 005

**Feature**: `005-enrollment-forms` · **Fecha**: 2026-08-27

Guía de validación, no de implementación. Cada bloque prueba una historia del
[spec](./spec.md) y termina con un resultado observable. Los detalles de firma están en
[contracts/](./contracts/) y el esquema en [data-model.md](./data-model.md).

---

## 0. Preparación

```bash
pnpm install
pnpm db:migrate          # aplica la migración nueva y regenera el cliente
pnpm db:seed             # catálogo geográfico + las seis plantillas
pnpm verify              # format:check + lint + typecheck + test
```

`pnpm verify` debe pasar limpio **antes** de abrir el navegador. Lo que se comprueba ahí:

| Señal                              | Qué demuestra                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `lint` sin errores de `boundaries` | Ningún adaptador importó Prisma ni entró a un módulo por otro camino que su `index.ts` |
| `typecheck` limpio                 | `NAV_SEGMENTS` cubre las tres claves de `MODULES`; ningún `TemplateCode` inventado     |
| `test` en verde                    | Dominio y casos de uso pasan con dobles en memoria, sin base ni almacenamiento         |

Variable de entorno nueva: `BLOB_READ_WRITE_TOKEN` (Vercel Blob, research D8). Sin ella `env()`
falla al arrancar con un mensaje explícito, que es lo correcto.

**En local**, el callback `onUploadCompleted` de Vercel Blob no llega a `localhost` sin un túnel.
No importa: el diseño no depende de ese aviso — la verdad la establece `confirm(key)` en el
momento del envío. La subida en sí funciona igual en local.

### Prueba del Principio III (obligatoria)

```bash
pnpm db:seed
```

`prisma/seed.ts` invoca `enrollment.syncFormTemplates()` y `geography.syncPlaces()` desde Node
plano, sin React, sin Next y sin petición HTTP. Si eso corre, la capa de negocio es
framework-agnóstica de verdad. Ejecutarlo dos veces seguidas debe dejar exactamente las mismas
filas: **6** en `form_templates`, **22** departamentos y **340** municipios.

---

## 1. Historia 2 — Convocatorias (se prueba primero: habilita el resto)

1. Entra al panel con una cuenta administradora → la barra lateral muestra **Inscripciones** y
   **Estudiantes** además de Personas.
2. **Inscripciones → Convocatorias → Nueva**: elige `L2 principiante`, año en curso, municipio
   Tecpán, modalidad Virtual, ventana de ayer a dentro de siete días, inicio de clases y horario
   "Martes de 14:00 a 16:30 horas".
3. Repite con ventana **futura** (empieza mañana).
4. Repite con modalidad **Presencial**, mismo curso, año y municipio.

| Comprobación                                                | Esperado                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Listado de convocatorias                                    | Las tres, con estado abierta / programada / abierta                                |
| Crear otra vez la primera, idéntica                         | Rechazada: "Ya existe una convocatoria para ese curso, año, municipio y modalidad" |
| Ventana con cierre anterior a la apertura                   | Rechazada antes de guardar                                                         |
| Cuenta con permiso solo de lectura                          | Ve el listado; no ve los botones de crear, editar ni cerrar                        |
| Sin sesión, entrando a `/panel/inscripciones/convocatorias` | Redirige a `/ingresar`                                                             |

---

## 2. Historia 1 — Inscripción pública

1. Abre `/` **sin sesión**, en una ventana privada.

| Comprobación                     | Esperado                                                            |
| -------------------------------- | ------------------------------------------------------------------- |
| Cuadrícula                       | Dos tarjetas (las abiertas), nunca la programada                    |
| Cada tarjeta                     | Curso, vía y nivel, modalidad, horario, municipio y fecha de cierre |
| Todas las convocatorias cerradas | La página explica que no hay inscripciones abiertas                 |

2. Abre una tarjeta y llena el formulario en un teléfono (o con el navegador a 360 px).

| Comprobación                                                | Esperado                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Preguntas                                                   | 22, en kaqchikel y español, con las obligatorias marcadas                  |
| Compromiso de modalidad = "Manäq / No"                      | No deja enviar y explica por qué                                           |
| Departamento → Municipio                                    | La lista de municipios cambia con el departamento                          |
| Municipio zonificado (Guatemala) vs. no zonificado (Tecpán) | La pregunta de zona aparece solo en el primero                             |
| Enviar con una obligatoria vacía                            | Señala **todas** las que faltan, en un solo intento, sin perder lo escrito |
| Adjuntar un `.docx` o un PDF de 12 MB                       | Rechazado antes de subir                                                   |
| Lengua materna "Otro"                                       | Admite texto libre con varios idiomas separados por comas                  |

3. Completa todo, adjunta los PDF exigidos (3 en principiante, 4 en intermedio, 5 en avanzado) y
   envía.

| Comprobación           | Esperado                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| Pantalla final         | Confirma, nombra el curso y repite inicio de clases y horario                 |
| `students`             | Una fila nueva con el DPI, nombres, apellidos, sexo y municipio               |
| `form_submissions`     | Una fila con `answers` completo, `age_range`, `ethnic_group` y `submitted_at` |
| `submission_documents` | Una fila por documento exigido, con `storage_key`, tipo y tamaño              |

---

## 3. Historia 3 — Duplicados

| Paso                                                  | Esperado                                          |
| ----------------------------------------------------- | ------------------------------------------------- |
| Volver a `/` en el mismo navegador                    | La tarjeta dice "ya te inscribiste" y la fecha    |
| Borrar `localStorage` y recargar                      | La tarjeta vuelve a ofrecer el formulario         |
| Enviar otra vez con el mismo DPI, misma convocatoria  | Rechazado: ya existe una inscripción              |
| Lo mismo desde otro navegador o dispositivo           | Rechazado igual                                   |
| Inscribirse en **otra** convocatoria con el mismo DPI | Aceptado; el estudiante es el mismo, no uno nuevo |
| Cerrar la convocatoria y reabrirla con fechas nuevas  | Se puede volver a inscribir                       |

**Prueba de concurrencia** (la que justifica el índice único): lanza dos envíos idénticos a la
vez con el mismo DPI.

```bash
# con el formulario ya validado, dos peticiones simultáneas
seq 2 | xargs -P2 -I{} curl -s -o /dev/null -w "%{http_code}\n" ...
```

Exactamente una inscripción registrada. Si aparecen dos, el índice único no se creó.

---

## 4. Historias 4 y 5 — Panel, exportación y padrón

| Comprobación                                  | Esperado                                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/panel/inscripciones`                        | Tabla con nombre, documento, municipio, curso, convocatoria y fecha; total del filtro                                      |
| Buscar por apellido y por DPI                 | Filtra sin perder la convocatoria seleccionada                                                                             |
| Abrir una inscripción                         | Las 22 respuestas tal como se enviaron y los adjuntos descargables                                                         |
| Ver el HTML del detalle                       | No aparece ninguna URL de `blob.vercel-storage.com`: solo la ruta del panel                                                |
| Abrir la ruta del documento sin sesión        | Redirige a `/ingresar`                                                                                                     |
| Abrirla con sesión pero sin `enrollment:read` | Denegado                                                                                                                   |
| Exportar                                      | CSV que Excel y Google Sheets abren con tildes y apóstrofos correctos, una fila por inscripción y una columna por pregunta |
| `/panel/estudiantes`                          | Padrón con nombre, documento, sexo, municipio y número de inscripciones                                                    |
| Persona inscrita dos veces                    | Aparece **una** vez; su expediente lista las dos inscripciones                                                             |
| Cuenta sin `students:read`                    | No ve el área de Estudiantes en la barra lateral                                                                           |

---

## 5. Historia 6 — Resumen anual

| Comprobación                              | Esperado                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `/panel/inscripciones/resumen` con un año | Total y desglose por sexo, rango de edad, pueblo, municipio, modalidad y curso |
| Suma de cada desglose                     | Igual al total                                                                 |
| Acotar a una convocatoria                 | Los conteos bajan y siguen sumando su propio total                             |
| Descargar                                 | Los mismos números en hoja de cálculo                                          |

---

## 6. Verificación de las guardas (obligatoria antes de dar por buena la feature)

La constitución exige comprobar que las reglas **fallan** cuando deben. Introduce cada violación,
confirma el error y **revierte**:

| Violación deliberada                                                                           | Debe fallar con                                    |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `import { prisma } from "@/composition/prisma"` en `src/app/inscripcion/[offeringId]/page.tsx` | `boundaries/external` o `no-restricted-imports`    |
| `import { TEMPLATES } from "@/modules/enrollment/domain/form-template"` desde una página       | `boundaries/entry-point`                           |
| `import { PrismaClient } from "@generated/client/client"` en `enrollment/application/`         | `boundaries/external`                              |
| Quitar `students: "estudiantes"` de `NAV_SEGMENTS`                                             | `tsc --noEmit`                                     |
| `new Date()` dentro de un caso de uso en vez del reloj inyectado                               | Test con reloj fijo en rojo                        |
| Borrar el `@@unique([formOfferingId, studentId])` de la migración                              | La prueba de concurrencia de §3 registra dos filas |

Si alguna de estas seis pasa sin protestar, la guarda correspondiente no está enforcing y hay que
arreglarla antes de seguir.
