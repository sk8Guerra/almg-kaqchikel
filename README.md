# ALMG Kaqchikel

Aplicación de la Academia de Lenguas Mayas de Guatemala — Kaqchikel.

## Arquitectura

Este proyecto sigue una constitución explícita:
**[`.specify/memory/constitution.md`](.specify/memory/constitution.md)**. No es documentación
aspiracional — sus reglas se verifican en CI y una violación rompe el build.

La regla central: **las dependencias apuntan hacia adentro**.

```
domain → application → infrastructure → adapters
```

```text
src/
├── app/            Rutas, páginas y server actions (adapters). Sin lógica de negocio.
├── components/     Componentes presentacionales. Sin acceso a datos.
│   └── app-shell/  Contenedor del panel y tema de Ant Design (ConfigProvider único)
├── modules/        Una carpeta por capacidad de negocio
│   ├── access/     Identidad, perfiles y autorización
│   ├── enrollment/ Formularios, convocatorias, inscripciones y reportes
│   ├── geography/  Departamentos, municipios y zonas de Guatemala
│   └── students/   Padrón de estudiantes
│       ├── domain/          Entidades y reglas puras. No importa nada.
│       ├── application/     Casos de uso + puertos (el "SDK" del módulo)
│       ├── infrastructure/  Implementaciones de puertos (Clerk, Prisma)
│       └── index.ts         Superficie pública — único camino de entrada
├── shared/         Primitivas transversales (Clock, Result)
├── composition/    Raíz de inyección — único lugar que nombra concretas y lee env
└── proxy.ts        Frontera de red (Next.js 16 usa proxy.ts, no middleware.ts)
```

### Las dos reglas que más importan en el día a día

1. **Nunca accedas a datos desde un componente o server action.** Llama a un caso de uso:
   `await giveMeData()`, no `await sql("SELECT ...")`.
2. **A un módulo solo se entra por su `index.ts`.** Lo que no se exporte ahí es privado.

Ambas están garantizadas por `eslint-plugin-boundaries`: intentarlo hace fallar `pnpm lint`.

La interfaz usa **Ant Design**. Los tokens de color, tipografía, espaciado y radio se
declaran en un solo sitio, `src/components/app-shell/antd-config.tsx`. Escribir
`style={{ ... }}` a mano sigue prohibido — también sobre los componentes de la librería;
la composición va en un `.module.scss` colocalizado.

## Puesta en marcha

```bash
pnpm install
cp .env.example .env      # completa DATABASE_URL y las claves de Clerk
pnpm prisma generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Comandos

| Comando                            | Qué hace                                                             |
| ---------------------------------- | -------------------------------------------------------------------- |
| `pnpm verify`                      | Los cuatro gates de la constitución: formato, lint, tipos y pruebas  |
| `pnpm test`                        | Pruebas de dominio y casos de uso, sin infraestructura               |
| `pnpm db:migrate`                  | Aplica migraciones                                                   |
| `pnpm db:seed`                     | Catálogo de roles. `-- --admin=<identityId>` concede el primer admin |
| `pnpm tsx scripts/smoke-access.ts` | Ejecuta el SDK desde Node plano (prueba del Principio III)           |

## Autenticación

Clerk es el proveedor de identidad. **Nuestra base de datos nunca guarda contraseñas ni tokens de
sesión** — solo un perfil de negocio sincronizado, más roles y permisos propios.

El acceso es **por invitación**: el modo _Restricted_ del dashboard de Clerk es el control real.
Ocultar el botón de registro en la interfaz es cosmético.

## Notas de versiones

TypeScript está fijado en 6.x y ESLint en 9.x a propósito: `typescript-eslint` no carga bajo TS 7
y los plugins de `eslint-config-next` no soportan ESLint 10. Subir cualquiera de los dos
**desactiva silenciosamente** la verificación de arquitectura. Ver §Tooling de la constitución.
