"use client";

import { motion } from "motion/react";
import type { MaskedHeadingProps } from "@/types/ui";

export function MaskedHeading({ lines, className, delay = 0.1 }: MaskedHeadingProps) {
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className={`block ${line.serif ? "font-serif italic" : ""}`}
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
              delay: delay + i * 0.09,
            }}
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}