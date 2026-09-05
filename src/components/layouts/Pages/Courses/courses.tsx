"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { Clock3, Lock, PlayCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { getCourseAccent } from "@/lib/course-accent";
import type { CourseCard } from "@/types/course";

const PER_PAGE = 6;

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 1) return [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

function CoursesPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/courses")
      .then((response) => response.json())
      .then((data: { courses?: CourseCard[] }) => {
        if (active) setCourses(data.courses ?? []);
      })
      .catch(() => {
        if (active) setCourses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tabs = ["All", ...Array.from(new Set(courses.map((course) => course.category)))];
  const filtered =
    activeTab === "All"
      ? courses
      : courses.filter((course) => course.category === activeTab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const pageNumbers = getPageNumbers(safePage, totalPages);
  const signedOut = authLoaded && !isSignedIn;
  const visibleCourses = signedOut ? courses.slice(0, 3) : pageItems;

  const goToPage = (n: number) => {
    setCurrentPage(Math.min(totalPages, Math.max(1, n)));
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="w-full bg-ivory-200 px-6 py-7 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 rounded-full bg-mocha-300 text-mocha-500">
            Courses
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-mocha-500 md:text-5xl">
            Learn. Watch. Build.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-mocha-400 md:text-lg">
            Pick a course, watch each lesson, and build real projects along the
            way.
          </p>
        </div>

        {loading || !authLoaded ? (
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[22rem] rounded-3xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-mocha-300/50 bg-mocha-100 p-10 text-center text-sm text-mocha-400">
            No courses are configured yet. Add a playlist id in{" "}
            <code className="rounded bg-mocha-300/50 px-1 text-mocha-500">
              src/lib/courses/catalog.ts
            </code>{" "}
            to see the courses here.
          </div>
        ) : (
          <div ref={gridRef} className="mt-10 scroll-mt-6">
            {!signedOut && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab}
                    type="button"
                    variant="default"
                    onClick={() => changeTab(tab)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      activeTab === tab
                        ? "bg-mocha-500 text-mocha-100 hover:bg-mocha-400"
                        : "bg-mocha-300/50 text-mocha-400 hover:bg-mocha-300/80 hover:text-mocha-500"
                    )}
                  >
                    {tab}
                  </Button>
                ))}
              </div>
            )}

            {signedOut ? (
              <p className="mt-4 text-center text-sm text-mocha-400">
                Showing 3 of {courses.length} courses.{" "}
                <SignInButton mode="modal">
                  <Button
                    type="button"
                    variant="link"
                    className="font-semibold text-mocha-500 underline decoration-mocha-300 underline-offset-4 transition-colors hover:text-mocha-400"
                  >
                    Sign in
                  </Button>
                </SignInButton>{" "}
                to browse all courses.
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-mocha-400">
                {filtered.length} {filtered.length === 1 ? "course" : "courses"}
              </p>
            )}

            {filtered.length === 0 ? (
              <div className="mt-14 rounded-3xl border border-mocha-300/50 bg-mocha-100 p-10 text-center text-sm text-mocha-400">
                No courses in this category yet.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}

            {totalPages > 1 && !signedOut && (
              <Pagination className="mt-10">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      aria-disabled={safePage === 1}
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(safePage - 1);
                      }}
                    />
                  </PaginationItem>
                  {pageNumbers.map((page, index) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === safePage}
                          onClick={(event) => {
                            event.preventDefault();
                            goToPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      aria-disabled={safePage === totalPages}
                      onClick={(event) => {
                        event.preventDefault();
                        goToPage(safePage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: CourseCard }) {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const locked = isLoaded && !isSignedIn;
  const author =
    course.tutor?.displayName ?? course.category ?? "Instructor";
  const avatar = course.tutor?.avatar;

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (locked) {
      event.preventDefault();
      void clerk.openSignIn();
    }
  };

  return (
    <Link
      href={`/courses/${course.id}`}
      onClick={handleClick}
      aria-label={
        locked
          ? `Sign in to open ${course.title}`
          : `Open course: ${course.title}`
      }
      className="group flex flex-col overflow-hidden rounded-3xl border border-mocha-300/60 bg-mocha-100 shadow-[0_10px_24px_rgba(58,42,38,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(58,42,38,0.12)]"
    >
      <div
        className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${
          getCourseAccent(course.category)
        }`}
      >
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-black tracking-tight text-white/70">
              {course.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            {locked ? (
              <Lock className="h-6 w-6" />
            ) : (
              <PlayCircle className="h-7 w-7" />
            )}
          </span>
        </span>
        {course.videoCount > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
            {course.videoCount} lessons
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-5">
        <Badge className="w-fit rounded-full bg-mocha-300/40 text-mocha-500">
          {course.category}
        </Badge>

        <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-mocha-500">
          {course.title}
        </h3>

        <div className="flex items-center gap-3 text-mocha-400">
          <Avatar size="lg" className="bg-mocha-300/40 text-sm font-semibold text-mocha-500">
            {avatar && <AvatarImage src={avatar} alt={author} />}
            <AvatarFallback className="bg-mocha-300/40 text-mocha-500">
              {author.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-base font-medium text-mocha-500">
            {author}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-mocha-300/50 pt-4 text-sm text-mocha-400">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-current text-yellow-400" />
            {course.level}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" />
            {course.videoCount > 0
              ? `${course.videoCount} lessons`
              : "Video course"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default CoursesPage;