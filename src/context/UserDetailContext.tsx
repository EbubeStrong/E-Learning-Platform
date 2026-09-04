"use client";

import { createContext } from "react";
import type { UserDetailContextType } from "@/types/context";

export const UserDetailContext = createContext<UserDetailContextType | null>(null);
