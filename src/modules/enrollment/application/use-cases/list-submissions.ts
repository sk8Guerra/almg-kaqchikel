import type { SubmissionFilter, SubmissionRepository } from "../ports/submission-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { withPlace } from "./submission-view";
import type { SubmissionSummaryView } from "./submission-view";

type Deps = { submissions: SubmissionRepository; places: PlaceCatalog };

export const listSubmissions =
  ({ submissions, places }: Deps) =>
  async (filter: SubmissionFilter = {}): Promise<SubmissionSummaryView[]> => {
    const rows = await submissions.list(filter);
    return rows.map((row) => withPlace(row, places));
  };
