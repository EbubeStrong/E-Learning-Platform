"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, Clock3, CheckCircle2 } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";

function fmt(sec: number) {
  const minutes = Math.floor(sec / 60);
  if (minutes === 0) return `${sec}s`;
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export default function ContinueLearning() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const courses = useQuery(api.courses.getAll);
  const progress = useQuery(
    api.watchProgress.listAllForUser,
    userId ? { userId } : "skip"
  );

  const loading =
    courses === undefined || (userId && progress === undefined);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const resumeMap = new Map<string, { videoId: string; positionSeconds: number; durationSeconds?: number; updatedAt: number }>();
  for (const progressEntry of progress ?? []) {
    const current = resumeMap.get(progressEntry.courseId);
    if (!current || current.updatedAt < progressEntry.updatedAt) {
      resumeMap.set(progressEntry.courseId, {
        videoId: progressEntry.videoId,
        positionSeconds: progressEntry.positionSeconds,
        durationSeconds: progressEntry.durationSeconds,
        updatedAt: progressEntry.updatedAt,
      });
    }
  }

  const items = (courses ?? [])
    .filter((course) => resumeMap.has(course.courseId))
    .sort((courseA, courseB) => (resumeMap.get(courseB.courseId)?.updatedAt ?? 0) - (resumeMap.get(courseA.courseId)?.updatedAt ?? 0))
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-mocha-200/60 text-center text-sm text-mocha-400">
        <PlayCircle className="h-8 w-8 text-mocha-300" />
        You have not started a course yet.
        <Link href="/courses" className="font-semibold text-mocha-500 underline underline-offset-4">
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((course) => {
        const resume = resumeMap.get(course.courseId)!;
        const nearEnd = resume.durationSeconds ? resume.positionSeconds / resume.durationSeconds > 0.95 : false;
        return (
          <Link
            key={course.courseId}
            href={`/courses/${course.courseId}`}
            className="group flex flex-col gap-2 rounded-2xl border border-mocha-300/60 bg-mocha-100 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-mocha-400">
              {nearEnd ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide">
                {course.category}
              </span>
            </div>
            <p className="line-clamp-1 font-bold text-mocha-500">
              {course.title}
            </p>
            <div className="mt-auto flex items-center gap-2 text-xs text-mocha-400">
              <Clock3 className="h-3.5 w-3.5" />
              Resume at {fmt(resume.positionSeconds)} · tap to continue
            </div>
          </Link>
        );
      })}
    </div>
  );
}
