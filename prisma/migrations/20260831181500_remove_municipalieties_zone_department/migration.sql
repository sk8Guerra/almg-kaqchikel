/*
  Warnings:

  - You are about to drop the column `municipality_id` on the `form_offerings` table. All the data in the column will be lost.
  - You are about to drop the column `municipality_id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `municipalities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `zones` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[form_template_id,year,municipality_code,modality]` on the table `form_offerings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `municipality_code` to the `form_offerings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipality_code` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "form_offerings" DROP CONSTRAINT "form_offerings_municipality_id_fkey";

-- DropForeignKey
ALTER TABLE "municipalities" DROP CONSTRAINT "municipalities_department_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_municipality_id_fkey";

-- DropForeignKey
ALTER TABLE "zones" DROP CONSTRAINT "zones_municipality_id_fkey";

-- DropIndex
DROP INDEX "form_offerings_form_template_id_year_municipality_id_modali_key";

-- AlterTable
ALTER TABLE "form_offerings" DROP COLUMN "municipality_id",
ADD COLUMN     "municipality_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "municipality_id",
ADD COLUMN     "municipality_code" TEXT NOT NULL;

-- DropTable
DROP TABLE "departments";

-- DropTable
DROP TABLE "municipalities";

-- DropTable
DROP TABLE "zones";

-- CreateIndex
CREATE UNIQUE INDEX "form_offerings_form_template_id_year_municipality_code_moda_key" ON "form_offerings"("form_template_id", "year", "municipality_code", "modality");
