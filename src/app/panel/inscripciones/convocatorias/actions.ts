"use server";

import { revalidatePath } from "next/cache";
import { access } from "@/composition/container";
import { enrollment } from "@/composition/container";
import { PermissionDeniedError } from "@/modules/access";
import type { Modality } from "@/modules/enrollment";
import { localDateTime } from "./local-time";
import {
  DuplicateOfferingError,
  InvalidOfferingWindowError,
  InvalidOfferingYearError,
  OfferingHasSubmissionsError,
  OfferingNotFoundError,
  UnknownTemplateError,
} from "@/modules/enrollment";

export type ActionResult = {
  ok: boolean;
  message: string;
};

const describe = (error: unknown): ActionResult => {
  if (error instanceof PermissionDeniedError) {
    return { ok: false, message: "No tienes permiso para gestionar convocatorias." };
  }
  if (error instanceof UnknownTemplateError) {
    return { ok: false, message: "Ese formulario no existe en el catálogo." };
  }
  if (error instanceof InvalidOfferingWindowError) {
    return { ok: false, message: "El cierre debe ser posterior a la apertura." };
  }
  if (error instanceof InvalidOfferingYearError) {
    return { ok: false, message: "El año no es válido." };
  }
  if (error instanceof DuplicateOfferingError) {
    return {
      ok: false,
      message: "Ya existe una convocatoria para ese curso, año, municipio y modalidad.",
    };
  }
  if (error instanceof OfferingHasSubmissionsError) {
    return {
      ok: false,
      message:
        "Esa convocatoria ya tiene inscripciones: no se puede cambiar curso, año ni municipio.",
    };
  }
  if (error instanceof OfferingNotFoundError) {
    return { ok: false, message: "Esa convocatoria ya no existe." };
  }
  throw error;
};

type OfferingInput = {
  templateCode: string;
  year: number;
  municipalityCode: string;
  modality: Modality;
  opensOn: string;
  opensAtTime: string;
  closesOn: string;
  closesAtTime: string;
  classesStartOn: string | null;
  scheduleLabel: string | null;
};

export async function createOfferingAction(input: OfferingInput): Promise<ActionResult> {
  try {
    const actor = await access.authorize("enrollment:create");
    await enrollment.createOffering({
      templateCode: input.templateCode,
      year: input.year,
      municipalityCode: input.municipalityCode,
      modality: input.modality,
      opensAt: localDateTime(input.opensOn, input.opensAtTime),
      closesAt: localDateTime(input.closesOn, input.closesAtTime),
      classesStartOn: input.classesStartOn,
      scheduleLabel: input.scheduleLabel,
      createdById: actor.id,
    });
    revalidatePath("/panel/inscripciones/convocatorias");
    revalidatePath("/");
    return { ok: true, message: "Convocatoria creada." };
  } catch (error) {
    return describe(error);
  }
}

export async function updateOfferingAction(
  id: string,
  input: OfferingInput,
): Promise<ActionResult> {
  try {
    await access.authorize("enrollment:update");
    await enrollment.updateOffering(id, {
      year: input.year,
      municipalityCode: input.municipalityCode,
      modality: input.modality,
      opensAt: localDateTime(input.opensOn, input.opensAtTime),
      closesAt: localDateTime(input.closesOn, input.closesAtTime),
      classesStartOn: input.classesStartOn,
      scheduleLabel: input.scheduleLabel,
    });
    revalidatePath("/panel/inscripciones/convocatorias");
    revalidatePath("/");
    return { ok: true, message: "Convocatoria actualizada." };
  } catch (error) {
    return describe(error);
  }
}

export async function setOfferingActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await access.authorize("enrollment:update");
    await enrollment.setOfferingActive(id, isActive);
    revalidatePath("/panel/inscripciones/convocatorias");
    revalidatePath("/");
    return {
      ok: true,
      message: isActive ? "Convocatoria reabierta." : "Convocatoria cerrada.",
    };
  } catch (error) {
    return describe(error);
  }
}
