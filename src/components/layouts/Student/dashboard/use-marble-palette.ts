"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export type MarblePalette = {
  ink: string;
  muted: string;
  line: string;
  track: string;
};

const DEFAULT: MarblePalette = {
  ink: "#3b342c",
  muted: "#897c69",
  line: "#ece5d6",
  track: "#ddd4c2",
};

function readPalette(): MarblePalette {
  const scope = document.querySelector<HTMLElement>(".marble");
  const style = getComputedStyle(scope ?? document.documentElement);
  const pick = (name: string, fallback?: string) =>
    style.getPropertyValue(name).trim() || fallback || "";
  return {
    ink: pick("--mocha-500", DEFAULT.ink),
    muted: pick("--mocha-400", DEFAULT.muted),
    line: pick("--mocha-200", DEFAULT.line),
    track: pick("--mocha-300", DEFAULT.track),
  };
}

export function useMarblePalette(): MarblePalette {
  const { theme } = useTheme();
  const [palette, setPalette] = useState<MarblePalette>(DEFAULT);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read scoped marble tokens once the theme class is applied
    setPalette(readPalette());
  }, [theme]);

  return palette;
}