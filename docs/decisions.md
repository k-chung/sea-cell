# Decision log

One entry per meaningful design or tech decision: date, decision, why. Newest first.

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
