"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttemptRow } from "@/types/quiz";

function fmtDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ attempt }: { attempt: AttemptRow }) {
  if (attempt.status !== "submitted" || attempt.percent == null) {
    return (
      <Badge className="rounded-full bg-mocha-300/50 text-mocha-500">
        In progress
      </Badge>
    );
  }
  const passed = attempt.percent >= (attempt.passThreshold ?? 0);
  return (
    <Badge
      className={
        passed
          ? "rounded-full bg-green-100/80 text-green-700"
          : "rounded-full bg-amber-100/80 text-amber-700"
      }
    >
      {passed ? "Passed" : "Failed"}
    </Badge>
  );
}

export default function HistoryTable({ attempts }: { attempts: AttemptRow[] }) {
  return (
    <Card className="rounded-2xl border-0 bg-ivory-100/30 dark:bg-nero-marquina-200 ring-mocha-300/60">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-mocha-500">Quiz history</h2>
          <p className="text-sm text-mocha-400">Your recent submissions</p>
        </div>
        <Badge className="rounded-full bg-mocha-300/50 text-mocha-500">
          {attempts.length} total
        </Badge>
      </div>
      <CardContent className="px-4">
        {attempts.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl bg-mocha-200/60 text-sm text-mocha-400">
            No quiz attempts yet.
          </div>
        ) : (
          <>
            <Table className="hidden text-left sm:table">
              <TableHeader>
                <TableRow className="border-mocha-300/50">
                  <TableHead className="px-4 py-3 font-semibold uppercase tracking-wide text-mocha-400">
                    Quiz
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold uppercase tracking-wide text-mocha-400">
                    Type
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold uppercase tracking-wide text-mocha-400">
                    Date
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold uppercase tracking-wide text-mocha-400">
                    Score
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold uppercase tracking-wide text-mocha-400">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-mocha-300/40">
                {attempts.map((attempt) => (
                  <TableRow key={String(attempt._id)} className="text-mocha-500">
                    <TableCell className="max-w-[16rem] truncate px-4 py-3.5 font-medium">
                      {attempt.quizTitle}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <Badge
                        className={
                          attempt.quizType === "certification"
                            ? "rounded-full bg-mocha-300 text-mocha-500"
                            : "rounded-full bg-mocha-300/60 text-mocha-500"
                        }
                      >
                        {attempt.quizType}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-mocha-400">
                      {fmtDate(
                        attempt.status === "submitted"
                          ? attempt.submittedAt
                          : attempt.startedAt
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 font-bold">
                      {attempt.status === "submitted"
                        ? `${attempt.percent ?? 0}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5">
                      <StatusBadge attempt={attempt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <ul className="divide-y divide-mocha-300/40 sm:hidden">
              {attempts.map((attempt) => (
                <li
                  key={String(attempt._id)}
                  className="flex items-center justify-between gap-3 px-1 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-mocha-500">
                      {attempt.quizTitle}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mocha-400">
                      <Badge
                        className={
                          attempt.quizType === "certification"
                            ? "rounded-full bg-mocha-300 text-mocha-500"
                            : "rounded-full bg-mocha-300/60 text-mocha-500"
                        }
                      >
                        {attempt.quizType}
                      </Badge>
                      <span>
                        {fmtDate(
                          attempt.status === "submitted"
                            ? attempt.submittedAt
                            : attempt.startedAt
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-mocha-500">
                      {attempt.status === "submitted"
                        ? `${attempt.percent ?? 0}%`
                        : "—"}
                    </span>
                    <StatusBadge attempt={attempt} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}