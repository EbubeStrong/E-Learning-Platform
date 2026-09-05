import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Doc, type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { CERTIFICATION_MAX_ATTEMPTS } from "./constants";
import { getAuthedUser, requireUser } from "./lib/authz";
import {
  certificationEligibility,
  computeStats,
  gradeAttempt,
  pickQuestions,
  resolveTimingParams,
} from "./attemptsLib";

type StartArgs = {
  userId: Id<"users">;
  courseId: string;
  quizType: "practice" | "certification";
};

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
  const questions: { questionId: string; correctIndex: number | undefined }[] = [];
  for (const answer of attempt.answers) {
    const question = await context.db.get(answer.questionId);
    questions.push({ questionId: String(answer.questionId), correctIndex: question?.correctIndex });
  }

  const graded = gradeAttempt({
    questions,
    answers,
    pointPerQuestion: attempt.pointPerQuestion,
    totalQuestions: attempt.totalQuestions,
    passThreshold: attempt.passThreshold ?? 0,
  });
  const { score, total, percent, correct, passed } = graded;

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
  if (attempt.quizType === "certification" && passed) {
    await context.runMutation(internal.certificates.unlock, {
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
    passed,
  };
}

async function resumePayload(context: MutationCtx, attempt: Doc<"attempts">) {
  const questions: { _id: Id<"questions">; prompt: string; options: string[] }[] = [];
  for (const answer of attempt.answers) {
    const question = await context.db.get(answer.questionId);
    if (question) {
      questions.push({ _id: question._id, prompt: question.prompt, options: question.options });
    }
  }

  // Keep the user's saved selections so a resume never loses progress.
  const answers: Record<string, number> = {};
  for (const answer of attempt.answers) {
    if (answer.chosenIndex >= 0) answers[String(answer.questionId)] = answer.chosenIndex;
  }

  const overallRemainingSec =
    attempt.mode === "timed" &&
    attempt.timerType === "overall" &&
    attempt.deadlineAt != null
      ? Math.max(0, Math.round((attempt.deadlineAt - Date.now()) / 1000))
      : null;

  return {
    attemptId: attempt._id,
    questions,
    quiz: {
      title: attempt.quizTitle,
      totalQuestions: attempt.totalQuestions,
      pointPerQuestion: attempt.pointPerQuestion,
      totalPoints: attempt.totalPoints,
      mode: attempt.mode,
      timerType: attempt.timerType ?? "overall",
      timeLimitSeconds: attempt.timeLimitSeconds,
      perQuestionSeconds: attempt.perQuestionSeconds,
      passThreshold: attempt.passThreshold,
      deadlineAt: attempt.deadlineAt,
    },
    answers,
    overallRemainingSec,
  };
}

export const start = mutation({
  args: {
    courseId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("certification")),
    mode: v.optional(v.union(v.literal("timed"), v.literal("untimed"))),
    timerType: v.optional(v.union(v.literal("overall"), v.literal("per-question"))),
  },
  handler: async (context, payload) => {
    const user = await requireUser(context);

    const quiz = await getQuizMeta(context, payload.courseId, payload.quizType);
    if (!quiz) throw new Error("Quiz not found");

    await autoSubmitExpired(context, user._id);

    const now = Date.now();

    // Resume an existing live attempt for this quiz instead of starting a new one.
    // The deadline is anchored to when the attempt was first opened and never resets.
    const inProgress = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("quizType"), payload.quizType))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    if (inProgress.length > 0) {
      const active = inProgress.sort((attemptA, attemptB) => attemptB.startedAt - attemptA.startedAt)[0];
      if (!(active.deadlineAt && active.deadlineAt < now)) {
        return await resumePayload(context, active);
      }
      // Otherwise it already expired; autoSubmitExpired graded it above, so start fresh.
    }

    if (payload.quizType === "certification") {
      const submitted = await context.db
        .query("attempts")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .filter((q) => q.eq(q.field("courseId"), payload.courseId))
        .filter((q) => q.eq(q.field("quizType"), "certification"))
        .filter((q) => q.eq(q.field("status"), "submitted"))
        .collect();
      const eligibility = certificationEligibility(submitted, CERTIFICATION_MAX_ATTEMPTS);
      if (eligibility === "already_passed") throw new Error("ALREADY_PASSED");
      if (eligibility === "max_attempts") throw new Error("MAX_ATTEMPTS");
    }

    const pool = await context.db
      .query("questions")
      .filter((q) => q.eq(q.field("courseId"), payload.courseId))
      .filter((q) => q.eq(q.field("quizType"), payload.quizType))
      .collect();

    const selected = pickQuestions(pool, quiz.totalQuestions, {
      certification: payload.quizType === "certification",
    });

    if (selected.length === 0) throw new Error("NO_QUESTIONS");

    const { mode, timerType, perQuestionSeconds, deadlineAt } = resolveTimingParams(
      quiz,
      payload,
      now
    );

    const attemptId = await context.db.insert("attempts", {
      userId: user._id,
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
      perQuestionSeconds,
      passThreshold: quiz.passThreshold,
      startedAt: now,
      deadlineAt,
      answers: selected.map((question) => ({ questionId: question._id, chosenIndex: -1 })),
    });

    await context.db.patch(user._id, { lastActiveAt: Date.now() });

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
        perQuestionSeconds,
        passThreshold: quiz.passThreshold,
        deadlineAt,
      },
      // explanation is intentionally withheld here — it can hint at the
      // correct answer. Fetch it after submission (e.g. via a review query)
      // once the attempt is graded.
      questions: selected.map((question) => ({
        _id: question._id,
        prompt: question.prompt,
        options: question.options,
      })),
      answers: {},
      overallRemainingSec:
        mode === "timed" && timerType === "overall" && quiz.timeLimitSeconds
          ? quiz.timeLimitSeconds
          : null,
    };
  },
});

