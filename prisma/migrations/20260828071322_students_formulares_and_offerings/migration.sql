-- CreateEnum
CREATE TYPE "language_track" AS ENUM ('L1', 'L2');

-- CreateEnum
CREATE TYPE "course_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "modality" AS ENUM ('VIRTUAL', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "sex" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "age_range" AS ENUM ('FROM_14_TO_30', 'FROM_31_TO_60', 'OVER_60');

-- CreateEnum
CREATE TYPE "ethnic_group" AS ENUM ('MAYA', 'GARIFUNA', 'XINKA', 'LADINO', 'OTHER');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('IDENTITY_CARD', 'COMMITMENT_LETTER', 'ENROLLMENT_SHEET', 'BEGINNER_CERTIFICATE', 'INTERMEDIATE_CERTIFICATE');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipality_id" TEXT NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "first_names" TEXT NOT NULL,
    "last_names" TEXT NOT NULL,
    "sex" "sex" NOT NULL,
    "municipality_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" "language_track" NOT NULL,
    "level" "course_level" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_offerings" (
    "id" TEXT NOT NULL,
    "form_template_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "municipality_id" TEXT NOT NULL,
    "modality" "modality" NOT NULL,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "classes_start_on" DATE,
    "schedule_label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "form_offering_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "age_range" "age_range" NOT NULL,
    "ethnic_group" "ethnic_group" NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_documents" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "type" "document_type" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_code_key" ON "municipalities"("code");

-- CreateIndex
CREATE INDEX "municipalities_department_id_idx" ON "municipalities"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "zones_municipality_id_name_key" ON "zones"("municipality_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_document_id_key" ON "students"("document_id");

-- CreateIndex
CREATE INDEX "students_last_names_first_names_idx" ON "students"("last_names", "first_names");

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_code_key" ON "form_templates"("code");

-- CreateIndex
CREATE INDEX "form_offerings_opens_at_closes_at_idx" ON "form_offerings"("opens_at", "closes_at");

-- CreateIndex
CREATE INDEX "form_offerings_year_idx" ON "form_offerings"("year");

-- CreateIndex
CREATE UNIQUE INDEX "form_offerings_form_template_id_year_municipality_id_modali_key" ON "form_offerings"("form_template_id", "year", "municipality_id", "modality");

-- CreateIndex
CREATE INDEX "form_submissions_form_offering_id_submitted_at_idx" ON "form_submissions"("form_offering_id", "submitted_at");

-- CreateIndex
CREATE INDEX "form_submissions_student_id_idx" ON "form_submissions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_submissions_form_offering_id_student_id_key" ON "form_submissions"("form_offering_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_documents_submission_id_type_key" ON "submission_documents"("submission_id", "type");

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_offerings" ADD CONSTRAINT "form_offerings_form_template_id_fkey" FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_offerings" ADD CONSTRAINT "form_offerings_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_offerings" ADD CONSTRAINT "form_offerings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_offering_id_fkey" FOREIGN KEY ("form_offering_id") REFERENCES "form_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_documents" ADD CONSTRAINT "submission_documents_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
