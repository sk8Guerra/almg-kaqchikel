"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "antd";
import type { OfferingView } from "@/modules/enrollment";
import styles from "../inscripciones.module.scss";

type SummaryFiltersProps = {
  offerings: OfferingView[];
  years: number[];
};

export function SummaryFilters({ offerings, years }: SummaryFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const apply = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "") next.set(key, value);
    else next.delete(key);
    router.push(`/panel/inscripciones/resumen?${next.toString()}`);
  };

  return (
    <div className={styles.filters}>
      <Select
        className={styles.filter}
        allowClear
        placeholder="Año"
        value={params.get("anio") ?? undefined}
        onChange={(value?: string) => apply("anio", value)}
        options={years.map((year) => ({ value: String(year), label: String(year) }))}
      />

      <Select
        className={styles.filter}
        allowClear
        placeholder="Convocatoria"
        value={params.get("convocatoria") ?? undefined}
        onChange={(value?: string) => apply("convocatoria", value)}
        options={offerings.map((offering) => ({
          value: offering.id,
          label: `${offering.templateNameSpanish} · ${offering.municipalityName} ${offering.year}`,
        }))}
      />
    </div>
  );
}
