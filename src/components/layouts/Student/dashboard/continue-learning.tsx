"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const { isAuthenticated } = useConvexAuth();
  const courses = useQuery(api.courses.getAll);
  const progress = useQuery(
    api.watchProgress.listAllForUser,
    userId && isAuthenticated ? {} : "skip"
  );

  const loading =
    courses === undefined || (userId && progress === undefined);

  if (loading) {
    return (
      <Card className="rounded-2xl border-0 bg-ivory-100 dark:bg-nero-marquina-200 ring-mocha-300/60">
        <div className="flex items-center justify-between gap-4 px-4 pt-4">
          <div>
            <h2 className="text-lg font-bold text-mocha-500">
              Continue learning
            </h2>
            <p className="text-sm text-mocha-400">Pick up where you left off</p>
          </div>
        </div>
        <CardContent className="space-y-2 px-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </CardContent>
      </Card>
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
    .slice(0, 5);

  return (
    <Card className="rounded-2xl border-0 h-full bg-ivory-100/30 dark:bg-nero-marquina-200 ring-mocha-300/60">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-mocha-500">
            Continue learning
          </h2>
          <p className="text-sm text-mocha-400">Pick up where you left off</p>
        </div>
        <Link
          href="/courses"
          className="shrink-0 text-xs font-semibold text-mocha-500 underline underline-offset-4 hover:text-mocha-400"
        >
          Browse courses
        </Link>
      </div>
      <CardContent className="px-4">
        {items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-mocha-200/60 text-center text-sm text-mocha-400">
            <PlayCircle className="h-8 w-8 text-mocha-300" />
            You have not started a course yet.
            <Link
              href="/courses"
              className="font-semibold text-mocha-500 underline underline-offset-4"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-mocha-300/40">
            {items.map((course) => {
              const resume = resumeMap.get(course.courseId)!;
              const nearEnd = resume.durationSeconds
                ? resume.positionSeconds / resume.durationSeconds > 0.95
                : false;
              return (
                <li key={course.courseId}>
                  <Link
                    href={`/courses/${course.courseId}`}
                    className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-mocha-300/30 rounded-xl px-2 -mx-2"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mocha-300/40">
                      {nearEnd ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-mocha-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-mocha-500">
                        {course.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mocha-400">
                        <Badge className="rounded-full bg-mocha-300/50 text-mocha-500">
                          {course.category}
                        </Badge>
                        <span>
                          Resume at {fmt(resume.positionSeconds)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-mocha-400 transition-transform group-hover:translate-x-0.5"
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}