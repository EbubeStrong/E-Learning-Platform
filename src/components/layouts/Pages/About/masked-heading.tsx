"use client";

import { motion } from "motion/react";
import type { MaskedHeadingProps } from "@/types/ui";

export function MaskedHeading({ lines, className, delay = 0.1 }: MaskedHeadingProps) {
  return (
    <h1 className={className}>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className={`block [overflow-wrap:anywhere] ${line.serif ? "font-serif italic" : ""}`}
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
              delay: delay + index * 0.09,
            }}
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}