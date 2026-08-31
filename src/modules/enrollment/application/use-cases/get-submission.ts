import { SubmissionNotFoundError } from "../../domain/errors";
import type { SubmissionRepository } from "../ports/submission-repository";
import type { PlaceCatalog } from "../ports/place-catalog";
import { withPlace } from "./submission-view";
import type { SubmissionDetailView } from "./submission-view";

type Deps = { submissions: SubmissionRepository; places: PlaceCatalog };

export const getSubmission =
  ({ submissions, places }: Deps) =>
  async (id: string): Promise<SubmissionDetailView> => {
    const found = await submissions.findById(id);
    if (!found) throw new SubmissionNotFoundError(id);
    return withPlace(found, places);
  };
