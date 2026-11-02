import { getTimes } from "suncalc";

export type Coordinates = { latitude: number; longitude: number };
export function nextSolarEvent(now: Date, coords: Coordinates | null) {
  const events: { kind: "sunrise" | "sunset"; at: Date }[] = [];
  for (let offset = -1; offset <= 2; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    if (coords) {
      const times = getTimes(day, coords.latitude, coords.longitude, 0, -day.getTimezoneOffset());
      if (times.sunrise) events.push({ kind: "sunrise", at: times.sunrise });
      if (times.sunset) events.push({ kind: "sunset", at: times.sunset });
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