"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Layout, Menu } from "antd";
import { AppstoreOutlined, HomeOutlined } from "@ant-design/icons";
import styles from "./panel-shell.module.scss";

const { Sider, Content } = Layout;

export const PANEL_HOME_KEY = "home";

export type PanelNavItem = {
  key: string;
  label: string;
  href: string;
  segment: string;
};

type PanelShellProps = {
  navItems: PanelNavItem[];
  userLabel: string;
  sessionControls: React.ReactNode;
  children: React.ReactNode;
};

export function PanelShell({ navItems, userLabel, sessionControls, children }: PanelShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const segment = useSelectedLayoutSegment();

  const activeItem = navItems.find((item) => item.segment === segment);
  const selectedKey = activeItem?.key ?? (segment === null ? PANEL_HOME_KEY : null);

  const menuItems = [
    {
      key: PANEL_HOME_KEY,
      icon: <HomeOutlined />,
      label: <Link href="/panel">Inicio</Link>,
    },
    ...navItems.map((item) => ({
      key: item.key,
      icon: <AppstoreOutlined />,
      label: <Link href={item.href}>{item.label}</Link>,
    })),
  ];

  return (
    <Layout className={styles.shell}>
      <Sider
        theme="light"
        breakpoint="md"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        onBreakpoint={setCollapsed}
        trigger={null}
        className={styles.sider}
      >
        <div className={collapsed ? `${styles.brand} ${styles.brandCollapsed}` : styles.brand}>
          {collapsed ? "ALMG" : "ALMG Kaqchikel"}
        </div>

        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={selectedKey === null ? [] : [selectedKey]}
        />

        <div
          className={
            collapsed ? `${styles.siderFooter} ${styles.siderFooterCollapsed}` : styles.siderFooter
          }
        >
          {sessionControls}
          {collapsed ? null : <span className={styles.userLabel}>{userLabel}</span>}
        </div>
      </Sider>

      <Layout>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
