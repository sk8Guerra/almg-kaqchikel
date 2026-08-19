"use client";

import { ACTIONS, MODULES } from "@/modules/access";
import type { ModuleKey } from "@/modules/access";
import styles from "./personas.module.scss";

const ACTION_LABELS: Record<string, string> = {
  read: "Ver",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
};

type PermissionMatrixProps = {
  name: string;
  checked?: string[];
  disabled?: boolean;
};

export function PermissionMatrix({ name, checked = [], disabled = false }: PermissionMatrixProps) {
  const moduleKeys = Object.keys(MODULES) as ModuleKey[];

  return (
    <table className={styles.matrix}>
      <thead>
        <tr>
          <th>Área</th>
          {ACTIONS.map((action) => (
            <th key={action}>{ACTION_LABELS[action]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {moduleKeys.map((moduleKey) => (
          <tr key={moduleKey}>
            <td>{MODULES[moduleKey].label}</td>
            {ACTIONS.map((action) => {
              const key = `${moduleKey}:${action}`;
              return (
                <td key={key}>
                  <input
                    type="checkbox"
                    name={name}
                    value={key}
                    defaultChecked={checked.includes(key)}
                    disabled={disabled}
                    aria-label={`${MODULES[moduleKey].label} — ${ACTION_LABELS[action]}`}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
