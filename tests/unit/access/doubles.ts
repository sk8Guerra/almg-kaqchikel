import type { Clock } from "@/shared/clock";
import type { User, UserStatus } from "@/modules/access/domain/user";
import type { PermissionKey, UserRole } from "@/modules/access/domain/modules";
import type { Email, IdentityId, UserId } from "@/modules/access/domain/values";
import { email, identityId, userId } from "@/modules/access/domain/values";
import type {
  ExternalIdentity,
  IdentityProvider,
} from "@/modules/access/application/ports/identity-provider";
import type {
  NewPersonInput,
  PeopleFilter,
  PersonSummary,
  UserRepository,
} from "@/modules/access/application/ports/user-repository";
import type { AdminActionEntry, AuditLog } from "@/modules/access/application/ports/audit-log";

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

export class StubIdentityProvider implements IdentityProvider {
  readonly created: string[] = [];
  readonly deleted: IdentityId[] = [];
  readonly deactivated: IdentityId[] = [];
  readonly reactivated: IdentityId[] = [];
  failOnCreate = false;
  private seq = 0;

  constructor(private identity: ExternalIdentity | null = null) {}

  async getCurrentIdentity() {
    return this.identity;
  }
  set(identity: ExternalIdentity | null) {
    this.identity = identity;
  }
  async createIdentity(address: string) {
    if (this.failOnCreate) throw new Error("provider down");
    this.created.push(address);
    return identityId(`clerk_new_${++this.seq}`);
  }
  async deleteIdentity(id: IdentityId) {
    this.deleted.push(id);
  }
  async deactivateIdentity(id: IdentityId) {
    this.deactivated.push(id);
  }
  async reactivateIdentity(id: IdentityId) {
    this.reactivated.push(id);
  }
}

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, User>();
  readonly permissions = new Map<string, Set<PermissionKey>>();
  failOnCreate = false;
  private seq = 0;

  async findByIdentityId(id: IdentityId) {
    return [...this.users.values()].find((u) => u.identityId === id) ?? null;
  }
  async findByEmail(address: Email) {
    return [...this.users.values()].find((u) => u.email === address) ?? null;
  }
  async findById(id: UserId) {
    return this.users.get(id) ?? null;
  }

  async upsertFromIdentity(identity: ExternalIdentity, now: Date) {
    const existing = await this.findByIdentityId(identity.identityId);
    const user: User = {
      id: existing?.id ?? userId(`u${++this.seq}`),
      identityId: identity.identityId,
      email: email(identity.email),
      displayName: identity.displayName,
      role: existing?.role ?? "member",
      status: identity.isActive ? "active" : "inactive",
      firstSignInAt: existing?.firstSignInAt ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async list(filter: PeopleFilter): Promise<PersonSummary[]> {
    return [...this.users.values()]
      .filter((u) => (filter.status ? u.status === filter.status : true))
      .filter((u) => {
        if (!filter.search) return true;
        const needle = filter.search.toLowerCase();
        return u.email.includes(needle) || (u.displayName ?? "").toLowerCase().includes(needle);
      })
      .map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        status: u.status,
        permissionKeys: [...(this.permissions.get(u.id) ?? [])],
        hasSignedIn: u.firstSignInAt !== null,
      }));
  }

  async createWithRole(input: NewPersonInput): Promise<User> {
    if (this.failOnCreate) throw new Error("database down");
    const user: User = {
      id: userId(`u${++this.seq}`),
      identityId: input.identityId,
      email: input.email,
      displayName: null,
      role: input.role,
      status: "active",
      firstSignInAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.users.set(user.id, user);
    this.permissions.set(user.id, new Set(input.permissionKeys));
    return user;
  }

  async markFirstSignIn(id: UserId, now: Date) {
    const user = this.users.get(id);
    if (user) this.users.set(id, { ...user, firstSignInAt: now });
  }

  async setStatus(id: UserId, status: UserStatus, now: Date) {
    const user = this.users.get(id);
    if (user) this.users.set(id, { ...user, status, updatedAt: now });
  }

  async listPermissions(id: UserId) {
    return new Set(this.permissions.get(id) ?? []);
  }

  async grantPermissions(id: UserId, keys: PermissionKey[]) {
    const current = this.permissions.get(id) ?? new Set<PermissionKey>();
    keys.forEach((k) => current.add(k));
    this.permissions.set(id, current);
  }

  async revokePermissions(id: UserId, keys: PermissionKey[]) {
    const current = this.permissions.get(id) ?? new Set<PermissionKey>();
    keys.forEach((k) => current.delete(k));
    this.permissions.set(id, current);
  }

  async setRole(id: UserId, role: UserRole, now: Date) {
    const user = this.users.get(id);
    if (user) this.users.set(id, { ...user, role, updatedAt: now });
  }

  async countActiveAdminsExcluding(excluded: UserId) {
    return [...this.users.values()].filter(
      (u) => u.id !== excluded && u.status === "active" && u.role === "admin",
    ).length;
  }

  seed(user: User, permissions: PermissionKey[] = []) {
    this.users.set(user.id, user);
    this.permissions.set(user.id, new Set(permissions));
  }
}

export class InMemoryAuditLog implements AuditLog {
  readonly entries: AdminActionEntry[] = [];
  async record(entry: AdminActionEntry) {
    this.entries.push(entry);
  }
}

export const anIdentity = (over: Partial<ExternalIdentity> = {}): ExternalIdentity => ({
  identityId: identityId("clerk_1"),
  email: "persona@almg.gt",
  displayName: "Persona",
  isActive: true,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

export const aUser = (over: Partial<User> = {}): User => ({
  id: userId("u_seed"),
  identityId: identityId("clerk_seed"),
  email: email("seed@almg.gt"),
  displayName: "Seed",
  role: "member",
  status: "active",
  firstSignInAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

export const anAdmin = (over: Partial<User> = {}): User =>
  aUser({ id: userId("u_admin"), email: email("admin@almg.gt"), role: "admin", ...over });
