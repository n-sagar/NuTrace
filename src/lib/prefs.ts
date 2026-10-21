export type Prefs = { name: string; avatar: string; waterGoal: number; sleepGoal: number; email: string };
const KEY = "nutrace.prefs";
export const AVATARS = ["🦊", "🐼", "🐳", "🦉", "🐢", "🌙"];
export const WATER_GOALS = [1500, 2000, 2500, 3000];
export const SLEEP_GOALS = [6, 7, 8, 9];
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
