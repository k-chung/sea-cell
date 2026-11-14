// Replays: rebuild a run from its seed and action log. Used for saves, bug reports,
// "jump to turn" in the dev panel, and golden tests.

import type { Ruleset } from '../content/types.ts';
import type { Action } from './actions.ts';
import type { GameOptions, GameState } from './state.ts';
import { createGame } from './create.ts';
import { step } from './step.ts';

export interface RunRecord {
  rulesetId: string;
  seed: number;
  options: GameOptions;
  actions: Action[];
}

export function replay(r: Ruleset, run: RunRecord): GameState {
  let s = createGame(r, run.seed, run.options);
  run.actions.forEach((action, i) => {
    try {
      s = step(s, r, action);
    } catch (err) {
      throw new Error(`Replay failed at action ${i + 1} (${action.type}): ${(err as Error).message}`);
    }
  });
  return s;
}

/** How many actions to keep to land at the start of the given turn (for "jump to turn"). */
export function actionsUntilTurn(r: Ruleset, run: RunRecord, turn: number): Action[] {
  let s = createGame(r, run.seed, run.options);
  const kept: Action[] = [];
  for (const action of run.actions) {
    if (s.turn >= turn && s.phase === 'plan') break;
    s = step(s, r, action);
    kept.push(action);
  }
  return kept;
}
