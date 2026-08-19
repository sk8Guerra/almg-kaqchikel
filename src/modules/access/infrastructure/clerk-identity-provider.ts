import { auth, clerkClient } from "@clerk/nextjs/server";
import { identityId } from "../domain/values";
import type { IdentityId } from "../domain/values";
import type { ExternalIdentity, IdentityProvider } from "../application/ports/identity-provider";

export class ClerkIdentityProvider implements IdentityProvider {
  async getCurrentIdentity(): Promise<ExternalIdentity | null> {
    const { userId } = await auth();
    if (!userId) return null;

    const client = await clerkClient();
    const account = await client.users.getUser(userId);

    const primary =
      account.emailAddresses.find((e) => e.id === account.primaryEmailAddressId) ??
      account.emailAddresses[0];

    if (!primary) return null;

    const displayName =
      [account.firstName, account.lastName].filter(Boolean).join(" ").trim() || null;

    return {
      identityId: identityId(account.id),
      email: primary.emailAddress,
      displayName,

      isActive: !account.banned && !account.locked,
      updatedAt: new Date(account.updatedAt),
    };
  }

  async createIdentity(email: string): Promise<IdentityId> {
    const client = await clerkClient();
    const account = await client.users.createUser({
      emailAddress: [email],
      skipPasswordRequirement: true,
    });
    return identityId(account.id);
  }

  async deleteIdentity(id: IdentityId): Promise<void> {
    const client = await clerkClient();
    await client.users.deleteUser(id);
  }

  async deactivateIdentity(id: IdentityId): Promise<void> {
    const client = await clerkClient();
    await client.users.banUser(id);
  }

  async reactivateIdentity(id: IdentityId): Promise<void> {
    const client = await clerkClient();
    await client.users.unbanUser(id);
  }
}
