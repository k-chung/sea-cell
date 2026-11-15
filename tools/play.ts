// Play one full run with the bot. Shared by the balance bot and the golden-replay recorder.

import type { Ruleset } from '../src/content/types.ts';
import { type Action, createGame, type GameState, step } from '../src/core/index.ts';
import { botAction } from './bot.ts';

export interface BotRun {
  seed: number;
  actions: Action[];
  final: GameState;
  launches: number;
  crises: number;
}

export function playBotRun(r: Ruleset, seed: number, storyMode = false): BotRun {
  let s = createGame(r, seed, { storyMode });
  const actions: Action[] = [];
  let launches = 0;
  let crises = 0;
  let crisisThisFlight = false;
  for (let guard = 0; s.phase !== 'over'; guard++) {
    if (guard > 2000) throw new Error(`Bot run ${seed} did not finish`);
    const action = botAction(s, r);
    s = step(s, r, action);
    actions.push(action);
    // A mission "had a crisis" if any crisis came up between its launch and its end.
    if (action.type === 'launch') {
      launches++;
      crisisThisFlight = false;
    }
    if (s.phase === 'crisis' && !crisisThisFlight) {
      crisisThisFlight = true;
      crises++;
    }
  }
  return { seed, actions, final: s, launches, crises };
}
