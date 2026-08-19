import { SignIn } from "@clerk/nextjs";
import styles from "./ingresar.module.scss";

export default function IngresarPage() {
  return (
    <main className={styles.centered}>
      <SignIn />
    </main>
  );
}
