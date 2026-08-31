import { findPlace } from "../../domain/lookup";
import type { Place } from "../../domain/place";

export const getPlace =
  () =>
  (municipalityCode: string): Place | null =>
    findPlace(municipalityCode);
