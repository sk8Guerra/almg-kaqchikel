"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Popconfirm, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { OfferingStatus, OfferingView } from "@/modules/enrollment";
import { MODALITY_LABELS } from "@/modules/enrollment";
import { OfferingForm } from "./offering-form";
import { setOfferingActiveAction } from "./actions";

const { Text } = Typography;

const dateTimeFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS: Record<OfferingStatus, { text: string; color: string }> = {
  open: { text: "Abierta", color: "green" },
  scheduled: { text: "Programada", color: "gold" },
  closed: { text: "Cerrada", color: "default" },
};

type OfferingsTableProps = {
  offerings: OfferingView[];
  canEdit: boolean;
};

export function OfferingsTable({ offerings, canEdit }: OfferingsTableProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (offering: OfferingView) => {
    setBusy(offering.id);
    try {
      const result = await setOfferingActiveAction(offering.id, !offering.isActive);
      if (result.ok) {
        message.success(result.message);
        router.refresh();
      } else {
        message.error(result.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const columns: TableColumnsType<OfferingView> = [
    {
      title: "Curso",
      key: "template",
      render: (_, offering) => (
        <>
          <div>{offering.templateNameSpanish}</div>
          <Text type="secondary">{offering.templateNameKaqchikel}</Text>
        </>
      ),
    },
    { title: "Año", dataIndex: "year", key: "year" },
    {
      title: "Municipio",
      key: "municipality",
      render: (_, offering) => `${offering.municipalityName}, ${offering.departmentName}`,
    },
    {
      title: "Modalidad",
      key: "modality",
      render: (_, offering) => MODALITY_LABELS[offering.modality],
    },
    {
      title: "Ventana",
      key: "window",
      render: (_, offering) =>
        `${dateTimeFormatter.format(offering.opensAt)} → ${dateTimeFormatter.format(offering.closesAt)}`,
    },
    {
      title: "Estado",
      key: "status",
      render: (_, offering) => (
        <Tag color={STATUS[offering.status].color}>{STATUS[offering.status].text}</Tag>
      ),
    },
    {
      title: "Inscripciones",
      dataIndex: "submissionCount",
      key: "submissionCount",
    },
    ...(canEdit
      ? [
          {
            title: "Acciones",
            key: "actions",
            render: (_: unknown, offering: OfferingView) => (
              <>
                <OfferingForm offering={offering} trigger="link" />
                <Popconfirm
                  title={
                    offering.isActive ? "¿Cerrar la convocatoria?" : "¿Reabrir la convocatoria?"
                  }
                  okText="Sí"
                  cancelText="No"
                  onConfirm={() => void toggle(offering)}
                >
                  <Button type="link" loading={busy === offering.id}>
                    {offering.isActive ? "Cerrar" : "Reabrir"}
                  </Button>
                </Popconfirm>
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      rowKey="id"
      dataSource={offerings}
      columns={columns}
      pagination={{ hideOnSinglePage: true, pageSize: 20 }}
    />
  );
}
