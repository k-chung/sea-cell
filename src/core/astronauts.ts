// Creating astronauts. Names come from content/crew.ts; each gets one random trait.

import type { Ruleset } from '../content/types.ts';
import { pick } from './rng.ts';
import type { Astronaut, GameState } from './state.ts';

/** Recruit an astronaut; `traitId` picks the trait (astronaut cards), otherwise it's random. */
export function recruitAstronaut(s: GameState, r: Ruleset, traitId?: string): Astronaut {
  const used = new Set(s.crew.map((a) => a.name));
  const free = r.content.astronautNames.filter((n) => !used.has(n));
  const name = free.length ? pick(s.rng, free) : `Astronaut ${s.nextCrewNumber}`;
  const astronaut: Astronaut = {
    id: `crew-${s.nextCrewNumber}`,
    name,
    traitId: traitId ?? pick(s.rng, r.content.traits).id,
    flights: 0,
    status: 'ready',
    injuredTurns: 0,
  };
  s.nextCrewNumber += 1;
  s.crew.push(astronaut);
  return astronaut;
}
