"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, RefreshCw, Plus, Eye, Loader2 } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { QuestionRow } from "@/types/quiz";

export default function AdminQuestionsContent() {
  const { userDetails } = useUserDetails();
  const adminUserId = userDetails?._id as Id<"users"> | undefined;
  const isRoleAdmin = userDetails?.role === "admin";

  const courses = useQuery(api.courses.getAll);
  const [courseId, setCourseId] = useState<string>("");
  const [quizType, setQuizType] = useState<"practice" | "certification">("practice");

  const effectiveCourseId = courseId || courses?.[0]?.courseId || "";

  const questions = useQuery(
    api.questions.getForQuiz,
    effectiveCourseId && userDetails
      ? { courseId: effectiveCourseId, quizType, includeAnswers: true }
      : "skip"
  ) as QuestionRow[] | undefined;

  const seedDatabase = useMutation(api.seed.seedAll);
  const createQuestion = useMutation(api.questions.adminCreate);
  const deleteQuestion = useMutation(api.questions.adminDelete);
  const regenerateCourse = useMutation(api.questions.seedForCourse);

  const counts = useQuery(api.questions.countsByCourse);

  const [seedStatusMessage, setSeedStatusMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAddQuestionFormVisible, setIsAddQuestionFormVisible] = useState(false);
  const [questionForm, setQuestionForm] = useState({ prompt: "", options: "", correctIndex: "0", isCore: false });
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [pendingRegenerate, setPendingRegenerate] = useState<string | null>(null);
  const [regeneratingCourseId, setRegeneratingCourseId] = useState<string | null>(null);
  const [regenerateFeedback, setRegenerateFeedback] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses?.find((course) => course.courseId === effectiveCourseId),
    [courses, effectiveCourseId]
  );

  const handleSeedDatabase = () => {
    if (!adminUserId) return;
    setIsSeeding(true);
    setSeedStatusMessage(null);
    seedDatabase({ adminUserId })
      .then((res) =>
        setSeedStatusMessage(`Seeded ${res.questions} questions across ${res.courses} courses.`)
      )
      .catch((e) => setSeedStatusMessage(e instanceof Error ? e.message : "Seeding failed"))
      .finally(() => setIsSeeding(false));
  };

  const handleCreate = () => {
    if (!adminUserId || !effectiveCourseId) return;
    const options = questionForm.options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);
    const correctIndex = Number.parseInt(questionForm.correctIndex, 10);
    if (!questionForm.prompt.trim() || options.length < 2 || correctIndex < 0 || correctIndex >= options.length) {
      setSaveFeedback("Provide a prompt, at least 2 options, and a valid correct index.");
      return;
    }
    createQuestion({
      courseId: effectiveCourseId,
      quizType,
      prompt: questionForm.prompt.trim(),
      options,
      correctIndex,
      isCore: questionForm.isCore,
      adminUserId,
    })
      .then(() => {
        setSaveFeedback("Question added.");
        setQuestionForm({ prompt: "", options: "", correctIndex: "0", isCore: false });
        setIsAddQuestionFormVisible(false);
      })
      .catch((e) => setSaveFeedback(e instanceof Error ? e.message : "Save failed"));
  };

  const handleViewCourse = useCallback((targetCourseId: string) => {
    setCourseId(targetCourseId);
  }, []);

  const handleConfirmRegenerate = () => {
    if (!adminUserId || !pendingRegenerate) return;
    const targetCourseId = pendingRegenerate;
    const targetCourse = courses?.find((course) => course.courseId === targetCourseId);

    setRegeneratingCourseId(targetCourseId);
    setRegenerateFeedback(null);
    setPendingRegenerate(null);

    regenerateCourse({
      courseId: targetCourseId,
      courseCategory: targetCourse?.category,
      force: true,
    })
      .then((res) =>
        setRegenerateFeedback(
          `Regenerated ${res.seeded} questions for ${targetCourse?.title ?? targetCourseId}.`
        )
      )
      .catch((e) =>
        setRegenerateFeedback(
          e instanceof Error ? `Regenerate failed: ${e.message}` : "Regenerate failed"
        )
      )
      .finally(() => setRegeneratingCourseId(null));
  };

  if (!isRoleAdmin) {
    return (
      <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800">
        <CardContent className="p-8 text-center text-theme-sm text-gray-500">
          You do not have admin access.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Question Bank
          </h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Manage questions and quiz metadata per course.
          </p>
        </div>
        <Button
          onClick={handleSeedDatabase}
          disabled={isSeeding || !adminUserId}
          className="cursor-pointer"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {isSeeding ? "Seeding..." : "Seed database"}
        </Button>
      </div>

      {seedStatusMessage && (
        <p className="rounded-xl bg-green-50 px-4 py-2 text-theme-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
          {seedStatusMessage}
        </p>
      )}

      {regenerateFeedback && (
        <p className="rounded-xl bg-green-50 px-4 py-2 text-theme-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
          {regenerateFeedback}
        </p>
      )}

      {/* Per-course overview */}
      <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Courses</CardTitle>
          <CardDescription>
            Regenerate a course to replace its question set with a newly assigned
            deterministic set (e.g. to migrate courses seeded under the old behavior).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {courses === undefined ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-theme-sm text-gray-500">
              No courses yet. Click “Seed database” first.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {courses.map((course) => {
                const courseCounts = counts?.find((c) => c.courseId === course.courseId);
                const practiceCount = courseCounts?.practice ?? 0;
                const certificationCount = courseCounts?.certification ?? 0;
                const isRegenerating = regeneratingCourseId === course.courseId;
                return (
                  <div
                    key={course.courseId}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {course.title}
                      </p>
                      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                        {practiceCount} Practice · {certificationCount} Certification
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCourse(course.courseId)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={isRegenerating}
                        onClick={() => setPendingRegenerate(course.courseId)}
                      >
                        {isRegenerating ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : null}
                        {isRegenerating ? "Regenerating..." : "Regenerate"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800">
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <div>
            <Label>Course</Label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {(courses ?? []).map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.title} ({course.courseId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Quiz type</Label>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value as "practice" | "certification")}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="practice">Practice</option>
              <option value="certification">Certification</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setIsAddQuestionFormVisible((v) => !v)} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Add question
            </Button>
          </div>
        </CardContent>

        {saveFeedback && (
          <div className="px-5 pb-3">
            <p className="rounded-xl bg-mocha-300/30 px-4 py-2 text-theme-sm text-gray-700 dark:text-gray-300">
              {saveFeedback}
            </p>
          </div>
        )}

        {isAddQuestionFormVisible && (
          <CardContent className="border-t border-gray-200 p-5 dark:border-gray-800">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Prompt</Label>
                <Input
                  value={questionForm.prompt}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="Question text"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Options (one per line)</Label>
                <textarea
                  value={questionForm.options}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder={"Option A\nOption B\nOption C\nOption D"}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Correct index (0-based)</Label>
                  <Input
                    type="number"
                    value={questionForm.correctIndex}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, correctIndex: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <label className="flex items-end gap-2 pb-2 text-theme-sm text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={questionForm.isCore}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, isCore: e.target.checked }))}
                  />
                  Core (always drawn)
                </label>
              </div>
              <div>
                <Button onClick={handleCreate} className="cursor-pointer">
                  Save question
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Question list */}
      <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedCourse?.title ?? ""} — {quizType}
          </CardTitle>
          <CardDescription>Showing the current question bank (with answers).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {questions === undefined ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-theme-sm text-gray-500">
              No questions. Click “Seed database” or add one manually.
            </div>
          ) : (
            <div className="min-w-[640px] px-5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead className="w-16">Core</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question, i) => (
                    <TableRow key={question._id}>
                      <TableCell className="text-gray-500">{i + 1}</TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {question.prompt}
                        </p>
                        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {question.options[question.correctIndex] ?? ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {String.fromCharCode(65 + question.correctIndex)}.{" "}
                          {question.options[question.correctIndex] ?? ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {question.isCore ? <Badge>Core</Badge> : <Badge variant="outline">—</Badge>}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() =>
                            adminUserId &&
                            deleteQuestion({
                              questionId: question._id as Id<"questions">,
                              adminUserId,
                            }).catch((e) =>
                              setSaveFeedback(e instanceof Error ? e.message : "Delete failed")
                            )
                          }
                          className="cursor-pointer text-gray-400 hover:text-red-500"
                          aria-label="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pendingRegenerate} onOpenChange={(open) => !open && setPendingRegenerate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate questions?</DialogTitle>
            <DialogDescription>
              This will replace the existing question set for this course with a newly
              assigned deterministic set. Existing questions for this course will be
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRegenerate(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleConfirmRegenerate} className="cursor-pointer">
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
