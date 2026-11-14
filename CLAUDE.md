# Sea Dragon — guidance for Claude sessions

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
