import { localDateKey, type DaySnapshot } from "@/lib/weekly";
import type { Prefs } from "@/lib/prefs";

export const MOMENTUM_KEY = "nutrace.momentum";
type MomentumDay = { date: string; met: boolean };

export function loadMomentum(): MomentumDay[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(MOMENTUM_KEY) ?? "[]");
    return Array.isArray(rows) ? rows.filter((row): row is MomentumDay => row && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && typeof row.met === "boolean") : [];
  } catch { return []; }
}

export function recordMomentum(day: DaySnapshot, prefs: Prefs) {
  try {
    const rows = loadMomentum().filter((row) => row.date !== day.date);
    rows.push({ date: day.date, met: day.waterMl >= prefs.waterGoal && (day.sleepHours ?? 0) >= prefs.sleepGoal });
    localStorage.setItem(MOMENTUM_KEY, JSON.stringify(rows.sort((a, b) => a.date.localeCompare(b.date))));
  } catch { /* Local persistence may be unavailable. */ }
}

export function summarizeMomentum(rows: MomentumDay[], now = new Date()) {
  const today = localDateKey(now);
  const sorted = [...new Map(rows.map((row) => [row.date, row])).values()].filter((row) => row.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  let streak = 0, charge = 0, total = 0, protectedDays = 0;
  let ready = false;
  let lastProtected: string | null = null;
  const byDate = new Map(sorted.map((row) => [row.date, row.met]));
  const first = sorted[0];
  if (first) {
    const cursor = new Date(`${first.date}T12:00:00`);
    while (localDateKey(cursor) <= today) {
      const date = localDateKey(cursor);
      const met = byDate.get(date) === true;
      if (met) {
        streak++; total++;
        if (!ready) { charge++; if (charge === 7) ready = true; }
      } else if (date !== today) {
        if (ready) { ready = false; charge = 0; protectedDays++; lastProtected = date; }
        else { streak = 0; charge = 0; }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return { streak, charge, ready, total, protectedDays, lastProtected, milestones: [7, 14, 30].filter((n) => total >= n) };
}