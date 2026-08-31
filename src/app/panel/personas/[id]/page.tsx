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

  const personIsAdmin = person.role === "admin";
  const isSelf = person.id === viewer.id;
  const canEdit = isAdmin && !isSelf && !personIsAdmin;

  let cannotEditReason = "";

  if (!isAdmin) {
    cannotEditReason = "Solo una persona con rol de administración puede cambiar roles y permisos.";
  } else if (isSelf) {
    cannotEditReason = "No puedes cambiar tu propio rol ni desactivar tu cuenta.";
  } else if (personIsAdmin) {
    cannotEditReason = "No puedes editar a otra persona con rol de administración desde aquí.";
  }

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

      {canEdit && (
        <PersonControls
          personId={person.id}
          role={person.role}
          isActive={person.status === "active"}
          permissionKeys={person.permissionKeys}
        />
      )}

      {!canEdit && <p className={styles.muted}>{cannotEditReason}</p>}
    </div>
  );
}
