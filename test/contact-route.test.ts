import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => {
  const send = vi.fn();
  const constructorKeys: string[] = [];
  class Resend {
    constructor(key: string) {
      constructorKeys.push(key);
    }
    emails = { send };
  }
  return { Resend, send, constructorKeys };
});

vi.mock("resend", () => ({ Resend: mocks.Resend }));

import { POST } from "../src/app/api/contact/route";

const ENV_KEY = "CONTACT_RECIPIENT_EMAIL";
const API_KEY = "RESEND_API_KEY";
const FROM_DEFAULT = "Quizora <onboarding@resend.dev>";

function jsonRequest(body: unknown, isRawBody = false): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: isRawBody ? (body as string) : JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Abraham",
    email: "sam@example.com",
    message: "Hello there",
    ...overrides,
  };
}

beforeEach(() => {
  mocks.send.mockReset();
  mocks.constructorKeys.length = 0;
  vi.stubEnv(ENV_KEY, "admin@example.com");
  vi.stubEnv(API_KEY, "re_test");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/contact", () => {
  it("rejects an invalid JSON body with 400", async () => {
    const response = await POST(jsonRequest("{not-json", true));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Bad request." });
  });

  it("returns ok without sending when the honeypot field is present", async () => {
    const response = await POST(
      jsonRequest(validBody({ name: "B", email: "bot@example.com", website: "spam" })),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects a name shorter than 2 characters", async () => {
    const response = await POST(jsonRequest(validBody({ name: "A" })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Please enter your name." });
  });

  it("rejects an invalid email address", async () => {
    const response = await POST(jsonRequest(validBody({ email: "not-an-email" })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Please enter a valid email address.",
    });
  });

  it("rejects a message shorter than 2 characters", async () => {
    const response = await POST(jsonRequest(validBody({ message: "x" })));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Please enter a message." });
  });

  it("returns 500 when CONTACT_RECIPIENT_EMAIL is not configured", async () => {
    vi.stubEnv(ENV_KEY, "");
    const response = await POST(jsonRequest(validBody()));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Mail is not configured on the server.",
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("returns 500 when RESEND_API_KEY is not configured", async () => {
    vi.stubEnv(API_KEY, "");
    const response = await POST(jsonRequest(validBody()));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Mail is not configured on the server.",
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when Resend fails and includes a detail in dev", async () => {
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "API key is invalid" },
    });
    vi.stubEnv("NODE_ENV", "development");
    const response = await POST(jsonRequest(validBody()));
    expect(response.status).toBe(500);
    const body = (await response.json()) as Record<string, string>;
    expect(body.error).toBe("Something went wrong. Please try again.");
    expect(body.detail).toBe("API key is invalid");
  });

  it("omits the detail field in production", async () => {
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "boom" },
    });
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(jsonRequest(validBody()));
    const body = (await response.json()) as Record<string, string>;
    expect(body.detail).toBeUndefined();
  });

  it("returns ok and sends to the configured recipient on success", async () => {
    mocks.send.mockResolvedValueOnce({ data: { id: "email-id" }, error: null });
    const response = await POST(jsonRequest(validBody({ name: "Abraham Samuel" })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.constructorKeys).toEqual(["re_test"]);
    expect(mocks.send).toHaveBeenCalledWith({
      from: FROM_DEFAULT,
      to: ["admin@example.com"],
      subject: "New contact message from Abraham Samuel",
      react: expect.anything(),
    });
  });

  it("sends to each comma-separated recipient", async () => {
    process.env[ENV_KEY] = "one@example.com,two@example.com";
    mocks.send.mockResolvedValueOnce({ data: { id: "email-id" }, error: null });
    const response = await POST(jsonRequest(validBody()));
    expect(response.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["one@example.com", "two@example.com"] }),
    );
  });
});