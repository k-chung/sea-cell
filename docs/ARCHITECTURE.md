# Architecture map

Read this first; open only the files your task touches.

```
src/content/            DATA ONLY (no logic)
  types.ts              shapes of all content (parts, missions, events, eras, rulesets, balance)
  rulesets.ts           era content + balance + goal = a playable ruleset
  common/crew.ts        astronaut traits and names (shared by eras)
  art/pixel-sprites.ts  placeholder pixel art as text maps
  eras/space-race/      one era = one content pack: parts, programs (cards), missions, events, people, balance
src/core/               PURE RULES (no DOM, no deps); public API in index.ts
  step.ts               the only way the game changes: step(state, action) -> state
  state.ts, actions.ts  game state and every player action
  create.ts, replay.ts  new runs; rebuild a run from seed + actions
  turn.ts               turn flow, rewards, win/lose
  cards.ts              the card system: dealing the offer, costs, playing cards, effect kinds
  flight.ts             launching, phase rolls, crises, results
  rocket.ts, crisis.ts  launch preview math; crisis options and odds
  rival.ts, astronauts.ts, rng.ts, lookup.ts, validateContent.ts, calendar.ts
src/ui/                 SCREENS (no rules; replaceable)
  main.tsx              mounts the Preact app
  app.tsx               app shell: screen switching, keyboard, notes, sound, dev panel
  session.ts            a run: new/load/apply action/save/reports (no UI code)
  screens/              plan.tsx (cards + mission builder), flight.tsx (crisis, report), misc.tsx
  art.tsx               every visual asset by name: the swap point for the art style
  draft.ts, devPanel.tsx, gallery.tsx, storage.ts, sound.ts, ruleset.ts, styles.css
tools/                  balance bot, golden replay recorder, simple AI player, single-file build
tests/                  unit tests + golden replays; tests/e2e = Playwright
docs/                   decisions.md (why), workflow.md, engineering.md, design-summary.md
```

Adding an era: copy `src/content/eras/space-race/` to a new folder, change the data, add a ruleset in
`src/content/rulesets.ts`. No core or UI changes needed for content-only differences.
