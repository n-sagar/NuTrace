import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplet, Moon, Minus, Plus, Watch, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { loadPrefs, savePrefs, clearSession, defaultPrefs, subscribePrefs, type Prefs } from "@/lib/prefs";
import { loadDaily, saveDaily, timeToMidnight, playPop, playDroplet, MAX_WATER_ML, SYNCED_SLEEP, type DailyState, type SleepQuality } from "@/lib/daily";
import { ProfileModal } from "@/components/ProfileModal";
import { WeeklyTrends } from "@/components/WeeklyTrends";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NuTrace" },
      { name: "description", content: "Track daily hydration and sleep, explore seven-day trends, and follow your goal streaks." },
      { property: "og:title", content: "Dashboard — NuTrace" },
      { property: "og:description", content: "Track daily hydration and sleep, explore seven-day trends, and follow your goal streaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const QUICK_HOURS = [6, 7, 8, 9];
const QUALITIES: { key: SleepQuality; emoji: string; label: string }[] = [
  { key: "rested", emoji: "😴", label: "Rested" },
  { key: "okay", emoji: "😐", label: "Okay" },
  { key: "tired", emoji: "😫", label: "Tired" },
];
const STAGE_META = [
  { key: "rem", label: "REM", cls: "bg-sleep" },
  { key: "core", label: "Core", cls: "bg-water" },
  { key: "deep", label: "Deep", cls: "bg-primary" },
  { key: "awake", label: "Awake", cls: "bg-energy" },
] as const;

function Dashboard() {
  const nav = useNavigate();
  const [p, setP] = useState<Prefs | null>(null);
  const [d, setD] = useState<DailyState | null>(null);
  const [resetIn, setResetIn] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setP(loadPrefs() ?? defaultPrefs());
    setD(loadDaily());
    setResetIn(timeToMidnight());
    const unsubscribe = subscribePrefs((prefs) => {
      setP(prefs ?? defaultPrefs());
      if (!prefs) {
        setProfileOpen(false);
        setD(loadDaily());
      }
    });
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
      if (event.key === "nutrace.daily" || event.key === null) setD(loadDaily());
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => {
      setResetIn(timeToMidnight());
      setD((cur) => {
        const fresh = loadDaily();
        return cur && fresh.date !== cur.date ? fresh : cur;
      });
    }, 30000);
    return () => {
      clearInterval(t);
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!p || !d) return null;

  const update = (patch: Partial<DailyState>, sound = playPop) => {
    sound();
    setD((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      saveDaily(next);
      return next;
    });
  };

  const addWater = (amount: number) => {
    if (!d || d.waterMl >= MAX_WATER_ML) {
      toast("Maximum daily logging limit reached (6.0L).");
      return;
    }
    const next = Math.min(d.waterMl + amount, MAX_WATER_ML);
    if (next === MAX_WATER_ML) toast("Maximum daily logging limit reached (6.0L).");
    update({ waterMl: next }, playDroplet);
  };

  const saveGoals = (next: Prefs) => {
    savePrefs(next);
    setP(next);
  };

  const logout = () => {
    clearSession();
    nav({ to: "/" });
  };

  const pct = Math.min(d.waterMl / p.waterGoal, 1);
  const C = 2 * Math.PI * 80;
  const synced = d.syncOn;
  const sleepHours = synced ? SYNCED_SLEEP.hours + SYNCED_SLEEP.minutes / 60 : d.sleepHours ?? 0;
  const sleepProgress = Math.min(100, sleepHours / p.sleepGoal * 100);
  const sleepDisplay = synced
    ? `${SYNCED_SLEEP.hours}h ${SYNCED_SLEEP.minutes}m`
    : d.sleepHours != null
      ? `${d.sleepHours}h`
      : "—";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl">NuTrace</h1>
        <Button variant="plain" id="profile-trigger" aria-label="Open account profile" aria-haspopup="dialog" aria-expanded={profileOpen} onClick={() => setProfileOpen(true)} className="min-h-11 min-w-11 rounded-full text-2xl transition hover:scale-110">{p.avatar}</Button>
      </div>
      <p className="text-sm text-muted-foreground">Hey {p.name}, hope you're doing well</p>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <RefreshCw size={13} className="text-water" />
        Next reset in <span className="font-mono text-foreground">{resetIn}</span> at midnight
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5">
        <div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Droplet size={14} className="text-water" />Water goal</div><div className="text-xl font-semibold">{p.waterGoal / 1000}L</div></div>
        <div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Moon size={14} className="text-sleep" />Sleep goal</div><div className="text-xl font-semibold">{p.sleepGoal}h</div></div>
      </div>

      {/* Water tracker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground">Water</h2>
          {d.waterMl >= p.waterGoal && (
            <span className="rounded-full border border-water bg-water/15 px-3 py-1 text-xs font-semibold text-water">Goal Met! 🎉</span>
          )}
        </div>
        <div className="relative mx-auto my-4 grid size-52 place-items-center">
          <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border)" strokeWidth="14" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--water)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} className="transition-all" />
          </svg>
          <div className="text-center" role="status" aria-live="polite" aria-atomic="true"><div className="text-4xl">{(d.waterMl / 1000).toFixed(2)}L</div><div className="text-sm text-muted-foreground">/ {p.waterGoal / 1000}L Goal</div></div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="plain" aria-label="Remove 250ml" onClick={() => update({ waterMl: Math.max(0, d.waterMl - 250) }, playDroplet)} className="grid size-11 place-items-center rounded-full border border-input text-muted-foreground transition hover:text-foreground"><Minus size={16} /></Button>
          <Button variant="plain" disabled={d.waterMl >= MAX_WATER_ML} onClick={() => addWater(250)} className="h-auto min-h-11 rounded-full border border-water bg-water/15 px-5 py-2 font-mono text-sm text-water transition hover:bg-water/25 disabled:opacity-40">+250ml</Button>
          <Button variant="plain" disabled={d.waterMl >= MAX_WATER_ML} onClick={() => addWater(500)} className="h-auto min-h-11 rounded-full border border-water bg-water/15 px-5 py-2 font-mono text-sm text-water transition hover:bg-water/25 disabled:opacity-40">+500ml</Button>
          <Button variant="plain" aria-label="Add 250ml" disabled={d.waterMl >= MAX_WATER_ML} onClick={() => addWater(250)} className="grid size-11 place-items-center rounded-full border border-input text-muted-foreground transition hover:text-foreground disabled:opacity-40"><Plus size={16} /></Button>
        </div>
      </div>

      {/* Sleep tracker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-muted-foreground"><Moon size={16} className="text-sleep" />Sleep</h2>
          <SwitchPrimitive.Root asChild checked={synced} onCheckedChange={(syncOn) => update({ syncOn })}>
          <Button variant="plain"
            aria-label="Apple Health sync"
            className={cn("h-auto min-h-11 flex items-center gap-2 whitespace-normal rounded-full border px-3 py-1.5 text-xs transition",
              synced ? "border-sleep bg-sleep/15 text-sleep" : "border-border text-muted-foreground")}
          >
            <Watch size={13} />
            {synced ? "Apple Health Connected" : "Apple Health Off"}
            <span className={cn("relative h-4 w-7 rounded-full transition", synced ? "bg-sleep" : "bg-border")}>
              <span className={cn("absolute top-0.5 size-3 rounded-full bg-foreground transition-all", synced ? "left-3.5" : "left-0.5")} />
            </span>
          </Button>
          </SwitchPrimitive.Root>
        </div>

        <div className="mt-4 text-center">
          <div className="text-4xl">{sleepDisplay}</div>
          <div className="text-sm text-muted-foreground">
            {synced ? "logged from Apple Watch" : d.sleepHours != null ? "logged manually" : "no sleep logged yet"}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(sleepProgress)}% of goal</span>
            <span>{p.sleepGoal}h goal</span>
          </div>
          <Progress aria-label="Sleep goal progress" value={sleepProgress} className="bg-sleep/15 [&>div]:bg-sleep" />
        </div>

        {synced ? (
          <div className="mt-5">
            <div className="flex h-3 overflow-hidden rounded-full">
              {STAGE_META.map((s) => (
                <div key={s.key} className={s.cls} style={{ width: `${SYNCED_SLEEP.stages[s.key]}%` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              {STAGE_META.map((s) => (
                <span key={s.key} className="flex items-center gap-1">
                  <span className={cn("inline-block size-2 rounded-full", s.cls)} />
                  {s.label} {SYNCED_SLEEP.stages[s.key]}%
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">How long did you sleep?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_HOURS.map((h) => (
                  <Button variant="plain" key={h} aria-label={`Log ${h} hours of sleep`} aria-pressed={d.sleepHours === h} onClick={() => update({ sleepHours: h })}
                    className={cn("h-auto min-h-11 rounded-full border px-4 py-2 font-mono text-sm transition",
                      d.sleepHours === h ? "border-sleep bg-sleep/15 text-sleep" : "border-input text-muted-foreground hover:text-foreground")}>
                    {h}h
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">How do you feel?</p>
              <div className="mt-2 flex gap-2">
                {QUALITIES.map((q) => (
                  <Button variant="plain" key={q.key} aria-label={q.label} aria-pressed={d.sleepQuality === q.key} onClick={() => update({ sleepQuality: q.key })}
                    className={cn("h-auto min-h-11 flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 text-xs transition",
                      d.sleepQuality === q.key ? "border-sleep bg-sleep/15" : "border-input text-muted-foreground hover:text-foreground")}>
                    <span className="text-xl">{q.emoji}</span>{q.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <WeeklyTrends daily={d} prefs={p} />
      {profileOpen && (
        <ProfileModal prefs={p} onSave={saveGoals} onLogout={logout} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
