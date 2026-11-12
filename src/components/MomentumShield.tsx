import { Award, Shield, ShieldCheck } from "lucide-react";
import { loadMomentum, summarizeMomentum } from "@/lib/momentum";

export function MomentumShield({ rows }: { rows?: Parameters<typeof summarizeMomentum>[0] }) {
  const momentum = summarizeMomentum(rows ?? loadMomentum());
  const Icon = momentum.ready ? ShieldCheck : Shield;
  return <section aria-labelledby="momentum-heading" className="border-y border-border py-4">
    <div className="flex items-start gap-3"><Icon className="shrink-0 text-trend-positive" size={24} aria-hidden="true" />
      <div className="min-w-0 flex-1"><h2 id="momentum-heading" className="text-sm font-medium">7-Day Momentum Shield</h2>
        <p className="mt-1 text-xs text-muted-foreground">{momentum.ready ? "Shield ready · one missed day protected" : `${momentum.charge} / 7 goal days toward your shield`}</p>
        <p className="mt-1 text-xs text-muted-foreground">{momentum.streak} momentum days · Water + sleep goals</p>
        {momentum.lastProtected && <p className="mt-1 text-xs text-trend-positive">Missed day protected · {momentum.lastProtected}</p>}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-3" aria-label="Goal-day milestones">{[7, 14, 30].map((n) => <span key={n} className={momentum.milestones.includes(n) ? "flex items-center gap-1 text-xs text-energy" : "flex items-center gap-1 text-xs text-muted-foreground"}><Award size={16} aria-hidden="true" />{n} days{momentum.milestones.includes(n) ? " · earned" : " · not yet"}</span>)}</div>
  </section>;
}