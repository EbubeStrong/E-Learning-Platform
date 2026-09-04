
import Link from "next/link";
import { Reveal } from "../About/reveal";
import {
    ArrowRight,
    BrainCircuit,
    LineChart,
    MonitorPlay,
    Palette,
    ServerCog,
    Smartphone,
} from "lucide-react";


const categories = [
  {
    title: "Frontend\nDevelopment",
    icon: MonitorPlay,
    bg: "#e8d5c5",
    border: "#8B5CF6",
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
  },
  {
    title: "Backend\nDevelopment",
    icon: ServerCog,
    bg: "#e8d5c5",
    border: "#3B6B7A",
    iconBg: "#E2EBEF",
    iconColor: "#315B68",
  },
  {
    title: "UI / UX\nDesign",
    icon: Palette,
    bg: "#e8d5c5",
    border: "#D85A7F",
    iconBg: "#FCE4EC",
    iconColor: "#BE4166",
  },
  {
    title: "Mobile\nDevelopment",
    icon: Smartphone,
    bg: "#e8d5c5",
    border: "#4F8A67",
    iconBg: "#E1F1E7",
    iconColor: "#397052",
  },
  {
    title: "Artificial\nIntelligence",
    icon: BrainCircuit,
    bg: "#e8d5c5",
    border: "#C77B18",
    iconBg: "#FCEBC9",
    iconColor: "#A7610D",
  },
  {
    title: "Data\nAnalysis",
    icon: LineChart,
    bg: "#e8d5c5",
    border: "#C45B5B",
    iconBg: "#F9DEDE",
    iconColor: "#A84242",
  },
];

export default function ExploreCategories() {
    return (
        <section className="mt-10 w-full px-6 py-16 md:py-20">
            <Reveal>
            <h2 className="text-center text-3xl font-bold text-mocha-500 md:text-4xl">
                Explore Categories
            </h2>

            <p className="mt-4 text-center text-[22px] text-mocha-400">
                Choose A Path And Start Your Learning Journey
            </p>

            <div className="mb-8 flex items-center justify-end">
                <Link
                    href="#"
                    className="inline-flex items-center gap-2 text-lg font-semibold text-mocha-400 transition hover:text-mocha-500"
                >
                    View All Categories
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            </Reveal>

            <Reveal delay={0.1}>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                    const Icon = category.icon;

                    return (
                        <article
                            key={category.title}
                            className="group relative flex min-h-[220px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-mocha-300/50 p-6 shadow-[0_6px_16px_rgba(58,42,38,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:border-mocha-400 hover:shadow-[0_16px_32px_rgba(58,42,38,0.12)]"
                            style={{ backgroundColor: category.bg }}
                        >
                            <span
                                className="absolute inset-x-6 top-0 h-1 rounded-b-full opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                                // style={{ backgroundColor: category.border }}
                            />

                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                                style={{ border: `1px solid ${category.border}`, backgroundColor: category.iconBg }}
                            >
                                <Icon
                                    className="h-7 w-7"
                                    strokeWidth={2}
                                    style={{ color: category.border }}
                                />
                            </div>

                            <h3
                                className="text-center text-[25px] font-semibold leading-[1.25] text-black"
                                style={{ whiteSpace: "pre-line" }}
                            >
                                {category.title}
                            </h3>
                        </article>
                    );
                })}
            </div>
            </Reveal>
        </section>
    );
}
