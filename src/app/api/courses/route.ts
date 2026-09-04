import { NextResponse } from "next/server";
import { catalog } from "@/lib/courses/catalog";
import {
  getPlaylistMetaCached,
  fetchYouTubeAuthor,
} from "@/lib/courses/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const courses = await Promise.all(
    catalog.map(async (entry) => {
      const [meta, tutor] = await Promise.all([
        getPlaylistMetaCached(entry.playlistId),
        fetchYouTubeAuthor(entry.playlistId),
      ]);
      return {
        id: entry.id,
        playlistId: entry.playlistId,
        title: meta?.title ?? entry.title,
        category: entry.category,
        level: entry.level,
        imageAlt: entry.imageAlt,
        videoCount: meta?.itemCount ?? 0,
        thumbnail: meta?.thumbnail,
        playlistUrl: meta?.playlistUrl,
        tutor,
      };
    })
  );

  return NextResponse.json({ courses });
}