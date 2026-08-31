import type { Clock } from "@/shared/clock";
import type { FormTemplateDefinition } from "../../domain/form-template";
import { templateByCode } from "../../domain/form-template";
import type { OfferingView } from "../../domain/offering";
import { OfferingNotFoundError, OfferingNotOpenError } from "../../domain/errors";
import type { OfferingRepository } from "../ports/offering-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { buildOfferingView, templateViewInput } from "./offering-view";

type Deps = { offerings: OfferingRepository; places: PlaceCatalog; clock: Clock };

export type OpenOffering = {
  readonly offering: OfferingView;
  readonly template: FormTemplateDefinition;
};

export const getOpenOffering =
  ({ offerings, places, clock }: Deps) =>
  async (offeringId: string): Promise<OpenOffering> => {
    const now = clock.now();
    const record = await offerings.findRecordById(offeringId);
    if (!record) throw new OfferingNotFoundError(offeringId);

    const offering = buildOfferingView(templateViewInput(record, places, now));
    if (offering.status !== "open") throw new OfferingNotOpenError(offeringId);

    return { offering, template: templateByCode(offering.templateCode) };
  };
