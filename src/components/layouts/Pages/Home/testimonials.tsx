"use client";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { Reveal } from "../About/reveal";
import { testimonials } from "@/lib/data/home/testimonials";

export default function Testimonials() {
    return (
        <div className="w-full bg-ivory-200 shadow-2xl py-4 ">
            <Reveal>
            <h2 className="text-center text-[30px] mt-4 font-bold leading-[1.25] text-mocha-500 md:text-[40px]">
                What Our Users Say
            </h2>
            <p className="mt-4 text-center text-[22px] text-mocha-400">
                Hear from our satisfied users and their experiences with our platform.
            </p>
            </Reveal>
            <Reveal delay={0.1}>
            <AnimatedTestimonials testimonials={testimonials} />
            </Reveal>
        </div>
    );
}
