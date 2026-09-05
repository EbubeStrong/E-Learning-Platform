"use client";

import { useParams, useSearchParams } from "next/navigation";
import QuizEngine from "@/components/layouts/Student/quiz/quiz-engine";

export default function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") === "certification" ? "certification" : "practice") as
    | "practice"
    | "certification";

  return (
    <div className="marble min-h-screen">
      <QuizEngine courseId={courseId} type={type} />
    </div>
  );
}
