// Find content by id. Unknown ids throw a clear error naming what was missing,
// so typos in content files are caught immediately.

import type {
  EventDef, FavorDef, MilestoneDef, MissionDef, PartDef, PersonnelDef, Ruleset, TraitDef,
} from '../content/types.ts';
import type { Astronaut, GameState } from './state.ts';

function find<T extends { id: string }>(list: T[], id: string, what: string): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error(`Unknown ${what} id "${id}"`);
  return item;
}

export const getPart = (r: Ruleset, id: string): PartDef => find(r.content.parts, id, 'part');
export const getMission = (r: Ruleset, id: string): MissionDef => find(r.content.missions, id, 'mission');
export const getMilestone = (r: Ruleset, id: string): MilestoneDef => find(r.content.milestones, id, 'milestone');
export const getTrait = (r: Ruleset, id: string): TraitDef => find(r.content.traits, id, 'trait');
export const getEvent = (r: Ruleset, id: string): EventDef => find(r.content.events, id, 'event');
export const getPersonnel = (r: Ruleset, id: string): PersonnelDef => find(r.content.personnel, id, 'personnel');
export const getFavor = (r: Ruleset, id: string): FavorDef => find(r.content.favors, id, 'favor');
export const getAstronaut = (s: GameState, id: string): Astronaut => find(s.crew, id, 'astronaut');

/** Sum one numeric bonus field across all personnel the player has hired. */
export function personnelBonus(
  s: GameState,
  r: Ruleset,
  field: 'boosterReliability' | 'upperReliability' | 'payloadReliability' | 'crisisOdds' | 'income',
): number {
  return s.personnel.reduce((sum, id) => sum + (getPersonnel(r, id)[field] ?? 0), 0);
}
