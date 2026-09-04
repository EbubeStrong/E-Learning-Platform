"use client";

import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import ContactPage from "@/components/layouts/Pages/Contact/contact-page";

function Contact() {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden bg-ivory-200 p-5 dark:bg-gray-900">
        <ContactPage />
        <Footer />
      </main>
    </>
  );
}

export default Contact;
