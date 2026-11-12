import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/dashboard";
import { createDemoData } from "@/lib/demo";
import { dailySnapshot, loadDaily, saveDaily } from "@/lib/daily";
import { savePrefs, defaultPrefs } from "@/lib/prefs";
import { summarizeWeek, windDownInsight } from "@/lib/weekly";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tanstack/react-router")>(),
  useNavigate: () => vi.fn(),
}));

describe("Isolated populated dashboard demo", () => {
  beforeEach(() => localStorage.clear());

  it("provides seven local days of every metric and a 1.50L daily total toward 2L", () => {
    const now = new Date(2026, 10, 12, 12);
    const demo = createDemoData(now);
    expect(demo.daily.waterMl).toBe(1500);
    expect(demo.prefs.waterGoal).toBe(2000);
    expect(demo.daily.waterMl / demo.prefs.waterGoal).toBe(0.75);
    for (const mode of ["water", "sleep", "windDown"] as const) {
      const summary = summarizeWeek(demo.history, dailySnapshot(demo.daily), mode, 0, now);
      expect(summary.loggedDays).toBe(7);
      expect(summary.days.map((day) => day.date)).toEqual([
        "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12",
      ]);
    }
  });

  it("unlocks both paired-night groups with actual next-day sample pairs", () => {
    const now = new Date(2026, 10, 12, 12);
    const demo = createDemoData(now);
    const insight = windDownInsight(demo.history, dailySnapshot(demo.daily), now);
    expect(insight.longerCount).toBe(4);
    expect(insight.shorterCount).toBe(2);
    expect(insight.differenceMinutes).toBe(68);
  });

  it("keeps demo additions out of saved logs and restores live progress and preferences", async () => {
    savePrefs({ ...defaultPrefs(), name: "Live tester", waterGoal: 2650, sleepGoal: 8.5 });
    saveDaily({ ...loadDaily(), waterMl: 500, sleepHours: 7.5 });
    const before = { ...localStorage };
    const Component = Route.options.component;
    if (!Component) throw new Error("Dashboard component missing");
    render(<Component />);
    fireEvent.click(await screen.findByRole("button", { name: "Populated Demo" }));
    expect(screen.getByText("1.50L of 2L goal")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "15+ min wind-down evenings" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("progressbar", { name: "Shorter logged evenings" })).toHaveAttribute("aria-valuenow", "2");
    fireEvent.click(screen.getByRole("button", { name: "+500ml" }));
    await waitFor(() => expect(screen.getByText("2.00L of 2L goal")).toBeInTheDocument());
    expect({ ...localStorage }).toEqual(before);
    fireEvent.click(screen.getByRole("button", { name: "Live User" }));
    expect(screen.getByText("0.50L of 2.65L goal")).toBeInTheDocument();
    expect(loadDaily().sleepHours).toBe(7.5);
    expect({ ...localStorage }).toEqual(before);
  });
});