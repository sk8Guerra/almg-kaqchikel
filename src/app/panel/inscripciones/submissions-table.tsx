"use client";

import Link from "next/link";
import { Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { SubmissionSummaryView } from "@/modules/enrollment";
import { MODALITY_LABELS } from "@/modules/enrollment";

const { Text } = Typography;

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type SubmissionsTableProps = {
  submissions: SubmissionSummaryView[];
};

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const columns: TableColumnsType<SubmissionSummaryView> = [
    {
      title: "Persona",
      key: "fullName",
      render: (_, submission) => (
        <Link href={`/panel/inscripciones/${submission.id}`}>{submission.fullName}</Link>
      ),
    },
    { title: "DPI", dataIndex: "documentId", key: "documentId" },
    {
      title: "Curso",
      key: "template",
      render: (_, submission) => (
        <>
          <div>{submission.templateName}</div>
          <Text type="secondary">
            {submission.municipalityName} · {submission.year}
          </Text>
        </>
      ),
    },
    {
      title: "Modalidad",
      key: "modality",
      render: (_, submission) => <Tag>{MODALITY_LABELS[submission.modality]}</Tag>,
    },
    {
      title: "Enviada",
      key: "submittedAt",
      render: (_, submission) => dateFormatter.format(submission.submittedAt),
    },
  ];

  return (
    <Table
      rowKey="id"
      dataSource={submissions}
      columns={columns}
      pagination={{ hideOnSinglePage: true, pageSize: 25 }}
    />
  );
}
