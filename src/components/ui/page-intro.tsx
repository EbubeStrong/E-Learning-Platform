"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  lines: string[];
  storageKey: string;
  typeSpeed?: number;
  lineDelay?: number;
  holdDelay?: number;
  fadeMs?: number;
};

/**
 * Full-screen intro overlay that types out `lines` one by one, then fades
 * away to reveal the page. Plays only once per browser session (sessionStorage)
 * so refreshes and back/forward navigation within the same session skip it.
 *
 * Renders an invisible (opacity-0) overlay even before hydration so there is
 * no hydration mismatch and no flash of mismatched markup.
 */
export function PageIntro({
  lines,
  storageKey,
  typeSpeed = 45,
  lineDelay = 450,
  holdDelay = 900,
  fadeMs = 500,
}: PageIntroProps) {
  const [introLines] = useState(() => lines);
  const [typed, setTyped] = useState<string[]>(() => lines.map(() => ""));
  const [visible, setVisible] = useState(false);
  const [removed, setRemoved] = useState(false);

  // Lock page scroll while the intro overlay is on screen, no matter how it
  // gets dismissed (typed-to-completion, tap-to-skip, or route unmount).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const previousOverflow = document.body.style.overflow;
    if (visible && !removed) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, removed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storage = window.sessionStorage;
    if (storage.getItem(storageKey)) {
      queueMicrotask(() => setRemoved(true));
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const complete = () => {
      if (cancelled) return;
      try {
        storage.setItem(storageKey, "1");
      } catch {
        /* storage unavailable — still close the intro */
      }
      setVisible(false);
      timers.push(window.setTimeout(() => setRemoved(true), fadeMs));
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    requestAnimationFrame(() => {
      if (!cancelled) setVisible(true);
    });

    if (reducedMotion) {
      queueMicrotask(() => setTyped(introLines));
      timers.push(window.setTimeout(complete, holdDelay));
    } else {
      let lineIndex = 0;
      let charIndex = 0;
      const tick = () => {
        if (cancelled) return;
        const current = introLines[lineIndex];
        if (charIndex < current.length) {
          charIndex += 1;
          const slice = current.slice(0, charIndex);
          setTyped((prev) => {
            const next = [...prev];
            next[lineIndex] = slice;
            return next;
          });
          timers.push(window.setTimeout(tick, typeSpeed));
        } else if (lineIndex < introLines.length - 1) {
          lineIndex += 1;
          charIndex = 0;
          timers.push(window.setTimeout(tick, lineDelay));
        } else {
          timers.push(window.setTimeout(complete, holdDelay));
        }
      };
      tick();
    }

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- introLines is fixed at mount
  }, [storageKey, typeSpeed, lineDelay, holdDelay, fadeMs]);

  if (removed) return null;

  const skip = () => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    window.setTimeout(() => setRemoved(true), fadeMs);
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      onClick={skip}
      className={cn(
        "fixed inset-0 z-[99999] flex cursor-pointer flex-col items-center justify-center gap-3 bg-[var(--ivory-200)] px-6 text-center transition-opacity duration-500 dark:bg-gray-600",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="min-h-[3.5rem]">
        <h1 className="font-serif text-5xl font-black tracking-tight text-mocha-500 sm:text-6xl dark:text-gray-100">
          {typed[0]}
          {introLines.length === 1 && <Caret active={visible} />}
        </h1>
      </div>
      {introLines.length > 1 && (
        <p className="max-w-md text-sm font-medium text-mocha-400 sm:text-base dark:text-gray-300">
          {typed.slice(1).map((line, index) => (
            <span key={index} className="block">
              {line}
              {index === typed.slice(1).length - 1 && <Caret active={visible} />}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function Caret({ active }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "ml-0.5 inline-block h-[0.95em] w-[3px] translate-y-[0.08em] rounded-sm bg-current",
        active && "animate-pulse"
      )}
    />
  );
}