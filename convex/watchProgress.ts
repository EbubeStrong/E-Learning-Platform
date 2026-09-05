import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUser, requireUser } from "./lib/authz";

export const upsert = mutation({
  args: {
    courseId: v.string(),
    videoId: v.string(),
    positionSeconds: v.number(),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (context, payload) => {
    const user = await requireUser(context);

    const existing = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("videoId"), payload.videoId))
      .first();

    if (existing) {
      await context.db.patch(existing._id, {
        positionSeconds: payload.positionSeconds,
        durationSeconds: payload.durationSeconds,
        updatedAt: Date.now(),
      });
      await context.db.patch(user._id, { lastActiveAt: Date.now() });
      return existing._id;
    }

    const id = await context.db.insert("watchProgress", {
      userId: user._id,
      courseId: payload.courseId,
      videoId: payload.videoId,
      positionSeconds: payload.positionSeconds,
      durationSeconds: payload.durationSeconds,
      updatedAt: Date.now(),
    });
    await context.db.patch(user._id, { lastActiveAt: Date.now() });
    return id;
  },
});

export const getResume = query({
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    const user = await getAuthedUser(context);
    if (!user) return null; // signed out / not yet provisioned — nothing to resume
    const items = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .collect();

    if (items.length === 0) return null;

    items.sort((itemA, itemB) => itemB.updatedAt - itemA.updatedAt);
    return items[0];
  },
});

export const listForCourse = query({
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    const user = await getAuthedUser(context);
    if (!user) return [];
    const items = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .collect();
    return items;
  },
});

export const listAllForUser = query({
  args: {},
  handler: async (context) => {
    const user = await getAuthedUser(context);
    if (!user) return [];
    const items = await context.db
      .query("watchProgress")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    return items;
  },
});
