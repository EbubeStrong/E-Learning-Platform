"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  HelpCircle,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock3,
  Award,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import PerformanceChart from "@/components/layouts/Student/dashboard/performance-chart";
import Leaderboard from "@/components/layouts/Student/dashboard/leaderboard";
import ContinueLearning from "@/components/layouts/Student/dashboard/continue-learning";
import Deadlines from "@/components/layouts/Student/dashboard/deadlines";
import HistoryTable from "@/components/layouts/Student/dashboard/history-table";
import TargetScore from "@/components/layouts/Student/dashboard/target-score";

function formatDuration(ms: number) {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

type DeltaTone = "positive" | "negative" | "neutral";

function DeltaBadge({
  label,
  tone,
  icon: Icon,
}: {
  label: string;
  tone: DeltaTone;
  icon?: LucideIcon;
}) {
  return (
    <Badge
      className={cn(
        "rounded-full",
        tone === "positive" && "bg-green-100/90 text-green-700",
        tone === "negative" && "bg-amber-100/90 text-amber-700",
        tone === "neutral" && "bg-mocha-300/40 text-mocha-500"
      )}
    >
      {Icon ? <Icon /> : null}
      {label}
    </Badge>
  );
}

export default function DashboardOverviewPage() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;
  const { isAuthenticated } = useConvexAuth();

  const stats = useQuery(
    api.attempts.stats,
    userId && isAuthenticated ? {} : "skip"
  );
  const attempts = useQuery(
    api.attempts.listForUser,
    userId && isAuthenticated ? {} : "skip"
  );

  const loading = !userDetails || stats === undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="col-span-12 h-32 rounded-2xl sm:col-span-6 lg:col-span-3 xl:col-span-2"
            />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const statsData = stats!;
  const round = (value: number) => Math.round(value * 10) / 10;

  const avgDelta = round(statsData.avg - 75);
  const highestDelta = round(statsData.highest - statsData.avg);
  const lowestDelta = round(statsData.avg - statsData.lowest);
  const avgPerQuiz =
    statsData.taken > 0 ? statsData.totalTimeMs / statsData.taken : 0;

  const cards = [
    {
      label: "Quizzes Taken",
      value: String(statsData.taken),
      icon: HelpCircle,
      sub: "all-time submissions",
      delta: { label: "Recorded", tone: "neutral" as DeltaTone },
    },
    {
      label: "Average Score",
      value: `${statsData.avg}%`,
      icon: Trophy,
      sub: "overall",
      delta: {
        label: `${Math.abs(avgDelta)}% ${avgDelta >= 0 ? "over" : "below"} pass`,
        tone: (avgDelta >= 0 ? "positive" : "negative") as DeltaTone,
        icon: avgDelta >= 0 ? TrendingUp : TrendingDown,
      },
    },
    {
      label: "Highest",
      value: `${statsData.highest}%`,
      icon: TrendingUp,
      sub: "best result",
      delta: {
        label: `${Math.abs(highestDelta)}% vs avg`,
        tone: "positive" as DeltaTone,
        icon: TrendingUp,
      },
    },
    {
      label: "Lowest",
      value: `${statsData.lowest}%`,
      icon: TrendingDown,
      sub: "weakest score",
      delta: {
        label: `${Math.abs(lowestDelta)}% vs avg`,
        tone: "negative" as DeltaTone,
        icon: TrendingDown,
      },
    },
    {
      label: "Time Spent",
      value: formatDuration(statsData.totalTimeMs),
      icon: Clock3,
      sub: "on submissions",
      delta: {
        label: `${formatDuration(avgPerQuiz)} avg`,
        tone: "neutral" as DeltaTone,
      },
    },
    {
      label: "Certs Earned",
      value: String(statsData.certificationPassed),
      icon: Award,
      sub: "passed ≥ 75%",
      delta: {
        label: "Earned",
        tone: "positive" as DeltaTone,
        icon: Trophy,
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="rounded-full bg-mocha-300 text-mocha-500">
          Dashboard
        </Badge>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-mocha-500 md:text-3xl">
            Welcome back, {userDetails?.name?.split(" ")[0] ?? "Student"}
          </h1>
          <p className="mt-1 text-sm text-mocha-400">
            Track your progress, take quizzes and earn certificates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="col-span-12 rounded-2xl border border-mocha-300/60 bg-ivory-100 dark:bg-nero-marquina-200 p-5 shadow-sm sm:col-span-6 lg:col-span-3 xl:col-span-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mocha-300/40">
                <card.icon className="h-5 w-5 text-mocha-500" />
              </div>
              <DeltaBadge
                label={card.delta.label}
                tone={card.delta.tone}
                icon={card.delta.icon}
              />
            </div>
            <p className="mt-4 text-2xl font-black text-mocha-500">
              {card.value}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-mocha-400">
              {card.label}
            </p>
            <p className="mt-0.5 text-xs text-mocha-400/80">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-8">
          <PerformanceChart attempts={attempts ?? []} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Leaderboard />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-4">
          <TargetScore
            avg={statsData.avg}
            taken={statsData.taken}
            certificationPassed={statsData.certificationPassed}
            certAvg={statsData.certAvg}
          />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <ContinueLearning />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-4">
          <Deadlines />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <HistoryTable attempts={attempts ?? []} />
        </div>
      </div>
    </div>
  );
}