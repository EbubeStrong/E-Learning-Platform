"use client";

import dynamic from "next/dynamic";
import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMarblePalette } from "./use-marble-palette";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PASS_MARK = 75;

export default function TargetScore({
  avg,
  taken,
  certificationPassed,
  certAvg,
}: {
  avg: number;
  taken: number;
  certificationPassed: number;
  certAvg: number | null;
}) {
  const palette = useMarblePalette();
  const score = certAvg ?? avg;
  const rounded = Math.round(score);
  const gap = Math.abs(Math.round(score - PASS_MARK));

  const status =
    certAvg == null
      ? {
          label: "Not yet graded",
          tone: "text-mocha-400",
          sub: "Take a certification quiz to get a pass-track status.",
        }
      : score >= PASS_MARK
        ? { label: "On track", tone: "text-green-600", sub: "Certification average is at or above the pass mark." }
        : score >= 60
          ? { label: "Close", tone: "text-amber-600", sub: `${gap}% away from passing.` }
          : { label: "Off track", tone: "text-red-600", sub: `${gap}% below the pass mark.` };

  const options = {
    chart: {
      type: "radialBar" as const,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: [palette.ink],
    plotOptions: {
      radialBar: {
        hollow: { size: "62%" },
        track: { background: palette.track },
        dataLabels: {
          show: true,
          name: {
            show: true,
            fontSize: "12px",
            color: palette.muted,
            offsetY: 22,
          },
          value: {
            show: true,
            fontSize: "28px",
            fontWeight: 700,
            color: palette.ink,
            offsetY: -12,
            formatter: (value: number) => `${value}%`,
          },
        },
      },
    },
    stroke: { lineCap: "round" as const },
    labels: [certAvg != null ? "Certification avg" : "Average score"],
    tooltip: { enabled: false },
  };

  return (
    <Card className="rounded-2xl border-0 bg-ivory-100/30 dark:bg-nero-marquina-200 ring-mocha-300/60">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-mocha-500">Target score</h2>
          <p className="text-sm text-mocha-400">Progress vs the pass mark</p>
        </div>
        <Target className="h-5 w-5 text-mocha-400" />
      </div>
      <CardContent className="px-4">
        <Chart
          options={options}
          series={[rounded]}
          type="radialBar"
          height={230}
        />
      </CardContent>
      <div className="grid grid-cols-2 divide-x divide-mocha-300/50 border-t border-mocha-300/50 px-4 pt-3 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-mocha-400">
            Pass mark
          </p>
          <p className="mt-1 text-lg font-black text-mocha-500">
            {PASS_MARK}%
          </p>
        </div>
        <div className="pl-4">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", status.tone)}>
            {status.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-mocha-400">
            {taken > 0 && certificationPassed > 0
              ? `${certificationPassed} cert${certificationPassed > 1 ? "s" : ""} earned`
              : "No certs yet"}
          </p>
        </div>
      </div>
    </Card>
  );
}