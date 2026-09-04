"use client";
import Header from "@/components/layouts/Header/header";
import ExploreCategories from "@/components/layouts/Pages/Home/explore";
import FeaturedHomeCourses from "@/components/layouts/Pages/Home/courses";
import Hero from "@/components/layouts/Pages/Home/hero";
import Testimonials from "@/components/layouts/Pages/Home/testimonials";
import Footer from "@/components/layouts/Footer/footer";
import Cursor from "@/components/ui/cursor";
import Grain from "@/components/layouts/Pages/About/grain";
import { GridPattern } from "@/components/ui/grid-pattern"


function Home() {
    return (
        <>
            <Header />
            <Cursor />
            <Grain />
            <main className="relative overflow-hidden pt-7 bg-ivory-200 dark:bg-gray-600 overflow-x-hidden">
                <GridPattern
                    // className="opacity-40"
                    width={30}
                    height={30}
                    x={-1}
                    y={-1}
                    strokeDasharray={"4 2"}
                />
                <div className="relative z-10">
                    <div className="px-5">
                        <Hero />
                        <ExploreCategories />
                        <FeaturedHomeCourses />
                    </div>
                    <Testimonials />
                </div>
            </main>
            <Footer />
        </>
    );
}

export default Home;