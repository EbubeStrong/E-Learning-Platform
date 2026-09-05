import { describe, expect, it } from "vitest";
import { resolveTimerSelection } from "../src/lib/quiz-utils";

describe("resolveTimerSelection", () => {
  it("keeps an overall timed preference when a time limit exists", () => {
    expect(
      resolveTimerSelection(
        { mode: "timed", timerType: "overall" },
        { timeLimitSeconds: 600 },
      ),
    ).toEqual({ mode: "timed", timerType: "overall" });
  });

  it("falls back to untimed when no durations exist", () => {
    expect(
      resolveTimerSelection({ mode: "timed", timerType: "overall" }, null),
    ).toEqual({ mode: "untimed", timerType: "overall" });
    expect(
      resolveTimerSelection({ mode: "timed", timerType: "per-question" }, {}),
    ).toEqual({ mode: "untimed", timerType: "overall" });
  });

  it("switches overall to per-question when only per-question exists", () => {
    expect(
      resolveTimerSelection(
        { mode: "timed", timerType: "overall" },
        { perQuestionSeconds: 30 },
      ),
    ).toEqual({ mode: "timed", timerType: "per-question" });
  });

  it("switches per-question to overall when only a time limit exists", () => {
    expect(
      resolveTimerSelection(
        { mode: "timed", timerType: "per-question" },
        { timeLimitSeconds: 600 },
      ),
    ).toEqual({ mode: "timed", timerType: "overall" });
  });

  it("keeps an untimed preference untouched", () => {
    expect(
      resolveTimerSelection(
        { mode: "untimed", timerType: "overall" },
        { timeLimitSeconds: 600 },
      ),
    ).toEqual({ mode: "untimed", timerType: "overall" });
  });

  it("keeps a matching per-question preference when per-question exists", () => {
    expect(
      resolveTimerSelection(
        { mode: "timed", timerType: "per-question" },
        { perQuestionSeconds: 30 },
      ),
    ).toEqual({ mode: "timed", timerType: "per-question" });
  });
});