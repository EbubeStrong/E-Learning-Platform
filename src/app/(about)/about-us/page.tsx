"use client";

import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import AboutPage from "@/components/layouts/Pages/About/about-page";

function About() {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden bg-ivory-200 p-5 dark:bg-gray-900">
        <AboutPage />
        <Footer />
      </main>
    </>
  );
}

export default About;