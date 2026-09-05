// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactPage from "@/components/layouts/Pages/Contact/contact-page";

const toastAdd = vi.hoisted(() => vi.fn());

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

vi.mock("@/components/layouts/Pages/About/masked-heading", () => ({
  MaskedHeading: ({ lines }: { lines: { text: string }[] }) => (
    <h1>{lines.map((line) => line.text).join(" ")}</h1>
  ),
}));

vi.mock("@/components/layouts/Pages/About/reveal", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { type ReactNode } from "react";

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  values = { name: "Abraham", email: "sam@example.com", message: "Hello there" },
) {
  await user.type(screen.getByLabelText(/^name$/i), values.name);
  await user.type(screen.getByLabelText(/^email$/i), values.email);
  await user.type(screen.getByLabelText(/^message$/i), values.message);
  await user.click(screen.getByRole("button", { name: /send message/i }));
}

describe("ContactPage", () => {
  beforeEach(() => {
    toastAdd.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the contact form", () => {
    render(<ContactPage />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("shows a success toast and clears the fields on a successful send", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }),
    );
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillAndSubmit(user);
    await vi.waitFor(() => {
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "Message sent" }),
      );
    });
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^message$/i)).toHaveValue("");
  });

  it("surfaces the server error message in an error toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Mail is not configured on the server." }),
      }),
    );
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillAndSubmit(user);
    await vi.waitFor(() => {
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't send message",
          description: "Mail is not configured on the server.",
        }),
      );
    });
  });

  it("shows a generic error toast when the request itself throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const user = userEvent.setup();
    render(<ContactPage />);
    await fillAndSubmit(user);
    await vi.waitFor(() => {
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          description: "Something went wrong. Please try again.",
        }),
      );
    });
  });
});