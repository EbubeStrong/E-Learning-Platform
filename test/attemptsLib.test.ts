import { describe, expect, it } from "vitest";
import {
  certificationEligibility,
  computeStats,
  gradeAttempt,
  pickQuestions,
  resolveTimingParams,
  type StatAttempt,
} from "../convex/attemptsLib";

describe("gradeAttempt", () => {
  const questions = [
    { questionId: "q1", correctIndex: 0 },
    { questionId: "q2", correctIndex: 2 },
    { questionId: "q3", correctIndex: 1 },
    { questionId: "q4", correctIndex: 3 },
    { questionId: "q5", correctIndex: 0 },
    { questionId: "q6", correctIndex: 2 },
    { questionId: "q7", correctIndex: 1 },
    { questionId: "q8", correctIndex: 3 },
    { questionId: "q9", correctIndex: 0 },
    { questionId: "q10", correctIndex: 2 },
  ];

  it("computes 80% with 8/10 correct and passes at a 75% threshold", () => {
    const answers = questions.slice(0, 8).map((question) => ({ questionId: question.questionId, chosenIndex: question.correctIndex }));
    const result = gradeAttempt({
      questions,
      answers,
      pointPerQuestion: 1,
      totalQuestions: 10,
      passThreshold: 75,
    });
    expect(result).toEqual({ score: 8, total: 10, percent: 80, correct: 8, passed: true });
  });

  it("fails at 70% with 7/10 correct on a 75% threshold", () => {
    const answers = questions.slice(0, 7).map((question) => ({ questionId: question.questionId, chosenIndex: question.correctIndex }));
    const result = gradeAttempt({
      questions,
      answers,
      pointPerQuestion: 1,
      totalQuestions: 10,
      passThreshold: 75,
    });
    expect(result).toEqual({ score: 7, total: 10, percent: 70, correct: 7, passed: false });
  });

  it("treats unanswered questions as incorrect", () => {
    const answers = questions.slice(0, 5).map((question) => ({ questionId: question.questionId, chosenIndex: question.correctIndex }));
    const result = gradeAttempt({
      questions,
      answers,
      pointPerQuestion: 1,
      totalQuestions: 10,
      passThreshold: 50,
    });
    expect(result.correct).toBe(5);
    expect(result.percent).toBe(50);
  });

  it("never counts attempts for questions without an answer key", () => {
    const questionsWithGap = [
      { questionId: "q1", correctIndex: 0 },
      { questionId: "q2", correctIndex: undefined },
    ];
    const result = gradeAttempt({
      questions: questionsWithGap,
      answers: [
        { questionId: "q1", chosenIndex: 0 },
        { questionId: "q2", chosenIndex: 2 },
      ],
      pointPerQuestion: 1,
      totalQuestions: 2,
      passThreshold: 75,
    });
    expect(result.correct).toBe(1);
    expect(result.percent).toBe(50);
  });

  it("ignores extra chosen answers that are not in the attempt", () => {
    const result = gradeAttempt({
      questions,
      answers: [
        { questionId: "q1", chosenIndex: 0 },
        { questionId: "q99", chosenIndex: 0 },
      ],
      pointPerQuestion: 1,
      totalQuestions: 10,
      passThreshold: 75,
    });
    expect(result.correct).toBe(1);
    expect(result.percent).toBe(10);
  });

  it("never passes when the threshold is 0", () => {
    const result = gradeAttempt({
      questions,
      answers: questions.map((question) => ({ questionId: question.questionId, chosenIndex: question.correctIndex })),
      pointPerQuestion: 1,
      totalQuestions: 10,
      passThreshold: 0,
    });
    expect(result.percent).toBe(100);
    expect(result.passed).toBe(false);
  });
});

describe("certificationEligibility", () => {
  const failedAttempt = { percent: 40, passThreshold: 75 };
  const passedAttempt = { percent: 90, passThreshold: 75 };

  it("allows starting with no submissions", () => {
    expect(certificationEligibility([], 3)).toBe("eligible");
  });

  it("allows retries while under the max attempt count", () => {
    expect(certificationEligibility([failedAttempt, failedAttempt], 3)).toBe("eligible");
  });

  it("locks after reaching the max attempt count", () => {
    expect(certificationEligibility([failedAttempt, failedAttempt, failedAttempt], 3)).toBe("max_attempts");
  });

  it("locks after passing regardless of remaining attempts", () => {
    expect(certificationEligibility([failedAttempt, passedAttempt], 3)).toBe("already_passed");
    expect(certificationEligibility([passedAttempt], 1)).toBe("already_passed");
  });
});

