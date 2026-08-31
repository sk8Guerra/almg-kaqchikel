"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "antd";
import { TEMPLATES } from "@/modules/enrollment";
import type { OfferingView } from "@/modules/enrollment";
import styles from "./inscripciones.module.scss";

const { Search } = Input;

type SubmissionsFiltersProps = {
  offerings: OfferingView[];
  years: number[];
};

export function SubmissionsFilters({ offerings, years }: SubmissionsFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const apply = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "") next.set(key, value);
    else next.delete(key);
    router.push(`/panel/inscripciones?${next.toString()}`);
  };

  return (
    <div className={styles.filters}>
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

      <Select
        className={styles.filter}
        allowClear
        placeholder="Curso"
        value={params.get("curso") ?? undefined}
        onChange={(value?: string) => apply("curso", value)}
        options={TEMPLATES.map((template) => ({
          value: template.code,
          label: template.nameSpanish,
        }))}
      />

      <Select
        className={styles.filter}
        allowClear
        placeholder="Año"
        value={params.get("anio") ?? undefined}
        onChange={(value?: string) => apply("anio", value)}
        options={years.map((year) => ({ value: String(year), label: String(year) }))}
      />

      <div className={styles.search}>
        <Search
          placeholder="Buscar por nombre o DPI"
          defaultValue={params.get("q") ?? ""}
          onSearch={(value) => apply("q", value)}
          allowClear
        />
      </div>
    </div>
  );
}
