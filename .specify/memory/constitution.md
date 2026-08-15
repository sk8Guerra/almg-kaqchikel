<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: Initial ratification. All template placeholders replaced with
concrete, project-specific governance. No prior version existed.

Modified principles: N/A (initial adoption). Six principles defined:
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

Follow-up TODOs: none — no placeholders deferred.
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

**Configuration**: All environment access MUST be centralized in `src/composition/`, validated at
startup against a schema, and passed to consumers as typed values. Reading `process.env` anywhere
else is a violation.

**Migration readiness**: The Next.js application MUST remain a replaceable shell. Removing
`src/app/` and `src/components/` MUST leave `src/modules/` compiling and its use cases callable.
Any dependency that would break this property requires an entry in Complexity Tracking.

**Scaling**: Modules MUST stay independently extractable — no cyclic module dependencies, no
shared mutable global state, and no cross-module imports except through public SDK entry points.
Cross-module coordination belongs in a use case that composes the modules' SDKs.

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

**Automated gates**: CI MUST run type checking, lint (including the layer-boundary import rules
from Principle II), and the test suite. A failing boundary rule is a build failure.

**Testing discipline**: Domain and application logic MUST be testable without infrastructure and
MUST have unit tests using in-memory ports. Adapters SHOULD be covered by integration tests at
the edge. Test coverage of business rules through the UI is not a substitute for testing the SDK
directly.

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

**Version**: 1.0.0 | **Ratified**: 2026-08-15 | **Last Amended**: 2026-08-15
