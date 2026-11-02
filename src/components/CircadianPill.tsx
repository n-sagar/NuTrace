import { useEffect, useState } from "react";
import { LocateFixed, Sunrise, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextSolarEvent, type Coordinates } from "@/lib/circadian";

export function CircadianPill() {
  const [now, setNow] = useState<Date | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const event = now ? nextSolarEvent(now, coords) : null;
  const Icon = event?.kind === "sunrise" ? Sunrise : Sunset;
  const locate = () => {
    if (!navigator.geolocation) { setStatus("Location unavailable; using estimated local times."); return; }
    setStatus("Finding local sunrise and sunset…");
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setStatus("Using your location for sunrise and sunset.");
    }, () => setStatus("Location unavailable; using estimated local times."), { timeout: 10000, maximumAge: 3600000 });
  };
  return <div className="circadian-glass flex flex-wrap items-center gap-2 border border-border px-3 py-2">
    <Icon aria-hidden="true" size={19} className="shrink-0 text-energy" />
    <div className="min-w-0 flex-1 text-xs">
      <p>{event ? `${event.kind === "sunrise" ? "Sunrise" : "Sunset"} in ${event.countdown}` : now ? "No sunrise/sunset in the next 2 days" : "Sunrise / Sunset"}</p>
      <p className="text-muted-foreground">{coords ? "Local solar time" : "Estimated · 6am / 6pm local"}</p>
    </div>
    <Button variant="plain" onClick={locate} aria-label="Use my location for sunrise and sunset" title="Use my location" className="size-11 shrink-0 rounded-full"><LocateFixed size={17} /></Button>
    <p className="sr-only" role="status">{status}</p>
  </div>;
}