"use server";

import { access } from "@/composition/container";
import { PermissionDeniedError } from "@/modules/access";

export type ListUsersResult = {
  ok: boolean;
  message: string;
};

export async function listUsers(): Promise<ListUsersResult> {
  try {
    const user = await access.authorize("access:read");
    return { ok: true, message: `Autorizado como ${user.email}` };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { ok: false, message: "No tienes permiso para ver personas." };
    }
    throw error;
  }
}
