import type { PeopleFilter, PersonSummary, UserRepository } from "../ports/user-repository";

type Deps = { users: UserRepository };

export const listPeople =
  ({ users }: Deps) =>
  async (filter: PeopleFilter): Promise<PersonSummary[]> =>
    users.list(filter);