export const submit = mutation({
  args: {
    attemptId: v.id("attempts"),
    answers: v.array(v.object({ questionId: v.id("questions"), chosenIndex: v.number() })),
    timeTakenMs: v.optional(v.number()),
  },
  handler: async (context, payload) => {
    const user = await requireUser(context);
    const attempt = await context.db.get(payload.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status === "submitted") throw new Error("Already submitted");

    return await submitAttempt(context, attempt, payload.answers, payload.timeTakenMs ?? null);
  },
});

export const saveProgress = mutation({
  args: {
    attemptId: v.id("attempts"),
    answers: v.array(v.object({ questionId: v.id("questions"), chosenIndex: v.number() })),
  },
  handler: async (context, payload) => {
    const user = await requireUser(context);
    const attempt = await context.db.get(payload.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    if (attempt.status === "submitted") throw new Error("Already submitted");

    const selected = new Map(payload.answers.map((answer) => [String(answer.questionId), answer.chosenIndex]));
    const merged = attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      chosenIndex: selected.get(String(answer.questionId)) ?? answer.chosenIndex,
    }));

    await context.db.patch(attempt._id, { answers: merged });
    await context.db.patch(user._id, { lastActiveAt: Date.now() });
    return true;
  },
});

export const autoSubmitPending = mutation({
  args: {},
  handler: async (context) => {
    const user = await requireUser(context);
    const before = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    await autoSubmitExpired(context, user._id);
    const after = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
    return { submitted: before.length - after.length, remainingInProgress: after.length };
  },
});

export const listForUser = query({
  args: { quizType: v.optional(v.union(v.literal("practice"), v.literal("certification"))) },
  handler: async (context, payload) => {
    const user = await getAuthedUser(context);
    if (!user) return []; // signed out / not yet provisioned
    const baseQuery = context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), user._id));
    const attempts = payload.quizType
      ? await baseQuery.filter((q) => q.eq(q.field("quizType"), payload.quizType)).collect()
      : await baseQuery.collect();
    return attempts.sort((attemptA, attemptB) => attemptB.startedAt - attemptA.startedAt);
  },
});

export const stats = query({
  args: {},
  handler: async (context) => {
    const user = await getAuthedUser(context);
    if (!user) {
      return computeStats([]);
    }
    const attempts = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    return computeStats(attempts);
  },
});

export const pendingDeadlines = query({
  args: {},
  handler: async (context) => {
    const user = await getAuthedUser(context);
    if (!user) return []; // signed out / not yet provisioned
    const now = Date.now();
    const inProgress = await context.db
      .query("attempts")
      .filter((q) => q.eq(q.field("userId"), user._id))
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
  args: { attemptId: v.id("attempts") },
  handler: async (context, payload) => {
    const user = await requireUser(context);
    const attempt = await context.db.get(payload.attemptId);
    if (!attempt || attempt.userId !== user._id) throw new Error("Attempt not found");
    await context.db.delete(payload.attemptId);
    return payload.attemptId;
  },
});
