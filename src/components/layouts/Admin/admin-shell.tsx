"use client";

import DashboardShell from "../DashboardShell";
import {
  GridIcon,
  UserCircleIcon,
  TaskIcon,
  ShootingStarIcon,
  PageIcon,
} from "@/icons/index";
import type { NavItem } from "@/types/navigation";

const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <UserCircleIcon />,
    name: "Users",
    path: "/admin/users",
  },
  {
    icon: <TaskIcon />,
    name: "Questions",
    path: "/admin/questions",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Rankings",
    path: "/admin/rankings",
  },
];

const adminOthersItems: NavItem[] = [
  {
    icon: <PageIcon />,
    name: "View Site",
    path: "/",
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      navItems={adminNavItems}
      othersItems={adminOthersItems}
    >
      {children}
    </DashboardShell>
  );
}