import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { WeeklyTrends } from "@/components/WeeklyTrends";
import { localDateKey, recordDay } from "@/lib/weekly";
import type { DailyState } from "@/lib/daily";
import type { Prefs } from "@/lib/prefs";

const prefs: Prefs = { name: "Sagar", avatar: "🦊", email: "sagar@example.com", waterGoal: 2000, sleepGoal: 8 };
const daily: DailyState = { date: localDateKey(), waterMl: 0, syncOn: false, sleepHours: null, sleepQuality: null };

describe("WeeklyTrends screen-reader summary", () => {
  beforeEach(() => localStorage.clear());

  it("announces unavailable metrics when nothing is logged", () => {
    render(<WeeklyTrends daily={daily} prefs={prefs} />);
    const summary = screen.getByText(/Weekly Water average:/, { selector: "p.sr-only" });
    expect(summary).toHaveTextContent("Weekly Water average: not available across 0 logged days. Goal met on 0 of 7 days. Goal streak: 0 days. Comparison with last week unavailable.");
  });

  it("announces the average, goal attainment and streak for logged days", () => {
    const today = localDateKey();
    recordDay({ date: today, waterMl: 2500, sleepHours: 8 });
    render(<WeeklyTrends daily={{ ...daily, waterMl: 2500 }} prefs={prefs} />);
    const summary = screen.getByText(/Weekly Water average:/, { selector: "p.sr-only" });
    expect(summary).toHaveTextContent("Weekly Water average: 2.5L per day across 1 logged day. Goal met on 1 of 7 days. Goal streak: 1 day.");
  });

  it("exposes the chart as an image with a per-day description", () => {
    render(<WeeklyTrends daily={daily} prefs={prefs} />);
    expect(screen.getByRole("img", { name: /Water over seven days/ })).toBeInTheDocument();
  });
});
