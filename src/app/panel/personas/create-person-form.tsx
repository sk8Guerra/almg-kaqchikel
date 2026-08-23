"use client";

import { useState } from "react";
import { Button, Card, Input, Radio, Space, Typography } from "antd";
import { useActionFeedback } from "@/components/app-shell/action-feedback";
import { createPersonAction } from "./actions";
import { PermissionMatrix } from "./permission-matrix";
import styles from "./personas.module.scss";

const { Text } = Typography;

export function CreatePersonForm() {
  const [role, setRole] = useState<"admin" | "member">("member");
  const report = useActionFeedback();

  async function submit(formData: FormData) {
    report(await createPersonAction(formData));
  }

  return (
    <Card title="Dar de alta una persona" className={styles.card}>
      <form action={submit}>
        <Space direction="vertical" size="large" className={styles.stack}>
          <label className={styles.field}>
            <Text strong>Correo</Text>
            <Input id="email" name="email" type="email" required placeholder="persona@almg.gt" />
          </label>

          <fieldset className={styles.fieldset}>
            <legend>
              <Text strong>Rol</Text>
            </legend>
            <Radio.Group
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={styles.stack}
            >
              <Radio value="admin">Administración — puede todo, en todas las áreas</Radio>
              <Radio value="member">Miembro — solo lo que se le indique</Radio>
            </Radio.Group>
          </fieldset>

          {role === "member" ? (
            <fieldset className={styles.fieldset}>
              <legend>
                <Text strong>Permisos</Text>
              </legend>
              <PermissionMatrix name="permissionKeys" />
            </fieldset>
          ) : (
            <Text type="secondary">
              Un administrador no necesita permisos: los tiene todos, incluidas las áreas que se
              agreguen después.
            </Text>
          )}

          <Button type="primary" htmlType="submit">
            Dar de alta
          </Button>
        </Space>
      </form>
    </Card>
  );
}
