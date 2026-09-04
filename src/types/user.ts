import type { Id } from "../../convex/_generated/dataModel";

export type UserDetails = {
  _id: Id<"users">;
  clerkUserId: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: "student" | "admin";
  joinedAt: number;
};

export interface AdminUser {
  _id: Id<"users">;
  name: string;
  email: string;
  imageUrl?: string;
  role: "student" | "admin";
  joinedAt: number;
  lastActiveAt?: number;
}

export interface AdminUsersState {
  users: AdminUser[];
  total: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
}

export interface AdminSession {
  userId: string;
  isInstanceAdmin: boolean;
  isOrgAdmin: boolean;
  isEmailAdmin: boolean;
}
