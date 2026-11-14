// Content types: the shape of every piece of game data (parts, missions, events, crew traits...).
// Content files only hold data. Game rules live in src/core and read these shapes.

export type Slot = 'booster' | 'upper' | 'payload';
export type Fuel = 'kerolox' | 'hydrolox' | 'hypergolic' | 'solid' | 'none';
export type PayloadKind = 'satellite' | 'lunarProbe' | 'capsule' | 'lunarCapsule' | 'lunarLander';

/** A rocket part card. */
export interface PartDef {
  id: string;
  name: string;
  slot: Slot;
  fuel: Fuel;
  /** Lift this part adds to the rocket (boosters and upper stages). */
  lift: number;
  /** Chance (0-100) that the phases this part handles go smoothly. */
  reliability: number;
  cost: number;
  /** Payloads only: what kind of payload it is. */
  payloadKind?: PayloadKind;
  /** Payloads only: how many astronauts it carries. */
  crewSeats?: number;
  startsUnlocked: boolean;
  description: string;
}

/** The stages a mission flies through. Each phase is handled by one part slot. */
export type FlightPhase = 'launch' | 'orbit' | 'rendezvous' | 'eva' | 'transfer' | 'landing' | 'reentry';

export interface MilestoneDef {
  id: string;
  name: string;
  /** How much work the rival needs to reach this milestone. Rival works through milestones in list order. */
  rivalEffort: number;
}

export interface MissionDef {
  id: string;
  name: string;
  /** The milestone this mission achieves. Two missions can share a milestone (different routes). */
  milestone: string;
  /** Milestones the player must already have. */
  requires: string[];
  liftNeeded: number;
  payloadKinds: PayloadKind[];
  crewNeeded: number;
  phases: FlightPhase[];
  prestige: number;
  description: string;
}

export type Skill = 'piloting' | 'repair' | 'nerve' | 'charm';

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  /** Crisis options tagged with this skill get the bonus. */
  skill: Skill;
  skillBonus: number;
  /** Extra odds on every crisis option. */
  allOddsBonus?: number;
  /** Extra public support when a mission with this astronaut succeeds. */
  successPublic?: number;
}

/** A requirement that unlocks a "blue option" in a crisis. */
export type Requirement =
  | { trait: string }
  | { fuel: Fuel }
  | { personnel: string }
  | { favor: string };

/**
 * How a crisis option ends the mission.
 * - success: mission objective achieved
 * - abort: crew safe, objective not achieved
 * - lost: vehicle lost, crew (if any) escape
 * - disaster: vehicle and crew lost
 */
export type MissionResult = 'success' | 'abort' | 'lost' | 'disaster';

export interface Outcome {
  result: MissionResult;
  text: string;
  public?: number;
  congress?: number;
  budget?: number;
  prestige?: number;
}

export interface EventOption {
  text: string;
  /** Chance (0-100) of the success outcome. 100 means certain. */
  odds: number;
  skill?: Skill;
  /** Blue option: only shown when the requirement is met. */
  requires?: Requirement;
  onSuccess: Outcome;
  /** Required unless odds is 100. */
  onFailure?: Outcome;
}

export interface EventDef {
  id: string;
  title: string;
  /** Text may use {commander}, replaced with the lead astronaut's name. */
  text: string;
  /** Phases this crisis can happen in. 'any' = fallback for any phase. */
  phases: FlightPhase[] | 'any';
  severity: 'major' | 'minor';
  /** true = crewed flights only, false = uncrewed only, 'any' = both. */
  crewed: boolean | 'any';
  options: EventOption[];
}

/** Key people you can recruit as rewards. Each gives a passive bonus. */
export interface PersonnelDef {
  id: string;
  name: string;
  title: string;
  description: string;
  boosterReliability?: number;
  upperReliability?: number;
  payloadReliability?: number;
  crisisOdds?: number;
  income?: number;
  /** Multiplies the cost of test flights (0.5 = half price). */
  testFlightCostMultiplier?: number;
}

/** Political favors. Instant ones apply once; held ones unlock blue options until used. */
export interface FavorDef {
  id: string;
  name: string;
  description: string;
  instant?: { budget?: number; public?: number; congress?: number };
}

/** Every tunable number in one place. See src/content/balance.ts. */
export interface Balance {
  startYear: number;
  turns: number;
  startBudget: number;
  startPublic: number;
  startCongress: number;
  startCrew: number;
  baseIncome: number;
  incomePerCongress: number;
  handSize: number;
  minorCrisisChance: number;
  reliabilityPerFlight: number;
  maxFlightBonus: number;
  reliabilityCap: number;
  sameFuelBonus: number;
  liftMarginForBonus: number;
  liftMarginBonus: number;
  testFlightCost: number;
  testFlightBonus: number;
  redundancyCost: number;
  veteranFlights: number;
  veteranBonus: number;
  oddsFloor: number;
  oddsCeiling: number;
  firstPublic: number;
  firstCongress: number;
  repeatPublic: number;
  rivalFirstMultiplier: number;
  abortPublic: number;
  lostPublic: number;
  lostCongress: number;
  disasterPublic: number;
  disasterCongress: number;
  injuryTurns: number;
  idlePublic: number;
  rivalShockPublic: number;
  rivalShockCongress: number;
  rivalSpeed: number;
  rivalVariance: number;
  rivalIntelErrorChance: number;
  researchCost: number;
  researchChoices: number;
  prCost: number;
  prPublic: number;
  lobbyCongress: number;
  lobbyPublic: number;
  recruitCost: number;
  rewardChoices: number;
}

export interface Content {
  parts: PartDef[];
  milestones: MilestoneDef[];
  missions: MissionDef[];
  traits: TraitDef[];
  events: EventDef[];
  personnel: PersonnelDef[];
  favors: FavorDef[];
  astronautNames: string[];
}

/** A ruleset = which content + which numbers. Prototype variants are different rulesets. */
export interface Ruleset {
  id: string;
  name: string;
  /** The final milestone. Reaching it wins; the rival reaching it first loses. */
  goalMilestone: string;
  content: Content;
  balance: Balance;
}
