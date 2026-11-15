// Rocket math: lift, cost, reliability per phase, synergies, and why a launch isn't allowed.
// The UI calls previewLaunch() to show the numbers; launch uses the same function, so what
// you see is exactly what gets rolled.

import type { FlightPhase, MissionDef, Ruleset, Slot } from '../content/types.ts';
import { getAstronaut, getMilestone, getMission, getPart, getPersonnel, personnelBonus } from './lookup.ts';
import type { GameState, RocketChoice } from './state.ts';

/** Which part slot handles each flight phase. */
export const PHASE_SLOT: Record<FlightPhase, Slot> = {
  launch: 'booster',
  orbit: 'upper',
  rendezvous: 'upper',
  transfer: 'upper',
  eva: 'payload',
  landing: 'payload',
  reentry: 'payload',
};

export interface LaunchPlan {
  missionId: string;
  rocket: RocketChoice;
  crewIds: string[];
  testFlight: boolean;
  redundancy: boolean;
}

export interface PhaseOdds {
  phase: FlightPhase;
  partName: string;
  reliability: number;
}

export interface LaunchPreview {
  lift: number;
  liftNeeded: number;
  cost: number;
  phases: PhaseOdds[];
  synergies: string[];
  /** Empty = good to launch. Otherwise, plain-English reasons it can't launch. */
  problems: string[];
}

/** A part's reliability before mission-specific bonuses: base + flight experience + personnel. */
export function partReliability(s: GameState, r: Ruleset, partId: string): number {
  const part = getPart(r, partId);
  const flights = s.partFlights[partId] ?? 0;
  const experience = Math.min(flights * r.balance.reliabilityPerFlight, r.balance.maxFlightBonus);
  const staff =
    part.slot === 'booster'
      ? personnelBonus(s, r, 'boosterReliability')
      : part.slot === 'upper'
        ? personnelBonus(s, r, 'upperReliability')
        : personnelBonus(s, r, 'payloadReliability');
  return part.reliability + experience + staff;
}

export function testFlightCost(s: GameState, r: Ruleset): number {
  const multiplier = s.personnel.reduce((m, id) => m * (getPersonnel(r, id).testFlightCostMultiplier ?? 1), 1);
  return Math.round(r.balance.testFlightCost * multiplier);
}

/** Is a mission flyable (requirements met)? Already-reached missions can be flown again. */
export function missionStatus(
  s: GameState,
  r: Ruleset,
  mission: MissionDef,
): { status: 'done' | 'available' | 'locked'; missing: string[] } {
  if (s.milestones[mission.milestone] !== undefined) return { status: 'done', missing: [] };
  const missing = mission.requires.filter((id) => s.milestones[id] === undefined).map((id) => getMilestone(r, id).name);
  return { status: missing.length ? 'locked' : 'available', missing };
}

export function previewLaunch(s: GameState, r: Ruleset, plan: LaunchPlan): LaunchPreview {
  const b = r.balance;
  const mission = getMission(r, plan.missionId);
  const problems: string[] = [];

  const status = missionStatus(s, r, mission);
  if (status.status === 'locked') problems.push(`Needs first: ${status.missing.join(', ')}`);

  // Parts must be in the current hand and in the right slot.
  const booster = getPart(r, plan.rocket.booster);
  const upper = getPart(r, plan.rocket.upper);
  const payload = getPart(r, plan.rocket.payload);
  for (const [part, slot] of [
    [booster, 'booster'],
    [upper, 'upper'],
    [payload, 'payload'],
  ] as const) {
    if (part.slot !== slot) problems.push(`${part.name} is not a ${slot}`);
    if (!s.hand.includes(part.id)) problems.push(`${part.name} is not in your hand this turn`);
  }

  const lift = booster.lift + upper.lift;
  if (lift < mission.liftNeeded) problems.push(`Not enough lift: ${lift} of ${mission.liftNeeded}`);
  if (!payload.payloadKind || !mission.payloadKinds.includes(payload.payloadKind)) {
    problems.push(`${payload.name} can't fly this mission`);
  }

  // Crew.
  if (mission.crewNeeded > 0 && (payload.crewSeats ?? 0) < mission.crewNeeded) {
    problems.push(`${payload.name} has ${payload.crewSeats ?? 0} seats; mission needs ${mission.crewNeeded}`);
  }
  if (plan.crewIds.length !== mission.crewNeeded) {
    problems.push(`Pick ${mission.crewNeeded} astronaut(s); ${plan.crewIds.length} picked`);
  }
  if (new Set(plan.crewIds).size !== plan.crewIds.length) problems.push('Same astronaut picked twice');
  for (const id of plan.crewIds) {
    const a = s.crew.find((c) => c.id === id);
    if (!a) problems.push(`Unknown astronaut ${id}`);
    else if (a.status !== 'ready') problems.push(`${a.name} is ${a.status}`);
  }

  // Cost.
  const cost =
    booster.cost +
    upper.cost +
    payload.cost +
    (plan.testFlight ? testFlightCost(s, r) : 0) +
    (plan.redundancy ? b.redundancyCost : 0);
  if (cost > s.budget) problems.push(`Costs ${cost}, budget is ${s.budget}`);

  // Synergies.
  const synergies: string[] = [];
  const sameFuel = booster.fuel === upper.fuel && booster.fuel !== 'none';
  if (sameFuel) synergies.push(`Same fuel (${booster.fuel}): +${b.sameFuelBonus}% booster and upper stage`);
  const margin = lift >= mission.liftNeeded + b.liftMarginForBonus;
  if (margin) synergies.push(`Lift margin: +${b.liftMarginBonus}% launch`);

  // Reliability per phase.
  const phases: PhaseOdds[] = mission.phases.map((phase) => {
    const slot = PHASE_SLOT[phase];
    const part = slot === 'booster' ? booster : slot === 'upper' ? upper : payload;
    let rel = partReliability(s, r, part.id);
    if (sameFuel && slot !== 'payload') rel += b.sameFuelBonus;
    if (phase === 'launch' && margin) rel += b.liftMarginBonus;
    if (phase === 'launch' && plan.testFlight) rel += b.testFlightBonus;
    return { phase, partName: part.name, reliability: Math.max(1, Math.min(rel, b.reliabilityCap)) };
  });

  return { lift, liftNeeded: mission.liftNeeded, cost, phases, synergies, problems };
}

/** Names of the crew for a flight, in order (first = commander). */
export function crewNames(s: GameState, ids: string[]): string[] {
  return ids.map((id) => getAstronaut(s, id).name);
}
