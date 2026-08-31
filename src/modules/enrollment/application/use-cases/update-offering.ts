import type { Clock } from "@/shared/clock";
import { templateByCode } from "../../domain/form-template";
import { assertValidWindow, assertValidYear } from "../../domain/offering";
import type { Offering } from "../../domain/offering";
import {
  DuplicateOfferingError,
  OfferingHasSubmissionsError,
  OfferingNotFoundError,
} from "../../domain/errors";
import type { OfferingRepository, OfferingPatch } from "../ports/offering-repository";

type Deps = { offerings: OfferingRepository; clock: Clock };

const changesIdentity = (offering: Offering, patch: OfferingPatch): boolean =>
  (patch.templateCode !== undefined && patch.templateCode !== offering.templateCode) ||
  (patch.year !== undefined && patch.year !== offering.year) ||
  (patch.municipalityCode !== undefined && patch.municipalityCode !== offering.municipalityCode) ||
  (patch.modality !== undefined && patch.modality !== offering.modality);

export const updateOffering =
  ({ offerings, clock }: Deps) =>
  async (id: string, patch: OfferingPatch): Promise<Offering> => {
    const offering = await offerings.findById(id);
    if (!offering) throw new OfferingNotFoundError(id);

    if (changesIdentity(offering, patch)) {
      const submissions = await offerings.countSubmissions(id);
      if (submissions > 0) throw new OfferingHasSubmissionsError();

      const target = {
        templateCode: templateByCode(patch.templateCode ?? offering.templateCode).code,
        year: patch.year ?? offering.year,
        municipalityCode: patch.municipalityCode ?? offering.municipalityCode,
        modality: patch.modality ?? offering.modality,
      };
      if (await offerings.existsFor(target)) throw new DuplicateOfferingError();
    }

    const year = patch.year ?? offering.year;
    assertValidYear(year, clock.now());
    assertValidWindow(patch.opensAt ?? offering.opensAt, patch.closesAt ?? offering.closesAt);

    return offerings.update(id, patch);
  };
