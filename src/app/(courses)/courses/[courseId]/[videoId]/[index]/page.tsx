"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import Header from "@/components/layouts/Header/header";
import CourseDetail from "@/components/layouts/Pages/Courses/course-detail";

function CourseVideoPage() {
  const params = useParams<{ courseId: string; videoId: string; index: string }>();
  const courseId = params?.courseId ?? "";
  const videoId = params?.videoId ?? "";
  const index = Number.parseInt(params?.index ?? "", 10);
  const safeIndex = Number.isNaN(index) ? undefined : index;

  const [hideHeader, setHideHeader] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 32) {
        setHideHeader(false);
      } else if (y > lastYRef.current + 8) {
        setHideHeader(true);
      } else if (y < lastYRef.current - 8) {
        setHideHeader(false);
      }
      lastYRef.current = y;
    };
    lastYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.div
        className="sticky top-0 z-50"
        animate={{ y: hideHeader ? "-100%" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Header />
      </motion.div>
      <main className="overflow-x-clip">
        <CourseDetail courseId={courseId} videoId={videoId} index={safeIndex} />
        {/* <Footer /> */}
      </main>
    </>
  );
}

export default CourseVideoPage;