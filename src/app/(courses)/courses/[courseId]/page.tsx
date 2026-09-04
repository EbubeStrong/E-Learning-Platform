"use client";
import { useParams } from "next/navigation";
import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import CourseDetail from "@/components/layouts/Pages/Courses/course-detail";

function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? "";

  return (
    <>
      <Header />
      <main className="p-5 overflow-x-hidden">
        <CourseDetail key={courseId} courseId={courseId} />
        <Footer />
      </main>
    </>
  );
}

export default CoursePage;