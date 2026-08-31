import type { EnrollmentSummary, SubmissionRepository } from "../ports/submission-repository";
import type { PlaceCatalog } from "../ports/place-catalog";

type Deps = { submissions: SubmissionRepository; places: PlaceCatalog };

type Input = { year?: number; offeringId?: string };

export type EnrollmentSummaryView = Omit<EnrollmentSummary, "byMunicipality"> & {
  readonly byMunicipality: readonly { readonly name: string; readonly count: number }[];
};

export const summarizeEnrollments =
  ({ submissions, places }: Deps) =>
  async (filter: Input = {}): Promise<EnrollmentSummaryView> => {
    const summary = await submissions.summarize(filter);

    return {
      ...summary,
      byMunicipality: summary.byMunicipality.map((entry) => ({
        name: places.find(entry.code)?.municipalityName ?? entry.code,
        count: entry.count,
      })),
    };
  };
