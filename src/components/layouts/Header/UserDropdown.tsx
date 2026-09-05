"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserDropdown() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = user?.fullName ?? user?.username ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex h-11 items-center text-gray-700 outline-none dark:text-gray-400"
          >
            <Avatar className="mr-3">
              {isLoaded && user?.imageUrl ? (
                <AvatarImage src={user.imageUrl} alt="User"/>
              ) : (
                <AvatarFallback>{initials || "?"}</AvatarFallback>
              )}
            </Avatar>
            <span className="mr-1 hidden font-medium text-theme-sm sm:block">
              {displayName}
            </span>
            <ChevronDown
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        }
      />

      <DropdownMenuContent
        align="start"
        className="mt-1 w-[260px] p-1.5 z-[9999] bg-[var(--calacatta-100)] text-[var(--calacatta-800)] border-[var(--calacatta-300)] dark:bg-[var(--nero-800)] dark:text-[var(--nero-100)] dark:border-[var(--nero-500)]"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/courses" className="flex items-center gap-3">
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0786 5.75C10.4529 5.75 9.93244 6.25187 10.0754 6.86137L12.3466 16.4352C12.459 17.0115 13.0486 17.342 13.5877 17.102L16.9275 15.6869C17.0009 15.6538 17.0643 15.6011 17.1104 15.5347C17.434 15.082 17.2043 14.4166 16.6766 14.2905L11.9445 13.1807C11.6912 13.1193 11.5135 12.8851 11.5135 12.6252V6.60519C11.5135 6.13799 11.1833 5.75 10.7518 5.75C10.5137 5.75 10.2865 5.86967 10.0754 5.75H11.0786ZM8.5 13.9244C8.01348 15.0786 6.90609 15.8505 5.66667 15.8505H5.53419C5.09474 15.8505 4.75 16.1774 4.75 16.6183V18.1884C5.37203 18.8033 5.79966 19.0045 6.14626 19.1163C8.46172 19.8564 11.343 19.1202 13.5869 17.8694C14.0108 17.6437 13.9074 16.9334 13.4774 16.8666C11.5151 16.8436 9.67015 15.7807 8.5 13.9244Z"
                  fill=""
                />
              </svg>
              My courses
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link href="/" className="flex items-center gap-3">
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.75 5.5C3.33579 5.5 3 5.83579 3 6.25V17.75C3 18.1642 3.33579 18.5 3.75 18.5H20.25C20.6642 18.5 21 18.1642 21 17.75V6.25C21 5.83579 20.6642 5.5 20.25 5.5H3.75ZM12 7L9 13H15L12 7ZM12 15.25C10.2744 15.25 8.75 14.0148 8.75 12.5C8.75 10.9852 10.2744 9.75 12 9.75C13.7256 9.75 15.25 10.9852 15.25 12.5C15.25 14.0148 13.7256 15.25 12 15.25ZM12 13.75C12.9665 13.75 13.75 13.1904 13.75 12.5C13.75 11.8096 12.9665 11.25 12 11.25C11.0335 11.25 10.25 11.8096 10.25 12.5C10.25 13.1904 11.0335 13.75 12 13.75Z"
                  fill=""
                />
              </svg>
              Visit homepage
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          nativeButton
          onClick={() => void handleSignOut()}
          render={
            <Button
              type="button"
              variant="ghost"
              className="flex w-full items-center justify-start gap-3"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 17.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                  fill=""
                />
              </svg>
              Sign out
            </Button>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}