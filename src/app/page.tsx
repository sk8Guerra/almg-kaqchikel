import Link from "next/link";
import { Button } from "antd";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.stack}>
        <h1>ALMG Kaqchikel</h1>
        <p className={styles.muted}>Acceso restringido a personas autorizadas de la Academia.</p>

        <Link href="/ingresar">
          <Button type="primary" size="large">
            Ingresar
          </Button>
        </Link>
      </div>
    </main>
  );
}
