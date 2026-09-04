"use client";

import { HeroFive } from "@/components/assets";

export default function AboutHeroCover() {
  return (
    <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-mocha-500/10 shadow-[0_30px_80px_-30px_rgba(58,42,38,0.45)] md:aspect-[21/9]">
      {/* Gradient fallback (shows through the duotone / transparency) */}
      <div className="absolute inset-0 bg-gradient-to-br from-mocha-500 via-[#54403a] to-mocha-600" />

      {/* Hero artwork */}
      <div className="absolute inset-0">
        <HeroFive
          alt="Quizora hero artwork"
          fill
          sizes="100vw"
          className="h-full w-full object-cover opacity-80 mix-blend-luminosity saturate-0 contrast-125"
        />
      </div>

      {/* Duotone tint layers */}
      <div className="absolute inset-0 bg-mocha-700/35 mix-blend-multiply" />
      <div className="absolute inset-0 bg-mocha-200/20 mix-blend-screen" />

      {/* Grain */}
      <div className="grain absolute inset-0 opacity-[0.14]" />

      {/* Hairline frame + caption */}
      <div className="absolute inset-3 rounded-2xl border border-ivory-100/15" />
      <figcaption className="absolute bottom-6 left-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-100/70 md:bottom-8 md:left-8">
        <span className="inline-block h-px w-8 bg-ivory-100/40" />
        Quizora
        <span className="text-white/25">/</span>
        A platform where watching becomes knowing
      </figcaption>
    </figure>
  );
}