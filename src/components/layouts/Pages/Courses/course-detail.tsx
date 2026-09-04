"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { getCourseAccent } from "@/lib/course-accent";
import { Clock3, BookOpenText, ListVideo, Lock, PlayCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CourseVideo,
  DetailCourse,
  Tutor,
  YTPlayer,
} from "@/types/course";
import type { Id } from "../../../../../convex/_generated/dataModel";

function CourseDetail({ courseId }: { courseId: string }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const playerRef = useRef<HTMLDivElement>(null);

  const resume = useQuery(
    api.watchProgress.getResume,
    userId ? { userId, courseId } : "skip"
  );

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      void redirectToSignIn({ signInFallbackRedirectUrl: `/courses/${courseId}` });
    }
  }, [authLoaded, isSignedIn, courseId, redirectToSignIn]);

  const [course, setCourse] = useState<DetailCourse | null>(null);
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [currentVideo, setCurrentVideo] = useState<CourseVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`/api/courses/${courseId}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (active) setNotFound(true);
          return null;
        }
        const data = (await res.json()) as {
          course?: DetailCourse;
          videos?: CourseVideo[];
          tutor?: Tutor;
        };
        return data;
      })
      .then((data) => {
        if (!active || !data) return;
        setCourse(data.course ?? null);
        setVideos(data.videos ?? []);
        setTutor(data.tutor ?? null);
        setCurrentVideo(data.videos?.[0] ?? null);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId]);

  // Resume the last-watched video once both playlist + resume are available.
  useEffect(() => {
    if (!loading || resume === undefined || videos.length === 0) return;
    const match = videos.find((video) => video.videoId === resume?.videoId);
    if (match) {
      const timeout = setTimeout(() => setCurrentVideo(match), 0);
      return () => clearTimeout(timeout);
    }
  }, [loading, resume, videos]);

  const resumePosition =
    currentVideo && resume && resume.videoId === currentVideo.videoId
      ? resume.positionSeconds
      : 0;

  function selectVideo(video: CourseVideo) {
    setCurrentVideo(video);
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading || !authLoaded) {
    return (
      <section className="w-full bg-ivory-200 px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="h-8 w-2/3 rounded-xl" />
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <Skeleton className="aspect-video w-full rounded-3xl" />
            <Skeleton className="h-[28rem] rounded-3xl" />
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !course) {
    return (
      <section className="w-full bg-ivory-200 px-6 py-14 md:py-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-mocha-300/50 bg-mocha-100 p-10 text-center text-sm text-mocha-400">
          Course not found.
        </div>
      </section>
    );
  }

  const author = tutor?.displayName ?? "Instructor";
  const avatar = tutor?.avatar;

  return (
    <section className="w-full bg-ivory-200 px-6 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
          {course.category}
        </Badge>
        <h1 className="text-2xl font-black tracking-tight text-mocha-500 md:text-4xl">
          {course.title}
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: player + info */}
          <div>
            <div
              ref={playerRef}
              className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-[0_16px_36px_rgba(58,42,38,0.18)]"
            >
              {!isSignedIn ? (
                <div
                  className={`relative flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br ${
                    getCourseAccent(course.category)
                  }`}
                >
                  <div className="absolute inset-0 bg-black/55" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
                    <Lock className="h-6 w-6" />
                  </div>
                  <p className="relative text-lg font-bold text-white md:text-xl">
                    Sign in to play this course
                  </p>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="relative rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              ) : currentVideo && userId ? (
                <PlaybackPlayer
                  key={currentVideo.videoId}
                  videoId={currentVideo.videoId}
                  title={currentVideo.title}
                  userId={userId}
                  courseId={courseId}
                  startAt={resumePosition}
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${
                    getCourseAccent(course.category)
                  }`}
                >
                  <span className="text-6xl font-black tracking-tight text-white/70">
                    {course.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <h2 className="text-xl font-bold leading-snug tracking-tight text-mocha-500">
                {currentVideo?.title ?? course.title}
              </h2>

              <div className="flex items-center gap-3 text-mocha-400">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-mocha-300/40 text-sm font-semibold text-mocha-500">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={author}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {author.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-lg font-medium text-mocha-500">
                    {author}
                  </span>
                  {tutor?.jobTitle && (
                    <span className="line-clamp-1 text-xs text-mocha-400">
                      {tutor.jobTitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-mocha-400">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  {course.level}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  {currentVideo?.duration || "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpenText className="h-4 w-4" />
                  {videos.length} lessons
                </span>
              </div>
            </div>
          </div>

          {/* Right: playlist */}
          <aside className="flex flex-col overflow-hidden rounded-3xl border border-mocha-300/60 bg-mocha-100 shadow-[0_10px_24px_rgba(58,42,38,0.06)]">
            <div className="flex items-center gap-2 border-b border-mocha-300/50 px-5 py-4">
              <ListVideo className="h-5 w-5 text-mocha-400" />
              <span className="text-lg font-bold tracking-tight text-mocha-500">
                Course Content
              </span>
              <span className="ml-auto text-sm text-mocha-400">
                {videos.length} lessons
              </span>
            </div>

            <div className="max-h-[32rem] flex-1 divide-y divide-mocha-300/40 overflow-y-auto">
              {videos.length === 0 ? (
                <div className="p-6 text-center text-sm text-mocha-400">
                  No lessons available for this course yet.
                </div>
              ) : (
                videos.map((video, i) => {
                  const isActive = video.videoId === currentVideo?.videoId;
                  return (
                    <button
                      key={video.videoId}
                      type="button"
                      onClick={() => selectVideo(video)}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-200 ${
                        isActive
                          ? "bg-mocha-300/50"
                          : "hover:bg-mocha-300/30"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mocha-300/40 text-xs font-bold text-mocha-500">
                        {isActive ? (
                          <PlayCircle className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`line-clamp-2 text-sm font-medium ${
                            isActive
                              ? "text-mocha-500"
                              : "text-mocha-400"
                          }`}
                        >
                          {video.title}
                        </p>
                        {video.duration && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-mocha-400">
                            <Clock3 className="h-3 w-3" />
                            {video.duration}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CourseDetail;

const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };

function PlaybackPlayer({
  videoId,
  title,
  userId,
  courseId,
  startAt,
}: {
  videoId: string;
  title: string;
  userId: Id<"users">;
  courseId: string;
  startAt: number;
}) {
  const playerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const startedAtRef = useRef(startAt);
  const saveWatched = useMutation(api.watchProgress.upsert);

  // Force fresh start position when the keyed video changes.
  useEffect(() => {
    startedAtRef.current = startAt;
  }, [startAt]);

  const persist = useCallback(() => {
    const player = apiRef.current;
    // Only read from a fully-initialised player. The IFrame wrapper is not
    // usable until the API fires "ready"; tear-down (StrictMode remount,
    // video switch, page unload) also leaves it unusable.
    if (!player || !readyRef.current) return;
    try {
      void saveWatched({
        userId,
        courseId,
        videoId,
        positionSeconds: Math.floor(player.getCurrentTime()),
        durationSeconds: Math.floor(player.getDuration()) || undefined,
      });
    } catch {
      // A dropped progress write during teardown beats crashing the page.
    }
  }, [saveWatched, userId, courseId, videoId]);

  useEffect(() => {
    const createPlayer = () => {
      if (!window.YT?.Player || !playerRef.current) return;
      apiRef.current = new window.YT.Player(playerRef.current.id, {
        videoId,
        playerVars: { autoplay: 1 },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            if (startedAtRef.current > 0) {
              e.target.seekTo(startedAtRef.current, true);
            }
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT_STATE.PAUSED || e.data === YT_STATE.ENDED) {
              persist();
            }
          },
        },
      });
    };

    const loadWhenReady = () => {
      // Only construct once `YT.Player` exists. `window.YT` becomes truthy
      // before `YT.Player` is attached, so gate on the official ready signal.
      const run = () => createPlayer();
      if (window.YT?.ready) {
        window.YT.ready(run);
      } else {
        window.onYouTubeIframeAPIReady = run;
      }
    };

    const ensureApi = () => {
      const existing = document.getElementById("youtube-iframe-api");
      if (existing || window.YT) {
        loadWhenReady();
        return;
      }
      window.onYouTubeIframeAPIReady = () => loadWhenReady();
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    };

    ensureApi();

    const onUnload = () => persist();
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      persist();
      if (apiRef.current) {
        try {
          apiRef.current.destroy();
        } catch {
          /* ignore */
        }
      }
      apiRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, courseId, userId]);

  return (
    <div
      id={`yt-${videoId}`}
      ref={playerRef}
      className="h-full w-full"
      title={title}
    />
  );
}
