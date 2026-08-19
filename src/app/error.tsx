"use client";

import styles from "./error.module.scss";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <main className={styles.page}>
      <h1>No pudimos completar la operación</h1>
      <p>
        El servicio de identidad o la base de datos no están disponibles en este momento. No se
        concedió acceso. Intenta de nuevo en unos minutos.
      </p>
      <button onClick={reset}>Reintentar</button>
    </main>
  );
}
