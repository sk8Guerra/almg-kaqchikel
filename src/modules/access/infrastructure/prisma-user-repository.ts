import type { PrismaClient } from "@generated/client/client";
import type { User, UserStatus } from "../domain/user";
import type { PermissionKey, UserRole } from "../domain/modules";
import { email, identityId, userId } from "../domain/values";
import type { Email, IdentityId, UserId } from "../domain/values";
import type { ExternalIdentity } from "../application/ports/identity-provider";
import type {
  NewPersonInput,
  PeopleFilter,
  PersonSummary,
  UserRepository,
} from "../application/ports/user-repository";

type UserRow = {
  id: string;
  identityId: string;
  email: string;
  displayName: string | null;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  firstSignInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const toDomain = (row: UserRow): User => ({
  id: userId(row.id),
  identityId: identityId(row.identityId),
  email: email(row.email),
  displayName: row.displayName,
  role: row.role === "ADMIN" ? "admin" : "member",
  status: row.status === "ACTIVE" ? "active" : "inactive",
  firstSignInAt: row.firstSignInAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByIdentityId(id: IdentityId): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { identityId: id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(address: Email): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email: address } });
    return row ? toDomain(row) : null;
  }

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async list(filter: PeopleFilter): Promise<PersonSummary[]> {
    const rows = await this.db.user.findMany({
      where: {
        ...(filter.status ? { status: filter.status === "active" ? "ACTIVE" : "INACTIVE" } : {}),
        ...(filter.search
          ? {
              OR: [
                { email: { contains: filter.search, mode: "insensitive" as const } },
                { displayName: { contains: filter.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { permissions: true },
      orderBy: { email: "asc" },
    });

    return rows.map((row) => ({
      id: userId(row.id),
      email: email(row.email),
      displayName: row.displayName,
      role: row.role === "ADMIN" ? ("admin" as const) : ("member" as const),
      status: row.status === "ACTIVE" ? ("active" as const) : ("inactive" as const),
      permissionKeys: row.permissions.map((p) => p.key as PermissionKey),
      hasSignedIn: row.firstSignInAt !== null,
    }));
  }

  async createWithRole(input: NewPersonInput): Promise<User> {
    const row = await this.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          identityId: input.identityId,
          email: input.email,
          role: input.role === "admin" ? "ADMIN" : "MEMBER",
          status: "ACTIVE",
          createdAt: input.now,
          updatedAt: input.now,
        },
      });

      if (input.permissionKeys.length > 0) {
        await tx.userPermission.createMany({
          data: input.permissionKeys.map((key) => ({ userId: created.id, key })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return toDomain(row);
  }

  async markFirstSignIn(id: UserId, now: Date): Promise<void> {
    await this.db.user.update({ where: { id }, data: { firstSignInAt: now } });
  }

  async setStatus(id: UserId, status: UserStatus, now: Date): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { status: status === "active" ? "ACTIVE" : "INACTIVE", updatedAt: now },
    });
  }

  async upsertFromIdentity(identity: ExternalIdentity, now: Date): Promise<User> {
    const normalized = email(identity.email);
    const status = identity.isActive ? "ACTIVE" : "INACTIVE";

    const row = await this.db.user.upsert({
      where: { identityId: identity.identityId },
      create: {
        identityId: identity.identityId,
        email: normalized,
        displayName: identity.displayName,
        status,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        email: normalized,
        displayName: identity.displayName,
        status,
        updatedAt: now,
      },
    });

    return toDomain(row);
  }

  async listPermissions(id: UserId): Promise<Set<PermissionKey>> {
    const rows = await this.db.userPermission.findMany({ where: { userId: id } });
    return new Set(rows.map((r) => r.key as PermissionKey));
  }

  async grantPermissions(id: UserId, keys: PermissionKey[]): Promise<void> {
    if (keys.length === 0) return;
    await this.db.userPermission.createMany({
      data: keys.map((key) => ({ userId: id, key })),
      skipDuplicates: true,
    });
  }

  async revokePermissions(id: UserId, keys: PermissionKey[]): Promise<void> {
    if (keys.length === 0) return;
    await this.db.userPermission.deleteMany({ where: { userId: id, key: { in: keys } } });
  }

  async setRole(id: UserId, role: UserRole, now: Date): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { role: role === "admin" ? "ADMIN" : "MEMBER", updatedAt: now },
    });
  }

  async countActiveAdminsExcluding(excluded: UserId): Promise<number> {
    return this.db.user.count({
      where: { id: { not: excluded }, status: "ACTIVE", role: "ADMIN" },
    });
  }
}
