import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { playClick, type DailyState } from "@/lib/daily";
import { cn } from "@/lib/utils";

export function WindDownDrawer({ daily, onSave, onClose }: { daily: DailyState; onSave: (patch: Partial<DailyState>) => void; onClose: () => void }) {
  const [minutes, setMinutes] = useState(daily.windDownMinutes ?? 15);
  const [state, setState] = useState<DailyState["windDownState"]>(daily.windDownState ?? null);
  return <Dialog open modal onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogPortal><DialogOverlay />
      <DialogPrimitive.Content onCloseAutoFocus={(e) => { e.preventDefault(); document.getElementById("wind-down-trigger")?.focus(); }} className="wind-down-drawer fixed bottom-0 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 gap-6 overflow-y-auto rounded-t-3xl border border-border bg-card p-6 pb-8 shadow-lg">
        <DialogPrimitive.Close asChild><Button variant="plain" aria-label="Close wind-down" className="absolute right-3 top-3 size-11"><X size={18} /></Button></DialogPrimitive.Close>
        <div className="pr-10"><DialogTitle className="flex items-center gap-2"><Moon size={20} className="text-sleep" />Evening wind-down</DialogTitle><DialogDescription className="mt-2">Tonight’s quiet time</DialogDescription></div>
        <fieldset><legend className="text-sm">Wind-down minutes</legend><div className="mt-3 flex flex-wrap gap-2">{[5, 15, 30, 60].map((n) => <Button key={n} variant="plain" aria-pressed={minutes === n} onClick={() => { playClick(); setMinutes(n); }} className={cn("min-h-11 rounded-full border px-4 font-mono text-sm", minutes === n ? "border-sleep bg-sleep/15 text-sleep" : "border-input text-muted-foreground")}>{n} min</Button>)}</div></fieldset>
        <fieldset><legend className="text-sm">How do you feel?</legend><div className="mt-3 flex flex-wrap gap-2">{(["calm", "okay", "wired"] as const).map((mood) => <Button key={mood} variant="plain" aria-pressed={state === mood} onClick={() => { playClick(); setState(mood); }} className={cn("min-h-11 flex-1 rounded-lg border px-3 capitalize", state === mood ? "border-sleep bg-sleep/15 text-sleep" : "border-input text-muted-foreground")}>{mood}</Button>)}</div></fieldset>
        <Button disabled={!state} onClick={() => { if (!state) return; onSave({ windDownMinutes: minutes, windDownState: state }); onClose(); }} className="min-h-11 bg-sleep text-primary-foreground hover:bg-sleep/90">Save wind-down</Button>
      </DialogPrimitive.Content>
    </DialogPortal>
  </Dialog>;
}