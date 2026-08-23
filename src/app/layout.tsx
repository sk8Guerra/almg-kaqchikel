import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdConfig } from "@/components/app-shell/antd-config";

export const metadata: Metadata = {
  title: "ALMG Kaqchikel",
  description: "Academia de Lenguas Mayas de Guatemala — Kaqchikel",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <ClerkProvider localization={esES}>
          <AntdRegistry>
            <AntdConfig>{children}</AntdConfig>
          </AntdRegistry>
        </ClerkProvider>
      </body>
    </html>
  );
}
