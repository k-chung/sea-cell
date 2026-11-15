// Flying a mission, phase by phase (Module 2).
//
// 1. Launch pays for the rocket and fixes each phase's odds (the preview numbers).
// 2. For the current phase the player may spend margin (+marginBoost%) or a crew ability (+bonus%, once
//    per flight per astronaut), then proceeds. If there's nothing to spend, the phase rolls on its own.
// 3. A failed roll (after one redundancy re-roll) brings a MAJOR crisis for that phase. A phase that rolls
//    fine can still bring a MINOR anomaly. Surviving a crisis continues the flight; abort/lost/disaster end it.
// 4. Passing every phase = mission success.

import type { CrewAbility, FlightPhase, MissionResult, Ruleset } from '../content/types.ts';
import type { Action } from './actions.ts';
import { crisisOptions, fillText, finalOdds, pickCrisisEvent } from './crisis.ts';
import { getAstronaut, getEvent, getMilestone, getMission, getPart, getTrait } from './lookup.ts';
import { rollPercent } from './rng.ts';
import { crewNames, previewLaunch } from './rocket.ts';
import type { FlightState, GameState } from './state.ts';
import { endTurn } from './turn.ts';

type LaunchAction = Extract<Action, { type: 'launch' }>;

const label = (phase: string) => (phase[0] ?? '').toUpperCase() + phase.slice(1);

function activeFlight(s: GameState): FlightState {
  if (!s.flight) throw new Error('No flight in progress');
  return s.flight;
}

/** The phase being flown right now. */
export function currentPhase(s: GameState, r: Ruleset): FlightPhase {
  const flight = activeFlight(s);
  const phase = getMission(r, flight.missionId).phases[flight.phaseIndex];
  if (!phase) throw new Error(`Flight has no phase ${flight.phaseIndex}`);
  return phase;
}

/** Odds of the current phase, including margin and abilities spent on it. */
export function currentOdds(s: GameState): number {
  const flight = activeFlight(s);
  return Math.min(99, (flight.phaseOdds[flight.phaseIndex] ?? 0) + flight.boost);
}

export interface AbilityView {
  crewId: string;
  crewName: string;
  ability: CrewAbility;
}

/** Crew abilities that could be used on the current phase. */
export function usableAbilities(s: GameState, r: Ruleset): AbilityView[] {
  const flight = activeFlight(s);
  const phase = currentPhase(s, r);
  return flight.crewIds.flatMap((id) => {
    const a = getAstronaut(s, id);
    const ability = getTrait(r, a.traitId).ability;
    const fits = ability && (ability.phases === 'any' || ability.phases.includes(phase));
    return ability && fits && !flight.usedAbilities.includes(id) ? [{ crewId: id, crewName: a.name, ability }] : [];
  });
}

/** Is there anything to decide on this phase? If not, it rolls on its own (fewer taps). */
function hasChoice(s: GameState, r: Ruleset): boolean {
  return activeFlight(s).margin > 0 || usableAbilities(s, r).length > 0;
}

export function launch(s: GameState, r: Ruleset, a: LaunchAction): void {
  const preview = previewLaunch(s, r, a);
  if (preview.problems.length) throw new Error(`Cannot launch: ${preview.problems.join('; ')}`);
  const b = r.balance;
  const mission = getMission(r, a.missionId);
  s.budget -= preview.cost;
  s.launchedThisTurn = true;
  s.nextLaunchBonus = 0; // card bonuses apply to one launch (already in the preview odds)

  const rocketName = [a.rocket.booster, a.rocket.upper, a.rocket.payload].map((id) => getPart(r, id).name).join(' / ');
  const lines = [`${mission.name} launches on ${rocketName}.`];
  if (mission.crewNeeded > 0) lines.push(`Crew: ${crewNames(s, a.crewIds).join(', ')}.`);
  const spareLift = preview.lift >= preview.liftNeeded + b.liftMarginForBonus;
  s.flight = {
    missionId: a.missionId,
    rocket: a.rocket,
    crewIds: a.crewIds,
    testFlight: a.testFlight,
    redundancy: a.redundancy,
    lines,
    phaseOdds: preview.phases.map((p) => p.reliability),
    phaseIndex: 0,
    boost: 0,
    margin: b.marginBase + (spareLift ? 1 : 0),
    usedAbilities: [],
    backupAvailable: a.redundancy,
    crisis: null,
  };
  s.phase = 'flight';
  autoFly(s, r);
}

