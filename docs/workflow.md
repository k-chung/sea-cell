# Workflow

## Ideas (GitHub Issues)
New idea: https://github.com/k-chung/sea-cell/issues/new?template=idea.md ·
Open ideas: https://github.com/k-chung/sea-cell/issues?q=is%3Aissue+is%3Aopen+label%3Aidea

Sort each open `idea` issue against the design pillars and the scope test ("does it make the launch crisis
more tense or meaningful?"). Split braindumps in a comment and sort each part.
- **accepted**: add to the design doc (Decisions, Scope "Next", or Open questions); relabel `idea: accepted`;
  comment where it went; close.
- **parked**: add to the design doc's Parking lot; relabel `idea: parked`; close.
- **unclear, or changes how the game plays/feels**: ask the owner; leave open.
- **rejected**: only with the owner's OK; relabel `idea: rejected` with a one-line reason; close.
Never edit or delete the owner's issue text. Log decisions an idea causes in `docs/decisions.md` with the link.
Playtest notes (N key) pasted into issues can be replayed in the dev panel ("Load and replay").

## Branches, PRs, versions
- One module/feature per branch + PR; `main` always builds and plays; the owner merges.
- Each playable milestone gets a CHANGELOG.md entry and its own hosted link. No git tags (dropped 2026-11-15:
  friction without value; hosted links + merged PRs already preserve every version).
- Pivots: keep the current build's hosted link, log why in `docs/decisions.md`, update the design doc (dropped ideas go to
  the Parking lot), build the new direction on a branch.

## Ending a session / module
- Leave `main` playable: merged, or an open PR with green CI.
- At module ends: update "Status and next up" in the design doc (done, in progress, next 3,
  "Ideas sorted this session: N", ideas waiting on the owner) and republish the hosted build
  (`npm run build:single`, published to a new path per version so older versions stay playable).
