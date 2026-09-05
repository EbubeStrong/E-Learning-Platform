"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  Clock3,
  HelpCircle,
  ListChecks,
  PauseCircle,
  Play,
} from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { QuizDoc } from "@/types/quiz";

const CERT_MAX_ATTEMPTS = 3;

export default function QuizCatalogPage() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isAuthenticated } = useConvexAuth();
  const autoSubmitPending = useMutation(api.attempts.autoSubmitPending);
  const courses = useQuery(api.courses.getAll);
  const quizzes = useQuery(api.quizzes.getAllForAll);
  const myAttempts = useQuery(
    api.attempts.listForUser,
    userId && isAuthenticated ? {} : "skip"
  );

  // Grade any expired in-progress attempts so the "resume" state stays truthful.
  useEffect(() => {
    if (userId && isAuthenticated) {
      void autoSubmitPending();
    }
  }, [userId, isAuthenticated, autoSubmitPending]);

  const loading =
    courses === undefined || quizzes === undefined || myAttempts === undefined;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-3xl" />
        ))}
      </div>
    );
  }

  const quizByCourse = new Map<string, QuizDoc[]>();
  for (const quiz of quizzes ?? []) {
    const quizList = quizByCourse.get(quiz.courseId) ?? [];
    quizList.push(quiz);
    quizByCourse.set(quiz.courseId, quizList);
  }

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
          Quiz
        </Badge>
        <h1 className="text-2xl font-black tracking-tight text-mocha-500 md:text-3xl">
          Pick a quiz
        </h1>
        <p className="mt-1 text-sm text-mocha-400">
          Practice quizzes are unlimited. Certification quizzes grant a
          certificate at 75%+ (max {CERT_MAX_ATTEMPTS} attempts) and lock once
          passed.
        </p>
      </div>

      {courses?.length === 0 ? (
        <div className="rounded-3xl border border-mocha-300/50 bg-mocha-100 p-10 text-center text-sm text-mocha-400">
          No quizzes configured yet. Please seed the question bank.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {(courses ?? []).map((course) => {
            const quizzesForCourse = (quizByCourse.get(course.courseId) ?? []).filter(
              (quiz) => quiz.enabled
            );
            const certificationQuiz = quizzesForCourse.find((quiz) => quiz.type === "certification");
            const practiceQuiz = quizzesForCourse.find((quiz) => quiz.type === "practice");
            const courseAttempts = (myAttempts ?? []).filter(
              (attempt) => attempt.courseId === course.courseId
            );
            const certificationAttempts = courseAttempts.filter(
              (attempt) => attempt.quizType === "certification"
            );
            const practiceAttempts = courseAttempts.filter(
              (attempt) => attempt.quizType === "practice"
            );
            const passedCert = certificationAttempts.some(
              (attempt) =>
                attempt.percent != null &&
                attempt.percent >= (certificationQuiz?.passThreshold ?? 0)
            );
            const attemptsUsed = certificationAttempts.filter(
              (attempt) => attempt.status === "submitted"
            ).length;
            const certLocked = passedCert || attemptsUsed >= CERT_MAX_ATTEMPTS;
            const certInProgress = certificationAttempts.some(
              (attempt) => attempt.status === "in_progress"
            );
            const practiceInProgress = practiceAttempts.some(
              (attempt) => attempt.status === "in_progress"
            );

            return (
              <div
                key={course.courseId}
                className="rounded-3xl border border-mocha-300/60 bg-mocha-100 p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mocha-300/40 px-2.5 py-0.5 text-xs font-medium text-mocha-500">
                    {course.category}
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold text-mocha-500">
                    {course.title}
                  </span>
                </div>

                <div className="space-y-3">
                  {certificationQuiz && (
                    <QuizCard
                      href={`/quiz/${course.courseId}?type=certification`}
                      icon={Award}
                      title={certificationQuiz.title}
                      meta={{
                        points: certificationQuiz.totalQuestions * certificationQuiz.pointsPerQuestion,
                        questions: certificationQuiz.totalQuestions,
                        time: certificationQuiz.timeLimitSeconds,
                      }}
                      badge="Certification"
                      badgeClass="bg-mocha-500 text-mocha-100"
                      disabled={certLocked}
                      resume={certInProgress}
                      footer={
                        passedCert ? (
                          <span className="text-xs font-semibold text-green-600">
                            Certificate earned — locked
                          </span>
                        ) : certInProgress ? (
                          <span className="text-xs font-semibold text-mocha-500">
                            In progress · {attemptsUsed}/{CERT_MAX_ATTEMPTS} used —{" "}
                            tap to resume
                          </span>
                        ) : certLocked ? (
                          <span className="text-xs text-mocha-400">
                            Locked · {attemptsUsed}/{CERT_MAX_ATTEMPTS} attempts used
                          </span>
                        ) : (
                          <span className="text-xs text-mocha-400">
                            {attemptsUsed}/{CERT_MAX_ATTEMPTS} attempts used · pass at{" "}
                            {certificationQuiz.passThreshold}%
                          </span>
                        )
                      }
                    />
                  )}

                  {practiceQuiz && (
                    <QuizCard
                      href={`/quiz/${course.courseId}?type=practice`}
                      icon={HelpCircle}
                      title={practiceQuiz.title}
                      meta={{
                        points: practiceQuiz.totalQuestions * practiceQuiz.pointsPerQuestion,
                        questions: practiceQuiz.totalQuestions,
                        time: practiceQuiz.timeLimitSeconds,
                      }}
                      badge="Practice"
                      badgeClass="bg-mocha-300/60 text-mocha-500"
                      resume={practiceInProgress}
                      footer={
                        practiceInProgress ? (
                          <span className="text-xs font-semibold text-mocha-500">
                            In progress — tap to resume
                          </span>
                        ) : (
                          <span className="text-xs text-mocha-400">
                            Unlimited attempts
                          </span>
                        )
                      }
                    />
                  )}

                  {!certificationQuiz && !practiceQuiz && (
                    <p className="text-sm text-mocha-400">No quizzes yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizCard({
  href,
  icon: Icon,
  title,
  meta,
  badge,
  badgeClass,
  footer,
  disabled = false,
  resume = false,
}: {
  href: string;
  icon: typeof Award;
  title: string;
  meta: { points: number; questions: number; time?: number };
  badge: string;
  badgeClass: string;
  footer: React.ReactNode;
  disabled?: boolean;
  resume?: boolean;
}) {
  const ActionIcon = resume ? PauseCircle : Play;
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-mocha-500" />
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
        {resume && (
          <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Resume
          </span>
        )}
      </div>
      <p className="mt-2 font-bold text-mocha-500">{title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-mocha-400">
        <span className="inline-flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" />
          {meta.questions} questions
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {meta.time ? `${Math.round(meta.time / 60)} min` : "untimed"}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-mocha-500">
          <ActionIcon className="h-3.5 w-3.5" /> {meta.points} pts
        </span>
      </div>
      <div className="mt-3 border-t border-mocha-300/40 pt-2">{footer}</div>
    </>
  );

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        className="block cursor-not-allowed rounded-2xl border border-mocha-300/60 bg-mocha-200/40 p-4 opacity-70"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-mocha-300/60 bg-mocha-200/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {inner}
    </Link>
  );
}