-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('USER_CREATED', 'ROLE_ASSIGNED', 'ROLE_REVOKED', 'USER_DEACTIVATED', 'USER_REACTIVATED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstSignInAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "type" "AdminActionType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "roleKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAction_targetId_createdAt_idx" ON "AdminAction"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_actorId_createdAt_idx" ON "AdminAction"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
