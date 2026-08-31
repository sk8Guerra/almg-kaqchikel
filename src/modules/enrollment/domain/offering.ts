import { InvalidOfferingWindowError, InvalidOfferingYearError } from "./errors";
import type { FormTemplateDefinition, TemplateCode } from "./form-template";
import type { CourseLevel, LanguageTrack, Modality } from "./values";

export type OfferingStatus = "scheduled" | "open" | "closed";

export type Offering = {
  readonly id: string;
  readonly templateCode: TemplateCode;
  readonly year: number;
  readonly municipalityCode: string;
  readonly modality: Modality;
  readonly opensAt: Date;
  readonly closesAt: Date;
  readonly classesStartOn: Date | null;
  readonly scheduleLabel: string | null;
  readonly isActive: boolean;
  readonly createdById: string;
};

export type OfferingView = Offering & {
  readonly templateNameKaqchikel: string;
  readonly templateNameSpanish: string;
  readonly track: LanguageTrack;
  readonly level: CourseLevel;
  readonly municipalityName: string;
  readonly departmentName: string;
  readonly status: OfferingStatus;
  readonly submissionCount: number;
};

export const MIN_OFFERING_YEAR = 2020;

export const offeringStatus = (
  offering: Pick<Offering, "opensAt" | "closesAt" | "isActive">,
  now: Date,
): OfferingStatus => {
  if (!offering.isActive) return "closed";
  if (now.getTime() < offering.opensAt.getTime()) return "scheduled";
  if (now.getTime() >= offering.closesAt.getTime()) return "closed";
  return "open";
};

export const isOfferingOpen = (
  offering: Pick<Offering, "opensAt" | "closesAt" | "isActive">,
  now: Date,
): boolean => offeringStatus(offering, now) === "open";

export const buildOfferingView = (input: {
  offering: Offering;
  submissionCount: number;
  template: FormTemplateDefinition;
  municipalityName: string;
  departmentName: string;
  now: Date;
}): OfferingView => ({
  ...input.offering,
  templateNameKaqchikel: input.template.nameKaqchikel,
  templateNameSpanish: input.template.nameSpanish,
  track: input.template.track,
  level: input.template.level,
  municipalityName: input.municipalityName,
  departmentName: input.departmentName,
  status: offeringStatus(input.offering, input.now),
  submissionCount: input.submissionCount,
});

export const assertValidWindow = (opensAt: Date, closesAt: Date): void => {
  if (closesAt.getTime() <= opensAt.getTime()) throw new InvalidOfferingWindowError();
};

export const assertValidYear = (year: number, now: Date): void => {
  const maximum = now.getFullYear() + 2;
  if (!Number.isInteger(year) || year < MIN_OFFERING_YEAR || year > maximum) {
    throw new InvalidOfferingYearError(year);
  }
};
