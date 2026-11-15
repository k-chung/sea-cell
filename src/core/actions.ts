// Actions: every decision a player can make. A whole run = a seed + a list of these.
// The UI only ever changes the game by sending one of these to step().

import type { RocketChoice } from './state.ts';

export type Action =
  | {
      type: 'launch';
      missionId: string;
      rocket: RocketChoice;
      crewIds: string[];
      testFlight: boolean;
      redundancy: boolean;
    }
  /** Play a card from the offer (index into state.offer). */
  | { type: 'playCard'; index: number }
  /** End the planning phase without launching. */
  | { type: 'endTurn' }
  /** Flight: spend one margin point on the current phase. */
  | { type: 'spendMargin' }
  /** Flight: an astronaut uses their once-per-flight ability on the current phase. */
  | { type: 'useAbility'; crewId: string }
  /** Flight: roll the current phase. */
  | { type: 'proceed' }
  | { type: 'chooseOption'; index: number }
  | { type: 'chooseReward'; index: number } // -1 = skip
  | { type: 'continue' }
  | { type: 'dev'; command: 'forceEvent'; eventId: string }
  | { type: 'dev'; command: 'addBudget'; amount: number };
