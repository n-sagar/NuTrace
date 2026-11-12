# NuTrace Water & Sleep Tracker

NuTrace is a React application using TanStack Start/Router, Tailwind CSS and shared Radix-based UI controls. Habit data and preferences are device-local; there is no connected backend. The Apple Health toggle currently displays simulated sync values, not a real integration.

## App flow and code map

| Entry | Responsibility |
| --- | --- |
| `src/routes/__root.tsx` | Document shell, query provider, single main landmark, toast host and error recovery. |
| `src/routes/index.tsx` | Orbital welcome screen linking to setup or dashboard. |
| `src/routes/onboarding.tsx` | Draft profile and baseline goals; saves preferences before entering the dashboard. |
| `src/routes/dashboard.tsx` | Live/demo state coordination, daily rollover, inline water/sleep cards and dialog callbacks. |
| `src/components/WeeklyTrends.tsx` | Metric/range selection, interactive charts, accessible tables and wind-down/sleep insights. |
| `src/components/PairedNightProgress.tsx` | Shared paired-night counters and SVG rings; receives derived analytics counts. |
| `src/components/ProfileModal.tsx` | Parent-controlled goal edits and account actions with contained keyboard focus. |
| `src/components/WindDownDrawer.tsx` | Draft evening duration/feeling; returns a daily-log patch on Save. |
| `src/components/CircadianPill.tsx` | Saved location selection, GPS requests and solar/estimated-time countdowns. |
| `src/components/TimezoneCombobox.tsx` | Searchable timezone choices; selected value remains parent-controlled. |
| `src/components/MomentumShield.tsx` | Ledger-derived protection and milestone presentation. |
| `src/components/CustomGoalRow.tsx` | Reusable numeric goal draft editor; caller clamps and saves. |
| `src/components/QuickAddButton.tsx`, `AnimatedNumber.tsx` | Presentation-only hydration interaction and number animations. |
| `src/components/ui/` | Shared design-system primitives rather than habit-specific state. |

## State and persistence boundaries

- `src/lib/prefs.ts`: shared profile/goal defaults, validation, saving and local/cross-tab notifications. Goal edits change targets, not logged amounts.
- `src/lib/daily.ts`: current local-day logs, audio cues and save/archive coordination.
- `src/lib/weekly.ts`: fourteen-day retained snapshots, summaries and evening-to-next-day sleep pairs; missing logs remain missing and simulated sync sleep is excluded from insights.
- `src/lib/trend-ranges.ts`: selected date windows, normalized overlay values and sample-confidence labels.
- `src/lib/momentum.ts`: durable date-keyed attainment ledger, separate from pruned chart history.
- `src/lib/circadian.ts`, `timezones.ts`: validated device-local location settings, solar estimates and conservative city/timezone matching.
- `src/lib/demo.ts`: populated fixture factory. The dashboard holds demo edits only in memory and passes history/momentum overrides to views; switching back restores live state without overwriting storage.

Water and sleep cards are deliberately documented as inline dashboard sections, not standalone components. The paired-insight copy also remains in `WeeklyTrends`; only ring presentation is shared. Page/feature headers describe ownership, and `SECTION` JSX comments mark major regions. Local names distinguish live state, active display state, draft goals and chart selection; public props, storage keys and route paths remain unchanged.

## Development checks

```sh
bun install
bun run dev
bun run test
```

Tests live in `src/test/` and cover preferences, daily caps, live/demo isolation, history, pairing, location handling and accessible interactions. Route files own their content metadata; `src/routeTree.gen.ts` is generated and should not be edited. See `AGENTS.md` for architecture constraints and `roadmap.md` for tracked work.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b26a0ea9-b596-4aec-878f-5bab23c4930c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Use Bun for project dependency management and the scripts in `package.json` for local development.
