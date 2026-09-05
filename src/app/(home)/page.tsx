import { cookies } from "next/headers";
import Header from "@/components/layouts/Header/header";
import ExploreCategories from "@/components/layouts/Pages/Home/explore";
import FeaturedHomeCourses from "@/components/layouts/Pages/Home/courses";
import Hero from "@/components/layouts/Pages/Home/hero";
import Testimonials from "@/components/layouts/Pages/Home/testimonials";
import Footer from "@/components/layouts/Footer/footer";
import Cursor from "@/components/ui/cursor";
import Grain from "@/components/layouts/Pages/About/grain";
import { GridPattern } from "@/components/ui/grid-pattern"
import { PageIntro, INTRO_COOKIE } from "@/components/ui/page-intro";


async function Home() {
    const alreadySeen = (await cookies()).get(INTRO_COOKIE)?.value === "1";

    return (
        <>
            <Header />
            <Cursor />
            <Grain />
            <PageIntro
                lines={["Quizora", "Your Ultimate Learning & Quiz Platform"]}
                storageKey="quizora:intro:home"
                alreadySeen={alreadySeen}
            />
            <main className="relative overflow-hidden pt-7 bg-ivory-200 dark:bg-gray-600">
                <GridPattern
                    // className="opacity-40"
                    width={30}
                    height={30}
                    x={-1}
                    y={-1}
                    strokeDasharray={"4 2"}
                />
                <div className="relative z-10">
                    <Hero />
                    <ExploreCategories />
                    <FeaturedHomeCourses />
                    <Testimonials />
                </div>
            </main>
            <Footer />
        </>
    );
}

export default Home;