"use client";

import { Badge } from "@/components/ui/badge";
import type { AttemptRow } from "@/types/quiz";

function fmtDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryTable({ attempts }: { attempts: AttemptRow[] }) {
  if (attempts.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl bg-mocha-200/60 text-sm text-mocha-400">
        No quiz attempts yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-mocha-300/60 bg-mocha-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mocha-300/50 text-xs uppercase tracking-wide text-mocha-400">
              <th className="px-4 py-3 font-semibold">Quiz</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mocha-300/40">
            {attempts.map((attempt) => (
              <tr key={String(attempt._id)} className="text-mocha-500">
                <td className="max-w-[16rem] truncate px-4 py-3 font-medium">
                  {attempt.quizTitle}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      attempt.quizType === "certification"
                        ? "rounded-full bg-mocha-500 text-mocha-100"
                        : "rounded-full bg-mocha-300/60 text-mocha-500"
                    }
                  >
                    {attempt.quizType}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-mocha-400">
                  {fmtDate(attempt.status === "submitted" ? attempt.submittedAt : attempt.startedAt)}
                </td>
                <td className="px-4 py-3 font-bold">
                  {attempt.status === "submitted" ? `${attempt.percent ?? 0}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  {attempt.status === "submitted" ? (
                    <span
                      className={`font-semibold ${
                        (attempt.percent ?? 0) >= (attempt.passThreshold ?? 0) ? "text-green-600" : "text-mocha-400"
                      }`}
                    >
                      Passed
                    </span>
                  ) : (
                    <span className="font-semibold text-mocha-400">In progress</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
