<!--
SYNC IMPACT REPORT
==================
Version change: 1.3.0 → 1.4.0
Bump rationale: MINOR. No principle was removed or redefined, and no existing
compliant code stops complying. The rule "Styles live in SCSS modules" gains a
scoped exception for an adopted component library, and the prohibition it
carries is simultaneously WIDENED: it now covers component props, not only DOM
props. Guidance materially expanded — the definition of MINOR in this document.

Modified sections (1.4.0):
  - Code Style & Conventions — "Styles live in SCSS modules" gains the
    component-library exception and names both enforcing lint rules
  - Technology & Structural Constraints — three new "Decisions of record"
    (antd v6 over v5, the SSR style registry, navigation routes kept out of
    MODULES)
  - Development Workflow & Quality Gates — review checklist item 10 reworded to
    name react/forbid-dom-props and react/forbid-component-props

Follow-up TODOs (1.4.0):
  ✅ eslint.config.mjs — react/forbid-component-props added and verified to fire
     on a deliberate <Button style={{ }}>; boundaries/external verified to reject
     an antd import from application/. className confirmed still permitted.

---
History — 1.3.0:
Version change: 1.2.0 → 1.3.0
Bump rationale: MINOR. No principle was removed or redefined. A new section,
"Code Style & Conventions", adds four mechanical rules (component props
naming, no code comments, English-only identifiers, SCSS modules instead of
inline styles), and a
"Decisions of record" list preserves the rationale that previously lived in
source comments now being removed.

Modified sections (1.3.0):
  - NEW: Code Style & Conventions
  - Technology & Structural Constraints — added "Decisions of record"
  - Development Workflow & Quality Gates — review checklist items 8-11

---
History — 1.2.0:
MINOR. No principle was removed or redefined. A new subsection
was added to Development Workflow & Quality Gates mandating Conventional
Commits, including the allowed type list, scope guidance tied to Principle I
module names, and the semver correlation used for the app's own releases.

Modified sections (1.2.0):
  - Development Workflow & Quality Gates — added "Commit convention"
    subsection (Conventional Commits format, types, scope, semver mapping)

---
History — 1.1.0:
MINOR. Guidance materially expanded: the Technology & Structural Constraints
section named the concrete toolchain enforcing Principle II (ESLint +
eslint-plugin-boundaries), added a mandatory formatting standard (Prettier),
and recorded the TypeScript 6.x / ESLint 9.x pins the toolchain requires; the
Quality Gates section gained a formatting check.

Modified sections (1.1.0):
  - Technology & Structural Constraints — added "Tooling" subsection
    (Prettier as sole formatting authority, ESLint boundaries as the
    Principle II enforcement mechanism, config file locations)
  - Development Workflow & Quality Gates — automated gates now include a
    format check; review checklist item 7 added for formatter compliance

Principles: unchanged from 1.0.0. Enforcement tooling is named in the
constraints section on purpose — principles stay tool-agnostic so a future
switch (e.g. to dependency-cruiser or Biome) is a MINOR amendment, not a
MAJOR one.

---
History — 1.0.0 (initial ratification):
All template placeholders replaced with concrete governance. Six principles
defined:
  I.   Screaming Architecture — Structure Names the Domain
  II.  The Dependency Rule (NON-NEGOTIABLE)
  III. SDK-First Business Layer (NON-NEGOTIABLE)
  IV.  Thin Adapters
  V.   Dependency Injection Over Direct Instantiation
  VI.  Infrastructure Behind Ports

Added sections:
  - Technology & Structural Constraints (replaces [SECTION_2_NAME])
  - Development Workflow & Quality Gates (replaces [SECTION_3_NAME])
  - Governance (filled)

Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates + source
     layout replaced with the mandated module structure
  ✅ .specify/templates/tasks-template.md — path conventions and intra-story
     task ordering aligned to the layer dependency direction
  ✅ .specify/templates/spec-template.md — reviewed; no change required
     (specs stay implementation-agnostic, which this constitution reinforces)
  ✅ .claude/skills/speckit-*/SKILL.md — reviewed; no outdated agent-specific
     references found
  ⚠ README.md / docs/quickstart.md — do not exist yet; when created they MUST
     link to this constitution and restate the module layout

