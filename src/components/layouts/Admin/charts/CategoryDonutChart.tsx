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

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// const PALETTE = ["#bfa6a0", "#d8cfc4", "#e8d8cd", "#f5f5dc"];

export default function CategoryChart({
  categories,
}: {
  categories: { name: string; count: number }[];
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const options: ApexOptions = {
    chart: {
      fontFamily: "var(--font-sans), sans-serif",
      type: "donut",
      height: 320,
    },
    // colors: PALETTE.slice(0, categories.length),
    labels: categories.map((category) => category.name),
    legend: {
      position: "bottom",
      fontSize: "13px",
      markers: { size: 6 },
      itemMargin: { horizontal: 10 },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 260 },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  total: { fontSize: "18px" },
                },
              },
            },
          },
          legend: { fontSize: "12px" },
        },
      },
    ],
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Courses",
              fontSize: "24px",
              color: "currentColor",
            },
          },
        },
      },
    },
    stroke: { width: 3, colors: [isDark ? "#242b2e" : "#f5f5dc"] },
  };

  const series = categories.map((category) => category.count);

  return (
    <Card className="border border-gray-200 bg-ivory-100/50 h-fit dark:border-nero-marquina-100 dark:bg-nero-marquina-200">
      <CardHeader>
        <CardTitle className="text-lg">Courses by category</CardTitle>
        <CardDescription>Distribution across topic areas</CardDescription>
      </CardHeader>
      <CardContent>
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={320}
        />
      </CardContent>
    </Card>
  );
}