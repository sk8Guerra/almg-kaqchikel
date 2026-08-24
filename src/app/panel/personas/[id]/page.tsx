import { notFound } from "next/navigation";
import { Descriptions, Tag } from "antd";
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

  const status =
    person.status === "inactive"
      ? { text: "Desactivada", color: "default" }
      : person.hasSignedIn
        ? { text: "Activa", color: "green" }
        : { text: "Sin ingresar todavía", color: "gold" };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{person.email}</h1>

      <Descriptions
        column={1}
        bordered
        size="small"
        items={[
          {
            key: "displayName",
            label: "Nombre",
            children: person.displayName ?? <span className={styles.muted}>—</span>,
          },
          {
            key: "role",
            label: "Rol",
            children: person.role === "admin" ? "Administración" : "Miembro",
          },
          {
            key: "status",
            label: "Estado",
            children: <Tag color={status.color}>{status.text}</Tag>,
          },
        ]}
      />

      {isAdmin ? (
        <PersonControls
          personId={person.id}
          role={person.role}
          isActive={person.status === "active"}
          permissionKeys={person.permissionKeys}
        />
      ) : (
        <p className={styles.muted}>
          Solo una persona con rol de administración puede cambiar roles y permisos.
        </p>
      )}
    </div>
  );
}
