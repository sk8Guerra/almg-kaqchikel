# Phase 1 — Data Model: Barra lateral y unificación visual del panel

**Feature**: `004-antd-ui-migration` | **Date**: 2026-08-23

Esta feature **no persiste nada nuevo**. No hay migración de Prisma, no cambia
`prisma/schema.prisma`, no se añaden columnas ni tablas. Lo que sigue son los tipos que cruzan la
frontera entre el módulo `access` y la capa de adaptadores.

---

## `AccessibleModule` — una entrada de navegación

**Dónde vive**: `src/modules/access/application/use-cases/list-accessible-modules.ts`, exportado
como tipo desde `src/modules/access/index.ts`.

| Campo   | Tipo        | Origen                                    | Notas                                        |
| ------- | ----------- | ----------------------------------------- | -------------------------------------------- |
| `key`   | `ModuleKey` | clave de `MODULES` en `domain/modules.ts` | `"access"` es la única hoy                   |
| `label` | `string`    | `MODULES[key].label`                      | texto de pantalla, en español (`"Personas"`) |

```ts
export type AccessibleModule = {
  readonly key: ModuleKey;
  readonly label: string;
};
```

**Reglas de derivación**:

1. Se parte de `Object.keys(MODULES)`.
2. Se conserva una clave sólo si quien mira tiene `` `${key}:read` `` concedido. La evaluación usa
   `grants()` del dominio, la misma función que respalda `authorize()` y `can()` — no una copia.
3. Un `admin` recibe todas las claves, incluidas las que se agreguen después. Eso es la regla de
   `grants()`, no un caso especial de este código.
4. Sin identidad, con persona no aprovisionada o con persona inactiva, el resultado es `[]`. No
   lanza: la barra lateral vacía es un estado legítimo de pantalla (FR-005), no un error.
5. El orden es el de declaración en `MODULES`. Estable entre renders, y por tanto entre servidor
   e hidratación.

**Por qué no lleva `href`**: una URL es mecanismo de entrega. Ponerla aquí obligaría a `MODULES`
—que vive en `domain/`— a conocer el enrutador de Next.js, contra el Principio II. Ver D4 en
[research.md](./research.md).

---

## `NAV_ROUTES` — el mapa de rutas del adaptador

**Dónde vive**: `src/app/panel/nav-routes.ts` (capa de adaptadores).

```ts
export const NAV_ROUTES: Record<ModuleKey, string> = {
  access: "/panel/personas",
};
```

**La propiedad que importa**: `Record<ModuleKey, string>` es **exhaustivo**. Añadir una clave a
`MODULES` sin darle ruta rompe `tsc --noEmit` con un error que nombra la clave que falta. Ese error
de compilación es lo que hace cierto SC-008 sin depender de que alguien se acuerde: no existe forma
de agregar un área y que quede invisible en la navegación.

**Lo que NO es**: un catálogo paralelo de áreas. No decide qué se muestra —eso lo decide
`listAccessibleModules`— sólo dónde apunta cada cosa que se muestra.

---

## `PanelNavItem` — lo que recibe el componente

**Dónde vive**: `src/components/app-shell/panel-shell.tsx`.

| Campo   | Tipo     | Notas                                                  |
| ------- | -------- | ------------------------------------------------------ |
| `key`   | `string` | la `ModuleKey`, usada como clave de selección del menú |
| `label` | `string` | texto visible                                          |
| `href`  | `string` | resuelto por el layout a partir de `NAV_ROUTES`        |

El layout hace la unión (`AccessibleModule` + `NAV_ROUTES` → `PanelNavItem[]`) y la pasa como prop.
El componente cliente recibe datos listos: no consulta permisos, no conoce `MODULES` y no importa
nada del módulo `access`.

---

## Estado derivado (no persistido)

| Estado                 | Cómo se obtiene                                                              | Dónde                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Área activa            | `useSelectedLayoutSegment()`                                                 | `PanelShell`, cliente. Disponible en SSR, así que el HTML inicial ya llega resaltado (D5) |
| Barra colapsada        | estado local de React                                                        | `PanelShell`. Arranca colapsada en anchos de teléfono (FR-006)                            |
| Identidad de la sesión | `access.syncSignedInUser()` en el layout, más `<SessionControls />` de Clerk | el nombre a mostrar baja como prop; el menú de sesión lo pinta Clerk                      |

Ninguno de estos tres se persiste. El colapso no se recuerda entre recargas: la spec no lo pide y
guardarlo introduce una discusión sobre dónde (cookie, almacenamiento local) que no toca aquí.

---

## Lo que explícitamente no cambia

- `prisma/schema.prisma` — sin tocar.
- `MODULES`, `ACTIONS`, `ALL_PERMISSION_KEYS` en `domain/modules.ts` — sin tocar. La feature los
  **lee**; el área de prueba temporal de SC-008 se añade y se borra dentro de la Fase E.
- `User`, `PersonSummary`, `PermissionKey` — sin tocar.
- Los diez casos de uso existentes — sin tocar. `listAccessibleModules` es el undécimo y no
  modifica a ninguno.
