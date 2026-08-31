"use client";

import Link from "next/link";
import { Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { StudentSummary } from "@/modules/students";

const { Text } = Typography;

const SEX_LABELS: Record<StudentSummary["sex"], string> = {
  female: "Femenino",
  male: "Masculino",
};

type StudentsTableProps = {
  students: StudentSummary[];
};

export function StudentsTable({ students }: StudentsTableProps) {
  const columns: TableColumnsType<StudentSummary> = [
    {
      title: "Nombre",
      key: "fullName",
      render: (_, student) => (
        <Link href={`/panel/estudiantes/${student.id}`}>{student.fullName}</Link>
      ),
    },
    { title: "DPI", dataIndex: "documentId", key: "documentId" },
    {
      title: "Sexo",
      key: "sex",
      render: (_, student) => SEX_LABELS[student.sex],
    },
    {
      title: "Residencia",
      key: "municipality",
      render: (_, student) => (
        <>
          <div>{student.municipalityName}</div>
          <Text type="secondary">{student.departmentName}</Text>
        </>
      ),
    },
    {
      title: "Inscripciones",
      dataIndex: "submissionCount",
      key: "submissionCount",
    },
  ];

  return (
    <Table
      rowKey="id"
      dataSource={students}
      columns={columns}
      pagination={{ hideOnSinglePage: true, pageSize: 25 }}
    />
  );
}
