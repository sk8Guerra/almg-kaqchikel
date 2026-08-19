-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'MEMBER');

-- AlterEnum
BEGIN;
CREATE TYPE "admin_action_type_new" AS ENUM ('USER_CREATED', 'ROLE_CHANGED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'USER_DEACTIVATED', 'USER_REACTIVATED');
ALTER TABLE "admin_actions" ALTER COLUMN "type" TYPE "admin_action_type_new" USING ("type"::text::"admin_action_type_new");
ALTER TYPE "admin_action_type" RENAME TO "admin_action_type_old";
ALTER TYPE "admin_action_type_new" RENAME TO "admin_action_type";
DROP TYPE "public"."admin_action_type_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- AlterTable
ALTER TABLE "admin_actions" DROP COLUMN "role_key",
ADD COLUMN     "detail" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'MEMBER';

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "role_permissions";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "user_roles";

-- CreateTable
CREATE TABLE "user_permissions" (
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("user_id","key")
);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

