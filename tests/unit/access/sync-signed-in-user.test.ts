import { describe, expect, it } from "vitest";
import { syncSignedInUser } from "@/modules/access/application/use-cases/sync-signed-in-user";
import { InMemoryUserRepository, StubIdentityProvider, anIdentity, fixedClock } from "./doubles";

const clock = fixedClock("2026-08-18T10:00:00Z");

describe("syncSignedInUser", () => {
  it("creates the profile on first sign-in (FR-012)", async () => {
    const users = new InMemoryUserRepository();
    const run = syncSignedInUser({
      identity: new StubIdentityProvider(anIdentity()),
      users,
      clock,
    });

    const user = await run();

    expect(user.email).toBe("persona@almg.gt");
    expect(users.users.size).toBe(1);
  });

  it("reuses the existing profile instead of duplicating (FR-013)", async () => {
    const users = new InMemoryUserRepository();
    const deps = { identity: new StubIdentityProvider(anIdentity()), users, clock };

    const first = await syncSignedInUser(deps)();
    const second = await syncSignedInUser(deps)();

    expect(second.id).toBe(first.id);
    expect(users.users.size).toBe(1);
  });

  it("updates the display name when it changes upstream (FR-014)", async () => {
    const users = new InMemoryUserRepository();
    const identity = new StubIdentityProvider(anIdentity({ displayName: "Antes" }));

    await syncSignedInUser({ identity, users, clock })();
    identity.set(anIdentity({ displayName: "Después" }));
    const updated = await syncSignedInUser({ identity, users, clock })();

    expect(updated.displayName).toBe("Después");
    expect(users.users.size).toBe(1);
  });

  it("never stores credentials on the profile (FR-015)", async () => {
    const users = new InMemoryUserRepository();
    const user = await syncSignedInUser({
      identity: new StubIdentityProvider(anIdentity()),
      users,
      clock,
    })();

    for (const forbidden of ["password", "passwordHash", "sessionToken", "mfaSecret"]) {
      expect(Object.keys(user)).not.toContain(forbidden);
    }
  });

  it("uses the injected clock rather than system time (Principle V)", async () => {
    const users = new InMemoryUserRepository();
    const user = await syncSignedInUser({
      identity: new StubIdentityProvider(anIdentity()),
      users,
      clock,
    })();

    expect(user.updatedAt.toISOString()).toBe("2026-08-18T10:00:00.000Z");
  });
});
