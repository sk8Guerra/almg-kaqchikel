import { access } from "@/composition/container";
import { PanelActions } from "./panel-actions";
import styles from "./panel.module.scss";

export default async function PanelPage() {
  const user = await access.syncSignedInUser();
  const canReadUsers = await access.can("access:read");
  const areas = await access.listAccessibleModules();

  return (
    <>
      <h1>Panel</h1>

      <p>
        Sesión activa como <strong>{user.displayName ?? user.email}</strong>
      </p>

      {areas.length === 0 && (
        <p className={styles.notice}>
          Tu cuenta está activa pero todavía no tiene permisos asignados. Pide a una persona con rol
          de administración que te indique a qué áreas necesitas acceso.
        </p>
      )}

      <PanelActions canReadUsers={canReadUsers} />
    </>
  );
}
