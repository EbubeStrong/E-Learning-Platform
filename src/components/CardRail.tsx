"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroOne, HeroTwo, HeroThree, HeroFour } from "@/components/assets";
import type { RailCard } from "@/types/ui";

const cards: RailCard[] = [
    {
        title: "Student Sign-Up",
        subtitle: "Role-based access",
        image: <HeroOne fill alt="Student sign-up" />,
    },
    {
        title: "Quiz Engine",
        subtitle: "Timed or untimed MCQs",
        image: <HeroTwo fill alt="Quiz engine" />,
    },
    {
        title: "Instant Scoring",
        subtitle: "Automated answer check",
        image: <HeroThree fill alt="Instant scoring" />,
    },
    {
        title: "Progress Tracker",
        subtitle: "History dashboard",
        image: <HeroFour fill alt="Progress tracker" />,
    },

   
];

function CardRail() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const active = hoveredIndex ?? 0;

    return (
        <div className="relative pt-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:h-[460px] lg:flex-nowrap lg:items-stretch xl:h-[600px]">
                {cards.map((card, index) => {
                    const isOpen = active === index;
                    const isHovered = hoveredIndex === index;
                    return (
                        <Button
                            key={card.title}
                            type="button"
                            aria-label={`Explore ${card.title}`}
                            variant="ghost"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={`group/panel relative h-auto min-h-[220px] flex-none overflow-hidden rounded-3xl border border-ivory-300 bg-mocha-500 px-0 text-left shadow-2xl shadow-mocha-500/10 transition-[flex-grow,flex-basis] duration-500 ease-out focus-visible:ring-4 focus-visible:ring-mocha-300/50 sm:min-h-[260px] sm:w-auto sm:flex-initial lg:h-auto lg:min-w-0 lg:rounded-[2rem] ${
                                isOpen
                                    ? "lg:flex-[1] lg:basis-0"
                                    : "lg:flex-[0_0_96px]"
                            }`}
                        >
                            <span className={`absolute inset-0 block transition-transform duration-700 ease-out ${isHovered ? "scale-110 delay-300" : "scale-100"}`}>
                                {card.image}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-b from-mocha-500/20 via-mocha-500/40 to-mocha-500/80" />
                            <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                                <h2 className="max-w-[12rem] text-2xl font-bold leading-none tracking-tight text-white drop-shadow-sm md:text-4xl lg:max-w-[14rem]">
                                    {card.title}
                                </h2>
                                <p className="mt-2 text-sm font-medium text-ivory-200 opacity-0 transition duration-300 group-hover/panel:opacity-100 lg:max-w-[13rem]">
                                    {card.subtitle}
                                </p>
                            </div>
                            <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center bg-white/95 text-mocha-500 opacity-0 shadow-lg transition duration-300 group-hover/panel:opacity-100">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export default CardRail;
