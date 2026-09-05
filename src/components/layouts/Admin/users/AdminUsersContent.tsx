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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers } from "@/hooks/useAdminUsers";

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPageList(current: number, total: number): (number | "gap")[] {
  const candidates = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...candidates]
    .filter((page) => page >= 1 && page <= total)
    .sort((pageA, pageB) => pageA - pageB);

  const result: (number | "gap")[] = [];
  let prev = 0;
  for (const page of pages) {
    if (prev && page - prev > 1) result.push("gap");
    result.push(page);
    prev = page;
  }
  return result;
}

export default function AdminUsersContent() {
  const { users, loading, error, currentPage, totalPages, setPage } =
    useAdminUsers();

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Users
        </h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          Accounts registered on the platform.
        </p>
      </div>

      <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-lg">Accounts</CardTitle>
          <CardDescription>
            Real-time list of registered users on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-error-200 bg-error-50 p-8 text-center text-theme-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          ) : (
            <>
              <div className="hidden min-w-[760px] px-5 sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                        User
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Admin
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Member Since
                      </TableHead>
                      <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        Last Active
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={String(user._id)}>
                        <TableCell className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                              {user.imageUrl ? (
                                <AvatarImage
                                  src={user.imageUrl}
                                  alt={user.name}
                                />
                              ) : null}
                              <AvatarFallback>{getInitials(user.name) || "?"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {user.name}
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          {user.role === "admin" ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="outline">Member</Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {formatDate(user.joinedAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {formatDate(user.lastActiveAt ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="divide-y divide-gray-200 dark:divide-gray-800 sm:hidden">
                {users.map((user) => (
                  <li key={String(user._id)} className="flex items-start gap-3 px-5 py-4">
                    <Avatar className="size-10 shrink-0">
                      {user.imageUrl ? (
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(user.name) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {user.name}
                        </span>
                        {user.role === "admin" ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Member</Badge>
                        )}
                      </div>
                      <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                        <span>Since {formatDate(user.joinedAt)}</span>
                        <span aria-hidden>·</span>
                        <span>Active {formatDate(user.lastActiveAt ?? null)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 px-2 py-5 sm:flex-row">
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, currentPage - 1))}
                        />
                      </PaginationItem>
                      {getPageList(currentPage, totalPages).map((page, index) =>
                        page === "gap" ? (
                          <PaginationItem key={`gap-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage(Math.min(totalPages, currentPage + 1))
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}