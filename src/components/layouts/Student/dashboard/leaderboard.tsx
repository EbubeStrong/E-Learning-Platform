"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export default function Leaderboard() {
  const rows = useQuery(api.ranking.leaderboard, { limit: 8 });

  if (rows === undefined) {
    return (
      <Card className="rounded-2xl border-0 bg-calacatta-marble-100 dark:bg-nero-marquina-200 ring-mocha-300/60">
        <div className="px-4 pt-4">
          <h2 className="text-lg font-bold text-mocha-500">Leaderboard</h2>
          <p className="text-sm text-mocha-400">Top performers this term</p>
        </div>
        <CardContent className="space-y-2 px-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-11 rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl h-full border-0 bg-ivory-100/30 dark:bg-nero-marquina-200 ring-mocha-300/60">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-mocha-500">Leaderboard</h2>
          <p className="text-sm text-mocha-400">Top performers this term</p>
        </div>
      </div>
      <CardContent className="px-4">
        {rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-mocha-200/60 text-sm text-mocha-400">
            No rankings yet.
          </div>
        ) : (
          <ol className="divide-y divide-mocha-300/40">
            {rows.map((row, index) => (
              <li
                key={row.userId}
                className="flex items-center gap-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    index === 0
                      ? "bg-amber-300 text-amber-900"
                      : index === 1
                        ? "bg-mocha-300 text-mocha-500"
                        : index === 2
                          ? "bg-amber-700/70 text-white"
                          : "bg-mocha-300/60 text-mocha-400"
                  )}
                >
                  {index + 1}
                </span>
                <Avatar size="default" className="size-9 bg-mocha-300/40">
                  {row.avatar ? (
                    <AvatarImage src={row.avatar} alt={row.name} />
                  ) : null}
                  <AvatarFallback className="bg-transparent text-xs font-semibold text-mocha-500">
                    {row.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-mocha-500">
                    {row.name}
                  </p>
                  <p className="text-xs text-mocha-400">
                    {row.attempts} {row.attempts === 1 ? "attempt" : "attempts"}
                  </p>
                </div>
                <div className="hidden w-24 sm:block">
                  <Progress value={Math.round(row.average)} className="h-2 w-full" />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-black text-mocha-500">
                  {row.average}%
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}