"use client";
import { Logo } from "@/components/assets";
import NavBar from "./Navbar/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser, SignInButton, UserButton, } from "@clerk/nextjs";
import { isAdminEmail } from "@/lib/admin-emails";

export default function Header() {
    const { user, isLoaded } = useUser()
    const isInstanceAdmin = user?.publicMetadata?.role === "admin"
    const isOrgAdmin = (user?.organizationMemberships ?? []).some(
        (m) => m.role === "admin"
    )
    const isEmailAdmin =
        user?.emailAddresses?.some((e) => isAdminEmail(e.emailAddress)) ?? false
    const isAdmin = isInstanceAdmin || isOrgAdmin || isEmailAdmin

    if (!isLoaded) {
        return (
            <header className="bg-mocha-300 sticky top-0 z-50 flex w-full items-center justify-between border-b border-ivory-200 shadow-xl bg-opacity-90 gap-4 backdrop-blur-md p-1 pr-5 md:pr-15">
                <Link href="/">
                    <Logo alt="Logo" className="h-20 w-50 duration-300 hover:scale-90" />
                </Link>
                <NavBar />
            </header>
        );
    }
    return (
        <header className="bg-mocha-300 sticky top-0 z-50 flex w-full items-center justify-between border-b border-ivory-200 shadow-xl bg-opacity-90 gap-4 backdrop-blur-md p-1 pr-5 md:pr-15">

            {/* Logo */}
            <Link href="/">
                <Logo alt="Logo" className="h-20 w-50 duration-300 hover:scale-90" />
            </Link>

            {/* Navigation */}
            <NavBar />

            {/* User Actions - Authentication Button */}
            {/* <Button>
                Sign In
            </Button> */}
            <div className="flex gap-5 items-center">
                {isLoaded && isAdmin &&
                    <Link href="/admin">
                        <Button className="cursor-pointer text-white">
                            Admin
                        </Button>
                    </Link>
                }

                {isLoaded && user && !isAdmin &&
                    <Link href="/dashboard">
                        <Button className="cursor-pointer text-white">
                            Dashboard
                        </Button>
                    </Link>
                }

                {!user &&
                    <SignInButton mode="modal">
                        <Button className="cursor-pointer text-white">
                            Sign In
                        </Button>
                    </SignInButton>
                }

                <UserButton />
            </div>

        </header>
    )
}