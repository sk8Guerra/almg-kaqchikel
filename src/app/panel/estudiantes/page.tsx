import { access, students } from "@/composition/container";
import { StudentsSearch } from "./students-search";
import { StudentsTable } from "./students-table";
import styles from "./estudiantes.module.scss";

type StudentsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  await access.authorize("students:read");

  const { q } = await searchParams;
  const padron = await students.listStudents({ search: q });

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Estudiantes</h1>
      </div>

      <StudentsSearch defaultValue={q ?? ""} />

      <p className={styles.muted}>
        {padron.length} {padron.length === 1 ? "persona" : "personas"}
      </p>

      <StudentsTable students={padron} />
    </>
  );
}
