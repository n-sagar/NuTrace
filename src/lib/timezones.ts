export type TimezoneOption = { value: string; label: string; cities: string[] };
export const TIMEZONES: TimezoneOption[] = [
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)", cities: ["Los Angeles", "San Francisco", "San Diego", "Seattle", "Portland", "Vancouver"] },
  { value: "America/New_York", label: "Eastern Time (US & Canada)", cities: ["New York", "NYC", "Boston", "Miami", "Washington DC"] },
  { value: "America/Chicago", label: "Central Time (US & Canada)", cities: ["Chicago", "Dallas", "Houston"] },
  { value: "America/Denver", label: "Mountain Time (US & Canada)", cities: ["Denver", "Salt Lake City"] },
  { value: "America/Phoenix", label: "Arizona Time", cities: ["Phoenix", "Tucson"] },
  { value: "America/Toronto", label: "Eastern Time (Canada)", cities: ["Toronto", "Ottawa"] },
  { value: "Pacific/Honolulu", label: "Hawaii Time", cities: ["Honolulu"] },
  { value: "Europe/London", label: "United Kingdom Time", cities: ["London", "Manchester", "Edinburgh"] },
  { value: "Europe/Paris", label: "Central European Time (France)", cities: ["Paris", "Lyon"] },
  { value: "Europe/Berlin", label: "Central European Time (Germany)", cities: ["Berlin", "Munich"] },
  { value: "Asia/Kolkata", label: "India Standard Time", cities: ["Kolkata", "Calcutta", "Mumbai", "Bombay", "Delhi", "New Delhi", "Bangalore", "Bengaluru", "Ahmedabad"] },
  { value: "Asia/Dubai", label: "Gulf Standard Time", cities: ["Dubai", "Abu Dhabi"] },
  { value: "Asia/Singapore", label: "Singapore Time", cities: ["Singapore"] },
  { value: "Asia/Tokyo", label: "Japan Standard Time", cities: ["Tokyo", "Osaka"] },
  { value: "Australia/Sydney", label: "Eastern Australia Time", cities: ["Sydney", "Melbourne"] },
  { value: "Pacific/Auckland", label: "New Zealand Time", cities: ["Auckland", "Wellington"] },
  { value: "Etc/UTC", label: "Coordinated Universal Time (UTC)", cities: [] },
];
export const normalizeCity = (city: string) => city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min((row[j] ?? 0) + 1, (next[j - 1] ?? 0) + 1, (row[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length] ?? Infinity;
}
/** Only unambiguous known aliases are inferred; unknown cities leave the user's choice intact. */
export function timezoneForCity(city: string): string | null {
  const normalized = normalizeCity(city);
  if (!normalized) return null;
  const exact = TIMEZONES.find((zone) => zone.cities.some((alias) => normalizeCity(alias) === normalized));
  if (exact) return exact.value;
  if (normalized.length < 6) return null;
  const candidates = TIMEZONES.map((zone) => ({ value: zone.value, score: Math.min(...zone.cities.map((alias) => distance(normalized, normalizeCity(alias)))) })).sort((a, b) => a.score - b.score);
  const first = candidates[0];
  return first && first.score <= (normalized.length >= 10 ? 2 : 1) && first.score < (candidates[1]?.score ?? Infinity) ? first.value : null;
}
export function timezoneOptions(): TimezoneOption[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  const known = new Set(TIMEZONES.map((zone) => zone.value));
  const extra = (intl.supportedValuesOf?.("timeZone") ?? []).filter((value) => !known.has(value)).map((value) => ({ value, label: value.replaceAll("_", " ").replaceAll("/", " · "), cities: [] }));
  return [...TIMEZONES, ...extra];
}