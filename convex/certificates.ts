import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthedUser, requireUser } from "./lib/authz";

function makeCertId(courseId: string, userId: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${courseId}-${userId.slice(0, 4)}-${randomSuffix}`;
}

// internalMutation, not mutation: this must only ever be triggered by
// attempts.submitAttempt after it has verified a passing score server-side.
// Exposing it as a public mutation would let a client mint arbitrary
// certificates for arbitrary users by calling it directly.
export const unlock = internalMutation({
  args: { userId: v.id("users"), courseId: v.string(), title: v.string(), score: v.number() },
  handler: async (context, payload) => {
    const existing = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    if (existing) return existing._id;

    const certificateId = await context.db.insert("certificates", {
      userId: payload.userId,
      courseId: payload.courseId,
      title: payload.title,
      issuedAt: Date.now(),
      score: payload.score,
      certId: makeCertId(payload.courseId, String(payload.userId)),
    });
    await context.db.patch(payload.userId, { lastActiveAt: Date.now() });
    return certificateId;
  },
});

export const list = query({
  args: {},
  handler: async (context) => {
    const user = await getAuthedUser(context);
    if (!user) return []; // signed out / not yet provisioned
    const certs = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    return certs.sort((certA, certB) => certB.issuedAt - certA.issuedAt);
  },
});

export const eligible = query({
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    const user = await getAuthedUser(context);
    if (!user) return false; // signed out / not yet provisioned
    const hasCert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), user._id))
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
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    const user = await getAuthedUser(context);
    if (!user) return null; // signed out / not yet provisioned
    const cert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    return cert ? { ...cert, isOwner: true } : null;
  },
});

export const remove = mutation({
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    const user = await requireUser(context);
    const cert = await context.db
      .query("certificates")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    if (cert) await context.db.delete(cert._id);
    return cert?._id;
  },
});
