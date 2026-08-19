"use client";

import { useState } from "react";
import { createPersonAction } from "./actions";
import { PermissionMatrix } from "./permission-matrix";
import styles from "./personas.module.scss";

export function CreatePersonForm() {
  const [role, setRole] = useState<"admin" | "member">("member");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submit(formData: FormData) {
    const result = await createPersonAction(formData);
    setFeedback(result.message);
  }

  return (
    <form action={submit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" required placeholder="persona@almg.gt" />
      </div>

      <fieldset className={styles.field}>
        <legend>Rol</legend>
        <label>
          <input
            type="radio"
            name="role"
            value="admin"
            checked={role === "admin"}
            onChange={() => setRole("admin")}
          />{" "}
          Administración — puede todo, en todas las áreas
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="member"
            checked={role === "member"}
            onChange={() => setRole("member")}
          />{" "}
          Miembro — solo lo que se le indique
        </label>
      </fieldset>

      {role === "member" ? (
        <fieldset className={styles.field}>
          <legend>Permisos</legend>
          <PermissionMatrix name="permissionKeys" />
        </fieldset>
      ) : (
        <p className={styles.hint}>
          Un administrador no necesita permisos: los tiene todos, incluidas las áreas que se
          agreguen después.
        </p>
      )}

      <button type="submit">Dar de alta</button>

      {feedback && (
        <p role="status" className={styles.feedback}>
          {feedback}
        </p>
      )}
    </form>
  );
}
