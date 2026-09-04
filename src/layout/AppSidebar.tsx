"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PageIcon,
  UserCircleIcon,
  TaskIcon,
  ShootingStarIcon,
} from "../icons/index";
import { Logo } from "@/components/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/navigation";

const navItems: NavItem[] = [
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

const othersItems: NavItem[] = [
  {
    icon: <PageIcon />,
    name: "View Site",
    path: "/",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => {
        const isSubmenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;

        if (nav.subItems) {
          return (
            <li key={nav.name}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={cn(
                  "h-auto w-full rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(nav.path ?? "") ||
                    (isSubmenuOpen &&
                      nav.subItems.some((s) => isActive(s.path)))
                    ? "bg-mocha-200 text-gray-800 dark:bg-white/5 dark:text-white"
                    : "text-gray-700 hover:bg-mocha-200 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300",
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                )}
              >
                <span
                  className={cn(
                    isSubmenuOpen ||
                      (nav.subItems.some((s) => isActive(s.path)) &&
                        "text-gray-800 dark:text-white")
                  )}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="truncate">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={cn(
                      "ml-auto h-5 w-5 transition-transform duration-200",
                      isSubmenuOpen && "rotate-180"
                    )}
                  />
                )}
              </Button>

              {(isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: isSubmenuOpen
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                  }}
                >
                  <ul className="ml-4 mt-1 space-y-1">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.path}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium",
                            isActive(subItem.path)
                              ? "bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          )}
                        >
                          {subItem.name}
                          {subItem.new && (
                            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium uppercase text-primary">
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium uppercase text-primary">
                              pro
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        }

        return (
          nav.path && (
            <li key={nav.name}>
              <Button
                variant="ghost"
                nativeButton={false}
                render={
                  <Link href={nav.path} data-sidebar="link" />
                }
                className={cn(
                  "h-auto w-full rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(nav.path)
                    ? "bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300",
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                )}
              >
                <span
                  className={cn(
                    isActive(nav.path) &&
                      "text-gray-800 dark:text-white"
                  )}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="truncate">{nav.name}</span>
                )}
              </Button>
            </li>
          )
        );
      })}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted-path sync
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-mocha-100 dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 shadow-lg
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <Logo alt="Logo" width={150} height={40} />
          ) : (
            <Logo alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-gray-500 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 dark:text-gray-500 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
