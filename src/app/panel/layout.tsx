import { access } from "@/composition/container";
import { SessionControls } from "@/components/auth/session-controls";
import { PanelShell } from "@/components/app-shell/panel-shell";
import type { PanelNavItem } from "@/components/app-shell/panel-shell";
import { NAV_SEGMENTS, panelHref } from "./nav-routes";

type PanelLayoutProps = {
  children: React.ReactNode;
};

export default async function PanelLayout({ children }: PanelLayoutProps) {
  const user = await access.syncSignedInUser();
  const areas = await access.listAccessibleModules();

  const navItems: PanelNavItem[] = areas.map((area) => ({
    key: area.key,
    label: area.label,
    href: panelHref(NAV_SEGMENTS[area.key]),
    segment: NAV_SEGMENTS[area.key],
  }));

  return (
    <PanelShell
      navItems={navItems}
      userLabel={user.displayName ?? user.email}
      sessionControls={<SessionControls />}
    >
      {children}
    </PanelShell>
  );
}
