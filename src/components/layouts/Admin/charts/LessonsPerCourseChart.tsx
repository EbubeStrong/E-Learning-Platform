"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/context/ThemeContext";
import type { CourseOverview } from "@/types/course";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LessonsPerCourseChart({
  courses,
}: {
  courses: CourseOverview[];
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const options: ApexOptions = {
    colors: ["#bfa6a0"],
    chart: {
      fontFamily: "var(--font-sans), sans-serif",
      type: "bar",
      height: 620,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "35%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value: number) => String(value),
      offsetX: 8,
      style: {
        fontSize: "13px",
        fontWeight: 600,
        colors: [isDark ? "#98a2b3" : "#475467"],
      },
      dropShadow: { enabled: false },
    },
    xaxis: {
      categories: courses.map((course) => course.title),
      labels: {
        style: {
          fontSize: "14px",
          cssClass: "admin-chart-label",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "15px",
          cssClass: "admin-chart-label",
          fontFamily: "var(--font-sans), sans-serif",
        },
        offsetX: 4,
        offsetY: 2,
      },
    },
    grid: {
      strokeDashArray: 5,
      yaxis: { lines: { show: true } },
      padding: { left: 10, right: 16 },
    },
    legend: { show: false },
    tooltip: { theme: isDark ? "dark" : "light" },
  };

  const series = [
    {
      name: "Lessons",
      data: courses.map((course) => course.videoCount),
    },
  ];

  return (
    <Card className="border border-gray-200 bg-mocha-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-lg">Lessons per course</CardTitle>
        <CardDescription>Video lessons in each playlist</CardDescription>
      </CardHeader>
      <CardContent>
        <ReactApexChart options={options} series={series} type="bar" height={360} />
      </CardContent>
    </Card>
  );
}