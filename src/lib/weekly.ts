export type DaySnapshot = { date: string; waterMl: number; sleepHours: number | null };
export type TrendMode = "water" | "sleep";
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
      (day.sleepHours === null || (Number.isFinite(day.sleepHours) && day.sleepHours >= 0)));
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

export function summarizeWeek(history: DaySnapshot[], today: DaySnapshot, mode: TrendMode, goal: number, now = new Date()) {
  const rows = new Map(history.map((day) => [day.date, day]));
  rows.set(today.date, today);
  const days = weekDates(now).map((date) => {
    const row = rows.get(date);
    const value = mode === "water" ? row ? row.waterMl / 1000 : null : row?.sleepHours ?? null;
    return { date, value, met: value !== null && value >= goal };
  });
  const logged = days.filter((day) => day.value !== null);
  const average = logged.length ? logged.reduce((sum, day) => sum + (day.value ?? 0), 0) / logged.length : null;
  const previousEnd = new Date(now);
  previousEnd.setDate(previousEnd.getDate() - 7);
  const previousValues = weekDates(previousEnd).flatMap((date) => {
    const row = rows.get(date);
    const value = mode === "water" ? row ? row.waterMl / 1000 : null : row?.sleepHours ?? null;
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