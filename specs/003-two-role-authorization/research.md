# Phase 0 — Research: Autorización de Dos Roles

**Fecha**: 2026-08-19 · **Feature**: `003-two-role-authorization`

---

## R0. Cobertura de los casos límite declarados en la especificación

Revisión explícita antes de diseñar nada, porque un caso límite sin requisito es un caso límite
que nadie va a implementar.

| Caso límite                          | Cubierto por            | Dónde se resuelve                      |
| ------------------------------------ | ----------------------- | -------------------------------------- |
| Último administrador                 | FR-020, SC-005          | Regla de dominio en los casos de uso   |
| Autodegradación                      | FR-021                  | Regla de dominio                       |
| Miembro con permisos sobre personas  | FR-018, FR-019, SC-004  | Autoridad no concedible                |
| Miembro sin ningún permiso           | FR-013, FR-024          | Estado válido + mensaje en la interfaz |
| Permiso concedido dos veces          | FR-012                  | Restricción de unicidad                |
| Roles anteriores al cambio de modelo | FR-004 + Assumptions    | Migración                              |
| Cambio de rol con sesión abierta     | FR-023                  | Autorización en cada petición          |
| **Área retirada del sistema**        | **solo SC-008, sin FR** | **Ver abajo**                          |

**El hueco**: "área retirada del sistema" solo tenía un criterio de éxito (SC-008: no debe haber
permisos concedidos que no correspondan a un área existente) pero **ningún requisito funcional**
que dijera qué hace el sistema al respecto. Un criterio sin requisito no se implementa: se mide
algo que nadie construyó.

**Decisión**: se cierra por diseño, no con una regla nueva. El catálogo de áreas vive **en
código** (§R2), así que un permiso concedido sobre un área inexistente no puede crearse —la
concesión valida contra el catálogo— y si un área desaparece en un despliegue, sus permisos
quedan almacenados pero **son inertes**: `authorize` nunca los consulta porque nadie pide ese
permiso. `scripts/check-orphans.ts` se amplía para reportarlos, y limpiarlos es una tarea de
mantenimiento, no un requisito de producto.

Esta decisión debe reflejarse en la especificación: SC-008 pasa de "no debe haber" a "los
permisos huérfanos son detectables e inertes". Queda anotado como enmienda para la Fase 8.

---

## R1. Cómo se representa la autoridad ilimitada del administrador _(decisión central)_

**Decisión**: el rol es una propiedad de la persona (`ADMIN` | `MEMBER`) y la comprobación vive en
**una sola función de dominio**:

```
grants(person, permission) =
  person.role === ADMIN  →  true
  en otro caso           →  permission ∈ permisos concedidos a esa persona
```

**Rationale**: FR-006 exige que no exista ningún registro por administrador y por área. Cualquier
diseño que materialice los permisos del administrador —una fila por cada combinación— reintroduce
exactamente el problema que el feature quiere eliminar: al incorporar un área hay que acordarse de
actualizar a cada administrador, y olvidarlo falla en silencio.

Con la autoridad implícita, SC-002 se cumple por construcción: añadir un área es añadir una
entrada al catálogo de código; ningún dato de ninguna persona cambia.

**Sobre el olor a "comprobar rol en vez de permiso"**: normalmente autorizar por rol es un error,
porque dispersa la política. Aquí no lo es, por tres razones: ocurre en **un único punto** del
dominio, `ADMIN` es un concepto de superusuario explícito y no un rol de negocio disfrazado, y
todo el resto del sistema sigue preguntando por permisos (`authorize("forms:create")`), nunca por
el rol.

**Alternativa considerada**: dar al administrador un permiso comodín (`*:*`) almacenado como
cualquier otro. Mantiene la uniformidad "todo son permisos", pero obliga a que la comprobación
expanda comodines, que es la misma bifurcación disfrazada de dato, y deja un registro por
administrador que alguien puede borrar por error.

---

## R2. El catálogo de áreas vive en código, no en base de datos

**Decisión**: las áreas y sus operaciones se declaran como una constante tipada en el código. No
existe tabla de permisos.

**Rationale**: un área del sistema **es** código —el módulo de formularios no existe hasta que
alguien lo escribe—, así que un catálogo en base de datos sería una copia que hay que mantener
sincronizada a mano con la realidad. Consecuencias concretas:

- El tipo de las claves de permiso se deriva del catálogo, así que `authorize("form:raed")` es un
  error de compilación y no un fallo en tiempo de ejecución.
- La interfaz de selección de permisos se renderiza desde el catálogo: al añadir un área aparece
  sola, sin migración ni seed.
- Desaparece la necesidad de sembrar permisos.

**Coste**: incorporar un área requiere un despliegue. Es correcto, porque el área no funciona sin
su código de todos modos.

**Alternativa considerada**: tabla `permissions` con clave foránea desde las concesiones. Da
integridad referencial gratis, pero exige sembrar cada combinación de área y operación, y la
integridad que aporta ya la da el sistema de tipos antes de llegar a la base.

