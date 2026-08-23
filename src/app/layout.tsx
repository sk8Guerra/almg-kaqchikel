import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "antd/dist/reset.css";
import { AntdConfig } from "@/components/app-shell/antd-config";
import { BRAND_TOKENS, asPixels } from "@/components/app-shell/theme-tokens";

export const metadata: Metadata = {
  title: "ALMG Kaqchikel",
  description: "Academia de Lenguas Mayas de Guatemala — Kaqchikel",
};

const clerkAppearance = {
  variables: {
    colorPrimary: BRAND_TOKENS.colorPrimary,
    borderRadius: asPixels(BRAND_TOKENS.borderRadius),
    fontSize: asPixels(BRAND_TOKENS.fontSize),
    fontFamily: BRAND_TOKENS.fontFamily,
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <ClerkProvider localization={esES} appearance={clerkAppearance}>
          <AntdRegistry>
            <AntdConfig>{children}</AntdConfig>
          </AntdRegistry>
        </ClerkProvider>
      </body>
    </html>
  );
}
