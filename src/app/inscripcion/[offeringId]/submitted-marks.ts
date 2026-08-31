const STORAGE_KEY = "almg.enrollment.submitted";

export type SubmittedMark = {
  readonly offeringId: string;
  readonly submittedAt: string;
};

const isMark = (value: unknown): value is SubmittedMark =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as SubmittedMark).offeringId === "string" &&
  typeof (value as SubmittedMark).submittedAt === "string";

export const parseSubmittedMarks = (raw: string | null): SubmittedMark[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMark) : [];
  } catch {
    return [];
  }
};

export const subscribeToSubmittedMarks = (onChange: () => void): (() => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export const submittedMarksSnapshot = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const serverSubmittedMarksSnapshot = (): string | null => null;

export const rememberSubmission = (offeringId: string, submittedAt: Date): void => {
  if (typeof window === "undefined") return;
  const marks = parseSubmittedMarks(submittedMarksSnapshot()).filter(
    (mark) => mark.offeringId !== offeringId,
  );
  const next = [...marks, { offeringId, submittedAt: submittedAt.toISOString() }];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
};
