# Quickstart — Validación del feature

**Feature**: `003-two-role-authorization` · **Fecha**: 2026-08-19

---

## Prerrequisitos

```bash
pnpm db:migrate
pnpm db:seed -- --admin=<tu_identityId>
pnpm dev
```

Necesitas además una segunda cuenta para probar el rol de miembro.

---

## Escenarios

### V1 — Alta de administrador sin decisiones de permisos (US1, FR-005…FR-007)

1. En `/panel/personas`, da de alta un correo y elige **Administración**.
2. **Esperado**: la matriz de permisos desaparece o queda deshabilitada (FR-015).
3. **Esperado**: esa persona puede ejecutar las cuatro operaciones sobre personas.
4. Consulta `user_permissions` para esa persona. **Esperado**: **cero filas** (FR-006).

### V2 — La prueba de las áreas futuras (SC-002) ⭐

El escenario que justifica el feature entero.

1. Añade un área ficticia al catálogo de código:
   `forms: { label: "Formularios", actions: ["read","create","update","delete"] }`
2. Reinicia y comprueba que un administrador ya existente puede `forms:create`
   **sin que nadie haya tocado sus datos**.
3. Consulta su fila. **Esperado**: sigue sin filas en `user_permissions`.
4. Quita el área del catálogo.

Si esto exigiera conceder algo a alguien, el diseño falló.

### V3 — Alta de miembro con permisos explícitos (US2, FR-008…FR-010)

1. Da de alta un correo eligiendo **Miembro** e intenta confirmar sin marcar nada.
   **Esperado**: rechazado, con explicación (FR-010).
2. Marca solo `Personas → leer` y confirma.
3. Entra con esa cuenta. **Esperado**: ve el listado de personas.
4. **Esperado**: no ve controles de alta, rol ni permisos.
5. Intenta cualquier otra operación. **Esperado**: rechazada.

### V4 — La prueba de escalada de privilegios (FR-018, FR-019, SC-004) ⭐

La segunda prueba crítica.

1. Concede a ese miembro **todos** los permisos del catálogo, incluidos
   `access:create`, `access:update` y `access:delete`.
2. Con esa cuenta, **invoca directamente** las server actions de cambio de rol y de permisos, sin
   pasar por la interfaz.
3. **Esperado**: ambas rechazadas con `AdminRequiredError`.

Un miembro con todos los permisos posibles sigue sin poder alterar la autoridad de nadie. Si esto
pasara, el modelo de dos roles no existe.

### V5 — Ajuste de permisos (US3, FR-011…FR-013)

1. Retírale un permiso. **Esperado**: lo pierde, conserva los demás.
2. Retíraselos todos. **Esperado**: conserva la cuenta y puede entrar, pero no ve nada, y el
   sistema **le explica por qué** (FR-024).

### V6 — Cambio de rol (US4, FR-014…FR-017)

1. Promueve al miembro a administrador. **Esperado**: gana todo sin seleccionar nada, y sus
   permisos anteriores dejan de consultarse.
2. Degrádalo a miembro. **Esperado**: el sistema **exige** indicar permisos, como en un alta.
3. **Esperado**: no recupera automáticamente los permisos que tenía antes.

### V7 — Las invariantes de bloqueo (FR-020, FR-021, SC-005) ⭐

1. Siendo el único administrador activo, intenta **degradarte**.
   **Esperado**: rechazado (`LastAdministratorError`).
2. Intenta **desactivarte**. **Esperado**: rechazado.
3. Con dos administradores, degrada al otro. **Esperado**: permitido.
4. Con dos administradores, intenta degradarte a ti mismo. **Esperado**: rechazado
   (`SelfDemotionError`), aunque quede otro administrador.

El paso 4 distingue las dos guardas: no es la misma regla vista dos veces.

### V8 — Efecto inmediato (FR-023)

1. Con el miembro con sesión abierta en otro navegador, retírale un permiso.
2. **Esperado**: pierde la capacidad sin cerrar sesión, en menos de 5 minutos.

### V9 — Permisos huérfanos (research §R0)

1. Concede a un miembro un permiso de un área ficticia, retira el área del catálogo.
2. `pnpm tsx scripts/check-orphans.ts`
3. **Esperado**: lo reporta como huérfano, y esa persona no gana ninguna capacidad por tenerlo.

---

## Verificación de arquitectura

```bash
pnpm verify && pnpm build
pnpm tsx scripts/smoke-people.ts    # el SDK desde Node plano
```

### Dónde debe aparecer el rol en el código

```bash
grep -rn '=== "admin"\|role === ' src/modules/access --include='*.ts'
```

**Esperado**: solo en `domain/authorization.ts` (la función `grants`) y en las guardas declaradas
en la sección 6 del contrato. Cualquier otra aparición dispersa la política de autorización y
debe eliminarse.

### Las pruebas de 001 y 002 SÍ cambian

A diferencia de la feature 002, este cambio **no es aditivo**: elimina el modelo de roles que
aquellas pruebas verificaban. Que necesiten actualizarse es correcto; pretender lo contrario
ocultaría la ruptura. Lo que sí debe seguir intacto es su _intención_: negar por omisión, denegar
a inactivos, no dejar el sistema sin administradores.
