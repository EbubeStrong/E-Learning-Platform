"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useCoursesOverview } from "@/hooks/useCoursesOverview";
import { Counter } from "./counter";
import { MaskedHeading } from "./masked-heading";
import { Reveal } from "./reveal";
import AboutHeroCover from "./about-hero-cover";
import AboutCourses from "./about-courses";
import Cursor from "../../../ui/cursor";
import Grain from "./grain";
import { values } from "@/lib/data/site/values";

export default function AboutPage() {
  const { totalCourses, totalLessons, categories, loading } = useCoursesOverview();

  return (
    <>
      <Cursor />
      <Grain />

      {/* ===== Hero ===== */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-10 pt-16 md:pb-16 md:pt-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
              Who we are
            </span>
            <span className="h-px flex-1 bg-mocha-500/10" />
            <span className="font-mono text-[11px] text-mocha-400">( About / Quizora )</span>
          </div>
        </Reveal>

        <div className="mt-10 max-w-5xl">
          <MaskedHeading
            className="text-4xl font-black leading-[1.02] tracking-tight text-mocha-500 sm:text-5xl md:text-7xl lg:text-8xl"
            lines={[
              { text: "We built a platform" },
              { text: "with an" },
              { text: "unreasonable", serif: true },
              { text: "belief in practice." },
            ]}
          />
        </div>

        <Reveal delay={0.35} className="mt-8 max-w-xl">
          <p className="text-lg leading-8 text-mocha-400 md:text-xl">
            Quizora turns great lessons into structured multiple-choice quizzes,
            instant feedback, and progress you can actually see.
          </p>
        </Reveal>

        <Reveal delay={0.42} className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="#what-we-make"
            className="inline-flex items-center gap-2 rounded-2xl bg-mocha-500 px-6 py-3.5 text-sm font-bold text-ivory-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-mocha-500/90"
          >
            See what we make
            <ArrowDown className="h-4 w-4" />
          </Link>
          <Link
            href="/courses"
            className="link-sweep group inline-flex items-center gap-2 text-sm font-bold text-mocha-500"
          >
            Start learning
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>
      </section>

      {/* ===== Cover ===== */}
      <section className="mx-auto w-full max-w-7xl px-6">
        <Reveal delay={0.08}>
          <AboutHeroCover />
        </Reveal>
      </section>

      {/* ===== Manifesto ===== */}
      <section className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="max-w-4xl text-2xl font-medium leading-snug tracking-tight text-mocha-500 md:text-4xl md:leading-[1.25]">
            Quizora is a learning platform for students who would rather{" "}
            <span className="font-serif italic">know</span> than{" "}
            <span className="font-serif italic">finish</span>. We take great lessons and wrap
            them in structured quizzes, instant feedback, and progress you can see — so watching
            becomes <span className="font-serif italic">doing</span>, and doing becomes{" "}
            <span className="font-serif italic">knowing</span>.
          </p>
        </Reveal>

        {/* ===== Stats ===== */}
        <div className="mt-16 grid divide-y divide-mocha-500/10 border-y border-mocha-500/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {[
            {
              label: loading ? "Courses" : "Courses",
              value:
                loading || !totalCourses ? (
                  <span className="font-mono text-2xl text-mocha-300 md:text-3xl">••</span>
                ) : (
                  <Counter to={totalCourses} />
                ),
            },
            {
              label: "Lessons",
              value:
                loading || !totalLessons ? (
                  <span className="font-mono text-2xl text-mocha-300 md:text-3xl">••</span>
                ) : (
                  <Counter to={totalLessons} />
                ),
            },
            {
              label: "Learning tracks",
              value:
                loading || !categories.length ? (
                  <span className="font-mono text-2xl text-mocha-300 md:text-3xl">••</span>
                ) : (
                  <Counter to={categories.length} />
                ),
            },
            {
              label: "Goal",
              value: <Counter to={1} suffix=" — from watching to knowing" />,
            },
          ].map((stat) => (
            <div key={stat.label} className="px-2 py-8 text-center sm:px-6">
              <div className="text-4xl font-black tracking-tight text-mocha-500 md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== What we hold to ===== */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16 md:pb-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
              ( What we hold to )
            </span>
            <span className="h-px flex-1 bg-mocha-500/10" />
            <span className="font-mono text-[11px] text-mocha-400">Principles</span>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-mocha-500/10 bg-mocha-500/10 sm:grid-cols-2">
          {values.map((value, index) => (
            <Reveal key={value.index} delay={index * 0.06} className="bg-ivory-200">
              <div className="flex h-full flex-col gap-4 p-8 transition-colors duration-300 hover:bg-mocha-100/50 md:p-10">
                <span className="font-mono text-xs text-mocha-400">{value.index}</span>
                <h3 className="text-xl font-black tracking-tight text-mocha-500 md:text-2xl">
                  {value.title}
                </h3>
                <p className="text-base leading-7 text-mocha-400">{value.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== What we make (courses) ===== */}
      <AboutCourses />

      {/* ===== CTA ===== */}
      <section className="relative mx-auto w-full max-w-7xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-mocha-400/20 bg-[#171310] px-8 py-20 text-center md:py-28">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-mocha-300/10 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-mocha-200/10 blur-[100px]" />

            <span className="inline-flex items-center gap-2 rounded-full border border-ivory-100/20 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory-200/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mocha-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mocha-300" />
              </span>
              Now enrolling
            </span>

            <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-ivory-200 md:text-6xl">
              Ready to <span className="font-serif italic">prove</span> what you know?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/55">
              Pick a course, watch the lessons, then back it up — one quiz at a time.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-2xl bg-mocha-300 px-6 py-3.5 text-sm font-bold text-mocha-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-mocha-200"
              >
                Browse courses
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-2xl border border-ivory-100/20 px-6 py-3.5 text-sm font-bold text-ivory-200 transition-colors duration-300 hover:bg-white/5"
              >
                Start a quiz
              </Link>
            </div>

            <div
              aria-hidden
              className="pointer-events-none mt-14 select-none text-[18vw] font-black leading-none tracking-[0.08em] text-white/[0.06] md:text-[11rem]"
            >
              QUIZORA
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}