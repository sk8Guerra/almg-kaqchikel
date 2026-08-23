# Implementation Plan: Barra lateral y unificación visual del panel

**Branch**: `004-antd-ui-migration` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-antd-ui-migration/spec.md`

## Summary

Adoptar Ant Design v6 como librería de interfaz del proyecto y migrar con ella las tres pantallas
bajo `/panel`, empezando por sustituir la navegación por enlaces sueltos con una barra lateral
permanente.

El enfoque técnico se apoya en tres piezas y una enmienda:

1. Un **layout anidado** en `src/app/panel/layout.tsx` que aloja el contenedor común. Al no
   remontarse entre pantallas, hace estructuralmente imposible que una página vuelva a dibujar su
   propia cabecera de navegación.
2. Un **caso de uso nuevo**, `listAccessibleModules`, que devuelve las áreas visibles para quien
   mira. La decisión de permisos se queda en el módulo `access`, no en un componente; las URLs se
   quedan en el adaptador, no en el dominio.
3. Un **`ConfigProvider` único** en el layout raíz, envuelto por `<AntdRegistry>` para que el CSS
   salga ya del servidor y no haya destello al hidratar.
4. Una **enmienda constitucional a v1.4.0** que acota la excepción a la regla de estilos, y dos
   cambios en `eslint.config.mjs` que la hacen exigible en vez de declarativa.

No cambian el modelo de datos, las reglas de autorización ni ningún caso de uso existente.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), React 19.2.8, Node vía Next 16.3.1

**Primary Dependencies**: `antd` ^6.6.1 (nuevo), `@ant-design/icons` ^6.3.2 (nuevo, explícito),
`@ant-design/nextjs-registry` ^1.3.0 (nuevo), `next` 16.3.1, `@clerk/nextjs` 7.x, `sass` (se
mantiene)

**Storage**: PostgreSQL vía Prisma 7 — **sin cambios**. Esta feature no toca persistencia.

**Testing**: Vitest 4 (`environment: "node"`, sólo `tests/**/*.test.ts`). El caso de uso nuevo se
cubre con los dobles en memoria de `tests/unit/access/doubles.ts`. La UI se verifica a mano con
`quickstart.md` — ver D9 en [research.md](./research.md).

**Target Platform**: navegadores modernos, desde 360 px de ancho; render en servidor con App Router

**Project Type**: aplicación web (Next.js App Router) con módulos de negocio framework-agnósticos

**Performance Goals**: sin regresión perceptible en la primera carga del panel; el CSS de la
librería debe llegar en el HTML del servidor (sin repintado al hidratar)

**Constraints**: navegación disponible y utilizable desde 360 px; recorrido completo con teclado;
todo control interactivo con nombre accesible

**Scale/Scope**: 3 pantallas bajo `/panel`, 1 área en el catálogo actual, 2 roles. Fuera de
alcance: `/`, `/ingresar`, `src/app/error.tsx`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Screaming Architecture**: no se crea módulo nuevo; se extiende `access` con un caso de
      uso. La barra lateral vive en `src/components/`, que es capa de adaptadores en el layout
      mandado, no una carpeta técnica nueva.
- [x] **II. Dependency Rule**: `antd` sólo entra en `src/app/` y `src/components/`. Se añade a
      `FRAMEWORK_PACKAGES` para que `boundaries/external` la prohíba en `domain`, `application` y
      `sdk` (D7a). Las rutas de navegación viven en el adaptador; el dominio no aprende URLs (D4).
- [x] **III. SDK-First**: `listAccessibleModules` se exporta desde
      `src/modules/access/index.ts`, recibe y devuelve datos planos y es invocable desde un script
      Node sin contexto de petición.
- [x] **IV. Thin Adapters**: `layout.tsx` traduce entrada → llama **un** caso de uso → pasa props.
      La barra lateral no consulta permisos ni datos; los recibe.
- [x] **V. Dependency Injection**: `listAccessibleModules({ identity, users })` recibe puertos y
      se instancia sólo en `src/composition/container.ts`.
- [x] **VI. Ports**: no se introduce ningún recurso externo nuevo. antd es una librería de
      presentación en el borde, no un recurso tras un puerto.
- [x] **Testing**: `listAccessibleModules` es unit-testeable con `StubIdentityProvider` e
      `InMemoryUserRepository`, sin infraestructura viva.
- [ ] **Convenciones**: props como `<ComponentName>Props` ✅, sin comentarios ✅, identificadores
      en inglés ✅. **Estilos en `.module.scss` sin `style={{ }}`: en conflicto** — antd inyecta
      CSS-in-JS. Ver Complexity Tracking.
- [x] **Tooling**: no se añade tipo de directorio nuevo (`src/components/app-shell/` cae bajo el
      descriptor `src/components` ya existente, igual que `src/components/auth/` hoy). Sí se
      amplían las listas de paquetes de `boundaries/external` (D7a) y se añade
      `react/forbid-component-props` (D7b).

**Re-check post-Phase 1**: sin cambios. El diseño de la Fase 1 no introdujo ningún módulo, puerto
ni directorio adicional; la única casilla abierta sigue siendo la de estilos, resuelta por
enmienda y registrada abajo.

## Project Structure

### Documentation (this feature)

```text
specs/004-antd-ui-migration/
├── plan.md              # Este archivo
├── research.md          # Fase 0 — D1..D11 y riesgos
├── data-model.md        # Fase 1 — AccessibleModule y el mapa de rutas
├── quickstart.md        # Fase 1 — guion de validación manual y automática
├── contracts/
│   ├── list-accessible-modules.md   # Contrato del caso de uso (SDK)
│   └── panel-shell.md               # Contrato de los componentes del contenedor
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 — lo crea /speckit-tasks, NO este comando
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                       # MOD: + AntdRegistry + AntdConfig
│   └── panel/
│       ├── layout.tsx                   # NUEVO: shell del panel (Server Component)
│       ├── nav-routes.ts                # NUEVO: Record<ModuleKey, string> exhaustivo
│       ├── page.tsx                     # MOD: pierde cabecera y nav; migra a antd
│       ├── panel-actions.tsx            # MOD: migra a antd
│       ├── panel.module.scss            # MOD: se reduce a composición, o se borra
│       └── personas/
│           ├── page.tsx                 # MOD: pierde "Volver"; tabla y buscador antd
│           ├── people-table.tsx         # MOD: <Table> con columnas tipadas
│           ├── create-person-form.tsx   # MOD: <Form> + <Radio.Group> + feedback unificado
│           ├── permission-matrix.tsx    # MOD: <Table> de checkboxes, etiquetas intactas
│           ├── personas.module.scss     # MOD: se reduce a composición, o se borra
│           └── [id]/
│               ├── page.tsx             # MOD: pierde "Volver"; <Descriptions>
│               └── person-controls.tsx  # MOD: formularios antd
├── components/
│   ├── app-shell/
│   │   ├── antd-config.tsx              # NUEVO: "use client" — ConfigProvider (tema + es_ES)
│   │   ├── panel-shell.tsx              # NUEVO: "use client" — Layout + Sider + Menu
│   │   └── panel-shell.module.scss      # NUEVO: composición del contenedor
│   └── auth/session-controls.tsx        # MOD: se aloja en la barra lateral
├── modules/access/
│   ├── application/use-cases/
│   │   └── list-accessible-modules.ts   # NUEVO
│   └── index.ts                         # MOD: + export listAccessibleModules
└── composition/container.ts             # MOD: + wiring del caso de uso

