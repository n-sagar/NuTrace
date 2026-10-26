import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

/** Water quick-add pill with a spring press and a confirming glow pulse on each log. */
export function QuickAddButton({ label, disabled, onAdd }: { label: string; disabled: boolean; onAdd: () => void }) {
  const reduced = useReducedMotion();
  const [pulse, setPulse] = useState(0);
  return (
    <motion.div className="relative" whileTap={{ scale: disabled || reduced ? 1 : 0.92 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
      <AnimatePresence>
        {pulse > 0 && (
          <motion.span
            key={pulse}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-water shadow-[var(--shadow-water-pulse)]"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: reduced ? 1 : 1.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.3 : 0.55, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <Button variant="plain" disabled={disabled} onClick={() => { onAdd(); setPulse((n) => n + 1); }} className="h-auto min-h-11 rounded-full border border-water bg-water/15 px-5 py-2 font-mono text-sm text-water transition hover:bg-water/25 disabled:opacity-40">{label}</Button>
    </motion.div>
  );
}
