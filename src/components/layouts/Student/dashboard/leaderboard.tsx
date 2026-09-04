"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const rows = useQuery(api.ranking.leaderboard, { limit: 8 });

  if (rows === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-mocha-200/60 text-sm text-mocha-400">
        No rankings yet.
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {rows.map((row, i) => (
        <li
          key={row.userId}
          className="flex items-center gap-3 rounded-xl bg-mocha-200/50 px-3 py-2"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i === 0
                ? "bg-yellow-400 text-mocha-500"
                : i === 1
                  ? "bg-mocha-300 text-mocha-500"
                  : i === 2
                    ? "bg-amber-700/70 text-white"
                    : "bg-mocha-300/60 text-mocha-400"
            }`}
          >
            {i + 1}
          </span>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mocha-300/40 text-xs font-semibold text-mocha-500">
            {row.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.avatar}
                alt={row.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              row.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-mocha-500">
              {row.name}
            </p>
            <p className="text-xs text-mocha-400">
              {row.attempts} {row.attempts === 1 ? "attempt" : "attempts"}
            </p>
          </div>
          <span className="text-sm font-black text-mocha-500">
            {row.average}%
          </span>
        </li>
      ))}
    </ol>
  );
}
