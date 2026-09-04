"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlarmClock, AlertTriangle } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";

function fmt(ms: number) {
  if (ms <= 0) return "due now";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function Deadlines() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const deadlines = useQuery(
    api.attempts.pendingDeadlines,
    userId ? { userId } : "skip"
  );

  if (deadlines === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const active = deadlines.filter((deadline) => !deadline.expired);
  const expired = deadlines.filter((deadline) => deadline.expired);

  if (deadlines.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl bg-mocha-200/60 px-4 text-center text-sm text-mocha-400">
        No in-progress quizzes with deadlines.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {active.map((deadline) => (
        <Link
          key={String(deadline._id)}
          href={`/quiz/${deadline.courseId}?type=${deadline.quizType}`}
          className="flex items-center gap-3 rounded-xl border border-mocha-300/60 bg-mocha-100 px-3 py-2.5 transition-colors hover:bg-mocha-300/30"
        >
          <AlarmClock className="h-5 w-5 shrink-0 text-mocha-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-mocha-500">
              {deadline.quizTitle}
            </p>
            <p className="text-xs text-mocha-400">
              {deadline.mode === "timed"
                ? `ends in ${fmt(deadline.remainingMs)}`
                : "untimed"}
            </p>
          </div>
          <span className="rounded-full bg-mocha-300/50 px-2 py-0.5 text-xs font-semibold text-mocha-500">
            Resume
          </span>
        </Link>
      ))}
      {expired.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-100/70 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {expired.length} expired quiz{expired.length > 1 ? "zes" : ""}{" "}
            will be auto-submitted on your next visit.
          </span>
        </div>
      )}
    </div>
  );
}
