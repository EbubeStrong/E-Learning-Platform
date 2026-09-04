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
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
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
              <div className="min-w-[760px] px-5">
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
              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 px-2 py-5 sm:flex-row">
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, currentPage - 1))}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
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