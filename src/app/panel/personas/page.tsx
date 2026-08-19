import Link from "next/link";
import { access } from "@/composition/container";
import { CreatePersonForm } from "./create-person-form";
import { PeopleTable } from "./people-table";
import styles from "./personas.module.scss";

type PeoplePageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const viewer = await access.authorize("access:read");
  const isAdmin = viewer.role === "admin";

  const { q } = await searchParams;
  const people = await access.listPeople({ search: q });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Personas</h1>
        <Link href="/panel">Volver al panel</Link>
      </header>

      {isAdmin && <CreatePersonForm />}

      <form className={styles.search}>
        <input name="q" defaultValue={q ?? ""} placeholder="Buscar por correo o nombre" />
        <button type="submit">Buscar</button>
      </form>

      <PeopleTable people={people} linkToDetail={isAdmin} />
    </main>
  );
}
