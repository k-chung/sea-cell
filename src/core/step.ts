// step(): the ONE way the game changes. Takes a state and an action, returns a new state.
// The input state is never modified (we work on a copy), so any past state can be kept and compared.
// Invalid actions throw an Error explaining why.

import type { Ruleset } from '../content/types.ts';
import type { Action } from './actions.ts';
import { playCard } from './cards.ts';
import { chooseOption, launch, proceed, spendMargin, useAbility } from './flight.ts';
import { getEvent } from './lookup.ts';
import type { GamePhase, GameState } from './state.ts';
import { chooseReward, continueAfterReport, endTurn } from './turn.ts';

function expectPhase(s: GameState, phase: GamePhase, action: Action): void {
  if (s.phase !== phase) {
    throw new Error(`Action "${action.type}" needs phase "${phase}", but the game is in "${s.phase}"`);
  }
}

export function step(state: GameState, r: Ruleset, action: Action): GameState {
  if (state.rulesetId !== r.id) throw new Error(`State is for ruleset "${state.rulesetId}", not "${r.id}"`);
  const s = structuredClone(state);

  switch (action.type) {
    case 'launch':
      expectPhase(s, 'plan', action);
      launch(s, r, action);
      break;
    case 'playCard':
      expectPhase(s, 'plan', action);
      s.report.push(playCard(s, r, action.index));
      break;
    case 'endTurn':
      expectPhase(s, 'plan', action);
      endTurn(s, r, []);
      break;
    case 'spendMargin':
      expectPhase(s, 'flight', action);
      spendMargin(s, r);
      break;
    case 'useAbility':
      expectPhase(s, 'flight', action);
      useAbility(s, r, action.crewId);
      break;
    case 'proceed':
      expectPhase(s, 'flight', action);
      proceed(s, r);
      break;
    case 'chooseOption':
      expectPhase(s, 'crisis', action);
      chooseOption(s, r, action.index);
      break;
    case 'chooseReward':
      expectPhase(s, 'reward', action);
      chooseReward(s, r, action.index);
      break;
    case 'continue':
      expectPhase(s, 'report', action);
      continueAfterReport(s, r);
      break;
    case 'dev':
      if (action.command === 'forceEvent') s.forcedEventId = getEvent(r, action.eventId).id;
      if (action.command === 'addBudget') s.budget += action.amount;
      break;
  }
  return s;
}