---

## R3. Qué desaparece del modelo actual

**Decisión**: se eliminan las tablas `roles`, `user_roles`, `role_permissions` y `permissions`, y
se añade `user_permissions`.

**Rationale**: la indirección Persona → Rol → Permiso existía para agrupar. Con dos roles y
permisos definidos persona a persona, no agrupa nada: dos miembros pueden tener permisos
completamente distintos, y el rol `member` no puede llevar permisos porque serían los mismos para
todos. Mantener las cuatro tablas sería conservar una forma sin su función.

| Antes                                                                     | Después                                      |
| ------------------------------------------------------------------------- | -------------------------------------------- |
| `users` ─< `user_roles` >─ `roles` ─< `role_permissions` >─ `permissions` | `users.role` + `users` ─< `user_permissions` |
| 5 tablas                                                                  | 2 tablas                                     |

**Lo que se pierde**: la posibilidad de decir "cambia lo que puede hacer el rol editor y se aplica
a todos". Con dos roles fijos eso ya no era posible. Si algún día hacen falta plantillas de
permisos reutilizables, se añaden como plantillas —copiar un conjunto al conceder— sin resucitar
la indirección en la ruta de autorización.

**Alternativa considerada**: conservar `roles` y `role_permissions` por si vuelven más roles.
Rechazada: son tablas que ninguna consulta usaría, y una tabla que nadie lee es una que se
desincroniza en silencio.

---

## R4. Prevención de escalada de privilegios (FR-018, FR-019)

**Decisión**: cambiar el rol de alguien y conceder o retirar permisos **no son permisos**. Son
capacidades inherentes al rol `ADMIN`, comprobadas con una guarda distinta de `authorize`.

**Rationale**: si "conceder permisos" fuera el permiso `access:update`, cualquier miembro al que
se le concediera podría concederse el resto, y el modelo de dos roles se anularía en un paso. La
única forma de que la frontera se sostenga es que esa capacidad no sea representable como una
concesión.

Consecuencia práctica: un miembro puede recibir `access:read` para ver el listado de personas.
Las operaciones que alteran autoridad quedan fuera de su alcance por construcción, no por no
habérselas concedido.

**Verificación exigida**: una prueba que conceda a un miembro _todos_ los permisos del catálogo y
compruebe que aun así no puede cambiar roles ni conceder permisos. Es la prueba que demuestra que
la frontera es estructural.

---

## R5. Registro de actividad: tipos nuevos

**Decisión**: los tipos de acción administrativa pasan a `USER_CREATED`, `ROLE_CHANGED`,
`PERMISSION_GRANTED`, `PERMISSION_REVOKED`, `USER_DEACTIVATED`, `USER_REACTIVATED`.

**Rationale**: `ROLE_ASSIGNED` y `ROLE_REVOKED` describían el modelo anterior de muchos roles por
persona. Con exactamente un rol, lo que ocurre es un cambio de rol, y lo que se concede y retira
son permisos. La bitácora sigue siendo best-effort (feature 002, §R6).

---

## R6. Efecto inmediato de los cambios (FR-023)

**Decisión**: ninguna caché. El rol y los permisos se leen de la base en cada operación protegida.

**Rationale**: a la escala del proyecto —decenas de personas— la consulta es barata y el efecto es
inmediato, que es lo que FR-023 pide y lo que hace seguro degradar a alguien con sesión abierta.
Cachear permisos en el token de sesión daría rendimiento a cambio de que un permiso retirado
siguiera vigente hasta que la sesión rotara, que es justo el momento en que más importa que no lo
esté.

---

## R7. Alcance del cambio sobre el código existente

Este feature **modifica** las features 001 y 002; no se limita a añadir.

| Elemento                         | Cambio                                                                    |
| -------------------------------- | ------------------------------------------------------------------------- |
| `authorize`, `can`               | Reescritos sobre `grants`                                                 |
| `Role`, `Permission` (entidades) | Desaparecen como entidades; `PermissionKey` pasa a derivarse del catálogo |
| `RoleRepository` (puerto)        | Eliminado                                                                 |
| `changeRoles` (caso de uso)      | Sustituido por `changePermissions` y `changeRole`                         |
| `assignRole`, `revokeRole`       | Eliminados                                                                |
| `createPerson`                   | Recibe rol y, si es miembro, permisos                                     |
| `PersonSummary`                  | Lleva rol y permisos concedidos                                           |
| `prisma/seed.ts`                 | Se reduce a conceder el rol al primer administrador                       |

Las pruebas de las features 001 y 002 que dependían de roles **sí deben cambiar**, y eso es
correcto: el modelo que verificaban ya no existe. Distinto de la feature 002, donde exigimos que
las pruebas de la 001 no se tocaran porque el cambio era aditivo. Aquí no lo es, y pretender lo
contrario ocultaría la ruptura.
