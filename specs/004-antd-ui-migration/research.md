# Phase 0 — Research: Barra lateral y unificación visual del panel

**Feature**: `004-antd-ui-migration` | **Date**: 2026-08-23

Cada decisión aquí resuelve un punto que el plan no podía dar por supuesto. Todo lo verificado
contra el registro de npm y contra la documentación de Next.js incluida en
`node_modules/next/dist/docs/`, no contra memoria.

---

## D1 — Versión de Ant Design: v6 (`antd@^6.6.1`)

**Decisión**: `antd` 6.x, la línea `latest` del registro.

**Rationale**: el proyecto corre React 19.2.8 y Next 16.3.1. `antd@6.6.1` declara
`peerDependencies: { react: ">=18.0.0", react-dom: ">=18.0.0" }`, es decir soporta React 19 de
forma nativa. La línea 5.x (`latest-5` = 5.29.3) sólo funciona con React 19 añadiendo el parche
`@ant-design/v5-patch-for-react-19` y llamando a `unstableSetRender`, una dependencia extra cuyo
único propósito es tapar una incompatibilidad ya resuelta aguas arriba.

**Alternatives considered**:

- **antd 5.29.x + parche de React 19** — rechazada: añade un paquete de compatibilidad permanente
  y ata la migración a una línea en mantenimiento desde el primer commit.
- **antd 4.x** — rechazada: no soporta React 18, menos aún 19.

**Consecuencia**: `@ant-design/icons` (^6.3.2) llega como dependencia transitiva de antd. Se
declara **explícitamente** en `package.json`; importar un paquete transitivo es un contrato que
nadie firmó.

---

## D2 — Extracción de estilos en SSR: `@ant-design/nextjs-registry`

**Decisión**: envolver el `<body>` del layout raíz en `<AntdRegistry>` de
`@ant-design/nextjs-registry@^1.3.0`.

**Rationale**: antd v6 sigue generando sus estilos con `@ant-design/cssinjs` (^2.1.2) en tiempo de
render. Sin registro, el HTML del servidor llega sin CSS y el navegador repinta al hidratar —
destello de contenido sin estilo en cada carga. La guía de Next.js incluida en el repo
(`01-app/02-guides/css-in-js.md`) documenta el patrón de tres pasos (registry →
`useServerInsertedHTML` → client component envolvente) y lista `ant-design` explícitamente entre
las librerías soportadas en el App Router. El paquete oficial implementa ese patrón; escribirlo a
mano sería reimplementarlo peor.

Compatibilidad verificada: `@ant-design/nextjs-registry@1.3.0` declara
`peerDependencies: { antd: ">=5.0.0", next: ">=14.0.0", "@ant-design/cssinjs": ">=1.0.0" }`.
Next 16.3.1 y antd 6.6.1 caen dentro.

**Alternatives considered**:

- **Registro propio con `useServerInsertedHTML`** — rechazada: mismo resultado, mantenimiento
  nuestro, y hay que replicar el `extractStyle` de cssinjs a mano.
- **Sin registro, asumiendo el destello** — rechazada: rompe la percepción de calidad en la
  primera pantalla que ve cualquiera, y el coste de evitarlo es una dependencia y una etiqueta.

---

## D3 — Dónde vive el contenedor del panel: `src/app/panel/layout.tsx`

**Decisión**: un layout anidado del App Router en `src/app/panel/layout.tsx`, Server Component,
que envuelve todas las rutas bajo `/panel`.

**Rationale**: es el único punto que se renderiza en las tres pantallas del alcance
(`/panel`, `/panel/personas`, `/panel/personas/[id]`) y que **no se vuelve a montar** al navegar
entre ellas. Eso da FR-001 (contenedor común) de forma estructural: ninguna pantalla puede
dibujar su propia cabecera de navegación porque el contenedor no le pertenece. Como Server
Component puede llamar al SDK directamente, igual que hacen hoy las páginas.

**Alternatives considered**:

- **Repetir el shell en cada `page.tsx`** — rechazada: es exactamente lo que hay hoy (tres
  cabeceras distintas con enlaces "Volver") y lo que la feature viene a eliminar.
- **Shell en el layout raíz** — rechazada: arrastraría la barra lateral a `/` y `/ingresar`, que
  están fuera de alcance y no tienen sesión.

---

