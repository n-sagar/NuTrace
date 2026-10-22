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
- Keep seven-day snapshots in the shared local history helper, archive daily state on saves and rollover, and compute analytics from current preferences; this preserves the existing local prototype without inventing past logs or duplicating targets.
- Use local calendar dates for daily resets and weekly buckets so charts match the midnight countdown.
