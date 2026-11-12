/**
 * Dashboard analytics for water, sleep and evening wind-down logs. Owns metric,
 * date-range and active-day selection; derives charts, accessible daily tables
 * and paired-night sleep insights from current preferences and retained history.
 * An optional history override supplies isolated demo data without replacing
 * live storage. PairedNightProgress shares counts across locked/unlocked insights.
 */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Droplet, Flame, Minus, Moon, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dailySnapshot, playClick, type DailyState } from "@/lib/daily";
import { loadHistory, subscribeHistory, summarizeWeek, windDownInsight, type DaySnapshot, type TrendMode } from "@/lib/weekly";
import { type Prefs } from "@/lib/prefs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { comparisonRows, retainedDates, sampleConfidence, trendDates, type TrendRange } from "@/lib/trend-ranges";
import { PairedNightProgress } from "@/components/PairedNightProgress";

const dayLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function WeeklyTrends({ daily, prefs, historyOverride }: { daily: DailyState; prefs: Prefs; historyOverride?: DaySnapshot[] | undefined }) {
  const [selectedMetric, setSelectedMetric] = useState<TrendMode | "all">("water");
  const [selectedRange, setSelectedRange] = useState<TrendRange>("7");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [storedHistory, setStoredHistory] = useState(loadHistory);
  const history = historyOverride ?? storedHistory;
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => { const available = retainedDates(); setCustomStartDate(available[0] ?? ""); setCustomEndDate(available[13] ?? ""); }, []);
  useEffect(() => subscribeHistory(() => setStoredHistory(loadHistory())), []);
  // Logout clears history along with preferences and daily data.
  useEffect(() => { setStoredHistory(loadHistory()); }, [daily]);
  const water = selectedMetric === "water";
  const windDown = selectedMetric === "windDown";
  const isAllMetrics = selectedMetric === "all";
  const dates = trendDates(selectedRange, customStartDate, customEndDate, new Date(`${daily.date}T12:00:00`));
  const available = retainedDates(new Date(`${daily.date}T12:00:00`));
  const unit = water ? "L" : windDown ? "min" : "h";
  const goal = water ? prefs.waterGoal / 1000 : windDown ? 0 : prefs.sleepGoal;
  const summary = summarizeWeek(history, dailySnapshot(daily), isAllMetrics ? "water" : selectedMetric, goal, new Date(`${daily.date}T12:00:00`), dates);
  const insight = windDownInsight(history, dailySnapshot(daily), new Date(`${daily.date}T12:00:00`), dates);
  const overlay = comparisonRows(history, dailySnapshot(daily), dates);
  const confidence = sampleConfidence(insight.longerCount, insight.shorterCount);
  const trendNote = confidence.startsWith("Moderate") ? "steady trend — keep logging to refine" : "early trend — keep logging to refine";
  const windDownHeadline = insight.differenceMinutes === null ? "" : insight.differenceMinutes === 0
    ? "You average the same sleep on nights with a 15+ min wind-down."
    : insight.differenceMinutes > 0
      ? `You average +${insight.differenceMinutes} min more sleep on nights with a 15+ min wind-down.`
      : `You average ${Math.abs(insight.differenceMinutes)} min less sleep on nights with a 15+ min wind-down.`;
  const color = water ? "var(--water)" : "var(--sleep)";
  const mutedColor = "var(--weekly-bar-muted)";
  const change = summary.changePercent === null ? null : Math.round(summary.changePercent);
  const TrendIcon = change === null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const ceiling = Math.max(1, Math.ceil(Math.max(goal, ...summary.days.map((day) => day.value ?? 0)) * 1.25 * 2) / 2);
  const first = summary.days[0];
  const last = summary.days.at(-1);
  const metric = isAllMetrics ? "All metrics" : water ? "Water" : windDown ? "Wind-down" : "Sleep";
  const period = selectedRange === "7" ? "last week" : "the prior period";
  const tickLabel = (date: string) => dates.length > 7 ? shortDate(date) : dayLabel(date);
  const activeDay = activeDayIndex === null ? undefined : summary.days[activeDayIndex];
  const activeOverlay = activeDayIndex === null ? undefined : overlay[activeDayIndex];
  const srSummary = `${selectedRange === "7" ? "Weekly" : "Range"} ${metric} average: ${summary.average === null ? "not available" : `${summary.average.toFixed(1)}${unit} per day`} across ${summary.loggedDays} logged ${summary.loggedDays === 1 ? "day" : "days"}. ${windDown ? `${summary.loggedDays} of ${dates.length} evenings logged.` : `Goal met on ${summary.metDays} of ${dates.length} days. Goal streak: ${summary.streak} ${summary.streak === 1 ? "day" : "days"}.`} ${change === null ? `Comparison with ${period} unavailable.` : `Compared with ${period}: ${change > 0 ? "up" : change < 0 ? "down" : "unchanged"}${change === 0 ? "" : ` ${Math.abs(change)} percent`}.`}`;

  return (
    <section aria-labelledby="weekly-heading" className="min-w-0 rounded-2xl border border-border bg-card p-5">
      <p className="sr-only" role="status">{isAllMetrics ? `All metrics across ${dates.length} days. Water in liters, sleep in hours, wind-down in minutes. Lines scaled to each metric’s range peak.` : srSummary}</p>
      {/* === SECTION: Accessible Selected-Range Data Table === */}
      {/* Mirrors the selected chart dates and real units, including missing logs and wind-down feelings. */}
      <div className="sr-only"><table className="sr-only">
        <caption>{metric} log for the past {dates.length} days{windDown || isAllMetrics ? "" : `, daily goal ${goal}${unit}`}</caption>
        <thead>
          <tr><th scope="col">Day</th>{isAllMetrics ? <><th scope="col">Water (L)</th><th scope="col">Water goal</th><th scope="col">Sleep (h)</th><th scope="col">Sleep goal</th><th scope="col">Wind-down (min)</th><th scope="col">Feeling</th></> : <><th scope="col">{metric}</th><th scope="col">{windDown ? "Status" : "Goal"}</th>{windDown && <th scope="col">Feeling</th>}</>}</tr>
        </thead>
        <tbody>
          {summary.days.map((day, index) => (
            <tr key={day.date}>
              <th scope="row">{dayLabel(day.date)}, {shortDate(day.date)}</th>
              {isAllMetrics ? <><td>{overlay[index]?.water == null ? "Not logged" : `${overlay[index]?.water}L`}</td><td>{overlay[index]?.water == null ? "—" : (overlay[index]?.water ?? 0) >= prefs.waterGoal / 1000 ? "Met" : "Not met"}</td><td>{overlay[index]?.sleep == null ? "Not logged" : `${overlay[index]?.sleep}h`}</td><td>{overlay[index]?.sleep == null ? "—" : (overlay[index]?.sleep ?? 0) >= prefs.sleepGoal ? "Met" : "Not met"}</td><td>{overlay[index]?.windDown == null ? "Not logged" : `${overlay[index]?.windDown}min`}</td><td>{overlay[index]?.feeling ?? "Not recorded"}</td></> : <><td>{day.value === null ? "Not logged" : `${day.value}${unit}`}</td>
              <td>{day.value === null ? "—" : windDown ? "Logged" : day.met ? "Met" : "Not met"}</td>
               {windDown && <td>{day.value === null ? "Not logged" : day.feeling ?? "Not recorded"}</td>}</>}
            </tr>
          ))}
        </tbody>
      </table></div>
      {/* === SECTION: Date Range Controls === */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="weekly-heading" className="flex items-center gap-2 font-medium"><TrendingUp size={16} className="text-muted-foreground" />Weekly Trends</h2>
          <p className="mt-1 text-xs text-muted-foreground">{first && shortDate(first.date)} – {last && shortDate(last.date)}</p>
        </div>
        <Select value={selectedRange} onValueChange={(value) => { if (value === "7" || value === "14" || value === "custom") { setSelectedRange(value); setActiveDayIndex(null); playClick(); } }}>
          <SelectTrigger aria-label="Trend date range" className="min-h-11 w-36 shrink-0 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="7">Past 7 Days</SelectItem><SelectItem value="14">Past 14 Days</SelectItem><SelectItem value="custom">Custom Range</SelectItem></SelectContent>
        </Select>
      </div>
      {selectedRange === "custom" && <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0"><label htmlFor="trend-start" className="text-xs">Start date</label><Input id="trend-start" type="date" value={customStartDate} min={available[0]} max={customEndDate || available[13]} onChange={(e) => { setCustomStartDate(e.target.value); setActiveDayIndex(null); }} className="mt-1 min-h-11 min-w-0 w-full" /></div>
        <div className="min-w-0"><label htmlFor="trend-end" className="text-xs">End date</label><Input id="trend-end" type="date" value={customEndDate} min={customStartDate || available[0]} max={available[13]} onChange={(e) => { setCustomEndDate(e.target.value); setActiveDayIndex(null); }} className="mt-1 min-h-11 min-w-0 w-full" /></div>
      </div>}
      {selectedRange !== "7" && <p className="mt-2 text-xs text-muted-foreground">14-day retained history · missing logs stay empty.</p>}
      {dates.length === 0 && <p role="alert" className="mt-2 text-xs text-destructive">Choose an ordered range within the past 14 days.</p>}
      {/* === SECTION: Metric Filters & Summary === */}
      <Tabs value={selectedMetric} onValueChange={(value) => { if (value === "all" || value === "water" || value === "sleep" || value === "windDown") { playClick(); setSelectedMetric(value); setActiveDayIndex(null); } }} className="mt-5">
        <TabsList aria-label="Weekly metric" className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="all" className="min-h-11 whitespace-normal px-1 text-xs">All Metrics</TabsTrigger>
          <TabsTrigger value="water" className="h-auto min-h-11 min-w-0 flex-wrap gap-1 whitespace-normal px-1 text-xs data-[state=active]:text-water"><Droplet size={15} />Water (L)</TabsTrigger>
          <TabsTrigger value="sleep" className="h-auto min-h-11 min-w-0 flex-wrap gap-1 whitespace-normal px-1 text-xs data-[state=active]:text-sleep"><Moon size={15} />Sleep (Hours)</TabsTrigger>
          <TabsTrigger value="windDown" className="h-auto min-h-11 min-w-0 whitespace-normal px-1 text-xs data-[state=active]:text-sleep">Wind-down (Min)</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedMetric} className="mt-5" aria-label={`${metric} weekly summary`}>
          <motion.div key={selectedMetric} initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0.15 : 0.22 }}>
            {!isAllMetrics && <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{selectedRange === "7" ? "Weekly average" : "Range average"}</p>
                <p className="mt-1 font-mono text-2xl" >{summary.average === null ? "—" : summary.average.toFixed(1)}<span className="ml-1 font-sans text-xs text-muted-foreground">{unit} / day</span></p>
               <p  title={`Averages use logged days only: ${summary.loggedDays} selected, ${summary.previousLoggedDays} in ${period}.`} className={`mt-1 flex flex-wrap items-center gap-1 text-[11px] ${change !== null && change > 0 ? "text-trend-positive" : "text-muted-foreground"}`}>
                 {change !== null && <TrendIcon size={13} aria-hidden="true" />}
                 {change === null ? "Comparison unavailable" : `${change > 0 ? "+" : ""}${change}% vs ${selectedRange === "7" ? "last week" : "prior period"}`}
               </p>
                <p className="mt-1 text-xs text-muted-foreground">{summary.loggedDays} logged {summary.loggedDays === 1 ? "day" : "days"}</p>
              </div>
              <div className="min-w-0 border-l border-border pl-4">
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Flame size={12} />{windDown ? "Evenings logged" : "Goal streak"}</p>
                <p className="mt-1 font-mono text-2xl" >{windDown ? summary.loggedDays : summary.streak}<span className="ml-1 font-sans text-xs text-muted-foreground">days</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{windDown ? `Past ${dates.length} evenings` : `${summary.metDays} of ${dates.length} goals met`}</p>
              </div>
            </div>}
            {!isAllMetrics && <p role="status" aria-live="polite" className="mt-3 text-xs font-medium text-muted-foreground">
              {activeDay
                ? `Selected: ${dayLabel(activeDay.date)}, ${shortDate(activeDay.date)} • ${activeDay.value === null ? "Not logged" : `${activeDay.value}${unit}${windDown ? "" : ` / ${goal}${unit}`}`}${activeDay.value === null ? "" : windDown ? " (Logged)" : activeDay.met ? " (Goal met)" : " (Below goal)"}`
                : "Tap, hover or focus a bar to see a day’s breakdown."}
            </p>}
            {isAllMetrics && <p className="text-xs text-muted-foreground">Relative to each metric’s range peak (%) · actual values in daily details.</p>}
            {/* === SECTION: Interactive Chart & Contained Tooltip === */}
            <div
              tabIndex={0}
              role="group"
              aria-label={`${metric} ${isAllMetrics ? "comparison lines" : "bars"}. Use left and right arrow keys to inspect each day.`}
              onFocus={() => setActiveDayIndex((i) => i ?? dates.length - 1)}
              onBlur={() => setActiveDayIndex(null)}
              onMouseLeave={() => setActiveDayIndex(null)}
              onKeyDown={(e) => {
                const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (e.key === "Home") { e.preventDefault(); setActiveDayIndex(0); }
                else if (e.key === "End") { e.preventDefault(); setActiveDayIndex(dates.length - 1); }
                else if (e.key === "Escape") setActiveDayIndex(null);
                else if (step) { e.preventDefault(); setActiveDayIndex((i) => Math.min(dates.length - 1, Math.max(0, (i ?? dates.length - 1) + step))); }
              }}
              className="relative mt-6 rounded-lg pt-2 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
            <div className="h-48 w-full" role="img" aria-label={isAllMetrics ? `All metrics over ${dates.length} days. Water in liters, sleep in hours, wind-down in minutes; lines scaled independently to range peaks. Daily values in the data table.` : `${metric} over ${dates.length === 7 ? "seven" : dates.length} days. ${windDown ? "Wind-down minutes logged." : `Daily goal ${goal}${unit}.`} ${summary.days.map((day) => `${dayLabel(day.date)}: ${day.value === null ? "not logged" : `${day.value}${unit}${!windDown && day.met ? ", goal met" : ""}`}`).join(". ")}`}>
              <div aria-hidden="true" className="h-full w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
                {isAllMetrics ? <LineChart data={overlay} margin={{ top: 16, right: 2, left: 0, bottom: 0 }} onMouseMove={(state) => { const i = state?.activeTooltipIndex; if (typeof i === "number") setActiveDayIndex(i); }}>
                  <XAxis dataKey="date" tickFormatter={tickLabel} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis width={60} domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={() => null} allowEscapeViewBox={{ x: false, y: false }} />
                  <Line name="Water (L)" dataKey="waterRelative" stroke="var(--water)" strokeWidth={2} connectNulls={false} isAnimationActive={!reducedMotion} />
                  <Line name="Sleep (h)" dataKey="sleepRelative" stroke="var(--sleep)" strokeWidth={2} connectNulls={false} isAnimationActive={!reducedMotion} />
                  <Line name="Wind-down (min)" dataKey="windDownRelative" stroke="var(--energy)" strokeWidth={2} connectNulls={false} isAnimationActive={!reducedMotion} />
                </LineChart> : <BarChart data={summary.days} margin={{ top: 16, right: 2, left: 0, bottom: 0 }} barCategoryGap="28%"
                  onMouseMove={(state) => { const i = state?.activeTooltipIndex; if (typeof i === "number") setActiveDayIndex(i); }}>
                  <XAxis dataKey="date" tickFormatter={tickLabel} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} dy={5} />
                  <YAxis width={60} domain={[0, ceiling]} tickFormatter={(value) => `${value}${unit}`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} tickCount={4} />
                  <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={() => null} allowEscapeViewBox={{ x: false, y: false }} />
                  {!windDown && <ReferenceLine y={goal} stroke="var(--muted-foreground)" strokeDasharray="3 4" />}
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={!reducedMotion} animationDuration={350}>
                    {summary.days.map((day, i) => (
                      <Cell key={day.date} fill={day.met ? color : mutedColor}
                        stroke={activeDayIndex === i ? "var(--foreground)" : "transparent"} strokeWidth={2}
                        style={{ filter: activeDayIndex === i ? "var(--shadow-bar-focus)" : "none", transition: "filter 150ms, stroke 150ms" }} />
                    ))}
                  </Bar>
                </BarChart>}
              </ResponsiveContainer></div>
            </div>
            {activeDay && activeDayIndex !== null && (
              <div role="status" aria-live="polite"
                className="pointer-events-none absolute left-1/2 top-1 z-10 w-max max-w-full -translate-x-1/2 break-words rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-md">
                <p className="text-muted-foreground">{dayLabel(activeDay.date)}, {shortDate(activeDay.date)}</p>
                {isAllMetrics && activeOverlay ? <div className="mt-1 space-y-1"><p className="text-water">Water: {activeOverlay.water ?? "Not logged"}{activeOverlay.water !== null && `L · ${activeOverlay.water >= prefs.waterGoal / 1000 ? "Goal met" : "Below goal"}`}</p><p className="text-sleep">Sleep: {activeOverlay.sleep ?? "Not logged"}{activeOverlay.sleep !== null && `h · ${activeOverlay.sleep >= prefs.sleepGoal ? "Goal met" : "Below goal"}`}</p><p className="text-energy">Wind-down: {activeOverlay.windDown ?? "Not logged"}{activeOverlay.windDown !== null && `min · ${activeOverlay.feeling ?? "Feeling not recorded"}`}</p></div> : <><p className="mt-1 font-mono">{activeDay.value === null ? "No log" : `${activeDay.value}${unit}`} {!windDown && <span className="font-sans text-muted-foreground">/ {goal}{unit}</span>}</p>
                <p className={activeDay.met ? "mt-1 text-trend-positive" : "mt-1 text-muted-foreground"}>{activeDay.value === null ? "Not logged" : windDown ? "Logged" : activeDay.met ? "Goal met" : "Below goal"}</p>
                 {windDown && activeDay.value !== null && <p className="mt-1 capitalize text-muted-foreground">Feeling: {activeDay.feeling ?? "not recorded"}</p>}</>}
              </div>
            )}
            </div>
            {/* === SECTION: Metric & Goal Legends === */}
            {isAllMetrics && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs font-medium text-muted-foreground">{[["Water (L)", "var(--water)"], ["Sleep (h)", "var(--sleep)"], ["Wind-down (min)", "var(--energy)"]].map(([label, fill]) => <span key={label} className="flex items-center gap-1.5"><svg aria-hidden="true" viewBox="0 0 8 8" className="size-2 shrink-0"><circle cx="4" cy="4" r="4" fill={fill} /></svg>{label}</span>)}</div>}
            {!isAllMetrics && !windDown && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><svg aria-hidden="true" data-legend="goal-met" viewBox="0 0 8 8" className="size-2 shrink-0"><circle cx="4" cy="4" r="4" fill={color} /></svg>Goal met<svg aria-hidden="true" data-legend="below-goal" viewBox="0 0 8 8" className="ml-2 size-2 shrink-0"><circle cx="4" cy="4" r="4" fill={mutedColor} /></svg>Below goal</span>
              <span>Goal: <span className="font-mono text-foreground">{goal}{unit}</span></span>
            </div>}
          </motion.div>
        </TabsContent>
      </Tabs>
      {/* === SECTION: Wind-Down Paired Insights === */}
      {/* Both eligibility rings and the unlocked comparison derive from the same selected-range next-day pairs; this region owns no separate log state. */}
      <div className="mt-4 border-t border-border pt-4" aria-labelledby="trend-insight-heading">
        <h3 id="trend-insight-heading" className="flex items-center gap-2 text-sm font-medium"><Moon size={14} className="text-sleep" />Wind-down & sleep</h3>
        {insight.differenceMinutes === null ? (
          <div className="mt-3 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-medium">Not enough paired logs yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">A comparison needs at least two evenings with 15+ min wind-down and two shorter logged evenings, each followed by a next-day sleep log.</p>
            <PairedNightProgress longerCount={insight.longerCount} shorterCount={insight.shorterCount} />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Simulated sync values excluded.</p>
          </div>
        ) : (
          <>
            <PairedNightProgress longerCount={insight.longerCount} shorterCount={insight.shorterCount} />
            <p className="mt-3 text-base font-semibold leading-snug text-foreground">{windDownHeadline}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Based on {insight.longerCount} long wind-down nights vs. {insight.shorterCount} shorter nights ({trendNote}).</p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Simulated sync values excluded.</p>
          </>
        )}
      </div>
    </section>
  );
}