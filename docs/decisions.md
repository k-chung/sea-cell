# Decision log

One entry per meaningful design or tech decision: date, decision, why. Newest first.

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
