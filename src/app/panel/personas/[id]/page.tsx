import { notFound } from "next/navigation";
import { Descriptions, Tag, Typography } from "antd";
import { access } from "@/composition/container";
import { PersonControls } from "./person-controls";
import styles from "../personas.module.scss";

const { Text } = Typography;

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
    <>
      <h1>{person.email}</h1>

      <Descriptions column={1} bordered size="small" className={styles.details}>
        <Descriptions.Item label="Nombre">
          {person.displayName ?? <Text type="secondary">—</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="Rol">
          {person.role === "admin" ? "Administración" : "Miembro"}
        </Descriptions.Item>
        <Descriptions.Item label="Estado">
          <Tag color={status.color}>{status.text}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {isAdmin ? (
        <PersonControls
          personId={person.id}
          role={person.role}
          isActive={person.status === "active"}
          permissionKeys={person.permissionKeys}
        />
      ) : (
        <Text type="secondary">
          Solo una persona con rol de administración puede cambiar roles y permisos.
        </Text>
      )}
    </>
  );
}
