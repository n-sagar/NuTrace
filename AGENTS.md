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
