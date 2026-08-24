"use client";

import { useState } from "react";
import { Checkbox, Table } from "antd";
import type { TableColumnsType } from "antd";
import { ACTIONS, MODULES } from "@/modules/access";
import type { ModuleKey } from "@/modules/access";
import { ACTION_LABELS } from "./permission-labels";

type PermissionRow = {
  moduleKey: ModuleKey;
  label: string;
};

type PermissionMatrixProps = {
  name: string;
  checked?: string[];
  disabled?: boolean;
};

export function PermissionMatrix({ name, checked = [], disabled = false }: PermissionMatrixProps) {
  const [granted, setGranted] = useState<ReadonlySet<string>>(new Set(checked));

  const toggle = (key: string, isGranted: boolean) => {
    setGranted((current) => {
      const next = new Set(current);
      if (isGranted) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const rows: PermissionRow[] = (Object.keys(MODULES) as ModuleKey[]).map((moduleKey) => ({
    moduleKey,
    label: MODULES[moduleKey].label,
  }));

  const columns: TableColumnsType<PermissionRow> = [
    { title: "Área", dataIndex: "label", key: "label" },
    ...ACTIONS.map((action) => ({
      title: ACTION_LABELS[action],
      key: action,
      align: "center" as const,
      render: (_: unknown, row: PermissionRow) => {
        const key = `${row.moduleKey}:${action}`;
        return (
          <Checkbox
            checked={granted.has(key)}
            disabled={disabled}
            onChange={(event) => toggle(key, event.target.checked)}
            aria-label={`${row.label} — ${ACTION_LABELS[action]}`}
          />
        );
      },
    })),
  ];

  return (
    <>
      <Table
        rowKey="moduleKey"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="small"
      />
      {[...granted].map((key) => (
        <input key={key} type="hidden" name={name} value={key} />
      ))}
    </>
  );
}
