"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseDetail } from "@/lib/courses/use-course-detail";
import { Skeleton } from "@/components/ui/skeleton";

function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params?.courseId ?? "";
  const { videos, loading, notFound } = useCourseDetail(courseId);

  useEffect(() => {
    if (loading || notFound) return;
    const first = videos[0];
    if (first) {
      router.replace(`/courses/${courseId}/${first.videoId}/0`);
    }
  }, [loading, notFound, videos, courseId, router]);

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-ivory-200 px-6 py-24">
      <div className="w-full">
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-[28rem] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

export default CoursePage;