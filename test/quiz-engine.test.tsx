// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizEngine from "@/components/layouts/Student/quiz/quiz-engine";

const queries = vi.hoisted(() => ({
  quizMeta: {
    passThreshold: 75,
    timeLimitSeconds: 600,
    perQuestionSeconds: null,
  } as Record<string, unknown> | undefined | null,
  attempts: [] as Array<Record<string, unknown>>,
}));

const startQuiz = vi.hoisted(() => vi.fn());
const redirectToSignIn = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useClerk: () => ({ redirectToSignIn }),
}));

vi.mock("@/lib/provider", () => ({
  useUserDetails: () => ({ userDetails: { _id: "user_1" } }),
}));

vi.mock("convex/react", () => ({
  useMutation: () => startQuiz,
  useQuery: (_fn: unknown, args: unknown) =>
    args && typeof args === "object" && "type" in args
      ? queries.quizMeta
      : queries.attempts,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { type ReactNode } from "react";

function attempt(overrides: Record<string, unknown>) {
  return { courseId: "course_1", quizType: "practice", status: "in_progress", ...overrides };
}

beforeEach(() => {
  queries.quizMeta = {
    passThreshold: 75,
    timeLimitSeconds: 600,
    perQuestionSeconds: null,
  };
  queries.attempts = [];
  startQuiz.mockReset();
  startQuiz.mockResolvedValue({
    attemptId: "attempt_1",
    quiz: {
      title: "Practice Quiz",
      totalQuestions: 1,
      pointPerQuestion: 1,
      totalPoints: 1,
      mode: "timed",
      timerType: "overall",
      timeLimitSeconds: 600,
      perQuestionSeconds: 60,
      passThreshold: 75,
      deadlineAt: 9999999999999,
    },
    questions: [
      { _id: "q1", prompt: "What is 2+2?", options: ["3", "4", "5", "6"] },
    ],
    answers: {},
    overallRemainingSec: 600,
  });
  redirectToSignIn.mockReset();
  push.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuizEngine launch screen", () => {
  it("shows the Start quiz button with the overall timer pre-selected", () => {
    render(<QuizEngine courseId="course_1" type="practice" />);
    expect(screen.getByRole("button", { name: /start quiz/i })).toBeInTheDocument();
    expect(screen.getByText("Overall · 10 min")).toBeInTheDocument();
  });

  it("starts the quiz with the resolved timed/overall selection", async () => {
    const user = userEvent.setup();
    render(<QuizEngine courseId="course_1" type="practice" />);
    await user.click(screen.getByRole("button", { name: /start quiz/i }));
    expect(startQuiz).toHaveBeenCalledWith({
      courseId: "course_1",
      quizType: "practice",
      mode: "timed",
      timerType: "overall",
    });
  });

  it("shows the resume state when an in-progress attempt exists", () => {
    queries.attempts = [attempt({ quizType: "practice", status: "in_progress" })];
    render(<QuizEngine courseId="course_1" type="practice" />);
    expect(screen.getByText("Resume this quiz?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume quiz/i })).toBeInTheDocument();
  });

  it("locks the quiz after all certification attempts are used", () => {
    queries.attempts = [
      attempt({ quizType: "certification", status: "submitted", percent: 40, passThreshold: 75 }),
      attempt({ quizType: "certification", status: "submitted", percent: 50, passThreshold: 75 }),
      attempt({ quizType: "certification", status: "submitted", percent: 60, passThreshold: 75 }),
    ];
    render(<QuizEngine courseId="course_1" type="certification" />);
    expect(screen.getByText("Quiz locked")).toBeInTheDocument();
    expect(
      screen.getByText("You have used all 3 attempts for this certification quiz."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start quiz/i })).not.toBeInTheDocument();
  });

  it("locks the quiz after a passing attempt even with attempts remaining", () => {
    queries.attempts = [
      attempt({ quizType: "certification", status: "submitted", percent: 90, passThreshold: 75 }),
    ];
    render(<QuizEngine courseId="course_1" type="certification" />);
    expect(screen.getByText("Quiz locked")).toBeInTheDocument();
    expect(
      screen.getByText("You have already earned the certificate for this quiz."),
    ).toBeInTheDocument();
  });

  it("shows remaining certification attempts on the launch screen", () => {
    queries.attempts = [
      attempt({ quizType: "certification", status: "submitted", percent: 40, passThreshold: 75 }),
    ];
    render(<QuizEngine courseId="course_1" type="certification" />);
    expect(screen.getByText(/Pass at 75% · 2 of 3 attempts remaining/)).toBeInTheDocument();
  });
});