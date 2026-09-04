import type { CatalogCourse } from "@/types/course";

/**
 * The list of courses shown on /courses.
 *
 * Each entry is a single YouTube playlist rendered as its own course card on
 * /courses and as a Udemy-style split view (player + curriculum) on
 * /courses/[courseId]. Titles and authors are fetched live from the YouTube
 * Data API (see `fetchPlaylistMeta` in youtube.ts); the static `title` below
 * is only a fallback while the API is unreachable. To add a course, append an
 * entry with its playlist id here.
 */

/** YouTube playlists powering each course topic. */
export const WEB_DEV_PLAYLIST_IDS = [
  "PLSDeUiTMfxW7lm7P7GZ8qtNFffHAR5d_w",
  "PLZPZq0r_RZOPP5Yjt6IqgytMRY5uLt4y3",
  "PLoYCgNOIyGABDU532eesybur5HPBVfC1G",
  "PLillGF-RfqbbnEGy3ROiLWk7JMCuSyQtX",
  "PL4cUxeGkcC9hhNl8shRf6TIL-dNkpSRV0",
  "PL4cUxeGkcC9gU_GvFygZFu0aBysPilkbB",
] as const;

export const UI_UX_PLAYLIST_IDS = [
  "PLEiEAq2VkUULzCiDV5VyF7zR6zoDIT_eH",
  "PLjiHFwhbHYlHSpAflJwjsKAyMaMhASm0F",
  "PLttcEXjN1UcHu4tCUSNhhuQ4riGARGeap",
] as const;

export const ML_PLAYLIST_IDS = [
  "PLlrxD0HtieHjNnGcZ1TWzPjKYWgfXSiWG",
  "PLWKjhJtqVAblStefaz_YOVpDWqcRScc2s",
  "PLEiEAq2VkUULYYgj13YHUWmRePqiu8Ddy",
] as const;

export const DATA_PLAYLIST_IDS = [
  "PLUaB-1hjhk8FE_XZ87vPPSfHqb6OcM0cF",
  "PL_CkpxkuPiT-RJ7zBfHVWwgltEWIVwrwb",
] as const;

function makeCourse(
  index: number,
  playlist: {
    playlistId: string;
    title: string;
    category: string;
    level: string;
  }
): CatalogCourse {
  const slug = playlist.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    id: index === 0 ? slug : `${slug}-${index + 1}`,
    playlistId: playlist.playlistId,
    title: playlist.title,
    category: playlist.category,
    level: playlist.level,
    imageAlt: `${playlist.title} course artwork`,
  };
}

function list(
  ids: readonly string[],
  base: {
    title: string;
    category: string;
    level: string;
  }
): CatalogCourse[] {
  return ids.map((playlistId, i) =>
    makeCourse(i, { playlistId, ...base })
  );
}

export const catalog: CatalogCourse[] = [
  ...list(WEB_DEV_PLAYLIST_IDS, {
    title: "Web Development",
    category: "Web Development",
    level: "Beginner",
  }),
  ...list(UI_UX_PLAYLIST_IDS, {
    title: "UI/UX Design",
    category: "UI/UX Design",
    level: "Beginner",
  }),
  ...list(ML_PLAYLIST_IDS, {
    title: "Machine Learning",
    category: "Machine Learning",
    level: "Intermediate",
  }),
  ...list(DATA_PLAYLIST_IDS, {
    title: "Data Analytics",
    category: "Data Analytics",
    level: "Intermediate",
  }),
];

export function getCatalogCourse(id: string): CatalogCourse | undefined {
  return catalog.find((c) => c.id === id);
}