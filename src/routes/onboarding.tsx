/**
 * Two-step setup route: collect a name/avatar, then water and sleep baselines.
 * Holds unsaved profile and goal choices locally, manages step-heading focus,
 * and saves shared preferences before navigating to the dashboard.
 */
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Droplet, Moon } from "lucide-react";
import { AVATARS, WATER_GOALS, SLEEP_GOALS, DEFAULT_EMAIL, savePrefs, clampWaterGoal, clampSleepGoal, MIN_WATER_GOAL, MAX_WATER_GOAL, MIN_SLEEP_GOAL, MAX_SLEEP_GOAL } from "@/lib/prefs";
import { playClick } from "@/lib/daily";
import { CustomGoalRow } from "@/components/CustomGoalRow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up NuTrace" },
      { name: "description", content: "Personalize your profile and daily water and sleep goals." },
      { property: "og:title", content: "Set up NuTrace" },
      { property: "og:description", content: "Personalize your profile and daily water and sleep goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

function GoalPill({ active, onClick, children, tone, label }: { active: boolean; onClick: () => void; children: React.ReactNode; tone: "water" | "sleep"; label?: string }) {
  return (
    <Button variant="plain" type="button" aria-pressed={active} aria-label={label} onClick={() => { playClick(); onClick(); }} className={cn("font-mono rounded-full border px-4 py-2 text-sm transition min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      active ? (tone === "water" ? "border-water bg-water/15 text-water" : "border-sleep bg-sleep/15 text-sleep") : "border-input bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </Button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStepRender = useRef(true);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0] ?? "🦊");
  const [waterGoalMl, setWaterGoalMl] = useState(2000);
  const [sleepGoalHours, setSleepGoalHours] = useState(8);
  const [isCustomWaterOpen, setCustomWaterOpen] = useState(false);
  const [isCustomSleepOpen, setCustomSleepOpen] = useState(false);

  useEffect(() => {
    if (firstStepRender.current) { firstStepRender.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  const completeSetup = () => {
    playClick();
    savePrefs({ name: name.trim(), avatar, waterGoal: waterGoalMl, sleepGoal: sleepGoalHours, email: DEFAULT_EMAIL });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-12">
      <header className="flex gap-4" aria-label="Setup progress">
        {[1, 2].map((i) => (
          <div key={i} className="flex-1">
            {i === 1 && (
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                {step === 2 ? <Button variant="plain" onClick={() => setStep(1)} aria-label="Back to profile" className="min-h-11 min-w-11"><ArrowLeft size={16} /></Button>
                  : <Button variant="plain" asChild className="min-h-11 min-w-11"><Link to="/" aria-label="Back to welcome"><ArrowLeft size={16} /></Link></Button>}
                <span role="status" aria-live="polite">Step {step} of 2</span>
              </div>
            )}
            {i === 2 && <div className="mb-2 h-4" />}
            <div className={cn("h-0.5 rounded", step >= i ? "bg-water" : "bg-border")} />
          </div>
        ))}
      </header>

      {step === 1 ? (
        <section className="mt-16 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Personalize</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl leading-snug">What should we <span className="text-water">call you?</span></h1>
          <label htmlFor="profile-name" className="sr-only">Your name</label>
          <input id="profile-name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={30}
            className="mt-10 w-full rounded-2xl border border-input bg-card px-4 py-4 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
          <p className="mt-8 text-sm text-muted-foreground">Pick an avatar</p>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <Button variant="plain" key={a} onClick={() => { playClick(); setAvatar(a); }} aria-label={`Avatar ${a}`} aria-pressed={avatar === a}
                className={cn("h-auto min-h-11 min-w-11 aspect-square rounded-2xl border text-2xl transition", avatar === a ? "border-water bg-water/15" : "border-input bg-card")}>{a}</Button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-16 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Baselines</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl leading-snug">Set your <span className="text-water">daily goals</span></h1>
          <div className="mt-10 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><Droplet className="text-water" size={18} /> Water goal</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {WATER_GOALS.map((w) => <GoalPill key={w} tone="water" active={waterGoalMl === w} onClick={() => { setCustomWaterOpen(false); setWaterGoalMl(w); }}>{w}ml</GoalPill>)}
              <GoalPill tone="water" label="Custom water goal" active={isCustomWaterOpen || !(WATER_GOALS as number[]).includes(waterGoalMl)} onClick={() => setCustomWaterOpen((v) => !v)}>
                {(WATER_GOALS as number[]).includes(waterGoalMl) ? "Custom" : `Custom: ${waterGoalMl}ml`}
              </GoalPill>
            </div>
            {isCustomWaterOpen && (
              <CustomGoalRow label="Water goal" unit="ml" value={waterGoalMl} min={MIN_WATER_GOAL} max={MAX_WATER_GOAL} step={50}
                onApply={(v) => setWaterGoalMl(clampWaterGoal(v))} />
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><Moon className="text-sleep" size={18} /> Sleep goal</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SLEEP_GOALS.map((s) => <GoalPill key={s} tone="sleep" active={sleepGoalHours === s} onClick={() => { setCustomSleepOpen(false); setSleepGoalHours(s); }}>{s}h</GoalPill>)}
              <GoalPill tone="sleep" label="Custom sleep goal" active={isCustomSleepOpen || !(SLEEP_GOALS as number[]).includes(sleepGoalHours)} onClick={() => setCustomSleepOpen((v) => !v)}>
                {(SLEEP_GOALS as number[]).includes(sleepGoalHours) ? "Custom" : `Custom: ${sleepGoalHours}h`}
              </GoalPill>
            </div>
            {isCustomSleepOpen && (
              <CustomGoalRow label="Sleep goal" unit="h" value={sleepGoalHours} min={MIN_SLEEP_GOAL} max={MAX_SLEEP_GOAL} step={0.5}
                onApply={(v) => setSleepGoalHours(clampSleepGoal(v))} />
            )}
          </div>
        </section>
      )}

      <footer className="mt-10 flex items-center justify-between gap-4 pt-2">
        <span className="text-xs text-muted-foreground">You can change this later</span>
        {step === 1 ? (
          <Button variant="plain" disabled={!name.trim()} onClick={() => { playClick(); setStep(2); }} className="btn-gradient h-auto min-h-11 rounded-2xl px-10 py-3 text-lg font-semibold disabled:opacity-40">Next</Button>
        ) : (
          <Button variant="plain" onClick={completeSetup} className="btn-gradient h-auto min-h-11 rounded-2xl px-6 py-3 text-lg font-semibold">Complete Setup</Button>
        )}
      </footer>
    </div>
  );
}
