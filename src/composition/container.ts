import { systemClock } from "@/shared/clock";
import {
  authorize,
  can,
  changePermissions,
  changeRole,
  createPerson,
  deactivatePerson,
  getCurrentUser,
  listAccessibleModules,
  listPeople,
  reactivatePerson,
  syncSignedInUser,
} from "@/modules/access";
import { ClerkIdentityProvider } from "@/modules/access/infrastructure/clerk-identity-provider";
import { PrismaUserRepository } from "@/modules/access/infrastructure/prisma-user-repository";
import { PrismaAuditLog } from "@/modules/access/infrastructure/prisma-audit-log";
import { prisma } from "./prisma";

const identity = new ClerkIdentityProvider();
const users = new PrismaUserRepository(prisma);
const audit = new PrismaAuditLog(prisma);
const clock = systemClock;

export const access = {
  syncSignedInUser: syncSignedInUser({ identity, users, clock }),
  getCurrentUser: getCurrentUser({ identity, users }),
  authorize: authorize({ identity, users }),
  can: can({ identity, users }),
  createPerson: createPerson({ identity, users, audit, clock }),
  listPeople: listPeople({ users }),
  listAccessibleModules: listAccessibleModules({ identity, users }),
  changePermissions: changePermissions({ users, audit, clock }),
  changeRole: changeRole({ users, audit, clock }),
  deactivatePerson: deactivatePerson({ identity, users, audit, clock }),
  reactivatePerson: reactivatePerson({ identity, users, audit, clock }),
};
