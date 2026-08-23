import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

/**
 * KNOWN DEBT — eslint-plugin-boundaries v7 deprecations.
 *
 * This config uses the v5/v6 rule syntax (`boundaries/element-types`,
 * `boundaries/external`, the `rules` option, and `${...}` message templates).
 * v7 still supports all of it and only emits deprecation warnings; the rules
 * below are verified to fire correctly on real violations.
 *
 * It has NOT been migrated to the v7 `boundaries/dependencies` + `policies`
 * syntax on purpose: a mis-migrated selector fails open (violations stop being
 * reported) rather than failing loud, which would quietly turn Principle II
 * back into documentation. Migrate deliberately, against the guide, and
 * re-verify by reintroducing known violations and confirming each one errors:
 *   https://www.jsboundaries.dev/docs/releases/migration-guides/v6-to-v7/
 *
 * Version pins that make this toolchain work (see constitution §Tooling):
 *   - typescript 6.0.3 — typescript-eslint hard-refuses TS 7.x
 *   - eslint 9.x       — eslint-plugin-react/import/jsx-a11y do not support 10
 */

/**
 * Layer topology — ALMG Kaqchikel Constitution, Principle II (The Dependency Rule).
 *
 * Dependencies point inward only:
 *   domain -> application -> infrastructure -> adapters
 *
 * `composition` is the only element allowed to name concrete implementations.
 * The `sdk` element is a module's root folder; the `boundaries/entry-point` rule
 * below restricts it to `index.ts`, which is what makes index.ts the only legal
 * import path into a module from outside (Principle III).
 *
 * Patterns are FOLDER patterns (eslint-plugin-boundaries v7): no `/**\/*` suffix.
 * Order matters — the first matching descriptor wins, so the inner layers are
 * declared before the broader `src/modules/*` root.
 */
const elements = [
  {
    type: "domain",
    pattern: "src/modules/*/domain",
    partialMatch: false,
    capture: ["module"],
  },
  {
    type: "application",
    pattern: "src/modules/*/application",
    partialMatch: false,
    capture: ["module"],
  },
  {
    type: "infrastructure",
    pattern: "src/modules/*/infrastructure",
    partialMatch: false,
    capture: ["module"],
  },
  {
    type: "sdk",
    pattern: "src/modules/*",
    partialMatch: false,
    capture: ["module"],
  },
  { type: "composition", pattern: "src/composition", partialMatch: false },
  { type: "shared", pattern: "src/shared", partialMatch: false },
  { type: "adapter", pattern: "src/app", partialMatch: false },
  { type: "adapter", pattern: "src/components", partialMatch: false },
];

/**
 * Packages that must never reach the inner layers. Prune or extend this list
 * once the actual database and blob providers are chosen — an unused entry is
 * harmless, a missing one is a hole in Principle VI.
 */
const INFRA_ONLY_PACKAGES = [
  "pg",
  "postgres",
  "mysql2",
  "drizzle-orm",
  "drizzle-orm/*",
  "@prisma/*",
  "@prisma/**",
  "prisma",
  "@generated/*",
  "@generated/**",
  "@neondatabase/serverless",
  "@supabase/*",
  "@vercel/blob",
  "@vercel/postgres",
  "@aws-sdk/*",
  "firebase",
  "firebase-admin",
  "redis",
  "ioredis",
  "nodemailer",
  "resend",
  "stripe",
];

