import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Droplet, Flame, Moon, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dailySnapshot, playClick, type DailyState } from "@/lib/daily";
import { loadHistory, subscribeHistory, summarizeWeek, type TrendMode } from "@/lib/weekly";
import { type Prefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

const dayLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function WeeklyTrends({ daily, prefs }: { daily: DailyState; prefs: Prefs }) {
  const [mode, setMode] = useState<TrendMode>("water");
  const [history, setHistory] = useState(loadHistory);
  const reducedMotion = useReducedMotion();
  useEffect(() => subscribeHistory(() => setHistory(loadHistory())), []);
  // Logout clears history along with preferences and daily data.
  useEffect(() => { setHistory(loadHistory()); }, [daily]);
  const water = mode === "water";
  const unit = water ? "L" : "h";
  const goal = water ? prefs.waterGoal / 1000 : prefs.sleepGoal;
  const summary = summarizeWeek(history, dailySnapshot(daily), mode, goal);
  const color = water ? "var(--water)" : "var(--sleep)";
  const ceiling = Math.ceil(Math.max(goal, ...summary.days.map((day) => day.value ?? 0)) * 1.25 * 2) / 2;
  const first = summary.days[0];
  const last = summary.days[6];

  return (
    <section aria-labelledby="weekly-heading" className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="weekly-heading" className="flex items-center gap-2 font-medium"><TrendingUp size={16} className="text-muted-foreground" />Weekly Trends</h2>
          <p className="mt-1 text-xs text-muted-foreground">{first && shortDate(first.date)} – {last && shortDate(last.date)}</p>
        </div>
        <span className="text-xs text-muted-foreground">Past 7 days</span>
      </div>
      <Tabs value={mode} onValueChange={(value) => { if (value === "water" || value === "sleep") { playClick(); setMode(value); } }} className="mt-5">
        <TabsList aria-label="Weekly metric" className="grid h-12 w-full grid-cols-2">
          <TabsTrigger value="water" className="h-10 gap-2 data-[state=active]:text-water"><Droplet size={15} />Water (L)</TabsTrigger>
          <TabsTrigger value="sleep" className="h-10 gap-2 data-[state=active]:text-sleep"><Moon size={15} />Sleep (Hours)</TabsTrigger>
        </TabsList>
        <TabsContent value={mode} className="mt-5" aria-label={`${water ? "Water" : "Sleep"} weekly summary`}>
          <motion.div key={mode} initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.22 }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Weekly average</p>
                <p className="mt-1 font-mono text-2xl" aria-label="Weekly average">{summary.average === null ? "—" : summary.average.toFixed(1)}<span className="ml-1 font-sans text-xs text-muted-foreground">{unit} / day</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.loggedDays} logged {summary.loggedDays === 1 ? "day" : "days"}</p>
              </div>
              <div className="border-l border-border pl-4">
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Flame size={12} />Goal streak</p>
                <p className="mt-1 font-mono text-2xl" aria-label="Goal streak">{summary.streak}<span className="ml-1 font-sans text-xs text-muted-foreground">{summary.streak === 1 ? "day" : "days"}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.metDays} of 7 goals met</p>
              </div>
            </div>
            <div className="mt-5 h-48 w-full" role="img" aria-label={`${water ? "Water" : "Sleep"} over seven days. Daily goal ${goal}${unit}. ${summary.days.map((day) => `${dayLabel(day.date)}: ${day.value === null ? "not logged" : `${day.value}${unit}${day.met ? ", goal met" : ""}`}`).join(". ")}`}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={summary.days} margin={{ top: 16, right: 2, left: -25, bottom: 0 }} barCategoryGap="28%">
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
                  <YAxis domain={[0, ceiling]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickCount={4} />
                  <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const day = summary.days.find((row) => row.date === label);
                    if (!day) return null;
                    return <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground"><p className="text-muted-foreground">{shortDate(day.date)}</p><p className="mt-1 font-mono">{day.value === null ? "No log" : `${day.value}${unit}`} {day.met ? "· Goal met" : ""}</p></div>;
                  }} />
                  <ReferenceLine y={goal} stroke="var(--muted-foreground)" strokeDasharray="3 4" />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={!reducedMotion} animationDuration={350}>
                    {summary.days.map((day) => <Cell key={day.date} fill={day.met ? color : "var(--weekly-bar-muted)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className={cn("size-2 rounded-sm", water ? "bg-water" : "bg-sleep")} />Goal met<span className="ml-2 size-2 rounded-sm bg-weekly-bar-muted" />Below goal</span>
              <span>Goal: <span className="font-mono text-foreground">{goal}{unit}</span></span>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </section>
  );
}