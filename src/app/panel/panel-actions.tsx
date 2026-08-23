"use client";

import { Button, Typography } from "antd";
import { useActionFeedback } from "@/components/app-shell/action-feedback";
import { listUsers } from "./actions";
import styles from "./panel.module.scss";

const { Text } = Typography;

type PanelActionsProps = {
  canReadUsers: boolean;
};

export function PanelActions({ canReadUsers }: PanelActionsProps) {
  const report = useActionFeedback();

  if (!canReadUsers) {
    return <Text type="secondary">No tienes permisos asignados todavía.</Text>;
  }

  return (
    <div className={styles.actions}>
      <Button onClick={async () => report(await listUsers())}>Ver personas</Button>
    </div>
  );
}
