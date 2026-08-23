---
description: "Task list for 004-antd-ui-migration"
---

# Tasks: Barra lateral y unificación visual del panel

**Input**: Design documents from `/specs/004-antd-ui-migration/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Se incluye **una** tarea de prueba automatizada (T012), la del caso de uso nuevo. La
interfaz no recibe pruebas automatizadas en esta feature — ver D9 en research.md: `vitest.config.mts`
corre en `node`, sin jsdom ni Testing Library, y montar ese arnés es una feature aparte. Lo que
queda manual está en quickstart.md.

**Organization**: agrupadas por historia de usuario para poder implementar y validar cada una por
separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencias pendientes)
- **[Story]**: US1 / US2 / US3
- Rutas de archivo exactas en cada descripción

## Path Conventions

- **Casos de uso**: `src/modules/access/application/use-cases/`
- **SDK público**: `src/modules/access/index.ts`
- **Cableado DI**: `src/composition/container.ts`
- **Adaptadores**: `src/app/`, `src/components/`
- **Pruebas**: `tests/unit/access/`

Ningún archivo bajo `src/app/` o `src/components/` puede contener acceso a datos ni reglas de
negocio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: meter la librería en el proyecto y confirmar que compila antes de construir sobre ella

- [x] T001 Instalar dependencias con `pnpm add antd@^6.6.1 @ant-design/icons@^6.3.2 @ant-design/nextjs-registry@^1.3.0` y confirmar en `package.json` que quedan en `dependencies` (no en `devDependencies`); `@ant-design/icons` se declara explícito aunque llegue como transitivo de antd (research.md D1)
- [x] T002 Ejecutar `pnpm build` para verificar que Next 16 resuelve los módulos de antd v6. **Solo si falla**: crear `next.config.ts` con `transpilePackages: ["antd", "@ant-design/icons"]` y anotar el error concreto en research.md §D10. Si pasa, no crear el archivo (research.md D10)

**Checkpoint**: el proyecto compila con antd instalado y sin usar todavía.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tema, extracción de estilos en SSR y las guardas de lint. Sin esto, cualquier pantalla
migrada saldría sin estilos del servidor y sin red de seguridad arquitectónica.

**⚠️ CRITICAL**: ninguna historia de usuario puede empezar hasta cerrar esta fase.

- [x] T003 Crear `src/components/app-shell/antd-config.tsx` como Client Component (`"use client"`) que monta un único `<ConfigProvider locale={esES} theme={...}>` importando `esES` de `antd/locale/es_ES`, envolviendo `children` en `<App>` de antd para habilitar el contexto de avisos (`message`/`notification`) que FR-013 necesita. Tipo de props `AntdConfigProps`. Ver [contracts/panel-shell.md](./contracts/panel-shell.md)
- [x] T004 Modificar `src/app/layout.tsx` para envolver el contenido del `<body>` en `<AntdRegistry>` de `@ant-design/nextjs-registry` y, dentro, en `<AntdConfig>`, manteniendo `<ClerkProvider localization={esES}>` por fuera (research.md D2, D6). Depende de T003
- [x] T005 Modificar `eslint.config.mjs` añadiendo `"antd"`, `"antd/*"` y `"@ant-design/*"` al array `FRAMEWORK_PACKAGES`, para que `boundaries/external` prohíba la librería de UI en `domain`, `application` y `sdk` (research.md D7a)
- [x] T006 Modificar `eslint.config.mjs` añadiendo `react/forbid-component-props` al bloque `files: ["src/**/*.tsx"]`, configurado con `forbid: [{ propName: "style", message: ... }]` **únicamente** — `className` debe seguir permitido porque es como se aplican los módulos SCSS (research.md D7b). Mismo archivo que T005: secuencial, no paralelo
- [x] T007 Verificar que T005 dispara: añadir `import { Table } from "antd";` en `src/modules/access/application/use-cases/can.ts`, ejecutar `pnpm lint`, confirmar que falla citando el Principio III, y **revertir la violación**. Ver [quickstart.md](./quickstart.md) §2a
- [x] T008 Verificar que T006 dispara: añadir un `<Button style={{ margin: 8 }}>` en `src/app/panel/page.tsx`, ejecutar `pnpm lint`, confirmar que falla citando la constitución, y **revertir la violación**. Ver [quickstart.md](./quickstart.md) §2b
- [x] T009 Enmendar `.specify/memory/constitution.md` a **v1.4.0**: excepción acotada en §_Styles live in SCSS modules_, tres entradas nuevas en _Decisions of record_ (elección de antd v6, registro SSR, por qué las rutas no viven en `MODULES`), reformular el ítem 10 del checklist de revisión para nombrar `forbid-dom-props` y `forbid-component-props`, y actualizar el bloque SYNC IMPACT REPORT de la cabecera (research.md D8)
- [x] T010 Ejecutar `pnpm verify` y confirmar las cuatro puertas en verde antes de tocar ninguna pantalla

**Checkpoint**: el tema aplica, el CSS sale del servidor, las dos guardas están verificadas contra
violaciones reales y la constitución ya cubre la excepción. El panel sigue funcionando como antes.

---

## Phase 3: User Story 1 - Navegar el panel desde una barra lateral permanente (Priority: P1) 🎯 MVP

**Goal**: sustituir los enlaces sueltos y los "Volver" por una barra lateral fija que lista sólo
las áreas permitidas, resalta la actual y aloja la sesión.

**Independent Test**: entrar al panel con las tres cuentas de prueba (administración, miembro con
`access:read`, activa sin permisos) y navegar entre áreas usando sólo la barra. Entrega valor
aunque ninguna pantalla interior esté migrada todavía.

### Tests for User Story 1

- [x] T011 [P] [US1] Escribir `tests/unit/access/list-accessible-modules.test.ts` usando `StubIdentityProvider` e `InMemoryUserRepository` de `tests/unit/access/doubles.ts`, con un caso por fila de la tabla de comportamiento de [contracts/list-accessible-modules.md](./contracts/list-accessible-modules.md) (admin, miembro con permiso, miembro sin permisos, persona inactiva, sin identidad, no aprovisionada), más orden estable. La expectativa del caso `admin` se deriva de `Object.keys(MODULES)`, nunca de un literal `["access"]`. Debe **fallar** antes de T012

### Implementation for User Story 1

- [x] T012 [US1] Implementar `listAccessibleModules` en `src/modules/access/application/use-cases/list-accessible-modules.ts`: recibe `{ identity, users }` tipados por puerto, deriva de `MODULES`, filtra con `grants()` de `src/modules/access/domain/authorization.ts` (sin reimplementar la lógica de permisos), devuelve `AccessibleModule[]` y **no lanza** — devuelve `[]` en los casos sin acceso. Depende de T011
- [x] T013 [US1] Exportar `listAccessibleModules` y el tipo `AccessibleModule` desde `src/modules/access/index.ts`. Depende de T012
- [x] T014 [US1] Cablear `listAccessibleModules: listAccessibleModules({ identity, users })` en el objeto `access` de `src/composition/container.ts`. Depende de T013
- [x] T015 [P] [US1] Crear `src/app/panel/nav-routes.ts` con `export const NAV_ROUTES: Record<ModuleKey, string> = { access: "/panel/personas" }`. El tipo `Record` exhaustivo es lo que hace fallar `tsc` si se agrega un área sin ruta (data-model.md)
- [x] T016 [P] [US1] Crear `src/components/app-shell/panel-shell.module.scss` con las reglas de composición del contenedor (rejilla, ancho del área de contenido, comportamiento en anchos de teléfono). Sin colores ni tipografía: eso lo fija el tema de T003
- [x] T017 [US1] Crear `src/components/app-shell/panel-shell.tsx` como Client Component: `Layout` + `Sider` colapsable + `Menu`, tipo de props `PanelShellProps` con `navItems`, `userLabel`, `sessionControls` y `children`. El área activa sale de `useSelectedLayoutSegment()` de `next/navigation` para que el HTML del servidor ya llegue resaltado (research.md D5). Colapsa por defecto en anchos de teléfono. **No importa nada de `src/modules/`, no consulta permisos, sin `style={{ }}`**. Ver [contracts/panel-shell.md](./contracts/panel-shell.md). Depende de T016
- [x] T018 [US1] Crear `src/app/panel/layout.tsx` como Server Component con props `PanelLayoutProps`: llama `access.syncSignedInUser()` y `access.listAccessibleModules()`, une el resultado con `NAV_ROUTES` para producir `PanelNavItem[]`, y renderiza `<PanelShell>` pasándole `<SessionControls />` como `sessionControls`. Adaptador delgado: sin ramas de negocio. Depende de T014, T015, T017
- [x] T019 [US1] Modificar `src/app/panel/page.tsx`: eliminar `<header>` con `<h1>Panel</h1>` y `<SessionControls />`, eliminar el `<nav>` con el enlace "Gestionar personas", conservar el saludo de sesión, el aviso de "sin permisos asignados" (FR-005) y `<PanelActions />`. Depende de T018
- [x] T020 [P] [US1] Modificar `src/app/panel/personas/page.tsx`: eliminar el `<Link href="/panel">Volver al panel</Link>` de la cabecera (FR-008). Depende de T018
- [x] T021 [P] [US1] Modificar `src/app/panel/personas/[id]/page.tsx`: eliminar el `<Link href="/panel/personas">Volver a personas</Link>` de la cabecera (FR-008). Depende de T018
- [ ] T022 [US1] Ejecutar `pnpm verify` y recorrer [quickstart.md](./quickstart.md) §4 completo con las tres cuentas de prueba, incluida la recarga con F5 de `/panel/personas/<id>` para confirmar que no hay parpadeo de selección

**Checkpoint**: US1 funcional y demostrable por sí sola. Se navega entre áreas en una interacción,
la barra respeta permisos y no queda ningún enlace "Volver".

---

## Phase 4: User Story 2 - Consultar el listado de personas con tabla y búsqueda consistentes (Priority: P2)

**Goal**: que la pantalla más usada del panel se lea de un vistazo y su buscador se comporte como
cualquier otro campo del sistema.

**Independent Test**: abrir `/panel/personas` con varias personas en estados distintos y verificar
listado, filtro, estado vacío y enlace-a-detalle-según-rol. No depende de que los formularios estén
migrados.

### Implementation for User Story 2

- [x] T023 [US2] Migrar `src/app/panel/personas/people-table.tsx` a `<Table>` de antd con columnas tipadas (correo, nombre, estado, rol, permisos), estado vacío propio en vez de la rama `people.length === 0`, y estados "Activa" / "Sin ingresar todavía" / "Desactivada" distinguibles **sin depender sólo del color** (SC-003). Conservar el comportamiento actual de `linkToDetail`. Props siguen llamándose `PeopleTableProps`
- [x] T024 [US2] Migrar el buscador en `src/app/panel/personas/page.tsx` a los componentes de entrada de antd **dentro de un `<form>` nativo que sigue enviándose al servidor**, conservando `name="q"` y `defaultValue`. No introducir filtrado en cliente: FR-010 exige que funcione con JavaScript desactivado
- [ ] T025 [US2] Ejecutar `pnpm verify` y recorrer [quickstart.md](./quickstart.md) §6, incluida la prueba con JavaScript desactivado en el navegador

**Checkpoint**: US1 y US2 funcionan de forma independiente.

---

## Phase 5: User Story 3 - Dar de alta y editar personas con formularios uniformes (Priority: P3)

**Goal**: que las cinco operaciones de administración compartan controles, botones y **un solo**
mecanismo de aviso de resultado.

**Independent Test**: dar de alta una persona, cambiarle el rol, marcar permisos en la matriz y
desactivarla, comprobando que cada operación confirma su resultado por el mismo camino.

**⚠️ Invariante**: `src/app/panel/actions.ts`, `src/app/panel/personas/actions.ts` y
`src/app/panel/personas/[id]/actions.ts` **no se tocan**. Siguen devolviendo `{ message }`; lo que
cambia es cómo se pinta.

### Implementation for User Story 3

- [x] T026 [P] [US3] Migrar `src/app/panel/personas/permission-matrix.tsx` a componentes de antd conservando la generación desde `MODULES` y `ACTIONS` y **cada `aria-label` de área + acción intacto** (FR-012, SC-006). Props siguen llamándose `PermissionMatrixProps`
- [x] T027 [US3] Migrar `src/app/panel/personas/create-person-form.tsx` a `<Form>` de antd: campo de correo, selección de rol, alternancia matriz ↔ explicación de administrador, y sustituir el `useState<string | null>` + `<p role="status">` por el mecanismo de aviso montado en T003 (FR-013). Los errores de correo inválido o ya registrado se muestran asociados al formulario. Depende de T026
- [x] T028 [US3] Migrar `src/app/panel/personas/[id]/person-controls.tsx` a componentes de antd: formulario de rol + permisos y las acciones desactivar/reactivar, con el mismo mecanismo de aviso. Props siguen llamándose `PersonControlsProps`. Depende de T026
- [x] T029 [P] [US3] Migrar `src/app/panel/personas/[id]/page.tsx` para presentar rol y estado con `<Descriptions>` de antd, conservando la rama que oculta los controles a quien no es administración (FR-014)
- [x] T030 [P] [US3] Migrar `src/app/panel/panel-actions.tsx` a botón y aviso de antd, sustituyendo su `<p role="status">` propio por el mecanismo unificado (FR-013, FR-018)
- [ ] T031 [US3] Ejecutar `pnpm verify` y recorrer [quickstart.md](./quickstart.md) §7, verificando explícitamente que ninguna de las cinco operaciones pinta ya su propio `<p role="status">`

**Checkpoint**: las tres historias funcionan y todo el panel comparte una sola gramática visual.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T032 [P] Podar `src/app/panel/panel.module.scss`: dejar sólo reglas de composición o borrar el archivo y su import si antd las cubre por completo (FR-018, research.md D11)
- [x] T033 [P] Podar `src/app/panel/personas/personas.module.scss` con el mismo criterio, revisando los tres archivos que lo importan
- [x] T034 Verificar SC-008: añadir un área de prueba a `MODULES` en `src/modules/access/domain/modules.ts`, confirmar que `pnpm typecheck` **falla** señalando la ruta ausente en `NAV_ROUTES`, añadir la ruta, comprobar que el área aparece en la barra sin tocar ninguna pantalla, y **revertir ambos cambios**. Ver [quickstart.md](./quickstart.md) §8
- [ ] T035 Recorrer [quickstart.md](./quickstart.md) §5: 360 px de ancho, colapso y expansión, recorrido completo con teclado incluida la matriz de permisos, y zoom al 200 % (SC-005, SC-006)
- [x] T036 [P] Actualizar el árbol de estructura de `README.md` para incluir `src/components/app-shell/` y mencionar la librería de interfaz adoptada
- [ ] T037 Recorrido final de [quickstart.md](./quickstart.md) §9 y `pnpm verify` en verde (SC-002, SC-007, FR-018)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup — **bloquea todas las historias**
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de Foundational. Técnicamente independiente de US1, pero se valida
  mejor con la barra ya puesta porque T020 le quita el enlace "Volver"
- **US3 (Phase 5)**: depende de Foundational y del mecanismo de avisos montado en T003
- **Polish (Phase 6)**: depende de las tres historias

### User Story Dependencies

- **US1 (P1)**: ninguna dependencia entre historias. Es el MVP
- **US2 (P2)**: independiente de US3. Comparte con US1 el archivo `personas/page.tsx` (T020 y T024),
  así que si se trabajan en paralelo hay que coordinar ese archivo
- **US3 (P3)**: independiente de US2. Comparte con US1 el archivo `[id]/page.tsx` (T021 y T029)

### Within Each User Story

- La prueba (T011) va antes de la implementación y debe fallar primero
- Caso de uso → export en `index.ts` → cableado en `composition/` → adaptadores. Nunca al revés
- `panel-shell.module.scss` antes que `panel-shell.tsx`
- `layout.tsx` antes de podar las cabeceras de las páginas: si se quitan primero, el panel se queda
  sin navegación entre dos commits

### Parallel Opportunities

- **Phase 2**: T003 y T005 tocan archivos distintos y pueden ir en paralelo. T005 y T006 **no**:
  mismo archivo. T007 y T008 son secuenciales respecto a T005 y T006
- **Phase 3**: T015 y T016 en paralelo entre sí y con T011–T014. T020 y T021 en paralelo entre sí
  una vez cerrado T018
- **Phase 5**: T029 y T030 en paralelo con T027 y T028 (archivos distintos)
- **Phase 6**: T032, T033 y T036 en paralelo

---

## Parallel Example: User Story 1

```bash
# Tras cerrar la Fase 2, arrancan a la vez:
Task: "T011 Prueba unitaria de listAccessibleModules en tests/unit/access/list-accessible-modules.test.ts"
Task: "T015 NAV_ROUTES en src/app/panel/nav-routes.ts"
Task: "T016 Composición del contenedor en src/components/app-shell/panel-shell.module.scss"

