# NuTrace location and trend insights

- Add a small, keyboard-accessible location popover with explicit GPS permission and manual city/timezone entry. Save preferences on this device, restore after reload, and display “Hyper-local (GPS)” or “Manual / Estimated”.
- Use actual solar calculations for GPS. Manual timezone entries use clearly labeled 6am/6pm estimates in the selected timezone; city is a descriptive label, not an unverified geographic lookup.
- Preserve both wind-down minutes and feeling in daily history and expose feelings in chart tooltips and the accessible daily table.
- Add a concise insight below the chart comparing sleep logged the day after evenings with at least 15 wind-down minutes versus shorter logged evenings. Require multiple observations in both groups, show sample counts, and distinguish association from causation. Show an honest insufficient-data state otherwise.

## Technical details
- Extend the existing browser-local location and weekly helpers, keeping hydration-safe reads and SunCalc calculations.
- Keep existing goal calculations, water logs, and fourteen-day retention unchanged. Add focused tests for persistence, timezone estimates, archived mood, and next-day pairing; verify the full dashboard flow and mobile layout.