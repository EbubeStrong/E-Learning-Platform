"use client";

import Header from "@/components/layouts/Header/header";
import Footer from "@/components/layouts/Footer/footer";
import ContactPage from "@/components/layouts/Pages/Contact/contact-page";

function Contact() {
  return (
    <>
      <Header />
      <main className="overflow-hidden bg-ivory-200 dark:bg-gray-900">
        <ContactPage />
      </main>
        <Footer />
    </>
  );
}

export default Contact;
