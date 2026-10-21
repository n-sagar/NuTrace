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
