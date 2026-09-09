import Link from "next/link";
import { connection } from "next/server";
import { Button } from "antd";
import { enrollment } from "@/composition/container";
import { OfferingGrid } from "./offering-grid";
import styles from "./page.module.scss";

export default async function HomePage() {
  await connection();
  const offerings = await enrollment.listOpenOfferings();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Rutz&apos;ib&apos;axik b&apos;i&apos;aj — Inscripciones</h1>
          <Link href="/ingresar">
            <Button>Ingresar</Button>
          </Link>
        </div>
        <p className={styles.muted}>
          Academia de Lenguas Mayas de Guatemala — Comunidad Lingüística Kaqchikel. Elige el curso
          en el que quieres inscribirte y llena el formulario antes de que cierre la convocatoria.
        </p>
      </header>

      <OfferingGrid offerings={offerings} />
    </main>
  );
}
