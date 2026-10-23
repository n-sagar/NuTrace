import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { playClick } from "@/lib/daily";

export function CustomGoalRow({ label, unit, value, min, max, step, onApply }: {
  label: string; unit: string; value: number; min: number; max: number; step: number;
  onApply: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  const apply = () => {
    if (text.trim() === "") return;
    onApply(Number(text));
  };
  return (
    <div className="mt-2 flex items-center gap-2">
      <label className="flex flex-1 items-center gap-2 rounded-full border border-input bg-card px-4 focus-within:border-water">
        <span className="text-xs text-muted-foreground">{label}</span>
        <input
          type="number" inputMode="decimal" min={min} max={max} step={step} value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
          className="min-h-11 w-full bg-transparent font-mono text-sm outline-none"
          aria-label={`Custom ${label} in ${unit}`}
        />
        <span className="font-mono text-xs text-muted-foreground">{unit}</span>
      </label>
      <Button variant="plain"
        type="button"
        aria-label={`Set custom ${label.toLowerCase()}`}
        onClick={() => { playClick(); apply(); }}
        className="min-h-11 rounded-full border border-water bg-water/15 px-4 font-mono text-sm text-water transition hover:bg-water/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Set
      </Button>
    </div>
  );
}
