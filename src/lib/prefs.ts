export type Prefs = { name: string; avatar: string; waterGoal: number; sleepGoal: number; email: string };
const KEY = "nutrace.prefs";
const PREFS_CHANGED = "nutrace:prefs-changed";
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
export function defaultPrefs(): Prefs {
  return { name: "there", avatar: "🌙", waterGoal: 2000, sleepGoal: 8, email: DEFAULT_EMAIL };
}

export function loadPrefs(): Prefs | null {
  try {
    const r = localStorage.getItem(KEY);
    if (!r) return null;
    const stored: unknown = JSON.parse(r);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
    const p = stored as Partial<Prefs>;
    const defaults = defaultPrefs();
    return {
      name: typeof p.name === "string" ? p.name : defaults.name,
      avatar: typeof p.avatar === "string" ? p.avatar : defaults.avatar,
      email: typeof p.email === "string" ? p.email : defaults.email,
      waterGoal: typeof p.waterGoal === "number" ? clampWaterGoal(p.waterGoal) : defaults.waterGoal,
      sleepGoal: typeof p.sleepGoal === "number" ? clampSleepGoal(p.sleepGoal) : defaults.sleepGoal,
    };
  } catch { return null; }
}

/** Storage events notify other tabs; the local event also covers a same-tab logout. */
export function subscribePrefs(onChange: (p: Prefs | null) => void): () => void {
  const refresh = () => onChange(loadPrefs());
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea && event.storageArea !== window.localStorage) return;
    if (event.key === KEY || event.key === null) refresh();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(PREFS_CHANGED, refresh);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PREFS_CHANGED, refresh);
  };
}

export function clearSession() {
  try { localStorage.removeItem(KEY); localStorage.removeItem("nutrace.daily"); } catch { /* unavailable */ }
  window.dispatchEvent(new Event(PREFS_CHANGED));
}
export function savePrefs(p: Prefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event(PREFS_CHANGED));
}
