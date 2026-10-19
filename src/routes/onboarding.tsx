import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Droplet, Moon } from "lucide-react";
import { AVATARS, WATER_GOALS, SLEEP_GOALS, savePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up NuTrace" },
      { name: "description", content: "Personalize your profile and daily water and sleep goals." },
      { property: "og:title", content: "Set up NuTrace" },
      { property: "og:description", content: "Personalize your profile and daily water and sleep goals." },
    ],
  }),
  component: Onboarding,
});

function Pill({ active, onClick, children, tone }: { active: boolean; onClick: () => void; children: React.ReactNode; tone: "water" | "sleep" }) {
  return (
    <button type="button" onClick={onClick} className={cn("font-mono rounded-full border px-4 py-2 text-sm transition",
      active ? (tone === "water" ? "border-water bg-water/15 text-water" : "border-sleep bg-sleep/15 text-sleep") : "border-border bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [water, setWater] = useState(2000);
  const [sleep, setSleep] = useState(8);

  const complete = () => {
    savePrefs({ name: name.trim(), avatar, waterGoal: water, sleepGoal: sleep });
    nav({ to: "/dashboard" });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
      <header className="flex gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex-1">
            {i === 1 && (
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                {step === 2 ? <button onClick={() => setStep(1)} aria-label="Back"><ArrowLeft size={16} /></button>
                  : <Link to="/" aria-label="Back"><ArrowLeft size={16} /></Link>}
                Step {step} of 2
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
          <h2 className="mt-2 text-3xl leading-snug">What should we <span className="text-water">call you?</span></h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={30}
            className="mt-10 w-full rounded-2xl border border-border bg-card px-4 py-4 outline-none focus:border-water" />
          <p className="mt-8 text-sm text-muted-foreground">Pick an avatar</p>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)} aria-label={`Avatar ${a}`}
                className={cn("aspect-square rounded-2xl border text-2xl transition", avatar === a ? "border-water bg-water/15" : "border-border bg-card")}>{a}</button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-16 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Baselines</p>
          <h2 className="mt-2 text-3xl leading-snug">Set your <span className="text-water">daily goals</span></h2>
          <div className="mt-10 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><Droplet className="text-water" size={18} /> Water goal</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {WATER_GOALS.map((w) => <Pill key={w} tone="water" active={water === w} onClick={() => setWater(w)}>{w}ml</Pill>)}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2"><Moon className="text-sleep" size={18} /> Sleep goal</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SLEEP_GOALS.map((s) => <Pill key={s} tone="sleep" active={sleep === s} onClick={() => setSleep(s)}>{s}h</Pill>)}
            </div>
          </div>
        </section>
      )}

      <footer className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">You can change this later</span>
        {step === 1 ? (
          <button disabled={!name.trim()} onClick={() => setStep(2)} className="btn-gradient rounded-2xl px-10 py-3 text-lg font-semibold disabled:opacity-40">Next</button>
        ) : (
          <button onClick={complete} className="btn-gradient rounded-2xl px-6 py-3 text-lg font-semibold">Complete Setup</button>
        )}
      </footer>
    </main>
  );
}