# Tras cerrar T018:
Task: "T020 Quitar 'Volver al panel' de src/app/panel/personas/page.tsx"
Task: "T021 Quitar 'Volver a personas' de src/app/panel/personas/[id]/page.tsx"
```

---

## Implementation Strategy

### MVP First (solo US1)

1. Fase 1: Setup (T001–T002)
2. Fase 2: Foundational (T003–T010) — **crítica, bloquea todo**
3. Fase 3: US1 (T011–T022)
4. **PARAR Y VALIDAR**: quickstart §4 con las tres cuentas
5. Demostrable: el panel ya es navegable, aunque las pantallas interiores sigan sin migrar

### Entrega incremental

1. Setup + Foundational → base lista, panel intacto
2. - US1 → barra lateral (**MVP**)
3. - US2 → listado legible
4. - US3 → formularios uniformes
5. - Polish → poda de SCSS y verificación de extensibilidad

Cada corte deja el repositorio en verde y desplegable.

### Commits

Conventional Commits con scope, según la constitución. Sugerencia por fase:

- Fase 1–2: `build(deps): add ant design as the ui library` y
  `docs(constitution): amend to 1.4.0 with scoped styling exception`
- Fase 3: `feat(access): add sidebar navigation to the panel`
- Fase 4: `refactor(app): migrate people list to the ui library`
- Fase 5: `refactor(app): migrate person forms to the ui library`

---

## Notes

- Convenciones obligatorias: props `<ComponentName>Props`, cero comentarios en código,
  identificadores en inglés (español sólo en texto de pantalla), estilos en `.module.scss`
- Las violaciones deliberadas de T007, T008 y T034 **hay que revertirlas**. Un `import { Table }`
  olvidado en un caso de uso deja el repositorio en rojo
- Ninguna tarea toca `prisma/schema.prisma`, los diez casos de uso existentes ni los tres
  `actions.ts`
- El servidor de desarrollo lo levanta Jorge, no el agente

> **Pendiente de verificación manual por Jorge** (requieren navegador y las tres cuentas de prueba): T022, T025, T031, T035, T037. Todo lo demás está implementado y con `pnpm verify` + `pnpm build` en verde.
