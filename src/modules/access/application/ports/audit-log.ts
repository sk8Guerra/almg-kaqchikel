import type { UserId } from "../../domain/values";

export type AdminActionType =
  | "USER_CREATED"
  | "ROLE_CHANGED"
  | "PERMISSION_GRANTED"
  | "PERMISSION_REVOKED"
  | "USER_DEACTIVATED"
  | "USER_REACTIVATED";

export type AdminActionEntry = {
  readonly type: AdminActionType;
  readonly actorId: UserId;
  readonly targetId: UserId;
  readonly detail?: string;
  readonly at: Date;
};

export interface AuditLog {
  record(entry: AdminActionEntry): Promise<void>;
}

export const recordBestEffort = async (audit: AuditLog, entry: AdminActionEntry): Promise<void> => {
  try {
    await audit.record(entry);
  } catch (error) {
    console.error("[audit] no se pudo registrar la acción", { entry, error });
  }
};
