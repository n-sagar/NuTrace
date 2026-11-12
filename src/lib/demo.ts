import type { DailyState } from "@/lib/daily";
import { defaultPrefs } from "@/lib/prefs";
import { localDateKey, type DaySnapshot } from "@/lib/weekly";

/** In-memory fixtures only: never seed or replace the user's saved logs. */
export function createDemoData(now = new Date()) {
  const prefs = { ...defaultPrefs(), name: "Sagar", avatar: "🦊", email: "demo@example.com" };
  const water = [2250, 1750, 2500, 2000, 2750, 2250, 1500];
  const sleep = [7.25, 8.5, 7, 8.25, 7.5, 8.75, 8];
  const minutes = [30, 5, 25, 10, 45, 20, 30];
  const history: DaySnapshot[] = water.map((waterMl, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - 6 + index);
    return {
      date: localDateKey(date), waterMl, sleepHours: sleep[index] ?? 8,
      sleepSource: "populated-demo", windDownMinutes: minutes[index] ?? 30,
      windDownState: (minutes[index] ?? 0) >= 15 ? "calm" : "wired",
    };
  });
  const daily: DailyState = {
    date: localDateKey(now), waterMl: 1500, syncOn: false, sleepHours: 8,
    sleepQuality: "rested", windDownMinutes: 30, windDownState: "calm",
  };
  return { prefs, daily, history };
}