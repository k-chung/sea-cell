// Golden replays: a few recorded bot runs. The test suite replays them and checks that the
// result is IDENTICAL. If it isn't, something changed how the game plays.
// - If you meant to change the rules or content: run `npm run golden:update` and commit.
// - If you didn't: you found a bug (or randomness leaking in from outside the seeded RNG).

import type { GameState } from '../src/core/index.ts';

export const GOLDEN_SEEDS = [101, 202, 303];

/** The parts of the final state a golden test compares. */
export function summarize(s: GameState) {
  return {
    turn: s.turn,
    phase: s.phase,
    budget: s.budget,
    public: s.public,
    congress: s.congress,
    prestige: s.prestige,
    milestones: s.milestones,
    rivalMilestones: s.rival.milestones,
    fallen: s.fallen.map((f) => f.name),
    outcome: s.outcome,
    rngState: s.rng.s,
  };
}
