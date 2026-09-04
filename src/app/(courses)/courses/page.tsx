"use client";
import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import CoursesPage from "@/components/layouts/Pages/Courses/courses";

function Courses() {
  return (
    <>
      <Header />
      <main className="p-5 overflow-x-hidden">
        <CoursesPage />
        <Footer />
      </main>
    </>
  );
}

export default Courses;
