import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCATION_KEY, loadLocation, saveLocation, nextSolarEvent } from "@/lib/circadian";
import { dailySnapshot, loadDaily, saveDaily } from "@/lib/daily";
import { loadHistory, windDownInsight, type DaySnapshot } from "@/lib/weekly";
import { clearSession } from "@/lib/prefs";

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 9, 12)); });
afterEach(() => vi.useRealTimers());

describe("Saved circadian choices", () => {
  it("restores manual city and timezone and estimates in that timezone", () => {
    saveLocation({ mode: "manual", city: "Kolkata", timezone: "Asia/Kolkata" });
    expect(loadLocation()).toEqual({ mode: "manual", city: "Kolkata", timezone: "Asia/Kolkata" });
    expect(nextSolarEvent(new Date("2026-11-09T11:30:00Z"), null, "Asia/Kolkata")).toMatchObject({ countdown: "1h 0m", estimated: true });
  });
  it("restores GPS coordinates and clears them on logout", () => {
    saveLocation({ mode: "gps", coords: { latitude: 51.5074, longitude: -0.1278 } });
    expect(loadLocation()).toMatchObject({ mode: "gps", coords: { latitude: 51.5074 } });
    clearSession(); expect(loadLocation()).toBeNull();
  });
  it("rejects invalid timezone and coordinates", () => {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ mode: "manual", city: "x", timezone: "Invalid/Zone" }));
    expect(loadLocation()).toBeNull();
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ mode: "gps", coords: { latitude: 91, longitude: 0 } }));
    expect(loadLocation()).toBeNull();
  });
  it("accounts for timezone daylight saving transitions", () => {
    const event = nextSolarEvent(new Date("2026-03-08T06:30:00Z"), null, "America/New_York");
    expect(event?.at.toISOString()).toBe("2026-03-08T10:00:00.000Z");
  });
});

describe("Wind-down history and associations", () => {
  it("archives 15 minutes and calm feeling across midnight", () => {
    saveDaily({ ...loadDaily(), windDownMinutes: 15, windDownState: "calm" });
    vi.setSystemTime(new Date(2026, 10, 10)); loadDaily();
    expect(loadHistory().find((row) => row.date === "2026-11-09")).toMatchObject({ windDownMinutes: 15, windDownState: "calm" });
  });
  const rows: DaySnapshot[] = [
    { date: "2026-11-04", waterMl: 0, sleepHours: null, windDownMinutes: 15 },
    { date: "2026-11-05", waterMl: 0, sleepHours: 8, windDownMinutes: 30 },
    { date: "2026-11-06", waterMl: 0, sleepHours: 8.5, windDownMinutes: 5 },
    { date: "2026-11-07", waterMl: 0, sleepHours: 7.5, windDownMinutes: 0 },
    { date: "2026-11-08", waterMl: 0, sleepHours: 7.5 },
  ];
  const today: DaySnapshot = { date: "2026-11-09", waterMl: 0, sleepHours: null };
  it("pairs next-day sleep and computes +45 minutes after 15+ minute evenings", () => {
    expect(windDownInsight(rows, today)).toEqual({ longerCount: 2, shorterCount: 2, differenceMinutes: 45 });
  });
  it("requires two observations in both groups without inventing missing evenings", () => {
    expect(windDownInsight(rows.slice(1), today)).toMatchObject({ longerCount: 1, shorterCount: 2, differenceMinutes: null });
  });
  it("excludes simulated synced sleep from correlation", () => {
    const synced = dailySnapshot({ date: "2026-11-05", waterMl: 0, syncOn: true, sleepHours: null, sleepQuality: null, windDownMinutes: 30 });
    expect(windDownInsight(rows.map((row) => row.date === synced.date ? synced : row), today)).toMatchObject({ longerCount: 1, differenceMinutes: null });
  });
});