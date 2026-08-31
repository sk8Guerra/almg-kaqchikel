import { OfferingNotFoundError } from "../../domain/errors";
import type { OfferingRepository } from "../ports/offering-repository";

type Deps = { offerings: OfferingRepository };

export const setOfferingActive =
  ({ offerings }: Deps) =>
  async (id: string, isActive: boolean): Promise<void> => {
    const offering = await offerings.findById(id);
    if (!offering) throw new OfferingNotFoundError(id);
    await offerings.setActive(id, isActive);
  };
