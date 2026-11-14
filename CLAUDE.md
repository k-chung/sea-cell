# Sea Cell — guidance for Claude sessions

Design source of truth: the "Space Race Roguelike — Design Doc" (Claude Docs). Snapshot: docs/design-summary.md.

## How to talk to the owner
- Show rough progress as a percentage as you go (an estimate is fine).
- Be token-efficient: short updates, no repeated recaps, no unneeded file reads. Push back on requests
  that cost a lot for little value.
- Whenever you incorporate an idea (from Issues or chat), say so explicitly.
- Only narrate what's noteworthy, different, or progress. Don't announce routine steps (reading CLAUDE.md,
  checking Issues when there's nothing new, standard checks that pass). No boilerplate.
  (https://github.com/k-chung/sea-cell/issues/8)

## Ideas live in GitHub Issues (check FIRST, every session)
New idea: https://github.com/k-chung/sea-cell/issues/new?template=idea.md
Open ideas: https://github.com/k-chung/sea-cell/issues?q=is%3Aissue+is%3Aopen+label%3Aidea

1. At the START of every session, before anything else, list open issues labeled `idea`
   (`gh api "repos/k-chung/sea-cell/issues?labels=idea&state=open"`) and say in one line how many are new.
   If issues can't be listed (no GitHub access in this session), say so; never assume there are none.
2. Sort each idea against the design pillars and the scope test ("does it make the launch crisis
   more tense or meaningful?"). A braindump with several thoughts: split it in your comment and sort each.
   - accepted -> add it to the design doc (Decisions, Scope "Next", or Open questions), relabel
     `idea: accepted`, comment where it went, close it.
   - parked -> add it to the design doc's Parking lot, relabel `idea: parked`, close it.
   - unclear, or it changes how the game plays or feels -> ask the owner before deciding; leave it open.
   - rejected -> only with the owner's OK; relabel `idea: rejected`, comment a one-line reason, close it.
3. The owner's ideas outrank Claude's own suggestions. If an idea conflicts with an earlier decision,
   flag the conflict and ask; never silently pick one.
4. Never edit or delete the text of the owner's issues: only comment, label and close.
5. Log any decision an idea causes in docs/decisions.md, with the issue link.
6. Playtest notes (N key) and run reports pasted into issues can be replayed via the dev panel.

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
Build the current version's scope only (see docs/design-summary.md). New ideas arrive as GitHub Issues and are sorted (see "Ideas live in GitHub Issues").

## Design for change (top priority)
The owner expects to say "this direction sucks" and change things, from small details to big systems.
The code must be easy for a human to debug and maintain, and cheap to change.

Human-debuggable
- Small files with one job each; small functions with descriptive names; no metaprogramming or magic.
- State is plain data a person can read in the dev panel or a JSON export.
- Fail loudly with helpful messages: a bad content file names the file, the entry and the field.
- Prefer obvious code over clever code, and a little duplication over the wrong abstraction.

Cheap to change
- Tuning numbers, text and content live in data files, never hard-coded in rules.
- Each system (factions, rival, crew, cards, events, map) is a module behind a small interface,
  switched on or off by the ruleset. Replacing one should not touch the others.
- Keep seams, not frameworks: don't build generic machinery for features that don't exist yet.
- Delete abandoned code; don't comment it out. Git history and tags keep it.

When the direction changes (pivot)
1. Tag the current build so it stays playable (e.g. v0.1-before-pivot).
2. Log the change and the reason in docs/decisions.md.
3. Update the design doc; move dropped ideas to the parking lot, never just delete them.
4. Change on a branch; if the new direction fails, the old one is one merge away.

Adding ideas later
- New ideas are welcome. They arrive as GitHub Issues labeled `idea`, then get sorted.
- An idea gets built once the current version is fun and the idea fits the design pillars.
  "Not now" means parked, not rejected.

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
- Screens get E2E smoke tests (Playwright clicks through start, launch, crisis, reward, win/lose)
  and a scene gallery: a dev-only page that renders every screen in every state from saved
  game states, so a person can eyeball all of them at once. Logic stays in core and is unit-tested.
- After an INTENDED rules/content change, re-record golden replays with `npm run golden:update`.
  An unexpected golden failure is a bug (often randomness not going through the seeded RNG).
- Balance changes: run `npm run bot` before and after and note the numbers in docs/decisions.md.

## Ending a session (the owner works whenever inspiration strikes)
- Leave `main` playable: merged or in an open PR that passes CI.
- Update the "Status and next up" block at the top of the design doc: what's done, what's in progress,
  the next 3 things, "Ideas sorted this session: N", and links to ideas still waiting on the owner.
- Republish the hosted playable build if the game changed (`npm run build:single`).

## Look and feel (chosen 2026-11-14)
- Mission Control CRT: green phosphor terminal, one fixed console screen (stacked on phones).
- Charm from small pixel sprites (crew, rockets, rival) defined as text pixel maps in content files.
- Motion focused on flights; sound effects off by default; respect prefers-reduced-motion.
- Show, don't tell: meters, icons and short labels over sentences and number lists.

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
