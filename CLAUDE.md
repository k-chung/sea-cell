# Sea Cell — guidance for Claude sessions

Design source of truth: the "Space Race Roguelike — Design Doc" (Claude Docs). Snapshot: docs/design-summary.md.

## Architecture rules (do not break)
- Three layers, one direction: content -> core -> ui.
  - src/content/: plain data (parts, events, traits, factions, doctrines, milestones), validated on load. No logic.
  - src/core/: pure TypeScript rules engine. No DOM, no browser APIs, no third-party deps.
    `step(state, action) -> state`. All randomness comes from the seeded RNG in state.
    Same seed + same action log must give the same result.
  - src/ui/: reads state, dispatches actions. Holds no game rules. Replaceable.
- Systems (factions, rival, crew, cards, events) are separate modules behind small interfaces.
- Prototype variants are rulesets (configs that pick content + optional systems), not forks of the code.
  Larger experiments go on their own git branch.
- Save files carry a version number; add a migration when state shape changes.
- Keep deps minimal; TypeScript strict mode.

## Debugging
- A bug report = seed + action log; it must replay deterministically.
- Keep the dev panel working (state view, seed, action log, jump to turn, force event).
- Core rules get unit tests; the balance bot runs on core only.

## Scope
Build v1 only (see docs/design-summary.md). New ideas go to the design doc's parking lot unless they make the launch crisis more tense or meaningful.

## Working agreements
- **Owner's code level:** comfortable with scripting (PowerShell). Write plain, well-named code; a short header
  per file saying what it's for; comment WHY on anything non-obvious. No clever tricks.
- **Workflow:** one branch + pull request per feature; `main` must always build and play. The owner merges.
- **Autonomy:** decide small, ask big. Make implementation and minor design calls yourself (log them in
  docs/decisions.md). Ask before anything that changes how the game plays or feels, or expands scope.
- **Versions:** tag each playable milestone (v0.1 "cell", v0.2 ...) with a plain-English CHANGELOG.md entry.
- **Dependencies:** core has zero. UI/tooling only well-known, maintained libraries, each justified in
  docs/decisions.md.

## Definition of done (every feature)
1. Core tests pass and golden replays match.
2. Run it in a real browser (Playwright): no console errors, screenshot checked.
3. CHANGELOG.md and docs/decisions.md updated.
4. Design doc updated (v1 checklist / decisions table reflect reality).

## Testing
- Unit tests on core rules; saved "golden" runs (seed + action log) must replay identically.
- UI is tested by playing, plus the browser check above.

## Tuning and feedback
- All balance numbers live in one readable balance data file. Dev panel has live sliders with "export to file".
- In-game note button/hotkey saves a feedback note with seed, turn, action log and state attached,
  exportable as a report Claude can replay.

## Devices and accessibility (baseline from day one)
- Desktop first (mouse/keyboard); layout must not break on a phone.
- Never color-only information: odds, status, factions always also have text or icons.
- Every action is keyboard-reachable.
- Text scales; the CRT look gets a "clean" toggle.
- Respect prefers-reduced-motion for animation and flicker.