describe("resolveTimingParams", () => {
  it("defaults to a timed overall timer when a whole-quiz limit exists", () => {
    const result = resolveTimingParams({ timeLimitSeconds: 600, perQuestionSeconds: null, totalQuestions: 10 }, {}, 1000);
    expect(result).toEqual({ mode: "timed", timerType: "overall", perQuestionSeconds: 60, deadlineAt: 601000 });
  });

  it("defaults to timed per-question when only per-question seconds exist", () => {
    const result = resolveTimingParams({ timeLimitSeconds: null, perQuestionSeconds: 30, totalQuestions: 10 }, {}, 0);
    expect(result).toEqual({ mode: "timed", timerType: "per-question", perQuestionSeconds: 30, deadlineAt: undefined });
  });

  it("defaults to untimed when no durations exist", () => {
    const result = resolveTimingParams({ timeLimitSeconds: null, perQuestionSeconds: null, totalQuestions: 10 }, {}, 0);
    expect(result).toEqual({ mode: "untimed", timerType: "per-question", perQuestionSeconds: 0, deadlineAt: undefined });
  });

  it("honors explicitly requested mode and timer type", () => {
    const result = resolveTimingParams(
      { timeLimitSeconds: 600, perQuestionSeconds: null, totalQuestions: 10 },
      { mode: "untimed", timerType: "per-question" },
      0,
    );
    expect(result.mode).toBe("untimed");
    expect(result.timerType).toBe("per-question");
    expect(result.deadlineAt).toBeUndefined();
  });
});

describe("pickQuestions", () => {
  const pool = Array.from({ length: 8 }, (_, i) => ({ _id: `q${i}`, isCore: i < 5 }));

  it("caps the selection at the requested total", () => {
    const practice = pickQuestions(pool, 3, { certification: false, rng: () => 0 });
    expect(practice).toHaveLength(3);
  });

  it("keeps practice selection within the pool", () => {
    const practice = pickQuestions(pool, 100, { certification: false, rng: () => 0 });
    expect(practice).toHaveLength(pool.length);
    expect(new Set(practice.map((question) => question._id)).size).toBe(pool.length);
  });

  it("places core questions before the rest on certification quizzes", () => {
    const picked = pickQuestions(pool, 100, { certification: true, rng: () => 0 });
    const coreIds = new Set(pool.filter((question) => question.isCore).map((question) => question._id));
    const firstCoreCount = picked.filter((question) => coreIds.has(question._id)).length;
    // With rng() => 0 every shuffle keeps the original order, so all core
    // questions lead the pack.
    expect(firstCoreCount).toBe(5);
    for (let i = 0; i < picked.length; i++) {
      if (i < firstCoreCount) {
        expect(coreIds.has(picked[i]._id)).toBe(true);
      } else {
        expect(coreIds.has(picked[i]._id)).toBe(false);
      }
    }
  });

  it("is deterministic for a given rng", () => {
    const createLcg = (seed: number) => () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const firstResult = pickQuestions(pool, 6, { certification: true, rng: createLcg(42) });
    const secondResult = pickQuestions(pool, 6, { certification: true, rng: createLcg(42) });
    expect(secondResult.map((question) => question._id)).toEqual(firstResult.map((question) => question._id));
  });
});

describe("computeStats", () => {
  const certPass80: StatAttempt = { percent: 80, timeTakenMs: 1000, quizType: "certification", passThreshold: 75 };
  const certFail70: StatAttempt = { percent: 70, timeTakenMs: 2000, quizType: "certification", passThreshold: 75 };
  const practiceFail50: StatAttempt = { percent: 50, timeTakenMs: 500, quizType: "practice", passThreshold: 75 };
  const practicePass90: StatAttempt = { percent: 90, timeTakenMs: 500, quizType: "practice", passThreshold: 75 };

  it("returns zeroed stats for an empty history", () => {
    expect(computeStats([])).toEqual({
      taken: 0,
      avg: 0,
      highest: 0,
      lowest: 0,
      totalTimeMs: 0,
      certAvg: null,
      certificationPassed: 0,
    });
  });

  it("averages every attempt but certAvg covers certification attempts only", () => {
    const stats = computeStats([certPass80, certFail70, practiceFail50]);
    expect(stats.taken).toBe(3);
    expect(stats.highest).toBe(80);
    expect(stats.lowest).toBe(50);
    expect(stats.avg).toBe(67); // round((80 + 70 + 50) / 3)
    expect(stats.certAvg).toBe(75); // round((80 + 70) / 2)
    expect(stats.certificationPassed).toBe(1);
  });

  it("counts only certification passes against certificationPassed", () => {
    const stats = computeStats([certPass80, practicePass90]);
    expect(stats.certificationPassed).toBe(1);
    expect(stats.certAvg).toBe(80);
  });
});