tests/unit/access/
└── list-accessible-modules.test.ts      # NUEVO

eslint.config.mjs                        # MOD: D7a (FRAMEWORK_PACKAGES) + D7b (forbid-component-props)
package.json                             # MOD: 3 dependencias nuevas
.specify/memory/constitution.md          # MOD: enmienda a v1.4.0 (D8)
```

**Structure Decision**: la feature **extiende el módulo `access`** con un único caso de uso,
`listAccessibleModules`, exportado desde `src/modules/access/index.ts` y cableado en
`src/composition/container.ts` con los puertos `IdentityProvider` y `UserRepository` que ya
existen. **No se introduce ningún puerto nuevo, ningún módulo nuevo y ningún directorio de nivel
superior.** Todo lo demás es capa de adaptadores: un layout anidado, un mapa de rutas y tres
componentes de presentación bajo `src/components/app-shell/`.

## Implementation Phases

Las fases están ordenadas para que cada una deje el repositorio en verde y demostrable. Los
detalles por tarea los produce `/speckit-tasks`.

### Fase A — Fundación (habilita todo lo demás)

Instalar `antd`, `@ant-design/icons` y `@ant-design/nextjs-registry`. Montar `<AntdRegistry>` y
`<AntdConfig>` en el layout raíz. Aplicar los dos cambios de `eslint.config.mjs` (D7) y **verificar
que disparan** con violaciones deliberadas. Enmendar la constitución a v1.4.0 (D8) en el mismo
cambio.

**Verde cuando**: `pnpm verify` pasa, `/panel` sigue funcionando como antes y un
`<Button style={{}}>` de prueba hace fallar `pnpm lint`.

### Fase B — US1: la barra lateral (P1)

`listAccessibleModules` + su test unitario. `src/app/panel/nav-routes.ts`.
`src/app/panel/layout.tsx`. `PanelShell` con `Layout.Sider` + `Menu` + colapso. Mover
`SessionControls` a la barra. Quitar cabeceras y enlaces "Volver" de las tres páginas.

**Verde cuando**: se navega entre áreas en una sola interacción, con los dos roles y con una cuenta
sin permisos (SC-001, SC-004).

### Fase C — US2: listado de personas (P2)

`PeopleTable` a `<Table>` con columnas tipadas, estado vacío y celdas legibles de estado, rol y
permisos. Buscador con `<Input.Search>` dentro de un `<form>` que sigue enviándose al servidor
(FR-010: sin JavaScript en el cliente).

**Verde cuando**: listado, filtro, vacío y enlace-a-detalle-según-rol se comportan como pide US2.

### Fase D — US3: formularios (P3)

Alta de persona, matriz de permisos, cambio de rol y desactivar/reactivar sobre componentes de
formulario de antd, con un único mecanismo de aviso para el resultado de toda operación (FR-013).

**Verde cuando**: las cinco operaciones confirman su resultado por el mismo camino y la matriz
sigue recorriéndose con teclado con sus etiquetas de área y acción (FR-012, SC-006).

### Fase E — Cierre

Podar `panel.module.scss` y `personas.module.scss` (D11). Comprobar el área de prueba temporal para
SC-008 y **borrarla**. Recorrido manual completo de `quickstart.md`.

## Complexity Tracking

| Violation                                                                                                                                                    | Why Needed                                                                                                                                                                                              | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constitución §_Styles live in SCSS modules_: antd inyecta sus estilos con CSS-in-JS y su tema se declara como objeto JS, no como `.module.scss` colocalizado | Es la consecuencia inevitable de adoptar la librería que se pidió: ninguna librería de componentes madura de React distribuye su presentación como módulos SCSS del consumidor. Sin ella no hay feature | **Escribir la barra lateral y los componentes a mano en SCSS** — rechazada: reimplementa tabla, formulario, menú y colapso responsivo, que es semanas de trabajo y el motivo por el que se adopta una librería. **Elegir una librería sin estilos propios (headless)** — rechazada: la persona solicitante nombró Ant Design y confirmó la elección. **Derogar la regla** — rechazada por la propia solicitante: se optó por excepción acotada, no por enmienda amplia |

**Cómo se acota la excepción** (D7b + D8): la exención cubre el CSS-in-JS interno de la librería y
los tokens del `ConfigProvider`. El código propio sigue sin poder escribir `style={{ ... }}`, y
esa prohibición se **amplía** de paso: hoy `react/forbid-dom-props` sólo cubre elementos DOM, así
que se añade `react/forbid-component-props` para que tampoco pueda escribirse sobre un componente
de antd. La adopción termina con la regla cubriendo más superficie que antes, no menos.
