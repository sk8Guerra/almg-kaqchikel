"use client";

import { useRouter } from "next/navigation";
import { Input } from "antd";
import styles from "./estudiantes.module.scss";

const { Search } = Input;

type StudentsSearchProps = {
  defaultValue: string;
};

export function StudentsSearch({ defaultValue }: StudentsSearchProps) {
  const router = useRouter();

  return (
    <div className={styles.search}>
      <Search
        placeholder="Buscar por nombre o DPI"
        defaultValue={defaultValue}
        allowClear
        onSearch={(value) =>
          router.push(
            value ? `/panel/estudiantes?q=${encodeURIComponent(value)}` : "/panel/estudiantes",
          )
        }
      />
    </div>
  );
}
