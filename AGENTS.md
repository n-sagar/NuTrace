<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use Framer Motion for welcome-screen orbit and CTA transforms, respecting reduced-motion preferences; keep visual values in global semantic CSS tokens.
- Keep dashboard targets derived from the same React preferences state saved through the shared preferences helper; this ensures profile edits update all trackers immediately without duplicating goal state.
- Subscribe dashboard preferences through the shared storage/local-event helper, use its default factory for absent preferences, and synchronize daily storage separately so cross-tab edits and session clearing stay consistent.
- Retain fourteen local-day snapshots in the shared history helper for two adjacent seven-day windows; archive on saves and rollover, compute analytics from current preferences, and compare logged-day averages only with a positive prior baseline, without inventing missing logs.
- Use identical semantic SVG fill tokens for weekly bars and legend dots so their colors stay matched in both metric views.
- Use local calendar dates for daily resets and weekly buckets so charts match the midnight countdown.

- Use shared Button controls, Radix dialog focus management and a single root main landmark; expose selection states and keep readable text/focus colors in semantic tokens.
- Store optional wind-down duration and mood in daily state and weekly snapshots; compare evenings to next-day manually logged sleep with sample counts, excluding simulated sync data, so insights do not imply causal or measured quality effects.
- Use a separate durable date-keyed momentum ledger for daily water-and-sleep attainment so fourteen-day chart pruning cannot erase earned protection; historical attainment uses goals at logging, current-day goal edits update its entry, and missed days are never fabricated logs.
- Calculate solar events with SunCalc only after hydration; request GPS explicitly and persist validated device-local location preferences, using timezone-aware estimated times for manual labels without implying city geocoding.
- Centralize timezone aliases and conservative fuzzy matching in a browser-safe helper; unknown or ambiguous cities must not overwrite the selected timezone.
- Derive chart ranges and next-day pair counts from retained local-day history; all-metric comparisons normalize each series to its selected-range peak and keep actual units in accessible details.
- Render paired-night counters and animated SVG rings through one shared presentation component using insight counts; this keeps both states consistent without inventing pairs or duplicating analytics state.
