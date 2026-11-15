# Sea Cell — rules for Claude sessions

Space-program roguelike. Design source of truth: the "Space Race Roguelike — Design Doc" (Claude Docs).
Code map: `docs/ARCHITECTURE.md`. Read other docs only when the task needs them:
`docs/workflow.md` (ideas, PRs, sessions) · `docs/engineering.md` (testing, accessibility, design-for-change details).

## Every session
1. First, list open `idea` issues: `gh api "repos/k-chung/sea-cell/issues?labels=idea&state=open"`.
   Mention them only if there are new ones (or if Issues can't be reached). Sort them per `docs/workflow.md`.
2. Work one module/feature per branch + PR. `main` must always build and play. The owner merges.
3. Before ending: CI-green PR, "Status and next up" in the design doc updated at module ends.

## Talking to the owner
- Show rough progress as a percentage. Narrate only what's noteworthy, different, or progress; no boilerplate.
- Say explicitly when you incorporate an idea (from Issues or chat).
- Warn about questionable design choices and say how to mitigate them. Push back on costly, low-value asks.
- End every response with an easy way to give feedback: reply in chat, or a new idea issue
  (https://github.com/k-chung/sea-cell/issues/new?template=idea.md).
- Decide small, ask big: ask before anything that changes how the game plays or feels, or expands scope.
  The owner's ideas outrank yours; flag conflicts with earlier decisions instead of picking silently.

## Code rules (do not break)
- Layers, one direction: `src/content` (data only) -> `src/core` (pure rules, no DOM, no deps) -> `src/ui`.
- `step(state, action) -> state` is the only way the game changes. All randomness via the seeded RNG in state.
  Same seed + same actions = same result.
- Content is data per era: `src/content/eras/<era>/`. Tuning numbers live in the era's `balance.ts`.
- Systems are small modules switched on/off by the ruleset. Seams, not frameworks: build for features that exist.
- Art goes through `src/ui/art.ts` only (named pieces like crew portrait, rocket), so the style can be swapped.
- Plain, well-named code; a header comment per file; comment WHY. Small files. Delete dead code.
- Minimal deps, each justified in `docs/decisions.md`. TypeScript strict. Biome lint/format must pass.
- Edit files with targeted changes; avoid rewriting whole files.

## Done means
Unit tests + golden replays pass (`npm test`), E2E passes (`npm run e2e`), `npm run lint` clean,
CHANGELOG.md and docs/decisions.md updated. Re-record goldens only after an intended rules change
(`npm run golden:update`); an unexpected golden failure is a bug.
