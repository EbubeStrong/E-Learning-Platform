"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CourseOverview } from "@/types/course";
import { getCourseAccent } from "@/lib/course-accent";

export default function CourseInventoryTable({
  courses,
}: {
  courses: CourseOverview[];
}) {
  return (
    <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-lg">Course inventory</CardTitle>
        <CardDescription>
          All playlists powering the /courses catalog
        </CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <div className="min-w-[760px] px-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Course
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Category
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Level
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Lessons
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="hover:bg-mocha-200 dark:hover:bg-white/5">
                  <TableCell className="px-5 py-4 sm:px-6">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${getCourseAccent(course.category)} text-white font-semibold`}
                      >
                        {course.title.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white/90 group-hover:text-brand-500 ">
                        {course.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {course.category}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm">
                    <Badge variant="outline">{course.level}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {course.videoCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}