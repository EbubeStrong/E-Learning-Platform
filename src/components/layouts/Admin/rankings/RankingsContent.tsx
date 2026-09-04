"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RankingsContent() {
  const { userDetails } = useUserDetails();
  const adminUserId = userDetails?._id;
  const rows = useQuery(
    api.analytics.adminLeaderboard,
    adminUserId ? { adminUserId } : "skip"
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Global rankings
        </h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Certification performance across all students.
        </p>
      </div>

      <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-lg">Leaderboard</CardTitle>
          <CardDescription>
            Ranked by average certification score; admins see full attempt and
            certificate detail.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows === undefined ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-mocha-300/50 bg-mocha-200/40 p-10 text-center text-theme-sm text-mocha-400">
              No certification attempts yet. Rankings will appear once students
              submit certification quizzes.
            </div>
          ) : (
            <div className="min-w-[720px] px-5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Rank
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Student
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Avg Score
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Best
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Attempts
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Certificates
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={row.userId} className="hover:bg-mocha-200 dark:hover:bg-white/5">
                      <TableCell className="px-5 py-4 sm:px-6">
                        <Badge
                          variant={i < 3 ? "default" : "outline"}
                          className={i < 3 ? "rounded-full" : "rounded-full"}
                        >
                          {i + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            {row.avatar ? (
                              <AvatarImage src={row.avatar} alt={row.name} />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(row.name) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {row.name}
                            </span>
                            {row.email ? (
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {row.email}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm font-bold text-gray-800 dark:text-white/90">
                        {row.average}%
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {row.best}%
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {row.attempts}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-theme-sm">
                        <Badge variant="outline">{row.certificates}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}