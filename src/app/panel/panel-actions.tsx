"use client";

import { useState } from "react";
import { listUsers } from "./actions";
import styles from "./panel.module.scss";

type PanelActionsProps = {
  canReadUsers: boolean;
};

export function PanelActions({ canReadUsers }: PanelActionsProps) {
  const [result, setResult] = useState<string | null>(null);

  return (
    <section className={styles.actions}>
      {canReadUsers ? (
        <button onClick={async () => setResult((await listUsers()).message)}>Ver personas</button>
      ) : (
        <p>No tienes permisos asignados todavía.</p>
      )}
      {result && <p role="status">{result}</p>}
    </section>
  );
}
