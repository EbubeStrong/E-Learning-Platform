import { NextResponse } from "next/server";
import { fetchUdemyAuthor } from "@/lib/courses/tutors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing author id" },
      { status: 400 }
    );
  }

  const tutor = await fetchUdemyAuthor(id);
  return NextResponse.json({ tutor });
}
