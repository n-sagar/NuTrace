import { useEffect, useState } from "react";
import { LocateFixed, Sunrise, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCATION_KEY, loadLocation, nextSolarEvent, saveLocation, validTimezone, type LocationPreference } from "@/lib/circadian";

export function CircadianPill() {
  const [now, setNow] = useState<Date | null>(null);
  const [preference, setPreference] = useState<LocationPreference | null>(null);
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("");
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    setNow(new Date());
    const refresh = () => {
      const saved = loadLocation();
      setPreference(saved);
      setCity(saved?.mode === "manual" ? saved.city : "");
      setTimezone(saved?.mode === "manual" ? saved.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone);
    };
    refresh();
    const onStorage = (event: StorageEvent) => { if (event.key === LOCATION_KEY || event.key === null) refresh(); };
    window.addEventListener("storage", onStorage);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => { clearInterval(timer); window.removeEventListener("storage", onStorage); };
  }, []);
  const gps = preference?.mode === "gps";
  const event = now ? nextSolarEvent(now, gps ? preference.coords : null, preference?.mode === "manual" ? preference.timezone : undefined) : null;
  const Icon = event?.kind === "sunrise" ? Sunrise : Sunset;
  const apply = (value: LocationPreference) => {
    setPreference(value);
    setStatus(saveLocation(value) ? "Location preference saved on this device." : "Location selected, but this browser cannot save it for reloads.");
    setOpen(false);
  };
  const locate = () => {
    if (!navigator.geolocation) { setStatus("Location unavailable; using estimated local times."); return; }
    setLocating(true);
    setStatus("Finding local sunrise and sunset…");
    navigator.geolocation.getCurrentPosition((position) => {
      setLocating(false);
      apply({ mode: "gps", coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } });
    }, () => { setLocating(false); setStatus("Location unavailable. Your previous choice is unchanged; you can save a manual timezone instead."); }, { timeout: 10000, maximumAge: 3600000 });
  };
  return <div className="circadian-glass flex flex-wrap items-center gap-2 border border-border px-3 py-2">
    <Icon aria-hidden="true" size={19} className="shrink-0 text-energy" />
    <div className="min-w-0 flex-1 text-xs">
      <p>{event ? `${event.kind === "sunrise" ? "Sunrise" : "Sunset"} in ${event.countdown}` : now ? "No sunrise/sunset in the next 2 days" : "Sunrise / Sunset"}</p>
      <span className={`mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] ${gps ? "text-trend-positive" : "text-muted-foreground"}`}>{gps ? "Hyper-local (GPS)" : "Manual / Estimated"}</span>
      {!gps && <p className="mt-1 break-words text-muted-foreground">Estimated · 6am / 6pm{preference?.mode === "manual" ? ` · ${preference.city || preference.timezone}` : " local"}</p>}
    </div>
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild><Button variant="plain" aria-label="Choose sunrise and sunset location" title="Choose location" className="size-11 shrink-0 rounded-full"><LocateFixed size={17} /></Button></PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)]" aria-label="Circadian location">
        <h2 className="font-medium">Sunrise & sunset location</h2>
        <Button variant="outline" disabled={locating} onClick={locate} className="mt-3 min-h-11 w-full"><LocateFixed size={16} />{locating ? "Finding location…" : "Enable browser location"}</Button>
        <p className="mt-2 text-xs text-muted-foreground">GPS coordinates stay on this device.</p>
        <form className="mt-4 grid gap-3" onSubmit={(e) => {
          e.preventDefault();
          if (!validTimezone(timezone.trim())) { setStatus("Enter a valid timezone, such as Europe/London."); return; }
          apply({ mode: "manual", city: city.trim(), timezone: timezone.trim() });
        }}>
          <div><label htmlFor="circadian-city" className="text-xs">City (optional)</label><Input id="circadian-city" className="mt-1 min-h-11" value={city} maxLength={100} onChange={(e) => setCity(e.target.value)} placeholder="London" /></div>
          <div><label htmlFor="circadian-timezone" className="text-xs">Timezone</label><Input id="circadian-timezone" className="mt-1 min-h-11" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Europe/London" required aria-describedby="timezone-note" /></div>
          <p id="timezone-note" className="text-xs text-muted-foreground">City is a label. Manual times are 6am / 6pm estimates in this timezone, not calculated solar times.</p>
          <Button type="submit" className="min-h-11">Save manual location</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground" role="status">{status}</p>
      </PopoverContent>
    </Popover>
    {!open && <p className="sr-only" role="status">{status}</p>}
  </div>;
}