import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Doc, type Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { CERTIFICATION_MAX_ATTEMPTS } from "./constants";

type StartArgs = {
  userId: Id<"users">;
  courseId: string;
  quizType: "practice" | "certification";
};

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sampleCertification(questions: Doc<"questions">[], total: number): Doc<"questions">[] {
  const core = shuffle(questions.filter((question) => question.isCore));
  const rest = shuffle(questions.filter((question) => !question.isCore));
  const combined = [...core, ...rest];
  return combined.slice(0, Math.min(total, combined.length));
}

async function getQuizMeta(context: MutationCtx, courseId: string, quizType: StartArgs["quizType"]) {
  return context.db
    .query("quizzes")
    .filter((q) => q.eq(q.field("courseId"), courseId))
    .filter((q) => q.eq(q.field("type"), quizType))
    .first();
}

async function autoSubmitExpired(context: MutationCtx, userId: Id<"users">) {
  const now = Date.now();
  const inProgress = await context.db
    .query("attempts")
    .filter((q) => q.eq(q.field("userId"), userId))
    .filter((q) => q.eq(q.field("status"), "in_progress"))
    .collect();

  for (const attempt of inProgress) {
    if (attempt.deadlineAt && attempt.deadlineAt < now) {
      await submitAttempt(context, attempt, attempt.answers, null);
    }
  }
}

async function submitAttempt(
  context: MutationCtx,
  attempt: Doc<"attempts">,
  answers: { questionId: Id<"questions">; chosenIndex: number }[],
  timeTakenMs: number | null
) {
  const answerMap = new Map(
    answers.map((answer) => [String(answer.questionId), answer.chosenIndex])
  );
  let correct = 0;
  for (const answer of attempt.answers) {
    const chosen = answerMap.get(String(answer.questionId));
    const question = await context.db.get(answer.questionId);
    if (question && chosen !== undefined && chosen === question.correctIndex) {
      correct++;
    }
  }

  const score = correct * attempt.pointPerQuestion;
  const total = attempt.totalQuestions * attempt.pointPerQuestion;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passThreshold = attempt.passThreshold ?? 0;

  await context.db.patch(attempt._id, {
    status: "submitted",
    submittedAt: Date.now(),
    timeTakenMs: timeTakenMs ?? undefined,
    score,
    total,
    percent,
    correctCount: correct,
  });

  await context.db.patch(attempt.userId, { lastActiveAt: Date.now() });

  // Auto-unlock certificate on passing certification quiz.
  if (attempt.quizType === "certification" && passThreshold > 0 && percent >= passThreshold) {
    await context.runMutation(api.certificates.unlock, {
      userId: attempt.userId,
      courseId: attempt.courseId,
      title: attempt.quizTitle,
      score: percent,
    });
  }

  return {
    attemptId: attempt._id,
    score,
    total,
    percent,
    correct,
    passed: passThreshold > 0 && percent >= passThreshold,
  };
}

export const start = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    mode: v.optional(v.union(v.literal("timed"), v.literal("untimed"))),
    timerType: v.optional(v.union(v.literal("overall"), v.literal("per-question"))),
  },
  handler: async (context, payload) => {
    const quiz = await getQuizMeta(context, payload.courseId, payload.quizType);
    if (!quiz) throw new Error("Quiz not found");

    await autoSubmitExpired(context, payload.userId);

    if (payload.quizType === "certification") {
      const submitted = await context.db
        .query("attempts")
        .filter((q) => q.eq(q.field("userId"), payload.userId))
        .filter((q) => q.eq(q.field("courseId"), payload.courseId))
        .filter((q) => q.eq(q.field("quizType"), "certification"))
        .filter((q) => q.eq(q.field("status"), "submitted"))
        .collect();
      if (submitted.length >= CERTIFICATION_MAX_ATTEMPTS) {
        throw new Error("MAX_ATTEMPTS");
      }
    }

    const pool = await context.db
      .query("questions")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("quizType"), payload.quizType))
      .collect();

    let selected: Doc<"questions">[];
    if (payload.quizType === "certification") {
      selected = sampleCertification(pool, quiz.totalQuestions);
    } else {
      selected = shuffle(pool).slice(0, Math.min(quiz.totalQuestions, pool.length));
    }

    if (selected.length === 0) throw new Error("NO_QUESTIONS");

    const mode = payload.mode ?? (quiz.timeLimitSeconds || quiz.perQuestionSeconds ? "timed" : "untimed");
    const timerType = payload.timerType ?? (quiz.perQuestionSeconds ? "per-question" : "overall");
    const now = Date.now();
    const deadlineAt =
      mode === "timed" && quiz.timeLimitSeconds ? now + quiz.timeLimitSeconds * 1000 : undefined;

    const attemptId = await context.db.insert("attempts", {
      userId: payload.userId,
      courseId: payload.courseId,
      quizType: payload.quizType,
      quizTitle: quiz.title,
      attemptNumber: 1,
      status: "in_progress",
      mode,
      timerType,
      totalPoints: quiz.totalQuestions * quiz.pointsPerQuestion,
      pointPerQuestion: quiz.pointsPerQuestion,
      totalQuestions: selected.length,
      timeLimitSeconds: quiz.timeLimitSeconds,
      perQuestionSeconds: quiz.perQuestionSeconds,
      passThreshold: quiz.passThreshold,
      startedAt: now,
      deadlineAt,
      answers: selected.map((question) => ({ questionId: question._id, chosenIndex: -1 })),
    });

    await context.db.patch(payload.userId, { lastActiveAt: Date.now() });

    return {
      attemptId,
      quiz: {
        title: quiz.title,
        totalQuestions: selected.length,
        pointPerQuestion: quiz.pointsPerQuestion,
        totalPoints: selected.length * quiz.pointsPerQuestion,
        mode,
        timerType,
        timeLimitSeconds: quiz.timeLimitSeconds,
        perQuestionSeconds: quiz.perQuestionSeconds,
        passThreshold: quiz.passThreshold,
        deadlineAt,
      },
      questions: selected.map((question) => ({
        _id: question._id,
        prompt: question.prompt,
        options: question.options,
        explanation: question.explanation,
      })),
    };
  },
});

