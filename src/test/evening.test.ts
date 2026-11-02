import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { loadDaily, saveDaily } from "@/lib/daily";
import { loadHistory, summarizeWeek, recordDay } from "@/lib/weekly";
import { loadMomentum, recordMomentum, summarizeMomentum } from "@/lib/momentum";
import { clearSession, defaultPrefs } from "@/lib/prefs";
import { nextSolarEvent } from "@/lib/circadian";

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 9, 12)); });
afterEach(() => vi.useRealTimers());
const successful = Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-0${i + 1}`, met: true }));

describe("Wind-down data flow", () => {
  it("persists 30 minutes and a calm state into the weekly chart without changing sleep", () => {
    saveDaily({ ...loadDaily(), sleepHours: 8.5, windDownMinutes: 30, windDownState: "calm" });
    expect(loadDaily()).toMatchObject({ sleepHours: 8.5, windDownMinutes: 30, windDownState: "calm" });
    expect(summarizeWeek(loadHistory(), { date: "2026-11-09", waterMl: 0, sleepHours: 8.5, windDownMinutes: 30 }, "windDown", 0).average).toBe(30);
  });
  it("keeps legacy days unlogged and preserves a recorded zero", () => {
    const summary = summarizeWeek([{ date: "2026-11-08", waterMl: 2000, sleepHours: 8 }], { date: "2026-11-09", waterMl: 0, sleepHours: null, windDownMinutes: 0 }, "windDown", 0);
    expect(summary.days[5]?.value).toBeNull();
    expect(summary.days[6]?.value).toBe(0);
    expect(summary.loggedDays).toBe(1);
  });
  it("archives wind-down and resets at midnight", () => {
    saveDaily({ ...loadDaily(), windDownMinutes: 15, windDownState: "wired" });
    vi.setSystemTime(new Date(2026, 10, 10, 0, 1));
    expect(loadDaily().windDownMinutes ?? null).toBeNull();
    expect(loadHistory().find((row) => row.date === "2026-11-09")?.windDownMinutes).toBe(15);
  });
});

describe("7-Day Momentum Shield", () => {
  it("earns exactly one shield after seven distinct successful days", () => {
    expect(summarizeMomentum(successful, new Date(2026, 10, 7, 20))).toMatchObject({ ready: true, charge: 7, streak: 7, total: 7, milestones: [7] });
    expect(summarizeMomentum(successful.slice(0, 6), new Date(2026, 10, 6))).toMatchObject({ ready: false, charge: 6 });
  });
  it("protects one missed day without counting it as a success", () => {
    const result = summarizeMomentum(successful);
    expect(result).toMatchObject({ ready: false, streak: 7, total: 7, protectedDays: 1, lastProtected: "2026-11-08" });
    expect(successful).toHaveLength(7);
  });
  it("does not reset for unfinished today but resets on a second missed completed day", () => {
    expect(summarizeMomentum(successful).streak).toBe(7);
    expect(summarizeMomentum(successful, new Date(2026, 10, 10)).streak).toBe(0);
  });
  it("requires both water and sleep goals and is idempotent across repeated saves", () => {
    const day = { date: "2026-11-09", waterMl: 2000, sleepHours: 8 };
    recordMomentum({ ...day, sleepHours: 7 }, defaultPrefs());
    expect(loadMomentum()).toEqual([{ date: day.date, met: false }]);
    recordMomentum(day, defaultPrefs()); recordMomentum(day, defaultPrefs());
    expect(loadMomentum()).toEqual([{ date: day.date, met: true }]);
  });
  it("keeps earned protection beyond fourteen-day chart pruning and clears on logout", () => {
    successful.forEach((row) => recordMomentum({ date: row.date, waterMl: 2000, sleepHours: 8 }, defaultPrefs()));
    vi.setSystemTime(new Date(2026, 11, 1));
    recordDay({ date: "2026-12-01", waterMl: 0, sleepHours: null });
    expect(loadHistory()).toHaveLength(1);
    expect(loadMomentum()).toHaveLength(7);
    expect(summarizeMomentum(loadMomentum()).milestones).toEqual([7]);
    clearSession(); expect(loadMomentum()).toEqual([]);
  });
});

describe("Solar countdown", () => {
  it("switches from estimated dusk to next dawn in local time", () => {
    expect(nextSolarEvent(new Date(2026, 10, 9, 17, 30), null)).toMatchObject({ kind: "sunset", countdown: "0h 30m", estimated: true });
    expect(nextSolarEvent(new Date(2026, 10, 9, 18, 0), null)).toMatchObject({ kind: "sunrise", countdown: "12h 0m", estimated: true });
  });
  it("uses real coordinates and returns a future solar event", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    const event = nextSolarEvent(now, { latitude: 51.5074, longitude: -0.1278 });
    expect(event?.estimated).toBe(false);
    expect(event?.kind).toBe("sunset");
    expect(event?.at.getTime()).toBeGreaterThan(now.getTime());
    expect(event?.at.getUTCHours()).toBe(16);
  });
  it("does not invent sunrise during polar night", () => {
    expect(nextSolarEvent(new Date("2026-12-21T12:00:00Z"), { latitude: 89, longitude: 0 })).toBeNull();
  });
});