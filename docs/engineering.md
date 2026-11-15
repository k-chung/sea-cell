# Engineering details

## Design for change
The owner expects to change direction often, from small details to whole systems.
- Small files with one job; descriptive names; no metaprogramming. Obvious over clever; a little duplication
  over the wrong abstraction.
- State is plain data, readable in the dev panel or a JSON export.
- Fail loudly: content errors name the file, the entry and the field (`src/core/validateContent.ts`).
- Numbers, text and content live in data files, never hard-coded in rules.
- Save files carry a version; add a migration (or a clear "can't load" message pre-1.0) when state changes.
- "Not now" means parked, not rejected: keep seams so parked ideas can plug in later.

## Testing
- **Unit tests** (`npm test`, `tests/*.test.ts`): core rules; golden replays (`tests/golden/`) must replay exactly.
- **E2E tests** (`npm run e2e`, `tests/e2e/`): Playwright plays the built game: full run, scene gallery, phone width.
- **Scene gallery** (`/gallery.html` in dev): every screen in a known state on one page.
- **Fixed runs**: `?seed=123` on the game URL.
- **Balance**: `npm run bot` before and after a balance change; note the numbers in `docs/decisions.md`.

## Debugging
- A bug report = seed + action log; it must replay deterministically (dev panel: copy/load run report).
- Keep the dev panel working: state view, seed, action log, jump to turn, force a crisis, balance sliders.

## Devices and accessibility (baseline)
Desktop first, never broken on a phone. Never color-only information. Every action keyboard-reachable.
Text scales. Respect prefers-reduced-motion. Sound off by default.

## Look (decided in Module 3)
Timeless across eras; references: FTL, Dungeon of the Endless, Game Dev Tycoon (cute, simple, cutaway views).
All art goes through `src/ui/art.ts`; current pixel sprites are placeholders.
