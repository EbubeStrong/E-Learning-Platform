"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock3,
  Trophy,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Flag,
} from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { StartPayload, QuizResult } from "@/types/quiz";
import type { EngineProps } from "@/types/ui";
import { resolveTimerSelection, type TimerSelection } from "@/lib/quiz-utils";

const CERT_MAX_ATTEMPTS = 3;

export default function QuizEngine({ courseId, type }: EngineProps) {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();
  const router = useRouter();

  const startQuiz = useMutation(api.attempts.start);
  const submitQuiz = useMutation(api.attempts.submit);
  const saveProgress = useMutation(api.attempts.saveProgress);

  const quizMeta = useQuery(
    api.quizzes.getForCourse,
    userId ? { courseId, type } : "skip"
  );
  const attempts = useQuery(api.attempts.listForUser, userId ? {} : "skip");

  const [quizSession, setQuizSession] = useState<StartPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overallRemainingSec, setOverallRemainingSec] = useState<number | null>(null);
  const [perQuestionRemainingSec, setPerQuestionRemainingSec] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerPreference, setTimerPreference] = useState<TimerSelection>({
    mode: "timed",
    timerType: "overall",
  });
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  const answersRef = useRef<Record<string, number>>({});
  const startedAtRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const lastSavedAnswersRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      void redirectToSignIn({ signInFallbackRedirectUrl: `/quiz/${courseId}?type=${type}` });
    }
  }, [authLoaded, isSignedIn, courseId, type, redirectToSignIn]);

  // Fall back to whatever timer is actually available on this quiz.
  const effectiveTimerSelection = resolveTimerSelection(timerPreference, quizMeta);

  // Debounced persistence so a resume (or an expired auto-submit) keeps answers.
  useEffect(() => {
    if (!quizSession || result || submittedRef.current) return;
    const json = JSON.stringify(answers, Object.keys(answers).sort());
    if (json === lastSavedAnswersRef.current) return;
    lastSavedAnswersRef.current = json;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (submittedRef.current || json !== lastSavedAnswersRef.current) return;
      const arr = Object.entries(answersRef.current).map(([questionId, chosenIndex]) => ({
        questionId: questionId as Id<"questions">,
        chosenIndex,
      }));
      void saveProgress({
        attemptId: quizSession.attemptId as Id<"attempts">,
        answers: arr,
      }).catch(() => {});
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [answers, quizSession, result, saveProgress]);

  const certAttempts = (attempts ?? []).filter(
    (attempt) => attempt.courseId === courseId && attempt.quizType === "certification"
  );
  const submittedCertCount = certAttempts.filter((attempt) => attempt.status === "submitted").length;
  const passedOnce = certAttempts.some(
    (attempt) => attempt.percent != null && attempt.percent >= (quizMeta?.passThreshold ?? 0)
  );
  const inProgressAttempt = (attempts ?? []).find(
    (attempt) => attempt.courseId === courseId && attempt.quizType === type && attempt.status === "in_progress"
  );
  const attemptsLeft = Math.max(0, CERT_MAX_ATTEMPTS - submittedCertCount);
  const locked = passedOnce || (type === "certification" && submittedCertCount >= CERT_MAX_ATTEMPTS);

  const handleStart = useCallback(async () => {
    if (!userId) return;
    setStarting(true);
    setError(null);
    try {
      const selection = resolveTimerSelection(timerPreference, quizMeta);
      const result = (await startQuiz({
        courseId,
        quizType: type,
        mode: selection.mode,
        timerType: selection.timerType,
      })) as unknown as StartPayload;
      setQuizSession(result);
      setAnswers(result.answers ?? {});
      answersRef.current = result.answers ?? {};
      lastSavedAnswersRef.current = JSON.stringify(result.answers ?? {});
      const resumeIndex = (result.questions ?? []).findIndex(
        (question) => (result.answers ?? {})[question._id] == null
      );
      setQuestionIndex(Math.max(0, resumeIndex));
      setResult(null);
      startedAtRef.current = Date.now();
      submittedRef.current = false;

      if (result.quiz.mode === "timed" && result.quiz.timerType === "overall") {
        setOverallRemainingSec(result.overallRemainingSec ?? result.quiz.timeLimitSeconds ?? 0);
        setPerQuestionRemainingSec(null);
      } else if (result.quiz.mode === "timed" && result.quiz.timerType === "per-question") {
        setPerQuestionRemainingSec(result.quiz.perQuestionSeconds ?? 0);
        setOverallRemainingSec(null);
      } else {
        setOverallRemainingSec(null);
        setPerQuestionRemainingSec(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start quiz";
      if (message === "MAX_ATTEMPTS") {
        setError(
          `You have used all ${CERT_MAX_ATTEMPTS} attempts for this certification quiz.`
        );
      } else if (message === "ALREADY_PASSED") {
        setError("You have already passed this certification quiz.");
      } else if (message === "NO_QUESTIONS") {
        setError("No questions are available yet for this quiz.");
      } else {
        setError(message);
      }
    } finally {
      setStarting(false);
    }
  }, [userId, courseId, type, startQuiz, timerPreference, quizMeta]);

  const handleSubmit = useCallback(async () => {
    if (!quizSession || !userId || submittedRef.current) return;
    submittedRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSubmitting(true);
    try {
      const answersArr = quizSession.questions.map((question) => ({
        questionId: question._id as Id<"questions">,
        chosenIndex: answersRef.current[question._id] ?? -1,
      }));
      const timeTakenMs = Date.now() - startedAtRef.current;
      const result = (await submitQuiz({
        attemptId: quizSession.attemptId as Id<"attempts">,
        answers: answersArr,
        timeTakenMs,
      })) as unknown as QuizResult;
      setResult(result);
    } catch {
      setError("Failed to submit. Please try again.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [quizSession, userId, submitQuiz]);

  const handleTimerChange = useCallback((value: string | null) => {
    if (value === "timed:overall") {
      setTimerPreference({ mode: "timed", timerType: "overall" });
    } else if (value === "timed:per-question") {
      setTimerPreference({ mode: "timed", timerType: "per-question" });
    } else if (value === "untimed:overall") {
      setTimerPreference({ mode: "untimed", timerType: "overall" });
    }
  }, []);

  const advance = useCallback(() => {
    if (!quizSession) return;
    if (questionIndex + 1 >= quizSession.questions.length) {
      void handleSubmit();
    } else {
      setQuestionIndex((index) => index + 1);
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
    const timer = setTimeout(() => setOverallRemainingSec((seconds) => (seconds ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [overallRemainingSec, handleSubmit]);

  // Per-question countdown; advance on expiry.
  useEffect(() => {
    if (perQuestionRemainingSec === null) return;
    if (perQuestionRemainingSec <= 0) {
      const timer = setTimeout(() => advance(), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPerQuestionRemainingSec((seconds) => (seconds ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [perQuestionRemainingSec, advance]);

  const question = quizSession?.questions[questionIndex];
  if (authLoaded && !isSignedIn) return null;

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory-200 dark:bg-nero-marquina-300">
        <Skeleton className="h-24 w-full max-w-xs rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <CenterCard>
        <XCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <p className="text-center text-sm font-medium text-mocha-500">{error}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
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
    const canRetake = type === "practice" ? true : result.passed ? false : attemptsLeft > 0;
    return (
      <div className="min-h-screen bg-ivory-200 dark:bg-nero-marquina-300 px-4 py-10">
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
              <div className="rounded-2xl bg-mocha-200/60 p-3 sm:p-4">
                <p className="text-xl font-black text-mocha-500 sm:text-2xl">
                  {result.percent}%
                </p>
                <p className="text-xs text-mocha-400">Score</p>
              </div>
              <div className="rounded-2xl bg-mocha-200/60 p-3 sm:p-4">
                <p className="text-xl font-black text-mocha-500 sm:text-2xl">
                  {result.correct}/{result.total}
                </p>
                <p className="text-xs text-mocha-400">Correct</p>
              </div>
              <div className="rounded-2xl bg-mocha-200/60 p-3 sm:p-4">
                <p className="text-xl font-black text-mocha-500 sm:text-2xl">
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
                    Pass mark is {meta.passThreshold}%. You have {attemptsLeft} of{" "}
                    {CERT_MAX_ATTEMPTS} attempts remaining.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {canRetake && (
                <Button
                  onClick={handleStart}
                  className="cursor-pointer"
                  disabled={submitting}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Retake quiz
                </Button>
              )}
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
    const timerItems = [
      ...(quizMeta?.timeLimitSeconds
        ? [
            {
              value: "timed:overall",
              label: `Overall · ${Math.round(quizMeta.timeLimitSeconds / 60)} min`,
            },
          ]
        : []),
      ...(quizMeta?.perQuestionSeconds
        ? [
            {
              value: "timed:per-question",
              label: `Per-question · ${quizMeta.perQuestionSeconds} sec each`,
            },
          ]
        : []),
      { value: "untimed:overall", label: "Untimed" },
    ];
    const timerKey = `${effectiveTimerSelection.mode}:${effectiveTimerSelection.timerType}`;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory-200 dark:bg-nero-marquina-300 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-mocha-300/60 bg-mocha-100 p-8 text-center">
          <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
            {type}
          </Badge>
          {locked ? (
            <>
              <h1 className="text-2xl font-black text-mocha-500">Quiz locked</h1>
              <p className="mt-2 text-sm text-mocha-400">
                {passedOnce
                  ? "You have already earned the certificate for this quiz."
                  : `You have used all ${CERT_MAX_ATTEMPTS} attempts for this certification quiz.`}
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/quiz")}
                  className="w-full cursor-pointer"
                >
                  Back to quizzes
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-mocha-500">
                {inProgressAttempt ? "Resume this quiz?" : "Ready to take this quiz?"}
              </h1>
              <p className="mt-2 text-sm text-mocha-400">
                {inProgressAttempt
                  ? "Your answers are saved. The clock resumes from where it started."
                  : "Questions are scored on the server and your best history is kept."}
              </p>
              {type === "certification" && (
                <p className="mt-1 text-xs text-mocha-400">
                  Pass at {quizMeta?.passThreshold ?? 75}% · {attemptsLeft} of{" "}
                  {CERT_MAX_ATTEMPTS} attempts remaining
                </p>
              )}

              <div className="mt-6 space-y-4 text-left">
                {quizMeta === undefined || attempts === undefined ? (
                  <Skeleton className="h-14 w-full rounded-xl" />
                ) : (
                  <>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-mocha-400">Timer</p>
                      <Select
                        value={timerKey}
                        onValueChange={handleTimerChange}
                        items={timerItems}
                      >
                        <SelectTrigger className="w-full" size="default">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timerItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleStart}
                      disabled={starting}
                      className="w-full cursor-pointer"
                    >
                      {starting
                        ? "Loading..."
                        : inProgressAttempt
                          ? "Resume quiz"
                          : "Start quiz"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const progressPct = ((questionIndex + 1) / quizSession.quiz.totalQuestions) * 100;
  const answeredCount = Object.values(answers).filter((answerIndex) => answerIndex >= 0).length;
  const unanswered = quizSession.quiz.totalQuestions - answeredCount;

  const timedDisplay =
    quizSession.quiz.timerType === "overall"
      ? overallRemainingSec
      : perQuestionRemainingSec;

  return (
    <div className="min-h-screen bg-ivory-200 dark:bg-nero-marquina-300 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Badge className="min-w-0 max-w-full truncate rounded-full bg-mocha-300 text-mocha-500">
              {quizSession.quiz.title}
            </Badge>
            <p className="mt-1 text-sm text-mocha-400">
              Question {questionIndex + 1} of {quizSession.quiz.totalQuestions}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {quizSession.quiz.mode === "timed" && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold",
                  timerDanger(timedDisplay)
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEndDialogOpen(true)}
              disabled={submitting}
              className="cursor-pointer rounded-full border-mocha-300/60 bg-mocha-300/30 text-mocha-500 hover:bg-mocha-300/50 hover:text-mocha-500"
            >
              <Flag className="h-3.5 w-3.5" /> End quiz
            </Button>
          </div>
        </div>

        <Progress
          value={progressPct}
          aria-label="Quiz progress"
          className="mb-6 flex flex-col rounded-full [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:rounded-full [&_[data-slot=progress-track]]:bg-mocha-300/40 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-mocha-500/60"
        />

        {question && (
          <div className="rounded-3xl border border-mocha-300/60 bg-mocha-100 p-6">
            <h2 className="text-lg font-bold leading-snug text-mocha-500 md:text-xl">
              {question.prompt}
            </h2>
            <div className="mt-5 space-y-2.5">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question._id] === optionIndex;
                return (
                  <Button
                    key={optionIndex}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setAnswers((currentAnswers) => ({
                        ...currentAnswers,
                        [question._id]: optionIndex,
                      }))
                    }
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 justify-start rounded-xl border bg-transparent px-4 py-3 text-left text-sm font-medium whitespace-normal [overflow-wrap:anywhere] transition-colors",
                      selected
                        ? "border-mocha-500 bg-mocha-500/10 text-mocha-500"
                        : "border-mocha-300/60 hover:bg-mocha-300/20"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        selected
                          ? "bg-mocha-300 text-mocha-500"
                          : "bg-mocha-300/50 text-mocha-500"
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    {option}
                  </Button>
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
                setQuestionIndex((index) => index - 1);
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

      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End quiz now?</DialogTitle>
            <DialogDescription>
              {unanswered > 0
                ? `${unanswered} unanswered question${unanswered === 1 ? "" : "s"} will be marked incorrect.`
                : "All questions answered — ready to submit for grading?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEndDialogOpen(false)}
              className="cursor-pointer"
            >
              Keep going
            </Button>
            <Button
              onClick={() => {
                setEndDialogOpen(false);
                void handleSubmit();
              }}
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-200 dark:bg-nero-marquina-300 px-4">
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