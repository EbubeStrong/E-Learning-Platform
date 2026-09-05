"use client";

import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import AboutPage from "@/components/layouts/Pages/About/about-page";

function About() {
  return (
    <>
      <Header />
      <main className="overflow-hidden mb-14 bg-ivory-200 dark:bg-gray-900">
        <AboutPage />
      </main>
      <Footer />
    </>
  );
}

export default About;