Follow-up TODOs (1.1.0):
  ✅ eslint.config.mjs, .prettierrc.json, .prettierignore — landed and verified.
     Boundary rules were confirmed to fire against deliberate violations of
     Principles II, III, IV and the cross-module rule; `pnpm verify` runs all
     three gates green.
  ⚠ eslint-plugin-boundaries v7 migration — the config still uses the supported
    v5/v6 rule syntax. Deferred deliberately: a mis-migrated selector fails open
    rather than loud. See the header comment in eslint.config.mjs.
  ⚠ TypeScript is pinned to 6.0.3 because typescript-eslint refuses TS 7.x, and
    ESLint to 9.x because eslint-plugin-react/import/jsx-a11y do not support
    ESLint 10. Revisit both when the upstream ecosystem catches up
    (typescript-eslint issue #10940).
-->

# ALMG Kaqchikel Constitution

## Core Principles

### I. Screaming Architecture — Structure Names the Domain

The top level of `src/modules/` MUST read as a list of business capabilities, not a list of
technical roles. Directory names such as `dictionary/`, `lessons/`, or `media/` are correct;
`controllers/`, `hooks/`, `utils/`, or `services/` as top-level organizing folders are not.

- Every business capability MUST live in exactly one module directory.
- A newcomer MUST be able to infer what the system does from a single `ls src/modules/`.
- Framework artifacts (routing, rendering) MUST stay confined to `src/app/`; they MUST NOT
  become the primary organizing axis of business code.

**Rationale**: The folder tree is the cheapest and most-read piece of documentation. When it
describes delivery mechanisms instead of the domain, every future change requires reading code
to locate it, and capabilities smear across the codebase until they cannot be extracted.

### II. The Dependency Rule (NON-NEGOTIABLE)

Source dependencies MUST point inward only. The layers, from innermost outward, are
`domain` → `application` → `infrastructure` → `adapters` (Next.js `app/`, components, jobs).

- `domain/` MUST NOT import from `application/`, `infrastructure/`, `app/`, React, Next.js, any
  ORM/SQL client, or any SDK. It contains entities, value objects, domain errors, and pure rules.
- `application/` MAY import `domain/` and its own port interfaces. It MUST NOT import
  `infrastructure/`, React, or `next/*`.
- `infrastructure/` MAY import `domain/` and `application/` port interfaces to implement them.
- No layer MAY import a deeper-nested layer of a *different* module; cross-module access goes
  through the other module's public SDK entry point (Principle III).
- These import restrictions MUST be enforced mechanically by lint rules, not by convention alone.
  A violation MUST fail CI, not merely draw a review comment.

**Rationale**: An unenforced boundary is a boundary that has already been crossed. Mechanical
enforcement is what makes the difference between a documented architecture and an actual one.

### III. SDK-First Business Layer (NON-NEGOTIABLE)

Each module MUST expose its capabilities as a framework-agnostic, JavaScript/TypeScript SDK — a
set of named use-case functions exported from a single public entry point
(`src/modules/<capability>/index.ts`).

- Callers MUST invoke business behavior as `await createEntry(input)`, never as
  `await sql("SELECT ...")` or `await db.entries.insert(...)`.
- Every use case MUST be callable from a plain Node.js script with no React, no Next.js request
  context, no `"use server"`, and no HTTP layer present. Being callable this way is the
  acceptance test for this principle.
- Use cases MUST accept and return plain serializable data or domain types — never `FormData`,
  `Request`, `Response`, `NextRequest`, `cookies()`, or React types.
- Anything not exported from a module's `index.ts` is private; other modules and adapters MUST
  NOT deep-import into a module's internals.

**Rationale**: The business layer is the durable asset; React and Next.js are this year's
delivery mechanism. If the rules live inside server actions and components, replacing the
framework means rewriting the product. If they live behind an SDK, replacing the framework means
rewriting the adapters and nothing else.

### IV. Thin Adapters

Server actions, route handlers, React components, cron jobs, and CLI scripts are adapters. An
adapter's entire job is: translate transport input → call one use case → translate the result to
transport output.

- Adapters MUST NOT contain conditional business rules, validation of domain invariants,
  multi-step orchestration, transaction control, or direct data/blob access.
- A server action or route handler SHOULD be small enough to read at a glance; when one grows
  branching logic, that logic MUST move into a use case rather than be refactored in place.
- Components MUST obtain data by calling a use case (directly in a Server Component, or via a
  server action). SQL, ORM queries, storage SDK calls, and `fetch` to third parties MUST NOT
  appear in any file under `src/app/` or `src/components/`.
- Input parsing/coercion at the edge (e.g., `FormData` → a typed DTO) belongs in the adapter;
  deciding whether that input is *valid for the domain* belongs in the use case.

**Rationale**: Logic that leaks into adapters is logic bound to the framework. Keeping adapters
mechanical is what makes Principle III true in practice rather than only in theory.

### V. Dependency Injection Over Direct Instantiation

Use cases MUST receive their collaborators; they MUST NOT construct or import them.

- A use case MUST declare its needs as constructor/factory parameters typed by port interfaces
  (e.g., `EntryRepository`, `BlobStore`, `Clock`, `IdGenerator`, `Logger`).
- Modules MUST NOT import concrete infrastructure at module scope, and MUST NOT read
  `process.env` outside the composition layer.
- Concrete implementations MUST be named in exactly one place: the composition root under
  `src/composition/`. Adapters resolve wired use cases from there.
- Non-determinism — current time, random values, IDs, network — MUST be injected, never called
  ambiently inside a use case.
- Every use case MUST be instantiable in a test with in-memory fakes and zero live
  infrastructure. If a test needs a database or network to run a use case, the injection is
  incomplete.

**Rationale**: Direct instantiation is a hidden hard-coded dependency. Injection is what makes
swapping Postgres for another store, or a blob provider for another, a change in one file rather
than a search-and-replace across the codebase.

### VI. Infrastructure Behind Ports

Every external resource MUST be reached through an interface owned by the `application` layer and
implemented in `infrastructure`. This applies to the database, blob/object storage,
authentication providers, email/SMS, caches, queues, and any third-party HTTP API.

- Port interfaces MUST be expressed in domain vocabulary (`saveAudio(entryId, file)`), not vendor
  vocabulary (`putS3Object(bucket, key, body)`).
- Vendor types, error classes, and SDK objects MUST NOT cross out of `infrastructure/`. Vendor
  errors MUST be translated into domain errors at the adapter boundary.
- Provider-specific details — connection strings, bucket names, region config, SQL dialect,
  vendor SDK imports — MUST NOT appear outside `infrastructure/` and `composition/`.
- Each port MUST have at least one in-memory implementation usable by tests.

**Rationale**: Ports are the seam along which the system can be migrated or scaled. Every vendor
type that escapes into the domain welds that vendor to the product a little more permanently.

## Technology & Structural Constraints

**Stack**: TypeScript (strict mode) on Next.js (App Router), React for UI, with a SQL database
and a blob/object store reached exclusively through ports. `any` MUST NOT be used to cross a
layer boundary; `strict` MUST remain enabled in `tsconfig.json`.

**Mandated layout** — this structure is normative:

```text
src/
├── app/                      # Next.js App Router: routing, rendering, server actions (adapters)
├── components/               # Presentational React components — no data or business logic
├── modules/                  # One directory per business capability (Principle I)
│   └── <capability>/
│       ├── domain/           # Entities, value objects, domain errors — zero outward imports
│       ├── application/      # Use cases + port interfaces (the module's SDK)
│       ├── infrastructure/   # Port implementations (DB repos, blob adapters, HTTP clients)
│       └── index.ts          # Public SDK surface — the ONLY legal import path from outside
├── shared/                   # Cross-capability primitives (Result, ids, clock, errors)
└── composition/              # DI container / factories — the ONLY place concretes are named
```

**Tooling**: The following are the project's authoritative tools. Replacing one is an amendment
to this constitution, not a preference change.

- **Boundary enforcement**: ESLint (flat config, `eslint.config.mjs`) with
  `eslint-plugin-boundaries`. The layer topology of Principle II — element types, permitted
  imports, and the cross-module rule that only a module's `index.ts` is importable from outside
  — MUST be expressed as `boundaries/element-types` and `boundaries/external` rules with
  `default: "disallow"`. Adding a layer or module directory without adding its matching
  `boundaries/elements` entry is itself a violation.
- **Formatting**: Prettier is the sole authority on code formatting. Formatting MUST NOT be
  debated in review or duplicated in ESLint; stylistic ESLint rules that conflict with Prettier
  MUST be disabled (`eslint-config-prettier`). Configuration lives in `.prettierrc.json`, with
  `.prettierignore` covering build output and generated files.
- **Type checking**: `tsc --noEmit` in strict mode.

The lint toolchain carries two version pins that MUST NOT be bumped casually:
TypeScript is held at 6.x because `typescript-eslint` refuses to load under TS 7,
and ESLint at 9.x because the React/import/a11y plugins bundled by
`eslint-config-next` do not support ESLint 10. Raising either one silently
disables boundary enforcement, so a bump MUST be accompanied by a run that
re-confirms the rules still fire on deliberate violations.

Formatting and boundary configuration MUST live at the repository root and apply to the whole
codebase — per-directory overrides that weaken a boundary rule are prohibited.


**Decisions of record** — non-obvious choices whose rationale would otherwise be lost, now that
source files carry no comments:

- The Prisma client is generated to `prisma/generated/client`, **outside `src/`**, not to
  `app/generated/prisma` as Prisma's own guide suggests. In this repository `src/app/` is the
  adapter layer; generating there would place data-access code exactly where Principle IV
  forbids it, and `boundaries` would classify thousands of generated files as adapters.
- The Prisma singleton lives in `src/composition/prisma.ts`, not the conventional
  `src/lib/prisma.ts`, because the usual pattern imports it ambiently from anywhere and
  Principle V requires concretes to be named in exactly one place.
- Prisma 7 no longer accepts `url` in the schema `datasource`; the connection lives in
  `prisma.config.ts` and the client receives an `adapter` at runtime.
- `src/proxy.ts` is excluded from `boundaries` classification and constrained by an explicit
  `no-restricted-imports` rule instead: Next.js mandates that filename at the `src/` root, and
  `boundaries` v7 descriptors match folders, not single files.
- The `@generated/*` TypeScript alias resolves to a local file, so `boundaries/external` never
  treats it as an external package. Adapters are kept away from it by a separate
  `no-restricted-imports` rule, not by the boundaries policy.
- Passing `signUpUrl` to Clerk's `<SignIn />` is dead code: Clerk decides whether to show the
  sign-up link from the instance access mode. The real control for invitation-only access is
  the dashboard setting, never the component prop.
- Ant Design is pinned to the **6.x** line, not 5.x. antd 6 declares `react: ">=18.0.0"` and
  supports React 19 natively; the 5.x line requires the `@ant-design/v5-patch-for-react-19`
  compatibility package plus an `unstableSetRender` call. A permanent shim to paper over an
  incompatibility already fixed upstream is not worth carrying.
- `@ant-design/nextjs-registry` wraps the `<body>` so antd's CSS-in-JS output is extracted during
  the server render. Without it the server HTML arrives unstyled and the browser repaints on
  hydration — a flash of unstyled content on every load. Next.js's own CSS-in-JS guide documents
  this three-step pattern and lists `ant-design` among the supported libraries.
- Navigation routes live in `src/app/panel/nav-routes.ts` as `Record<ModuleKey, string>`, **not**
  as a `path` field on `MODULES`. A URL is a delivery mechanism, and `MODULES` lives in `domain/`
  (Principle II). Typing the map as an exhaustive `Record` means adding a capability without
  giving it a route fails `tsc --noEmit`, so navigation cannot silently fall out of sync with the
  catalogue.

**Configuration**: All environment access MUST be centralized in `src/composition/`, validated at
startup against a schema, and passed to consumers as typed values. Reading `process.env` anywhere
else is a violation.

**Migration readiness**: The Next.js application MUST remain a replaceable shell. Removing
`src/app/` and `src/components/` MUST leave `src/modules/` compiling and its use cases callable.
Any dependency that would break this property requires an entry in Complexity Tracking.

**Scaling**: Modules MUST stay independently extractable — no cyclic module dependencies, no
shared mutable global state, and no cross-module imports except through public SDK entry points.
Cross-module coordination belongs in a use case that composes the modules' SDKs.

## Code Style & Conventions

These are mechanical rules. They exist so that no review time is ever spent arguing about them.

### Component props are named `<ComponentName>Props`

Every React component that takes props MUST declare them as a named type whose name is the
component's name suffixed with `Props`, and MUST NOT inline the shape in the signature.

```tsx
type SessionControlsProps = { compact: boolean };
export function SessionControls({ compact }: SessionControlsProps) { ... }
```

Inline shapes (`function C({ a }: { a: string })`) are prohibited, including for `default`
exports and layouts (`RootLayoutProps`, `PanelPageProps`).

**Rationale**: the props type becomes importable and greppable. Finding every consumer of a
component's contract is a search for one identifier instead of a reading exercise.

### Code is self-documenting — no comments

Source files MUST NOT contain explanatory comments. If a piece of code needs prose to be
understood, the fix is a better name, a smaller function, or an extracted named constant —
not a comment.

- Prohibited: block comments, line comments, and JSDoc prose in `src/`, `tests/`, `scripts/`
  and `prisma/seed.ts`.
- Knowledge that genuinely cannot live in code — why an approach was rejected, a vendor
  constraint, a deferred migration — MUST be recorded in this constitution, in the feature's
  `specs/` documents, or in `README.md`. It MUST NOT be deleted along with the comment.
- Machine-readable directives are not comments and remain allowed where required:
  `"use server"`, `"use client"`, `eslint-disable`, `@ts-expect-error`, and license headers.
- Configuration files (`eslint.config.mjs`, `prisma/schema.prisma`, CI definitions) are exempt:
  their comments encode rules rather than explain logic, and losing them silently weakens
  enforcement.

**Rationale**: comments drift out of sync with the code they describe and are not covered by
any test, so a stale comment actively misleads. Names and structure are checked by the compiler
every time. The exemptions exist because a config comment is the only record of *why* a rule is
shaped the way it is, and that rule failing open is worse than the drift risk.

### Code is written in English — only user-facing text is Spanish

Every identifier MUST be in English: variables, functions, types, parameters, files, folders,
database columns, test descriptions and commit messages.

The **only** Spanish permitted is text a user reads on screen: JSX copy, labels, placeholders,
validation messages shown in the interface, and the localization catalogue.

```tsx
const canReadUsers = await access.can("user:read");
return <p>No tienes permisos asignados todavía.</p>;
```

Mixed-language identifiers (`listarUsers`, `canVerPersonas`) are the worst case and are
prohibited outright.

**Rationale**: the entire ecosystem this code sits in — React, Prisma, Clerk, the standard
library — is English. Mixing languages inside one expression forces a mental context switch on
every line and makes symbols unsearchable, because half the codebase calls the same concept
`user` and the other half `persona`. Keeping Spanish at the presentation edge also means the
interface can be translated later by touching only that edge.

### Styles live in SCSS modules — no inline styles

Presentation MUST be expressed in `.module.scss` files colocated with the component that uses
them. The `style={{ ... }}` prop is prohibited.

- Each component that needs styling gets `<component-name>.module.scss` next to it.
- Class names are referenced through the imported `styles` object, never as raw strings.
- A value that can only be known at runtime (for example a computed position or a percentage
  from data) MUST be passed as a CSS custom property, not as a full style object.

**Component library exception (scoped)**: the project's adopted UI component library —
currently Ant Design — is exempt from this rule *for the styles it ships itself*. Concretely:

- The library MAY inject its own CSS at runtime (CSS-in-JS). That output is the library's, not
  ours, and is not subject to the colocated-module rule.
- Design tokens — colour, typography, spacing, radius — MUST be declared as the library's theme
  configuration in **exactly one** place, `src/components/app-shell/antd-config.tsx`. A second
  `ConfigProvider` anywhere in the tree is a violation.
- **Nothing else is exempt.** Writing `style={{ ... }}` by hand remains prohibited — on DOM
  elements *and* on the library's components. Composition adjustments (grid, widths, responsive
  behaviour) still go in a colocated `.module.scss` applied through `className`.

