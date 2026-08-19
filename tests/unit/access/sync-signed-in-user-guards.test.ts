import { describe, expect, it } from "vitest";
import { syncSignedInUser } from "@/modules/access/application/use-cases/sync-signed-in-user";
import { NotAuthenticatedError, UserInactiveError } from "@/modules/access/domain/errors";
import { InMemoryUserRepository, StubIdentityProvider, anIdentity, fixedClock } from "./doubles";

const clock = fixedClock("2026-08-18T10:00:00Z");

describe("syncSignedInUser — guards", () => {
  it("throws NotAuthenticatedError when there is no session", async () => {
    const run = syncSignedInUser({
      identity: new StubIdentityProvider(null),
      users: new InMemoryUserRepository(),
      clock,
    });

    await expect(run()).rejects.toThrow(NotAuthenticatedError);
  });

  it("throws UserInactiveError and creates no profile for a deactivated identity (FR-009)", async () => {
    const users = new InMemoryUserRepository();
    const run = syncSignedInUser({
      identity: new StubIdentityProvider(anIdentity({ isActive: false })),
      users,
      clock,
    });

    await expect(run()).rejects.toThrow(UserInactiveError);
    expect(users.users.size).toBe(0);
  });
});
