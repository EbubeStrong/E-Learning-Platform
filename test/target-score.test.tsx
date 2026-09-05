// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TargetScore from "@/components/layouts/Student/dashboard/target-score";

vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
}));

vi.mock("react-apexcharts", () => ({
  default: () => <div data-testid="chart" />,
}));

function renderTarget(overrides: Partial<Parameters<typeof TargetScore>[0]> = {}) {
  const props = {
    avg: 50,
    taken: 0,
    certificationPassed: 0,
    certAvg: null as number | null,
    ...overrides,
  };
  return render(<TargetScore {...props} />);
}

describe("TargetScore", () => {
  it("shows a neutral state before any certification attempt is graded", () => {
    renderTarget({ taken: 3, certificationPassed: 0 });
    const status = screen.getByText("Not yet graded");
    expect(status.className).toContain("text-mocha-400");
  });

  it("shows green On track when the certification average is at or above 75", () => {
    renderTarget({ certAvg: 85, certificationPassed: 1, taken: 2 });
    const status = screen.getByText("On track");
    expect(status.className).toContain("text-green-600");
    expect(screen.getByText("1 cert earned")).toBeInTheDocument();
  });

  it("shows amber Close when the certification average is between 60 and 74", () => {
    renderTarget({ certAvg: 70, taken: 1 });
    const status = screen.getByText("Close");
    expect(status.className).toContain("text-amber-600");
  });

  it("shows red Off track when the certification average is below 60", () => {
    renderTarget({ certAvg: 40, taken: 1 });
    const status = screen.getByText("Off track");
    expect(status.className).toContain("text-red-600");
  });

  it("stays neutral even when the all-time average is high but no certification attempt exists", () => {
    renderTarget({ avg: 90, certificationPassed: 0 });
    const status = screen.getByText("Not yet graded");
    expect(status.className).toContain("text-mocha-400");
    expect(screen.queryByText("On track")).not.toBeInTheDocument();
  });

  it("renders the pass mark alongside the score", () => {
    renderTarget({ certAvg: 75, certificationPassed: 2, taken: 2 });
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("2 certs earned")).toBeInTheDocument();
  });

  it("shows No certs yet when nothing has been passed", () => {
    renderTarget({ certAvg: 80, certificationPassed: 0, taken: 0 });
    expect(screen.getByText("No certs yet")).toBeInTheDocument();
  });
});