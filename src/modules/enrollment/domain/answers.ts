import { COMMITMENT_QUESTION_ID } from "./questions";
import type { Question, QuestionId } from "./questions";
import type { FormTemplateDefinition } from "./form-template";

export type Answers = Readonly<Record<QuestionId, string>>;

export type AnswerProblem = {
  readonly questionId: QuestionId;
  readonly reason: "missing" | "invalid";
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const digitsOnly = (value: string): string => value.replace(/\D/g, "");

const isValidValue = (question: Question, value: string): boolean => {
  switch (question.kind) {
    case "email":
      return EMAIL_SHAPE.test(value);
    case "document-id":
      return digitsOnly(value).length === 13;
    case "phone":
      return digitsOnly(value).length >= 8 && digitsOnly(value).length <= 15;
    case "commitment":
    case "choice":
      return (question.options ?? []).some((option) => option.value === value);
    default:
      return true;
  }
};

export const validateAnswers = (
  template: FormTemplateDefinition,
  answers: Answers,
): AnswerProblem[] => {
  const problems: AnswerProblem[] = [];

  for (const question of template.questions) {
    const raw = answers[question.id];
    const value = typeof raw === "string" ? raw.trim() : "";

    if (value === "") {
      if (question.required) problems.push({ questionId: question.id, reason: "missing" });
      continue;
    }

    if (!isValidValue(question, value)) {
      problems.push({ questionId: question.id, reason: "invalid" });
    }
  }

  return problems;
};

export const commitmentAccepted = (answers: Answers): boolean =>
  answers[COMMITMENT_QUESTION_ID] === "yes";

export const answerOf = (answers: Answers, questionId: QuestionId): string =>
  (answers[questionId] ?? "").trim();
