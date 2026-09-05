"use client";
import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import CoursesPage from "@/components/layouts/Pages/Courses/courses";

function Courses() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <CoursesPage />
      </main>
        <Footer />
    </>
  );
}

export default Courses;
