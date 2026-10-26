import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/** Smoothly tweens a displayed number toward `value`; snaps instantly under reduced motion. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced) { from.current = value; setShown(value); return; }
    const controls = animate(from.current, value, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (n) => { from.current = n; setShown(n); },
    });
    return () => controls.stop();
  }, [value, reduced]);
  return <>{format(shown)}</>;
}
