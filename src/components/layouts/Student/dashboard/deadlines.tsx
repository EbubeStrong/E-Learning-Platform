"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const { isAuthenticated } = useConvexAuth();
  const deadlines = useQuery(
    api.attempts.pendingDeadlines,
    userId && isAuthenticated ? {} : "skip"
  );

  if (deadlines === undefined) {
    return (
      <Card className="rounded-2xl border-0 bg-mocha-100 ring-mocha-300/60">
        <div className="px-4 pt-4">
          <h2 className="text-lg font-bold text-mocha-500">
            Upcoming deadlines
          </h2>
          <p className="text-sm text-mocha-400">Quizzes in progress</p>
        </div>
        <CardContent className="space-y-2 px-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const active = deadlines.filter((deadline) => !deadline.expired);
  const expired = deadlines.filter((deadline) => deadline.expired);

  return (
    <Card className="rounded-2xl border-0 bg-mocha-100 ring-mocha-300/60">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-mocha-500">
            Upcoming deadlines
          </h2>
          <p className="text-sm text-mocha-400">Quizzes in progress</p>
        </div>
      </div>
      <CardContent className="px-4">
        {deadlines.length === 0 ? (
          <div className="flex h-28 items-center justify-center rounded-2xl bg-mocha-200/60 px-4 text-center text-sm text-mocha-400">
            No in-progress quizzes with deadlines.
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((deadline) => (
              <div
                key={String(deadline._id)}
                className="flex items-center gap-3 rounded-xl border border-mocha-300/60 bg-mocha-200/40 px-3 py-2.5"
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
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/quiz/${deadline.courseId}?type=${deadline.quizType}`}
                    />
                  }
                  className="shrink-0 rounded-full border-mocha-300/60 bg-mocha-300/30 text-mocha-500 hover:bg-mocha-300/50 hover:text-mocha-500"
                >
                  Resume
                </Button>
              </div>
            ))}
            {expired.length > 0 && (
              <Alert className="rounded-xl border-amber-300/60 bg-amber-100/70 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  {expired.length} expired quiz
                  {expired.length > 1 ? "zes" : ""} will be auto-submitted on
                  your next visit.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}