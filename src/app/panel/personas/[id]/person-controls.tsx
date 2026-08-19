"use client";

import { useState } from "react";
import { PermissionMatrix } from "../permission-matrix";
import { changeRoleAction, deactivateAction, reactivateAction } from "./actions";
import styles from "../personas.module.scss";

type PersonControlsProps = {
  personId: string;
  role: "admin" | "member";
  isActive: boolean;
  permissionKeys: string[];
};

export function PersonControls({ personId, role, isActive, permissionKeys }: PersonControlsProps) {
  const [nextRole, setNextRole] = useState(role);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <section className={styles.actions}>
      <form
        action={async (formData) => setFeedback((await changeRoleAction(formData)).message)}
        className={styles.form}
      >
        <input type="hidden" name="targetId" value={personId} />

        <fieldset className={styles.field}>
          <legend>Rol</legend>
          <label>
            <input
              type="radio"
              name="role"
              value="admin"
              checked={nextRole === "admin"}
              onChange={() => setNextRole("admin")}
            />{" "}
            Administración
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="member"
              checked={nextRole === "member"}
              onChange={() => setNextRole("member")}
            />{" "}
            Miembro
          </label>
        </fieldset>

        {nextRole === "member" ? (
          <fieldset className={styles.field}>
            <legend>Permisos</legend>
            <PermissionMatrix name="permissionKeys" checked={permissionKeys} />
          </fieldset>
        ) : (
          <p className={styles.hint}>
            Un administrador tiene todos los permisos, incluidas las áreas que se agreguen después.
          </p>
        )}

        <button type="submit">Guardar cambios</button>
      </form>

      <form
        action={async (formData) =>
          setFeedback(
            (await (isActive ? deactivateAction(formData) : reactivateAction(formData))).message,
          )
        }
      >
        <input type="hidden" name="targetId" value={personId} />
        <button type="submit">{isActive ? "Desactivar" : "Reactivar"}</button>
      </form>

      {feedback && (
        <p role="status" className={styles.feedback}>
          {feedback}
        </p>
      )}
    </section>
  );
}
