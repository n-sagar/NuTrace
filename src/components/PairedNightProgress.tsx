/**
 * Shared paired-night progress display for both wind-down insight states.
 * Receives longer/shorter evening counts from analytics, caps each displayed
 * counter at two and animates accessible SVG rings with reduced-motion support.
 * Presentation only: pairing and eligibility remain in the shared history helper.
 */
import { motion, useReducedMotion } from "framer-motion";

export function PairedNightProgress({ longerCount, shorterCount }: { longerCount: number; shorterCount: number }) {
  const reducedMotion = useReducedMotion();
  return <div className="mt-3 space-y-3" aria-live="polite" aria-atomic="true">
    {([["15+ min wind-down evenings", longerCount], ["Shorter logged evenings", shorterCount]] as const).map(([label, count]) => {
      const completed = Math.min(Math.max(count, 0), 2);
      const progress = completed / 2;
      return <div key={label} className="flex min-w-0 items-center gap-3">
        <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={2} aria-valuenow={completed} aria-valuetext={`${completed} of 2 paired nights logged`} className="size-10 shrink-0">
          <svg aria-hidden="true" viewBox="0 0 40 40" className="size-full -rotate-90" fill="none">
            <circle cx="20" cy="20" r="16" stroke="var(--weekly-bar-muted)" strokeWidth="4" />
            <motion.circle cx="20" cy="20" r="16" pathLength={1} stroke="var(--primary)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="1 1" initial={false}
              animate={{ strokeDashoffset: 1 - progress, opacity: progress === 0 ? 0 : 1 }}
              transition={{ strokeDashoffset: { duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }, opacity: { duration: 0.15 } }} />
          </svg>
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <p className="text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono font-medium text-foreground">{completed} / 2 <span className="font-sans text-muted-foreground">paired nights logged</span></p>
        </div>
      </div>;
    })}
  </div>;
}