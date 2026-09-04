"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { AttemptRow } from "@/types/quiz";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function PerformanceChart({
  attempts,
}: {
  attempts: AttemptRow[];
}) {
  const data = useMemo(() => {
    return [...attempts]
      .filter((attempt) => attempt.percent != null)
      .sort((attemptA, attemptB) => attemptA.startedAt - attemptB.startedAt)
      .slice(-15)
      .map((attempt) => ({
        x: new Date(attempt.startedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        y: attempt.percent as number,
      }));
  }, [attempts]);

  const series = [
    {
      name: "Score %",
      data,
    },
  ];

  const options = {
    chart: {
      type: "area" as const,
      toolbar: { show: false },
      fontFamily: "inherit",
      foreColor: "#8a716a",
    },
    colors: ["#5a3f38"],
    stroke: { curve: "smooth" as const, width: 3 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.35, opacityTo: 0.02 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      type: "category" as const,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      max: 100,
      min: 0,
      labels: { formatter: (v: number) => `${v}%` },
    },
    grid: { borderColor: "#e5d9d2" },
    tooltip: { y: { formatter: (v: number) => `${v}%` } },
  };

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl bg-mocha-200/60 text-sm text-mocha-400">
        No scores yet — take a quiz to see your performance.
      </div>
    );
  }

  return <Chart options={options} series={series} type="area" height={240} />;
}
