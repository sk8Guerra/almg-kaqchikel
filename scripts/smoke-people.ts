import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import { systemClock } from "../src/shared/clock";
import { changePermissions, changeRole, createPerson, listPeople } from "../src/modules/access";
import { PrismaUserRepository } from "../src/modules/access/infrastructure/prisma-user-repository";
import { PrismaAuditLog } from "../src/modules/access/infrastructure/prisma-audit-log";
import type { IdentityProvider } from "../src/modules/access/application/ports/identity-provider";
import { identityId } from "../src/modules/access/domain/values";
import type { PermissionKey } from "../src/modules/access/domain/modules";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const fakeIdentity: IdentityProvider = {
  async getCurrentIdentity() {
    return null;
  },
  async createIdentity() {
    return identityId(`smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  },
  async deleteIdentity() {},
  async deactivateIdentity() {},
  async reactivateIdentity() {},
};

async function main() {
  const users = new PrismaUserRepository(db);
  const audit = new PrismaAuditLog(db);
  const clock = systemClock;

  const actorRow = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!actorRow) {
    console.log("ℹ️  No hay ningún administrador todavía. Corre pnpm db:seed -- --admin=<id>");
    return;
  }
  const actor = (await users.findById(actorRow.id as never))!;

  const member = await createPerson({ identity: fakeIdentity, users, audit, clock })({
    email: `smoke-${Date.now()}@almg.gt`,
    role: "member",
    permissionKeys: ["access:read"] as PermissionKey[],
    actor,
  });
  console.log("✅ createPerson member:", member.email, "rol:", member.role);
  console.log("   permisos:", [...(await users.listPermissions(member.id))].join(", "));

  await changePermissions({ users, audit, clock })({
    targetId: member.id,
    grant: ["offering:create"] as PermissionKey[],
    revoke: [],
    actor,
  });
  console.log("✅ changePermissions:", [...(await users.listPermissions(member.id))].join(", "));

  await changeRole({ users, audit, clock })({
    targetId: member.id,
    role: "admin",
    permissionKeys: [],
    actor,
  });
  const promoted = await users.findById(member.id);
  console.log(
    "✅ changeRole:",
    promoted?.role,
    "— permisos descartados:",
    (await users.listPermissions(member.id)).size,
  );

  console.log("✅ listPeople:", (await listPeople({ users })({ search: "smoke-" })).length);

  await db.adminAction.deleteMany({ where: { targetId: member.id } });
  await db.userPermission.deleteMany({ where: { userId: member.id } });
  await db.user.delete({ where: { id: member.id } });
  console.log("🧹 persona de prueba eliminada");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
