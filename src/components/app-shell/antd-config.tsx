"use client";

import { App, ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import esES from "antd/locale/es_ES";
import { BRAND_TOKENS } from "./theme-tokens";

const theme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_TOKENS.colorPrimary,
    colorLink: BRAND_TOKENS.colorPrimary,
    borderRadius: BRAND_TOKENS.borderRadius,
    fontSize: BRAND_TOKENS.fontSize,
    sizeStep: 4,
  },
  components: {
    Layout: {
      siderBg: BRAND_TOKENS.surface,
      bodyBg: BRAND_TOKENS.canvas,
    },
    Menu: {
      itemBg: BRAND_TOKENS.surface,
      itemSelectedBg: BRAND_TOKENS.colorPrimarySoft,
      itemSelectedColor: BRAND_TOKENS.colorPrimary,
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
