import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import { isKnownPermission } from "../src/modules/access/domain/modules";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const { data: identities } = await clerk.users.getUserList({ limit: 500 });
  const profiles = await db.user.findMany({ select: { identityId: true, email: true } });

  const localIds = new Set(profiles.map((p) => p.identityId));
  const remoteIds = new Set(identities.map((i) => i.id));

  const withoutProfile = identities.filter((i) => !localIds.has(i.id));
  const withoutIdentity = profiles.filter((p) => !remoteIds.has(p.identityId));

  console.log(`identidades en el proveedor: ${identities.length}`);
  console.log(`perfiles locales:            ${profiles.length}`);
  console.log(`\nidentidades sin perfil local: ${withoutProfile.length}`);
  withoutProfile.forEach((i) =>
    console.log(`  ${i.id} ${i.emailAddresses[0]?.emailAddress ?? "(sin correo)"}`),
  );
  console.log(`\nperfiles sin identidad: ${withoutIdentity.length}`);
  withoutIdentity.forEach((p) => console.log(`  ${p.email} (${p.identityId})`));

  const permissions = await db.userPermission.findMany();
  const orphanPermissions = permissions.filter((p) => !isKnownPermission(p.key));

  console.log(`\npermisos sobre áreas inexistentes: ${orphanPermissions.length}`);
  orphanPermissions.forEach((p) => console.log(`  ${p.key} (usuario ${p.userId})`));

  if (
    withoutProfile.length === 0 &&
    withoutIdentity.length === 0 &&
    orphanPermissions.length === 0
  ) {
    console.log("\n✅ sin huérfanos");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
