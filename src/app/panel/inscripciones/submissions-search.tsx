"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "antd";

const { Search } = Input;

type SubmissionsSearchProps = {
  defaultValue: string;
};

export function SubmissionsSearch({ defaultValue }: SubmissionsSearchProps) {
  const router = useRouter();
  const params = useSearchParams();

  const apply = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value !== "") next.set("q", value);
    else next.delete("q");
    router.push(`/panel/inscripciones?${next.toString()}`);
  };

  return (
    <Search
      placeholder="Buscar por nombre o DPI"
      defaultValue={defaultValue}
      onSearch={apply}
      allowClear
      aria-label="Buscar inscripciones por nombre o DPI"
    />
  );
}
