# Phase 1 — Modelo de datos

**Feature**: `002-people-management` · **Fecha**: 2026-08-19

Extiende el modelo de la feature 001. Los cambios son aditivos: nada de lo que 001 construyó se
redefine.

---

## Cambio en `User`

Un solo campo nuevo. Quién dio de alta a quién ya queda en `AdminAction`, así que no se duplica
en `User`. **`identityId` sigue siendo obligatorio** y no aparece ningún estado
intermedio: como `createUser` devuelve el identificador al instante (research §R2), el perfil
nace completo.

| Campo           | Cambio          | Motivo                                                                  |
| --------------- | --------------- | ----------------------------------------------------------------------- |
| `firstSignInAt` | nuevo, nullable | `null` = nunca ha ingresado. Resuelve FR-010 sin consultar al proveedor |

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
}

model User {
  id            String     @id @default(cuid())
  identityId    String     @unique
  email         String     @unique
  displayName   String?
  status        UserStatus @default(ACTIVE)
  firstSignInAt DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  roles         UserRole[]
  @@index([email])
  @@index([status])
}
```

**Lo que este feature NO cambia del modelo de la 001**: `identityId` sigue siendo `@unique` y no
nulo, el enum solo gana la ausencia de un tercer valor que llegó a considerarse, y ninguna
columna existente cambia de tipo. La migración es puramente aditiva.

Eso importa porque `PrismaUserRepository` y `syncSignedInUser` de la feature 001 asumen
`identityId` no nulo. Con este diseño esa suposición sigue siendo cierta y su código no se toca,
salvo para poner `firstSignInAt` la primera vez.

## Entidad nueva: `AdminAction`

```prisma
enum AdminActionType {
  USER_CREATED
  ROLE_ASSIGNED
  ROLE_REVOKED
  USER_DEACTIVATED
  USER_REACTIVATED
}

model AdminAction {
  id         String          @id @default(cuid())
  type       AdminActionType
  actorId    String
  targetId   String
  roleKey    String?
  createdAt  DateTime        @default(now())
  actor      User            @relation("ActorActions", fields: [actorId], references: [id])
  target     User            @relation("TargetActions", fields: [targetId], references: [id])
  @@index([targetId, createdAt])
  @@index([actorId, createdAt])
}
```

Solo se inserta y se lee. No hay operación de edición ni de borrado en ningún puerto, de modo
que la ausencia de esa capacidad es estructural y no una convención.

---

## Estados y transiciones

```
   alta desde el panel
          │
          ▼
     ┌────────┐   desactivar    ┌──────────┐
     │ ACTIVE │ ───────────────►│ INACTIVE │
     └────────┘ ◄─────────────── └──────────┘
                   reactivar
```

Solo dos estados. Una persona recién dada de alta ya está `ACTIVE` y puede entrar cuando quiera:
no hay nada que aceptar ni ninguna espera.

- Desactivar **no borra los roles**, por eso reactivar los devuelve (FR-018).
- `firstSignInAt` es independiente del estado: es un dato, no una fase del ciclo de vida.
- Desactivar a alguien que nunca entró es válido: revoca un alta hecha por error.

## Permiso nuevo

| Clave         | Descripción                                      | Rol inicial |
| ------------- | ------------------------------------------------ | ----------- |
| `user:manage` | Dar de alta, cambiar roles y desactivar personas | `admin`     |

`user:assign-role` ya existía en el catálogo de la 001. Este feature lo unifica bajo
`user:manage`, porque en la práctica quien puede asignar roles puede concederse cualquier
permiso: separarlos daba una falsa sensación de granularidad.

---

## Reglas de dominio que el modelo no expresa por sí solo

Ambas viven en casos de uso (research §R5), no en restricciones de base:

- **FR-014**: no se puede retirar `user:manage` ni desactivar a alguien si con ello el número de
  personas `ACTIVE` con ese permiso llegaría a cero.
- **FR-019**: nadie puede desactivarse a sí mismo.

Una restricción de base no puede expresarlas porque dependen de un conteo sobre el resultado de
la operación, no de una fila aislada.
