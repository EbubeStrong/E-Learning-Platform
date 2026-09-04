import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import StudentShell from "@/components/layouts/Student/student-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return <StudentShell>{children}</StudentShell>;
}
