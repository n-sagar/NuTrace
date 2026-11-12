export type WindDownFeeling = "calm" | "okay" | "wired";
export type DaySnapshot = { date: string; waterMl: number; sleepHours: number | null; sleepSource?: "manual" | "demo-sync" | "populated-demo"; windDownMinutes?: number | null; windDownState?: WindDownFeeling | null };
export type TrendMode = "water" | "sleep" | "windDown";
export const HISTORY_KEY = "nutrace.history";
const HISTORY_CHANGED = "nutrace:history-changed";

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function recentDates(count: number, now = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - count + 1 + i);
    return localDateKey(day);
  });
}

export function weekDates(now = new Date()): string[] {
  return recentDates(7, now);
}

export function loadHistory(): DaySnapshot[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((day): day is DaySnapshot =>
      day && typeof day === "object" && typeof day.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isFinite(day.waterMl) && day.waterMl >= 0 &&
       (day.sleepHours === null || (Number.isFinite(day.sleepHours) && day.sleepHours >= 0)) &&
       (day.windDownMinutes == null || (Number.isFinite(day.windDownMinutes) && day.windDownMinutes >= 0)))
      .map((day) => day.windDownState == null ? day : { ...day, windDownState: ["calm", "okay", "wired"].includes(day.windDownState) ? day.windDownState : null });
  } catch { return []; }
}

export function recordDay(day: DaySnapshot): void {
  try {
    const dates = recentDates(14);
    const history = loadHistory().filter((row) => row.date !== day.date && dates.includes(row.date));
    if (dates.includes(day.date)) history.push(day);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.sort((a, b) => a.date.localeCompare(b.date))));
    window.dispatchEvent(new Event(HISTORY_CHANGED));
  } catch { /* Storage may be unavailable. Today's chart still uses live state. */ }
}

export function subscribeHistory(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    if (event.key === HISTORY_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(HISTORY_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(HISTORY_CHANGED, onChange);
  };
}

export function summarizeWeek(history: DaySnapshot[], today: DaySnapshot, mode: TrendMode, goal: number, now = new Date(), selectedDates = weekDates(now)) {
  const rows = new Map(history.map((day) => [day.date, day]));
  rows.set(today.date, today);
  const days = selectedDates.map((date) => {
    const row = rows.get(date);
    const value = mode === "water" ? row ? row.waterMl / 1000 : null : mode === "sleep" ? row?.sleepHours ?? null : row?.windDownMinutes ?? null;
    return { date, value, feeling: row?.windDownState ?? null, met: value !== null && value >= goal };
  });
  const logged = days.filter((day) => day.value !== null);
  const average = logged.length ? logged.reduce((sum, day) => sum + (day.value ?? 0), 0) / logged.length : null;
  const previousEnd = new Date(now);
  if (selectedDates[0]) previousEnd.setTime(new Date(`${selectedDates[0]}T12:00:00`).getTime());
  previousEnd.setDate(previousEnd.getDate() - 1);
  const retained = new Set(recentDates(14, now));
  const previousValues = recentDates(selectedDates.length, previousEnd).filter((date) => retained.has(date)).flatMap((date) => {
    const row = rows.get(date);
    const value = mode === "water" ? row ? row.waterMl / 1000 : null : mode === "sleep" ? row?.sleepHours ?? null : row?.windDownMinutes ?? null;
    return value === null ? [] : [value];
  });
  const previousAverage = previousValues.length ? previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length : null;
  // Missing logs aren't zeroes; a zero baseline has no finite percentage change.
  const changePercent = average !== null && previousAverage !== null && previousAverage > 0
    ? (average - previousAverage) / previousAverage * 100
    : null;
  // An unfinished today does not interrupt the streak of completed days.
  let index = days.length - 1;
  if (!days[index]?.met) index--;
  let streak = 0;
  while (index >= 0 && days[index]?.met) { streak++; index--; }
  return { days, average, previousAverage, previousLoggedDays: previousValues.length, changePercent, streak, loggedDays: logged.length, metDays: days.filter((day) => day.met).length };
}

/** Pair each evening with the following day's sleep, never the preceding night. */
export function windDownInsight(history: DaySnapshot[], today: DaySnapshot, now = new Date(), selectedDates = weekDates(now)) {
  const rows = new Map(history.map((day) => [day.date, day]));
  rows.set(today.date, today);
  const longer: number[] = [];
  const shorter: number[] = [];
  for (const date of selectedDates) {
    const sleep = rows.get(date);
    if (sleep?.sleepHours == null || !Number.isFinite(sleep.sleepHours) || sleep.sleepHours < 0 || sleep.sleepSource === "demo-sync") continue;
    const eveningDate = new Date(`${date}T12:00:00`);
    eveningDate.setDate(eveningDate.getDate() - 1);
    const evening = rows.get(localDateKey(eveningDate));
    if (evening?.windDownMinutes == null || !Number.isFinite(evening.windDownMinutes) || evening.windDownMinutes < 0) continue;
    (evening.windDownMinutes >= 15 ? longer : shorter).push(sleep.sleepHours);
  }
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return { longerCount: longer.length, shorterCount: shorter.length, differenceMinutes: longer.length >= 2 && shorter.length >= 2 ? Math.round((average(longer) - average(shorter)) * 60) : null };
}