const FRAMEWORK_PACKAGES = [
  "react",
  "react-dom",
  "react/*",
  "next",
  "next/*",
  // Clerk: SDK de UI para adapters y auth() para infraestructura.
  // Prohibido en domain/application/sdk — el negocio no conoce al proveedor (Principio VI).
  "@clerk/*",
  // Ant Design: libreria de presentacion. Tan "framework" como React o Next para
  // el Principio III — el negocio no conoce la libreria de UI. boundaries/external
  // tiene default "allow", asi que sin esta entrada un import de antd dentro de
  // application/ pasaria el lint sin protestar.
  "antd",
  "antd/*",
  "@ant-design/*",
];

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      // src/proxy.ts es un archivo único en la raíz de src/ impuesto por Next.js;
      // los descriptores de boundaries v7 son por carpeta y no pueden clasificarlo.
      // Se excluye aquí y se le aplica una regla explícita más abajo, para que
      // quede acotado y no sin enforcement.
      "boundaries/ignore": ["prisma/generated/**", "src/proxy.ts"],
      "boundaries/elements": elements,
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      /**
       * Every file under src/ must be classifiable. An unmatched file is an
       * unenforced file — see Quality Gates checklist item 7.
       */
      "boundaries/no-unknown-files": "error",
      "boundaries/no-unknown": "error",

      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          message:
            "Constitution Principle II: '${file.type}' may not import '${dependency.type}'. Dependencies point inward only (domain -> application -> infrastructure -> adapters), and cross-module access goes through the other module's index.ts.",
          rules: [
            // domain/: pure. Own module's domain + shared primitives only.
            {
              from: ["domain"],
              allow: ["shared", ["domain", { module: "${from.module}" }]],
            },

            // application/: own domain + own ports/use-cases, plus OTHER modules'
            // public SDKs (cross-module coordination lives in a use case).
            {
              from: ["application"],
              allow: [
                "shared",
                ["domain", { module: "${from.module}" }],
                ["application", { module: "${from.module}" }],
                ["sdk", { module: "!(${from.module})" }],
              ],
            },

            // infrastructure/: implements its own module's ports. No reaching
            // sideways into other modules.
            {
              from: ["infrastructure"],
              allow: [
                "shared",
                ["domain", { module: "${from.module}" }],
                ["application", { module: "${from.module}" }],
                ["infrastructure", { module: "${from.module}" }],
              ],
            },

            // index.ts: re-exports its own module's use cases and domain types.
            {
              from: ["sdk"],
              allow: [
                "shared",
                ["domain", { module: "${from.module}" }],
                ["application", { module: "${from.module}" }],
              ],
            },

            // composition/: the wiring root — the one place concretes are named.
            {
              from: ["composition"],
              allow: ["shared", "sdk", "domain", "application", "infrastructure", "composition"],
            },

            // app/ + components/: adapters. Public SDKs and the container only —
            // never a module's internals.
            {
              from: ["adapter"],
              allow: ["shared", "sdk", "composition", "adapter"],
            },

            // shared/: primitives depend on nothing but themselves.
            { from: ["shared"], allow: ["shared"] },
          ],
        },
      ],

      /**
       * Principle III: a module is enterable only through its index.ts.
       * Inner layers are already unreachable from outside via element-types;
       * this closes the remaining hole of loose files at the module root.
       */
      "boundaries/entry-point": [
        "error",
        {
          default: "disallow",
          message:
            "Constitution Principle III: '${dependency.type}' may only be imported through its module's index.ts. Anything not exported there is private.",
          rules: [
            { target: ["sdk"], allow: "index.ts" },
            {
              target: [
                "domain",
                "application",
                "infrastructure",
                "shared",
                "composition",
                "adapter",
              ],
              allow: "**",
            },
          ],
        },
      ],

      "boundaries/external": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: ["domain", "application", "sdk"],
              disallow: [...FRAMEWORK_PACKAGES, ...INFRA_ONLY_PACKAGES],
              message:
                "Constitution Principle III: the business layer must stay framework- and vendor-free. '${dependency.source}' belongs in infrastructure/ behind a port.",
            },
            {
              from: ["adapter"],
              disallow: INFRA_ONLY_PACKAGES,
              message:
                "Constitution Principle IV: adapters must not touch data or storage directly. Call a use case instead of importing '${dependency.source}'.",
            },
          ],
        },
      ],
    },
  },

  // La prohibicion de estilos inline necesita las DOS reglas. forbid-dom-props solo
  // mira elementos DOM: <div style={{}}> falla, pero <Layout.Sider style={{}}> pasaria.
  // Adoptar una libreria de componentes sin forbid-component-props relajaria de hecho
  // la regla constitucional en vez de acotarla (constitucion §Code Style, v1.4.0).
  // forbid-component-props veta className por defecto: hay que listar solo style,
  // porque className es como se aplican los modulos SCSS que la constitucion exige.
  {
    files: ["src/**/*.tsx"],
    rules: {
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message:
                "Constitution Code Style: los estilos van en un .module.scss colocalizado, no en style={{ }}.",
            },
          ],
        },
      ],
      "react/forbid-component-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message:
                "Constitution Code Style: los estilos van en un .module.scss colocalizado, tampoco sobre componentes de la libreria de UI.",
            },
          ],
        },
      ],
    },
  },

  // El alias @generated/* resuelve a un archivo local, asi que boundaries/external
  // no lo ve como paquete externo y boundaries/ignore lo excluye del analisis.
  // Esta regla cierra ese hueco de forma explicita para la capa de adapters.
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@generated/*", "@generated/**", "@prisma/*", "@prisma/**"],
              message:
                "Constitution Principle IV: los adapters no acceden a datos. Llama a un caso de uso en vez de importar el cliente de base de datos.",
            },
          ],
        },
      ],
    },
  },

  // src/proxy.ts: frontera de red. Puede usar el middleware de Clerk, pero no
  // debe tocar la base de datos ni las tripas de un módulo.
  {
    files: ["src/proxy.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/*", "@prisma/**", "@generated/*", "@generated/**", "@/modules/*/*"],
              message:
                "Constitution Principles II y IV: proxy.ts es frontera de red. Sin acceso a datos ni a internals de un modulo; usa el SDK publico del modulo.",
            },
          ],
        },
      ],
    },
  },

  // Composition root legitimately reads env and names concretes.
  {
    files: ["src/composition/**/*.{ts,tsx}"],
    rules: { "boundaries/external": "off" },
  },

  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },

  // Must stay last: turns off stylistic rules that fight Prettier.
  prettier,
];

export default config;
