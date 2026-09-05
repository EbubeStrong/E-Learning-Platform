import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Doc, type Id } from "./_generated/dataModel";
import { QUIZ_DEFAULTS_BY_CATEGORY, resolveCategory, type QuizDefaultConfig } from "./quizData";
import { CERTIFICATION_PASS_PERCENTAGE } from "./constants";
import { requireAdmin } from "./lib/authz";

async function ensureDefaultQuizzes(
  db: MutationCtx["db"],
  course: Doc<"courses">,
  setSeededAt = false
) {
  const category = resolveCategory(course.courseId, course.category);
  const defaults = QUIZ_DEFAULTS_BY_CATEGORY[category] as QuizDefaultConfig;

  const upsertQuiz = async (
    type: "practice" | "certification",
    defaults: { total: number; pointsPerQuestion: number; timeLimitSeconds: number }
  ) => {
    const existing = await db
      .query("quizzes")
      .filter((q) => q.eq(q.field("courseId"), course.courseId))
      .filter((q) => q.eq(q.field("type"), type))
      .first();

    if (existing) {
      if (setSeededAt && existing.seededAt === undefined) {
        await db.patch(existing._id as Id<"quizzes">, { seededAt: Date.now() });
      }
      return existing;
    }

    return await db.insert("quizzes", {
      courseId: course.courseId,
      type,
      title:
        type === "practice"
          ? `${course.title} Practice`
          : `${course.title} Certification`,
      totalQuestions: defaults.total,
      pointsPerQuestion: defaults.pointsPerQuestion,
      timeLimitSeconds: defaults.timeLimitSeconds,
      perQuestionSeconds: Math.round(defaults.timeLimitSeconds / defaults.total),
      passThreshold: type === "certification" ? CERTIFICATION_PASS_PERCENTAGE : 0,
      enabled: true,
      seededAt: Date.now(),
    });
  };

  await upsertQuiz("practice", defaults.practice);
  await upsertQuiz("certification", defaults.certification);
}

export const seedQuizzesForAll = mutation({
  args: {},
  handler: async (context) => {
    // Previously public — anyone could reseed every course's quiz config.
    await requireAdmin(context);

    const courses = await context.db.query("courses").collect();
    for (const course of courses) {
      await ensureDefaultQuizzes(context.db, course, true);
    }
    return { seeded: courses.length };
  },
});

export const getForCourse = query({
  args: { courseId: v.string(), type: v.union(v.literal("practice"), v.literal("certification")) },
  handler: async (context, payload) => {
    const course = await context.db
      .query("courses")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();

    if (!course) return null;

    // Defaults already ensured by seeding; but be safe.
    const quiz = await context.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("type"), payload.type))
      .first();

    if (!quiz) return null;

    const questions = await context.db
      .query("questions")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("quizType"), payload.type))
      .collect();

    return {
      ...quiz,
      courseTitle: course.title,
      courseCategory: course.category,
      availableQuestions: questions.length,
    };
  },
});

export const getAllForCourse = query({
  args: { courseId: v.string() },
  handler: async (context, payload) => {
    const course = await context.db
      .query("courses")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .first();
    if (!course) return null;

    const quizzes = await context.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .collect();

    return quizzes.map((quiz) => ({
      ...quiz,
      courseTitle: course.title,
      courseCategory: course.category,
    }));
  },
});

export const getAllForAll = query({
  args: {},
  handler: async (context) => {
    return await context.db.query("quizzes").collect();
  },
});

export const adminUpsert = mutation({
  args: {
    courseId: v.string(),
    type: v.union(v.literal("practice"), v.literal("certification")),
    title: v.string(),
    totalQuestions: v.number(),
    pointsPerQuestion: v.number(),
    timeLimitSeconds: v.optional(v.number()),
    perQuestionSeconds: v.optional(v.number()),
    passThreshold: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (context, payload) => {
    const admin = await requireAdmin(context);

    const existing = await context.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("type"), payload.type))
      .first();

    const patch = {
      title: payload.title,
      totalQuestions: payload.totalQuestions,
      pointsPerQuestion: payload.pointsPerQuestion,
      timeLimitSeconds: payload.timeLimitSeconds,
      perQuestionSeconds: payload.perQuestionSeconds ?? Math.round((payload.timeLimitSeconds ?? 0) / payload.totalQuestions),
      passThreshold: payload.passThreshold ?? (payload.type === "certification" ? CERTIFICATION_PASS_PERCENTAGE : 0),
      enabled: payload.enabled ?? true,
      updatedBy: admin._id,
      updatedAt: Date.now(),
    };

    if (existing) {
      await context.db.patch(existing._id, patch);
      return existing._id;
    }

    return await context.db.insert("quizzes", {
      courseId: payload.courseId,
      type: payload.type,
      ...patch,
      seededAt: undefined,
    });
  },
});
