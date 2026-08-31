import type { Clock } from "@/shared/clock";
import { buildOfferingView, templateViewInput } from "./offering-view";
import type { OfferingView } from "../../domain/offering";
import type { OfferingRepository } from "../ports/offering-repository";
import type { PlaceCatalog } from "../ports/place-catalog";

type Deps = { offerings: OfferingRepository; places: PlaceCatalog; clock: Clock };

export const listOpenOfferings =
  ({ offerings, places, clock }: Deps) =>
  async (): Promise<OfferingView[]> => {
    const now = clock.now();
    const records = await offerings.listOpen(now);
    return records.map((record) => buildOfferingView(templateViewInput(record, places, now)));
  };
