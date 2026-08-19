import type { PersonSummary } from "@/modules/access";
import styles from "./personas.module.scss";

type PeopleTableProps = {
  people: PersonSummary[];
  linkToDetail: boolean;
};

export function PeopleTable({ people, linkToDetail }: PeopleTableProps) {
  if (people.length === 0) {
    return <p>No hay personas que coincidan.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Correo</th>
          <th>Nombre</th>
          <th>Estado</th>
          <th>Rol</th>
          <th>Permisos</th>
        </tr>
      </thead>
      <tbody>
        {people.map((person) => (
          <tr key={person.id}>
            <td>
              {linkToDetail ? (
                <a href={`/panel/personas/${person.id}`}>{person.email}</a>
              ) : (
                person.email
              )}
            </td>
            <td>{person.displayName ?? "—"}</td>
            <td className={person.hasSignedIn ? undefined : styles.pending}>
              {person.status === "inactive"
                ? "Desactivada"
                : person.hasSignedIn
                  ? "Activa"
                  : "Sin ingresar todavía"}
            </td>
            <td>{person.role === "admin" ? "Administración" : "Miembro"}</td>
            <td>
              {person.role === "admin"
                ? "Todo"
                : person.permissionKeys.join(", ") || "Sin permisos"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
