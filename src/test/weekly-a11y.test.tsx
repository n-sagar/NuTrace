import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { WeeklyTrends } from "@/components/WeeklyTrends";
import { localDateKey, recordDay } from "@/lib/weekly";
import type { DailyState } from "@/lib/daily";
import type { Prefs } from "@/lib/prefs";

const prefs: Prefs = { name: "Sagar", avatar: "🦊", email: "sagar@example.com", waterGoal: 2000, sleepGoal: 8 };
const daily: DailyState = { date: localDateKey(), waterMl: 0, syncOn: false, sleepHours: null, sleepQuality: null };

describe("WeeklyTrends screen-reader summary", () => {
  beforeEach(() => localStorage.clear());

  it("announces zero progress and no comparison when nothing is logged", () => {
    render(<WeeklyTrends daily={daily} prefs={prefs} />);
    const summary = screen.getByText(/Weekly Water average:/, { selector: "p.sr-only" });
    expect(summary).toHaveTextContent("Weekly Water average: 0.0L per day across 1 logged day. Goal met on 0 of 7 days. Goal streak: 0 days. Comparison with last week unavailable.");
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

  it("provides a hidden data table with one row per day for the active metric", () => {
    const today = localDateKey();
    recordDay({ date: today, waterMl: 2500, sleepHours: 8 });
    render(<WeeklyTrends daily={{ ...daily, waterMl: 2500 }} prefs={prefs} />);
    const table = screen.getByRole("table", { name: /Water log for the past 7 days/ });
    expect(table).toHaveClass("sr-only");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(8); // header + 7 days
    expect(within(table).getByRole("cell", { name: "2.5L" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Met" })).toBeInTheDocument();
    expect(within(table).getAllByRole("cell", { name: "Not logged" })).toHaveLength(6);
  });

  it("switches the hidden data table to sleep values with the sleep tab", () => {
    const today = localDateKey();
    recordDay({ date: today, waterMl: 2500, sleepHours: 8 });
    render(<WeeklyTrends daily={{ ...daily, sleepHours: 8 }} prefs={prefs} />);
    const sleepTab = screen.getByRole("tab", { name: /Sleep/ });
    fireEvent.mouseDown(sleepTab);
    fireEvent.click(sleepTab);
    const table = screen.getByRole("table", { name: /Sleep log for the past 7 days/ });
    expect(within(table).getByRole("cell", { name: "8h" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Met" })).toBeInTheDocument();
  });

  it("shows the selected day's breakdown below the weekly average when a bar is focused", () => {
    const today = localDateKey();
    recordDay({ date: today, waterMl: 2500, sleepHours: 8 });
    render(<WeeklyTrends daily={{ ...daily, waterMl: 2500 }} prefs={prefs} />);
    expect(screen.getByText(/Tap, hover or focus a bar/)).toBeInTheDocument();
    fireEvent.focus(screen.getByRole("group", { name: /Water bars/ }));
    const readout = screen.getByText(/^Selected:/);
    expect(readout).toHaveTextContent("2.5L / 2L (Goal met)");
  });

  it("renders the wind-down insight empty state as a card with paired-night progress", () => {
    render(<WeeklyTrends daily={daily} prefs={prefs} />);
    expect(screen.getByText("Not enough paired logs yet")).toBeInTheDocument();
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "0");
    for (const bar of bars) expect(bar).toHaveAttribute("aria-valuetext", "0 of 2 paired nights logged");
  });

  it("updates longer-evening paired-night progress from zero to one to two using saved logs", () => {
    const date = (offset: number) => {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      return localDateKey(day);
    };
    render(<WeeklyTrends daily={daily} prefs={prefs} />);
    const ring = screen.getByRole("progressbar", { name: "15+ min wind-down evenings" });
    expect(ring).toHaveAttribute("aria-valuenow", "0");
    act(() => recordDay({ date: date(-4), waterMl: 0, sleepHours: null, windDownMinutes: 15 }));
    // An evening alone is not a paired night.
    expect(ring).toHaveAttribute("aria-valuenow", "0");
    act(() => recordDay({ date: date(-3), waterMl: 0, sleepHours: 8, windDownMinutes: 30 }));
    expect(ring).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("1 / 2", { exact: false })).toHaveTextContent("1 / 2 paired nights logged");
    act(() => recordDay({ date: date(-2), waterMl: 0, sleepHours: 8.5 }));
    expect(ring).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("progressbar", { name: "Shorter logged evenings" })).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows the wind-down insight as a plain headline with one supporting line and no statistical jargon", () => {
    const date = (offset: number) => {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      return localDateKey(day);
    };
    // Three long wind-down nights each followed by 8h sleep, two shorter nights each followed by 6.75h.
    recordDay({ date: date(-7), waterMl: 0, sleepHours: null, windDownMinutes: 20 });
    recordDay({ date: date(-6), waterMl: 0, sleepHours: 8, windDownMinutes: 20 });
    recordDay({ date: date(-5), waterMl: 0, sleepHours: 8, windDownMinutes: 20 });
    recordDay({ date: date(-4), waterMl: 0, sleepHours: 8, windDownMinutes: 5 });
    recordDay({ date: date(-3), waterMl: 0, sleepHours: 6.75, windDownMinutes: 5 });
    recordDay({ date: date(-2), waterMl: 0, sleepHours: 6.75, windDownMinutes: 5 });
    render(<WeeklyTrends daily={daily} prefs={prefs} />);
    expect(screen.getByText("You average +75 min more sleep on nights with a 15+ min wind-down.")).toBeInTheDocument();
    expect(screen.getByText("Based on 3 long wind-down nights vs. 2 shorter nights (early trend — keep logging to refine).")).toBeInTheDocument();
    expect(screen.getByText("Simulated sync values excluded.")).toBeInTheDocument();
    expect(screen.queryByText(/Association, not causation/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not statistical significance/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Low confidence/)).not.toBeInTheDocument();
  });
});
