
import { Button } from "@/components/ui/button";
import CardRail from "@/components/CardRail";
import { Reveal } from "../About/reveal";

function Hero() {
    return (
        <section className="px-6">
            <div className="grid gap-12 items-center md:grid-cols-2">
                <Reveal className="space-y-6">
                    <span className="inline-block rounded-full border border-mocha-300 px-4 py-1.5 text-sm font-medium text-mocha-400">
                        E-Learning Quiz Platform
                    </span>
                    <h1 className="text-4xl font-bold leading-tight text-mocha-500 md:text-[4.5rem]">
                        Test Your Knowledge, Track Your Progress
                    </h1>
                    <p className="text-[1.5rem] leading-relaxed text-mocha-400">
                        A structured online practice tool for students to take
                        multiple-choice quizzes, get instant feedback, and monitor
                        their learning journey.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button size="lg">
                            Get Started
                        </Button>
                        <Button
                            size="lg"
                        >
                            Learn More
                        </Button>
                    </div>
                </Reveal>
                <Reveal delay={0.2}>
                    <CardRail />
                </Reveal>
            </div>
        </section>
    );
}

export default Hero;
