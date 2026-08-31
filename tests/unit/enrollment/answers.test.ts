import { describe, expect, it } from "vitest";
import { templateByCode } from "@/modules/enrollment/domain/form-template";
import { commitmentAccepted, validateAnswers } from "@/modules/enrollment/domain/answers";
import type { Answers } from "@/modules/enrollment/domain/answers";
import { VALID_ANSWERS } from "./doubles";

const template = templateByCode("l2-avanzado");

const withAnswers = (patch: Record<string, string>): Answers => ({ ...VALID_ANSWERS, ...patch });

describe("validación de respuestas (FR-024, FR-027)", () => {
  it("una respuesta completa no tiene problemas", () => {
    expect(validateAnswers(template, VALID_ANSWERS)).toEqual([]);
  });

  it("señala todas las obligatorias faltantes de una sola vez", () => {
    const problems = validateAnswers(
      template,
      withAnswers({ first_names: "", phone: "", occupation: "   " }),
    );

    expect(problems).toHaveLength(3);
    expect(problems.map((p) => p.questionId).sort()).toEqual([
      "first_names",
      "occupation",
      "phone",
    ]);
    expect(problems.every((p) => p.reason === "missing")).toBe(true);
  });

  it("las preguntas opcionales vacías no son un problema", () => {
    const problems = validateAnswers(
      template,
      withAnswers({ institution_name: "", institution_address: "", residence_zone: "" }),
    );

    expect(problems).toEqual([]);
  });

  it("rechaza un DPI que no tiene 13 dígitos y acepta uno con espacios", () => {
    expect(validateAnswers(template, withAnswers({ document_id: "1234" }))).toEqual([
      { questionId: "document_id", reason: "invalid" },
    ]);
    expect(validateAnswers(template, withAnswers({ document_id: "2547 85412 0101" }))).toEqual([]);
  });

  it("rechaza un correo mal formado", () => {
    expect(validateAnswers(template, withAnswers({ email: "sin-arroba" }))).toEqual([
      { questionId: "email", reason: "invalid" },
    ]);
  });

  it("rechaza una opción que no está en la lista", () => {
    expect(validateAnswers(template, withAnswers({ sex: "otro" }))).toEqual([
      { questionId: "sex", reason: "invalid" },
    ]);
  });

  it("admite varios idiomas separados por comas en lengua materna", () => {
    const answers = withAnswers({
      mother_tongue: "Kaqchikel, K'iche'",
      second_language: "Castellano, Inglés",
    });

    expect(validateAnswers(template, answers)).toEqual([]);
  });

  it("distingue el compromiso aceptado del rechazado", () => {
    expect(commitmentAccepted(VALID_ANSWERS)).toBe(true);
    expect(commitmentAccepted(withAnswers({ modality_commitment: "no" }))).toBe(false);
  });
});
