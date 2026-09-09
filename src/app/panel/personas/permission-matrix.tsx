"use client";

import { useState } from "react";
import { Checkbox, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { GRANTABLE_ACTIONS, MODULES, actionsFor, isKnownPermission } from "@/modules/access";
import type { Action, ModuleKey } from "@/modules/access";
import { ACTION_LABELS } from "./permission-labels";
import styles from "./personas.module.scss";

const { Text } = Typography;

type PermissionRow = {
  moduleKey: ModuleKey;
  label: string;
  actions: readonly Action[];
};

type PermissionMatrixProps = {
  name: string;
  checked?: string[];
  disabled?: boolean;
};

export function PermissionMatrix({ name, checked = [], disabled = false }: PermissionMatrixProps) {
  // Un permiso que ya no está en el catálogo se descarta al abrir el formulario: reenviarlo
  // haría fallar el guardado con UnknownPermissionError.
  const [granted, setGranted] = useState<ReadonlySet<string>>(
    () => new Set(checked.filter(isKnownPermission)),
  );

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
    actions: actionsFor(moduleKey),
  }));

  const columns: TableColumnsType<PermissionRow> = [
    { title: "Área", dataIndex: "label", key: "label" },
    ...GRANTABLE_ACTIONS.map((action) => ({
      title: ACTION_LABELS[action],
      key: action,
      align: "center" as const,
      render: (_: unknown, row: PermissionRow) => {
        if (!row.actions.includes(action)) {
          return (
            <span className={styles.muted} title="No se puede conceder">
              —
            </span>
          );
        }

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
      <Text type="secondary">
        Un guion es una operación que no se puede conceder. Sobre personas nunca: dar de alta,
        cambiar roles y desactivar cuentas es exclusivo del rol de administración. En las demás
        áreas, porque el sistema todavía no sabe hacerla.
      </Text>
      {[...granted].map((key) => (
        <input key={key} type="hidden" name={name} value={key} />
      ))}
    </>
  );
}
