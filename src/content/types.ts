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

/** A crew ability: +bonus% to the current flight phase, once per flight, in the listed phases. */
export interface CrewAbility {
  name: string;
  bonus: number;
  phases: FlightPhase[] | 'any';
}

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  /** Crisis options tagged with this skill get the bonus. */
  skill: Skill;
  skillBonus: number;
  /** Extra odds on every crisis option. */
  allOddsBonus?: number;
  /** Once per flight, this astronaut can boost the current phase's odds. */
  ability?: CrewAbility;
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

/**
 * What a program card does. A FIXED, short list on purpose: each kind is applied in
 * src/core/cards.ts and has a unit test. Need something new? Add a kind there; don't invent a mini-language.
 */
export type Effect =
  | { kind: 'budget'; amount: number }
  | { kind: 'public'; amount: number }
  | { kind: 'congress'; amount: number }
  | { kind: 'prestige'; amount: number }
  /** Extra action points next turn (negative = fewer). */
  | { kind: 'actionsNextTurn'; amount: number }
  /** Added to every phase's reliability on the next launch (negative = worse). */
  | { kind: 'nextLaunchBonus'; amount: number }
  /** Deal this many extra cards into the current offer. */
  | { kind: 'drawCards'; amount: number };

/** A managerial decision card. Costs budget and action points; does its effects. */
export interface ProgramCardDef {
  id: string;
  name: string;
  /** One short line shown on the card. */
  text: string;
  cost: number;
  actions: number;
  effects: Effect[];
}

/** Every card on the table points at content by kind + id. Astronaut cards point at a trait. */
export type CardKind = 'program' | 'part' | 'staff' | 'astronaut';
export interface CardRef {
  kind: CardKind;
  id: string;
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
  actionsPerTurn: number;
  offerSize: number;
  partCardActions: number;
  partCostMultiplier: number;
  staffHireCost: number;
  minorCrisisPerPhase: number;
  marginBase: number;
  marginBoost: number;
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
  recruitCost: number;
  rewardChoices: number;
}

export interface Content {
  parts: PartDef[];
  programCards: ProgramCardDef[];
  milestones: MilestoneDef[];
  missions: MissionDef[];
  traits: TraitDef[];
  events: EventDef[];
  personnel: PersonnelDef[];
  favors: FavorDef[];
  astronautNames: string[];
}

/** An age of spaceflight. Each era is a content pack in src/content/eras/<era>/ and its own campaign. */
export interface EraDef {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  description: string;
}

/** A ruleset = which content + which numbers. Prototype variants are different rulesets. */
export interface Ruleset {
  id: string;
  name: string;
  era: EraDef;
  /** The final milestone. Reaching it wins; the rival reaching it first loses. */
  goalMilestone: string;
  content: Content;
  balance: Balance;
}
