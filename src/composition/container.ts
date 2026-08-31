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
import { findPlace, listDepartments, listMunicipalities, listZones } from "@/modules/geography";
import { getStudent, listStudents, registerStudent } from "@/modules/students";
import { PrismaStudentRepository } from "@/modules/students/infrastructure/prisma-student-repository";
import {
  createOffering,
  exportSubmissions,
  getOpenOffering,
  getSubmission,
  listOfferings,
  listOpenOfferings,
  listSubmissions,
  listSubmissionsByStudent,
  readSubmissionDocument,
  requestUploadTicket,
  setOfferingActive,
  submitEnrollment,
  summarizeEnrollments,
  syncFormTemplates,
  updateOffering,
} from "@/modules/enrollment";
import { PrismaOfferingRepository } from "@/modules/enrollment/infrastructure/prisma-offering-repository";
import { PrismaSubmissionRepository } from "@/modules/enrollment/infrastructure/prisma-submission-repository";
import { PrismaTemplateRepository } from "@/modules/enrollment/infrastructure/prisma-template-repository";
import { VercelBlobFileStore } from "@/modules/enrollment/infrastructure/vercel-blob-file-store";
import { env } from "./env";
import { prisma } from "./prisma";

const identity = new ClerkIdentityProvider();
const users = new PrismaUserRepository(prisma);
const audit = new PrismaAuditLog(prisma);
const studentRecords = new PrismaStudentRepository(prisma);
const offeringRecords = new PrismaOfferingRepository(prisma);
const templateRecords = new PrismaTemplateRepository(prisma);
const submissionRecords = new PrismaSubmissionRepository(prisma);
const fileStore = new VercelBlobFileStore(env().blobReadWriteToken);
const clock = systemClock;

const places = { find: findPlace };

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

export const geography = {
  listDepartments: listDepartments(),
  listMunicipalities: listMunicipalities(),
  listZones: listZones(),
};

export const students = {
  registerStudent: registerStudent({ students: studentRecords, clock }),
  listStudents: listStudents({ students: studentRecords, places }),
  getStudent: getStudent({ students: studentRecords, places }),
};

export const enrollment = {
  syncFormTemplates: syncFormTemplates({ templates: templateRecords }),
  createOffering: createOffering({ offerings: offeringRecords, clock }),
  updateOffering: updateOffering({ offerings: offeringRecords, clock }),
  setOfferingActive: setOfferingActive({ offerings: offeringRecords }),
  listOfferings: listOfferings({ offerings: offeringRecords, places, clock }),
  listOpenOfferings: listOpenOfferings({ offerings: offeringRecords, places, clock }),
  getOpenOffering: getOpenOffering({ offerings: offeringRecords, places, clock }),
  requestUploadTicket: requestUploadTicket({
    offerings: offeringRecords,
    files: fileStore,
    clock,
  }),
  submitEnrollment: submitEnrollment({
    offerings: offeringRecords,
    submissions: submissionRecords,
    students: { ensure: students.registerStudent },
    files: fileStore,
    clock,
  }),
  listSubmissions: listSubmissions({ submissions: submissionRecords, places }),
  listSubmissionsByStudent: listSubmissionsByStudent({
    submissions: submissionRecords,
    places,
  }),
  getSubmission: getSubmission({ submissions: submissionRecords, places }),
  readSubmissionDocument: readSubmissionDocument({
    submissions: submissionRecords,
    files: fileStore,
  }),
  exportSubmissions: exportSubmissions({ submissions: submissionRecords, places }),
  summarizeEnrollments: summarizeEnrollments({ submissions: submissionRecords, places }),
};