This exception WIDENS the prohibition rather than narrowing it. Two lint rules enforce it
together, and `react/forbid-component-props` MUST list `style` only: it forbids `className` by
default, and `className` is how the SCSS modules this section mandates are applied.

| Rule | Covers | Without it |
|------|--------|------------|
| `react/forbid-dom-props` | `<div style={{ }}>` | inline styles on plain HTML |
| `react/forbid-component-props` | `<Layout.Sider style={{ }}>` | inline styles on library components — the hole adopting a library would otherwise open |

**Rationale**: inline styles cannot be reused, cannot express pseudo-classes, media queries or
cascade, and re-allocate an object on every render. Colocated modules keep styles deletable
together with their component, which is what stops dead CSS from accumulating. The exception
exists because no mature React component library distributes its presentation as the consumer's
SCSS modules; refusing the exception means hand-writing tables, forms, menus and responsive
collapse, which is the work the library was adopted to avoid. Confining the exception to the
library's *own* output — while extending our own prohibition to cover its components — keeps the
rule stronger after the adoption than it was before.

## Development Workflow & Quality Gates

**Planning gate**: Every `/speckit-plan` MUST complete the Constitution Check before Phase 0 and
re-check it after Phase 1 design. Violations MUST be either resolved or recorded in the plan's
Complexity Tracking table with a rejected simpler alternative.

