import type { Clock } from "@/shared/clock";
import type { OfferingView } from "../../domain/offering";
import type { OfferingFilter, OfferingRepository } from "../ports/offering-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { buildOfferingView, templateViewInput } from "./offering-view";

type Deps = { offerings: OfferingRepository; places: PlaceCatalog; clock: Clock };

export const listOfferings =
  ({ offerings, places, clock }: Deps) =>
  async (filter: OfferingFilter = {}): Promise<OfferingView[]> => {
    const now = clock.now();
    const records = await offerings.list(filter);
    return records.map((record) => buildOfferingView(templateViewInput(record, places, now)));
  };
