import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { QUESTION_BANK, QUIZ_DEFAULTS_BY_CATEGORY, resolveCategory } from "./quizData";
import { requireAdmin } from "./lib/authz";

/** Deterministic 32-bit FNV-1a hash of a string. No randomness at seed time. */
function stableHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Wrapping slice of `count` items from `pool`, starting at `start % pool.length`. */
function drawWindow<T>(pool: T[], start: number, count: number): T[] {
  if (pool.length === 0) return [];
  const size = pool.length;
  const offset = ((start % size) + size) % size;
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(offset + i) % size]);
  }
  return result;
}

export const seedForCourse = mutation({
  args: { courseId: v.string(), courseCategory: v.optional(v.string()), force: v.optional(v.boolean()) },
  handler: async (context, payload) => {
    await requireAdmin(context);

    const category = resolveCategory(payload.courseId, payload.courseCategory);
    const pool = QUESTION_BANK[category];
    if (!pool) return { seeded: 0 };
    const defaults = QUIZ_DEFAULTS_BY_CATEGORY[category];
    if (!defaults) return { seeded: 0 };

    if (payload.force) {
      const existing = await context.db
        .query("questions")
        .filter((q) => q.eq(q.field("courseId"), payload.courseId))
        .collect();
      for (const question of existing) {
        await context.db.delete(question._id);
      }
    } else {
      const existing = await context.db
        .query("questions")
        .filter((q) => q.eq(q.field("courseId"), payload.courseId))
        .first();
      if (existing) return { seeded: 0 };
    }

    // Deterministic, per-course-unique selection via rank-based start offsets.
    // Every course in the category gets a distinct window from the shared pool.
    const practicePool = pool.filter((question) => question.quizType === "practice");
    const certificationPool = pool.filter((question) => question.quizType === "certification");

    const categoryCourses = await context.db
      .query("courses")
      .filter((q) => q.eq(q.field("category"), category))
      .collect();
    const ranked = [...categoryCourses].sort(
      (courseA, courseB) =>
        stableHash(courseA.courseId) - stableHash(courseB.courseId)
    );
    const myIndex = ranked.findIndex((course) => course.courseId === payload.courseId);
    const rank = myIndex === -1 ? 0 : myIndex;
    const courseCount = Math.max(ranked.length, 1);

    let seeded = 0;
    const plan: { pool: typeof practicePool; quizSize: number }[] = [
      { pool: practicePool, quizSize: defaults.practice.total },
      { pool: certificationPool, quizSize: defaults.certification.total },
    ];
    for (const slot of plan) {
      if (slot.pool.length === 0) continue;
      const spacing = Math.max(Math.floor(slot.pool.length / courseCount), 1);
      const quizSize = Math.min(slot.quizSize, slot.pool.length);
      const start = (rank * spacing) % slot.pool.length;
      const drawn = drawWindow(slot.pool, start, quizSize);

      for (const question of drawn) {
        await context.db.insert("questions", {
          courseId: payload.courseId,
          quizType: question.quizType,
          prompt: question.prompt,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          category: question.category,
          difficulty: question.difficulty,
          isCore: question.isCore,
        });
        seeded++;
      }
    }
    return { seeded };
  },
});

/** Per-course question counts (practice vs certification) for the admin UI. */
export const countsByCourse = query({
  args: {},
  handler: async (context) => {
    const all = await context.db.query("questions").collect();
    const countsByCourseId = new Map<string, { practice: number; certification: number }>();
    for (const question of all) {
      const entry = countsByCourseId.get(question.courseId) ?? { practice: 0, certification: 0 };
      if (question.quizType === "practice") entry.practice += 1;
      else entry.certification += 1;
      countsByCourseId.set(question.courseId, entry);
    }
    return Array.from(countsByCourseId, ([courseId, counts]) => ({ courseId, ...counts }));
  },
});

export const getForQuiz = query({
  args: {
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    includeAnswers: v.optional(v.boolean()),
  },
  handler: async (context, payload) => {
    // includeAnswers exposes correctIndex — only ever safe for admins
    // managing the question bank, never for a student about to take the quiz.
    if (payload.includeAnswers) {
      await requireAdmin(context);
    }

    const questions = await context.db
      .query("questions")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("quizType"), payload.quizType))
      .collect();

    return questions.map((question) => {
      if (payload.includeAnswers) {
        return question;
      }
      return {
        _id: question._id,
        prompt: question.prompt,
        options: question.options,
        courseId: question.courseId,
        quizType: question.quizType,
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty,
      };
    });
  },
});

export const adminCreate = mutation({
  args: {
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    prompt: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    explanation: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    isCore: v.optional(v.boolean()),
  },
  handler: async (context, payload) => {
    await requireAdmin(context);
    const questionId = await context.db.insert("questions", {
      courseId: payload.courseId,
      quizType: payload.quizType,
      prompt: payload.prompt,
      options: payload.options,
      correctIndex: payload.correctIndex,
      explanation: payload.explanation,
      category: payload.category,
      difficulty: payload.difficulty,
      isCore: payload.isCore,
    });
    return questionId;
  },
});

export const adminUpdate = mutation({
  args: {
    questionId: v.id("questions"),
    prompt: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    correctIndex: v.optional(v.number()),
    explanation: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    isCore: v.optional(v.boolean()),
  },
  handler: async (context, payload) => {
    await requireAdmin(context);
    const existing = await context.db.get(payload.questionId);
    if (!existing) throw new Error("Question not found");
    await context.db.patch(payload.questionId, {
      prompt: payload.prompt,
      options: payload.options,
      correctIndex: payload.correctIndex,
      explanation: payload.explanation,
      category: payload.category,
      difficulty: payload.difficulty,
      isCore: payload.isCore,
    });
    return payload.questionId;
  },
});

export const adminDelete = mutation({
  args: { questionId: v.id("questions") },
  handler: async (context, payload) => {
    await requireAdmin(context);
    await context.db.delete(payload.questionId);
    return payload.questionId;
  },
});