## D4 — De dónde salen los elementos de navegación

**Decisión**: un caso de uso nuevo, `listAccessibleModules`, exportado por
`src/modules/access/index.ts`. Devuelve `{ key, label }[]` filtrado por los permisos de quien
mira. Las **rutas** no salen de ahí: viven en un mapa del adaptador,
`NAV_ROUTES: Record<ModuleKey, string>` en `src/app/panel/nav-routes.ts`.

**Rationale**: dos exigencias en tensión.

- FR-002 dice que la barra sólo lista áreas con permiso de lectura. Si el componente decide eso
  llamando a `can()` en bucle, la regla de autorización se muda a la capa de presentación
  (Principio IV). Como caso de uso es una función pura sobre puertos, testeable con los dobles
  en memoria que ya existen en `tests/unit/access/doubles.ts`.
- FR-007 dice que agregar un área basta para que aparezca. La tentación es añadir `path` a
  `MODULES` en `src/modules/access/domain/modules.ts` — pero una URL es mecanismo de entrega, y
  el dominio no puede conocerla (Principio II). El mapa en el adaptador la mantiene fuera.

El mapa se tipa como `Record<ModuleKey, string>`, **exhaustivo**. Añadir una clave a `MODULES` sin
darle ruta rompe `tsc --noEmit`. Ese error de compilación es la garantía mecánica detrás de SC-008:
no hay forma de agregar un área y olvidarse de la navegación, y no hace falta tocar ninguna
pantalla — sólo el mapa.

**Alternatives considered**:

- **`path` dentro de `MODULES`** — rechazada por Principio II, arriba.
- **Que la barra llame a `can()` por cada área** — rechazada: lógica de autorización en un
  componente, N llamadas donde basta una, y no testeable sin infraestructura.
- **Catálogo de navegación duplicado a mano en el adaptador** — rechazada: dos fuentes de verdad
  que se desincronizan en el primer área nueva, y rompe SC-008.

---

## D5 — Elemento activo sin parpadeo: `useSelectedLayoutSegment()`

**Decisión**: el componente cliente de la barra lateral obtiene el área actual con
`useSelectedLayoutSegment()` de `next/navigation`.

