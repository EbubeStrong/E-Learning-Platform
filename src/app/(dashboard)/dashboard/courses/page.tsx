"use client";

import Link from "next/link";
import Image from "next/image";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock3, PlayCircle } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useCatalogThumbnails } from "@/hooks/use-catalog-thumbnails";

function fmt(sec: number) {
  const minutes = Math.floor(sec / 60);
  if (minutes === 0) return `${sec}s`;
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export default function DashboardCoursesPage() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isAuthenticated } = useConvexAuth();
  const courses = useQuery(api.courses.getAll);
  const progress = useQuery(
    api.watchProgress.listAllForUser,
    userId && isAuthenticated ? {} : "skip"
  );
  const thumbnails = useCatalogThumbnails();

  if (courses === undefined || (userId && progress === undefined)) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-3xl" />
        ))}
      </div>
    );
  }

  const resumeMap = new Map<string, { positionSeconds: number; updatedAt: number }>();
  for (const progressEntry of progress ?? []) {
    const current = resumeMap.get(progressEntry.courseId);
    if (!current || current.updatedAt < progressEntry.updatedAt) {
      resumeMap.set(progressEntry.courseId, {
        positionSeconds: progressEntry.positionSeconds,
        updatedAt: progressEntry.updatedAt,
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
          Courses
        </Badge>
        <h1 className="text-2xl font-black tracking-tight text-mocha-500 md:text-3xl">
          My courses
        </h1>
        <p className="mt-1 text-sm text-mocha-400">
          Pick up where you left off or start something new.
        </p>
      </div>

      {courses?.length === 0 ? (
        <div className="rounded-3xl border border-mocha-300/50 bg-mocha-100 p-10 text-center text-sm text-mocha-400">
          No courses available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((course) => {
            const resume = resumeMap.get(course.courseId);
            const coverThumb =
              course.thumbnail ?? thumbnails?.[course.courseId]?.thumbnail;
            const coverAlt =
              course.imageAlt ??
              thumbnails?.[course.courseId]?.imageAlt ??
              `${course.title} course artwork`;
            return (
              <Link
                key={course.courseId}
                href={`/courses/${course.courseId}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-mocha-300/60 bg-mocha-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-mocha-300/60 to-mocha-400/40">
                  {coverThumb ? (
                    <Image
                      src={coverThumb}
                      alt={coverAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-4xl font-black tracking-tight text-white/80">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-mocha-300/40 px-2.5 py-0.5 text-xs font-medium text-mocha-500">
                    {course.category}
                  </span>
                  <h3 className="line-clamp-2 font-bold leading-snug text-mocha-500">
                    {course.title}
                  </h3>
                  {resume ? (
                    <p className="mt-auto inline-flex items-center gap-1 text-xs text-mocha-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      Resume at {fmt(resume.positionSeconds)}
                    </p>
                  ) : (
                    <p className="mt-auto inline-flex items-center gap-1 text-xs text-mocha-400">
                      <PlayCircle className="h-3.5 w-3.5" />
                      Not started
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
