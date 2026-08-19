# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Confirm each gate below. Any unchecked gate MUST be recorded in Complexity Tracking with a
rejected simpler alternative, or the design MUST change.

- [ ] **I. Screaming Architecture**: New capabilities land in a domain-named module under
      `src/modules/`, not in a new technical folder.
- [ ] **II. Dependency Rule**: Planned imports point inward only (`domain` → `application` →
      `infrastructure` → adapters); `domain/` stays free of React, Next.js, and vendor SDKs.
- [ ] **III. SDK-First**: Each new behavior is a use case exported from
      `src/modules/<capability>/index.ts` and callable from a plain Node script — no Next.js
      request context, no `FormData`/`Request`/`NextRequest` in use-case signatures.
- [ ] **IV. Thin Adapters**: Server actions, route handlers, and components only translate
      input → call one use case → translate output. No SQL, ORM, storage SDK, or third-party
      `fetch` planned under `src/app/` or `src/components/`.
- [ ] **V. Dependency Injection**: Use cases receive collaborators as port-typed parameters;
      concretes and `process.env` are named only in `src/composition/`. Time/IDs/randomness
      are injected.
- [ ] **VI. Ports**: Every external resource (DB, blob storage, auth, mail, queues, third-party
      APIs) is reached through an application-owned interface with an in-memory test double.
- [ ] **Testing**: Domain and application logic is unit-testable with in-memory ports and no
      live infrastructure.
- [ ] **Convenciones**: props como `<ComponentName>Props`; sin comentarios en el código;
      identificadores en inglés (español solo en texto de pantalla); estilos en `.module.scss`
      colocalizados, sin `style={{ ... }}`.
- [ ] **Tooling**: Any new module or layer directory this feature introduces has a matching
      `boundaries/elements` entry in `eslint.config.mjs`, so the linter classifies it rather
      than silently ignoring it.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder names below with the concrete paths
  this feature touches. The layout itself is fixed by the constitution
  (Technology & Structural Constraints) and MUST NOT be restructured here —
  only filled in with real capability and file names.
-->

```text
src/
├── app/                          # Next.js App Router: routes, pages, server actions (adapters)
│   └── [route-segment]/
│       ├── page.tsx              # Calls use cases; no data access
│       └── actions.ts            # "use server" — translate input, call one use case
├── components/                   # Presentational React components — no data or business logic
├── modules/
│   └── [capability]/             # Domain-named, e.g. dictionary/ lessons/ media/
│       ├── domain/               # [Entity].ts, value objects, domain errors
│       ├── application/
│       │   ├── use-cases/        # [verb-noun].ts — one use case per file
│       │   └── ports/            # [Entity]Repository.ts, BlobStore.ts, Clock.ts
│       ├── infrastructure/       # Postgres[Entity]Repository.ts, [Vendor]BlobStore.ts
│       └── index.ts              # Public SDK surface — only legal import path from outside
├── shared/                       # Result, ids, clock, shared error types
└── composition/                  # Container/factories — the only place concretes and env are named

tests/
├── unit/                         # Domain + application, in-memory ports, no infrastructure
└── integration/                  # Adapters and real port implementations at the edge
```

**Structure Decision**: [Name the capability module(s) this feature adds or extends, the use
cases exported from each `index.ts`, the ports introduced, and where they are wired in
`src/composition/`. Adding a top-level directory outside this layout requires a Complexity
Tracking entry.]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
