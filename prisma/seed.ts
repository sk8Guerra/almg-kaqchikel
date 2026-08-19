import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function grantAdmin(identityId: string) {
  const user = await db.user.findUnique({ where: { identityId } });
  if (!user) {
    console.error(`❌ No profile for ${identityId}. That person must sign in once first.`);
    process.exitCode = 1;
    return;
  }

  await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`✅ admin role granted to ${user.email}`);
}

async function main() {
  const argument = process.argv.find((a) => a.startsWith("--admin="));
  if (!argument) {
    console.log("ℹ️  No --admin=<identityId> given: nothing to do.");
    console.log("   Permissions are not seeded: the module catalogue lives in code.");
    return;
  }

  await grantAdmin(argument.split("=")[1]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