**Review checklist** — a change MUST NOT merge until a reviewer confirms:

1. No SQL, ORM call, storage SDK call, or third-party `fetch` outside `infrastructure/`.
2. No business rule or orchestration inside a component, server action, or route handler.
3. New use cases take their dependencies as parameters typed by ports.
4. New concrete implementations are registered only in `src/composition/`.
5. New capabilities appear as a domain-named module, not as a new technical folder.
6. Public SDK surface changes are reflected in the module's `index.ts`.
7. New layers or module directories have a matching `boundaries/elements` entry, so they are not
   silently unclassified by the linter.
8. Component props are declared as a named `<ComponentName>Props` type, not inlined.
9. No explanatory comments were added to source; any non-obvious rationale went to this
   constitution, `specs/`, or `README.md` instead.
10. No `style={{ ... }}` was introduced on a DOM element or on a component; styling lives
    in a colocated `.module.scss` or in the single theme configuration. Both
    `react/forbid-dom-props` and `react/forbid-component-props` must stay enabled.
11. All identifiers are in English; Spanish appears only in text the user reads on screen.

**Automated gates**: CI MUST run, and MUST fail the build on, each of:

1. `prettier --check .` — formatting
2. `eslint .` — including the Principle II boundary rules
3. `tsc --noEmit` — strict type checking
4. The test suite

