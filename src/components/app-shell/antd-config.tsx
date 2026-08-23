"use client";

import { App, ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import esES from "antd/locale/es_ES";

const theme: ThemeConfig = {
  token: {
    colorPrimary: "#0f766e",
    colorLink: "#0f766e",
    borderRadius: 6,
    fontSize: 15,
    sizeStep: 4,
  },
  components: {
    Layout: {
      siderBg: "#ffffff",
      bodyBg: "#f7f8f8",
    },
    Menu: {
      itemBg: "#ffffff",
      itemSelectedBg: "#e6f2f0",
      itemSelectedColor: "#0f766e",
    },
  },
};

type AntdConfigProps = {
  children: React.ReactNode;
};

export function AntdConfig({ children }: AntdConfigProps) {
  return (
    <ConfigProvider locale={esES} theme={theme}>
      <App component={false}>{children}</App>
    </ConfigProvider>
  );
}
