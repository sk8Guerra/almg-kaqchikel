import Link from "next/link";
import { access } from "@/composition/container";
import { SessionControls } from "@/components/auth/session-controls";
import { PanelActions } from "./panel-actions";
import styles from "./panel.module.scss";

export default async function PanelPage() {
  const user = await access.syncSignedInUser();
  const canReadUsers = await access.can("access:read");
  const canManagePeople = await access.can("access:read");
  const hasAnyAccess = canReadUsers || canManagePeople;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Panel</h1>
        <SessionControls />
      </header>

      <p>
        Sesión activa como <strong>{user.displayName ?? user.email}</strong>
      </p>

      {canManagePeople && (
        <nav className={styles.nav}>
          <Link className={styles.navLink} href="/panel/personas">
            Gestionar personas
          </Link>
        </nav>
      )}

      {!hasAnyAccess && (
        <p className={styles.notice}>
          Tu cuenta está activa pero todavía no tiene permisos asignados. Pide a una persona con rol
          de administración que te indique a qué áreas necesitas acceso.
        </p>
      )}

      <PanelActions canReadUsers={canReadUsers} />
    </main>
  );
}
