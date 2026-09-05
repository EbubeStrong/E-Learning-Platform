// convex/lib/authz.ts
//
// Every query/mutation that needs to know "who is calling this" should use
// requireUser / requireAdmin from here — never accept a userId/adminUserId
// as a plain argument and trust it. Arguments are fully attacker-controlled;
// context.auth.getUserIdentity() is derived from Convex's verification of the
// Clerk-signed JWT and cannot be spoofed by the caller.

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type Context = QueryCtx | MutationCtx;

/** The users-table row for the authenticated caller, or null if signed out
 *  or not yet provisioned (before their first createOrGetUser call). */
export async function getAuthedUser(context: Context): Promise<Doc<"users"> | null> {
  const identity = await context.auth.getUserIdentity();
  if (!identity) return null;

  return await context.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();
}

/** Throws unless the caller is signed in and provisioned. Returns their row. */
export async function requireUser(context: Context): Promise<Doc<"users">> {
  const user = await getAuthedUser(context);
  if (!user) throw new Error("Unauthenticated");
  return user;
}

/** Throws unless the caller is signed in AND has role "admin". */
export async function requireAdmin(context: Context): Promise<Doc<"users">> {
  const user = await requireUser(context);
  if (user.role !== "admin") throw new Error("Unauthorized: admin only");
  return user;
}

/** Reads the ADMIN_EMAILS Convex environment variable (comma-separated),
 *  set via: npx convex env set ADMIN_EMAILS "you@example.com,other@example.com"
 *  Kept server-side only — never expose this as NEXT_PUBLIC_*. */
export function adminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
