import axios from "axios";
import type { Course } from "@/types/course";

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

function toCurrency(v: unknown): string {
  const n = num(v);
  if (Number.isNaN(n)) return "";
  return `Egp ${Math.round(n)}`;
}

export function mapUdemyPayload(
  data: unknown,
  base: Course
): Course {
  const d = data as Record<string, unknown>;
  if (!d || typeof d !== "object") return base;

  const title = str(d.title) || str(d.name) || base.title;
  const image = str(
    d.image_480x270 ||
      d.image_750x422 ||
      d.image ||
      d["image480x270"] ||
      d.thumbnail
  );

  const rawPrice =
    d.price_detail ?? d.price ?? (d as Record<string, unknown>).price_usd;
  const price =
    rawPrice && typeof rawPrice === "object"
      ? toCurrency(
          (rawPrice as Record<string, unknown>).amount as unknown
        )
      : toCurrency(rawPrice) || base.price;

  const instructors = Array.isArray(d.visible_instructors)
    ? (d.visible_instructors as Array<Record<string, unknown>>)
    : [];
  const firstInstructor = instructors[0];

  const category =
    d.primary_category && typeof d.primary_category === "object"
      ? str((d.primary_category as Record<string, unknown>).title)
      : "";

  const hours =
    d.content_length_video !== undefined
      ? `${(num(d.content_length_video) / 3600).toFixed(1)} Hours`
      : str(d.hours) || base.hours;

  const rating =
    (d.avg_rating !== undefined ? str(Number(num(d.avg_rating)).toFixed(1)) : "") ||
    base.rating;

  return {
    ...base,
    title,
    headline: str(d.headline) || base.headline,
    subtitle: str(d.headline) || base.subtitle,
    category: category || base.category,
    level: str(d.instructional_level) || base.level,
    rating,
    hours,
    lessons: str(d.num_lectures) ? `${d.num_lectures} Lesson` : base.lessons,
    price,
    image: image || base.image,
    instructor:
      (firstInstructor && str(firstInstructor.display_name as unknown)) ||
      base.instructor,
    instructorAvatar:
      (firstInstructor && str(firstInstructor.image_100x100 as unknown)) ||
      undefined,
    url: str(d.url) || base.url,
  };
}

/**
 * Fetch a single Udemy course from the RapidAPI
 * `course.php?id=<udemyId>` endpoint using axios. Returns null when the
 * request fails or the endpoint is unreachable (caller picks a fallback).
 */
export async function fetchUdemyCourse(
  udemyId: string,
  base: Course
): Promise<Course | null> {
  if (!RAPID_KEY || !RAPID_HOST) return null;

  const options = {
    method: "GET" as const,
    url: `https://${RAPID_HOST}/course.php`,
    params: { id: udemyId },
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

  // RapidAPI may wrap the payload in a `{ ...result }` envelope.
  const data = response.data as Record<string, unknown>;
  const payload =
    data && typeof data === "object" && "result" in data
      ? data.result
      : data;

  return mapUdemyPayload(payload, base);
}
