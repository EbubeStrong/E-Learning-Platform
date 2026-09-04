import axios from "axios";
import type { Tutor } from "@/types/course";

const RAPID_KEY = process.env.RAPIDAPI_KEY;
const RAPID_HOST = process.env.RAPIDAPI_HOST;

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim() || fallback;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function mapAuthorPayload(data: unknown): Tutor | null {
  const d = data as Record<string, unknown>;
  if (!d || typeof d !== "object") return null;

  const author = d.author as Record<string, unknown> | undefined;
  if (!author || typeof author !== "object") return null;

  return {
    id: num(author.id),
    displayName: str(author.display_name) || "Instructor",
    jobTitle: str(author.job_title) || undefined,
    url: str(author.url) || undefined,
    avatar: author.image_100x100
      ? str(author.image_100x100 as unknown)
      : undefined,
  };
}

export async function fetchUdemyAuthor(
  authorId: string
): Promise<Tutor | null> {
  if (!RAPID_KEY || !RAPID_HOST || !authorId) return null;

  const options = {
    method: "GET" as const,
    url: `https://${RAPID_HOST}/authors.php`,
    params: { id: authorId, limit: 1 },
    headers: {
      "x-rapidapi-key": RAPID_KEY,
      "x-rapidapi-host": RAPID_HOST,
      "Content-Type": "application/json",
    },
  };

  let response;
  try {
    response = await axios.request(options);
  } catch {
    return null;
  }
  if (!response?.data) return null;

  return mapAuthorPayload(response.data);
}
