import { localDateKey, type DaySnapshot } from "@/lib/weekly";
export type TrendRange = "7" | "14" | "custom";
export function retainedDates(now = new Date()): string[] {
  return Array.from({ length: 14 }, (_, i) => { const date = new Date(now); date.setDate(date.getDate() - 13 + i); return localDateKey(date); });
}
export function trendDates(range: TrendRange, start: string, end: string, now = new Date()): string[] {
  const available = retainedDates(now);
  if (range === "7") return available.slice(-7);
  if (range === "14") return available;
  if (!available.includes(start) || !available.includes(end) || start > end) return [];
  return available.filter((date) => date >= start && date <= end);
}
export function comparisonRows(history: DaySnapshot[], today: DaySnapshot, dates: string[]) {
  const rows = new Map(history.map((day) => [day.date, day])); rows.set(today.date, today);
  const values = dates.map((date) => {
    const row = rows.get(date);
    return { date, water: row ? row.waterMl / 1000 : null, sleep: row?.sleepHours ?? null, windDown: row?.windDownMinutes ?? null, feeling: row?.windDownState ?? null };
  });
  const peak = (key: "water" | "sleep" | "windDown") => Math.max(0, ...values.map((row) => row[key] ?? 0));
  const peaks = { water: peak("water"), sleep: peak("sleep"), windDown: peak("windDown") };
  const relative = (value: number | null, peak: number) => value === null ? null : peak === 0 ? 0 : value / peak * 100;
  return values.map((row) => ({ ...row, waterRelative: relative(row.water, peaks.water), sleepRelative: relative(row.sleep, peaks.sleep), windDownRelative: relative(row.windDown, peaks.windDown) }));
}
/** Descriptive sample coverage, not a statistical significance estimate. */
export function sampleConfidence(longer: number, shorter: number) {
  if (longer < 2 || shorter < 2) return "Insufficient data";
  if (longer < 5 || shorter < 5) return "Low confidence · small sample";
  return "Moderate confidence · observational";
}