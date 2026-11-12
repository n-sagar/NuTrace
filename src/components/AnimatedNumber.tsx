/**
 * Presentation helper for dashboard hydration totals, goals and percentages.
 * Holds the tweened display value and prior animation position, formats via the
 * caller and stops replaced animations. Reduced motion snaps to the input; this
 * helper never changes the underlying logged amount or goal.
 */
import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/** Smoothly tweens a displayed number toward `value`; snaps instantly under reduced motion. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  useEffect(() => {
    if (reducedMotion) { previousValue.current = value; setDisplayValue(value); return; }
    const controls = animate(previousValue.current, value, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (n) => { previousValue.current = n; setDisplayValue(n); },
    });
    return () => controls.stop();
  }, [value, reducedMotion]);
  return <>{format(displayValue)}</>;
}
