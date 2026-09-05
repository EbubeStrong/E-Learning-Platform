import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { adminEmails, isAdminEmail } from "../src/lib/admin-emails";

const ENV_KEY = "NEXT_PUBLIC_ADMIN_EMAILS";

beforeEach(() => {
  vi.stubEnv(ENV_KEY, "Admin@Example.com,  second@example.com ,admin2@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("adminEmails", () => {
  it("splits, trims, and lowercases the configured addresses", () => {
    expect(adminEmails()).toEqual([
      "admin@example.com",
      "second@example.com",
      "admin2@example.com",
    ]);
  });

  it("handles a single address", () => {
    vi.stubEnv(ENV_KEY, "boss@example.com");
    expect(adminEmails()).toEqual(["boss@example.com"]);
  });

  it("handles empty or whitespace-only config", () => {
    vi.stubEnv(ENV_KEY, "");
    expect(adminEmails()).toEqual([]);
    vi.stubEnv(ENV_KEY, "   ");
    expect(adminEmails()).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  it("accepts a configured admin email case-insensitively", () => {
    expect(isAdminEmail("ADMIN@example.com")).toBe(true);
    expect(isAdminEmail("second@example.com")).toBe(true);
  });

  it("rejects non-admin and nullish emails", () => {
    expect(isAdminEmail("intruder@example.com")).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});