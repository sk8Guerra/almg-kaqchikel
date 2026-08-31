import { describe, expect, it } from "vitest";
import { TEMPLATES, templateByCode } from "@/modules/enrollment/domain/form-template";
import { UnknownTemplateError } from "@/modules/enrollment/domain/errors";
import { BASE_QUESTIONS } from "@/modules/enrollment/domain/questions";

describe("catálogo de plantillas (FR-001, FR-002, FR-031)", () => {
  it("hay exactamente seis plantillas, una por vía y nivel", () => {
    expect(TEMPLATES).toHaveLength(6);
    expect(TEMPLATES.map((t) => t.code).sort()).toEqual([
      "l1-avanzado",
      "l1-intermedio",
      "l1-principiante",
      "l2-avanzado",
      "l2-intermedio",
      "l2-principiante",
    ]);
  });

  it("las claves son únicas", () => {
    expect(new Set(TEMPLATES.map((t) => t.code)).size).toBe(TEMPLATES.length);
  });

  it("ninguna plantilla fija modalidad", () => {
    for (const template of TEMPLATES) {
      expect(template).not.toHaveProperty("modality");
    }
  });

  it("los documentos exigidos crecen con el nivel", () => {
    expect(templateByCode("l2-principiante").documents).toEqual([
      "identity_card",
      "commitment_letter",
      "enrollment_sheet",
    ]);
    expect(templateByCode("l2-intermedio").documents).toHaveLength(4);
    expect(templateByCode("l2-avanzado").documents).toEqual([
      "identity_card",
      "commitment_letter",
      "enrollment_sheet",
      "beginner_certificate",
      "intermediate_certificate",
    ]);
  });

  it("las seis comparten el mismo cuestionario base", () => {
    for (const template of TEMPLATES) {
      expect(template.questions).toBe(BASE_QUESTIONS);
    }
  });

  it("el cuestionario abre con el compromiso de modalidad y trae 22 preguntas más", () => {
    expect(BASE_QUESTIONS[0]?.id).toBe("modality_commitment");
    expect(BASE_QUESTIONS).toHaveLength(23);
  });

  it("cada pregunta está enunciada en kaqchikel y en español", () => {
    for (const question of BASE_QUESTIONS) {
      expect(question.labelKaqchikel.length).toBeGreaterThan(0);
      expect(question.labelSpanish.length).toBeGreaterThan(0);
    }
  });

  it("la residencia se presenta agrupada y en orden", () => {
    const ids = BASE_QUESTIONS.map((q) => q.id);
    const start = ids.indexOf("residence_department");
    expect(ids.slice(start, start + 4)).toEqual([
      "residence_department",
      "residence_municipality",
      "residence_zone",
      "home_address",
    ]);
  });

  it("una clave desconocida no resuelve a ninguna plantilla", () => {
    expect(() => templateByCode("l3-principiante")).toThrow(UnknownTemplateError);
  });
});
