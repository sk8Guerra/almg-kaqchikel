export class NotAuthenticatedError extends Error {
  readonly code = "NOT_AUTHENTICATED";
  constructor() {
    super("There is no active session.");
    this.name = "NotAuthenticatedError";
  }
}

export class UserInactiveError extends Error {
  readonly code = "USER_INACTIVE";
  constructor() {
    super("The account is deactivated.");
    this.name = "UserInactiveError";
  }
}

export class PermissionDeniedError extends Error {
  readonly code = "PERMISSION_DENIED";
  constructor(permission: string) {
    super(`Missing required permission: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

export class UserNotProvisionedError extends Error {
  readonly code = "USER_NOT_PROVISIONED";
  constructor() {
    super("The identity is valid but has no profile in the system.");
    this.name = "UserNotProvisionedError";
  }
}

export class InvalidEmailError extends Error {
  readonly code = "INVALID_EMAIL";
  constructor(raw: string) {
    super(`Malformed email address: ${raw}`);
    this.name = "InvalidEmailError";
  }
}

export class EmailAlreadyRegisteredError extends Error {
  readonly code = "EMAIL_ALREADY_REGISTERED";
  constructor(email: string) {
    super(`Ya existe una persona registrada con el correo ${email}.`);
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class LastAdministratorError extends Error {
  readonly code = "LAST_ADMINISTRATOR";
  constructor() {
    super("No se puede dejar el sistema sin personas que puedan administrarlo.");
    this.name = "LastAdministratorError";
  }
}

export class SelfDeactivationError extends Error {
  readonly code = "SELF_DEACTIVATION";
  constructor() {
    super("No puedes desactivar tu propia cuenta.");
    this.name = "SelfDeactivationError";
  }
}

export class IdentityCreationFailedError extends Error {
  readonly code = "IDENTITY_CREATION_FAILED";
  constructor(cause: unknown) {
    super("No se pudo crear la identidad en el proveedor.");
    this.name = "IdentityCreationFailedError";
    this.cause = cause;
  }
}

export class AdminRequiredError extends Error {
  readonly code = "ADMIN_REQUIRED";
  constructor() {
    super("Esta acción solo puede realizarla una persona con rol de administración.");
    this.name = "AdminRequiredError";
  }
}

export class SelfDemotionError extends Error {
  readonly code = "SELF_DEMOTION";
  constructor() {
    super("No puedes quitarte a ti mismo el rol de administración.");
    this.name = "SelfDemotionError";
  }
}

export class MemberWithoutPermissionsError extends Error {
  readonly code = "MEMBER_WITHOUT_PERMISSIONS";
  constructor() {
    super("Un miembro necesita al menos un permiso.");
    this.name = "MemberWithoutPermissionsError";
  }
}

export class UnknownPermissionError extends Error {
  readonly code = "UNKNOWN_PERMISSION";
  constructor(key: string) {
    super(`El permiso ${key} no corresponde a ninguna área del sistema.`);
    this.name = "UnknownPermissionError";
  }
}
