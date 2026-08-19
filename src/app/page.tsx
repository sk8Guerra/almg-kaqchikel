import Link from "next/link";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>ALMG Kaqchikel</h1>
      <p>Acceso restringido a personas autorizadas de la Academia.</p>
      <Link className={styles.link} href="/ingresar">
        Ingresar
      </Link>
    </main>
  );
}
