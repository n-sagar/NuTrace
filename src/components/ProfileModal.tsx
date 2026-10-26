import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LogOut, Droplet, Moon } from "lucide-react";
import { WATER_GOALS, SLEEP_GOALS, clampWaterGoal, clampSleepGoal, MIN_WATER_GOAL, MAX_WATER_GOAL, MIN_SLEEP_GOAL, MAX_SLEEP_GOAL, type Prefs } from "@/lib/prefs";
import { CustomGoalRow } from "@/components/CustomGoalRow";
import { playClick } from "@/lib/daily";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  prefs: Prefs;
  onSave: (p: Prefs) => void;
  onLogout: () => void;
  onClose: () => void;
};

function GoalPill({ active, onClick, children, tone, label }: { active: boolean; onClick: () => void; children: React.ReactNode; tone: "water" | "sleep"; label?: string }) {
  return (
    <Button variant="plain" type="button" aria-pressed={active} aria-label={label} onClick={() => { playClick(); onClick(); }} className={cn("font-mono rounded-full border px-4 py-2 text-sm transition min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      active ? (tone === "water" ? "border-water bg-water/15 text-water" : "border-sleep bg-sleep/15 text-sleep") : "border-input bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </Button>
  );
}

export function ProfileModal({ prefs, onSave, onLogout, onClose }: Props) {
  const [waterCustom, setWaterCustom] = useState(false);
  const [sleepCustom, setSleepCustom] = useState(false);
  const isWaterPreset = (WATER_GOALS as number[]).includes(prefs.waterGoal);
  const isSleepPreset = (SLEEP_GOALS as number[]).includes(prefs.sleepGoal);
  return (
    <Dialog modal open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById("profile-trigger")?.focus(); }} className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md space-y-5 overflow-y-auto rounded-3xl bg-card p-6">
        <DialogTitle className="pr-12">Account profile</DialogTitle>
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-background text-3xl">{prefs.avatar}</span>
            <div className="min-w-0">
              <div className="break-words text-lg font-semibold">{prefs.name}</div>
              <DialogDescription className="break-all">{prefs.email}</DialogDescription>
            </div>
          </div>

        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Edit goals</p>
          <div>
            <div className="flex items-center gap-2 text-sm"><Droplet size={15} className="text-water" /> Water goal</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {WATER_GOALS.map((w) => (
                <GoalPill key={w} tone="water" active={prefs.waterGoal === w} onClick={() => { setWaterCustom(false); onSave({ ...prefs, waterGoal: w }); }}>{w / 1000}L</GoalPill>
              ))}
              <GoalPill tone="water" label="Custom water goal" active={waterCustom || !isWaterPreset} onClick={() => setWaterCustom((v) => !v)}>
                {isWaterPreset ? "Custom" : `Custom: ${prefs.waterGoal / 1000}L`}
              </GoalPill>
            </div>
            {waterCustom && (
              <CustomGoalRow label="Water goal" unit="ml" value={prefs.waterGoal} min={MIN_WATER_GOAL} max={MAX_WATER_GOAL} step={50}
                onApply={(v) => onSave({ ...prefs, waterGoal: clampWaterGoal(v) })} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm"><Moon size={15} className="text-sleep" /> Sleep goal</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLEEP_GOALS.map((s) => (
                <GoalPill key={s} tone="sleep" active={prefs.sleepGoal === s} onClick={() => { setSleepCustom(false); onSave({ ...prefs, sleepGoal: s }); }}>{s}h</GoalPill>
              ))}
              <GoalPill tone="sleep" label="Custom sleep goal" active={sleepCustom || !isSleepPreset} onClick={() => setSleepCustom((v) => !v)}>
                {isSleepPreset ? "Custom" : `Custom: ${prefs.sleepGoal}h`}
              </GoalPill>
            </div>
            {sleepCustom && (
              <CustomGoalRow label="Sleep goal" unit="h" value={prefs.sleepGoal} min={MIN_SLEEP_GOAL} max={MAX_SLEEP_GOAL} step={0.5}
                onApply={(v) => onSave({ ...prefs, sleepGoal: clampSleepGoal(v) })} />
            )}
          </div>
        </div>

        <Button variant="plain" onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 h-auto min-h-11 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/20">
          <LogOut size={15} /> Log Out
        </Button>
      </DialogContent>
    </Dialog>
  );
}
