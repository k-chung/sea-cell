// Flying a mission: roll each phase, trigger at most one crisis, then apply the result.
//
// How a flight goes:
// 1. Each phase rolls against its reliability (shown in the rocket preview).
//    Redundancy re-rolls the first failure once.
// 2. The first failed phase triggers a MAJOR crisis. The crisis decides the mission;
//    later phases are not rolled (the crisis is the drama).
// 3. If every phase passed, there's still a chance of a MINOR crisis (an anomaly).
// 4. No crisis = clean success.

import type { FlightPhase, MissionResult, Ruleset } from '../content/types.ts';
import type { Action } from './actions.ts';
import type { GameState } from './state.ts';
import { crewNames, previewLaunch } from './rocket.ts';
import { crisisOptions, fillText, finalOdds, pickCrisisEvent } from './crisis.ts';
import { getAstronaut, getEvent, getMilestone, getMission, getPart, getTrait } from './lookup.ts';
import { pick, rollPercent } from './rng.ts';
import { endTurn } from './turn.ts';

type LaunchAction = Extract<Action, { type: 'launch' }>;

const label = (phase: string) => (phase[0] ?? '').toUpperCase() + phase.slice(1);

export function launch(s: GameState, r: Ruleset, a: LaunchAction): void {
  const preview = previewLaunch(s, r, a);
  if (preview.problems.length) throw new Error(`Cannot launch: ${preview.problems.join('; ')}`);

  const mission = getMission(r, a.missionId);
  const crewed = mission.crewNeeded > 0;
  s.budget -= preview.cost;
  s.launchedThisTurn = true;

  const rocketName = [a.rocket.booster, a.rocket.upper, a.rocket.payload].map((id) => getPart(r, id).name).join(' / ');
  const lines = [`${mission.name} launches on ${rocketName}.`];
  if (crewed) lines.push(`Crew: ${crewNames(s, a.crewIds).join(', ')}.`);
  s.flight = {
    missionId: a.missionId, rocket: a.rocket, crewIds: a.crewIds,
    testFlight: a.testFlight, redundancy: a.redundancy, lines, crisis: null,
  };

  // 1-2. Roll each phase until something fails.
  let backupAvailable = a.redundancy;
  let failedPhase: FlightPhase | null = null;
  for (const p of preview.phases) {
    let ok = rollPercent(s.rng, p.reliability);
    if (!ok && backupAvailable) {
      backupAvailable = false;
      lines.push(`${label(p.phase)}: fault! Redundant systems take over...`);
      ok = rollPercent(s.rng, p.reliability);
    }
    if (!ok) {
      failedPhase = p.phase;
      break;
    }
    lines.push(`${label(p.phase)}: nominal (${p.reliability}%).`);
  }

  // Pick the crisis (if any).
  let eventId: string | null = null;
  let crisisPhase: FlightPhase | null = null;
  if (failedPhase) {
    crisisPhase = failedPhase;
    eventId = pickCrisisEvent(r, s.rng, failedPhase, 'major', crewed)?.id ?? null;
  } else if (rollPercent(s.rng, r.balance.minorCrisisChance * 100)) {
    const phase = pick(s.rng, mission.phases);
    crisisPhase = phase;
    eventId = pickCrisisEvent(r, s.rng, phase, 'minor', crewed)?.id ?? null;
  }

  // Dev: a forced event replaces whatever was picked.
  if (s.forcedEventId) {
    const forced = getEvent(r, s.forcedEventId);
    eventId = forced.id;
    crisisPhase = forced.phases === 'any'
      ? (mission.phases[0] ?? 'launch')
      : (mission.phases.find((p) => forced.phases.includes(p)) ?? mission.phases[0] ?? 'launch');
    s.forcedEventId = null;
  }

  if (eventId && crisisPhase) {
    const event = getEvent(r, eventId);
    lines.push(`${label(crisisPhase)}: CRISIS: ${event.title}.`);
    s.flight.crisis = { eventId, phase: crisisPhase };
    s.phase = 'crisis';
    return;
  }
  if (failedPhase) {
    // A failure with no matching crisis card: the flight simply fails.
    lines.push(`${label(failedPhase)}: failure.`);
    return resolveMission(s, r, crewed ? 'abort' : 'lost');
  }
  resolveMission(s, r, 'success');
}

export function chooseOption(s: GameState, r: Ruleset, index: number): void {
  const flight = s.flight;
  if (!flight?.crisis) throw new Error('No crisis to answer');
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
  resolveMission(s, r, outcome.result);
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
      lines.push(rivalFirst
        ? `SUCCESS: ${milestone.name}, but the Soviets did it first. (+${gainPublic} public, +${gainCongress} Congress, +${gainPrestige} prestige)`
        : `WORLD FIRST: ${milestone.name}! (+${gainPublic} public, +${gainCongress} Congress, +${gainPrestige} prestige)`);
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
    lines.push(`VEHICLE LOST.${crew.length ? ' The crew survived.' : ''} (${b.lostPublic} public, ${b.lostCongress} Congress)`);
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
    lines.push(s.options.storyMode
      ? `DISASTER. Story mode: the crew survive, badly injured (out for ${b.injuryTurns} turns). (${b.disasterPublic} public, ${b.disasterCongress} Congress)`
      : `DISASTER. We lost ${crew.map((a) => a.name).join(', ')}. (${b.disasterPublic} public, ${b.disasterCongress} Congress)`);
  }

  s.flight = null;
  endTurn(s, r, lines);
}
