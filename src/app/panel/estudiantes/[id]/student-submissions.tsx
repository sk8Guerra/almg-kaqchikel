"use client";

import Link from "next/link";
import { Card, Table } from "antd";
import type { TableColumnsType } from "antd";
import type { SubmissionSummaryView } from "@/modules/enrollment";

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type StudentSubmissionsProps = {
  submissions: SubmissionSummaryView[];
};

export function StudentSubmissions({ submissions }: StudentSubmissionsProps) {
  const columns: TableColumnsType<SubmissionSummaryView> = [
    {
      title: "Curso",
      key: "template",
      render: (_, submission) => (
        <Link href={`/panel/inscripciones/${submission.id}`}>{submission.templateName}</Link>
      ),
    },
    { title: "Año", dataIndex: "year", key: "year" },
    { title: "Municipio", dataIndex: "municipalityName", key: "municipalityName" },
    {
      title: "Enviada",
      key: "submittedAt",
      render: (_, submission) => dateFormatter.format(submission.submittedAt),
    },
  ];

  return (
    <Card title="Inscripciones">
      <Table rowKey="id" dataSource={submissions} columns={columns} pagination={false} />
    </Card>
  );
}
