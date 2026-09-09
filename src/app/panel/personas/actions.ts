"use server";

import { revalidatePath } from "next/cache";
import { access } from "@/composition/container";
import type { PermissionKey } from "@/modules/access";
import {
  AdminRequiredError,
  MemberWithoutPermissionsError,
  EmailAlreadyRegisteredError,
  IdentityCreationFailedError,
  InvalidEmailError,
  PermissionDeniedError,
} from "@/modules/access";

// Las claves access:create, access:update y access:delete no están en el catálogo
// concedible (FR-018, FR-019), así que estas comprobaciones solo las pasa un
// administrador. La negativa definitiva vive en el caso de uso, con requireAdmin.

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function createPersonAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const role = formData.get("role") === "admin" ? ("admin" as const) : ("member" as const);
  const permissionKeys = formData.getAll("permissionKeys").map(String) as PermissionKey[];

  try {
    const actor = await access.authorize("access:create");
    const person = await access.createPerson({ email, role, permissionKeys, actor });
    revalidatePath("/panel/personas");
    return { ok: true, message: `${person.email} quedó registrada. Avísale que ya puede entrar.` };
  } catch (error) {
    if (error instanceof PermissionDeniedError || error instanceof AdminRequiredError) {
      return { ok: false, message: "No tienes permiso para gestionar personas." };
    }
    if (error instanceof MemberWithoutPermissionsError) {
      return { ok: false, message: "Un miembro necesita al menos un permiso." };
    }
    if (error instanceof EmailAlreadyRegisteredError) {
      return { ok: false, message: "Ese correo ya está registrado." };
    }
    if (error instanceof InvalidEmailError) {
      return { ok: false, message: "El correo no tiene un formato válido." };
    }
    if (error instanceof IdentityCreationFailedError) {
      return {
        ok: false,
        message: "No se pudo crear la cuenta. Intenta de nuevo en unos minutos.",
      };
    }
    throw error;
  }
}
