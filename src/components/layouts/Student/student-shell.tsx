"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  HelpCircle,
  BookOpenText,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/assets";
import { useUserDetails } from "@/lib/provider";
import { useClerk } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpenText },
  { href: "/dashboard/certification", label: "Certification", icon: Award },
];

export default function StudentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { userDetails } = useUserDetails();
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen w-full bg-ivory-200">
      <aside
        className={cn(
          "sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-mocha-300/60 bg-mocha-100 transition-all duration-300",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div className="flex h-20 items-center gap-2 border-b border-mocha-300/50 px-4">
          <Link href="/" className="shrink-0">
            <Logo alt="Quizora" className={cn("h-12 w-auto transition-all", collapsed && "h-9")} />
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="ml-auto text-mocha-400 hover:text-mocha-500"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-end px-2 py-2">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="text-mocha-400 hover:text-mocha-500"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-mocha-500 text-mocha-100"
                    : "text-mocha-400 hover:bg-mocha-300/40 hover:text-mocha-500",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-mocha-300/50 p-3">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mocha-300/40 text-sm font-bold text-mocha-500">
              {userDetails?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userDetails.imageUrl}
                  alt={userDetails.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                userDetails?.name?.charAt(0) ?? "U"
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-mocha-500">
                  {userDetails?.name ?? "Student"}
                </p>
                <p className="truncate text-xs text-mocha-400">{userDetails?.email}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className={cn(
              "mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-mocha-400 transition-colors hover:bg-mocha-300/40 hover:text-mocha-500",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-6 py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
