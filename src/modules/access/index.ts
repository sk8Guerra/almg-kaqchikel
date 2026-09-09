export { syncSignedInUser } from "./application/use-cases/sync-signed-in-user";
export { getCurrentUser } from "./application/use-cases/get-current-user";
export { authorize } from "./application/use-cases/authorize";
export { can } from "./application/use-cases/can";
export { createPerson } from "./application/use-cases/create-person";
export { listPeople } from "./application/use-cases/list-people";
export { listAccessibleModules } from "./application/use-cases/list-accessible-modules";
export { changePermissions } from "./application/use-cases/change-permissions";
export { changeRole } from "./application/use-cases/change-role";
export { deactivatePerson } from "./application/use-cases/deactivate-person";
export { reactivatePerson } from "./application/use-cases/reactivate-person";

export {
  MODULES,
  ACTIONS,
  ALL_PERMISSION_KEYS,
  actionsFor,
  isKnownPermission,
} from "./domain/modules";
export type { Action, ModuleKey, PermissionKey, UserRole } from "./domain/modules";
export type { User, UserStatus } from "./domain";
export type { UserId, IdentityId, Email } from "./domain/values";
export type { PeopleFilter, PersonSummary } from "./application/ports/user-repository";
export type { AccessibleModule } from "./application/use-cases/list-accessible-modules";

export {
  NotAuthenticatedError,
  UserInactiveError,
  PermissionDeniedError,
  UserNotProvisionedError,
  InvalidEmailError,
  EmailAlreadyRegisteredError,
  LastAdministratorError,
  IdentityCreationFailedError,
  AdminRequiredError,
  SelfDemotionError,
  SelfDeactivationError,
  MemberWithoutPermissionsError,
  UnknownPermissionError,
} from "./domain/errors";
