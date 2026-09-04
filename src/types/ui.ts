import type { ComponentType, ReactNode, ComponentProps } from "react";
import type { MotionProps } from "motion/react";
import type Image from "next/image";

export type SubmitState = "idle" | "sending" | "success" | "error";

export type RailCard = {
  title: string;
  subtitle: string;
  image: ReactNode;
};

export type CounterProps = {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

export type MaskedLine = {
  text: ReactNode;
  serif?: boolean;
};

export type MaskedHeadingProps = {
  lines: MaskedLine[];
  className?: string;
  delay?: number;
};

export type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
} & Pick<MotionProps, "style">;

export type EngineProps = {
  courseId: string;
  type: "practice" | "certification";
};

export type ContactEmailProps = {
  name: string;
  email: string;
  message: string;
};

export type ArtworkComponent = ComponentType<{ className?: string; alt: string }>;

export type ImageName =
  | "logo"
  | "hero-one"
  | "hero-two"
  | "hero-three"
  | "hero-four"
  | "hero-five";

export type ImgProps = Omit<ComponentProps<typeof Image>, "src" | "alt"> & {
  name: ImageName;
  alt: string;
};

export type IdContext = { params: Promise<{ courseId: string }> };
