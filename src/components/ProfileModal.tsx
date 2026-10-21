import { X, LogOut, Droplet, Moon } from "lucide-react";
import { WATER_GOALS, SLEEP_GOALS, type Prefs } from "@/lib/prefs";
import { playClick } from "@/lib/daily";
import { cn } from "@/lib/utils";

type Props = {
  prefs: Prefs;
  onSave: (p: Prefs) => void;
  onLogout: () => void;
  onClose: () => void;
};

function GoalPill({ active, onClick, children, tone }: { active: boolean; onClick: () => void; children: React.ReactNode; tone: "water" | "sleep" }) {
  return (
    <button type="button" onClick={() => { playClick(); onClick(); }} className={cn("font-mono rounded-full border px-4 py-2 text-sm transition",
      active ? (tone === "water" ? "border-water bg-water/15 text-water" : "border-sleep bg-sleep/15 text-sleep") : "border-border bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

export function ProfileModal({ prefs, onSave, onLogout, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Account profile" onClick={onClose}>
      <div className="w-full max-w-md space-y-5 rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl border border-border bg-background text-3xl">{prefs.avatar}</span>
            <div>
              <div className="text-lg font-semibold">{prefs.name}</div>
              <div className="text-sm text-muted-foreground">{prefs.email}</div>
            </div>
          </div>
          <button aria-label="Close profile" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Edit goals</p>
          <div>
            <div className="flex items-center gap-2 text-sm"><Droplet size={15} className="text-water" /> Water goal</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {WATER_GOALS.map((w) => (
                <GoalPill key={w} tone="water" active={prefs.waterGoal === w} onClick={() => onSave({ ...prefs, waterGoal: w })}>{w / 1000}L</GoalPill>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm"><Moon size={15} className="text-sleep" /> Sleep goal</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLEEP_GOALS.map((s) => (
                <GoalPill key={s} tone="sleep" active={prefs.sleepGoal === s} onClick={() => onSave({ ...prefs, sleepGoal: s })}>{s}h</GoalPill>
              ))}
            </div>
          </div>
        </div>

        <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/20">
          <LogOut size={15} /> Log Out
        </button>
      </div>
    </div>
  );
}
