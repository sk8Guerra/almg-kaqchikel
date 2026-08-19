import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import { systemClock } from "../src/shared/clock";
import { authorize, getCurrentUser, syncSignedInUser } from "../src/modules/access";
import { PrismaUserRepository } from "../src/modules/access/infrastructure/prisma-user-repository";
import type { IdentityProvider } from "../src/modules/access/application/ports/identity-provider";
import { identityId } from "../src/modules/access/domain/values";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const fakeIdentity: IdentityProvider = {
  async createIdentity() {
    throw new Error("not used in this smoke test");
  },
  async deleteIdentity() {},
  async deactivateIdentity() {},
  async reactivateIdentity() {},
  async getCurrentIdentity() {
    return {
      identityId: identityId("smoke_user"),
      email: "smoke@almg.gt",
      displayName: "Prueba de humo",
      isActive: true,
      updatedAt: new Date(),
    };
  },
};

async function main() {
  const users = new PrismaUserRepository(db);
  const deps = { identity: fakeIdentity, users, clock: systemClock };

  const synced = await syncSignedInUser(deps)();
  console.log("✅ syncSignedInUser:", synced.email);

  const current = await getCurrentUser(deps)();
  console.log("✅ getCurrentUser:", current?.email ?? "null");

  try {
    await authorize(deps)("access:read");
    console.log("✅ authorize: permitido");
  } catch (e) {
    console.log("✅ authorize niega por omisión:", (e as Error).name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
