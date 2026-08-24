import { access } from "@/composition/container";
import { CreatePersonButton } from "./create-person-button";
import { PeopleSearch } from "./people-search";
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
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Personas</h1>
        {isAdmin && <CreatePersonButton />}
      </div>

      <div className={styles.search}>
        <PeopleSearch defaultValue={q ?? ""} />
      </div>

      <PeopleTable people={people} linkToDetail={isAdmin} />
    </>
  );
}
