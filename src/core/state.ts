// GameState: everything about a run, as plain data. You can read it in the dev panel (press `).
// If you change the shape of this state, bump STATE_VERSION (saves are action logs, so old saves
// simply replay; a version bump tells the UI an old save may not replay cleanly).

import type { RngState } from './rng.ts';
import type { MissionResult } from '../content/types.ts';

export const STATE_VERSION = 1;

/** Which screen the run is on. */
export type GamePhase =
  | 'plan' // choose a mission (and build a rocket) or a program action
  | 'crisis' // a crisis card is waiting for a choice
  | 'reward' // pick 1 of N rewards (after a first, or from research)
  | 'report' // what happened this turn; press continue
  | 'over'; // run ended

export interface Astronaut {
  id: string;
  name: string;
  traitId: string;
  flights: number;
  status: 'ready' | 'injured' | 'dead';
  /** Turns until an injured astronaut is ready again. */
  injuredTurns: number;
}

export interface RocketChoice {
  booster: string;
  upper: string;
  payload: string;
}

export interface FlightState {
  missionId: string;
  rocket: RocketChoice;
  crewIds: string[];
  testFlight: boolean;
  redundancy: boolean;
  /** Text lines describing each phase as it was flown. */
  lines: string[];
  /** Set while a crisis is waiting for a decision. */
  crisis: { eventId: string; phase: string } | null;
}

export type RewardChoice =
  | { kind: 'personnel'; id: string }
  | { kind: 'part'; id: string }
  | { kind: 'favor'; id: string };

export interface GameOptions {
  /** Story mode: astronauts are injured instead of killed. */
  storyMode: boolean;
}

export interface GameState {
  version: number;
  rulesetId: string;
  seed: number;
  options: GameOptions;
  rng: RngState;

  turn: number; // 0-based
  phase: GamePhase;

  budget: number;
  public: number;
  congress: number;
  prestige: number;

  unlockedParts: string[];
  /** Successful flights per part id; each makes the part more reliable. */
  partFlights: Record<string, number>;
  hand: string[];

  crew: Astronaut[];
  nextCrewNumber: number;
  personnel: string[];
  favors: string[];

  /** Milestones the player has reached: milestone id -> turn reached. */
  milestones: Record<string, number>;
  rival: {
    effort: number;
    milestones: Record<string, number>;
    /** What your intelligence thinks the rival is working on (may be wrong). */
    intelTarget: string | null;
    intelStage: 'early' | 'midway' | 'close' | null;
  };

  /** Did the player launch anything this turn? (No launch = public drifts down.) */
  launchedThisTurn: boolean;
  flight: FlightState | null;
  lastResult: MissionResult | null;
  /** Lines shown on the report screen. */
  report: string[];
  /** Pending reward after this turn's report (set when a new milestone is reached). */
  rewardPending: boolean;
  rewardChoices: RewardChoice[];
  /** Why the reward screen is open: a milestone reward, or a research pick. */
  rewardSource: 'milestone' | 'research' | null;

  /** All past report lines, newest last. */
  history: string[];
  fallen: { name: string; mission: string; turn: number }[];
  outcome: { won: boolean; reason: string } | null;

  /** Dev only: force this crisis on the next launch. */
  forcedEventId: string | null;
}
