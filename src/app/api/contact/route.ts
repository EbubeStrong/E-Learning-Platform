import { createElement } from "react";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import ContactEmail from "@/emails/contact-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const name = str(record.name);
  const email = str(record.email).toLowerCase();
  const message = str(record.message);
  const website = str(record.website);

  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (message.length < 2) {
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  if (!apiKey || !to.length) {
    return NextResponse.json(
      { error: "Mail is not configured on the server." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Quizora <onboarding@resend.dev>",
    to,
    subject: `New contact message from ${name}`,
    react: createElement(ContactEmail, { name, email, message }),
  });

  if (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}