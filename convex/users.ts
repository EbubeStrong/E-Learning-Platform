import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetUser = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("student"), v.literal("admin"))),
  },
  handler: async (context, payload) => {
    const existingUser = await context.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), payload.clerkUserId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    const userData = {
      clerkUserId: payload.clerkUserId,
      name: payload.name,
      email: payload.email,
      imageUrl: payload.imageUrl,
      role: payload.role ?? "student",
      joinedAt: Date.now(),
    };

    const id = await context.db.insert("users", userData);

    return {
      _id: id,
      ...userData,
    };
  },
});

export const get = query({
  args: { clerkUserId: v.string() },
  handler: async (context, payload) => {
    return await context.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), payload.clerkUserId))
      .first();
  },
});

export const listAdmin = query({
  args: { limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (context, payload) => {
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
