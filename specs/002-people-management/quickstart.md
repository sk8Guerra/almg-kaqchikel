# Quickstart — Validación del feature

**Feature**: `002-people-management` · **Fecha**: 2026-08-19

---

## Prerrequisitos

1. Feature 001 operativa y tu cuenta con rol `admin`.
2. Migración y seed aplicados:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

3. Un segundo correo real al que puedas acceder, para probar el alta.

---

## Escenarios

### V1 — Alta con rol en un solo acto (US1, FR-001…FR-008)

1. Entra en `/panel/personas`, escribe un correo nuevo, elige rol `editor`, confirma.
2. **Esperado**: aparece en la lista con rol `editor` y marcada como **pendiente de primer
   ingreso** (FR-010).
3. **Esperado**: NO llega ningún correo. El sistema no notifica nada (FR-008); avisar a la
   persona es tarea tuya.
4. Con ese correo, ve a la pantalla de acceso, pide el código e ingresa.
5. **Esperado**: esa persona puede ejecutar de inmediato acciones de `editor`, **sin que nadie le
   asigne nada después** (SC-003). En la lista pasa a _activa_.
6. Vuelve a dar de alta el mismo correo. **Esperado**: rechazado, sin duplicado (FR-004).
7. Da de alta el mismo correo en MAYÚSCULAS. **Esperado**: rechazado igual (FR-006).

### V2 — Consulta (US2, FR-009…FR-011)

1. Abre la lista. **Esperado**: correo, nombre, estado y roles de cada persona.
2. Busca por parte de un correo. **Esperado**: filtra correctamente.
3. **Esperado**: quien nunca ingresó se distingue a simple vista de quien ya lo hizo.

### V3 — Cambio de roles (US3, FR-012, FR-013)

1. Asigna `admin` a la persona de prueba. **Esperado**: gana esas capacidades.
2. Retíraselo. **Esperado**: las pierde, pero **conserva su cuenta y puede seguir entrando**.

### V4 — Desactivación (US4, FR-015…FR-018)

1. Con esa persona con sesión abierta en otro navegador, desactívala.
2. **Esperado**: deja de poder ejecutar acciones protegidas en menos de 5 minutos (SC-007), sin
   tener que cerrar sesión.
3. **Esperado**: no puede volver a entrar (FR-016).
4. Reactívala. **Esperado**: recupera el acceso **con los roles que tenía** (FR-018).

### V5 — Las invariantes de seguridad (FR-014, FR-019)

Estos dos son los que producen daño irreversible. Pruébalos explícitamente:

1. Siendo el único administrador, intenta **retirarte** el rol `admin`.
   **Esperado**: rechazado con `LastAdministratorError` (FR-014).
2. Intenta **desactivarte a ti mismo**. **Esperado**: rechazado (FR-019).
3. Da de alta a un segundo administrador y repite (1). **Esperado**: ahora sí se permite, porque
   queda otro administrador activo.

### V6 — Autorización real, no cosmética (FR-020, FR-021)

1. Con la persona `editor`, abre `/panel/personas`. **Esperado**: acceso denegado.
2. **Invoca la server action de alta directamente**, sin pasar por la interfaz, con esa cuenta.
   **Esperado**: denegada. Este paso es el que verifica FR-021; ocultar el enlace no es
   protección.

### V7 — Consistencia ante fallo parcial (FR-007, SC-006)

El escenario más importante y el que no se prueba solo.

1. Provoca un fallo del proveedor: pon temporalmente una `CLERK_SECRET_KEY` inválida.
2. Intenta dar de alta a alguien. **Esperado**: la operación falla con un mensaje comprensible.
3. Consulta la base:

```bash
pnpm tsx scripts/check-orphans.ts
```

**Esperado**: **cero** personas creadas por ese intento, y **cero identidades huérfanas** en
Clerk. Si el proveedor falla antes de devolver el identificador, no se escribe nada local; si
falla la escritura local, la identidad recién creada se borra por compensación (research §R3).

4. Restaura la clave y repite el alta. **Esperado**: funciona con normalidad.

### V8 — Registro de actividad (FR-022)

Tras los escenarios anteriores, consulta `AdminAction`.
**Esperado**: una entrada por cada alta, cambio de rol y desactivación, con quién, sobre quién y
cuándo.

---

## Verificación de arquitectura

```bash
pnpm verify
pnpm build
```

### La prueba del Principio III

```bash
pnpm tsx scripts/smoke-people.ts
```

Debe dar de alta, cambiar roles y desactivar **desde Node plano**, con un `IdentityProvider`
falso y sin React ni Next. Si necesita levantar el servidor, el módulo dejó de cumplir SDK-First.

### Las pruebas de la 001 no deben cambiar

```bash
pnpm test tests/unit/access/sync-signed-in-user.test.ts
```

`syncSignedInUser` se modifica en este feature. **Sus cinco pruebas existentes deben pasar sin
tocarlas.** Si alguna requiere edición, el cambio dejó de ser aditivo y hay que revisar el
diseño antes de seguir.
