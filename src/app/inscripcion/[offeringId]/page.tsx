import { notFound } from "next/navigation";
import { Tag } from "antd";
import { enrollment, geography } from "@/composition/container";
import { LEVEL_LABELS, MODALITY_LABELS, TRACK_LABELS } from "@/modules/enrollment";
import { OfferingNotFoundError, OfferingNotOpenError } from "@/modules/enrollment";
import { EnrollmentForm } from "./enrollment-form";
import styles from "./inscripcion.module.scss";

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type EnrollmentPageProps = {
  params: Promise<{ offeringId: string }>;
};

export default async function EnrollmentPage({ params }: EnrollmentPageProps) {
  const { offeringId } = await params;

  const opened = await enrollment.getOpenOffering(offeringId).catch((error: unknown) => {
    if (error instanceof OfferingNotFoundError || error instanceof OfferingNotOpenError) {
      notFound();
    }
    throw error;
  });

  const departments = await geography.listDepartments();
  const { offering, template } = opened;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{template.nameKaqchikel}</h1>
        <p className={styles.muted}>
          {template.nameSpanish} — {offering.year}
        </p>
        <div className={styles.tags}>
          <Tag color="green">{TRACK_LABELS[offering.track]}</Tag>
          <Tag color="blue">{LEVEL_LABELS[offering.level]}</Tag>
          <Tag>{MODALITY_LABELS[offering.modality]}</Tag>
          <Tag>
            {offering.municipalityName}, {offering.departmentName}
          </Tag>
        </div>
        {offering.scheduleLabel ? <p>{offering.scheduleLabel}</p> : null}
        {offering.classesStartOn ? (
          <p className={styles.muted}>
            Inicio de clases: {dateFormatter.format(offering.classesStartOn)}
          </p>
        ) : null}
        <p className={styles.muted}>
          Ütz tasik&apos;ij ri k&apos;o qa, k&apos;a ri&apos;, tatz&apos;ib&apos;aj ri nk&apos;utüx
          chawe. / Lee con atención y escribe lo que se te pide.
        </p>
      </header>

      <EnrollmentForm offering={offering} template={template} departments={departments} />
    </main>
  );
}
