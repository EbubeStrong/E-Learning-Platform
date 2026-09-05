import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/lib/admin-emails";
import type { AdminSession } from "@/types/user";

/**
 * Verifies the current session is an admin. Returns the admin session when
 * the signed-in user is an admin (by metadata role, org membership role or
 * email allowlist), otherwise `null`.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const isInstanceAdmin = user.publicMetadata?.role === "admin";
  const orgMemberships = await client.users.getOrganizationMembershipList({
    userId,
  });
  const isOrgAdmin = orgMemberships.data.some(
    (membership) => membership.role === "admin"
  );
  const isEmailAdmin = user.emailAddresses.some((email) =>
    isAdminEmail(email.emailAddress)
  );

  if (!isInstanceAdmin && !isOrgAdmin && !isEmailAdmin) return null;

  return { userId, isInstanceAdmin, isOrgAdmin, isEmailAdmin };
}