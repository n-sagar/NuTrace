import { getTimes } from "suncalc";

export type Coordinates = { latitude: number; longitude: number };
export type LocationPreference = { mode: "gps"; coords: Coordinates } | { mode: "manual"; city: string; timezone: string };
export const LOCATION_KEY = "nutrace.location";
export function validTimezone(timezone: string): boolean {
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date(0)); return timezone.length > 0; } catch { return false; }
}
export function loadLocation(): LocationPreference | null {
  try {
    const value = JSON.parse(localStorage.getItem(LOCATION_KEY) ?? "null");
    if (value?.mode === "gps" && Number.isFinite(value.coords?.latitude) && Math.abs(value.coords.latitude) <= 90 && Number.isFinite(value.coords?.longitude) && Math.abs(value.coords.longitude) <= 180) return { mode: "gps", coords: value.coords };
    if (value?.mode === "manual" && typeof value.city === "string" && typeof value.timezone === "string" && validTimezone(value.timezone)) return { mode: "manual", city: value.city.slice(0, 100), timezone: value.timezone };
  } catch { /* Storage unavailable or invalid. */ }
  return null;
}
export function saveLocation(preference: LocationPreference): boolean {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify(preference)); return true; } catch { return false; }
}
function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
}
function estimatedZonedTime(now: Date, offset: number, hour: number, timezone: string) {
  const wall = new Date(zonedParts(now, timezone));
  wall.setUTCDate(wall.getUTCDate() + offset);
  wall.setUTCHours(hour, 0, 0, 0);
  let instant = wall.getTime();
  for (let i = 0; i < 3; i++) instant += wall.getTime() - zonedParts(new Date(instant), timezone);
  return new Date(instant);
}
export function nextSolarEvent(now: Date, coords: Coordinates | null, timezone?: string) {
  const events: { kind: "sunrise" | "sunset"; at: Date }[] = [];
  for (let offset = -1; offset <= 2; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    if (coords) {
      const times = getTimes(day, coords.latitude, coords.longitude, 0, -day.getTimezoneOffset());
      if (times.sunrise) events.push({ kind: "sunrise", at: times.sunrise });
      if (times.sunset) events.push({ kind: "sunset", at: times.sunset });
    } else if (timezone && validTimezone(timezone)) {
      events.push({ kind: "sunrise", at: estimatedZonedTime(now, offset, 6, timezone) }, { kind: "sunset", at: estimatedZonedTime(now, offset, 18, timezone) });
    } else {
      const dawn = new Date(day); dawn.setHours(6, 0, 0, 0);
      const dusk = new Date(day); dusk.setHours(18, 0, 0, 0);
      events.push({ kind: "sunrise", at: dawn }, { kind: "sunset", at: dusk });
    }
  }
  const next = events.filter((event) => Number.isFinite(event.at.getTime()) && event.at > now).sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  if (!next) return null; // Polar day/night: don't invent a solar event.
  const minutes = Math.ceil((next.at.getTime() - now.getTime()) / 60000);
  return { ...next, countdown: `${Math.floor(minutes / 60)}h ${minutes % 60}m`, estimated: !coords };
}