"use client";

import { useEffect, useState } from "react";
import type { CourseVideo, DetailCourse, Tutor } from "@/types/course";

export interface CourseDetailData {
  course: DetailCourse | null;
  videos: CourseVideo[];
  tutor: Tutor | null;
  loading: boolean;
  notFound: boolean;
}

export function useCourseDetail(courseId: string): CourseDetailData {
  const [course, setCourse] = useState<DetailCourse | null>(null);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`/api/courses/${courseId}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (active) setNotFound(true);
          return null;
        }
        return (await res.json()) as {
          course?: DetailCourse;
          videos?: CourseVideo[];
          tutor?: Tutor;
        };
      })
      .then((data) => {
        if (!active || !data) return;
        setCourse(data.course ?? null);
        setVideos(data.videos ?? []);
        setTutor(data.tutor ?? null);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  return { course, videos, tutor, loading, notFound };
}