export function spendMargin(s: GameState, r: Ruleset): void {
  const flight = activeFlight(s);
  if (flight.margin <= 0) throw new Error('No margin left');
  flight.margin -= 1;
  flight.boost += r.balance.marginBoost;
}

export function useAbility(s: GameState, r: Ruleset, crewId: string): void {
  const flight = activeFlight(s);
  const view = usableAbilities(s, r).find((v) => v.crewId === crewId);
  if (!view) throw new Error('That astronaut has no ability to use on this phase');
  flight.usedAbilities.push(crewId);
  flight.boost += view.ability.bonus;
  flight.lines.push(`${view.crewName}: ${view.ability.name} (+${view.ability.bonus}%).`);
}

/** Roll the current phase, then keep flying until the next real choice. */
export function proceed(s: GameState, r: Ruleset): void {
  rollPhase(s, r);
  if (s.phase === 'flight') autoFly(s, r);
}

/** Roll phases that have nothing to decide. Stops at a choice, a crisis, or the end of the flight. */
function autoFly(s: GameState, r: Ruleset): void {
  while (s.phase === 'flight' && !hasChoice(s, r)) rollPhase(s, r);
}

function rollPhase(s: GameState, r: Ruleset): void {
  const flight = activeFlight(s);
  const mission = getMission(r, flight.missionId);
  const phase = currentPhase(s, r);
  const crewed = mission.crewNeeded > 0;
  const odds = currentOdds(s);

  // Dev: a forced event fires in the first phase it fits.
  if (s.forcedEventId) {
    const forced = getEvent(r, s.forcedEventId);
    if (forced.phases === 'any' || forced.phases.includes(phase)) {
      s.forcedEventId = null;
      startCrisis(s, r, phase, forced.id);
      return;
    }
  }

  let ok = rollPercent(s.rng, odds);
  if (!ok && flight.backupAvailable) {
    flight.backupAvailable = false;
    flight.lines.push(`${label(phase)}: fault! Redundant systems take over...`);
    ok = rollPercent(s.rng, odds);
  }
  if (!ok) {
    const event = pickCrisisEvent(r, s.rng, phase, 'major', crewed);
    if (event) {
      startCrisis(s, r, phase, event.id);
      return;
    }
    flight.lines.push(`${label(phase)}: failure.`);
    resolveMission(s, r, crewed ? 'abort' : 'lost');
    return;
  }
  flight.lines.push(`${label(phase)}: nominal (${odds}%).`);
  if (rollPercent(s.rng, r.balance.minorCrisisPerPhase * 100)) {
    const event = pickCrisisEvent(r, s.rng, phase, 'minor', crewed);
    if (event) {
      startCrisis(s, r, phase, event.id);
      return;
    }
  }
  nextPhase(s, r);
}

function startCrisis(s: GameState, r: Ruleset, phase: FlightPhase, eventId: string): void {
  const flight = activeFlight(s);
  flight.lines.push(`${label(phase)}: CRISIS: ${getEvent(r, eventId).title}.`);
  flight.crisis = { eventId, phase };
  s.phase = 'crisis';
}

function nextPhase(s: GameState, r: Ruleset): void {
  const flight = activeFlight(s);
  flight.phaseIndex += 1;
  flight.boost = 0;
  if (flight.phaseIndex >= flight.phaseOdds.length) resolveMission(s, r, 'success');
  else s.phase = 'flight';
}

