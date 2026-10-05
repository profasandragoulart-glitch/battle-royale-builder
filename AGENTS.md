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

## Architecture
- Game netcode uses Realtime broadcast channels (lobby presence + one channel per match); each client is authoritative for its own player and for damage it receives, and the lobby host simulates bots. Why: no game server available on edge runtime.
- Player stats only change through the `record_match` security-definer RPC; clients may only update `username`. Why: prevent stat tampering via direct table writes.
- Canvas colors are read from `--game-*` CSS tokens in src/styles.css. Why: keep all colors in the design system.
