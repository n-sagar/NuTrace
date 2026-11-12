/**
 * Daily habit dashboard reached after onboarding or from the welcome screen.
 * Coordinates shared preferences, local-day logs, cross-tab updates and midnight
 * rollover. Water and sleep cards remain inline regions of this page; goals and
 * progress derive from the active preferences/log pair. Populated demo edits stay
 * in memory, while live saves feed history and momentum through shared helpers.
 * Profile and wind-down dialogs send edits back through this page.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Droplet, Moon, Minus, Plus, Watch, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { loadPrefs, savePrefs, clearSession, defaultPrefs, subscribePrefs, type Prefs } from "@/lib/prefs";
import { loadDaily, saveDaily, dailySnapshot, timeToMidnight, playClick, playPop, playDroplet, MAX_WATER_ML, SYNCED_SLEEP, type DailyState, type SleepQuality } from "@/lib/daily";
import { CircadianPill } from "@/components/CircadianPill";
import { WindDownDrawer } from "@/components/WindDownDrawer";
import { MomentumShield } from "@/components/MomentumShield";
import { recordMomentum } from "@/lib/momentum";
import { ProfileModal } from "@/components/ProfileModal";
import { WeeklyTrends } from "@/components/WeeklyTrends";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { QuickAddButton } from "@/components/QuickAddButton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { createDemoData } from "@/lib/demo";

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
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [livePrefs, setLivePrefs] = useState<Prefs | null>(null);
  const [liveDaily, setLiveDaily] = useState<DailyState | null>(null);
  const [demoData, setDemoData] = useState<ReturnType<typeof createDemoData> | null>(null);
  const [resetCountdown, setResetCountdown] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [windDownOpen, setWindDownOpen] = useState(false);

  useEffect(() => {
    setLivePrefs(loadPrefs() ?? defaultPrefs());
    setLiveDaily(loadDaily());
    setResetCountdown(timeToMidnight());
    const unsubscribe = subscribePrefs((prefs) => {
      setLivePrefs(prefs ?? defaultPrefs());
      if (!prefs) {
        setProfileOpen(false);
        setWindDownOpen(false);
        setLiveDaily(loadDaily());
      }
    });
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
      if (event.key === "nutrace.daily" || event.key === null) setLiveDaily(loadDaily());
    };
    window.addEventListener("storage", onStorage);
    const rolloverTimer = setInterval(() => {
      setResetCountdown(timeToMidnight());
      setLiveDaily((cur) => {
        const fresh = loadDaily();
        return cur && fresh.date !== cur.date ? fresh : cur;
      });
    }, 30000);
    return () => {
      clearInterval(rolloverTimer);
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const activePrefs = demoData?.prefs ?? livePrefs;
  const activeDaily = demoData?.daily ?? liveDaily;
  if (!activePrefs || !activeDaily) return null;

  const switchMode = (populated: boolean) => {
    playClick();
    setProfileOpen(false);
    setWindDownOpen(false);
    setDemoData((current) => populated ? current ?? createDemoData() : null);
  };

  const updateDailyLog = (patch: Partial<DailyState>, sound = playPop) => {
    sound();
    if (demoData) {
      setDemoData((current) => current ? { ...current, daily: { ...current.daily, ...patch } } : current);
      return;
    }
    setLiveDaily((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      saveDaily(next);
      return next;
    });
  };

  const addWater = (amount: number) => {
    if (!activeDaily || activeDaily.waterMl >= MAX_WATER_ML) {
      toast("Maximum daily logging limit reached (6.0L).");
      return;
    }
    const next = Math.min(activeDaily.waterMl + amount, MAX_WATER_ML);
    if (next === MAX_WATER_ML) toast("Maximum daily logging limit reached (6.0L).");
    updateDailyLog({ waterMl: next }, playDroplet);
  };

  const saveGoals = (next: Prefs) => {
    if (demoData) {
      setDemoData((current) => current ? { ...current, prefs: next } : current);
      return;
    }
    recordMomentum(dailySnapshot(activeDaily), next);
    savePrefs(next);
    setLivePrefs(next);
  };

  const logout = () => {
    if (demoData) { switchMode(false); return; }
    clearSession();
    navigate({ to: "/" });
  };

  const waterProgressRatio = Math.min(activeDaily.waterMl / activePrefs.waterGoal, 1);
  const waterRingCircumference = 2 * Math.PI * 80;
  const isSleepSynced = activeDaily.syncOn;
  const sleepHours = isSleepSynced ? SYNCED_SLEEP.hours + SYNCED_SLEEP.minutes / 60 : activeDaily.sleepHours ?? 0;
  const sleepProgress = Math.min(100, sleepHours / activePrefs.sleepGoal * 100);
  const sleepDisplay = isSleepSynced
    ? `${SYNCED_SLEEP.hours}h ${SYNCED_SLEEP.minutes}m`
    : activeDaily.sleepHours != null
      ? `${activeDaily.sleepHours}h`
      : "—";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl">NuTrace</h1>
        <Button variant="plain" id="profile-trigger" aria-label="Open account profile" aria-haspopup="dialog" aria-expanded={profileOpen} onClick={() => setProfileOpen(true)} className="min-h-11 min-w-11 rounded-full text-2xl transition hover:scale-110">{activePrefs.avatar}</Button>
      </div>
      <div role="group" aria-label="Dashboard data mode" className="grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1">
        {([false, true] as const).map((populated) => <Button key={String(populated)} variant="plain" aria-pressed={Boolean(demoData) === populated} onClick={() => switchMode(populated)} className={cn("min-h-11 rounded-full px-3 text-xs font-medium transition", Boolean(demoData) === populated ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {populated ? "Populated Demo" : "Live User"}
        </Button>)}
      </div>
      {demoData && <activePrefs role="status" className="text-xs text-muted-foreground">Sample habit data · changes here won’t affect your live logs.</activePrefs>}
      <activePrefs className="text-sm text-muted-foreground">Hey {activePrefs.name}, hope you're doing well</activePrefs>
      <CircadianPill />

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <RefreshCw size={13} className="text-water" />
        Next reset in <span className="font-mono text-foreground">{resetCountdown}</span> at midnight
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5">
        <div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Droplet size={14} className="text-water" />Water goal</div><div className="text-xl font-semibold">{activePrefs.waterGoal / 1000}L</div></div>
        <div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Moon size={14} className="text-sleep" />Sleep goal</div><div className="text-xl font-semibold">{activePrefs.sleepGoal}h</div></div>
      </div>

      {/* Water tracker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground">Water</h2>
          {activeDaily.waterMl >= activePrefs.waterGoal && (
            <span className="rounded-full border border-water bg-water/15 px-3 py-1 text-xs font-semibold text-water">Goal Met! 🎉</span>
          )}
        </div>
        <div className="relative mx-auto my-4 grid size-52 place-items-center">
          <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border)" strokeWidth="14" />
            <motion.circle cx="100" cy="100" r="80" fill="none" stroke="var(--water)" strokeWidth="14" strokeLinecap="round" strokeDasharray={waterRingCircumference} initial={false} animate={{ strokeDashoffset: waterRingCircumference * (1 - waterProgressRatio) }} transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }} />
          </svg>
          <div className="text-center"><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{(activeDaily.waterMl / 1000).toFixed(2)}L of {activePrefs.waterGoal / 1000}L goal</div><div aria-hidden="true" className="text-4xl tabular-nums"><AnimatedNumber value={activeDaily.waterMl / 1000} format={(n) => `${n.toFixed(2)}L`} /></div><div aria-hidden="true" className="text-sm text-muted-foreground tabular-nums">/ <AnimatedNumber value={activePrefs.waterGoal / 1000} format={(n) => `${+n.toFixed(2)}L`} /> Goal · <AnimatedNumber value={Math.round(waterProgressRatio * 100)} format={(n) => `${Math.round(n)}%`} /></div></div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <QuickAddButton label="+250ml" disabled={activeDaily.waterMl >= MAX_WATER_ML} onAdd={() => addWater(250)} />
          <QuickAddButton label="+500ml" disabled={activeDaily.waterMl >= MAX_WATER_ML} onAdd={() => addWater(500)} />
          <QuickAddButton label="+1L" disabled={activeDaily.waterMl >= MAX_WATER_ML} onAdd={() => addWater(1000)} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Button variant="plain" aria-label="Remove 250ml" onClick={() => updateDailyLog({ waterMl: Math.max(0, activeDaily.waterMl - 250) }, playDroplet)} className="grid size-11 place-items-center rounded-full border border-input text-muted-foreground transition hover:text-foreground active:scale-95"><Minus size={16} /></Button>
          <Button variant="plain" aria-label="Add 250ml" disabled={activeDaily.waterMl >= MAX_WATER_ML} onClick={() => addWater(250)} className="grid size-11 place-items-center rounded-full border border-input text-muted-foreground transition hover:text-foreground disabled:opacity-40"><Plus size={16} /></Button>
        </div>
      </div>

      {/* Sleep tracker */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-muted-foreground"><Moon size={16} className="text-sleep" />Sleep</h2>
          <SwitchPrimitive.Root asChild checked={isSleepSynced} onCheckedChange={(syncOn) => updateDailyLog({ syncOn })}>
          <Button variant="plain"
            aria-label="Apple Health sync"
            className={cn("h-auto min-h-11 flex items-center gap-2 whitespace-normal rounded-full border px-3 py-1.5 text-xs transition",
              isSleepSynced ? "border-sleep bg-sleep/15 text-sleep" : "border-border text-muted-foreground")}
          >
            <Watch size={13} />
            {isSleepSynced ? "Apple Health Connected" : "Apple Health Off"}
            <span className={cn("relative h-4 w-7 rounded-full transition", isSleepSynced ? "bg-sleep" : "bg-border")}>
              <span className={cn("absolute top-0.5 size-3 rounded-full bg-foreground transition-all", isSleepSynced ? "left-3.5" : "left-0.5")} />
            </span>
          </Button>
          </SwitchPrimitive.Root>
        </div>

        <div className="mt-4 text-center">
          <div className="text-4xl">{sleepDisplay}</div>
          <div className="text-sm text-muted-foreground">
            {isSleepSynced ? "logged from Apple Watch" : activeDaily.sleepHours != null ? "logged manually" : "no sleep logged yet"}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(sleepProgress)}% of goal</span>
            <span>{activePrefs.sleepGoal}h goal</span>
          </div>
          <Progress aria-label="Sleep goal progress" value={sleepProgress} className="bg-sleep/15 [&>div]:bg-sleep" />
        </div>

        {isSleepSynced ? (
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
              <activePrefs className="text-xs text-muted-foreground">How long did you sleep?</activePrefs>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_HOURS.map((h) => (
                  <Button variant="plain" key={h} aria-label={`Log ${h} hours of sleep`} aria-pressed={activeDaily.sleepHours === h} onClick={() => updateDailyLog({ sleepHours: h })}
                    className={cn("h-auto min-h-11 rounded-full border px-4 py-2 font-mono text-sm transition",
                      activeDaily.sleepHours === h ? "border-sleep bg-sleep/15 text-sleep" : "border-input text-muted-foreground hover:text-foreground")}>
                    {h}h
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <activePrefs className="text-xs text-muted-foreground">How do you feel?</activePrefs>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUALITIES.map((q) => (
                  <Button variant="plain" key={q.key} aria-label={q.label} aria-pressed={activeDaily.sleepQuality === q.key} onClick={() => updateDailyLog({ sleepQuality: q.key })}
                    className={cn("h-auto min-h-11 flex flex-1 flex-col items-center gap-1 rounded-2xl border py-3 text-xs transition",
                      activeDaily.sleepQuality === q.key ? "border-sleep bg-sleep/15" : "border-input text-muted-foreground hover:text-foreground")}>
                    <span className="text-xl">{q.emoji}</span>{q.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Button id="wind-down-trigger" variant="plain" aria-haspopup="dialog" aria-expanded={windDownOpen} onClick={() => { playClick(); setWindDownOpen(true); }} className="flex h-auto min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left">
        <span className="flex items-center gap-2"><Moon size={18} className="text-sleep" />Evening wind-down</span><span className="text-xs text-muted-foreground">{activeDaily.windDownMinutes != null ? `${activeDaily.windDownMinutes} min · ${activeDaily.windDownState}` : "Log tonight"}</span>
      </Button>
       <MomentumShield rows={demoData ? [...demoData.history.filter((row) => row.date !== activeDaily.date), dailySnapshot(activeDaily)].map((row) => ({ date: row.date, met: row.waterMl >= activePrefs.waterGoal && (row.sleepHours ?? 0) >= activePrefs.sleepGoal })) : undefined} />
       <WeeklyTrends key={demoData ? "demo" : "live"} daily={activeDaily} prefs={activePrefs} historyOverride={demoData?.history} />
      {windDownOpen && <WindDownDrawer daily={activeDaily} onSave={(patch) => updateDailyLog(patch, playClick)} onClose={() => setWindDownOpen(false)} />}
      {profileOpen && (
        <ProfileModal prefs={activePrefs} onSave={saveGoals} onLogout={logout} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
