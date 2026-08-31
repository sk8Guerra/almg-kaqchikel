"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs } from "antd";
import styles from "./inscripciones.module.scss";

const TABS = [
  { key: "/panel/inscripciones", label: "Inscripciones" },
  { key: "/panel/inscripciones/convocatorias", label: "Convocatorias" },
  { key: "/panel/inscripciones/resumen", label: "Resumen" },
];

export function AreaTabs() {
  const pathname = usePathname();

  const activeKey =
    TABS.map((tab) => tab.key)
      .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
      .sort((a, b) => b.length - a.length)[0] ?? TABS[0].key;

  return (
    <Tabs
      className={styles.tabs}
      activeKey={activeKey}
      items={TABS.map((tab) => ({
        key: tab.key,
        label: <Link href={tab.key}>{tab.label}</Link>,
      }))}
    />
  );
}
