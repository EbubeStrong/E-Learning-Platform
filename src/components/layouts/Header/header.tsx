"use client";
import { useState } from "react";
import { Logo } from "@/components/assets";
import NavBar from "./Navbar/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { isAdminEmail } from "@/lib/admin-emails";
import { navigation } from "@/lib/data/site/navigation";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const logoClass =
  "h-14 w-32 sm:h-16 sm:w-40 duration-300 hover:scale-90";

export default function Header() {
  const { user, isLoaded } = useUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isInstanceAdmin = user?.publicMetadata?.role === "admin";
  const isOrgAdmin = (user?.organizationMemberships ?? []).some(
    (membership) => membership.role === "admin"
  );
  const isEmailAdmin =
    user?.emailAddresses?.some((email) => isAdminEmail(email.emailAddress)) ?? false;
  const isAdmin = isInstanceAdmin || isOrgAdmin || isEmailAdmin;

  const actions = (
    <div className="flex items-center gap-2 md:gap-5">
      {isLoaded && isAdmin && (
        <Link href="/admin">
          <Button className="cursor-pointer text-white">Admin</Button>
        </Link>
      )}

      {isLoaded && user && !isAdmin && (
        <Link href="/dashboard">
          <Button className="cursor-pointer text-white">Dashboard</Button>
        </Link>
      )}

      {!user && (
        <SignInButton mode="modal">
          <Button className="cursor-pointer text-white">Sign In</Button>
        </SignInButton>
      )}

      <UserButton />
    </div>
  );

  const closeSheet = () => setSheetOpen(false);

  return (
    <header className="bg-mocha-300 sticky top-0 z-50 flex w-full items-center justify-between border-b border-ivory-200 shadow-xl bg-opacity-90 gap-2 sm:gap-4 backdrop-blur-md px-3 py-1 md:px-2 md:pr-15">
      <Link href="/">
        <Logo alt="Logo" className={logoClass} />
      </Link>

      <div className="hidden md:block flex-1 px-2">
        <NavBar />
      </div>

      <div className="hidden md:flex">{actions}</div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-mocha-500"
          onClick={() => setSheetOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <SheetContent
          side="right"
          className="bg-mocha-300 border-ivory-200 text-ivory-200"
        >
          <SheetHeader className="border-b border-ivory-200 pb-4">
            <SheetTitle>
              <Logo alt="Logo" className={logoClass} />
            </SheetTitle>
          </SheetHeader>

          <nav className="mt-2 flex flex-1 flex-col gap-1 px-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSheet}
                className="rounded-lg px-3 py-2.5 text-base font-semibold text-ivory-200 transition-colors hover:bg-mocha-500/20 hover:text-mocha-500"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <SheetFooter className="mt-3 border-t border-ivory-200">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isLoaded && isAdmin && (
                  <Link href="/admin" onClick={closeSheet} className="block">
                    <Button className="w-full cursor-pointer text-white sm:w-auto">
                      Admin
                    </Button>
                  </Link>
                )}
                {isLoaded && user && !isAdmin && (
                  <Link
                    href="/dashboard"
                    onClick={closeSheet}
                    className="block"
                  >
                    <Button className="w-full cursor-pointer text-white sm:w-auto">
                      Dashboard
                    </Button>
                  </Link>
                )}
                {!user && (
                  <SignInButton mode="modal">
                    <Button className="w-full cursor-pointer text-white sm:w-auto">
                      Sign In
                    </Button>
                  </SignInButton>
                )}
              </div>
              <UserButton />
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </header>
  );
}