---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths follow the constitution's mandated layout (see `.specify/memory/constitution.md`):

- **Domain**: `src/modules/<capability>/domain/`
- **Use cases & ports**: `src/modules/<capability>/application/use-cases/`, `.../application/ports/`
- **Port implementations**: `src/modules/<capability>/infrastructure/`
- **Public SDK surface**: `src/modules/<capability>/index.ts`
- **DI wiring**: `src/composition/`
- **Adapters (UI/routes/actions)**: `src/app/`, `src/components/`
- **Tests**: `tests/unit/` (in-memory ports), `tests/integration/` (real adapters)

Tasks MUST NOT place data access, storage SDK calls, or business rules under `src/app/` or
`src/components/`; those belong in a use case or a port implementation.

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure Prettier (.prettierrc.json/.prettierignore) and ESLint with eslint-plugin-boundaries layer rules (Principle II)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework behind an application-owned port
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base domain entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure (logger injected, not imported)
- [ ] T009 Setup validated environment configuration in src/composition/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Unit test for [use-case] with in-memory ports in tests/unit/[capability]/[use-case].test.ts
- [ ] T011 [P] [US1] Integration test for [user journey] in tests/integration/[name].test.ts

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create [Entity1] in src/modules/[capability]/domain/[entity1].ts
- [ ] T013 [P] [US1] Define [Entity1]Repository port in src/modules/[capability]/application/ports/[entity1]-repository.ts
- [ ] T014 [US1] Implement [use-case] in src/modules/[capability]/application/use-cases/[verb-noun].ts (depends on T012, T013)
- [ ] T015 [US1] Implement Postgres[Entity1]Repository in src/modules/[capability]/infrastructure/postgres-[entity1]-repository.ts
- [ ] T016 [US1] Export [use-case] from src/modules/[capability]/index.ts and wire concretes in src/composition/
- [ ] T017 [US1] Add server action + page in src/app/[route]/ that calls [use-case] (no data access)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Unit test for [use-case] with in-memory ports in tests/unit/[capability]/[use-case].test.ts
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/[name].test.ts

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] in src/modules/[capability]/domain/[entity].ts
- [ ] T021 [US2] Implement [use-case] in src/modules/[capability]/application/use-cases/[verb-noun].ts
- [ ] T022 [US2] Implement port adapter in src/modules/[capability]/infrastructure/[adapter].ts and wire in src/composition/
- [ ] T023 [US2] Add adapter surface in src/app/[route]/; compose with US1 use cases via their module SDK if needed

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Unit test for [use-case] with in-memory ports in tests/unit/[capability]/[use-case].test.ts
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/[name].test.ts

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] in src/modules/[capability]/domain/[entity].ts
- [ ] T027 [US3] Implement [use-case] in src/modules/[capability]/application/use-cases/[verb-noun].ts
- [ ] T028 [US3] Implement port adapter in src/modules/[capability]/infrastructure/[adapter].ts and add the adapter surface in src/app/[route]/

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

Order tasks along the dependency direction (inner layers first), so nothing is written against
an unwired concrete:

- Tests (if included) MUST be written and FAIL before implementation
- Domain entities/value objects before use cases
- Port interfaces before their implementations
- Use cases (against ports, with in-memory fakes) before infrastructure adapters
- Infrastructure implementations before composition-root wiring
- Composition wiring before server actions, routes, and components
- Export the use case from the module's `index.ts` before any adapter imports it
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Unit test for [use-case] with in-memory ports in tests/unit/[capability]/[use-case].test.ts"
Task: "Integration test for [user journey] in tests/integration/[name].test.ts"

# Launch all domain entities for User Story 1 together:
Task: "Create [Entity1] in src/modules/[capability]/domain/[entity1].ts"
Task: "Create [Entity2] in src/modules/[capability]/domain/[entity2].ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- Convenciones obligatorias: props `<ComponentName>Props`, cero comentarios, identificadores en ingles (espanol solo en texto de pantalla), estilos en `.module.scss`
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
