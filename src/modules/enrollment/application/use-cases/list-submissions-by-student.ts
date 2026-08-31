import type { SubmissionRepository } from "../ports/submission-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { withPlace } from "./submission-view";
import type { SubmissionSummaryView } from "./submission-view";

type Deps = { submissions: SubmissionRepository; places: PlaceCatalog };

export const listSubmissionsByStudent =
  ({ submissions, places }: Deps) =>
  async (studentId: string): Promise<SubmissionSummaryView[]> => {
    const rows = await submissions.list({ studentId });
    return rows.map((row) => withPlace(row, places));
  };
