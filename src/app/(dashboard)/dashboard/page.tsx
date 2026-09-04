"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HelpCircle,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock3,
  Award,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import PerformanceChart from "@/components/layouts/Student/dashboard/performance-chart";
import Leaderboard from "@/components/layouts/Student/dashboard/leaderboard";
import ContinueLearning from "@/components/layouts/Student/dashboard/continue-learning";
import Deadlines from "@/components/layouts/Student/dashboard/deadlines";
import HistoryTable from "@/components/layouts/Student/dashboard/history-table";

function formatDuration(ms: number) {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function DashboardOverviewPage() {
  const { userDetails } = useUserDetails();
  const userId = userDetails?._id as Id<"users"> | undefined;

  const stats = useQuery(api.attempts.stats, userId ? { userId } : "skip");
  const attempts = useQuery(
    api.attempts.listForUser,
    userId ? { userId } : "skip"
  );

  const loading = !userDetails || stats === undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const statsData = stats!;

  const cards = [
    {
      label: "Quizzes Taken",
      value: String(statsData.taken),
      icon: HelpCircle,
      sub: "submitted",
    },
    {
      label: "Average Score",
      value: `${statsData.avg}%`,
      icon: Trophy,
      sub: "overall",
    },
    {
      label: "Highest",
      value: `${statsData.highest}%`,
      icon: TrendingUp,
      sub: "best result",
    },
    {
      label: "Lowest",
      value: `${statsData.lowest}%`,
      icon: TrendingDown,
      sub: "weakest score",
    },
    {
      label: "Time Spent",
      value: formatDuration(statsData.totalTimeMs),
      icon: Clock3,
      sub: "on submissions",
    },
    {
      label: "Certs Earned",
      value: String(statsData.certificationPassed),
      icon: Award,
      sub: "passed ≥ 75%",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3 rounded-full bg-mocha-300 text-mocha-500">
          Dashboard
        </Badge>
        <h1 className="text-2xl font-black tracking-tight text-mocha-500 md:text-3xl">
          Welcome back, {userDetails?.name?.split(" ")[0] ?? "Student"} 👋
        </h1>
        <p className="mt-1 text-sm text-mocha-400">
          Track your progress, take quizzes and earn certificates.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-mocha-300/60 bg-mocha-100 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-mocha-400">
              <card.icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-mocha-500">{card.value}</p>
            <p className="text-xs text-mocha-400">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-mocha-300/60 bg-mocha-100 p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-mocha-500">
            Performance over time
          </h2>
          <PerformanceChart attempts={attempts ?? []} />
        </div>
        <div className="rounded-3xl border border-mocha-300/60 bg-mocha-100 p-5">
          <h2 className="mb-4 text-lg font-bold text-mocha-500">Leaderboard</h2>
          <Leaderboard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-mocha-500">
            Continue learning
          </h2>
          <ContinueLearning />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-bold text-mocha-500">
            Upcoming deadlines
          </h2>
          <Deadlines />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-mocha-500">Quiz history</h2>
        <HistoryTable attempts={attempts ?? []} />
      </div>
    </div>
  );
}
