import { NextResponse } from "next/server";
import { catalog } from "@/lib/courses/catalog";
import { getPlaylistMetaCached } from "@/lib/courses/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await Promise.all(
    catalog.map(async (entry) => {
      const meta = await getPlaylistMetaCached(entry.playlistId);
      return {
        id: entry.id,
        thumbnail: meta?.thumbnail,
        imageAlt: entry.imageAlt,
      };
    })
  );

  const thumbnails: Record<string, { thumbnail?: string; imageAlt?: string }> = {};
  for (const entry of entries) {
    if (entry.thumbnail) {
      thumbnails[entry.id] = { thumbnail: entry.thumbnail, imageAlt: entry.imageAlt };
    }
  }

  return NextResponse.json({ thumbnails });
}