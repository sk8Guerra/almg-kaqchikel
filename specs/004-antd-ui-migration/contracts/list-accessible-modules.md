# Contract — `listAccessibleModules`

**Superficie**: SDK público del módulo `access` (`src/modules/access/index.ts`)

**Feature**: `004-antd-ui-migration`

---

## Firma

```ts
type Deps = {
  identity: IdentityProvider;
  users: UserRepository;
};

export const listAccessibleModules: (deps: Deps) => () => Promise<AccessibleModule[]>;
```

Recibe sus colaboradores como parámetros tipados por puertos (Principio V). No toma argumentos de
llamada: el sujeto es siempre quien tiene la sesión activa, igual que `can()` y `authorize()`.

**Invocable desde Node plano** — sin React, sin contexto de petición de Next.js, sin `"use server"`.
Ése es el test de aceptación del Principio III.

## Entrada

Ninguna. La identidad se resuelve por el puerto `IdentityProvider`.

## Salida

`AccessibleModule[]`, datos planos serializables:

```ts
type AccessibleModule = {
  readonly key: ModuleKey;
  readonly label: string;
};
```

Orden: el de declaración en `MODULES`. Estable entre llamadas.

## Comportamiento

| Situación de quien mira                        | Resultado                                |
| ---------------------------------------------- | ---------------------------------------- |
| Rol `admin`, activo                            | todas las claves de `MODULES`            |
| Rol `member`, activo, con `access:read`        | `[{ key: "access", label: "Personas" }]` |
| Rol `member`, activo, sin permisos de lectura  | `[]`                                     |
| Persona con estado `inactive`                  | `[]`                                     |
| Sin identidad (no ha iniciado sesión)          | `[]`                                     |
| Identidad válida pero persona no aprovisionada | `[]`                                     |

**No lanza.** Una barra lateral vacía es un estado de pantalla previsto (FR-005), no una condición
de error. Lo que sí sigue lanzando es cada pantalla al llamar a `authorize()`, que es donde se
niega el acceso de verdad: esta función decide qué se _muestra_, nunca qué se _permite_.

> Consecuencia deliberada: ocultar un elemento del menú **no** es un control de acceso. La
> protección de cada ruta sigue siendo la llamada a `authorize()` que ya hacen `page.tsx` de
> personas y de detalle. Esta feature no la toca.

## Reutilización

La evaluación de permisos usa `grants()` de `src/modules/access/domain/authorization.ts` — la misma
función que respaldan `authorize()` y `can()`. **No se reimplementa la lógica de permisos**: si
`grants()` cambia, la barra lateral cambia con ella.

## Wiring

`src/composition/container.ts`:

```ts
export const access = {
  // ...existentes
  listAccessibleModules: listAccessibleModules({ identity, users }),
};
```

Único sitio donde se nombran los concretos (Principio V).

## Cobertura de pruebas exigida

`tests/unit/access/list-accessible-modules.test.ts`, con `StubIdentityProvider` e
`InMemoryUserRepository` de `tests/unit/access/doubles.ts`. Un caso por fila de la tabla de
comportamiento, más:

- **Orden estable**: dos llamadas seguidas devuelven el mismo orden.
- **Derivado del catálogo, no codificado a mano**: la expectativa del caso `admin` se construye
  desde `Object.keys(MODULES)`, nunca escribiendo `["access"]` literal. Así el test sigue pasando
  cuando se agregue un área — y fallaría si alguien reemplazara la derivación por una lista fija.
  Es la mitad automatizable de FR-007; la otra mitad (que la ruta exista) la cubre el
  `Record<ModuleKey, string>` exhaustivo en `tsc --noEmit`.

`MODULES` se importa directamente del dominio propio del módulo, no se inyecta: es un catálogo
estático y determinista, no una fuente de no-determinismo de las que el Principio V obliga a
inyectar.

Sin infraestructura viva: ni base de datos, ni Clerk, ni red.
