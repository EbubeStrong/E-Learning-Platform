import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.string(),
    videoId: v.string(),
    positionSeconds: v.number(),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (context, payload) => {
    const existing = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("videoId"), payload.videoId))
      .first();

    if (existing) {
      await context.db.patch(existing._id, {
        positionSeconds: payload.positionSeconds,
        durationSeconds: payload.durationSeconds,
        updatedAt: Date.now(),
      });
      await context.db.patch(payload.userId, { lastActiveAt: Date.now() });
      return existing._id;
    }

    const id = await context.db.insert("watchProgress", {
      userId: payload.userId,
      courseId: payload.courseId,
      videoId: payload.videoId,
      positionSeconds: payload.positionSeconds,
      durationSeconds: payload.durationSeconds,
      updatedAt: Date.now(),
    });
    await context.db.patch(payload.userId, { lastActiveAt: Date.now() });
    return id;
  },
});

export const getResume = query({
  args: { userId: v.id("users"), courseId: v.string() },
  handler: async (context, payload) => {
    const items = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .collect();

    if (items.length === 0) return null;

    items.sort((itemA, itemB) => itemB.updatedAt - itemA.updatedAt);
    return items[0];
  },
});

export const listForCourse = query({
  args: { userId: v.id("users"), courseId: v.string() },
  handler: async (context, payload) => {
    const items = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .collect();
    return items;
  },
});

export const listAllForUser = query({
  args: { userId: v.id("users") },
  handler: async (context, payload) => {
    const items = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .collect();
    return items;
  },
});
