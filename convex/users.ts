import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUser, requireAdmin, adminEmailAllowlist } from "./lib/authz";

/**
 * Creates the caller's user row on first sign-in, or returns the existing
 * one. Role is decided here, server-side, from the verified Clerk identity —
 * never accepted from the client. This is the fix for the previous bug where
 * the browser computed `role` itself and the mutation trusted it.
 */
export const createOrGetUser = mutation({
  args: {
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (context, payload) => {
    const identity = await context.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existingUser = await context.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existingUser) return existingUser;

    const email = (identity.email ?? "").toLowerCase();
    const role = adminEmailAllowlist().includes(email) ? "admin" : "student";

    const userData = {
      clerkUserId: identity.subject,
      name: payload.name,
      email,
      imageUrl: payload.imageUrl,
      role: role as "student" | "admin",
      joinedAt: Date.now(),
    };

    const id = await context.db.insert("users", userData);

    return {
      _id: id,
      ...userData,
    };
  },
});

/** Returns the caller's own user row, derived from their session — not a
 *  client-supplied clerkUserId, so you can't look up anyone but yourself. */
export const get = query({
  args: {},
  handler: async (context) => {
    return await getAuthedUser(context);
  },
});

/** Admin-only: paginated list of all users. Previously had no auth check. */
export const listAdmin = query({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (context, payload) => {
    await requireAdmin(context);

    const limit = Math.min(payload.limit ?? 10, 50);
    const offset = Math.max(payload.offset ?? 0, 0);

    const all = await context.db.query("users").collect();
    const sorted = all.sort((userA, userB) => userB.joinedAt - userA.joinedAt);

    const users = sorted.slice(offset, offset + limit).map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      role: user.role,
      joinedAt: user.joinedAt,
      lastActiveAt: user.lastActiveAt,
    }));

    return {
      users,
      total: all.length,
    };
  },
});
