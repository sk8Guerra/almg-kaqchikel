import { formatCalendarDate } from "@/shared/calendar-date";
import Link from "next/link";
import { Button, Result } from "antd";
import { enrollment } from "@/composition/container";
import { OfferingNotFoundError, OfferingNotOpenError } from "@/modules/enrollment";
import styles from "../inscripcion.module.scss";

type ThanksPageProps = {
  params: Promise<{ offeringId: string }>;
};

export default async function ThanksPage({ params }: ThanksPageProps) {
  const { offeringId } = await params;

  const opened = await enrollment.getOpenOffering(offeringId).catch((error: unknown) => {
    if (error instanceof OfferingNotFoundError || error instanceof OfferingNotOpenError) {
      return null;
    }
    throw error;
  });

  return (
    <main className={styles.page}>
      <Result
        status="success"
        title="¡Yatqoyob'ej! Tu inscripción quedó registrada."
        subTitle={
          opened
            ? `${opened.template.nameSpanish} — ${opened.offering.municipalityName}, ${opened.offering.year}`
            : "La Academia recibió tu formulario."
        }
        extra={
          <Link href="/">
            <Button type="primary">Volver a los cursos</Button>
          </Link>
        }
      />

      {opened ? (
        <div className={styles.closing}>
          {opened.offering.classesStartOn ? (
            <p>Inicio de clases: {formatCalendarDate(opened.offering.classesStartOn)}</p>
          ) : null}
          {opened.offering.scheduleLabel ? <p>{opened.offering.scheduleLabel}</p> : null}
          <p className={styles.muted}>
            Está atento a su correo electrónico: es el único medio por el que la Academia informará
            sobre el curso.
          </p>
        </div>
      ) : null}
    </main>
  );
}
