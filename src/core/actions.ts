// Actions: every decision a player can make. A whole run = a seed + a list of these.
// The UI only ever changes the game by sending one of these to step().

import type { RocketChoice } from './state.ts';

export type ProgramAction = 'research' | 'lobby' | 'pr' | 'recruit' | 'wait';

export type Action =
  | {
      type: 'launch';
      missionId: string;
      rocket: RocketChoice;
      crewIds: string[];
      testFlight: boolean;
      redundancy: boolean;
    }
  | { type: 'program'; program: ProgramAction }
  | { type: 'chooseOption'; index: number }
  | { type: 'chooseReward'; index: number } // -1 = skip
  | { type: 'continue' }
  | { type: 'dev'; command: 'forceEvent'; eventId: string }
  | { type: 'dev'; command: 'addBudget'; amount: number };
