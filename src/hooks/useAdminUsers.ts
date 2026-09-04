"use client";

import { useCallback, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserDetails } from "@/lib/provider";
import type { AdminUser, AdminUsersState } from "@/types/user";

export function useAdminUsers(pageSize = 8): AdminUsersState {
  const { userDetails } = useUserDetails();
  const adminUserId = userDetails?._id;
  const [currentPage, setCurrentPage] = useState(1);

  const data = useQuery(
    api.users.listAdmin,
    adminUserId
      ? { limit: pageSize, offset: (currentPage - 1) * pageSize }
      : "skip"
  );

  const loading = !userDetails || data === undefined;

  const setPage = useCallback(
    (page: number) => {
      const totalPages = Math.max(
        Math.ceil((data?.total ?? 0) / pageSize),
        1
      );
      const next = Math.min(Math.max(page, 1), totalPages);
      if (next !== currentPage) setCurrentPage(next);
    },
    [data?.total, pageSize, currentPage]
  );

  return {
    users: (data?.users ?? []) as AdminUser[],
    total: data?.total ?? 0,
    currentPage,
    totalPages: Math.max(Math.ceil((data?.total ?? 0) / pageSize), 1),
    loading,
    error: null,
    setPage,
  };
}