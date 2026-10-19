import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplet, Moon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NuTrace — Track water & sleep" },
      { name: "description", content: "Track your fluid and sleep to optimize your daily energy." },
      { property: "og:title", content: "NuTrace — Track water & sleep" },
      { property: "og:description", content: "Track your fluid and sleep to optimize your daily energy." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pb-12 pt-16">
      <div className="relative my-6 grid size-72 place-items-center">
        {[288, 224, 168, 112].map((s) => (
          <div key={s} className="absolute rounded-full border border-border" style={{ width: s, height: s }} />
        ))}
        <span className="absolute right-6 top-4 size-2.5 rounded-full bg-water shadow-[0_0_12px_var(--water)]" />
        <span className="absolute bottom-12 left-6 size-2.5 rounded-full bg-sleep shadow-[0_0_12px_var(--sleep)]" />
        <div className="relative grid size-24 place-items-center rounded-full border border-border bg-card">
          <Droplet className="absolute -translate-x-3 -translate-y-2 text-water" />
          <Moon className="absolute translate-x-3 translate-y-3 text-sleep" />
        </div>
        <span className="font-mono absolute left-2 top-14 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-sm text-water"><Droplet size={14} />2.0L</span>
        <span className="font-mono absolute bottom-20 right-0 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-sm text-sleep"><Moon size={14} />8.0h</span>
      </div>
      <h1 className="font-display mt-6 text-5xl">NuTrace</h1>
      <p className="mt-4 max-w-64 text-center text-muted-foreground">Track your fluid and Sleep to optimize your daily energy.</p>
      <Link to="/onboarding" className="btn-gradient mt-14 w-full rounded-2xl py-4 text-center text-lg font-semibold">Get Started</Link>
      <p className="mt-6 text-sm text-muted-foreground">Already have an Account? <Link to="/dashboard" className="underline">Log In</Link></p>
    </main>
  );
}
