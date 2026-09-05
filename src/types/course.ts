export interface Course {
  id: string;
  udemyId: string;
  playlistId: string;
  title: string;
  subtitle?: string;
  headline?: string;
  category: string;
  level: string;
  rating: string;
  hours: string;
  lessons: string;
  price: string;
  image?: string;
  imageAlt?: string;
  instructor?: string;
  instructorAvatar?: string;
  url?: string;
}

export interface CurriculumItem {
  videoId: string;
  title: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
}

export interface Curriculum {
  courseId: string;
  playlistTitle: string;
  playlistId: string;
  items: CurriculumItem[];
}

export interface FeaturedCourse {
  image?: string;
  title: string;
  subtitle?: string;
  instructor?: string;
  lessons?: string;
  duration?: string;
  rating?: string;
  price?: string;
  level?: string;
}

/** A single video (from a YouTube playlist) rendered as its own course card. */
export interface CourseVideo {
  videoId: string;
  title: string;
  duration: string;
  description?: string;
  thumbnail?: string;
}

/** Response of /api/courses — shared course details + its videos. */
export interface CourseWithVideos {
  course: Course;
  videos: CourseVideo[];
  total: number;
}

export interface Tutor {
  id: string | number;
  displayName: string;
  jobTitle?: string;
  url?: string;
  avatar?: string;
}

/** Static course card model shown on /courses (list of YouTube playlists). */
export interface CourseCard {
  id: string;
  playlistId: string;
  title: string;
  category: string;
  level: string;
  imageAlt: string;
  videoCount: number;
  thumbnail?: string;
  playlistUrl?: string;
  tutor?: Tutor | null;
}

/** Course detail used by /courses/[courseId] rendering the player + curriculum. */
export interface DetailCourse {
  id: string;
  playlistId: string;
  title: string;
  category: string;
  level: string;
  imageAlt: string;
  playlistUrl?: string;
  thumbnail?: string;
}

/** Minimal YouTube IFrame player wrapper surfaced through player events. */
export interface YTPlayer {
  playVideo: () => void;
  loadVideoById: (videoId: string) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

/** Static course entries in the YouTube catalog (see lib/courses/catalog.ts). */
export interface CatalogCourse {
  id: string;
  playlistId: string;
  title: string;
  category: string;
  level: string;
  imageAlt: string;
}

/** Course overview card used on the admin dashboard. */
export interface CourseOverview {
  id: string;
  title: string;
  category: string;
  level: string;
  videoCount: number;
}

export interface CoursesOverview {
  courses: CourseOverview[];
  totalCourses: number;
  totalLessons: number;
  averageLessons: number;
  categories: { name: string; count: number }[];
  loading: boolean;
  error: string | null;
}

/** Artwork key used by the home section course cards. */
export type HomeCourseArtwork = "hero-one" | "hero-two" | "hero-three";

export interface HomeCourse {
  id: string;
  title: string;
  level: string;
  rating: string;
  hours: string;
  lessons: string;
  price: string;
  artwork: HomeCourseArtwork;
  category: string;
}

/** Raw playlistItems.list payload entry from the YouTube Data API. */
export interface YTPlaylistItem {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    resourceId?: { videoId?: string };
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
  contentDetails?: { videoId?: string };
}

/** Raw videos.list payload entry for the duration lookup. */
export interface YTVideoItem {
  id?: string;
  contentDetails?: { duration?: string };
}

export interface PlaylistMeta {
  title: string;
  channelId: string;
  channelTitle: string;
  itemCount?: number;
  thumbnail?: string;
  playlistUrl?: string;
}

export interface YTPlaylistInfo {
  title?: string;
  channelTitle?: string;
  channelId?: string;
  thumbnails?: Record<string, { url?: string } | undefined>;
}

export interface YTPlaylistListItem {
  snippet?: YTPlaylistInfo;
  contentDetails?: { itemCount?: number };
}

export interface YTChannelItem {
  snippet?: {
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: YTPlayerEvent) => void;
            onStateChange?: (event: YTPlayerEvent) => void;
          };
        }
      ) => YTPlayer;
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

