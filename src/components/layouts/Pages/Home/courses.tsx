"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3, Star } from "lucide-react";
import { Carousel } from "@/components/ui/apple-cards-carousel";
import { Button } from "@/components/ui/button";
import { HeroOne, HeroTwo, HeroThree } from "@/components/assets";
import { homeCourses } from "@/lib/home-courses";
import type { HomeCourse, HomeCourseArtwork } from "@/types/course";
import type { ArtworkComponent } from "@/types/ui";
import { getCourseAccent } from "@/lib/course-accent";
import { Reveal } from "../About/reveal";

const artworkMap: Record<HomeCourseArtwork, ArtworkComponent> = {
  "hero-one": HeroOne,
  "hero-two": HeroTwo,
  "hero-three": HeroThree,
};

function FeaturedHomeCourses() {
  const courses = [...homeCourses, ...homeCourses];
  const cards = courses.map((course, index) => (
    <HomeCourseCard key={`${course.id}-${index}`} course={course} />
  ));

  return (
    <section className="w-full px-6 py-5 md:py-7">
      <Reveal>
      <h2 className="text-center text-2xl font-black text-mocha-500 md:text-4xl">
        Featured Courses
      </h2>

      <div className="mt-4 flex items-center justify-end">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-base font-semibold text-mocha-400 transition hover:text-mocha-500"
        >
          View All Courses
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
      </Reveal>

      <Reveal delay={0.1}>
      <Carousel items={cards} />
      </Reveal>
    </section>
  );
}

function HomeCourseCard({ course }: { course: HomeCourse }) {
  const Artwork = artworkMap[course.artwork];

  return (
    <article className="group flex w-[78vw] max-w-72 flex-col overflow-hidden rounded-3xl border border-mocha-300/60 bg-mocha-100 shadow-[0_10px_24px_rgba(58,42,38,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(58,42,38,0.12)] sm:w-80 md:w-96">
      <div
        className={`relative h-64 overflow-hidden bg-gradient-to-br ${getCourseAccent(course.category)} md:h-72`}
      >
        <div className="h-full w-full">
          <Artwork className="h-full w-full object-cover" alt={`${course.title} artwork`} />
        </div>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-current text-yellow-300" />
            {course.rating}
          </span>
          <span className="rounded-full border border-white/60 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            {course.level}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <h3 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-mocha-500 md:text-2xl">
          {course.title}
        </h3>

        <div className="flex items-center gap-3 text-mocha-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mocha-300/40 text-sm font-semibold text-mocha-500">
            A
          </div>
          <span className="text-lg font-medium text-mocha-500">Ahmed Adel</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-base text-mocha-400">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            <span>{course.hours}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpenText className="h-5 w-5" />
            <span>{course.lessons}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-mocha-300/50 pt-4">
          <span className="text-xl font-extrabold tracking-tight text-mocha-500">
            {course.price}
          </span>
          <Button
            size="lg"
            className="rounded-xl bg-mocha-400 px-6 text-base font-semibold text-ivory-200 hover:bg-mocha-500"
          >
            Enroll Now
          </Button>
        </div>
      </div>
    </article>
  );
}

export default FeaturedHomeCourses;