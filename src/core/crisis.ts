// Crises: which crisis card appears, which options you get, and the final odds of each option.
// Blue options (with a requirement) are hidden unless you qualify, like FTL.

import type { EventDef, EventOption, FlightPhase, MissionResult, Requirement, Ruleset } from '../content/types.ts';
import type { FlightState, GameState } from './state.ts';
import { getAstronaut, getFavor, getPart, getPersonnel, getTrait, personnelBonus } from './lookup.ts';
import { pick, type RngState } from './rng.ts';

export interface OptionView {
  /** Index into the event's options list (what chooseOption expects). */
  index: number;
  text: string;
  /** Final chance of the success outcome, 0-100. */
  odds: number;
  /** Set for blue options: what unlocked it, e.g. "Test pilot". */
  unlockedBy: string | null;
  /** What the good outcome actually does (an option can "succeed" at aborting safely). */
  bestCase: MissionResult;
}

export function pickCrisisEvent(
  r: Ruleset, rng: RngState, phase: FlightPhase, severity: 'major' | 'minor', crewed: boolean,
): EventDef | null {
  const fits = (e: EventDef) => e.severity === severity && (e.crewed === 'any' || e.crewed === crewed);
  const exact = r.content.events.filter((e) => fits(e) && e.phases !== 'any' && e.phases.includes(phase));
  if (exact.length) return pick(rng, exact);
  const fallback = r.content.events.filter((e) => fits(e) && e.phases === 'any');
  return fallback.length ? pick(rng, fallback) : null;
}

export function requirementMet(s: GameState, r: Ruleset, flight: FlightState, req: Requirement): boolean {
  if ('trait' in req) return flight.crewIds.some((id) => getAstronaut(s, id).traitId === req.trait);
  if ('fuel' in req) {
    return [flight.rocket.booster, flight.rocket.upper, flight.rocket.payload]
      .some((id) => getPart(r, id).fuel === req.fuel);
  }
  if ('personnel' in req) return s.personnel.includes(req.personnel);
  return s.favors.includes(req.favor);
}

export function requirementLabel(r: Ruleset, req: Requirement): string {
  if ('trait' in req) return getTrait(r, req.trait).name;
  if ('fuel' in req) return `${req.fuel} fuel`;
  if ('personnel' in req) return getPersonnel(r, req.personnel).name;
  return getFavor(r, req.favor).name;
}

/** Final odds for an option: base + flight director + crew skills + veterans, clamped. */
export function finalOdds(s: GameState, r: Ruleset, flight: FlightState, option: EventOption): number {
  if (option.odds >= 100) return 100;
  const b = r.balance;
  let odds = option.odds + personnelBonus(s, r, 'crisisOdds');
  const crew = flight.crewIds.map((id) => getAstronaut(s, id));
  const traits = crew.map((a) => getTrait(r, a.traitId));
  if (option.skill) {
    odds += Math.max(0, ...traits.filter((t) => t.skill === option.skill).map((t) => t.skillBonus));
  }
  odds += traits.reduce((sum, t) => sum + (t.allOddsBonus ?? 0), 0);
  if (crew.some((a) => a.flights >= b.veteranFlights)) odds += b.veteranBonus;
  return Math.max(b.oddsFloor, Math.min(odds, b.oddsCeiling));
}

/** The options the player can see for the current crisis. */
export function crisisOptions(s: GameState, r: Ruleset, event: EventDef): OptionView[] {
  const flight = s.flight;
  if (!flight) return [];
  const views: OptionView[] = [];
  event.options.forEach((option, index) => {
    if (option.requires && !requirementMet(s, r, flight, option.requires)) return;
    views.push({
      index,
      text: option.text,
      odds: finalOdds(s, r, flight, option),
      unlockedBy: option.requires ? requirementLabel(r, option.requires) : null,
      bestCase: option.onSuccess.result,
    });
  });
  return views;
}

/** Replace {commander} with the lead astronaut's name. */
export function fillText(s: GameState, flight: FlightState | null, text: string): string {
  const leadId = flight?.crewIds[0];
  const lead = leadId ? getAstronaut(s, leadId).name : 'The crew';
  return text.replaceAll('{commander}', lead);
}
