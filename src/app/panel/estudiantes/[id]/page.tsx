import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Descriptions } from "antd";
import { access, enrollment, students } from "@/composition/container";
import { StudentNotFoundError } from "@/modules/students";
import { StudentSubmissions } from "./student-submissions";
import styles from "../estudiantes.module.scss";

const SEX_LABELS = { female: "Femenino", male: "Masculino" } as const;

type StudentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudentPage({ params }: StudentPageProps) {
  await access.authorize("students:read");
  const { id } = await params;

  const student = await students.getStudent(id).catch((error: unknown) => {
    if (error instanceof StudentNotFoundError) notFound();
    throw error;
  });

  const submissions = await enrollment.listSubmissionsByStudent(id);

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <h1 className={styles.title}>{student.fullName}</h1>
        <Link href="/panel/estudiantes">
          <Button>Volver</Button>
        </Link>
      </div>

      <Card title="Datos personales">
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: "documentId", label: "DPI", children: student.documentId },
            { key: "sex", label: "Sexo", children: SEX_LABELS[student.sex] },
            {
              key: "residence",
              label: "Residencia",
              children: `${student.municipalityName}, ${student.departmentName}`,
            },
          ]}
        />
      </Card>

      <StudentSubmissions submissions={submissions} />
    </div>
  );
}