export const submit = mutation({
  args: {
    attemptId: v.id("attempts"),
    userId: v.id("users"),
    answers: v.array(v.object({ questionId: v.id("questions"), chosenIndex: v.number() })),
    timeTakenMs: v.optional(v.number()),
  },
  handler: async (context, payload) => {
    const attempt = await context.db.get(payload.attemptId);
    if (!attempt || attempt.userId !== payload.userId) throw new Error("Attempt not found");
    if (attempt.status === "submitted") throw new Error("Already submitted");

    return await submitAttempt(context, attempt, payload.answers, payload.timeTakenMs ?? null);
  },
});

export const autoSubmitPending = mutation({
  args: { userId: v.id("users") },
  handler: async (context, payload) => {
    const before = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    await autoSubmitExpired(context, payload.userId);
    const after = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    return { submitted: before.length - after.length, remainingInProgress: after.length };
  },
});

export const listForUser = query({
  args: { userId: v.id("users"), quizType: v.optional(v.union(v.literal("practice"), v.literal("certification"))) },
  handler: async (context, payload) => {
    const baseQuery = context.db
      .query("attempts")
      .filter((x) => x.eq(x.field("userId"), payload.userId));
    const attempts = payload.quizType
      ? await baseQuery.filter((x) => x.eq(x.field("quizType"), payload.quizType)).collect()
      : await baseQuery.collect();
    return attempts.sort((attemptA, attemptB) => attemptB.startedAt - attemptA.startedAt);
  },
});

export const stats = query({
  args: { userId: v.id("users") },
  handler: async (context, payload) => {
    const attempts = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const percentiles = attempts.map((attempt) => attempt.percent ?? 0);
    const count = percentiles.length;
    const avg = count ? Math.round(percentiles.reduce((sum, score) => sum + score, 0) / count) : 0;
    const highest = count ? Math.max(...percentiles) : 0;
    const lowest = count ? Math.min(...percentiles) : 0;
    const totalTimeMs = attempts.reduce((total, attempt) => total + (attempt.timeTakenMs ?? 0), 0);

    return {
      taken: count,
      avg,
      highest,
      lowest,
      totalTimeMs,
      certificationPassed: attempts.filter(
        (attempt) =>
          attempt.quizType === "certification" &&
          (attempt.passThreshold ?? 0) > 0 &&
          (attempt.percent ?? 0) >= (attempt.passThreshold ?? 0)
      ).length,
    };
  },
});

export const pendingDeadlines = query({
  args: { userId: v.id("users") },
  handler: async (context, payload) => {
    const now = Date.now();
    const inProgress = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), payload.userId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    const withDeadline = inProgress
      .filter((attempt) => attempt.deadlineAt != null)
      .sort((attemptA, attemptB) => (attemptA.deadlineAt ?? 0) - (attemptB.deadlineAt ?? 0));
    return withDeadline.map((attempt) => ({
      ...attempt,
      remainingMs: (attempt.deadlineAt ?? 0) - now,
      expired: (attempt.deadlineAt ?? 0) < now,
    }));
  },
});

export const remove = mutation({
  args: { attemptId: v.id("attempts"), userId: v.id("users") },
  handler: async (context, payload) => {
    const attempt = await context.db.get(payload.attemptId);
    if (!attempt || attempt.userId !== payload.userId) throw new Error("Attempt not found");
    await context.db.delete(payload.attemptId);
    return payload.attemptId;
  },
});
