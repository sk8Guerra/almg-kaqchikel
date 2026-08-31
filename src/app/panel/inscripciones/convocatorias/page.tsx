import { access, enrollment } from "@/composition/container";
import { OfferingForm } from "./offering-form";
import { OfferingsTable } from "./offerings-table";
import styles from "../inscripciones.module.scss";

export default async function OfferingsPage() {
  await access.authorize("enrollment:read");
  const canEdit = await access.can("enrollment:update");

  const offerings = await enrollment.listOfferings();

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Convocatorias</h1>
        {canEdit ? <OfferingForm /> : null}
      </div>

      <OfferingsTable offerings={offerings} canEdit={canEdit} />
    </>
  );
}
