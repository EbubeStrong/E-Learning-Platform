import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { QUESTION_BANK, QUIZ_DEFAULTS_BY_CATEGORY, resolveCategory } from "./quizData";

async function isAdmin(db: MutationCtx["db"], userId: Id<"users">) {
  const admin = await db.get(userId);
  return !!admin && admin.role === "admin";
}

/** Deterministic 32-bit FNV-1a hash of a string. No randomness at seed time. */
function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
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
  handler: async (ctx, args) => {
    const category = resolveCategory(args.courseId, args.courseCategory);
    const pool = QUESTION_BANK[category];
    if (!pool) return { seeded: 0 };
    const defaults = QUIZ_DEFAULTS_BY_CATEGORY[category];
    if (!defaults) return { seeded: 0 };

    if (args.force) {
      const existing = await ctx.db
        .query("questions")
        .filter((q) => q.eq(q.field("courseId"), args.courseId))
        .collect();
      for (const question of existing) {
        await ctx.db.delete(question._id);
      }
    } else {
      const existing = await ctx.db
        .query("questions")
        .filter((q) => q.eq(q.field("courseId"), args.courseId))
        .first();
      if (existing) return { seeded: 0 };
    }

    // Deterministic, per-course-unique selection via rank-based start offsets.
    // Every course in the category gets a distinct window from the shared pool.
    const practicePool = pool.filter((question) => question.quizType === "practice");
    const certificationPool = pool.filter((question) => question.quizType === "certification");

    const categoryCourses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("category"), category))
      .collect();
    const ranked = [...categoryCourses].sort(
      (courseA, courseB) =>
        stableHash(courseA.courseId) - stableHash(courseB.courseId)
    );
    const myIndex = ranked.findIndex((course) => course.courseId === args.courseId);
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
        await ctx.db.insert("questions", {
          courseId: args.courseId,
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
  handler: async (ctx) => {
    const all = await ctx.db.query("questions").collect();
    const map = new Map<string, { practice: number; certification: number }>();
    for (const question of all) {
      const entry = map.get(question.courseId) ?? { practice: 0, certification: 0 };
      if (question.quizType === "practice") entry.practice += 1;
      else entry.certification += 1;
      map.set(question.courseId, entry);
    }
    return Array.from(map, ([courseId, counts]) => ({ courseId, ...counts }));
  },
});

export const getForQuiz = query({
  args: {
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    includeAnswers: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .filter((q) => q.eq(q.field("quizType"), args.quizType))
      .collect();

    return questions.map((question) => {
      if (args.includeAnswers) {
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
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx.db, args.adminUserId))) throw new Error("Unauthorized: admin only");
    const id = await ctx.db.insert("questions", {
      courseId: args.courseId,
      quizType: args.quizType,
      prompt: args.prompt,
      options: args.options,
      correctIndex: args.correctIndex,
      explanation: args.explanation,
      category: args.category,
      difficulty: args.difficulty,
      isCore: args.isCore,
    });
    return id;
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
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx.db, args.adminUserId))) throw new Error("Unauthorized: admin only");
    const existing = await ctx.db.get(args.questionId);
    if (!existing) throw new Error("Question not found");
    await ctx.db.patch(args.questionId, {
      prompt: args.prompt,
      options: args.options,
      correctIndex: args.correctIndex,
      explanation: args.explanation,
      category: args.category,
      difficulty: args.difficulty,
      isCore: args.isCore,
    });
    return args.questionId;
  },
});

export const adminDelete = mutation({
  args: { questionId: v.id("questions"), adminUserId: v.id("users") },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx.db, args.adminUserId))) throw new Error("Unauthorized: admin only");
    await ctx.db.delete(args.questionId);
    return args.questionId;
  },
});
