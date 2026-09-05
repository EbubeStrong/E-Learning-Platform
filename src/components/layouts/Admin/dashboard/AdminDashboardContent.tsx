"use client";
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GridIcon,
  ListIcon,
  PieChartIcon,
  VideoIcon,
  UserCircleIcon,
  TaskIcon,
  GroupIcon,
  CheckCircleIcon,
  DocsIcon,
  BoltIcon,
} from "@/icons";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import LessonsPerCourseChart from "@/components/layouts/Admin/charts/LessonsPerCourseChart";
import CategoryDonutChart from "@/components/layouts/Admin/charts/CategoryDonutChart";
import CourseInventoryTable from "@/components/layouts/Admin/dashboard/CourseInventoryTable";
import type { CourseOverview } from "@/types/course";

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <CardHeader className="flex-row items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-white/10">
          <span className="size-5 text-gray-800 dark:text-white/90">{icon}</span>
        </div>
        <div className="min-w-0">
          <CardTitle className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <span className="text-3xl font-bold text-gray-800 dark:text-white/90">
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function toCourseOverviewList(courses: { courseId: string; title: string; category: string; level: string; videoCount?: number }[]): CourseOverview[] {
  return courses.map((course) => ({
    id: course.courseId,
    title: course.title,
    category: course.category,
    level: course.level,
    videoCount: course.videoCount ?? 0,
  }));
}

function deriveMetrics(courses: CourseOverview[]) {
  const totalLessons = courses.reduce((total, course) => total + course.videoCount, 0);
  const categoryCounts = new Map<string, number>();
  for (const course of courses) {
    categoryCounts.set(
      course.category,
      (categoryCounts.get(course.category) ?? 0) + 1
    );
  }
  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((courseA, courseB) => courseB.count - courseA.count);
  return {
    totalLessons,
    averageLessons: courses.length
      ? Math.round((totalLessons / courses.length) * 10) / 10
      : 0,
    categories,
  };
}

export default function AdminDashboardContent() {
  const { userDetails } = useUserDetails();
  const adminUserId = userDetails?._id;
  const { isAuthenticated } = useConvexAuth();
  const adminGranted = !!adminUserId && isAuthenticated;
  const syncCatalog = useMutation(api.courses.syncFromCatalog);

  const courses = useQuery(api.courses.getAll);
  const analytics = useQuery(
    api.analytics.adminOverview,
    adminGranted ? {} : "skip"
  );

  // Persist the enriched YouTube catalog into Convex once so the DB holds the
  // real videoCounts/thumbnails that back the inventory and metrics.
  useEffect(() => {
    if (!adminGranted) return;
    (async () => {
      try {
        const res = await fetch("/api/courses");
        if (!res.ok) return;
        const data = (await res.json()) as {
          courses?: (CourseOverview & { playlistId?: string; thumbnail?: string; imageAlt?: string })[];
        };
        const list = data.courses ?? [];
        if (list.length === 0) return;
        await syncCatalog({
          courses: list.map((course) => ({
            courseId: course.id,
            playlistId: course.playlistId ?? "",
            title: course.title,
            category: course.category,
            level: course.level,
            videoCount: course.videoCount,
            thumbnail: course.thumbnail,
            imageAlt: course.imageAlt,
          })),
        });
      } catch {
        // Non-fatal: the dashboard still renders whatever Convex holds.
      }
    })();
  }, [adminGranted, syncCatalog]);

  const loading =
    !userDetails || courses === undefined || analytics === undefined;

  const courseList = toCourseOverviewList(courses ?? []);
  const ordered = [...courseList].sort((courseA, courseB) => courseB.videoCount - courseA.videoCount);
  const metrics = deriveMetrics(ordered);

  const kpis = analytics
    ? [
        { label: "Total Users", value: analytics.totalUsers, icon: UserCircleIcon },
        { label: "Total Quiz Attempts", value: analytics.totalAttempts, icon: TaskIcon },
        { label: "Average Score", value: `${analytics.averageScore}%`, icon: GroupIcon },
        { label: "Pass Rate", value: `${analytics.passRate}%`, icon: CheckCircleIcon },
        { label: "Certificates Issued", value: analytics.certificatesIssued, icon: DocsIcon },
        { label: "Active Users", value: analytics.activeUsers, icon: BoltIcon },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Course Catalog Overview
        </h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Live summary of the playlists behind your learning platform.
        </p>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
                <CardContent className="space-y-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
                <CardContent className="space-y-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi) => (
              <MetricCard key={kpi.label} icon={<kpi.icon />} label={kpi.label} value={kpi.value} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            <MetricCard icon={<GridIcon />} label="Total Courses" value={ordered.length} />
            <MetricCard icon={<VideoIcon />} label="Total Lessons" value={metrics.totalLessons} />
            <MetricCard icon={<PieChartIcon />} label="Categories" value={metrics.categories.length} />
            <MetricCard icon={<ListIcon />} label="Avg Lessons / Course" value={metrics.averageLessons} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <LessonsPerCourseChart courses={ordered} />
            </div>
            <CategoryDonutChart categories={metrics.categories} />
          </div>

          <CourseInventoryTable courses={ordered} />
        </>
      )}
    </div>
  );
}