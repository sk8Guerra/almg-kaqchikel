import { access, enrollment } from "@/composition/container";
import { isTemplateCode } from "@/modules/enrollment";
import { DownloadButton } from "./download-button";
import { SubmissionsFilters } from "./submissions-filters";
import { SubmissionsSearch } from "./submissions-search";
import { SubmissionsTable } from "./submissions-table";
import styles from "./inscripciones.module.scss";

type SubmissionsPageProps = {
  searchParams: Promise<{ convocatoria?: string; curso?: string; anio?: string; q?: string }>;
};

export default async function SubmissionsPage({ searchParams }: SubmissionsPageProps) {
  await access.authorize("enrollment:read");

  const { convocatoria, curso, anio, q } = await searchParams;
  const year = anio ? Number(anio) : undefined;

  const filter = {
    offeringId: convocatoria,
    templateCode: curso && isTemplateCode(curso) ? curso : undefined,
    year: Number.isFinite(year) ? year : undefined,
    search: q,
  };

  const submissions = await enrollment.listSubmissions(filter);
  const offerings = await enrollment.listOfferings();
  const years = [...new Set(offerings.map((offering) => offering.year))].sort((a, b) => b - a);

  const exportParams = new URLSearchParams();
  if (convocatoria) exportParams.set("convocatoria", convocatoria);
  if (curso) exportParams.set("curso", curso);
  if (anio) exportParams.set("anio", anio);
  if (q) exportParams.set("q", q);

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Inscripciones</h1>
        <DownloadButton
          href={`/panel/inscripciones/exportar?${exportParams.toString()}`}
          label="Exportar"
        />
      </div>

      <SubmissionsFilters offerings={offerings} years={years} />

      <div className={styles.tableToolbar}>
        <div className={styles.search}>
          <SubmissionsSearch defaultValue={q ?? ""} />
        </div>
      </div>

      <SubmissionsTable submissions={submissions} />
    </>
  );
}
