"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import type { AttemptRow } from "@/types/quiz";
import { Card, CardContent } from "@/components/ui/card";
import { useMarblePalette } from "./use-marble-palette";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function PerformanceChart({
  attempts,
}: {
  attempts: AttemptRow[];
}) {
  const palette = useMarblePalette();
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
      foreColor: palette.muted,
    },
    colors: [palette.ink],
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
    grid: { borderColor: palette.line },
    tooltip: { y: { formatter: (v: number) => `${v}%` } },
  };

  return (
    <Card className="rounded-2xl border-0 bg-mocha-100 ring-mocha-300/60">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-mocha-500">
            Performance over time
          </h2>
          <p className="text-sm text-mocha-400">
            Your scores across the last {Math.max(data.length, attempts.length)} attempts
          </p>
        </div>
        <Link
          href="/dashboard/quiz"
          className="shrink-0 text-xs font-semibold text-mocha-500 underline underline-offset-4 hover:text-mocha-400"
        >
          See all
        </Link>
      </div>
      <CardContent className="px-4">
        {data.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-mocha-200/60 text-sm text-mocha-400">
            No scores yet — take a quiz to see your performance.
          </div>
        ) : (
          <Chart options={options} series={series} type="area" height={240} />
        )}
      </CardContent>
    </Card>
  );
}