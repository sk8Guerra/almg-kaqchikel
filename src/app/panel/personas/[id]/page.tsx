import Link from "next/link";
import { notFound } from "next/navigation";
import { access } from "@/composition/container";
import { PersonControls } from "./person-controls";
import styles from "../personas.module.scss";

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const viewer = await access.authorize("access:read");
  const isAdmin = viewer.role === "admin";

  const { id } = await params;
  const people = await access.listPeople({});
  const person = people.find((candidate) => candidate.id === id);

  if (!person) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{person.email}</h1>
        <Link href="/panel/personas">Volver a personas</Link>
      </header>

      <p>Rol: {person.role === "admin" ? "Administración" : "Miembro"}</p>
      <p>
        Estado:{" "}
        {person.status === "inactive"
          ? "Desactivada"
          : person.hasSignedIn
            ? "Activa"
            : "Sin ingresar todavía"}
      </p>

      {isAdmin ? (
        <PersonControls
          personId={person.id}
          role={person.role}
          isActive={person.status === "active"}
          permissionKeys={person.permissionKeys}
        />
      ) : (
        <p className={styles.hint}>
          Solo una persona con rol de administración puede cambiar roles y permisos.
        </p>
      )}
    </main>
  );
}
