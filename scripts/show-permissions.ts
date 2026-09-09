import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";
import { ALL_PERMISSION_KEYS, isKnownPermission } from "../src/modules/access/domain/modules";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const argumentValue = (name: string): string | undefined =>
  process.argv.find((entry) => entry.startsWith(`--${name}=`))?.split("=")[1];

async function main() {
  const email = argumentValue("email");

  const people = await db.user.findMany({
    where: email ? { email } : undefined,
    include: { permissions: true },
    orderBy: { email: "asc" },
  });

  if (people.length === 0) {
    console.log(email ? `No hay ninguna persona con el correo ${email}.` : "No hay personas.");
    return;
  }

  for (const person of people) {
    const role = person.role === "ADMIN" ? "administración" : "miembro";
    const status = person.status === "ACTIVE" ? "activa" : "desactivada";
    console.log(`\n${person.email}  —  ${role}, ${status}`);

    if (person.role === "ADMIN") {
      console.log("  todo: la autoridad de administración no se enumera");
      continue;
    }

    const keys = person.permissions.map((row) => row.key).sort();
    if (keys.length === 0) {
      console.log("  sin permisos");
      continue;
    }

    for (const key of keys) {
      console.log(`  ${key}${isKnownPermission(key) ? "" : "   ← ya no existe, no habilita nada"}`);
    }

    const missing = ALL_PERMISSION_KEYS.filter((key) => !keys.includes(key));
    if (missing.length > 0) console.log(`  no tiene: ${missing.join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
