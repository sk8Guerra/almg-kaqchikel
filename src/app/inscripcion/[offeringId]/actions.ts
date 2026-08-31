"use server";

import { enrollment, geography } from "@/composition/container";
import type { AnswerProblem, Answers, DocumentType, UploadTicket } from "@/modules/enrollment";
import {
  AlreadyEnrolledError,
  InvalidAnswersError,
  InvalidDocumentError,
  MissingDocumentError,
  ModalityCommitmentRefusedError,
  OfferingNotFoundError,
  OfferingNotOpenError,
  UnknownTemplateError,
} from "@/modules/enrollment";
import { InvalidDocumentIdError } from "@/modules/students";
import type { Municipality } from "@/modules/geography";

export type ActionResult<T> =
  { ok: true; value: T } | { ok: false; message: string; problems?: AnswerProblem[] };

const failure = (message: string, problems?: AnswerProblem[]): ActionResult<never> => ({
  ok: false,
  message,
  problems,
});

const describe = (error: unknown): ActionResult<never> => {
  if (error instanceof OfferingNotOpenError || error instanceof OfferingNotFoundError) {
    return failure("La inscripción de este curso ya cerró.");
  }
  if (error instanceof ModalityCommitmentRefusedError) {
    return failure(
      "Para inscribirte debes comprometerte a recibir el curso en la modalidad indicada.",
    );
  }
  if (error instanceof InvalidAnswersError) {
    return failure(
      "Revisa las respuestas señaladas: hay preguntas sin responder o con datos inválidos.",
      error.problems as AnswerProblem[],
    );
  }
  if (error instanceof MissingDocumentError) {
    return failure("Falta adjuntar un documento obligatorio.");
  }
  if (error instanceof InvalidDocumentError) {
    return failure("El archivo debe ser un PDF de menos de 10 MB.");
  }
  if (error instanceof InvalidDocumentIdError) {
    return failure("El DPI debe tener 13 dígitos.");
  }
  if (error instanceof AlreadyEnrolledError) {
    return failure("Ya hay una inscripción registrada con ese DPI para este curso.");
  }
  if (error instanceof UnknownTemplateError) {
    return failure("Ese formulario ya no está disponible.");
  }
  throw error;
};

export async function loadMunicipalitiesAction(
  departmentCode: string,
): Promise<ActionResult<Municipality[]>> {
  return { ok: true, value: await geography.listMunicipalities(departmentCode) };
}

export async function loadZonesAction(municipalityCode: string): Promise<ActionResult<string[]>> {
  return { ok: true, value: await geography.listZones(municipalityCode) };
}

export async function requestUploadTicketAction(input: {
  offeringId: string;
  draftId: string;
  type: DocumentType;
  contentType: string;
}): Promise<ActionResult<UploadTicket>> {
  try {
    return { ok: true, value: await enrollment.requestUploadTicket(input) };
  } catch (error) {
    return describe(error);
  }
}

export async function submitEnrollmentAction(input: {
  offeringId: string;
  draftId: string;
  answers: Answers;
  documents: readonly { type: DocumentType; key: string }[];
}): Promise<ActionResult<{ redirectTo: string; submittedAt: string }>> {
  try {
    await enrollment.submitEnrollment(input);
    return {
      ok: true,
      value: {
        redirectTo: `/inscripcion/${input.offeringId}/gracias`,
        submittedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return describe(error);
  }
}