These gates MUST be runnable locally with the same commands CI uses. Formatting MUST NOT be
auto-fixed by CI on the developer's behalf; a failing format check is the developer's to correct.

**Testing discipline**: Domain and application logic MUST be testable without infrastructure and
MUST have unit tests using in-memory ports. Adapters SHOULD be covered by integration tests at
the edge. Test coverage of business rules through the UI is not a substitute for testing the SDK
directly.

**Commit convention**: Commits MUST follow Conventional Commits:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

- **Type** MUST be one of: `feat` (new feature), `fix` (bug patch), `docs` (documentation only),
  `style` (formatting, no behavior change), `refactor` (restructuring without behavior change),
  `perf` (performance), `test` (adding or updating tests), `build` (build system or
  dependencies), `ci` (CI configuration), `chore` (anything not touching source or tests).
- **Scope** is optional and SHOULD name the capability module or layer the change touches
  (e.g. `feat(dictionary):`, `refactor(composition):`). Scopes SHOULD match directory names
  under `src/modules/` so history stays navigable by capability (Principle I).
- **Description** MUST be imperative mood, lower case, no trailing period
  ("add entry repository port", not "Added entry repository port.").
- **Body** is optional and explains *why*, not *what* — the diff already shows what changed.
- **Footer** is optional and carries metadata: issue references, `Co-Authored-By`, and breaking
  change notices.