export function chooseOption(s: GameState, r: Ruleset, index: number): void {
  const flight = activeFlight(s);
  if (!flight.crisis) throw new Error('No crisis to answer');
  const event = getEvent(r, flight.crisis.eventId);
  const visible = crisisOptions(s, r, event).some((o) => o.index === index);
  const option = event.options[index];
  if (!option || !visible) throw new Error(`Option ${index} is not available for "${event.title}"`);

  const odds = finalOdds(s, r, flight, option);
  const success = odds >= 100 || rollPercent(s.rng, odds);
  const outcome = success ? option.onSuccess : (option.onFailure ?? option.onSuccess);
  if (option.requires && 'favor' in option.requires) {
    const favorId = option.requires.favor;
    s.favors = s.favors.filter((f) => f !== favorId); // favors are used up
  }

  flight.lines.push(`Your call: "${option.text}" (${odds}%): ${success ? 'it works' : 'it fails'}.`);
  flight.lines.push(fillText(s, flight, outcome.text));
  s.public += outcome.public ?? 0;
  s.congress += outcome.congress ?? 0;
  s.budget += outcome.budget ?? 0;
  s.prestige += outcome.prestige ?? 0;
  flight.crisis = null;
  // Surviving a crisis continues the flight; anything else ends it.
  if (outcome.result !== 'success') {
    resolveMission(s, r, outcome.result);
    return;
  }
  nextPhase(s, r);
  if (s.phase === 'flight') autoFly(s, r);
}

/** Apply the consequences of a finished mission, then end the turn. */
export function resolveMission(s: GameState, r: Ruleset, result: MissionResult): void {
  const flight = s.flight;
  if (!flight) throw new Error('resolveMission called with no flight');
  const b = r.balance;
  const mission = getMission(r, flight.missionId);
  const crew = flight.crewIds.map((id) => getAstronaut(s, id));
  const lines = [...flight.lines];
  s.lastResult = result;

  if (result === 'success') {
    for (const id of [flight.rocket.booster, flight.rocket.upper, flight.rocket.payload]) {
      s.partFlights[id] = (s.partFlights[id] ?? 0) + 1;
    }
    for (const a of crew) a.flights += 1;
    const milestone = getMilestone(r, mission.milestone);

    if (s.milestones[milestone.id] === undefined) {
      const rivalFirst = s.rival.milestones[milestone.id] !== undefined;
      const mult = rivalFirst ? b.rivalFirstMultiplier : 1;
      const gainPublic = Math.round(b.firstPublic * mult);
      const gainCongress = Math.round(b.firstCongress * mult);
      const gainPrestige = Math.round(mission.prestige * mult);
      s.milestones[milestone.id] = s.turn;
      s.public += gainPublic;
      s.congress += gainCongress;
      s.prestige += gainPrestige;
      s.rewardPending = true;
      lines.push(
        rivalFirst
          ? `SUCCESS: ${milestone.name}, but the Soviets did it first. (+${gainPublic} public, +${gainCongress} Congress, +${gainPrestige} prestige)`
          : `WORLD FIRST: ${milestone.name}! (+${gainPublic} public, +${gainCongress} Congress, +${gainPrestige} prestige)`,
      );
    } else {
      s.public += b.repeatPublic;
      lines.push(`SUCCESS. Another flight in the books; parts and crew gain experience. (+${b.repeatPublic} public)`);
    }
    const charm = crew.reduce((sum, a) => sum + (getTrait(r, a.traitId).successPublic ?? 0), 0);
    if (charm) {
      s.public += charm;
      lines.push(`The press loves the crew (+${charm} public).`);
    }
  }

  if (result === 'abort') {
    for (const a of crew) a.flights += 1;
    s.public += b.abortPublic;
    lines.push(`ABORTED. Objective not reached. (${b.abortPublic} public)`);
  }

  if (result === 'lost') {
    s.public += b.lostPublic;
    s.congress += b.lostCongress;
    lines.push(
      `VEHICLE LOST.${crew.length ? ' The crew survived.' : ''} (${b.lostPublic} public, ${b.lostCongress} Congress)`,
    );
  }

  if (result === 'disaster') {
    s.public += b.disasterPublic;
    s.congress += b.disasterCongress;
    for (const a of crew) {
      if (s.options.storyMode) {
        a.status = 'injured';
        a.injuredTurns = b.injuryTurns;
      } else {
        a.status = 'dead';
        s.fallen.push({ name: a.name, mission: mission.name, turn: s.turn });
      }
    }
    lines.push(
      s.options.storyMode
        ? `DISASTER. Story mode: the crew survive, badly injured (out for ${b.injuryTurns} turns). (${b.disasterPublic} public, ${b.disasterCongress} Congress)`
        : `DISASTER. We lost ${crew.map((a) => a.name).join(', ')}. (${b.disasterPublic} public, ${b.disasterCongress} Congress)`,
    );
  }

  s.flight = null;
  endTurn(s, r, lines);
}
