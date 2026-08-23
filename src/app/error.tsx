"use client";

import { Button, Result } from "antd";
import styles from "./error.module.scss";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <main className={styles.page}>
      <Result
        status="500"
        title="No pudimos completar la operación"
        subTitle="El servicio de identidad o la base de datos no están disponibles en este momento. No se concedió acceso. Intenta de nuevo en unos minutos."
        extra={
          <Button type="primary" onClick={reset}>
            Reintentar
          </Button>
        }
      />
    </main>
  );
}
