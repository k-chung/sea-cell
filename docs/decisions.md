# Decision log

One entry per meaningful design or tech decision: date, decision, why. Newest first.

## 2026-11-15 — Module 1: cards and planning
- **No git tags** (owner): friction without value now; hosted links + merged PRs preserve versions.
- **Parts are acquired, not dealt per turn.** Part cards appear in the random offer; owned parts can always
  be used. Randomness moves to what you can get. Risk: too easy. Bot measured it: 99% wins at first, so
  acquiring costs 4x the part's flight cost (`partCostMultiplier`), base income 18 -> 12, rival speed
  1.25 -> 1.45. Bot now wins ~34% (v0.1 bot: ~15%). Placeholder until playtests.
- **Research/lobby/PR/recruit became cards**; the offer always includes at least one free card.
- **Effects are a fixed list** (budget, public, congress, prestige, actionsNextTurn, nextLaunchBonus,
  drawCards), each unit-tested, handled in `src/core/cards.ts`. No effect scripting.
- **Preact 10.29.8** (runtime dep, ~4 KB): components instead of HTML strings. Session logic lives in
  `src/ui/session.ts` (no UI code) so screens stay thin. State version 2: older saves won't load.

## 2026-11-15 — Pivot: card-based planning + flight loop (Module 0 groundwork)
Owner direction: inspiration narrowed to Slay the Spire/FTL (random cards for managerial choices, parts,
staff, astronauts) and The Last Stand/XCOM (planning phase, then a "combat" phase = the flight). Art must be
timeless across eras (refs: FTL, Dungeon of the Endless, Game Dev Tycoon); style decided in Module 3.
Replaces the CRT look decision (2026-11-14). v0.2 stays playable (hosted link; owner to tag).
Plan: Module 1 cards + planning phase (Preact UI), Module 2 phase-by-phase flights, Module 3 art.
Era framework (campaign select/unlocks) deferred until a second era exists.
- **Eras as content folders** (`src/content/eras/<era>/`): an era is a content pack; no per-item era field
  needed. Ruleset id renamed `cell` -> `space-race` (old saves won't load; goldens re-recorded).
- **Art layer** (`src/ui/art.ts`): screens ask for art by name, so pixel vs vector is a swap.
- **Biome 2.6.4** (dev-only): one tool for lint + format, runs in CI. Content data files are exempt from
  formatting (one-entry-per-line formatting doubled their size). CSS not linted (replaced in Module 1).
- **Slim CLAUDE.md** (~45 lines) with details in docs/workflow.md, docs/engineering.md,
  docs/ARCHITECTURE.md: fewer tokens loaded every session.

## 2026-11-14 — Quieter updates ([#8](https://github.com/k-chung/sea-cell/issues/8))
Claude narrates only noteworthy steps, differences and progress; routine steps go unmentioned. Saves tokens.

## 2026-11-14 — v0.2 build choices
- **UI-only animation, all CSS.** Log lines reveal with staggered delays; alarm shake and result stamps are
  keyframes. No timers in game logic, so replays and tests are unaffected; reduced-motion turns it all off.
- **Sprites are SVG built from text maps** (content/sprites.ts), colored by CSS tokens, so the theme controls them.
- **Sound is synthesized** with Web Audio: nothing to source or license; off by default.
- **New dev dependency: `@playwright/test` 1.63.0** for E2E tests (pinned to match the browser in the dev
  environment). CI installs Chromium and runs them.
- **One dark look only.** The CRT direction is deliberately dark; the light theme was dropped.

## 2026-11-14 — Ideas move to GitHub Issues
The design doc's inbox was hard to find (a hidden tab on phones). Ideas now go in as GitHub Issues
(template applies the `idea` label) and are sorted at the start of every session into accepted, parked or
rejected (rejected only with the owner's OK). The design doc stays the sorted source of truth.

## 2026-11-14 — v0.1 build choices
- **Saves are action logs, not state snapshots.** A save = seed + actions; loading replays it. Saves can't
  drift out of sync with the rules, and every save doubles as a bug report. Cost: if content changes,
  an old save may not replay (the game says so and starts fresh).
- **One crisis per mission, and it decides the mission.** The first failed phase triggers a major crisis;
  later phases aren't rolled. With no failure, a minor anomaly can still happen. Keeps the crisis the drama.
- **Crisis rate tuned to ~70%** via `minorCrisisChance: 0.7` (balance bot: 70.8% of missions).
- **Simple bot wins ~15%.** It plays safe and never plans ahead, so a person should do better. FTL-hard
  default; revisit after real playtests.
- **Blue options are hidden unless unlocked** (like FTL). Options whose best case still ends the mission
  are labeled, so "100%" on an abort isn't misleading.
- **Content as TypeScript data files, not JSON**: comments allowed, typos caught by the type checker,
  plus a validator that names the file, entry and field.
- **Dependencies:** dev-only `vite` (dev server and build), `vitest` (tests), `typescript`, `@types/node`.
  No runtime dependencies. Tools run with Node's built-in TypeScript support (no extra runner).
- **Rendering:** the whole screen re-renders from state after each action using HTML strings. Simple to
  follow and fast enough for a card game; can be swapped for a framework later without touching core.
- **Playtest notes use an in-page box** (not browser pop-ups), so they work when the game is hosted.

## 2026-11-14 — Design for change is the top priority
The owner expects frequent changes of direction, small and large. Code must stay human-debuggable and
cheap to change: data-driven tuning, swappable system modules, no speculative frameworks, delete dead code.
Pivots get a tag, a log entry and a doc update. New ideas are parked, not rejected. Another thing: if feasible, design this project so it's Claude token-efficient; not a requirement, but a nice to have.

## 2026-11-14 — Working agreements
Branch + PR per feature; decide small, ask big; tests on core + golden replays; tagged builds with a changelog;
minimal justified dependencies; desktop first, phone-tolerant; accessibility baseline (no color-only info,
keyboard play, scalable text, reduced motion). Why: the project will go through many prototype versions, so
it must stay easy to debug, revert and redirect.

## 2026-11-14 — Architecture: content -> core -> ui
Pure, deterministic rules engine (`step(state, action)`), content as data, replaceable UI, variants as
rulesets. Why: exact replays for debugging, cheap prototyping of different directions, and freedom to change
UI tech or wrap for desktop later.

## 2026-11-14 — Stack: TypeScript + Vite, plain HTML/CSS
Why: runs in any browser, easy to share, no engine lock-in; strict TypeScript catches mistakes early.

## 2026-11-14 — v1 scope
One doctrine (Saturn path), Moon race vs one fuzzy-visible rival, Public + Congress factions, hand of 5 part
cards into 3 slots, crisis on ~70% of missions, 6-month turns 1957–1970. Why: smallest version that tests
the core moment, the launch crisis. Everything else is parked until v1 is fun.

## 2026-11-14 — Codename "sea-cell"
Grows cell -> worm -> sea snake -> dragon as versions evolve.
