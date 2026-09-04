import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function makeCertId(courseId: string, userId: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${courseId}-${userId.slice(0, 4)}-${rand}`;
}

export const unlock = mutation({
  args: { userId: v.id("users"), courseId: v.string(), title: v.string(), score: v.number() },
  handler: async (context, payload) => {
    const existing = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    if (existing) return existing._id;

    const id = await context.db.insert("certificates", {
      userId: payload.userId,
      courseId: payload.courseId,
      title: payload.title,
      issuedAt: Date.now(),
      score: payload.score,
      certId: makeCertId(payload.courseId, String(payload.userId)),
    });
    await context.db.patch(payload.userId, { lastActiveAt: Date.now() });
    return id;
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (context, payload) => {
    const certs = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .collect();
    return certs.sort((certA, certB) => certB.issuedAt - certA.issuedAt);
  },
});

export const eligible = query({
  args: { userId: v.id("users"), courseId: v.string() },
  handler: async (context, payload) => {
    const hasCert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    return !!hasCert;
  },
});

export const verify = query({
  args: { certId: v.string() },
  handler: async (context, payload) => {
    const cert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("certId"), payload.certId))
      .first();
    if (!cert) return null;
    const user = await context.db.get(cert.userId);
    return { ...cert, recipientName: user?.name ?? "" };
  },
});

export const isOwner = query({
  args: { userId: v.id("users"), courseId: v.string() },
  handler: async (context, payload) => {
    const cert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    return cert ? { ...cert, isOwner: true } : null;
  },
});

export const remove = mutation({
  args: { userId: v.id("users"), courseId: v.string() },
  handler: async (context, payload) => {
    const cert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    if (cert) await context.db.delete(cert._id);
    return cert?._id;
  },
});
