import { Empty } from "antd";
import { access, enrollment } from "@/composition/container";
import { DownloadButton } from "../download-button";
import { SummaryCards } from "./summary-cards";
import { SummaryFilters } from "./summary-filters";
import styles from "../inscripciones.module.scss";

type SummaryPageProps = {
  searchParams: Promise<{ anio?: string; convocatoria?: string }>;
};

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  await access.authorize("enrollment:read");

  const { anio, convocatoria } = await searchParams;
  const year = anio ? Number(anio) : undefined;

  const summary = await enrollment.summarizeEnrollments({
    year: Number.isFinite(year) ? year : undefined,
    offeringId: convocatoria,
  });

  const offerings = await enrollment.listOfferings();
  const years = [...new Set(offerings.map((offering) => offering.year))].sort((a, b) => b - a);

  const exportParams = new URLSearchParams();
  if (anio) exportParams.set("anio", anio);
  if (convocatoria) exportParams.set("convocatoria", convocatoria);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Resumen</h1>
        <DownloadButton
          href={`/panel/inscripciones/exportar?${exportParams.toString()}`}
          label="Descargar detalle"
        />
      </div>

      <SummaryFilters offerings={offerings} years={years} />

      {summary.total === 0 ? (
        <Empty description="No hay inscripciones para ese filtro." />
      ) : (
        <SummaryCards summary={summary} />
      )}
    </>
  );
}
