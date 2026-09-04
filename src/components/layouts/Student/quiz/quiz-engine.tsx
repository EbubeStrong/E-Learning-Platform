"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Clock3,
  Trophy,
  XCircle,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type {
  StartPayload,
  QuizResult,
} from "@/types/quiz";
import type { EngineProps } from "@/types/ui";

export default function QuizEngine({ courseId, type }: EngineProps) {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();

  const startQuiz = useMutation(api.attempts.start);
  const submitQuiz = useMutation(api.attempts.submit);

  const [quizSession, setQuizSession] = useState<StartPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overallRemainingSec, setOverallRemainingSec] = useState<number | null>(null);
  const [perQuestionRemainingSec, setPerQuestionRemainingSec] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef<number>(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      void redirectToSignIn({ signInFallbackRedirectUrl: `/quiz/${courseId}?type=${type}` });
    }
  }, [authLoaded, isSignedIn, courseId, type, redirectToSignIn]);

  const handleStart = useCallback(async () => {
    if (!userId) return;
    setStarting(true);
    setError(null);
    try {
      const res = (await startQuiz({
        userId,
        courseId,
        quizType: type,
      })) as unknown as StartPayload;
      setQuizSession(res);
      setAnswers({});
      setQuestionIndex(0);
      setResult(null);
      startedAtRef.current = Date.now();
      submittedRef.current = false;

      if (res.quiz.mode === "timed" && res.quiz.timerType === "overall") {
        setOverallRemainingSec(res.quiz.timeLimitSeconds ?? 0);
        setPerQuestionRemainingSec(null);
      } else if (res.quiz.mode === "timed" && res.quiz.timerType === "per-question") {
        setPerQuestionRemainingSec(res.quiz.perQuestionSeconds ?? 0);
        setOverallRemainingSec(null);
      } else {
        setOverallRemainingSec(null);
        setPerQuestionRemainingSec(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to start quiz";
      if (msg === "MAX_ATTEMPTS") {
        setError(
          `You have used all 3 attempts for this certification quiz.`
        );
      } else if (msg === "NO_QUESTIONS") {
        setError("No questions are available yet for this quiz.");
      } else {
        setError(msg);
      }
    } finally {
      setStarting(false);
    }
  }, [userId, courseId, type, startQuiz]);

  const handleSubmit = useCallback(async () => {
    if (!quizSession || !userId || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const answersArr = quizSession.questions.map((q) => ({
        questionId: q._id as Id<"questions">,
        chosenIndex: answersRef.current[q._id] ?? -1,
      }));
      const timeTakenMs = Date.now() - startedAtRef.current;
      const res = (await submitQuiz({
        attemptId: quizSession.attemptId as Id<"attempts">,
        userId,
        answers: answersArr,
        timeTakenMs,
      })) as unknown as QuizResult;
      setResult(res);
    } catch {
      setError("Failed to submit. Please try again.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [quizSession, userId, submitQuiz]);

  const advance = useCallback(() => {
    if (!quizSession) return;
    if (questionIndex + 1 >= quizSession.questions.length) {
      void handleSubmit();
    } else {
      setQuestionIndex((i) => i + 1);
      if (quizSession.quiz.timerType === "per-question") {
        setPerQuestionRemainingSec(quizSession.quiz.perQuestionSeconds ?? 0);
      }
    }
  }, [questionIndex, quizSession, handleSubmit]);

  // Overall countdown; auto-submit on expiry.
  useEffect(() => {
    if (overallRemainingSec === null) return;
    if (overallRemainingSec <= 0) {
      void handleSubmit();
      return;
    }
    const t = setTimeout(() => setOverallRemainingSec((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [overallRemainingSec, handleSubmit]);

  // Per-question countdown; advance on expiry.
  useEffect(() => {
    if (perQuestionRemainingSec === null) return;
    if (perQuestionRemainingSec <= 0) {
      const t = setTimeout(() => advance(), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPerQuestionRemainingSec((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [perQuestionRemainingSec, advance]);

  const question = quizSession?.questions[questionIndex];
  if (authLoaded && !isSignedIn) return null;

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory-200">
        <Skeleton className="h-24 w-80 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <CenterCard>
        <XCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <p className="text-center text-sm font-medium text-mocha-500">{error}</p>
        <div className="mt-5 flex justify-center gap-3">
          {type === "practice" && (
            <Button onClick={handleStart} className="cursor-pointer">
              Try again
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/quiz")}
            className="cursor-pointer"
          >
            Back to quizzes
          </Button>
        </div>
      </CenterCard>
    );
  }

  if (result) {
    const meta = quizSession!.quiz;
    return (
      <div className="min-h-screen bg-ivory-200 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard/quiz"
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-mocha-400 hover:text-mocha-500"
          >
            <ArrowLeft className="h-4 w-4" /> Back to quizzes
          </Link>

          <div className="rounded-3xl border border-mocha-300/60 bg-mocha-100 p-8 text-center">
            {result.passed ? (
              <Trophy className="mx-auto h-12 w-12 text-yellow-400" />
            ) : (
              <XCircle className="mx-auto h-12 w-12 text-mocha-300" />
            )}
            <h1 className="mt-3 text-2xl font-black text-mocha-500 md:text-3xl">
              {result.passed ? "Congratulations!" : "Try again"}
            </h1>
            <p className="mt-1 text-sm text-mocha-400">{meta.title}</p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-mocha-200/60 p-4">
                <p className="text-2xl font-black text-mocha-500">
                  {result.percent}%
                </p>
                <p className="text-xs text-mocha-400">Score</p>
              </div>
              <div className="rounded-2xl bg-mocha-200/60 p-4">
                <p className="text-2xl font-black text-mocha-500">
                  {result.correct}/{result.total}
                </p>
                <p className="text-xs text-mocha-400">Correct</p>
              </div>
              <div className="rounded-2xl bg-mocha-200/60 p-4">
                <p className="text-2xl font-black text-mocha-500">
                  {result.score}pts
                </p>
                <p className="text-xs text-mocha-400">Earned</p>
              </div>
            </div>

            {type === "certification" && (
              <div className="mt-4">
                {result.passed ? (
                  <Badge className="rounded-full bg-green-600 text-white">
                    Certificate unlocked
                  </Badge>
                ) : (
                  <p className="text-xs text-mocha-400">
                    Pass mark is {meta.passThreshold}%. You get up to 3
                    attempts; the remaining attempts are counted server-side.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={handleStart}
                className="cursor-pointer"
                disabled={submitting}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Retake quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="cursor-pointer"
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory-200 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-mocha-300/60 bg-mocha-100 p-8 text-center">
          <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
            {type}
          </Badge>
          <h1 className="text-2xl font-black text-mocha-500">
            Ready to take this quiz?
          </h1>
          <p className="mt-2 text-sm text-mocha-400">
            Questions are scored on the server and your best history is kept.
          </p>
          <div className="mt-6">
            <Button
              onClick={handleStart}
              disabled={starting}
              className="w-full cursor-pointer"
            >
              {starting ? "Starting..." : "Start quiz"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = ((questionIndex + 1) / quizSession.quiz.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-ivory-200 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Badge className="rounded-full bg-mocha-300 text-mocha-500">
              {quizSession.quiz.title}
            </Badge>
            <p className="mt-1 text-sm text-mocha-400">
              Question {questionIndex + 1} of {quizSession.quiz.totalQuestions}
            </p>
          </div>
          {quizSession.quiz.mode === "timed" && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold",
                timerDanger(
                  quizSession.quiz.timerType === "overall"
                    ? overallRemainingSec
                    : perQuestionRemainingSec
                )
                  ? "bg-red-100 text-red-600"
                  : "bg-mocha-300/60 text-mocha-500"
              )}
            >
              <Clock3 className="h-4 w-4" />
              {quizSession.quiz.timerType === "overall"
                ? formatClock(overallRemainingSec ?? 0)
                : formatClock(perQuestionRemainingSec ?? 0)}
            </div>
          )}
        </div>

        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-mocha-300/40">
          <div
            className="h-full rounded-full bg-mocha-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {question && (
          <div className="rounded-3xl border border-mocha-300/60 bg-mocha-100 p-6">
            <h2 className="text-lg font-bold leading-snug text-mocha-500 md:text-xl">
              {question.prompt}
            </h2>
            <div className="mt-5 space-y-2.5">
              {question.options.map((opt, oi) => {
                const selected = answers[question._id] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [question._id]: oi }))
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      selected
                        ? "border-mocha-500 bg-mocha-500/10 text-mocha-500"
                        : "border-mocha-300/60 hover:bg-mocha-300/20"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        selected
                          ? "bg-mocha-500 text-white"
                          : "bg-mocha-300/50 text-mocha-500"
                      )}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (questionIndex > 0) {
                setQuestionIndex((i) => i - 1);
                if (quizSession.quiz.timerType === "per-question") {
                  setPerQuestionRemainingSec(quizSession.quiz.perQuestionSeconds ?? 0);
                }
              }
            }}
            disabled={questionIndex === 0}
            className="cursor-pointer"
          >
            Previous
          </Button>
          {questionIndex + 1 < quizSession.quiz.totalQuestions ? (
            <Button onClick={advance} className="cursor-pointer">
              Next
            </Button>
          ) : (
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit quiz"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-200 px-4">
      <div className="w-full max-w-md rounded-3xl border border-mocha-300/60 bg-mocha-100 p-8">
        {children}
      </div>
    </div>
  );
}

function formatClock(sec: number) {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function timerDanger(sec: number | null) {
  return sec !== null && sec <= 10;
}
