import { access, enrollment } from "@/composition/container";
import { OfferingForm } from "./offering-form";
import { OfferingsTable } from "./offerings-table";
import styles from "./convocatorias.module.scss";

export default async function OfferingsPage() {
  await access.authorize("offering:read");
  // Crear y editar son permisos distintos y acciones distintas: una sola bandera dejaba a
  // quien solo puede crear sin formulario, y a quien solo puede editar con uno que falla.
  const canCreate = await access.can("offering:create");
  const canEdit = await access.can("offering:update");

  const offerings = await enrollment.listOfferings();

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Convocatorias</h1>
        {canCreate ? <OfferingForm /> : null}
      </div>

      <OfferingsTable offerings={offerings} canEdit={canEdit} />
    </>
  );
}
