import type { CalendarDate } from "@/shared/calendar-date";
import type { Clock } from "@/shared/clock";
import { templateByCode } from "../../domain/form-template";
import type { TemplateCode } from "../../domain/form-template";
import { assertValidWindow, assertValidYear } from "../../domain/offering";
import type { Offering } from "../../domain/offering";
import { DuplicateOfferingError } from "../../domain/errors";
import type { Modality } from "../../domain/values";
import type { OfferingRepository } from "../ports/offering-repository";

type Deps = { offerings: OfferingRepository; clock: Clock };

type Input = {
  templateCode: string;
  year: number;
  municipalityCode: string;
  modality: Modality;
  opensAt: Date;
  closesAt: Date;
  classesStartOn?: CalendarDate | null;
  scheduleLabel?: string | null;
  createdById: string;
};

export const createOffering =
  ({ offerings, clock }: Deps) =>
  async (input: Input): Promise<Offering> => {
    const template = templateByCode(input.templateCode);
    assertValidYear(input.year, clock.now());
    assertValidWindow(input.opensAt, input.closesAt);

    const duplicated = await offerings.existsFor({
      templateCode: template.code as TemplateCode,
      year: input.year,
      municipalityCode: input.municipalityCode,
      modality: input.modality,
    });
    if (duplicated) throw new DuplicateOfferingError();

    return offerings.create({
      templateCode: template.code,
      year: input.year,
      municipalityCode: input.municipalityCode,
      modality: input.modality,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      classesStartOn: input.classesStartOn ?? null,
      scheduleLabel: input.scheduleLabel ?? null,
      createdById: input.createdById,
    });
  };