Semantic versioning correlation, for the app's own release versioning:

- `feat` → MINOR
- `fix` → PATCH
- A commit with `!` after the type/scope (`feat(dictionary)!:`) or a `BREAKING CHANGE:` footer
  → MAJOR

A commit that violates a constitutional principle MUST NOT be justified in its message; it MUST
be fixed or recorded as a tracked exception per Governance.

## Governance

This constitution supersedes other development practices in this repository. Where a tutorial,
framework default, or code-generation output conflicts with it, this document wins.

**Amendment procedure**: Amendments MUST be proposed as a written change to this file stating the
principle affected, the rationale, and the migration impact on existing code. An amendment takes
effect only when merged, and any code it invalidates MUST be either migrated or explicitly
recorded as a tracked exception in the same change.

**Versioning policy**: Semantic versioning applies to this document.

- **MAJOR** — a principle is removed or redefined in a backward-incompatible way that invalidates
  existing compliant code.
- **MINOR** — a new principle or section is added, or existing guidance is materially expanded.
- **PATCH** — clarifications, wording, and typo fixes that do not change what compliance means.

**Compliance review**: Constitution compliance is verified at three points — the `/speckit-plan`
Constitution Check, the pull request review checklist above, and CI's automated boundary rules.
Complexity that violates a principle MUST be justified in writing against a named simpler
alternative; "it was faster" is not a justification. Unjustified violations MUST be reverted or
refactored before merge.

**Version**: 1.4.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-23
