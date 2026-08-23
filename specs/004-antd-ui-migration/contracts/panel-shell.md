# Contract — Componentes del contenedor del panel

**Superficie**: capa de adaptadores (`src/app/`, `src/components/`)

**Feature**: `004-antd-ui-migration`

Todos los tipos de props siguen la convención constitucional `<ComponentName>Props`, declarados
como tipo con nombre, nunca inline.

---

## `AntdConfig` — `src/components/app-shell/antd-config.tsx`

```tsx
"use client";

type AntdConfigProps = {
  children: React.ReactNode;
};
```

**Responsabilidad**: montar el único `<ConfigProvider>` de la aplicación, con `locale` español
(`antd/locale/es_ES`) y el objeto de tokens del tema.

**Se monta en**: `src/app/layout.tsx`, dentro de `<AntdRegistry>`. Una sola vez, en la raíz —
para que migrar `/` y `/ingresar` más adelante no obligue a moverlo (FR-015, FR-016).

**Prohibido**: que otro `<ConfigProvider>` aparezca en cualquier otra parte del árbol. Si un
componente necesita un token distinto, el token se ajusta aquí o se resuelve con `className`.

---

## `PanelShell` — `src/components/app-shell/panel-shell.tsx`

```tsx
"use client";

type PanelNavItem = {
  key: string;
  label: string;
  href: string;
};

type PanelShellProps = {
  navItems: PanelNavItem[];
  userLabel: string;
  sessionControls: React.ReactNode;
  children: React.ReactNode;
};
```

**Responsabilidad**: `Layout` + `Sider` colapsable + `Menu` de navegación + área de contenido.

**Contrato de comportamiento**:

| Requisito                             | Cómo se cumple                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| FR-002 — sólo áreas permitidas        | recibe `navItems` ya filtrado; **no** consulta permisos                          |
| FR-003 — área actual resaltada        | `useSelectedLayoutSegment()`; el segmento `null` corresponde al inicio del panel |
| FR-004 — identidad y cierre de sesión | renderiza `userLabel` y `sessionControls` en la barra                            |
| FR-005 — sin permisos                 | con `navItems` vacío no dibuja menú; el aviso lo pinta la página                 |
| FR-006 — colapsable y responsivo      | estado local de colapso; arranca colapsada en anchos de teléfono                 |

**Restricciones**:

- **No importa nada de `src/modules/`.** Recibe datos planos. `boundaries` permitiría importar el
  SDK desde un adaptador, pero hacerlo aquí devolvería lógica a un componente cliente.
- **No hace `fetch` ni llama a acciones de servidor.**
- El resaltado debe estar presente en el HTML del servidor. `useSelectedLayoutSegment` lo permite;
  calcularlo dentro de un `useEffect` lo rompería (caso límite de parpadeo en la spec).
- Sin `style={{ }}`. La composición va en `panel-shell.module.scss`; los valores que sólo se
  conocen en tiempo de ejecución, si aparecen, se pasan como variable CSS personalizada.

**Por qué es cliente**: `Menu` y el colapso del `Sider` son interactivos. `children` sigue siendo
un Server Component: entra como prop y se renderiza en servidor.

---

## `PanelLayout` — `src/app/panel/layout.tsx`

```tsx
type PanelLayoutProps = {
  children: React.ReactNode;
};
```

**Server Component.** Adaptador delgado (Principio IV). Su trabajo completo:

1. `await access.syncSignedInUser()` — igual que hoy hace `panel/page.tsx`.
2. `await access.listAccessibleModules()` — **una** llamada al SDK.
3. Unir el resultado con `NAV_ROUTES` → `PanelNavItem[]`.
4. Renderizar `<PanelShell>` con esas props y `<SessionControls />` como `sessionControls`.

**Prohibido**: reglas condicionales de negocio, acceso a datos, orquestación en varios pasos. Si
aparece una rama que no sea "traducir entrada → salida", esa rama pertenece a un caso de uso.

---

## `NAV_ROUTES` — `src/app/panel/nav-routes.ts`

```ts
export const NAV_ROUTES: Record<ModuleKey, string>;
```

Exhaustivo por construcción: falta una clave → falla `tsc --noEmit`. Ver
[data-model.md](../data-model.md).

---

## Contrato de avisos de operación (FR-013)

Las cinco operaciones del panel —alta, cambio de rol, cambio de permisos, desactivar, reactivar—
comunican su resultado por **un solo camino**. Hoy son cuatro `useState<string | null>` y cuatro
`<p role="status">` distintos.

**Después**: el mensaje que devuelve la acción de servidor se muestra con el mecanismo de aviso de
la librería, montado una vez en el contenedor y anunciado a tecnologías de asistencia. Ninguna
pantalla inventa el suyo.

**Invariante**: la forma de las acciones de servidor en `actions.ts` **no cambia**. Siguen
devolviendo `{ message }`; lo que cambia es cómo se pinta. Esta feature no toca la capa de
acciones ni los casos de uso que llaman.
