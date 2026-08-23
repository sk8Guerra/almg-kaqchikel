# Quickstart — Validación de la feature

**Feature**: `004-antd-ui-migration` | **Date**: 2026-08-23

Guion para comprobar que la feature hace lo que la spec dice. Cada bloque cierra uno o varios
criterios de éxito.

> El servidor de desarrollo lo levantas tú (`pnpm dev`). El agente no lo arranca.

---

## Prerrequisitos

- Base de datos accesible y `.env.local` con las variables de Clerk y Postgres ya configuradas.
- Al menos tres cuentas de prueba, porque cuatro de los criterios se comprueban por rol:
  1. una con rol **administración**,
  2. una con rol **miembro** y permiso `access:read`,
  3. una **activa sin permisos** asignados.

---

## 1. Puertas automáticas

```bash
pnpm verify
```

Corre formato, lint (incluidas las reglas de frontera), tipos y pruebas. **Cubre SC-007.**

Debe quedar en verde en cada una de las cinco fases del plan, no sólo al final.

---

## 2. Verificar que las guardas nuevas disparan

Una regla que nadie vio fallar no está verificada. Estas dos comprobaciones son obligatorias en la
Fase A, y hay que **deshacer cada violación** después de confirmarla.

**(a) La librería de UI no entra en la capa de negocio** (D7a):

```bash
# Introduce temporalmente en un caso de uso:
#   src/modules/access/application/use-cases/can.ts
#   import { Table } from "antd";
pnpm lint
```

**Esperado**: error de `boundaries/external` citando el Principio III.

**(b) `style={{ }}` sigue prohibido, también sobre componentes de la librería** (D7b):

```bash
# Introduce temporalmente en cualquier pantalla del panel:
#   <Button style={{ margin: 8 }}>…</Button>
pnpm lint
```

**Esperado**: error de `react/forbid-component-props` citando la constitución.

Si alguna de las dos **no** falla, la guarda está mal configurada y hay que arreglarla antes de
seguir. Falla abierto: no reporta nada y nadie se entera.

---

## 3. Prueba unitaria del caso de uso

```bash
pnpm vitest run tests/unit/access/list-accessible-modules.test.ts
```

**Esperado**: verde, con un caso por cada fila de la tabla de comportamiento de
[contracts/list-accessible-modules.md](./contracts/list-accessible-modules.md), y sin base de datos
ni red. **Cubre FR-002 y la mitad automatizable de FR-007.**

---

## 4. Barra lateral y navegación (US1)

Levanta el servidor y entra a `/panel`.

| Paso                                            | Esperado                                                                           | Cubre                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------- |
| Entrar con cuenta **administración**            | La barra lista todas las áreas del catálogo; el inicio del panel aparece resaltado | FR-002, FR-003         |
| Ir a Personas y luego al detalle de alguien     | "Personas" sigue resaltado en el detalle                                           | FR-003                 |
| Desde el detalle, pulsar "Personas" en la barra | Llegas al listado **sin pasar por el inicio del panel**                            | SC-001                 |
| Buscar en la pantalla un enlace "Volver"        | No existe ninguno                                                                  | FR-008                 |
| Entrar con cuenta **miembro con `access:read`** | La barra lista "Personas" y nada más                                               | FR-002, SC-004         |
| Entrar con cuenta **activa sin permisos**       | La barra no ofrece áreas; la pantalla explica que pida permisos a administración   | FR-005, SC-004         |
| Localizar identidad y cierre de sesión          | Están en la barra, no en la cabecera de cada pantalla                              | FR-004                 |
| Recargar `/panel/personas/<id>` con F5          | El resaltado ya está puesto en el primer pintado, sin parpadeo                     | caso límite de la spec |

---

## 5. Comportamiento responsivo y accesibilidad

| Paso                                                                                      | Esperado                                                                                                              | Cubre                  |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Reducir el navegador a **360 px** de ancho                                                | La barra arranca colapsada u oculta; ningún control queda cortado ni fuera de alcance; la navegación sigue disponible | FR-006, SC-005         |
| Colapsar y expandir la barra                                                              | Ambas transiciones funcionan y el contenido se reacomoda                                                              | FR-006                 |
| Recorrer cada pantalla del panel **sólo con teclado** (Tab / Shift+Tab / Enter / Espacio) | Todo control interactivo es alcanzable y activable                                                                    | SC-006                 |
| Recorrer la matriz de permisos con teclado                                                | Cada casilla es alcanzable y su etiqueta identifica área y acción                                                     | FR-012, SC-006         |
| Zoom del navegador al **200 %**                                                           | Sigue legible y sin desbordes horizontales                                                                            | caso límite de la spec |

