"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import {
  ArrowRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { MaskedHeading } from "../About/masked-heading";
import { Reveal } from "../About/reveal";
import type { SubmitState } from "@/types/ui";

type ContactFormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

const contactInfo = [
  { icon: Mail, label: "Email", value: process.env.NEXT_PUBLIC_EMAIL },
  { icon: Phone, label: "Phone", value: process.env.NEXT_PUBLIC_PHONE_NUMBER },
  { icon: MapPin, label: "Location", value: "Nigeria" },
];

export default function ContactPage() {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  // const [decoyField, setDecoyField] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function handleSubmit(event: ContactFormSubmitEvent) {
    event.preventDefault();
    if (submitState === "sending") return;

    setSubmitState("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: senderName,
          email: senderEmail,
          message,
          // website: decoyField,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setSubmitState("error");
        toast.add({
          type: "error",
          title: "Couldn't send message",
          description: data.error ?? "Something went wrong. Please try again.",
          timeout: 6000,
        });
        return;
      }

      setSubmitState("success");
      setSenderName("");
      setSenderEmail("");
      setMessage("");
      toast.add({
        type: "success",
        title: "Message sent",
        description: "Your message has been sent — we will get back to you soon.",
      });
    } catch {
      setSubmitState("error");
      toast.add({
        type: "error",
        title: "Couldn't send message",
        description: "Something went wrong. Please try again.",
        timeout: 6000,
      });
    }
  }

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-6 pt-7">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
              ( Contact )
            </span>
            <span className="h-px flex-1 bg-mocha-500/10" />
            <span className="font-mono text-[11px] text-mocha-400">Reach out</span>
          </div>
        </Reveal>

        <div className="mt-8 max-w-5xl">
          <MaskedHeading
            className="text-5xl font-black leading-[1.02] tracking-tight text-mocha-500 md:text-7xl lg:text-8xl"
            lines={[{ text: "Get in " }, { text: "touch.", serif: true }]}
          />
        </div>

        <Reveal delay={0.2} className="mt-6 max-w-xl">
          <p className="text-lg leading-8 text-mocha-400 md:text-xl">
            Have a question or want to work together? We’d love to hear from you.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:pb-28">
        <Reveal delay={0.1}>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-mocha-500/10 bg-mocha-500/10 md:grid-cols-2">
            <div className="flex flex-col bg-ivory-200 p-8 md:p-10">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
                Contact info
              </span>

              <div className="mt-8 flex flex-col">
                {contactInfo.map(({ icon: Icon, label, value }, index) => {
                  const href =
                    label === "Email"
                      ? (value ? `mailto:${value}` : undefined)
                      : label === "Phone"
                        ? (value ? `tel:${value.replace(/\s+/g, "")}` : undefined)
                        : undefined;
                  const rowClass = `flex items-center gap-4 py-5 ${index > 0 ? "border-t border-mocha-500/10" : ""
                    }`;
                  const content = (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-mocha-500/10 bg-mocha-100/40 transition-colors group-hover:border-mocha-500/30">
                        <Icon className="h-4 w-4 text-mocha-500" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
                          {label}
                        </span>
                        <span className="mt-1 text-base font-semibold text-mocha-500 [overflow-wrap:anywhere]">
                          {value}
                        </span>
                      </span>
                    </>
                  );
                  return href ? (
                    <a
                      key={label}
                      href={href}
                      className={`group ${rowClass} transition-opacity hover:opacity-80`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={label} className={rowClass}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-ivory-200 p-8 md:p-10">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-mocha-400">
                Send a message
              </span>

              <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-name" className="text-mocha-500">
                    Name
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                    value={senderName}
                    onChange={(event) => setSenderName(event.target.value)}
                    className="h-11 rounded-xl border-mocha-500/20 bg-ivory-200 text-mocha-500 placeholder:text-mocha-300"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-email" className="text-mocha-500">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    value={senderEmail}
                    onChange={(event) => setSenderEmail(event.target.value)}
                    className="h-11 rounded-xl border-mocha-500/20 bg-ivory-200 text-mocha-500 placeholder:text-mocha-300"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-message" className="text-mocha-500">
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="Tell us what’s on your mind…"
                    required
                    rows={6}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="rounded-xl border-mocha-500/20 bg-ivory-200 text-mocha-500 placeholder:text-mocha-300"
                  />
                </div>

                {/* <input
                  type="text"
                  name="website"
                  value={decoyField}
                  onChange={(event) => setDecoyField(event.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                /> */}

                <Button
                  type="submit"
                  disabled={submitState === "sending"}
                  className="h-12 w-full rounded-2xl bg-mocha-500 px-6 text-sm font-bold text-ivory-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-mocha-500/90"
                >
                  {submitState === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Message
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}