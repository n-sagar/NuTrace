import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Droplet, Flame, Minus, Moon, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dailySnapshot, playClick, type DailyState } from "@/lib/daily";
import { loadHistory, subscribeHistory, summarizeWeek, type TrendMode } from "@/lib/weekly";
import { type Prefs } from "@/lib/prefs";

const dayLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function WeeklyTrends({ daily, prefs }: { daily: DailyState; prefs: Prefs }) {
  const [mode, setMode] = useState<TrendMode>("water");
  const [history, setHistory] = useState(loadHistory);
  const [active, setActive] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => subscribeHistory(() => setHistory(loadHistory())), []);
  // Logout clears history along with preferences and daily data.
  useEffect(() => { setHistory(loadHistory()); }, [daily]);
  const water = mode === "water";
  const unit = water ? "L" : "h";
  const goal = water ? prefs.waterGoal / 1000 : prefs.sleepGoal;
  const summary = summarizeWeek(history, dailySnapshot(daily), mode, goal);
  const color = water ? "var(--water)" : "var(--sleep)";
  const mutedColor = "var(--weekly-bar-muted)";
  const change = summary.changePercent === null ? null : Math.round(summary.changePercent);
  const TrendIcon = change === null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const ceiling = Math.ceil(Math.max(goal, ...summary.days.map((day) => day.value ?? 0)) * 1.25 * 2) / 2;
  const first = summary.days[0];
  const last = summary.days[6];
  const metric = water ? "Water" : "Sleep";
  const activeDay = active === null ? undefined : summary.days[active];
  const srSummary = `Weekly ${metric} average: ${summary.average === null ? "not available" : `${summary.average.toFixed(1)}${unit} per day`} across ${summary.loggedDays} logged ${summary.loggedDays === 1 ? "day" : "days"}. Goal met on ${summary.metDays} of 7 days. Goal streak: ${summary.streak} ${summary.streak === 1 ? "day" : "days"}. ${change === null ? "Comparison with last week unavailable." : `Compared with last week: ${change > 0 ? "up" : change < 0 ? "down" : "unchanged"}${change === 0 ? "" : ` ${Math.abs(change)} percent`}.`}`;

  return (
    <section aria-labelledby="weekly-heading" className="rounded-2xl border border-border bg-card p-5">
      <p className="sr-only" role="status">{srSummary}</p>
      {/* Screen-reader-only data table: the same seven days as the chart, line by line. */}
      <table className="sr-only">
        <caption>{metric} log for the past 7 days, daily goal {goal}{unit}</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">{metric}</th><th scope="col">Goal</th></tr>
        </thead>
        <tbody>
          {summary.days.map((day) => (
            <tr key={day.date}>
              <th scope="row">{dayLabel(day.date)}</th>
              <td>{day.value === null ? "Not logged" : `${day.value}${unit}`}</td>
              <td>{day.value === null ? "—" : day.met ? "Met" : "Not met"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="weekly-heading" className="flex items-center gap-2 font-medium"><TrendingUp size={16} className="text-muted-foreground" />Weekly Trends</h2>
          <p className="mt-1 text-xs text-muted-foreground">{first && shortDate(first.date)} – {last && shortDate(last.date)}</p>
        </div>
        <span className="text-xs text-muted-foreground">Past 7 days</span>
      </div>
      <Tabs value={mode} onValueChange={(value) => { if (value === "water" || value === "sleep") { playClick(); setMode(value); } }} className="mt-5">
        <TabsList aria-label="Weekly metric" className="grid h-14 w-full grid-cols-2">
          <TabsTrigger value="water" className="h-11 gap-2 data-[state=active]:text-water"><Droplet size={15} />Water (L)</TabsTrigger>
          <TabsTrigger value="sleep" className="h-11 gap-2 data-[state=active]:text-sleep"><Moon size={15} />Sleep (Hours)</TabsTrigger>
        </TabsList>
        <TabsContent value={mode} className="mt-5" aria-label={`${water ? "Water" : "Sleep"} weekly summary`}>
          <motion.div key={mode} initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0.15 : 0.22 }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Weekly average</p>
                <p className="mt-1 font-mono text-2xl" >{summary.average === null ? "—" : summary.average.toFixed(1)}<span className="ml-1 font-sans text-xs text-muted-foreground">{unit} / day</span></p>
               <p  title={`Averages use logged days only: ${summary.loggedDays} this week, ${summary.previousLoggedDays} last week.`} className={`mt-1 flex flex-wrap items-center gap-1 text-[11px] ${change !== null && change > 0 ? "text-trend-positive" : "text-muted-foreground"}`}>
                 {change !== null && <TrendIcon size={13} aria-hidden="true" />}
                 {change === null ? "Comparison unavailable" : `${change > 0 ? "+" : ""}${change}% vs last week`}
               </p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.loggedDays} logged {summary.loggedDays === 1 ? "day" : "days"}</p>
              </div>
              <div className="min-w-0 border-l border-border pl-4">
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Flame size={12} />Goal streak</p>
                <p className="mt-1 font-mono text-2xl" >{summary.streak}<span className="ml-1 font-sans text-xs text-muted-foreground">{summary.streak === 1 ? "day" : "days"}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.metDays} of 7 goals met</p>
              </div>
            </div>
            <div
              tabIndex={0}
              role="group"
              aria-label={`${metric} bars. Use left and right arrow keys to inspect each day.`}
              onFocus={() => setActive((i) => i ?? 6)}
              onBlur={() => setActive(null)}
              onMouseLeave={() => setActive(null)}
              onKeyDown={(e) => {
                const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (e.key === "Home") { e.preventDefault(); setActive(0); }
                else if (e.key === "End") { e.preventDefault(); setActive(6); }
                else if (e.key === "Escape") setActive(null);
                else if (step) { e.preventDefault(); setActive((i) => Math.min(6, Math.max(0, (i ?? 6) + step))); }
              }}
              className="relative mt-5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            >
            <div className="h-48 w-full" role="img" aria-label={`${water ? "Water" : "Sleep"} over seven days. Daily goal ${goal}${unit}. ${summary.days.map((day) => `${dayLabel(day.date)}: ${day.value === null ? "not logged" : `${day.value}${unit}${day.met ? ", goal met" : ""}`}`).join(". ")}`}>
              <div aria-hidden="true" className="h-full w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={summary.days} margin={{ top: 16, right: 2, left: -25, bottom: 0 }} barCategoryGap="28%"
                  onMouseMove={(state) => { const i = state?.activeTooltipIndex; if (typeof i === "number") setActive(i); }}>
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} dy={5} />
                  <YAxis domain={[0, ceiling]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} tickCount={4} />
                  <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={() => null} />
                  <ReferenceLine y={goal} stroke="var(--muted-foreground)" strokeDasharray="3 4" />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={!reducedMotion} animationDuration={350}>
                    {summary.days.map((day, i) => (
                      <Cell key={day.date} fill={day.met ? color : mutedColor}
                        stroke={active === i ? "var(--foreground)" : "transparent"} strokeWidth={2}
                        style={{ filter: active === i ? "var(--shadow-bar-focus)" : "none", transition: "filter 150ms, stroke 150ms" }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer></div>
            </div>
            {activeDay && active !== null && (
              <div role="status" aria-live="polite"
                className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                style={{ left: `calc(35px + (100% - 37px) * ${(Math.min(5.6, Math.max(1.4, active + 0.5))) / 7})` }}>
                <p className="text-muted-foreground">{dayLabel(activeDay.date)}, {shortDate(activeDay.date)}</p>
                <p className="mt-1 font-mono">{activeDay.value === null ? "No log" : `${activeDay.value}${unit}`} <span className="font-sans text-muted-foreground">/ {goal}{unit}</span></p>
                <p className={activeDay.met ? "mt-1 text-trend-positive" : "mt-1 text-muted-foreground"}>{activeDay.value === null ? "Not logged" : activeDay.met ? "Goal met" : "Below goal"}</p>
              </div>
            )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><svg aria-hidden="true" data-legend="goal-met" viewBox="0 0 8 8" className="size-2 shrink-0"><circle cx="4" cy="4" r="4" fill={color} /></svg>Goal met<svg aria-hidden="true" data-legend="below-goal" viewBox="0 0 8 8" className="ml-2 size-2 shrink-0"><circle cx="4" cy="4" r="4" fill={mutedColor} /></svg>Below goal</span>
              <span>Goal: <span className="font-mono text-foreground">{goal}{unit}</span></span>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </section>
  );
}