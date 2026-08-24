"use client";

import { useState } from "react";
import { Button, Card, Radio, Space, Typography } from "antd";
import { useActionFeedback } from "@/components/app-shell/action-feedback";
import { PermissionMatrix } from "../permission-matrix";
import { changeRoleAction, deactivateAction, reactivateAction } from "./actions";
import styles from "../personas.module.scss";

const { Text } = Typography;

type PersonControlsProps = {
  personId: string;
  role: "admin" | "member";
  isActive: boolean;
  permissionKeys: string[];
};

export function PersonControls({ personId, role, isActive, permissionKeys }: PersonControlsProps) {
  const [nextRole, setNextRole] = useState(role);
  const report = useActionFeedback();

  async function saveRole(formData: FormData) {
    report(await changeRoleAction(formData));
  }

  async function toggleStatus(formData: FormData) {
    report(await (isActive ? deactivateAction(formData) : reactivateAction(formData)));
  }

  return (
    <Space orientation="vertical" size="large" className={styles.stack}>
      <Card title="Rol y permisos" className={styles.card}>
        <form action={saveRole}>
          <input type="hidden" name="targetId" value={personId} />

          <Space orientation="vertical" size="large" className={styles.stack}>
            <fieldset className={styles.fieldset}>
              <legend>
                <Text strong>Rol</Text>
              </legend>
              <Radio.Group
                name="role"
                value={nextRole}
                onChange={(event) => setNextRole(event.target.value)}
                className={styles.stack}
              >
                <Radio value="admin">Administración</Radio>
                <Radio value="member">Miembro</Radio>
              </Radio.Group>
            </fieldset>

            {nextRole === "member" ? (
              <fieldset className={styles.fieldset}>
                <legend>
                  <Text strong>Permisos</Text>
                </legend>
                <PermissionMatrix name="permissionKeys" checked={permissionKeys} />
              </fieldset>
            ) : (
              <Text type="secondary">
                Un administrador tiene todos los permisos, incluidas las áreas que se agreguen
                después.
              </Text>
            )}

            <Button type="primary" htmlType="submit">
              Guardar cambios
            </Button>
          </Space>
        </form>
      </Card>

      <Card title={isActive ? "Desactivar cuenta" : "Reactivar cuenta"} className={styles.card}>
        <form action={toggleStatus}>
          <input type="hidden" name="targetId" value={personId} />
          <Space orientation="vertical" className={styles.stack}>
            <Text type="secondary">
              {isActive
                ? "La persona dejará de poder entrar hasta que se reactive."
                : "La persona podrá volver a entrar con sus permisos actuales."}
            </Text>
            <Button danger={isActive} htmlType="submit">
              {isActive ? "Desactivar" : "Reactivar"}
            </Button>
          </Space>
        </form>
      </Card>
    </Space>
  );
}
