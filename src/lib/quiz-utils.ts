export type TimerSelection = {
  mode: "timed" | "untimed";
  timerType: "overall" | "per-question";
};

export type QuizTimerMeta = {
  timeLimitSeconds?: number;
  perQuestionSeconds?: number;
} | null
  | undefined;

/**
 * Resolves the effective timer selection against what the quiz actually
 * supports. A timed preference falls back to untimed when no durations exist,
 * and swaps overall/per-question when only the other duration is available.
 */
export function resolveTimerSelection(
  preference: TimerSelection,
  meta: QuizTimerMeta
): TimerSelection {
  const hasOverall = Boolean(meta?.timeLimitSeconds);
  const hasPerQuestion = Boolean(meta?.perQuestionSeconds);
  if (preference.mode === "timed" && !hasOverall && !hasPerQuestion) {
    return { mode: "untimed", timerType: "overall" };
  }
  if (preference.mode === "timed" && preference.timerType === "overall" && !hasOverall && hasPerQuestion) {
    return { mode: "timed", timerType: "per-question" };
  }
  if (preference.mode === "timed" && preference.timerType === "per-question" && !hasPerQuestion && hasOverall) {
    return { mode: "timed", timerType: "overall" };
  }
  return preference;
}