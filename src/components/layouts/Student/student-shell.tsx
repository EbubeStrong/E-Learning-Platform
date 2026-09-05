"use client";

import DashboardShell from "../DashboardShell";
import {
  GridIcon,
  TaskIcon,
  BoxCubeIcon,
  ShootingStarIcon,
  PageIcon,
} from "@/icons/index";
import type { NavItem } from "@/types/navigation";

const studentNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Overview",
    path: "/dashboard",
  },
  {
    icon: <TaskIcon />,
    name: "Quiz",
    path: "/dashboard/quiz",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Courses",
    path: "/dashboard/courses",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Certification",
    path: "/dashboard/certification",
  },
];

const studentOthersItems: NavItem[] = [
  {
    icon: <PageIcon />,
    name: "View Site",
    path: "/",
  },
];

export default function StudentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      navItems={studentNavItems}
      othersItems={studentOthersItems}
      contentClassName="bg-ivory-200 dark:bg-nero-marquina-300"
    >
      {children}
    </DashboardShell>
  );
}