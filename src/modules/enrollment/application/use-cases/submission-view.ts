import type { SubmissionDetail, SubmissionSummary } from "../ports/submission-repository";
import type { PlaceCatalog } from "../ports/place-catalog";

export type SubmissionSummaryView = SubmissionSummary & {
  readonly municipalityName: string;
};

export type SubmissionDetailView = SubmissionDetail & {
  readonly municipalityName: string;
};

export const withPlace = <T extends SubmissionSummary>(
  submission: T,
  places: PlaceCatalog,
): T & { municipalityName: string } => ({
  ...submission,
  municipalityName:
    places.find(submission.municipalityCode)?.municipalityName ?? submission.municipalityCode,
});
