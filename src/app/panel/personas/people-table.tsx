"use client";

import Link from "next/link";
import { Empty, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { PersonSummary } from "@/modules/access";
import { groupedPermissionLabels } from "./permission-labels";
import styles from "./personas.module.scss";

const { Text } = Typography;

type PersonStatusLabel = {
  text: string;
  color: string;
};

const statusOf = (person: PersonSummary): PersonStatusLabel => {
  if (person.status === "inactive") return { text: "Desactivada", color: "default" };
  if (!person.hasSignedIn) return { text: "Sin ingresar todavía", color: "gold" };
  return { text: "Activa", color: "green" };
};

type PeopleTableProps = {
  people: PersonSummary[];
  linkToDetail: boolean;
};

export function PeopleTable({ people, linkToDetail }: PeopleTableProps) {
  const columns: TableColumnsType<PersonSummary> = [
    {
      title: "Correo",
      dataIndex: "email",
      key: "email",
      render: (email: string, person) =>
        linkToDetail ? <Link href={`/panel/personas/${person.id}`}>{email}</Link> : email,
    },
    {
      title: "Nombre",
      dataIndex: "displayName",
      key: "displayName",
      render: (displayName: string | null) => displayName ?? <Text type="secondary">—</Text>,
    },
    {
      title: "Estado",
      key: "status",
      render: (_, person) => {
        const status = statusOf(person);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role: PersonSummary["role"]) => (role === "admin" ? "Administración" : "Miembro"),
    },
    {
      title: "Permisos",
      key: "permissionKeys",
      render: (_, person) => {
        if (person.role === "admin") return "Todo";
        const groups = groupedPermissionLabels(person.permissionKeys);
        if (groups.length === 0) return <Text type="secondary">Sin permisos</Text>;
        return <span className={styles.permissions}>{groups.join(", ")}</span>;
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={people}
      pagination={false}
      scroll={{ x: "max-content" }}
      locale={{
        emptyText: <Empty description="No hay personas que coincidan." />,
      }}
    />
  );
}