**Rationale**: el caso límite de la spec pide que al recargar una pantalla profunda la barra
aparezca ya resaltada, sin parpadeo de selección. `useSelectedLayoutSegment` está disponible
durante el render del servidor, así que el HTML inicial ya llega con la clase activa puesta. Desde
`src/app/panel/layout.tsx` devuelve `null` en `/panel` y `"personas"` en `/panel/personas` y en
`/panel/personas/[id]` — exactamente la granularidad que la barra necesita (un nivel por debajo
del layout), y por eso resalta "Personas" también en el detalle. Verificado en
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-selected-layout-segment.md`.

**Alternatives considered**:

- **`usePathname()` + comparación de prefijos** — rechazada: obliga a escribir a mano la lógica de
  "esta ruta cuelga de aquella", que es justo lo que el segmento ya resuelve.
- **Pasar la clave activa como prop desde cada página** — rechazada: devuelve a cada pantalla una
  responsabilidad del contenedor.

---

## D6 — Tema e idioma en un solo sitio

**Decisión**: un componente cliente `AntdConfig` que monta un único `<ConfigProvider>` con
`locale={esES}` (de `antd/locale/es_ES`) y un objeto `theme` con los tokens del proyecto. Se monta
en el layout raíz, dentro de `<AntdRegistry>` y del `<ClerkProvider>` existente.

**Rationale**: FR-015 pide que color, tipografía, espaciado y radio se definan en un único lugar;
FR-016 pide español para los textos que aporta la propia librería (tabla vacía, paginación,
selectores). `ConfigProvider` es el mecanismo de antd para ambas cosas y sólo puede montarse una
vez con sentido. Va en el layout raíz —no en el del panel— para que el día que se migren `/` y
`/ingresar` no haya que mover nada.

`ConfigProvider` exige `"use client"`. Envuelve, no reemplaza: los hijos siguen pudiendo ser
Server Components porque pasan como `children`.

**Nota sobre el orden**: `<ClerkProvider>` queda por fuera. El flujo de ingreso (FR-017) no lo
toca esta feature y `<SignIn />` renderiza con estilos propios de Clerk, ajenos al tema.

**Alternatives considered**:

- **Un `ConfigProvider` por pantalla** — rechazada: contradice FR-015 directamente.
- **Variables SCSS propias intentando imitar los tokens** — rechazada: dos sistemas de diseño
  compitiendo, que es el problema que la feature elimina.

---

## D7 — Qué cambia en `eslint.config.mjs` (y qué no)

**Decisión**: dos cambios, en direcciones opuestas.

**(a) Cerrar antd hacia adentro.** Añadir `"antd"`, `"antd/*"` y `"@ant-design/*"` a
`FRAMEWORK_PACKAGES`.

`boundaries/external` tiene `default: "allow"`, así que los adaptadores ya pueden importar antd sin
tocar nada. El trabajo pendiente es el contrario: la regla para `["domain", "application", "sdk"]`
prohíbe `FRAMEWORK_PACKAGES`, y hoy antd **no está en la lista**. Sin este cambio, un `import
{ Table } from "antd"` dentro de `application/` pasaría el lint. La librería de UI es tan
"framework" como React o Next para el Principio III.

**(b) Extender la prohibición de estilos inline a los componentes de la librería.** Añadir
`react/forbid-component-props` con `forbid: [{ propName: "style", ... }]` al bloque
`src/**/*.tsx`, junto al `react/forbid-dom-props` que ya existe.

Este es el punto donde la excepción se vuelve honesta en vez de retórica. La regla actual sólo
cubre elementos DOM: `<div style={{}}>` falla, pero `<Layout.Sider style={{}}>` pasaría, porque
`forbid-dom-props` no mira componentes. Si adoptamos antd sin este cambio, la adopción **relaja**
de hecho la regla constitucional en lugar de acotarla. Con él, la excepción queda dicha con
precisión: el CSS-in-JS interno de antd y los tokens del `ConfigProvider` están exentos; escribir
`style={{ ... }}` a mano sigue prohibido en todas partes.

`forbid-component-props` prohíbe `className` y `style` por defecto. Hay que configurarlo
explícitamente para que **sólo** vete `style`: `className` es como se aplican los módulos SCSS que
la constitución exige, y vetarlo dejaría la composición sin herramienta.

**Verificación obligatoria**: ambas reglas se comprueban introduciendo una violación deliberada
(un `import { Table } from "antd"` en un caso de uso; un `<Button style={{ margin: 8 }}>` en una
pantalla) y confirmando que `pnpm lint` falla en cada caso, antes de dar el cambio por bueno. Una
guarda no verificada es documentación.

**Alternatives considered**:

- **No tocar el lint** — rechazada: deja abierto un agujero en el Principio III y convierte la
  "excepción acotada" en una excepción sin límite.
- **Apagar `react/forbid-dom-props` mientras dure la migración** — rechazada: falla abierto y nadie
  vuelve a encenderlo.
- **Migrar a la sintaxis v7 de `boundaries` de paso** — rechazada: la cabecera de
  `eslint.config.mjs` ya documenta por qué esa migración se hace deliberada y por separado. Un
  selector mal migrado deja de reportar violaciones en silencio.

---

## D8 — Enmienda constitucional: v1.3.0 → v1.4.0 (MINOR)

**Decisión**: enmendar `.specify/memory/constitution.md` en el mismo cambio que introduce la
librería.

Alcance de la enmienda:

1. Sección _Code Style & Conventions_ → "Styles live in SCSS modules": añadir la excepción
   acotada. La librería de componentes puede traer sus propios estilos y su
   `ConfigProvider` es la autoridad de tokens; el código propio sigue sin poder escribir
   `style={{ ... }}` ni en DOM ni en componentes, y los ajustes de composición siguen yendo a
   `.module.scss` colocalizado.
2. _Decisions of record_: por qué se eligió v6 (D1), por qué existe el registro SSR (D2) y por qué
   las rutas de navegación no están en `MODULES` (D4). Sin esto, el razonamiento se pierde: la
   constitución prohíbe comentarios en el código, así que este documento y ella son el único
   sitio donde puede vivir.
3. _Development Workflow & Quality Gates_, ítem 10 del checklist de revisión: reformularlo para
   que nombre las dos reglas de lint (`forbid-dom-props` y `forbid-component-props`).

**Por qué MINOR y no MAJOR**: ningún principio se elimina ni se redefine, y ningún código
existente que hoy cumple deja de cumplir. La guía se expande — que es la definición de MINOR en la
política de versionado del propio documento.

**La enmienda va en el mismo commit que la adopción.** La política de gobernanza exige que el
código invalidado se migre o se registre como excepción _en el mismo cambio_. Adoptar primero y
enmendar después deja el repositorio en violación mientras tanto.

---

## D9 — Pruebas: qué se automatiza y qué no

**Decisión**: `listAccessibleModules` se prueba con tests unitarios usando los dobles en memoria
existentes. La interfaz **no** recibe pruebas automatizadas en esta feature; se verifica a mano
con el guion de `quickstart.md`.

**Rationale**: `vitest.config.mts` corre con `environment: "node"` e `include:
["tests/**/*.test.ts"]` — sin `.tsx`, sin jsdom, sin `@testing-library/react`. Montar ese arnés es
una decisión con su propio peso (dependencias, configuración de entorno, criterio sobre qué se
prueba en la UI) y no es lo que se pidió. Meterla de contrabando aquí infla la feature y mezcla
dos discusiones.

Esto no deja ningún criterio sin cubrir por accidente: la constitución dice explícitamente que
probar reglas de negocio a través de la UI no sustituye probar el SDK. Lo que queda manual
(SC-003, SC-005, SC-006) es percepción, ancho de pantalla y recorrido con teclado — cosas que un
test de render tampoco valida bien.

**Recomendación fuera de alcance**: si más adelante interesa, el arnés de UI es una feature propia
(`@testing-library/react` + `jsdom` + un `include` para `.test.tsx`), no un apéndice de esta.

**Alternatives considered**:

- **Añadir Testing Library aquí** — rechazada por lo anterior.
- **Playwright end-to-end** — rechazada: aún más peso, y necesita un servidor corriendo.

---

## D10 — Contingencia: `next.config`

**Situación**: el repositorio **no tiene** `next.config.*`. antd v6 distribuye ESM y CJS y sus
dependencias `@rc-component/*` también, así que Next 16 debería resolverlas sin ayuda.

**Decisión**: no crear `next.config.ts` de forma preventiva. Si el `build` falla por resolución de
módulos de antd, crearlo entonces con `transpilePackages: ["antd", "@ant-design/icons"]` y
registrar el motivo.

**Rationale**: un archivo de configuración añadido "por si acaso" es una hipótesis sin verificar
que nadie se atreve a borrar después. El coste de añadirlo cuando haga falta es un minuto.

---

## D11 — Qué pasa con los `.module.scss` actuales

**Decisión**: `panel.module.scss` y `personas.module.scss` se reducen a reglas de composición
(rejilla del contenedor, anchos) o desaparecen si antd las cubre por completo. `page.module.scss`,
`error.module.scss` e `ingresar.module.scss` **no se tocan**: sus pantallas están fuera de alcance.

**Rationale**: FR-018 exige que no quede estilo propio compitiendo con la librería dentro del
panel, y la constitución advierte que el CSS muerto se acumula cuando no se borra junto con su
componente. La dependencia `sass` se queda en `package.json`: las pantallas fuera de alcance
siguen usándola, y también los ajustes de composición que quedan.

---

## Riesgos abiertos

| Riesgo                                                                           | Señal temprana                                             | Respuesta                                                                             |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| antd v6 y Next 16 fallan al resolver módulos en build                            | `pnpm build` con error de import de `antd`                 | D10: `transpilePackages`                                                              |
| El registro SSR no cubre algún componente y queda destello                       | Repintado visible al recargar `/panel`                     | Revisar que `<AntdRegistry>` envuelva de verdad todo el árbol dentro de `<body>`      |
| `@ant-design/icons` infla el bundle si se importa el barril                      | Tamaño del chunk del panel                                 | Importar cada icono por su ruta, nunca `import * as Icons`                            |
| El tema por defecto de antd choca con lo que Clerk pinta en `/ingresar`          | Incoherencia visual entre ingreso y panel                  | Aceptado: `/ingresar` está fuera de alcance y se aborda en la feature que la migre    |
| `react/forbid-component-props` genera ruido en componentes de terceros legítimos | Errores de lint en sitios donde `style` es la única salida | Usar `className` + variable CSS personalizada, que es lo que la constitución ya manda |
