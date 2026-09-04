"use client";

import { useReducedMotion } from "./media-queries";

export default function Grain() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`grain pointer-events-none fixed inset-0 z-[80] opacity-[0.06] ${
        reducedMotion ? "" : "animate-grain"
      }`}
    />
  );
}