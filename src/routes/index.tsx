import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplet, Moon, Sparkles, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { playClick } from "@/lib/daily";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NuTrace — Track water & sleep" },
      { name: "description", content: "Track your fluid and sleep to optimize your daily energy." },
      { property: "og:title", content: "NuTrace — Track water & sleep" },
      { property: "og:description", content: "Track your fluid and sleep to optimize your daily energy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const reducedMotion = useReducedMotion();
  const orbit = (direction: number, duration: number) => ({
    animate: { rotate: reducedMotion ? 0 : direction * 360 },
    transition: { duration: reducedMotion ? 0 : duration, repeat: reducedMotion ? 0 : Infinity, ease: "linear" as const },
  });
  return (
    <div className="welcome-background flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="relative grid aspect-square w-full max-w-[340px] place-items-center" aria-label="NuTrace hydration and sleep solar system">
          <div className="absolute inset-5 rounded-full border border-border/70" />
          <div className="absolute inset-[72px] rounded-full border border-border/70" />
          <motion.div {...orbit(1, 35)} className="absolute inset-5 rounded-full" aria-hidden="true">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <motion.div {...orbit(-1, 35)} className="orbital-node text-water"><Droplet size={23} strokeWidth={1.6} /></motion.div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <motion.div {...orbit(-1, 35)} className="orbital-node text-energy"><Zap size={21} strokeWidth={1.6} /></motion.div>
            </div>
          </motion.div>
          <motion.div {...orbit(-1, 25)} className="absolute inset-[72px] rounded-full" aria-hidden="true">
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div {...orbit(1, 25)} className="orbital-node text-sleep"><Moon size={22} strokeWidth={1.6} /></motion.div>
            </div>
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2">
              <motion.div {...orbit(1, 25)} className="orbital-node text-water"><Sparkles size={20} strokeWidth={1.6} /></motion.div>
            </div>
          </motion.div>
          <div className="logo-core relative flex size-32 flex-col items-center justify-center rounded-full border border-border bg-background">
            <div className="relative mb-2 h-9 w-14" aria-hidden="true">
              <Droplet className="absolute left-1 top-0 text-water" size={28} strokeWidth={1.5} />
              <Moon className="absolute bottom-0 right-1 text-sleep" size={26} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-2xl">NuTrace</h1>
          </div>
        </div>
        <h2 className="mt-8 max-w-xs text-center text-xl font-medium leading-relaxed">Track your daily hydration and sleep rhythm effortlessly.</h2>
        <motion.div className="mt-8 w-full" whileHover={{ scale: reducedMotion ? 1 : 1.025 }} whileTap={{ scale: reducedMotion ? 1 : 0.98 }} transition={{ duration: 0.2 }}>
          <Button asChild onClick={() => playClick()} className="btn-gradient h-14 w-full rounded-2xl text-base font-semibold">
            <Link to="/onboarding">Get Started <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </motion.div>
        <p className="mt-6 text-sm text-muted-foreground">Already have an account? <Link to="/dashboard" className="text-foreground underline underline-offset-4">Log In</Link></p>
      </div>
    </div>
  );
}
