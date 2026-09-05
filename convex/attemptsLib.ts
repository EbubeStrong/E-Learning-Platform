export type AttemptAnswer = { questionId: string; chosenIndex: number };

export type GradedQuestion = {
  questionId: string;
  correctIndex: number | undefined;
};

export type TimerType = "overall" | "per-question";
export type AttemptMode = "timed" | "untimed";

export type QuestionLike = { _id: string; isCore?: boolean };

/**
 * Grades an attempt. Unanswered or unrecognized questions count as incorrect.
 * A question with no known answer key (e.g. deleted) can never be correct.
 */
export function gradeAttempt(options: {
  questions: GradedQuestion[];
  answers: AttemptAnswer[];
  pointPerQuestion: number;
  totalQuestions: number;
  passThreshold: number;
}): { score: number; total: number; percent: number; correct: number; passed: boolean } {
  const answerMap = new Map(options.answers.map((answer) => [answer.questionId, answer.chosenIndex]));
  let correct = 0;
  for (const question of options.questions) {
    const selectedIndex = answerMap.get(question.questionId);
    if (selectedIndex !== undefined && selectedIndex === question.correctIndex) {
      correct++;
    }
  }

  const score = correct * options.pointPerQuestion;
  const total = options.totalQuestions * options.pointPerQuestion;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = options.passThreshold > 0 && percent >= options.passThreshold;
  return { score, total, percent, correct, passed };
}

export type CertificationEligibility = "eligible" | "already_passed" | "max_attempts";

/**
 * A passed certification locks the quiz even if attempts remain; otherwise a
 * user may keep attempting until CERTIFICATION_MAX_ATTEMPTS submissions.
 */
export function certificationEligibility(
  submitted: { percent?: number; passThreshold?: number | null }[],
  maxAttempts: number,
): CertificationEligibility {
  const alreadyPassed = submitted.some(
    (attempt) =>
      (attempt.passThreshold ?? 0) > 0 && (attempt.percent ?? 0) >= (attempt.passThreshold ?? 0),
  );
  if (alreadyPassed) return "already_passed";
  if (submitted.length >= maxAttempts) return "max_attempts";
  return "eligible";
}

/**
 * Server-side timing defaults, mirroring the client's resolveTimerSelection:
 * timed when any duration exists, otherwise untimed; overall timer preferred
 * when a whole-quiz time limit is present.
 */
export function resolveTimingParams(
  quiz: {
    timeLimitSeconds?: number | null;
    perQuestionSeconds?: number | null;
    totalQuestions: number;
  },
  requested: { mode?: AttemptMode; timerType?: TimerType },
  now: number,
): {
  mode: AttemptMode;
  timerType: TimerType;
  perQuestionSeconds: number;
  deadlineAt: number | undefined;
} {
  const mode = requested.mode ?? (quiz.timeLimitSeconds || quiz.perQuestionSeconds ? "timed" : "untimed");
  const timerType = requested.timerType ?? (quiz.timeLimitSeconds ? "overall" : "per-question");
  const perQuestionSeconds =
    quiz.perQuestionSeconds ?? Math.round((quiz.timeLimitSeconds ?? 0) / Math.max(1, quiz.totalQuestions));
  const deadlineAt = mode === "timed" && quiz.timeLimitSeconds ? now + quiz.timeLimitSeconds * 1000 : undefined;
  return { mode, timerType, perQuestionSeconds, deadlineAt };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Certification quizzes surface core questions first (preserving the original
 * core-then-rest sampling); practice quizzes are a plain random sample.
 */
export function pickQuestions<T extends QuestionLike>(
  pool: T[],
  total: number,
  options: { certification: boolean; rng?: () => number },
): T[] {
  const rng = options.rng ?? Math.random;
  if (options.certification) {
    const core = shuffle(pool.filter((question) => question.isCore), rng);
    const rest = shuffle(pool.filter((question) => !question.isCore), rng);
    return [...core, ...rest].slice(0, Math.min(total, pool.length));
  }
  return shuffle(pool, rng).slice(0, Math.min(total, pool.length));
}

export type StatAttempt = {
  percent?: number;
  timeTakenMs?: number;
  quizType?: "practice" | "certification";
  passThreshold?: number | null;
};

/**
 * All-time stats. The average is computed over every submitted attempt, while
 * certAvg (used by the target-score card) covers certification attempts only.
 */
export function computeStats(attempts: StatAttempt[]): {
  taken: number;
  avg: number;
  highest: number;
  lowest: number;
  totalTimeMs: number;
  certAvg: number | null;
  certificationPassed: number;
} {
  const percentiles = attempts.map((attempt) => attempt.percent ?? 0);
  const count = percentiles.length;
  const avg = count ? Math.round(percentiles.reduce((sum, percent) => sum + percent, 0) / count) : 0;
  const highest = count ? Math.max(...percentiles) : 0;
  const lowest = count ? Math.min(...percentiles) : 0;
  const totalTimeMs = attempts.reduce((total, attempt) => total + (attempt.timeTakenMs ?? 0), 0);

  const certPercentiles = attempts
    .filter((attempt) => attempt.quizType === "certification")
    .map((attempt) => attempt.percent ?? 0);
  const certCount = certPercentiles.length;
  const certAvg = certCount
    ? Math.round(certPercentiles.reduce((sum, percent) => sum + percent, 0) / certCount)
    : null;

  const certificationPassed = attempts.filter(
    (attempt) =>
      attempt.quizType === "certification" &&
      (attempt.passThreshold ?? 0) > 0 &&
      (attempt.percent ?? 0) >= (attempt.passThreshold ?? 0),
  ).length;

  return { taken: count, avg, highest, lowest, totalTimeMs, certAvg, certificationPassed };
}