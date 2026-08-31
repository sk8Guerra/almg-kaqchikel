"use client";

import { Card, Statistic, Table } from "antd";
import type { EnrollmentSummaryView } from "@/modules/enrollment";
import {
  AGE_RANGE_LABELS,
  ETHNIC_GROUP_LABELS,
  MODALITY_LABELS,
  SEX_LABELS,
} from "@/modules/enrollment";
import styles from "../inscripciones.module.scss";

type Breakdown = { key: string; label: string; count: number };

const breakdownColumns = [
  { title: "Categoría", dataIndex: "label", key: "label" },
  { title: "Inscripciones", dataIndex: "count", key: "count" },
];

const fromRecord = <T extends string>(
  counts: Record<T, number>,
  labels: Record<T, string>,
): Breakdown[] =>
  (Object.keys(counts) as T[]).map((key) => ({ key, label: labels[key], count: counts[key] }));

type SummaryCardsProps = {
  summary: EnrollmentSummaryView;
};

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className={styles.summaryGrid}>
      <Card>
        <Statistic title="Inscripciones" value={summary.total} />
      </Card>

      <Card title="Por sexo">
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          columns={breakdownColumns}
          dataSource={fromRecord(summary.bySex, SEX_LABELS)}
        />
      </Card>

      <Card title="Por rango de edad">
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          columns={breakdownColumns}
          dataSource={fromRecord(summary.byAgeRange, AGE_RANGE_LABELS)}
        />
      </Card>

      <Card title="Por pueblo">
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          columns={breakdownColumns}
          dataSource={fromRecord(summary.byEthnicGroup, ETHNIC_GROUP_LABELS)}
        />
      </Card>

      <Card title="Por modalidad">
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          columns={breakdownColumns}
          dataSource={fromRecord(summary.byModality, MODALITY_LABELS)}
        />
      </Card>

      <Card title="Por municipio de residencia">
        <Table
          rowKey="name"
          size="small"
          pagination={false}
          columns={[
            { title: "Municipio", dataIndex: "name", key: "name" },
            { title: "Inscripciones", dataIndex: "count", key: "count" },
          ]}
          dataSource={[...summary.byMunicipality]}
        />
      </Card>

      <Card title="Por curso">
        <Table
          rowKey="code"
          size="small"
          pagination={false}
          columns={[
            { title: "Curso", dataIndex: "name", key: "name" },
            { title: "Inscripciones", dataIndex: "count", key: "count" },
          ]}
          dataSource={[...summary.byTemplate]}
        />
      </Card>
    </div>
  );
}