---

## 6. Listado de personas (US2)

| Paso                                                                       | Esperado                                                               | Cubre          |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------- |
| Abrir `/panel/personas` con varias personas en estados distintos           | Tabla con encabezados; correo, nombre, estado, rol y permisos legibles | FR-009         |
| Distinguir "Activa" / "Sin ingresar todavía" / "Desactivada" de un vistazo | Se diferencian sin leer con atención, y **no sólo por color**          | FR-009, SC-003 |
| Escribir un término y enviar la búsqueda                                   | El listado se reduce y el término queda visible en el campo            | FR-010         |
| Buscar algo sin coincidencias                                              | Mensaje de listado vacío, no una tabla con cero filas                  | FR-009         |
| **Desactivar JavaScript** en el navegador y buscar                         | La búsqueda sigue funcionando                                          | FR-010         |
| Ver el listado como **administración**                                     | Cada correo lleva al detalle                                           | US2            |
| Ver el listado como **miembro sin edición**                                | Los correos son texto plano                                            | US2            |

---

## 7. Formularios (US3)

| Paso                                            | Esperado                                                                               | Cubre          |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- |
| En el alta, elegir rol "Miembro"                | Aparece la matriz de permisos                                                          | US3            |
| Cambiar a "Administración"                      | La matriz se sustituye por la explicación de que ese rol tiene todo                    | US3            |
| Dar de alta con correo válido                   | El resultado se comunica por el **mismo** mecanismo de aviso que las demás operaciones | FR-011, FR-013 |
| Dar de alta con correo inválido o ya registrado | Error asociado al formulario; **no se crea ninguna persona**                           | US3            |
| Cambiar rol y permisos en el detalle y guardar  | Los cambios se ven al volver al listado                                                | FR-014         |
| Desactivar una persona activa                   | Se confirma y su estado pasa a "Desactivada" en el listado                             | US3            |
| Reactivarla                                     | Se confirma por el mismo camino                                                        | FR-011         |

**Comprobación transversal**: las cinco operaciones deben avisar igual. Si alguna todavía pinta su
propio `<p role="status">`, FR-013 no está cumplido.

---

## 8. Extensibilidad del catálogo (SC-008)

Prueba temporal, **a borrar al terminar**:

1. Añade un área de prueba a `MODULES` en `src/modules/access/domain/modules.ts`.
2. `pnpm typecheck` → **debe fallar**, señalando que falta su ruta en `NAV_ROUTES`. Ese fallo es el
   resultado buscado, no un problema.
3. Añade la ruta en `src/app/panel/nav-routes.ts`.
4. Entra a `/panel` como administración → el área nueva aparece en la barra **sin haber tocado
   ninguna pantalla**.
5. Revierte los dos cambios.

---

## 9. Coherencia final

| Paso                                                           | Esperado                                                         | Cubre                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------- |
| Recorrer las tres pantallas del panel                          | Todas con la misma barra lateral y la misma familia de controles | SC-002, FR-018         |
| Revisar `panel.module.scss` y `personas.module.scss`           | Sólo quedan reglas de composición, o los archivos ya no existen  | FR-018                 |
| Confirmar que `/`, `/ingresar` y el error de raíz siguen igual | Sin cambios de presentación: están fuera de alcance              | Assumptions            |
| Provocar un fallo de base de datos o de Clerk                  | La pantalla de error aparece; no se queda en blanco              | caso límite de la spec |
| `git diff .specify/memory/constitution.md`                     | La enmienda a **v1.4.0** está en el mismo cambio que la adopción | FR-020                 |

---

## Definición de terminado

- `pnpm verify` en verde.
- Las dos guardas nuevas comprobadas con violación deliberada, y las violaciones revertidas.
- Las secciones 4 a 9 recorridas con las tres cuentas de prueba.
- El área de prueba de SC-008 eliminada.
- Constitución en v1.4.0 con la excepción acotada y las decisiones de registro.
