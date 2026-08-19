import type { PrismaClient } from "@generated/client/client";
import type { AdminActionEntry, AuditLog } from "../application/ports/audit-log";

export class PrismaAuditLog implements AuditLog {
  constructor(private readonly db: PrismaClient) {}

  async record(entry: AdminActionEntry): Promise<void> {
    await this.db.adminAction.create({
      data: {
        type: entry.type,
        actorId: entry.actorId,
        targetId: entry.targetId,
        detail: entry.detail ?? null,
        createdAt: entry.at,
      },
    });
  }
}
