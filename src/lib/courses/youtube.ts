import type {
  Curriculum,
  CurriculumItem,
  PlaylistMeta,
  Tutor,
  YTChannelItem,
  YTPlaylistItem,
  YTPlaylistListItem,
  YTVideoItem,
} from "@/types/course";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const YT_KEY = process.env.YOUTUBE_API_KEY;

/** Convert an ISO-8601 duration (PT1H2M3S) to a readable "1:02:03" string. */
export function formatDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const sec = m[3] ? parseInt(m[3], 10) : 0;
  return h > 0
    ? `${h}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * Fetch all videos in a YouTube playlist (playlistItems.list) plus their
 * durations (videos.list), generating the "Course Content" curriculum.
 * Returns null when no API key is configured or the call fails.
 */
export async function fetchPlaylistCurriculum(
  playlistId: string
): Promise<Curriculum | null> {
  if (!YT_KEY || !playlistId) return null;

  const items: CurriculumItem[] = [];
  let playlistTitle = "";
  let nextPageToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        playlistId,
        maxResults: "50",
        key: YT_KEY,
      });
      if (nextPageToken) params.set("pageToken", nextPageToken);

      const res = await fetch(`${YT_BASE}/playlistItems?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        items?: YTPlaylistItem[];
        nextPageToken?: string;
        pageInfo?: { totalResults?: number };
      };
      playlistTitle ||= "";
      const videos = data.items ?? [];

      for (const v of videos) {
        const videoId =
          v.contentDetails?.videoId || v.snippet?.resourceId?.videoId;
        const title = v.snippet?.title ?? "";
        if (!videoId || !title || title === "Private video") continue;
        items.push({
          videoId,
          title,
          description: v.snippet?.description ?? "",
          thumbnail: v.snippet?.thumbnails?.default?.url ?? undefined,
        });
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    const videoIds = items.map((i) => i.videoId);
    if (videoIds.length > 0) {
      const durations = new Map<string, string>();
      // YouTube's videos.list accepts at most 50 ids per request, so chunk.
      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);
        try {
          const durRes = await fetch(
            `${YT_BASE}/videos?part=contentDetails&id=${chunk.join(
              ","
            )}&key=${YT_KEY}`,
            { cache: "no-store" }
          );
          if (!durRes.ok) continue;
          const durData = (await durRes.json()) as { items?: YTVideoItem[] };
          for (const v of durData.items ?? []) {
            if (v.id) durations.set(v.id, formatDuration(v.contentDetails?.duration));
          }
        } catch {
          // ignore duration failures; durations stay empty
        }
      }
      for (const item of items) {
        item.duration = durations.get(item.videoId) ?? "";
      }
    }
  } catch {
    return null;
  }

  return {
    courseId: playlistId,
    playlistTitle,
    playlistId,
    items,
  };
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const curriculumCache = new Map<string, { data: Curriculum | null; at: number }>();

/**
 * Cached wrapper around `fetchPlaylistCurriculum`. Hits the YouTube API at
 * most once per playlist per 24h window (per running server instance),
 * which keeps quota consumption low and predictable. Successes and
 * failures are both memoized so repeated curriculum opens don't re-query.
 */
export async function getPlaylistCurriculumCached(
  playlistId: string
): Promise<Curriculum | null> {
  if (!playlistId) return null;

  const hit = curriculumCache.get(playlistId);
  const now = Date.now();
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return hit.data;
  }

  const data = await fetchPlaylistCurriculum(playlistId);
  curriculumCache.set(playlistId, { data, at: now });
  return data;
}

/**
 * Fetch the title + owning channel of a YouTube playlist via `playlists.list`.
 * Returns null when no API key is configured or the call fails. Cached per
 * playlist with the same 24h window as the curriculum.
 */
export async function fetchPlaylistMeta(
  playlistId: string
): Promise<PlaylistMeta | null> {
  if (!YT_KEY || !playlistId) return null;

  try {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      id: playlistId,
      key: YT_KEY,
    });
    const res = await fetch(`${YT_BASE}/playlists?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: YTPlaylistListItem[] };
    const info = data.items?.[0]?.snippet;
    if (!info?.title || !info?.channelId) return null;

    return {
      title: info.title,
      channelId: info.channelId,
      channelTitle: info.channelTitle || "Channel",
      itemCount: data.items?.[0]?.contentDetails?.itemCount,
      thumbnail: info.thumbnails?.medium?.url ?? info.thumbnails?.default?.url,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    };
  } catch {
    return null;
  }
}

const metaCache = new Map<string, { data: PlaylistMeta | null; at: number }>();

export async function getPlaylistMetaCached(
  playlistId: string
): Promise<PlaylistMeta | null> {
  if (!playlistId) return null;

  const hit = metaCache.get(playlistId);
  const now = Date.now();
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return hit.data;
  }

  const data = await fetchPlaylistMeta(playlistId);
  metaCache.set(playlistId, { data, at: now });
  return data;
}

const channelAvatarCache = new Map<
  string,
  { data: string | null; at: number }
>();

async function fetchChannelAvatar(channelId: string): Promise<string | null> {
  const hit = channelAvatarCache.get(channelId);
  const now = Date.now();
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return hit.data;
  }

  if (!YT_KEY) return null;
  try {
    const params = new URLSearchParams({
      part: "snippet",
      id: channelId,
      key: YT_KEY,
    });
    const res = await fetch(
      `${YT_BASE}/channels?${params.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: YTChannelItem[] };
    const avatar =
      data.items?.[0]?.snippet?.thumbnails?.default?.url ?? null;
    channelAvatarCache.set(channelId, { data: avatar, at: now });
    return avatar;
  } catch {
    return null;
  }
}

/**
 * Fetch the YouTube channel (author) that owns a playlist. Returns a `Tutor`
 * with the channel name and avatar, or null when the call fails. Reads the
 * playlist metadata from the shared 24h cache.
 */
export async function fetchYouTubeAuthor(
  playlistId: string
): Promise<Tutor | null> {
  if (!playlistId) return null;

  try {
    const meta = await getPlaylistMetaCached(playlistId);
    if (!meta) return null;
    const avatar = await fetchChannelAvatar(meta.channelId);
    return {
      id: meta.channelId,
      displayName: meta.channelTitle,
      avatar: avatar ?? undefined,
    };
  } catch {
    return null;
  }
}

