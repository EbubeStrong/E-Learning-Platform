"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3, Star } from "lucide-react";
import { HeroOne, HeroTwo, HeroThree } from "@/components/assets";
import { homeCourses } from "@/lib/home-courses";
import type { HomeCourse, HomeCourseArtwork } from "@/types/course";
import type { ArtworkComponent } from "@/types/ui";
import { getCourseAccent } from "@/lib/course-accent";
import { Reveal } from "./reveal";

const artworkMap: Record<HomeCourseArtwork, ArtworkComponent> = {
  "hero-one": HeroOne,
  "hero-two": HeroTwo,
  "hero-three": HeroThree,
};

export default function AboutCourses() {
  return (
    <section id="what-we-make" className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-16 md:py-24">
      <Reveal>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
            ( What we make )
          </span>
          <span className="h-px flex-1 bg-mocha-500/10" />
          <span className="font-mono text-[11px] text-mocha-400">01 — 03</span>
        </div>
      </Reveal>

      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal delay={0.05}>
          <h2 className="max-w-2xl text-3xl font-black leading-[1.05] tracking-tight text-mocha-500 md:text-5xl">
            Courses that demand you{" "}
            <span className="font-serif italic">prove it.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-sm text-base leading-7 text-mocha-400">
            The same tracks featured on the homepage — watch each lesson, then
            back it up with an auto-graded quiz.
          </p>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-mocha-500/10 bg-mocha-500/10">
        {homeCourses.map((course, index) => (
          <Reveal key={course.id} delay={index * 0.08} className="bg-ivory-200">
            <AboutCourseCard course={course} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/courses"
            className="link-sweep group inline-flex items-center gap-2 text-base font-semibold text-mocha-500"
          >
            View all courses
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function AboutCourseCard({ course }: { course: HomeCourse }) {
  const Artwork = artworkMap[course.artwork];

  return (
    <Link
      href="/courses"
      className="group grid w-full overflow-hidden transition-colors duration-300 hover:bg-mocha-100/50 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
    >
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${getCourseAccent(course.category)}`}>
        <div className="h-full w-full">
          <Artwork
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={`${course.title} artwork`}
          />
        </div>
        <div className="absolute inset-0 bg-black/15 transition-colors duration-300 group-hover:bg-black/25" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current text-yellow-300" />
            {course.rating}
          </span>
          <span className="rounded-full border border-white/60 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {course.level}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-8">
        <span className="inline-flex w-fit items-center rounded-full bg-mocha-300/40 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-mocha-500">
          {course.category}
        </span>

        <h3 className="text-2xl font-bold leading-tight tracking-tight text-mocha-500 md:text-3xl">
          {course.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mocha-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            {course.hours}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpenText className="h-4 w-4" />
            {course.lessons}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-mocha-500/10 pt-4">
          <span className="text-xl font-extrabold tracking-tight text-mocha-500">
            {course.price}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-mocha-400 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition-colors duration-300 group-hover:bg-mocha-500">
            Enroll Now
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}