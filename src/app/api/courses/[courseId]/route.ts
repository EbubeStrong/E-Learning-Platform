import { NextResponse } from "next/server";
import { getCatalogCourse } from "@/lib/courses/catalog";
import {
  fetchYouTubeAuthor,
  getPlaylistCurriculumCached,
  getPlaylistMetaCached,
} from "@/lib/courses/youtube";
import type { IdContext } from "@/types/ui";

export async function GET(_req: Request, ctx: IdContext) {
  const { courseId } = await ctx.params;
  const entry = getCatalogCourse(courseId);

  if (!entry) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const [meta, curriculum, tutor] = await Promise.all([
    getPlaylistMetaCached(entry.playlistId),
    getPlaylistCurriculumCached(entry.playlistId),
    fetchYouTubeAuthor(entry.playlistId),
  ]);

  const videos = (curriculum?.items ?? []).map((item) => ({
    videoId: item.videoId,
    title: item.title,
    duration: item.duration ?? "",
    description: item.description ?? "",
    thumbnail: item.thumbnail ?? undefined,
  }));

  return NextResponse.json({
    course: {
      id: entry.id,
      playlistId: entry.playlistId,
      title: meta?.title ?? entry.title,
      category: entry.category,
      level: entry.level,
      imageAlt: entry.imageAlt,
      playlistUrl: meta?.playlistUrl,
      thumbnail: meta?.thumbnail,
    },
    videos,
    total: videos.length,
    tutor,
  });
}