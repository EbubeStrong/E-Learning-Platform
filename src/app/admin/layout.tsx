import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminShell from "@/components/layouts/Admin/admin-shell";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const session = await getAdminSession();
  if (!session) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}