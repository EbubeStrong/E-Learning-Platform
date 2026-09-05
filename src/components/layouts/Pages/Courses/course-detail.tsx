"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth, useClerk } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { getCourseAccent } from "@/lib/course-accent";
import { useCourseDetail } from "@/lib/courses/use-course-detail";
import {
  Check,
  ListVideo,
  Lock,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type {
  CourseVideo,
  YTPlayer,
} from "@/types/course";
import type { Id } from "../../../../../convex/_generated/dataModel";

function CourseDetail({
  courseId,
  videoId,
  index,
}: {
  courseId: string;
  videoId?: string;
  index?: number;
}) {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isAuthenticated } = useConvexAuth();
  const playerRef = useRef<HTMLDivElement>(null);
  const [curriculumOpen, setCurriculumOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "content" | "assistant"
  >("content");

  const { course, videos, tutor, loading, notFound } =
    useCourseDetail(courseId);

  const resume = useQuery(
    api.watchProgress.getResume,
    userId && isAuthenticated ? { courseId } : "skip"
  );

  const progressItems = useQuery(
    api.watchProgress.listForCourse,
    userId && isAuthenticated ? { courseId } : "skip"
  );
  const completedCount = progressItems
    ? progressItems.filter((item) => item.durationSeconds).length
    : 0;

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      void redirectToSignIn({ signInFallbackRedirectUrl: `/courses/${courseId}` });
    }
  }, [authLoaded, isSignedIn, courseId, redirectToSignIn]);

  const redirectToVideo = useCallback(
    (v: CourseVideo, i: number) => {
      router.push(`/courses/${courseId}/${v.videoId}/${i}`);
    },
    [courseId, router]
  );

  // Resolve the current video from the URL. Fall back to the first video when
  // the requested index is missing, out of range, or mismatched.
  const currentVideo =
    videos[index ?? -1]?.videoId === videoId
      ? videos[index ?? -1]
      : (videos[0] ?? null);

  // If the URL points to an invalid video, normalise back to the first one.
  const urlNeedsNormalise =
    !loading &&
    videos.length > 0 &&
    currentVideo &&
    currentVideo.videoId !== videoId;

  useEffect(() => {
    if (urlNeedsNormalise && currentVideo) {
      router.replace(`/courses/${courseId}/${currentVideo.videoId}/0`);
    }
  }, [urlNeedsNormalise, currentVideo, courseId, router]);

  const resumePosition =
    currentVideo && resume && resume.videoId === currentVideo.videoId
      ? resume.positionSeconds
      : 0;

  if (loading || !authLoaded) {
    return (
      <div className="w-full bg-ivory-200">
        <div className="h-16 bg-mocha-600" />
        <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-[1fr_340px] lg:gap-0 lg:p-0">
          <div>
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-8 w-2/3 rounded-xl" />
              <Skeleton className="h-4 w-1/2 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-[30rem] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !course || !currentVideo) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-ivory-200 p-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-mocha-300/50 bg-mocha-100 p-10 text-center text-sm text-mocha-400">
          Course not found.
        </div>
      </div>
    );
  }

  const author = tutor?.displayName ?? "Instructor";
  const avatar = tutor?.avatar;
  const currentIndex = videos.findIndex(
    (video) => video.videoId === currentVideo.videoId
  );
  const totalDuration = formatTotalDuration(videos.map((video) => video.duration));
  const progressPct =
    videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;
  const description =
    videos.find((video) => video.videoId === currentVideo.videoId)?.description ??
    videos[0]?.description ??
    "";

  return (
    <div className="flex min-h-screen w-full flex-col bg-ivory-200 text-mocha-500">
      {/* ===== Certificate progress section (Udemy-style slim dark bar) ===== */}
      <section
        aria-label="Course progress"
        className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-mocha-600 px-4 text-ivory-100 shadow-md lg:h-16 lg:px-5"
      >
        <span className="hidden text-xs font-medium uppercase tracking-wider text-mocha-300 md:inline">
          Certificate Course
        </span>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ivory-100 lg:text-base">
          {course.title}
        </h1>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-4">
          {/* Progress circle */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="relative h-9 w-9 rounded-full" title="Your progress">
              <svg viewBox="0 0 100 100" className="h-9 w-9 -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(199,164,141,0.35)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#c7a48d"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 * (1 - progressPct / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-mocha-300" />
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold">Your progress</span>
              <span className="text-[11px] text-ivory-300">
                {completedCount} of {videos.length} complete
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ===== Two-column body ===== */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 lg:grid lg:grid-cols-[1fr_340px] lg:px-0 lg:py-0">
        {/* --- Content column (left) --- */}
        <main className="min-w-0">
          {/* Video player */}
          <div
            ref={playerRef}
            className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_16px_36px_rgba(58,42,38,0.18)]"
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
                  <Button
                    type="button"
                    variant="secondary"
                    className="relative rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/25"
                  >
                    Sign in
                  </Button>
                </SignInButton>
              </div>
            ) : currentVideo && userId ? (
              <PlaybackPlayer
                videoId={currentVideo.videoId}
                title={currentVideo.title}
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

          {/* Prev / Next + current title */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex <= 0}
              onClick={() =>
                currentIndex > 0 &&
                redirectToVideo(videos[currentIndex - 1], currentIndex - 1)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-mocha-300/70 bg-mocha-100 px-4 py-2 text-sm font-semibold text-mocha-500 transition-colors hover:bg-mocha-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-auto"
            >
              <Play className="h-4 w-4 -scale-x-100" />
              Previous
            </Button>
            <Button
              type="button"
              disabled={currentIndex >= videos.length - 1}
              onClick={() =>
                currentIndex < videos.length - 1 &&
                redirectToVideo(videos[currentIndex + 1], currentIndex + 1)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-mocha-500 px-4 py-2 text-sm font-semibold text-ivory-200 transition-colors hover:bg-mocha-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-auto"
            >
              Next
              <Play className="h-4 w-4" />
            </Button>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-mocha-400">
              {currentIndex + 1}. {currentVideo.title}
            </span>
          </div>

          {/* Instructor row */}
          <div className="mt-4 flex items-center gap-3 text-mocha-400">
            <Avatar size="lg" className="shrink-0 bg-mocha-300/40 text-sm font-semibold text-mocha-500">
              {avatar && <AvatarImage src={avatar} alt={author} />}
              <AvatarFallback className="bg-mocha-300/40 font-semibold text-mocha-500">
                {author.charAt(0)}
              </AvatarFallback>
            </Avatar>
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

          {/* --- Overview content (always shown) --- */}
          <div className="py-6">
              <div className="space-y-7">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 border-b border-mocha-300/40 pb-6 sm:grid-cols-3">
                  {[
                    { label: "Skill level", value: course.level },
                    { label: "Lectures", value: `${videos.length}` },
                    { label: "Total", value: totalDuration },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-xl font-bold text-mocha-500">
                        {stat.value}
                      </div>
                      <div className="text-xs text-mocha-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* By the numbers */}
                <section className="grid gap-3 border-b border-mocha-300/40 pb-6 text-sm sm:grid-cols-[180px_1fr]">
                  <div className="font-bold text-mocha-500">By the numbers</div>
                  <dl className="space-y-2 text-mocha-400">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-xs text-mocha-300">Skill level</div>
                        <div>{course.level}</div>
                      </div>
                      <div>
                        <div className="text-xs text-mocha-300">Lectures</div>
                        <div>{videos.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-mocha-300">Total</div>
                        <div>{totalDuration}</div>
                      </div>
                    </div>
                  </dl>
                </section>

                {/* Description */}
                <section className="grid gap-3 text-sm sm:grid-cols-[180px_1fr]">
                  <div className="font-bold text-mocha-500">Description</div>
                  <div className="text-mocha-400">
                    {description ? (
                      <div className="whitespace-pre-line leading-relaxed">
                        {description}
                      </div>
                    ) : (
                      <p className="italic">
                        No description available for this course yet.
                      </p>
                    )}

                    {/* What you'll learn (real data: lesson titles) */}
                    {videos.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 text-base font-bold text-mocha-500">
                          What you&apos;ll learn
                        </h4>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {videos.slice(0, 8).map((video) => (
                            <li
                              key={video.videoId}
                              className="inline-flex items-start gap-2"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-mocha-400" />
                              <span>{video.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                {/* Instructor */}
                <section className="grid gap-3 text-sm sm:grid-cols-[180px_1fr]">
                  <div className="font-bold text-mocha-500">Instructor</div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 shrink-0 bg-mocha-300/40 text-lg font-semibold text-mocha-500">
                      {avatar && <AvatarImage src={avatar} alt={author} />}
                      <AvatarFallback className="bg-mocha-300/40 font-semibold text-mocha-500">
                        {author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-lg font-bold text-mocha-500">
                        {author}
                      </span>
                      {tutor?.jobTitle && (
                        <span className="text-sm text-mocha-400">
                          {tutor.jobTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              </div>
          </div>
        </main>

        {/* --- Sidebar (right, sticky) --- */}
        <aside className="mt-8 flex flex-col overflow-hidden border-l border-mocha-300/60 bg-mocha-100 shadow-[0_10px_24px_rgba(58,42,38,0.06)] lg:mt-0 lg:max-h-[calc(100vh-4rem)] lg:sticky lg:top-16">
          {/* Sidebar tabs */}
          <Tabs
            value={activeSidebarTab}
            onValueChange={(tab) =>
              setActiveSidebarTab((tab as "content" | "assistant") ?? "content")
            }
            className="flex min-h-0 flex-1 flex-col gap-0!"
          >
            <TabsList
              variant="line"
              className="flex h-auto! w-full gap-0 rounded-none border-b border-mocha-300/50 bg-transparent p-0!"
            >
              <TabsTrigger
                value="content"
                className="h-auto! flex-1 rounded-none border-b-2 border-transparent px-1.5 text-sm font-bold transition-colors hover:text-mocha-500 data-active:border-mocha-500 data-active:bg-transparent data-active:text-mocha-500 data-active:shadow-none after:hidden"
              >
                Course content
              </TabsTrigger>
              <TabsTrigger
                value="assistant"
                className="h-auto! flex-1 rounded-none border-b-2 border-transparent px-1.5 text-sm font-bold transition-colors hover:text-mocha-500 data-active:border-mocha-500 data-active:bg-transparent data-active:text-mocha-500 data-active:shadow-none after:hidden"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  AI Assistant
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="content"
              className="flex min-h-0 flex-1 flex-col"
            >
              <Accordion
                value={curriculumOpen ? ["curriculum"] : []}
                onValueChange={(value) =>
                  setCurriculumOpen(value.includes("curriculum"))
                }
className="flex min-h-0 flex-1 flex-col"
              >
                <AccordionItem
                  value="curriculum"
                  className="flex min-h-0 flex-1 flex-col border-0!"
                >
                  <AccordionTrigger className="flex w-full items-start gap-2 rounded-none px-4 py-3 text-left hover:no-underline [&_[data-slot='accordion-trigger-icon']]:mt-1! [&_[data-slot='accordion-trigger-icon']]:shrink-0! [&_[data-slot='accordion-trigger-icon']]:text-mocha-400!" >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-mocha-500">
                        Section 1: {course.title}
                      </div>
                      <div className="mt-0.5 text-xs text-mocha-400">
                        {completedCount} / {videos.length} | {totalDuration}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="overflow-y-auto border-t border-mocha-300/40 pt-0 lg:max-h-[calc(100vh-10.5rem)]">
                    {videos.length === 0 ? (
                      <div className="p-6 text-center text-sm text-mocha-400">
                        No lessons available for this course yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-mocha-300/30">
                        {videos.map((video, index) => {
                          const isActive =
                            video.videoId === currentVideo.videoId;
                          return (
                            <Button
                              key={video.videoId}
                              type="button"
                              variant="ghost"
                              onClick={() => redirectToVideo(video, index)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-none px-4 py-3 text-left transition-colors duration-200",
                                isActive
                                  ? "bg-mocha-300/40 text-mocha-500 hover:bg-mocha-300/40"
                                  : "hover:bg-mocha-300/25"
                              )}
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                {isActive ? (
                                  <Play className="h-4 w-4 text-mocha-500" />
                                ) : (
                                  <span className="sr-only">Play</span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-mocha-500">
                                  <span className="text-mocha-400">
                                    {index + 1}.
                                  </span>{" "}
                                  {video.title}
                                </span>
                                <span className="mt-0.5 flex items-center gap-2 text-xs text-mocha-400">
                                  <ListVideo className="h-3 w-3" />
                                  <span>{video.duration || "—"}</span>
                                </span>
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent
              value="assistant"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <Sparkles className="h-6 w-6 text-mocha-300" />
                <p className="text-sm font-semibold text-mocha-500">
                  AI Assistant
                </p>
                <p className="text-xs text-mocha-400">
                  Ask questions about this course&apos;s content.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

export default CourseDetail;

const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };

function PlaybackPlayer({
  videoId,
  title,
  courseId,
  startAt,
}: {
  videoId: string;
  title: string;
  courseId: string;
  startAt: number;
}) {
  const playerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const currentVideoIdRef = useRef(videoId);
  const pendingVideoIdRef = useRef<string | null>(null);
  const startedAtRef = useRef(startAt);
  const saveWatched = useMutation(api.watchProgress.upsert);

  // Keep the latest saveWatched + courseId reachable from callbacks without
  // forcing the creation effect to depend on them (which would recreate the
  // player). Persist always reports progress for the video that was actually
  // playing (currentVideoIdRef), never a newly-selected one. Refs are synced
  // inside effects (never during render) to satisfy React Compiler rules.
  const saveWatchedRef = useRef(saveWatched);
  const courseIdRef = useRef(courseId);
  useEffect(() => {
    saveWatchedRef.current = saveWatched;
  }, [saveWatched]);
  useEffect(() => {
    courseIdRef.current = courseId;
  }, [courseId]);

  const persist = useCallback(() => {
    const player = apiRef.current;
    // Only read from a fully-initialised player. The IFrame wrapper is not
    // usable until the API fires "ready"; tear-down (StrictMode remount,
    // page unload) also leaves it unusable.
    if (!player || !readyRef.current) return;
    try {
      void saveWatchedRef.current({
        courseId: courseIdRef.current,
        videoId: currentVideoIdRef.current,
        positionSeconds: Math.floor(player.getCurrentTime()),
        durationSeconds: Math.floor(player.getDuration()) || undefined,
      });
    } catch {
      // A dropped progress write during teardown beats crashing the page.
    }
  }, []);

  // Effect A — create the player exactly ONCE on mount, reuse it for every
  // video. Only the actual component unmount (leaving the page) destroys it.
  useEffect(() => {
    const createPlayer = () => {
      if (!window.YT?.Player || !playerRef.current) return;
      apiRef.current = new window.YT.Player(playerRef.current.id, {
        videoId: currentVideoIdRef.current,
        playerVars: { autoplay: 1 },
        events: {
          onReady: (event) => {
            readyRef.current = true;
            // If a video switch happened before the API was ready, load the
            // queued video instead of the initial one.
            if (pendingVideoIdRef.current) {
              event.target.loadVideoById(pendingVideoIdRef.current);
              pendingVideoIdRef.current = null;
            }
            if (startedAtRef.current > 0) {
              event.target.seekTo(startedAtRef.current, true);
            }
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (event.data === YT_STATE.PAUSED || event.data === YT_STATE.ENDED) {
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
  }, [persist]);

  // Effect B — react to video switches in the SAME player.
  useEffect(() => {
    const previous = currentVideoIdRef.current;
    const next = videoId;

    // Persist the video that was actually playing BEFORE the switch, then
    // adopt the new video id so subsequent progress writes target it.
    if (previous !== next) {
      persist();
      currentVideoIdRef.current = next;
    }

    if (next !== previous || readyRef.current) {
      startedAtRef.current = startAt;
      const player = apiRef.current;
      if (player && readyRef.current) {
        player.loadVideoById(next);
        if (startAt > 0) {
          player.seekTo(startAt, true);
        }
      } else {
        pendingVideoIdRef.current = next;
      }
    }
  }, [videoId, startAt, persist]);

  return (
    <div
      id={`yt-${videoId}`}
      ref={playerRef}
      className="h-full w-full"
      title={title}
    />
  );
}

function formatTotalDuration(durations: string[]): string {
  let totalSeconds = 0;
  for (const duration of durations) {
    if (!duration) continue;
    const parts = duration.split(":").map(Number);
    if (parts.some((part) => Number.isNaN(part))) continue;
    let seconds = 0;
    for (const part of parts) seconds = seconds * 60 + part;
    totalSeconds += seconds;
  }
  if (totalSeconds === 0) return "—";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
