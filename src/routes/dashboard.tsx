import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplet, Moon, Minus, Plus } from "lucide-react";
import { loadPrefs, type Prefs } from "@/lib/prefs";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NuTrace" },
      { name: "description", content: "Your daily hydration and sleep summary." },
      { property: "og:title", content: "Dashboard — NuTrace" },
      { property: "og:description", content: "Your daily hydration and sleep summary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [p, setP] = useState<Prefs | null>(null);
  const [ml, setMl] = useState(0);
  useEffect(() => setP(loadPrefs() ?? { name: "there", avatar: "🌙", waterGoal: 2000, sleepGoal: 8 }), []);
  if (!p) return null;
  const pct = Math.min(ml / p.waterGoal, 1);
  const C = 2 * Math.PI * 80;
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl">NuTrace</h1>
        <span className="text-2xl">{p.avatar}</span>
      </div>
      <p className="text-sm text-muted-foreground">Hey {p.name}, hope you're doing well</p>
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5">
        <div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Droplet size={14} className="text-water" />Water goal</div><div className="text-xl font-semibold">{p.waterGoal / 1000}L</div></div>
        <div><div className="flex items-center gap-1 text-sm text-muted-foreground"><Moon size={14} className="text-sleep" />Sleep goal</div><div className="text-xl font-semibold">{p.sleepGoal}h</div></div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-muted-foreground">Water</div>
        <div className="relative mx-auto my-4 grid size-52 place-items-center">
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border)" strokeWidth="14" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="var(--water)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} className="transition-all" />
          </svg>
          <div className="text-center"><div className="text-4xl">{(ml / 1000).toFixed(2)}L</div><div className="text-sm text-muted-foreground">/ {p.waterGoal / 1000}L Goal</div></div>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <button aria-label="Remove glass" onClick={() => setMl(Math.max(0, ml - 250))} className="grid size-10 place-items-center rounded-full border border-border"><Minus size={16} /></button>
          <span className="text-center">1 Glass<br />(250ml)</span>
          <button aria-label="Add glass" onClick={() => setMl(ml + 250)} className="grid size-10 place-items-center rounded-full border border-border"><Plus size={16} /></button>
        </div>
      </div>
    </main>
  );
}
