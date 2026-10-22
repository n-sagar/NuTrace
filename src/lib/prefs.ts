export type Prefs = { name: string; avatar: string; waterGoal: number; sleepGoal: number; email: string };
const KEY = "nutrace.prefs";
export const AVATARS = ["🦊", "🐼", "🐳", "🦉", "🐢", "🌙"];
export const WATER_GOALS = [1500, 2000, 2500, 3000];
export const SLEEP_GOALS = [6, 7, 8, 9];
export const MIN_WATER_GOAL = 500;
export const MAX_WATER_GOAL = 6000;
export const MIN_SLEEP_GOAL = 3;
export const MAX_SLEEP_GOAL = 12;

/** Clamp a custom water goal (ml) to 500–6000, rounded to the nearest 50ml. */
export function clampWaterGoal(ml: number): number {
  if (!Number.isFinite(ml)) return 2000;
  return Math.min(MAX_WATER_GOAL, Math.max(MIN_WATER_GOAL, Math.round(ml / 50) * 50));
}

/** Clamp a custom sleep goal (hours) to 3–12, rounded to the nearest half hour. */
export function clampSleepGoal(h: number): number {
  if (!Number.isFinite(h)) return 8;
  return Math.min(MAX_SLEEP_GOAL, Math.max(MIN_SLEEP_GOAL, Math.round(h * 2) / 2));
}
export const DEFAULT_EMAIL = "sagar@example.com";
export function loadPrefs(): Prefs | null {
  try {
    const r = localStorage.getItem(KEY);
    return r ? { email: DEFAULT_EMAIL, ...JSON.parse(r) } : null;
  } catch { return null; }
}
export function clearSession() {
  try { localStorage.removeItem(KEY); localStorage.removeItem("nutrace.daily"); } catch { /* unavailable */ }
}
export function savePrefs(p: Prefs) { localStorage.setItem(KEY, JSON.stringify(p)); }
