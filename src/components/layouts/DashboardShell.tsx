"use client";

import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppHeader from "@/components/layouts/AppHeader";
import AppSidebar from "@/components/layouts/AppSidebar";
import Backdrop from "@/components/layouts/Backdrop";
import React from "react";
import type { NavItem } from "@/types/navigation";

function DashboardFrame({
  children,
  navItems,
  othersItems,
  contentClassName,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  othersItems: NavItem[];
  contentClassName: string;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="marble min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar and Backdrop */}
      <AppSidebar navItems={navItems} othersItems={othersItems} />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div
          className={`mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  navItems,
  othersItems = [],
  contentClassName = "bg-mocha-200 dark:bg-gray-900",
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  othersItems?: NavItem[];
  contentClassName?: string;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <DashboardFrame
          navItems={navItems}
          othersItems={othersItems}
          contentClassName={contentClassName}
        >
          {children}
        </DashboardFrame>
      </SidebarProvider>
    </ThemeProvider>
  );
}