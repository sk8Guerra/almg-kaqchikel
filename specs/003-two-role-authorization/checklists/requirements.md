# Specification Quality Checklist: Autorización de Dos Roles

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-19
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

Validación ejecutada el 2026-08-19. Hallazgos que cambiaron la especificación:

1. **FR-018 y FR-019 — escalada de privilegios**. La descripción original permitía conceder a un
   miembro cualquier combinación de área y operación, incluida el área de personas. Llevado al
   extremo, un miembro con capacidad de actualizar personas podría concederse permisos o
   promoverse a administrador. Se reservó la asignación de roles y permisos exclusivamente al rol
   de administración, y se declaró que esa capacidad no es concedible por ningún permiso. Sin
   esto, el modelo de dos roles se anula solo.

2. **FR-006 y SC-002 — la autoridad del administrador no se enumera**. "Un admin puede todo en
   todos los módulos" admite dos lecturas: conceder a cada administrador la lista completa de
   permisos, o que su autoridad sea implícita. La primera reintroduce el problema que el feature
   quiere resolver —al añadir un área hay que acordarse de actualizar a cada administrador, y
   olvidarlo falla en silencio—. Se exigió explícitamente que no exista registro por
   administrador y por área, y SC-002 lo hace verificable.

3. **FR-010 — al menos un permiso para un miembro**. "Que sea explícito a qué le quiere dar
   permiso" se interpretó como que el sistema debe impedir un alta sin ninguna selección, no solo
   mostrar la opción. Documentado en Assumptions como relajable.

4. **FR-020 y FR-021 — invariantes de bloqueo**. El modelo anterior contaba personas con cierto
   permiso; con dos roles, la invariante se simplifica a "debe quedar al menos un administrador
   activo", alcanzable ahora por tres vías nuevas: degradación, cambio de rol y autodegradación.

5. **Nota de cambio de modelo en Key Entities**. Con solo dos roles y permisos definidos persona a
   persona, el agrupamiento de permisos en roles deja de agrupar: dos miembros pueden tener
   permisos distintos. Se hizo explícito que los permisos se conceden a la persona, porque de lo
   contrario el diseño derivado heredaría una indirección que ya no significa nada.

6. **Assumptions — promover no conserva permisos**. Sin decidirlo, degradar a alguien que antes
   fue miembro dejaba ambiguo si recupera sus permisos antiguos. Se optó por pedirlos de nuevo,
   para que la autoridad resultante sea siempre una decisión consciente.

Sin ítems pendientes. La especificación está lista para `/speckit-plan`.
