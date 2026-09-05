"use client";
import { IconBrandGithub, IconBrandInstagram, IconBrandLinkedin } from "@tabler/icons-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";


const footerLinks = {
  platform: [
    { label: "Take a Quiz", href: "/quizzes" },
    { label: "Quiz Categories", href: "/categories" },
    { label: "Track Progress", href: "/progress" },
    { label: "About Us", href: "/about-us" }
  ],
  connect: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/abrahamsamuel567/" },
    { label: "GitHub", href: "https://github.com/EbubeStrong/" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative md:mx-5 mb-5 pt-20 overflow-hidden rounded-t-[2rem] border border-mocha-400/20 bg-[#171310] text-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]">
      {/* Background glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-mocha-300/10 blur-[100px]" />

      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-mocha-200/10 blur-[100px]" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-mocha-300/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16 lg:px-12">
        {/* Top section */}
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          {/* Brand */}
          <div className="max-w-md">
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mocha-300 text-mocha-500 transition-transform duration-300 group-hover:rotate-6">
                <span className="text-lg font-black">Q</span>
              </div>

              <span className="text-xl font-bold tracking-[0.15em] text-ivory-200">
                QUIZORA
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
              A structured practice platform for students to learn and take
              multiple-choice quizzes, get instant feedback, and track their
              learning journey.
            </p>

            <Link
              href="/quizzes"
              className="group mt-7 inline-flex items-center gap-2 rounded-2xl bg-mocha-300 px-5 py-3 text-sm font-bold text-mocha-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-mocha-200 hover:shadow-[0_0_30px_rgba(217,190,160,0.2)]"
            >
              Take a quiz

              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10">
            {/* Explore */}
            <FooterColumn
              title="Explore"
              links={footerLinks.platform}
            />

            {/* Connect */}
            <FooterColumn
              title="Connect"
              links={footerLinks.connect}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-white/[0.08]" />

        {/* Bottom row */}
        <div className="flex flex-col gap-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="uppercase tracking-[0.08em]">
            © {new Date().getFullYear()} Quizora. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {/* <Link
              href=""
              className="transition-colors hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href=""
              className="transition-colors hover:text-white"
            >
              Terms
            </Link> */}

            <Link
              href="https://github.com/EbubeStrong/E-Learning-Platform"
              target="_blank"
              className="transition-colors hover:text-white"
            >
              <IconBrandGithub className="h-4 w-4" />
            </Link>

            <Link
              href="https://linkedin.com/in/abrahamsamuel567/"
              target="_blank"
              className="transition-colors hover:text-white"
            >
              <IconBrandLinkedin className="h-4 w-4" />
            </Link>

          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}) {
  return (
    <div>
      <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-mocha-200">
        {title}
      </h3>

      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="w-fit text-sm text-white/55 transition-all duration-200 hover:translate-x-1 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}