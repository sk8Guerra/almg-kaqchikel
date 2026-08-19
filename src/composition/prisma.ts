import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/client/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: env().databaseUrl }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
