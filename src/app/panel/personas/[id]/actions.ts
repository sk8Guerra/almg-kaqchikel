"use server";

import { revalidatePath } from "next/cache";
import { access } from "@/composition/container";
import type { PermissionKey, UserId, UserRole } from "@/modules/access";
import {
  AdminRequiredError,
  LastAdministratorError,
  MemberWithoutPermissionsError,
  PermissionDeniedError,
  SelfDeactivationError,
  SelfDemotionError,
} from "@/modules/access";

// Las claves access:create, access:update y access:delete no están en el catálogo
// concedible (FR-018, FR-019), así que estas comprobaciones solo las pasa un
// administrador. La negativa definitiva vive en el caso de uso, con requireAdmin.

export type ActionResult = {
  ok: boolean;
  message: string;
};

const handle = async (work: () => Promise<void>, success: string): Promise<ActionResult> => {
  try {
    await work();
    revalidatePath("/panel/personas");
    return { ok: true, message: success };
  } catch (error) {
    if (error instanceof PermissionDeniedError || error instanceof AdminRequiredError) {
      return { ok: false, message: "Solo una persona con rol de administración puede hacer esto." };
    }
    if (error instanceof LastAdministratorError) {
      return { ok: false, message: "No puedes dejar el sistema sin administradores." };
    }
    if (error instanceof SelfDemotionError) {
      return { ok: false, message: "No puedes quitarte a ti mismo el rol de administración." };
    }
    if (error instanceof SelfDeactivationError) {
      return { ok: false, message: "No puedes desactivar tu propia cuenta." };
    }
    if (error instanceof MemberWithoutPermissionsError) {
      return { ok: false, message: "Un miembro necesita al menos un permiso." };
    }
    throw error;
  }
};

export async function changePermissionsAction(formData: FormData): Promise<ActionResult> {
  const targetId = String(formData.get("targetId")) as UserId;
  const grant = formData.getAll("grant").map(String) as PermissionKey[];
  const revoke = formData.getAll("revoke").map(String) as PermissionKey[];

  return handle(async () => {
    const actor = await access.authorize("access:update");
    await access.changePermissions({ targetId, grant, revoke, actor });
  }, "Permisos actualizados.");
}

export async function changeRoleAction(formData: FormData): Promise<ActionResult> {
  const targetId = String(formData.get("targetId")) as UserId;
  const role = (formData.get("role") === "admin" ? "admin" : "member") as UserRole;
  const permissionKeys = formData.getAll("permissionKeys").map(String) as PermissionKey[];

  return handle(async () => {
    const actor = await access.authorize("access:update");
    await access.changeRole({ targetId, role, permissionKeys, actor });
  }, "Rol actualizado.");
}

export async function deactivateAction(formData: FormData): Promise<ActionResult> {
  const targetId = String(formData.get("targetId")) as UserId;

  return handle(async () => {
    const actor = await access.authorize("access:delete");
    await access.deactivatePerson({ targetId, actor });
  }, "Persona desactivada.");
}

export async function reactivateAction(formData: FormData): Promise<ActionResult> {
  const targetId = String(formData.get("targetId")) as UserId;

  return handle(async () => {
    const actor = await access.authorize("access:update");
    await access.reactivatePerson({ targetId, actor });
  }, "Persona reactivada.");
}
