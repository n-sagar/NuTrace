import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { HISTORY_KEY, loadHistory, localDateKey, recordDay, subscribeHistory, summarizeWeek, weekDates, type DaySnapshot } from "@/lib/weekly";
import { loadDaily, saveDaily } from "@/lib/daily";
import { clearSession, defaultPrefs, savePrefs } from "@/lib/prefs";

const today: DaySnapshot = { date: "2026-10-22", waterMl: 2500, sleepHours: 8.5 };
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 22, 12));
});
afterEach(() => vi.useRealTimers());

describe("Seven-day history", () => {
  it("uses seven local calendar days ending today", () => {
    expect(weekDates()).toEqual(["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"]);
    expect(localDateKey(new Date(2026, 9, 22, 0, 1))).toBe("2026-10-22");
  });
  it("persists exact daily totals and replaces, rather than duplicates, today's record", () => {
    saveDaily({ ...loadDaily(), waterMl: 2650, sleepHours: 8.5 });
    saveDaily({ ...loadDaily(), waterMl: 2900 });
    expect(loadHistory()).toEqual([{ date: "2026-10-22", waterMl: 2900, sleepHours: 8.5 }]);
  });
  it("archives the previous day when daily storage rolls over at local midnight", () => {
    localStorage.setItem("nutrace.daily", JSON.stringify({ date: "2026-10-21", waterMl: 2250, sleepHours: 7.5, sleepQuality: "okay", syncOn: false }));
    expect(loadDaily()).toMatchObject({ date: "2026-10-22", waterMl: 0, sleepHours: null });
    expect(loadHistory()).toEqual([{ date: "2026-10-21", waterMl: 2250, sleepHours: 7.5 }]);
  });
  it("retains fourteen days for current and previous week comparisons", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ ...today, date: "2026-10-08" }, { ...today, date: "2026-10-09" }, { ...today, date: "2026-10-15" }, { ...today, date: "2026-10-16" }]));
    recordDay(today);
    expect(loadHistory().map((day) => day.date)).toEqual(["2026-10-09", "2026-10-15", "2026-10-16", "2026-10-22"]);
  });
  it("ignores invalid history without breaking the chart", () => {
    localStorage.setItem(HISTORY_KEY, "invalid");
    expect(loadHistory()).toEqual([]);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([null, { date: "invalid", waterMl: 2 }, { ...today, waterMl: -1 }, today]));
    expect(loadHistory()).toEqual([today]);
  });
  it("clears history on logout", () => {
    recordDay(today);
    clearSession();
    expect(loadHistory()).toEqual([]);
  });
  it("notifies same-tab and cross-tab listeners and handles cleared storage", () => {
    const listener = vi.fn();
    const stop = subscribeHistory(listener);
    recordDay(today);
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new StorageEvent("storage", { key: HISTORY_KEY, storageArea: localStorage }));
    expect(listener).toHaveBeenCalledTimes(2);
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
    expect(listener).toHaveBeenCalledTimes(3);
    stop();
    recordDay(today);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe("Week-over-week comparisons", () => {
  const prior = [{ date: "2026-10-09", waterMl: 2000, sleepHours: 8 }, { date: "2026-10-15", waterMl: 2000, sleepHours: 8 }];
  it("calculates a +15% water increase from adjacent logged-day averages", () => {
    const result = summarizeWeek(prior, { ...today, waterMl: 2300 }, "water", 2);
    expect(result.previousAverage).toBe(2);
    expect(result.previousLoggedDays).toBe(2);
    expect(result.changePercent).toBeCloseTo(15);
  });
  it("calculates a -5% sleep decrease independently of the edited goal", () => {
    const current = { ...today, sleepHours: 7.6 };
    expect(summarizeWeek(prior, current, "sleep", 8).changePercent).toBeCloseTo(-5);
    expect(summarizeWeek(prior, current, "sleep", 9).changePercent).toBeCloseTo(-5);
  });
  it("returns zero for unchanged averages", () => {
    expect(summarizeWeek(prior, { ...today, waterMl: 2000 }, "water", 2).changePercent).toBe(0);
  });
  it("does not invent comparisons with missing or zero previous data", () => {
    expect(summarizeWeek([], today, "water", 2).changePercent).toBeNull();
    expect(summarizeWeek([{ ...prior[0], date: "2026-10-09", waterMl: 0, sleepHours: null }], today, "water", 2).changePercent).toBeNull();
    expect(summarizeWeek(prior, { ...today, sleepHours: null }, "sleep", 8).changePercent).toBeNull();
  });
  it("excludes older records and separates previous and current window boundaries", () => {
    const result = summarizeWeek([...prior, { date: "2026-10-08", waterMl: 6000, sleepHours: 12 }, { date: "2026-10-16", waterMl: 2300, sleepHours: 7.6 }], { ...today, waterMl: 2300 }, "water", 2);
    expect(result.previousAverage).toBe(2);
    expect(result.average).toBe(2.3);
    expect(result.changePercent).toBeCloseTo(15);
  });
});

describe("Reactive weekly metrics", () => {
  const history = [
    { date: "2026-10-18", waterMl: 2000, sleepHours: 8 },
    { date: "2026-10-19", waterMl: 2500, sleepHours: 9 },
    { date: "2026-10-20", waterMl: 2500, sleepHours: 8.5 },
    { date: "2026-10-21", waterMl: 2000, sleepHours: 8 },
  ];
  it("averages logged days only and leaves missing days empty", () => {
    const result = summarizeWeek(history, today, "water", 2);
    expect(result.average).toBe(2.3);
    expect(result.loggedDays).toBe(5);
    expect(result.days[0]?.value).toBeNull();
    expect(result.streak).toBe(5);
  });
  it("recomputes water attainment and streaks using edited targets without changing logs", () => {
    const result = summarizeWeek(history, today, "water", 2.5);
    expect(result.metDays).toBe(3);
    expect(result.streak).toBe(1);
    expect(result.average).toBe(2.3);
    expect(history[3]?.waterMl).toBe(2000);
  });
  it("recomputes sleep attainment against an exact 8.5h goal", () => {
    expect(summarizeWeek(history, today, "sleep", 8).metDays).toBe(5);
    const result = summarizeWeek(history, today, "sleep", 8.5);
    expect(result.metDays).toBe(3);
    expect(result.average).toBe(8.4);
    expect(result.streak).toBe(1);
  });
  it("keeps the completed-day streak while today is still below goal", () => {
    const result = summarizeWeek(history, { ...today, waterMl: 500 }, "water", 2);
    expect(result.streak).toBe(4);
  });
  it("uses live today values instead of a stale snapshot and keeps history unchanged after profile edits", () => {
    recordDay({ ...today, waterMl: 500 });
    savePrefs({ ...defaultPrefs(), waterGoal: 3000 });
    expect(summarizeWeek(loadHistory(), today, "water", 3).days[6]).toMatchObject({ value: 2.5, met: false });
    expect(loadHistory()[0]?.waterMl).toBe(500);
  });
  it("records the existing synced sleep duration accurately", () => {
    saveDaily({ ...loadDaily(), syncOn: true });
    expect(loadHistory()[0]?.sleepHours).toBe(7.75);
  });
});