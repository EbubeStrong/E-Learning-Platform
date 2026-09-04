"use client";

import { useEffect, useMemo, useState } from "react";
import type { CourseOverview, CoursesOverview } from "@/types/course";

export function useCoursesOverview(): CoursesOverview {
  const [courses, setCourses] = useState<CourseOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setCourses(data.courses ?? []);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
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
      courses,
      totalCourses: courses.length,
      totalLessons,
      averageLessons: courses.length
        ? Math.round((totalLessons / courses.length) * 10) / 10
        : 0,
      categories,
      loading,
      error,
    };
  }, [courses, loading, error]);
}